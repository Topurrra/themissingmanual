// Sandboxed JS execution worker.
//
// Runs user code with `eval` inside a Web Worker - no DOM, no window, no
// SvelteKit globals. We capture console.* and the value of the last expression,
// then post the result back. The main thread enforces a timeout and terminates
// us if a runaway loop (e.g. `while (true) {}`) never yields.
//
// Protocol:
//   main → worker:  { code: string, __id: number } + transferred reply port
//   private port → main: { ok: true, logs: [...], result: <string|undefined> }
//                   { ok: false, logs: [...], error: <string>, errorMessage: <string> }
// Each `logs` entry is { level: 'log'|'warn'|'error'|'info', text: string }.
// `error` is the full stack (browser-format-dependent - Chrome/Firefox/Safari all
// render Error.stack differently), kept for the Run-panel/"fix the bug" lessons
// where seeing a real trace is the point. `errorMessage` is just `name: message`,
// with no stack frames at all - always clean regardless of browser, meant for
// anywhere a one-line failure reason is shown (e.g. the test-results list).

// Keep the reply intrinsic private even if evaluated code replaces global
// MessagePort prototype methods.
const postPortMessage = Function.prototype.call.bind(MessagePort.prototype.postMessage);

function format(value) {
  if (typeof value === 'string') return value;
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'bigint') return value.toString() + 'n';
  if (typeof value === 'symbol') return String(value);
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
    ) ?? String(value);
  } catch (e) {
    return String(value);
  }
}

self.onmessage = async (e) => {
  const code = e && e.data && e.data.code;
  const __id = e && e.data && e.data.__id;
  const port = e.ports[0];
  if (!port) return;
  const logs = [];
  let logSize = 0;
  let truncated = false;
  const push = (level) => (...args) => {
    if (truncated) return;
    const text = args.map(format).join(' ');
    const remaining = 64000 - logSize;
    if (logs.length >= 1000 || text.length > remaining) {
      if (remaining > 0 && logs.length < 1000) logs.push({ level, text: text.slice(0, remaining) });
      logs.push({ level: 'warn', text: '[Output truncated]' });
      truncated = true;
      return;
    }
    logSize += text.length + 1;
    logs.push({ level, text });
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
    // this function. Await a promise completion value so async examples finish
    // before we return their logs. The parent timeout also covers pending promises.
    const indirectEval = eval;
    const result = await indirectEval(code);
    let resultText;
    if (result !== undefined) resultText = format(result)?.slice(0, 64000);
    postPortMessage(port, { __id, ok: true, logs, result: resultText });
  } catch (err) {
    const message = err instanceof Error ? `${err.name}: ${err.message}` : format(err);
    const stack = err instanceof Error && err.stack ? err.stack : message;
    postPortMessage(port, { __id, ok: false, logs, error: stack, errorMessage: message });
  }
};
