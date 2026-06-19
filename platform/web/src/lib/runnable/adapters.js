// Pluggable runtime adapters for runnable code blocks.
//
// Each adapter implements a small interface so new languages can be added
// without touching the widget. The widget never imports a runtime directly —
// it asks `getAdapter(lang)` and talks to the returned object.
//
//   interface RunResult {
//     logs?:   string;          // captured stdout / console output
//     error?:  string;          // a thrown error / traceback (shown as stderr)
//     result?: string;          // a return value / last-expression value
//     table?:  { columns: string[], rows: any[][] };  // structured (SQL) output
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
// via dynamic <script>/import injection — they're multiple MB and must stay out
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
// JavaScript — sandboxed Web Worker (eval, captured console, hard timeout).
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
  // needs to exist so the widget can show a uniform loading state — for JS it
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
        resolve({ error: `Execution timed out after ${this.timeoutMs / 1000}s (terminated).` });
      }, this.timeoutMs);

      worker.onmessage = (e) => {
        if (done || !e.data || e.data.__id !== id) return;
        done = true;
        clearTimeout(timer);
        const { ok, logs, result, error } = e.data;
        const out = (logs || []).map((l) => l.text).join('\n');
        if (ok) resolve({ logs: out, result });
        else resolve({ logs: out, error });
      };
      worker.onerror = (e) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve({ error: e.message || 'Worker error' });
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
// Python — Pyodide (CPython in WASM) from CDN. stdout + tracebacks captured.
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

  async run(code) {
    if (!this.#pyodide) return { error: 'Python runtime not loaded.' };
    const py = this.#pyodide;
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
// SQL — sql.js (SQLite in WASM) from CDN, seeded with a small sample DB.
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
      // sql.js ships an ESM build; import it from the CDN and locate its .wasm.
      const initSqlJs = (await import(/* @vite-ignore */ `${SQLJS_CDN}/sql-wasm.js`)).default
        || globalThis.initSqlJs;
      onStatus && onStatus('Starting SQLite…');
      this.#SQL = await initSqlJs({ locateFile: (f) => `${SQLJS_CDN}/${f}` });
      this.#db = new this.#SQL.Database();
      this.#db.run(SEED_SQL);
    })();
    await this.#loading;
  }

  async run(code) {
    if (!this.#db) return { error: 'SQL runtime not loaded.' };
    try {
      const res = this.#db.exec(code);
      if (!res.length) {
        // No result set (e.g. INSERT/UPDATE/CREATE) — report rows changed.
        const changes = this.#db.getRowsModified();
        return { logs: `OK — ${changes} row${changes === 1 ? '' : 's'} affected.` };
      }
      // Render the LAST statement's result set as a table.
      const last = res[res.length - 1];
      return { table: { columns: last.columns, rows: last.values } };
    } catch (err) {
      return { error: String(err.message || err) };
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
// Unsupported language — degrade gracefully (editor shows, Run disabled).
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
// Language aliases → adapter factory. TypeScript routes to the JS worker for
// now (a transpile step can be added later); go/rust are intentionally absent
// so they degrade to the "not supported yet" path until a playground embed lands.
const FACTORIES = {
  javascript: () => new JsAdapter(),
  js: () => new JsAdapter(),
  python: () => new PythonAdapter(),
  py: () => new PythonAdapter(),
  sql: () => new SqlAdapter()
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
