// Hand-picked against guides/programming-concepts/regular-expressions-explained
// (not guessed from titles):
// - Lesson 1 (literal matching, .test()) reuses that guide's own "cat" /
//   "concatenate" / case-sensitivity example -> phase 1.
// - Lessons 2-4 and 6 (character classes, quantifiers, anchors/boundaries,
//   combining into a practical shape check) are all taught in phase 2, "The
//   Core Toolkit", which covers \d \w [...] * + ? {n} ^ $ () and closes with
//   the "perfect email regex is a trap" good-enough-shape lesson lesson 6
//   echoes.
// - Lesson 5 (capture groups) and lesson 7 (global-flag extraction) map onto
//   phase 3, "Using Regex for Real", which covers find/replace with $1/$2
//   capture groups and real-world extraction with tools like grep.
// ponytail: lesson 8 has no distinct guide phase to point at beyond what
// lesson 7 already covers (same extraction idea, applied to a list) - omitted
// rather than forced.
export const RELATED = {
  1: 'regular-expressions-explained#1',
  2: 'regular-expressions-explained#2',
  3: 'regular-expressions-explained#2',
  4: 'regular-expressions-explained#2',
  5: 'regular-expressions-explained#3',
  6: 'regular-expressions-explained#2',
  7: 'regular-expressions-explained#3'
};
