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
  7: 'oop-vs-functional#1'
};
