import { parentPort, workerData } from 'node:worker_threads';
import { loadPyodide } from 'pyodide';
import initSqlJs from 'sql.js';
import { PGlite } from '@electric-sql/pglite';
import { serveRuntime } from './runtime-host.js';
import { PythonRuntime, SqliteRuntime, PostgresRuntime } from './wasm-runtimes.js';

globalThis.self = globalThis;
serveRuntime((language) => {
  if (workerData?.mode === 'load-error') return {
    load: async () => { throw new Error('Runtime download failed.'); },
    run: async () => { throw new Error('Runtime download failed.'); }
  };
  if (workerData?.mode === 'load-hang') return {
    load: async () => new Promise(() => {}),
    run: async () => new Promise(() => {})
  };
  if (workerData?.mode === 'idle-crash') return {
    load: async () => { setTimeout(() => { throw new Error('Idle worker crashed.'); }, 10); },
    run: async () => ({ error: 'A crashed worker must not be reused.' })
  };
  if (language === 'python') return new PythonRuntime(() => loadPyodide());
  if (language === 'sql') return new SqliteRuntime(() => initSqlJs());
  if (language === 'postgres') return new PostgresRuntime(async () => PGlite);
  throw new Error(language);
});
parentPort.on('message', ({ data, ports }) => self.onmessage({ data, ports }));
