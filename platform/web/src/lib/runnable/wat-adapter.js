// WebAssembly Text (WAT) - compiles learner-authored WAT source with `wabt`
// (the WebAssembly Binary Toolkit's WASM build) into a real WASM binary, then
// hands that binary to the browser's OWN native WebAssembly.instantiate - no
// interpreter involved, the same engine that runs production WASM runs these
// exercises' compiled output directly.
//
// Execution shape here is different from every other adapter: a learner
// writes WAT that EXPORTS one or more functions. The plain "Run" button just
// confirms the module compiled + instantiated; grading (gradeWat() in
// $lib/practice/runners.js) calls into the exports itself and asserts on
// their return values. `compileWat()` below is the shared entry point both
// paths use so the wabt-loading/parsing/instantiating logic lives in one
// place - see its call site in runners.js for the grading side.
let wabtPromise = null;
function loadWabt() {
  if (!wabtPromise) {
    // wabt is a CJS package (`export = wabt`) wrapping an Emscripten-built
    // WASM binary of the toolkit itself - dynamic import() so Vite code-splits
    // it into its own lazy chunk, only loaded when a WAT lesson actually runs.
    wabtPromise = import('wabt').then((mod) => (mod.default || mod)());
  }
  return wabtPromise;
}

// Parses + compiles learner WAT source down to a raw WASM binary. Returns
// either `bytes` (a Uint8Array) or a clean, browser-independent
// `error`/`errorMessage` pair - wabt's parse errors are already plain
// messages with no stack frames to strip (unlike JS's Error.stack, which
// varies by browser - see js-worker.js's comment on why that distinction
// matters for the test-results display). Split out from instantiation (see
// `compileWat` below) because the grading path (`gradeWat` in
// $lib/practice/runners.js) needs the raw bytes, not a main-thread instance -
// see that function's own comment for why.
export async function compileToBytes(code) {
  let wabt;
  try {
    wabt = await loadWabt();
  } catch (err) {
    const text = `Could not load the WebAssembly toolkit: ${err.message || String(err)}`;
    return { error: text, errorMessage: text };
  }

  let module;
  try {
    module = wabt.parseWat('lesson.wat', code);
  } catch (err) {
    const text = String(err.message || err);
    return { error: text, errorMessage: text };
  }

  try {
    return { bytes: new Uint8Array(module.toBinary({}).buffer) };
  } catch (err) {
    const text = String(err.message || err);
    return { error: text, errorMessage: text };
  } finally {
    module.destroy();
  }
}

// Compiles AND instantiates on the main thread - used only by the plain "Run"
// button below (compile-and-report-success, no test execution, no eval of
// any kind - WebAssembly.instantiate() is explicitly covered by this site's
// CSP's `wasm-unsafe-eval` directive, so this is safe here even though
// `new Function()`/`eval()` of arbitrary JS strings is NOT - that's exactly
// why gradeWat() in runners.js does its instantiation inside the JS worker
// instead of here, see that function's comment).
export async function compileWat(code) {
  const { bytes, error, errorMessage } = await compileToBytes(code);
  if (error) return { error, errorMessage };
  try {
    const { instance } = await WebAssembly.instantiate(bytes, {});
    return { instance };
  } catch (err) {
    const text = String(err.message || err);
    return { error: text, errorMessage: text };
  }
}

export class WatAdapter {
  label = 'WebAssembly Text';

  async cmLang() {
    // No maintained CodeMirror language mode for WAT's S-expression syntax
    // exists on npm (checked: no @codemirror/lang-lisp or equivalent) -
    // degrade to plain text rather than add a dependency for cosmetics alone.
    return null;
  }

  async load() {
    await loadWabt();
  }

  // Plain "Run" button, no tests: compile + instantiate and report success -
  // a learner needs to see SOMETHING happened. Grading (gradeWat in
  // runners.js) is the path that actually calls into the exports.
  async run(code) {
    const { instance, error, errorMessage } = await compileWat(code);
    if (error) return { error, errorMessage };
    const exportNames = Object.keys(instance.exports);
    return {
      logs: `Module compiled and instantiated successfully. Exports: ${exportNames.join(', ') || '(none)'}`
    };
  }

  dispose() {
    // wabt's WabtModule (the toolkit itself) and any WasmModule/instance from
    // a run have no persistent handles here to release - each run's module()
    // is already destroy()'d in compileWat() right after toBinary().
  }
}
