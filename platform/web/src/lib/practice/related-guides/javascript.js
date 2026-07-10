// Real reading, not the title alone - checked the phase content of each target
// before mapping it. Only lessons with a genuinely relevant guide phase are
// listed here; omit the rest rather than force a weak match.
export const RELATED = {
  // Phase 6: closures (private-state factory function) -> the phase whose own
  // summary is literally "private state nothing else can touch" - the closest
  // match in the codebase for this exact lesson.
  6: 'closures-and-scope#2',
  // Phase 7: classes + one level of extends inheritance -> the phase that
  // covers encapsulation, inheritance, and polymorphism in plain language.
  7: 'oop-vs-functional#1',
  // Phase 9: curry/partial application -> closures-and-scope's own "Pattern 2:
  // pre-loading an argument" section names partial application directly - the
  // same target as phase 6 is genuinely correct for a different pattern in it.
  9: 'closures-and-scope#2',
  // Phase 10: diff/dedupe with filter+includes and a Set -> the phase whose
  // own text says "sets shine for deduplicating" - exact match.
  10: 'data-structures-explained#2'
};
