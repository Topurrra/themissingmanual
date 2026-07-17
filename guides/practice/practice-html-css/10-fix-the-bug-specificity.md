---
title: "Fix the bug: a colour that refuses to change"
guide: practice-html-css
phase: 10
summary: "You wrote a rule to make the warning red. The warning is still grey, and nothing is broken. A more specific selector already won, and CSS never mentions it."
tags: [css, specificity, selectors, debugging, important]
difficulty: advanced
synonyms:
  - why is my css not applying
  - css class not changing color
  - css specificity explained
  - my css rule is being ignored
  - id selector overrides class
  - when to use !important
updated: 2026-07-17
---

# Fix the bug: a colour that refuses to change

You added `.warning { color: ... }`, pressed Run, and the text is the same grey
it was before. No error, nothing in the console. A rule that never applies looks
exactly like a rule you forgot to write.

Something more specific already set that colour. When two rules set the same
property on the same element, the browser scores each selector by counting what
is in it:

- ids first (`#panel`)
- then classes (`.warning`), attributes, and pseudo-classes like `:hover`
- then plain tag names (`p`)

Compare the counts column by column, left to right, and the first column that
differs decides it outright. One id beats any number of classes; one class beats
any number of tags. `#panel p` carries one id and one tag. `.warning` carries one
class. The id column settles it before the class column is ever read.

"Whichever is written last wins" is the rule most people carry, and it is real -
but only as the tiebreak, for selectors that score identically. These two do not,
so moving your rule to the bottom of the file changes nothing.

That leaves two fixes: raise your rule until it outscores the other one, or lower
the other one. There is a third thing you can type. `!important` does turn the
text red, and it also lifts that declaration out of the counting entirely, so the
next person who has to override it has nothing left to reach for except another
`!important`. It buys today's fix with tomorrow's, which is a debt, not a fix.

**Your task:** make the warning line red. The `.warning` rule already has the
colour you want - it just never wins. Leave the other two notes the grey they
are now.

**You'll practice:**

- Reading two selectors and working out which one the browser will pick
- Fixing a rule that loses, without reaching for `!important`

```lesson
{
  "language": "html",
  "starterCode": "<style>\n  #panel { border: 1px solid #ccd; padding: 12px 16px; font-family: system-ui, sans-serif; }\n  #panel p { color: #445; }\n\n  /* Added this so the disk warning stands out. It is still grey. */\n  .warning { color: #c0392b; }\n</style>\n\n<div id=\"panel\">\n  <h2>Deploy checks</h2>\n  <p>Tests passed on all three runners.</p>\n  <p class=\"warning\">Disk usage is at 94%.</p>\n  <p>Last deploy finished 6 minutes ago.</p>\n</div>\n",
  "solution": "<style>\n  #panel { border: 1px solid #ccd; padding: 12px 16px; font-family: system-ui, sans-serif; }\n  #panel p { color: #445; }\n\n  #panel .warning { color: #c0392b; }\n</style>\n\n<div id=\"panel\">\n  <h2>Deploy checks</h2>\n  <p>Tests passed on all three runners.</p>\n  <p class=\"warning\">Disk usage is at 94%.</p>\n  <p>Last deploy finished 6 minutes ago.</p>\n</div>\n",
  "checks": [
    { "name": "the warning line stands out in red", "selector": ".warning", "styles": ["color"] },
    { "name": "the other two notes keep the colour they already had", "selector": "#panel p:not(.warning)", "count": true, "styles": ["color"] },
    { "name": "the warning is still one of the panel's notes", "selector": "#panel p.warning", "count": true }
  ],
  "hints": [
    "Nothing is broken and nothing is being ignored at random. Two rules set a colour on that paragraph and the browser has already picked one of them. The question is not why yours failed, it is which one it picked and what made that one stronger.",
    "Count what is in each selector. #panel p holds one id and one tag name. .warning holds one class and nothing else. Ids are compared before classes, so #panel p wins on the first column and .warning never gets read - which is why moving it further down the file does nothing.",
    "Change the .warning selector to #panel .warning, keeping color: #c0392b. Both selectors now have one id, so the browser moves to the next column, and your one class beats the other rule's zero classes. Lowering the other side works just as well: change #panel p to plain p and .warning outscores it on classes."
  ]
}
```
