---
title: "Fix the bug: the padding that made the box too big"
guide: practice-html-css
phase: 9
summary: "A card asks for width: 100% and draws itself wider than the rail it lives in. Nothing errors. Learn what width actually measures, and switch the card to the model that measures the whole box."
tags: [css, box-model, box-sizing, border-box, overflow, debugging]
difficulty: advanced
synonyms:
  - why does my div overflow its container
  - width 100% plus padding too wide
  - css box-sizing border-box explained
  - padding adds to width css
  - horizontal scrollbar i did not ask for
  - what does box-sizing border-box do
updated: 2026-07-17
---

# Fix the bug: the padding that made the box too big

The page renders. The console is empty. The 240px summary rail on the right
looks correct until you notice the card inside it hanging off the edge of the
page, dragging a horizontal scrollbar along behind it.

The card asks for `width: 100%` of the room the rail gives it. So why is it
wider than the rail?

Because `width` does not mean the width of the box. Every element starts as
`box-sizing: content-box`, and under that model `width` sizes the **content
box** only. Padding and border are added outside it. So the space this card
actually occupies is:

```
width (100% = 208px) + padding (16 + 16) + border (1 + 1) = 242px
```

242px pushed into a 208px slot. No rule was misspelled and no selector missed,
so nothing complains: the browser did the arithmetic you asked for and drew a
box that does not fit. This is the shape of most CSS bugs. There is no
traceback, only a page that looks wrong.

The other model is `border-box`. Under it, `width` measures to the outer edge
of the border, and the padding and border are taken out of the inside instead
of piled on the outside. `width: 100%` finally means what you assumed it meant,
and the content box shrinks to whatever is left over.

Content-box is still the default only because it is what the original CSS box
model defined, and changing a default would rewrite every page ever written
against it. That is why so many real stylesheets open with a border-box reset
before the first rule.

**Your task:** make the card fit the rail. Do not touch the padding, the
border, the rail, or the `width: 100%` - the card is supposed to fill the rail.
Change what that 100% *measures*.

**You'll practice:**

- Reading a silent layout bug as arithmetic rather than as a mystery
- Moving an element off the content-box model onto the border-box one

```lesson
{
  "language": "html",
  "starterCode": "<style>\n  body { margin: 0; font-family: system-ui, sans-serif; }\n  .layout { display: grid; grid-template-columns: 1fr 240px; }\n  .feed { padding: 16px; }\n  .rail { padding: 16px; background: #eceff4; }\n  .card {\n    width: 100%;\n    padding: 16px;\n    border: 1px solid #c3cfdd;\n    background: #fff;\n  }\n</style>\n\n<div class=\"layout\">\n  <main class=\"feed\">\n    <h1>Orders</h1>\n  </main>\n  <aside class=\"rail\">\n    <h2>Summary</h2>\n    <div class=\"card\">4 tickets waiting on you</div>\n  </aside>\n</div>\n",
  "solution": "<style>\n  body { margin: 0; font-family: system-ui, sans-serif; }\n  .layout { display: grid; grid-template-columns: 1fr 240px; }\n  .feed { padding: 16px; }\n  .rail { padding: 16px; background: #eceff4; }\n  .card {\n    box-sizing: border-box;\n    width: 100%;\n    padding: 16px;\n    border: 1px solid #c3cfdd;\n    background: #fff;\n  }\n</style>\n\n<div class=\"layout\">\n  <main class=\"feed\">\n    <h1>Orders</h1>\n  </main>\n  <aside class=\"rail\">\n    <h2>Summary</h2>\n    <div class=\"card\">4 tickets waiting on you</div>\n  </aside>\n</div>\n",
  "checks": [
    {
      "name": "the rail still holds its one card",
      "selector": ".card",
      "count": true,
      "text": true
    },
    {
      "name": "the card still fills the rail, and now stops at its edge",
      "selector": ".card",
      "styles": [
        "box-sizing",
        "width"
      ]
    }
  ],
  "hints": [
    "The rail gives the card 208px of room and the card draws itself 242px wide. Nothing is broken: 208 is what width: 100% resolves to, and the 16px padding on each side plus the 1px border on each side are added outside that. Find the property that decides whether width is measured to the content edge or to the border edge.",
    "That property is box-sizing, and it belongs on the card. Its default value is content-box, which is the model doing the adding. The value you want makes the browser fit the padding and the border inside the 100% instead of outside it.",
    "Add box-sizing: border-box; to the .card rule, above the width. The card's border box becomes 208px and its content box shrinks to 174px to make room for the padding and border, so nothing changes size except what the 100% was measuring."
  ]
}
```
