// PostgreSQL execution runs in the warm WASM worker, with a fresh database
// per run. Keep this adapter entry point for the existing language registry.
import WasmWorker from './wasm-worker.js?worker';
import { RuntimeAdapter } from './runtime-adapter.js';

export class PGliteAdapter extends RuntimeAdapter {
  constructor() { super('postgres', () => new WasmWorker()); }
}
