// Each reply port lives inside this handler's lexical scope. Evaluated Python
// can access worker globals, but cannot impersonate the parent's private reply.
// Bind the intrinsics before Pyodide code can modify global JS prototypes.
const postPortMessage = Function.prototype.call.bind(MessagePort.prototype.postMessage);
const closePort = Function.prototype.call.bind(MessagePort.prototype.close);
const asString = String;

export function serveRuntime(createRuntime) {
  let runtime;
  self.onmessage = async ({ data, ports }) => {
    const port = ports?.[0];
    if (!port) return;
    const send = (message) => postPortMessage(port, { id: data.id, ...message });
    const onStatus = (text) => send({ type: 'status', text });
    const onExecute = () => send({ type: 'execute' });
    try {
      runtime ||= createRuntime(data.language);
      let result;
      if (data.action === 'load') {
        await runtime.load(onStatus);
        result = {};
      } else if (data.action === 'run') {
        result = await runtime.run(data.code, { seed: data.seed, fresh: data.fresh, onStatus, onExecute });
      } else { throw new Error('Unknown runtime operation.'); }
      send({ type: 'result', result });
    } catch (err) {
      const text = asString(err.message || err);
      send({ type: 'result', result: { error: text, errorMessage: text.trim().split('\n').at(-1) } });
    } finally { closePort(port); }
  };
}
