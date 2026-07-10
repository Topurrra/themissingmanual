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
  // Phase 1 (Newton's second law, F=ma) maps onto
  // energy-forces-and-motion#2, which introduces F = m*a with the exact same
  // "cart" framing and a worked numeric example.
  1: 'energy-forces-and-motion#2',
  // Phase 2 (average speed) maps onto what-physics-actually-is#2, whose
  // dimensional-analysis section works the identical speed = distance / time
  // example (120 km / 2 h = 60 km/h).
  2: 'what-physics-actually-is#2',
  // Phase 3 (free-fall distance) maps onto what-physics-actually-is#1, which
  // introduces this exact formula ("distance fallen = 1/2 x 9.8 x t^2") via
  // the same "stone dropped from a bridge" scenario this lesson reuses.
  3: 'what-physics-actually-is#1',
  // Phase 4 (momentum) and phase 5 (kinetic energy) both map onto
  // energy-forces-and-motion#3, which introduces "momentum is mass times
  // velocity" and kinetic energy's speed-squared behavior in the same phase.
  4: 'energy-forces-and-motion#3',
  5: 'energy-forces-and-motion#3'
};
