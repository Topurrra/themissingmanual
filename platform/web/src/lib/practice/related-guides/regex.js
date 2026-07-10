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
//
// Round 6 additions (lessons 9-13, checked against the same guide):
// - Lessons 9 (lookahead) and 10 (backreferences) have no genuine match -
//   neither phase 2 nor phase 3 covers (?=...) or \1 - omitted rather than
//   forced.
// - Lesson 11 (greedy vs lazy) is phase 3's "Trap 1: greedy vs lazy
//   matching" almost verbatim (the exact <.*> vs <.*?> example).
// - Lesson 12 (global-flag replace-all) and lesson 13 (capture-group
//   reformatting via .replace()) both map to phase 3's "Find-and-replace
//   with capture groups" section - lesson 13 in particular echoes that
//   section's own (\w+)@(\w+) -> $2 owns $1 example almost exactly.
export const RELATED = {
  1: 'regular-expressions-explained#1',
  2: 'regular-expressions-explained#2',
  3: 'regular-expressions-explained#2',
  4: 'regular-expressions-explained#2',
  5: 'regular-expressions-explained#3',
  6: 'regular-expressions-explained#2',
  7: 'regular-expressions-explained#3',
  11: 'regular-expressions-explained#3',
  12: 'regular-expressions-explained#3',
  13: 'regular-expressions-explained#3'
};
