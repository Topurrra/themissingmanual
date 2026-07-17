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
// via dynamic <script>/import injection - they're multiple MB and must stay out
// of our bundle entirely. CodeMirror language modes come from npm via dynamic
// import() so Vite code-splits them into lazy chunks.

// --- CDN versions (pin so a CDN re-publish can't silently change behaviour) ---
const PYODIDE_VERSION = '0.26.4';
const SQLJS_VERSION = '1.12.0';
const PYODIDE_CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full`;
const SQLJS_CDN = `https://cdn.jsdelivr.net/npm/sql.js@${SQLJS_VERSION}/dist`;

// The JS worker module, imported with ?worker so Vite emits a dedicated chunk.
// Because this adapters module is itself only ever dynamically imported, the
// worker chunk never lands in the main entry either.
import JsWorker from './js-worker.js?worker';
import { TypeScriptAdapter } from './typescript-adapter.js';
import { PGliteAdapter } from './pglite-adapter.js';
import { WatAdapter } from './wat-adapter.js';
import { MathAdapter } from './math-adapter.js';

// Load an external script tag once; resolve when it's on `window`.
const scriptCache = new Map();
function loadScript(src) {
  if (scriptCache.has(src)) return scriptCache.get(src);
  const p = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
  scriptCache.set(src, p);
  return p;
}

// ---------------------------------------------------------------------------
// JavaScript - sandboxed Web Worker (eval, captured console, hard timeout).
// ---------------------------------------------------------------------------
class JsAdapter {
  label = 'JavaScript';
  timeoutMs = 5000;
  #worker = null;
  #seq = 0;

  async cmLang() {
    const { javascript } = await import('@codemirror/lang-javascript');
    return javascript();
  }

  // The worker is cheap; we (re)create it lazily and reuse it. `load` only
  // needs to exist so the widget can show a uniform loading state - for JS it
  // resolves immediately (no MB-scale download).
  async load() {
    if (!this.#worker) this.#spawn();
  }

  #spawn() {
    // Vite bundles js-worker.js as a separate worker chunk via ?worker.
    this.#worker = new JsWorker();
  }

  run(code) {
    return new Promise((resolve) => {
      if (!this.#worker) this.#spawn();
      const worker = this.#worker;
      const id = ++this.#seq;
      let done = false;

      // Runaway-loop guard: terminate the worker, respawn a fresh one for next run.
      const timer = setTimeout(() => {
        if (done) return;
        done = true;
        worker.terminate();
        this.#worker = null;
        const text = `Execution timed out after ${this.timeoutMs / 1000}s (terminated).`;
        resolve({ error: text, errorMessage: text });
      }, this.timeoutMs);

      worker.onmessage = (e) => {
        if (done || !e.data || e.data.__id !== id) return;
        done = true;
        clearTimeout(timer);
        const { ok, logs, result, error, errorMessage } = e.data;
        const out = (logs || []).map((l) => l.text).join('\n');
        if (ok) resolve({ logs: out, result });
        else resolve({ logs: out, error, errorMessage });
      };
      worker.onerror = (e) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        const text = e.message || 'Worker error';
        resolve({ error: text, errorMessage: text });
      };

      worker.postMessage({ code, __id: id });
    });
  }

  dispose() {
    if (this.#worker) {
      this.#worker.terminate();
      this.#worker = null;
    }
  }
}

// ---------------------------------------------------------------------------
// Python - Pyodide (CPython in WASM) from CDN. stdout + tracebacks captured.
// ---------------------------------------------------------------------------
class PythonAdapter {
  label = 'Python';
  #pyodide = null;
  #loading = null;

  async cmLang() {
    const { python } = await import('@codemirror/lang-python');
    return python();
  }

  async load(onStatus) {
    if (this.#pyodide) return;
    if (this.#loading) return this.#loading;
    this.#loading = (async () => {
      onStatus && onStatus('Downloading Python runtime (~10 MB, first run only)…');
      await loadScript(`${PYODIDE_CDN}/pyodide.js`);
      onStatus && onStatus('Starting Python…');
      // globalThis.loadPyodide is provided by the CDN script.
      this.#pyodide = await globalThis.loadPyodide({ indexURL: `${PYODIDE_CDN}/` });
    })();
    await this.#loading;
  }

  async run(code, opts = {}) {
    if (!this.#pyodide) return { error: 'Python runtime not loaded.' };
    const py = this.#pyodide;
    const { onStatus } = opts;
    // Pyodide ships only the stdlib; scan the code's imports and pull any bundled
    // packages (pandas, numpy, micropip, …) on demand before running. Without this,
    // `import pandas` fails with ModuleNotFoundError. Unknown imports are ignored
    // here (Pyodide just skips them) and surface as a clean traceback at runtime.
    try {
      onStatus && onStatus('Loading packages…');
      await py.loadPackagesFromImports(code);
    } catch (err) {
      // A package failing to download shouldn't crash the widget - report it cleanly.
      return { error: `Could not load required packages: ${String(err.message || err)}` };
    } finally {
      onStatus && onStatus('');
    }
    // Capture stdout + stderr by redirecting Python's streams to a buffer.
    let captured = '';
    py.setStdout({ batched: (s) => (captured += s + '\n') });
    py.setStderr({ batched: (s) => (captured += s + '\n') });
    try {
      const result = await py.runPythonAsync(code);
      let resultText;
      if (result !== undefined && result !== null) resultText = String(result);
      return { logs: captured.replace(/\n$/, ''), result: resultText };
    } catch (err) {
      // Pyodide surfaces Python tracebacks as the error message.
      return { logs: captured.replace(/\n$/, ''), error: String(err.message || err) };
    }
  }

  dispose() {
    // Pyodide has no clean teardown; drop our reference so GC can reclaim it.
    // (The widget also stops referencing the adapter on phase nav.)
    this.#pyodide = null;
    this.#loading = null;
  }
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
const SEED_SQL = `
CREATE TABLE authors (id INTEGER PRIMARY KEY, name TEXT, country TEXT);
INSERT INTO authors (id, name, country) VALUES
  (1, 'Ada Lovelace', 'UK'),
  (2, 'Grace Hopper', 'USA'),
  (3, 'Alan Turing', 'UK'),
  (4, 'Dennis Ritchie', 'USA');

CREATE TABLE books (id INTEGER PRIMARY KEY, title TEXT, author_id INTEGER, year INTEGER);
INSERT INTO books (id, title, author_id, year) VALUES
  (1, 'Notes on the Analytical Engine', 1, 1843),
  (2, 'The Compiler', 2, 1952),
  (3, 'On Computable Numbers', 3, 1936),
  (4, 'The C Programming Language', 4, 1978),
  (5, 'Cryptanalysis', 3, 1940);
`;

class SqlAdapter {
  label = 'SQL';
  #db = null;
  #SQL = null;
  #loading = null;

  async cmLang() {
    const { sql } = await import('@codemirror/lang-sql');
    return sql();
  }

  async load(onStatus) {
    if (this.#db) return;
    if (this.#loading) return this.#loading;
    this.#loading = (async () => {
      onStatus && onStatus('Downloading SQLite runtime (first run only)…');
      // sql.js dist/sql-wasm.js is a UMD bundle, not an ES module: load it as a
      // classic <script> (like Pyodide) so it registers globalThis.initSqlJs.
      // Importing it via import() yields an empty module namespace (no default
      // export), and the call later fails deep in the minified code with a
      // cryptic "e is not a function".
      await loadScript(`${SQLJS_CDN}/sql-wasm.js`);
      onStatus && onStatus('Starting SQLite…');
      const initSqlJs = globalThis.initSqlJs;
      if (typeof initSqlJs !== 'function') throw new Error('sql.js failed to register initSqlJs');
      this.#SQL = await initSqlJs({ locateFile: (f) => `${SQLJS_CDN}/${f}` });
      this.#db = new this.#SQL.Database();
      this.#db.run(SEED_SQL);
    })();
    await this.#loading;
  }

  // `seed`, when given, runs against a fresh throwaway Database (seed DDL/INSERTs
  // first) instead of the shared demo DB, and closes it afterwards - used by
  // /practice lessons so each run is isolated and never touches the shared demo
  // tables. Omitting `seed` is byte-for-byte the original behavior (RunnableCode
  // never passes it).
  async run(code, { seed } = {}) {
    if (seed === undefined && !this.#db) return { error: 'SQL runtime not loaded.' };
    if (seed !== undefined && !this.#SQL) return { error: 'SQL runtime not loaded.' };
    let scratch = null;
    try {
      const db = seed !== undefined ? (scratch = new this.#SQL.Database()) : this.#db;
      if (scratch && seed) scratch.run(seed);
      // exec() drops result sets that matched no rows, so a SELECT returning
      // nothing is indistinguishable from an INSERT and falls through to the
      // "rows affected" branch below - which then reports the *seed's* changes.
      // Walk the statements instead: column names identify a query even when it
      // returns zero rows. Last query still wins, exactly as exec() did.
      let table = null;
      for (const stmt of db.iterateStatements(code)) {
        const columns = stmt.getColumnNames();
        if (columns.length) {
          const rows = [];
          while (stmt.step()) rows.push(stmt.get());
          table = { columns, rows };
        } else {
          stmt.step();
        }
      }
      if (table) return { table };
      // No query at all (e.g. INSERT/UPDATE/CREATE) - report rows changed.
      const changes = db.getRowsModified();
      return { logs: `OK - ${changes} row${changes === 1 ? '' : 's'} affected.` };
    } catch (err) {
      return { error: String(err.message || err) };
    } finally {
      if (scratch) scratch.close();
    }
  }

  dispose() {
    try {
      this.#db && this.#db.close();
    } catch (e) {
      /* ignore */
    }
    this.#db = null;
    this.#SQL = null;
    this.#loading = null;
  }
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
  py: () => new PythonAdapter(),
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
  const lang = (rawLang || '').toLowerCase();
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
