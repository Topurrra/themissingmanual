// Real reading, not the title alone - checked the phase content of each target
// before mapping it. Only lessons with a genuinely relevant guide phase are
// listed here; omit the rest rather than force a weak match.
//
// ponytail: neither error-handling nor generators has a dedicated phase inside
// the programming-concepts category (checked every guide there - closures and
// oop-vs-functional are the only exact matches used for JS). python-from-zero's
// own phases 7 and 11 are a genuinely better match than forcing an approximate
// programming-concepts fit, so this deliberately points there instead.
export const RELATED = {
  // Phase 6: error handling (raise/except) -> Python's own errors-and-io phase.
  6: 'python-from-zero#7',
  // Phase 7: generators (yield-based lazy sequence) -> Python's own
  // iterators-and-generators phase.
  7: 'python-from-zero#11'
};
