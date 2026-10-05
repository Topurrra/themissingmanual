// Pluggable runtime adapters for runnable code blocks.
//
// Each adapter implements a small interface so new languages can be added
// without touching the widget. The widget never imports a runtime directly -
// it asks `getAdapter(lang)` and talks to the returned object.
//
//   interface RunResult {
//     logs?:    string;          // captured stdout / console output
//     error?:   string;          // a thrown error / traceback (shown as stderr)
//     result?:  string;          // a return value / last-expression value
//     table?:   { columns: string[], rows: any[][] };  // structured (SQL) output
//     preview?: string;          // HTML to render in a sandboxed frame (HTML/CSS)
//   }
//
//   interface Adapter {
//     label:    string;                       // human name for the runtime
//     cmLang(): Promise<Extension|null>;       // lazy CodeMirror language mode
//     load(onStatus): Promise<void>;           // lazy-load + init the runtime (cached)
//     run(code, { signal }): Promise<RunResult>;
//     dispose():       void;                   // tear down workers / handles
//   }
//
// Adapters are memoised per language per page so the heavy runtime initialises
// once and subsequent runs are instant. `getAdapter` returns the same instance.
//
// Loading the big WASM runtimes (Pyodide, sql.js) is done from the jsDelivr CDN
// inside dedicated workers - they're multiple MB and must stay out
// of our bundle entirely. CodeMirror language modes come from npm via dynamic
// import() so Vite code-splits them into lazy chunks.

// The JS worker module, imported with ?worker so Vite emits a dedicated chunk.
// Because this adapters module is itself only ever dynamically imported, the
// worker chunk never lands in the main entry either.
import JsWorker from './js-worker.js?worker';
import WasmWorker from './wasm-worker.js?worker';
import { RuntimeAdapter } from './runtime-adapter.js';
import { TypeScriptAdapter } from './typescript-adapter.js';
import { PGliteAdapter } from './pglite-adapter.js';
import { WatAdapter } from './wat-adapter.js';
import { MathAdapter } from './math-adapter.js';

// ---------------------------------------------------------------------------
// JavaScript - sandboxed Web Worker (eval, captured console, hard timeout).
// ---------------------------------------------------------------------------
class JsAdapter {
  label = 'JavaScript';
  timeoutMs = 5000;
  #active = new Set();
  #seq = 0;

  async cmLang() {
    const { javascript } = await import('@codemirror/lang-javascript');
    return javascript();
  }

  // Each run owns a short-lived worker. Loading has no network/runtime work.
  async load() {}

  run(code, { signal } = {}) {
    return new Promise((resolve) => {
      const failure = (text) => ({ error: text, errorMessage: text });
      if (signal?.aborted) return resolve(failure('Execution cancelled.'));
      let worker;
      let channel;
      try {
        worker = new JsWorker();
        channel = new MessageChannel();
      } catch (err) {
        worker?.terminate();
        return resolve(failure(err.message || 'Could not start execution worker.'));
      }
      const id = ++this.#seq;
      let done = false;
      const finish = (result) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        signal?.removeEventListener('abort', cancel);
        this.#active.delete(cancel);
        worker.onmessage = worker.onerror = worker.onmessageerror = null;
        channel.port1.onmessage = channel.port1.onmessageerror = null;
        channel.port1.close();
        channel.port2.close();
        worker.terminate();
        resolve(result);
      };
      const cancel = () => finish(failure('Execution cancelled.'));
      const timer = setTimeout(() => finish(failure(
        `Execution timed out after ${this.timeoutMs / 1000}s (terminated).`
      )), this.timeoutMs);
      this.#active.add(cancel);
      signal?.addEventListener('abort', cancel, { once: true });

      // User code can call the worker's global postMessage. Runtime replies use
      // a private port held inside the execution handler's lexical scope.
      channel.port1.onmessage = (e) => {
        if (done || !e.data || e.data.__id !== id) return;
        const { ok, logs, result, error, errorMessage } = e.data;
        if (typeof ok !== 'boolean' || !Array.isArray(logs) || logs.some((l) => typeof l?.text !== 'string') ||
          (result !== undefined && typeof result !== 'string') ||
          (!ok && (typeof error !== 'string' || !error || typeof errorMessage !== 'string'))) {
          return finish(failure('Invalid execution worker response.'));
        }
        const out = (logs || []).map((l) => l.text).join('\n');
        if (ok) finish({ logs: out, result });
        else finish({ logs: out, error, errorMessage });
      };
      worker.onerror = (e) => {
        e.preventDefault?.();
        finish(failure(e.message || 'Worker error'));
      };
      worker.onmessageerror = () => finish(failure('Could not read execution worker response.'));
      channel.port1.onmessageerror = worker.onmessageerror;
      try {
        worker.postMessage({ code, __id: id }, [channel.port2]);
      } catch (err) {
        finish(failure(err.message || 'Could not send code to execution worker.'));
      }
    });
  }

  dispose() {
    for (const cancel of this.#active) cancel();
  }
}

// ---------------------------------------------------------------------------
// Python - Pyodide (CPython in WASM) from CDN. stdout + tracebacks captured.
// ---------------------------------------------------------------------------
class PythonAdapter extends RuntimeAdapter {
  constructor() { super('python', () => new WasmWorker()); }
}

// ---------------------------------------------------------------------------
// HTML/CSS - there is no runtime to load and nothing to execute. "Running" a page
// just means handing the markup to a sandboxed frame to render, so `run` returns
// the source unchanged as `preview` and the widget does the rest. Grading is a
// separate path (practice/dom-grader.js) that renders it again offscreen at a
// fixed size and reads back computed styles.
class HtmlAdapter {
  label = 'HTML';

  async cmLang() {
    // lang-html brings CSS (and JS) highlighting with it for embedded <style>.
    const { html } = await import('@codemirror/lang-html');
    return html();
  }

  async load() {}

  async run(code) {
    return { preview: code };
  }

  dispose() {}
}

// ---------------------------------------------------------------------------
// SQL - sql.js (SQLite in WASM) from CDN, seeded with a small sample DB.
// ---------------------------------------------------------------------------
class SqlAdapter extends RuntimeAdapter {
  constructor() { super('sql', () => new WasmWorker()); }
}

// ---------------------------------------------------------------------------
// Unsupported language - degrade gracefully (editor shows, Run disabled).
// ---------------------------------------------------------------------------
class UnsupportedAdapter {
  constructor(lang) {
    this.lang = lang;
    this.label = lang;
    this.unsupported = true;
  }
  async cmLang() {
    return null; // plain text editor, no highlighting
  }
  async load() {}
  async run() {
    return { error: `Running ${this.lang} isn't supported yet.` };
  }
  dispose() {}
}

// --- registry -------------------------------------------------------------
// Language aliases → adapter factory. TypeScript strips types via Sucrase then
// runs on the same JS worker (see typescript-adapter.js); go/rust are
// intentionally absent so they degrade to the "not supported yet" path until a
// playground embed lands. Git lessons don't go through this registry at all -
// see $lib/practice/git/runtime.js, wired directly from runners.js instead
// (a command-script + repo-state grading shape, not a single function run).
const FACTORIES = {
  javascript: () => new JsAdapter(),
  js: () => new JsAdapter(),
  python: () => new PythonAdapter(),
  sql: () => new SqlAdapter(),
  typescript: () => new TypeScriptAdapter(),
  ts: () => new TypeScriptAdapter(),
  postgres: () => new PGliteAdapter(),
  wat: () => new WatAdapter(),
  math: () => new MathAdapter(),
  html: () => new HtmlAdapter(),
  css: () => new HtmlAdapter()
};

// One adapter instance per language, shared across all blocks on the page so
// the runtime initialises once. Cleared on disposeAll() at phase navigation.
const instances = new Map();

export function getAdapter(rawLang) {
  const normalized = (rawLang || '').toLowerCase();
  const lang = normalized === 'py' ? 'python' : normalized;
  if (instances.has(lang)) return instances.get(lang);
  const make = FACTORIES[lang];
  const adapter = make ? make() : new UnsupportedAdapter(rawLang || 'unknown');
  instances.set(lang, adapter);
  return adapter;
}

export function disposeAll() {
  for (const a of instances.values()) {
    try {
      a.dispose();
    } catch (e) {
      /* ignore */
    }
  }
  instances.clear();
}
