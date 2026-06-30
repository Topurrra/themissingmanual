// Sandboxed JS execution worker.
//
// Runs user code with `eval` inside a Web Worker - no DOM, no window, no
// SvelteKit globals. We capture console.* and the value of the last expression,
// then post the result back. The main thread enforces a timeout and terminates
// us if a runaway loop (e.g. `while (true) {}`) never yields.
//
// Protocol:
//   main → worker:  { code: string }
//   worker → main:  { ok: true,  logs: [...], result: <string|undefined> }
//                   { ok: false, logs: [...], error: <string> }
// Each `logs` entry is { level: 'log'|'warn'|'error'|'info', text: string }.

function format(value) {
  if (typeof value === 'string') return value;
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'bigint') return value.toString() + 'n';
  if (typeof value === 'function') return value.toString();
  if (value instanceof Error) return value.stack || String(value);
  try {
    // Pretty-print objects/arrays; handles cycles gracefully.
    const seen = new WeakSet();
    return JSON.stringify(
      value,
      (k, v) => {
        if (typeof v === 'object' && v !== null) {
          if (seen.has(v)) return '[Circular]';
          seen.add(v);
        }
        if (typeof v === 'bigint') return v.toString() + 'n';
        if (typeof v === 'function') return '[Function]';
        return v;
      },
      2
    );
  } catch (e) {
    return String(value);
  }
}

self.onmessage = (e) => {
  const code = e && e.data && e.data.code;
  const __id = e && e.data && e.data.__id;
  const logs = [];
  const push = (level) => (...args) => {
    logs.push({ level, text: args.map(format).join(' ') });
  };
  // Replace console so user logs are captured, not lost to the worker void.
  self.console = {
    log: push('log'),
    info: push('info'),
    warn: push('warn'),
    error: push('error'),
    debug: push('log')
  };

  try {
    // Indirect eval runs in the global (worker) scope - no closure leakage from
    // this function. The trailing wrap captures the completion value of the last
    // expression the same way a REPL does.
    const indirectEval = eval;
    const result = indirectEval(code);
    let resultText;
    if (result !== undefined) resultText = format(result);
    self.postMessage({ __id, ok: true, logs, result: resultText });
  } catch (err) {
    const text = err instanceof Error ? (err.stack || `${err.name}: ${err.message}`) : format(err);
    self.postMessage({ __id, ok: false, logs, error: text });
  }
};
