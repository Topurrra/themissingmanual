// Real reading, not the title alone - checked the phase content of each target
// before mapping it. Only lessons with a genuinely relevant guide phase are
// listed here; omit the rest rather than force a weak match.
export const RELATED = {
  // Phase 1: basic `: type` annotations on variables + a typed function ->
  // the phase whose whole point is "here's the payoff of basic types".
  1: 'typescript-from-zero#2',
  // Phase 2: interfaces (an object shape) -> the phase that introduces
  // interface/type for describing object shapes.
  2: 'typescript-from-zero#4',
  // Phase 3: function types + optional/default params -> the phase that
  // explicitly covers "optional and default and rest parameters".
  3: 'typescript-from-zero#3',
  // Phase 4: union types + typeof narrowing -> the phase this is literally
  // named after (unions, literals & narrowing).
  4: 'typescript-from-zero#5',
  // Phase 5: generics -> the phase this is literally named after.
  5: 'typescript-from-zero#6'
  // Phase 6 (capstone) combines interfaces + unions + generics at once - no
  // single guide phase matches that combination well, so it's left unmapped
  // rather than forced onto one piece of it.
};
