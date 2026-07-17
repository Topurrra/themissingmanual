---
title: "Capstone: a card that survives real content"
guide: practice-html-css
phase: 12
summary: "The card looked perfect against placeholder text. Then one real email address arrived and tore it open. Find the flex default that let it happen, and fix the layout instead of the data."
tags: [css, flexbox, min-width, overflow-wrap, layout, debugging]
difficulty: advanced
synonyms:
  - flex item will not shrink
  - long word breaks my flex layout
  - text overflowing a flex container
  - min-width auto on a flex item
  - long email address breaks my card
  - why does my flexbox overflow
updated: 2026-07-17
---

# Capstone: a card that survives real content

Every layout in this module was built against text you picked yourself.
`jane@corp.com` fits anywhere. Then the export from the real system lands, one
address turns out to be 42 characters with no spaces in it, and the card in the
preview is split open - the text column has shoved itself out past the border
and kept going.

Nothing errored. This is the same CSS that was correct an hour ago. Only the
data changed.

The rule doing it is a default you have never had to think about. Every flex
item has `min-width: auto`, and on a flex item `auto` does not mean zero - it
means "never let me get narrower than my own content". A paragraph's own
content is its longest *unbreakable* run. Normally that is one ordinary word, a
few pixels wide, so the rule costs you nothing and you never learn it exists.
But a browser will not break a line at a dot or at an `@`, and this address has
no hyphen in it either - so all 42 characters are a single unbreakable run.
`.who` digs in at exactly that width, the card's arithmetic stops adding up,
and the browser draws the overflow rather than mentioning it.

Two separate things are wrong here, and fixing one still leaves a broken page.
The column has to be allowed to shrink to its share, *and* the address has to be
allowed to break. Fix only the first and the column snaps to the right width
while the text keeps running out over the border - which looks exactly like your
fix did nothing.

**Your task:** make the email wrap inside the card. Leave the address alone and
leave the card's width alone - the next address will only be longer.

**You'll practice:**

- Reading `min-width: auto` as the flex default meaning "never shrink below my content"
- Fixing the layout instead of the data, so the next long value lands harmlessly

```lesson
{
  "language": "html",
  "starterCode": "<style>\n  body { margin: 24px; font: 16px/1.4 system-ui, sans-serif; background: #f4f5f7; }\n  .card {\n    display: flex;\n    gap: 12px;\n    width: 260px;\n    padding: 16px;\n    background: #fff;\n    border: 1px solid #d8dbe0;\n    border-radius: 8px;\n  }\n  .avatar {\n    flex-shrink: 0;\n    width: 48px;\n    height: 48px;\n    border-radius: 50%;\n    background: #dfe3e8;\n  }\n  .who { flex: 1; }\n  .name { margin: 0; font-size: 16px; }\n  .email { margin: 4px 0 0; color: #5b6472; }\n</style>\n\n<div class=\"card\">\n  <div class=\"avatar\"></div>\n  <div class=\"who\">\n    <h2 class=\"name\">Priya Raman</h2>\n    <p class=\"email\">priya.raman@northwindlogistics.example.com</p>\n  </div>\n</div>\n",
  "solution": "<style>\n  body { margin: 24px; font: 16px/1.4 system-ui, sans-serif; background: #f4f5f7; }\n  .card {\n    display: flex;\n    gap: 12px;\n    width: 260px;\n    padding: 16px;\n    background: #fff;\n    border: 1px solid #d8dbe0;\n    border-radius: 8px;\n  }\n  .avatar {\n    flex-shrink: 0;\n    width: 48px;\n    height: 48px;\n    border-radius: 50%;\n    background: #dfe3e8;\n  }\n  .who { flex: 1; min-width: 0; }\n  .name { margin: 0; font-size: 16px; }\n  .email { margin: 4px 0 0; color: #5b6472; overflow-wrap: break-word; }\n</style>\n\n<div class=\"card\">\n  <div class=\"avatar\"></div>\n  <div class=\"who\">\n    <h2 class=\"name\">Priya Raman</h2>\n    <p class=\"email\">priya.raman@northwindlogistics.example.com</p>\n  </div>\n</div>\n",
  "checks": [
    { "name": "the text column stays inside the card", "selector": ".who", "styles": ["width"] },
    { "name": "the long email wraps instead of running off the edge", "selector": ".email", "styles": ["height"] },
    { "name": "the address is still the full address", "selector": ".email", "text": true }
  ],
  "hints": [
    "Run it first and read the two widths. After the avatar and the gap, the card has 200px of room left for the text column - but the column is drawing itself 324px wide, which is exactly how wide the email address is. Nothing shrank the column, because nothing is allowed to.",
    "A flex item's min-width is auto, and on a flex item auto is not 0 - it resolves to the item's min-content width, the widest run in it that cannot be broken. Overriding that on .who lets the column shrink to its share at last. That is only half of it: the address still has nowhere legal to break, so it will run out of the column instead of out of the card. The other half is giving that one long word permission to break.",
    "Add min-width: 0 to the .who rule so the column can shrink to its share, and overflow-wrap: break-word to the .email rule so the address breaks when it reaches the edge. One property in each rule, and nothing else changes."
  ]
}
```
