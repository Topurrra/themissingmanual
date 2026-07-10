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
  // Phase 2 (percentage of a number) and phase 3 (discount price) both lean on
  // the same skill - converting a percent to a decimal - which
  // probability-and-statistics#1 states explicitly: "Multiply by 100 for a
  // percentage; divide by 100 to get back."
  2: 'probability-and-statistics#1',
  3: 'probability-and-statistics#1',
  // Phase 4 (average of a list) is the literal mean formula worked in
  // probability-and-statistics#2: "add everything up, divide by how many
  // there are."
  4: 'probability-and-statistics#2',
  // Phase 5 (compound interest) leans on exponent notation, which
  // why-math-isnt-your-enemy#2 introduces directly: "x² is x*x... 5² is 25."
  5: 'why-math-isnt-your-enemy#2'
  // Phase 1 (order of operations / PEMDAS) has no matching guide phase in
  // guides/mathematics - checked (grep for "order of operations", "PEMDAS",
  // "precedence" across the whole category turned up nothing), so omitted
  // rather than forced. Add an entry here once a phase covers it.
};
