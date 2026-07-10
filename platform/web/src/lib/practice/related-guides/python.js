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
  7: 'python-from-zero#11',
  // Phase 9: classes + one level of inheritance -> same target the JS classes
  // lesson uses (javascript.js phase 7) - checked oop-vs-functional's other
  // phases (functional programming, which/when) and phase 1 is still the
  // clear best fit: it covers encapsulation/inheritance/polymorphism in plain
  // language, and its own worked example is Python (BankAccount/SavingsAccount).
  9: 'oop-vs-functional#1',
  // Phase 11: recursive factorial + Fibonacci -> recursion-finally-clicks'
  // own phase 1, whose worked example IS factorial via recursion (the "leap
  // of faith" mental model) - a closer match than phase 2's recipe-focused
  // follow-up.
  11: 'recursion-finally-clicks#1',
  // Phase 12: mean + population variance -> probability-and-statistics'
  // "Reading Data" phase, which has a dedicated "range and standard
  // deviation" section defining variance the same way this lesson computes it.
  12: 'probability-and-statistics#2',
  // Phase 14: time-of-day wraparound with // and % -> numbers-and-number-systems'
  // "Modular Arithmetic: Clock Math" phase - its opening example is literally
  // 24-hour wraparound ("10 + 5 = 15... wraps to 3 o'clock").
  14: 'numbers-and-number-systems#3',
  // Phase 15: weighted random draws from a bag -> probability-and-statistics'
  // own probability phase (favorable-over-total, weighted outcomes).
  15: 'probability-and-statistics#1'
  // Phases 10 (list comprehension rewrite) and 13 (string-alignment
  // formatter) have no dedicated guide phase anywhere in the codebase -
  // checked programming-concepts and python-from-zero, nothing beyond a
  // passing mention. Omitted rather than forced.
};
