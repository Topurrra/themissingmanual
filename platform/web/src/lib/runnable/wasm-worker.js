import { serveRuntime } from './runtime-host.js';
import { PythonRuntime, SqliteRuntime, PostgresRuntime } from './wasm-runtimes.js';

const PYODIDE_CDN = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full';
const SQLJS_CDN = 'https://cdn.jsdelivr.net/npm/sql.js@1.12.0/dist';

serveRuntime((language) => {
  if (language === 'python') return new PythonRuntime(async () => {
    const { loadPyodide } = await import(/* @vite-ignore */ `${PYODIDE_CDN}/pyodide.mjs`);
    return loadPyodide({ indexURL: `${PYODIDE_CDN}/` });
  });
  if (language === 'sql') return new SqliteRuntime(async () => {
    const response = await fetch(`${SQLJS_CDN}/sql-wasm.js`);
    if (!response.ok) throw new Error(`SQLite download failed (HTTP ${response.status}).`);
    // sql.js is a UMD script, not an ES module. Evaluate the pinned bootstrap
    // only inside this worker; neither a DOM script nor main-thread eval is used.
    (0, eval)(await response.text());
    return globalThis.initSqlJs({ locateFile: (file) => `${SQLJS_CDN}/${file}` });
  });
  if (language === 'postgres') return new PostgresRuntime(async () => {
    const { PGlite } = await import('@electric-sql/pglite');
    return PGlite;
  });
  throw new Error(`Unknown runtime: ${language}`);
});
