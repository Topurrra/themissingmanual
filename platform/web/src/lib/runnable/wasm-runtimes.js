// Python's JS bridge can mutate worker globals. Host formatting keeps its
// original intrinsic, independently of the learner's warm interpreter state.
const asString = String;

const SEED_SQL = `
CREATE TABLE authors (id INTEGER PRIMARY KEY, name TEXT, country TEXT);
INSERT INTO authors (id, name, country) VALUES
  (1, 'Ada Lovelace', 'UK'), (2, 'Grace Hopper', 'USA'),
  (3, 'Alan Turing', 'UK'), (4, 'Dennis Ritchie', 'USA');
CREATE TABLE books (id INTEGER PRIMARY KEY, title TEXT, author_id INTEGER, year INTEGER);
INSERT INTO books (id, title, author_id, year) VALUES
  (1, 'Notes on the Analytical Engine', 1, 1843),
  (2, 'The Compiler', 2, 1952), (3, 'On Computable Numbers', 3, 1936),
  (4, 'The C Programming Language', 4, 1978), (5, 'Cryptanalysis', 3, 1940);
`;

function errorResult(err, logs) {
  const error = asString(err.message || err);
  return { logs, error, errorMessage: error.trim().split('\n').at(-1) };
}

function outputBuffer() {
  let text = '', lines = 0, truncated = false;
  return {
    append(line) {
      if (truncated) return;
      const value = asString(line) + '\n';
      const remaining = 64000 - text.length;
      if (lines++ >= 1000 || value.length > remaining) {
        text += value.slice(0, Math.max(0, remaining)) + '\n[Output truncated]\n';
        truncated = true;
      } else { text += value; }
    },
    value() { return text.replace(/\n$/, ''); }
  };
}

export class PythonRuntime {
  #py = null;
  constructor(loader) { this.loader = loader; }
  async load(onStatus) {
    if (this.#py) return;
    onStatus?.('Downloading and starting Python (~10 MB, first run only)…');
    this.#py = await this.loader();
  }
  async run(code, { fresh, onStatus, onExecute }) {
    await this.load(onStatus);
    const py = this.#py;
    onStatus?.('Loading Python packages…');
    await py.loadPackagesFromImports(code);
    const captured = outputBuffer();
    py.setStdout({ batched: (s) => captured.append(s) });
    py.setStderr({ batched: (s) => captured.append(s) });
    let globals, result;
    try {
      onExecute();
      if (fresh) globals = py.toPy({ __name__: '__main__' });
      result = await py.runPythonAsync(code, globals ? { globals } : {});
      return { logs: captured.value(), result: result == null ? undefined : asString(result).slice(0, 64000) };
    } catch (err) { return errorResult(err, captured.value()); }
    finally {
      result?.destroy?.();
      globals?.destroy();
      py.setStdout({ batched: () => {} });
      py.setStderr({ batched: () => {} });
    }
  }
}

export class SqliteRuntime {
  #SQL = null;
  #db = null;
  constructor(loader) { this.loader = loader; }
  async load(onStatus) {
    if (this.#SQL) return;
    onStatus?.('Downloading and starting SQLite (first run only)…');
    this.#SQL = await this.loader();
    this.#db = new this.#SQL.Database();
    this.#db.run(SEED_SQL);
  }
  async run(code, { seed, onStatus, onExecute }) {
    await this.load(onStatus);
    let scratch;
    try {
      onExecute();
      const db = seed !== undefined ? (scratch = new this.#SQL.Database()) : this.#db;
      if (scratch && seed) db.run(seed);
      let table = null;
      for (const stmt of db.iterateStatements(code)) {
        const columns = stmt.getColumnNames();
        if (columns.length) {
          const rows = [];
          while (stmt.step()) rows.push(stmt.get());
          table = { columns, rows };
        } else { stmt.step(); }
      }
      if (table) return { table };
      const n = db.getRowsModified();
      return { logs: `OK - ${n} row${n === 1 ? '' : 's'} affected.` };
    } catch (err) { return errorResult(err); }
    finally { scratch?.close(); }
  }
}

export class PostgresRuntime {
  #PGlite = null;
  constructor(loader) { this.loader = loader; }
  async load(onStatus) {
    if (this.#PGlite) return;
    onStatus?.('Downloading Postgres runtime (~16 MB, first run only)…');
    this.#PGlite = await this.loader();
  }
  async run(code, { seed, onStatus, onExecute }) {
    await this.load(onStatus);
    const db = new this.#PGlite();
    try {
      onStatus?.('Starting Postgres…');
      await db.waitReady;
      onExecute();
      if (seed) await db.exec(seed);
      const results = await db.exec(code);
      if (!results.length) return { logs: 'OK - statement executed.' };
      const last = results.at(-1);
      if (!last.fields.length) {
        const n = last.affectedRows || 0;
        return { logs: `OK - ${n} row${n === 1 ? '' : 's'} affected.` };
      }
      const columns = last.fields.map((f) => f.name);
      const rows = last.rows.map((row) => columns.map((c) => {
        const value = row[c];
        return value !== null && typeof value === 'object' ? JSON.stringify(value) : value;
      }));
      return { table: { columns, rows } };
    } catch (err) { return errorResult(err); }
    finally { await db.close(); }
  }
}
