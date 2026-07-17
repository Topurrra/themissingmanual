// Hand-picked against guides/web-fundamentals content (not guessed from titles).
// Lessons 1-2 (tags, then links/lists) map onto html-from-zero's first two phases,
// which cover exactly that ground - phase 2 is literally "Text, Lists, Links, and
// Images".
// Lessons 3-4 (the <style> block, tag selectors, then classes) map onto
// css-without-tears#1 "Selectors and the Cascade", which teaches class selectors.
// Lesson 5 (the box model) maps onto css-without-tears#2, the box model phase.
// Lessons 6-8 (flex row, centring, nav bar) map onto flexbox-and-grid#1, the
// one-dimensional layout phase - it covers justify-content/align-items directly.
// Lesson 9 (padding overflowing a width) maps onto css-without-tears#2, which
// teaches box-sizing/border-box - the exact fix.
// Lesson 10 (a rule that loses to a more specific selector) maps onto
// css-without-tears#1, whose own synonyms include "why isn't my css style
// applying" - the same question the lesson is built around.
// Lesson 11 (a child's margin escaping its parent) maps onto css-without-tears#3
// "Margin Collapse", written for exactly this bug (the parent-child escape case).
// Lesson 12 (a long word tearing a flex card open) maps onto flexbox-and-grid#2
// "When a Flex Item Won't Shrink", the min-width: auto floor phase.
export const RELATED = {
  1: 'html-from-zero#1',
  2: 'html-from-zero#2',
  3: 'css-without-tears#1',
  4: 'css-without-tears#1',
  5: 'css-without-tears#2',
  6: 'flexbox-and-grid#1',
  7: 'flexbox-and-grid#1',
  8: 'flexbox-and-grid#1',
  9: 'css-without-tears#2',
  10: 'css-without-tears#1',
  11: 'css-without-tears#3',
  12: 'flexbox-and-grid#2'
};
