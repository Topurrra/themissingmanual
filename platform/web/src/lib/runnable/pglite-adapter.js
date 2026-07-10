// Postgres - PGlite (real Postgres compiled to WASM) via npm, loaded lazily.
//
// Mirrors SqlAdapter in adapters.js (same RunResult shape, same "fresh throwaway
// instance per run, seeded with `setup`" pattern for /practice grading isolation -
// see SqlAdapter's own doc comment for why) but PGlite is async end-to-end (no
// synchronous .exec() like sql.js) and ships via npm instead of a CDN <script>, so
// it's loaded with a dynamic import() instead of loadScript().
//
// Bundle cost: ~9.7MB .wasm + ~6.1MB .data (~16MB total, comparable to Pyodide) -
// lazy-loaded on first Postgres lesson run only, never in the main bundle.
//
// Unlike SqlAdapter, there is no shared long-lived demo instance: PGlite has no
// cheap synchronous path, and every /practice caller always passes a `seed`, so
// run() always opens a fresh instance, seeds it, runs the code, and closes it.
// Closing is required, not optional - verified via a Node spike (12+ create/
// seed/query/close cycles): skipping db.close() leaves WASM memory retained,
// calling it keeps RSS flat across repeated instances.
class PGliteAdapter {
  label = 'PostgreSQL';
  #PGlite = null;
  #loading = null;

  async cmLang() {
    const { sql, PostgreSQL } = await import('@codemirror/lang-sql');
    return sql({ dialect: PostgreSQL });
  }

  async load(onStatus) {
    if (this.#PGlite) return;
    if (this.#loading) return this.#loading;
    this.#loading = (async () => {
      onStatus && onStatus('Downloading Postgres runtime (~16 MB, first run only)…');
      const { PGlite } = await import('@electric-sql/pglite');
      this.#PGlite = PGlite;
    })();
    await this.#loading;
  }

  // JSONB/array columns come back as real JS objects/arrays (not text) - stringify
  // them for table display and so grading's String()-based row comparison in
  // runners.js actually compares content instead of both sides collapsing to the
  // useless "[object Object]".
  #formatCell(v) {
    return v !== null && typeof v === 'object' ? JSON.stringify(v) : v;
  }

  async run(code, { seed } = {}) {
    if (!this.#PGlite) {
      const text = 'Postgres runtime not loaded.';
      return { error: text, errorMessage: text };
    }
    const db = new this.#PGlite();
    try {
      if (seed) await db.exec(seed);
      const results = await db.exec(code);
      if (!results.length) return { logs: 'OK - statement executed.' };
      // Render the LAST statement's result, same convention as SqlAdapter.
      const last = results[results.length - 1];
      if (!last.fields.length) {
        const n = last.affectedRows || 0;
        return { logs: `OK - ${n} row${n === 1 ? '' : 's'} affected.` };
      }
      const columns = last.fields.map((f) => f.name);
      const rows = last.rows.map((row) => columns.map((c) => this.#formatCell(row[c])));
      return { table: { columns, rows } };
    } catch (err) {
      const message = String((err && err.message) || err);
      return { error: message, errorMessage: message };
    } finally {
      try {
        await db.close();
      } catch (e) {
        /* ignore */
      }
    }
  }

  dispose() {
    // No live DB handle to hold onto - each run() opens+closes its own. Drop the
    // cached class ref so a later load() re-imports (matches SqlAdapter's contract).
    this.#PGlite = null;
    this.#loading = null;
  }
}

export { PGliteAdapter };
