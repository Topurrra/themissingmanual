---
title: "Padding, border, margin: the box around everything"
guide: practice-html-css
phase: 5
summary: "Every element is a box with four layers. Give a cramped card padding to breathe, a border to define it, and margin to push it off its neighbour."
tags: [css, box-model, padding, margin, border, spacing]
difficulty: intermediate
synonyms:
  - difference between padding and margin
  - css box model explained
  - text touching the edge of my div
  - how to add space inside a div
  - why is my border not showing
  - space between two divs css
updated: 2026-07-17
---

# Padding, border, margin: the box around everything

Every element the browser draws is a box, and that box has four layers stacked
from the inside out. The content is the text itself. **Padding** is space added
around the content, still inside the box. The **border** is drawn around the
padding. **Margin** is space outside the border that holds other elements away.

The part that trips people up is where the background stops. Padding is inside
the border, so it gets painted with the element's background: add padding to a
white card and you get more white card. Margin is outside the border, so it is
never painted - whatever sits behind the element shows through instead. Space
added inside the border joins the card; space added outside it belongs to the
page.

The two cards below have neither. The text is pressed flat against the white
edge, and the second card is jammed against the first.

**Your task:** give `.card` 16px of padding on all four sides, a 1px solid
border, and 24px of margin below it. Watch which of the new space comes out
white and which comes out grey - that tells you which side of the border you
landed on.

**You'll practice:**

- Adding padding, border and margin to one element and seeing what each does
- Reading a background colour to tell padding apart from margin

```lesson
{
  "language": "html",
  "starterCode": "<style>\n  body { background: #eef1f5; font-family: system-ui, sans-serif; }\n\n  .card {\n    width: 240px;\n    background: #ffffff;\n  }\n\n  .card h2, .card p { margin: 0; }\n</style>\n\n<div class=\"card\">\n  <h2>Standing desk</h2>\n  <p>Barely used. Collection only.</p>\n</div>\n\n<div class=\"card\">\n  <h2>Office chair</h2>\n  <p>One wheel squeaks. Free.</p>\n</div>\n",
  "solution": "<style>\n  body { background: #eef1f5; font-family: system-ui, sans-serif; }\n\n  .card {\n    width: 240px;\n    background: #ffffff;\n    padding: 16px;\n    border: 1px solid #c9d2dd;\n    margin-bottom: 24px;\n  }\n\n  .card h2, .card p { margin: 0; }\n</style>\n\n<div class=\"card\">\n  <h2>Standing desk</h2>\n  <p>Barely used. Collection only.</p>\n</div>\n\n<div class=\"card\">\n  <h2>Office chair</h2>\n  <p>One wheel squeaks. Free.</p>\n</div>\n",
  "checks": [
    { "name": "both cards are still on the page", "selector": ".card", "count": true },
    { "name": "the text has room to breathe inside the card", "selector": ".card", "styles": ["padding"] },
    { "name": "the card has an edge you can see", "selector": ".card", "styles": ["border-width", "border-style"] },
    { "name": "the cards are no longer touching", "selector": ".card", "styles": ["margin-bottom"] }
  ],
  "hints": [
    "All three belong in the .card rule that is already there. Padding, border and margin are three separate properties, so you are adding three declarations, not editing the two you have.",
    "A border needs more than a width. With no style set, there is nothing to draw, and a width with nothing to draw computes to zero - so border-width: 1px on its own leaves the card exactly as it was. Give it a style as well. And you only want space underneath, so reach for margin-bottom rather than margin.",
    "Add these three lines inside the .card rule: padding: 16px; border: 1px solid #c9d2dd; margin-bottom: 24px; - the border shorthand sets width, style and colour in one go, and padding: 16px means all four sides at once."
  ]
}
```
