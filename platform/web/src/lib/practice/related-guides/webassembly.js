// Real reading, not the title alone - checked the phase content of each target
// before mapping it. Only lessons with a genuinely relevant guide phase are
// listed here; omit the rest rather than force a weak match.
//
// ponytail: NOT wired into related-guides/index.js's BY_MODULE map yet - see
// this round's report for the exact import + BY_MODULE line. index.js is a
// shared registry every practice-content agent this round adds a module to
// (same conflict-avoidance reasoning as adapters.js's FACTORIES); reported
// back for the orchestrator to apply in one pass instead of racing edits.
export const RELATED = {
  // Phase 1: "WAT is the human-readable text form of the exact binary
  // instructions the browser executes" -> the phase that draws precisely this
  // line (source code vs. machine code, and what translates one into the
  // other ahead of time).
  1: 'what-happens-when-code-runs#1'
  // Phases 2-4 (parameters/arithmetic, loops, if/else) are WAT syntax
  // mechanics with no genuinely matching reader guide phase - left unmapped
  // rather than forced onto a loose fit.
  // Phase 5 (capstone) considered rust-from-zero#18 (it names WebAssembly and
  // wasm-bindgen explicitly) but that phase is a brief "where to go next"
  // pointer, not really about what these lessons practice - left unmapped too.
};
