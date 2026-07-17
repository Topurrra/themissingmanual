---
title: "Flexbox: a row of cards"
guide: practice-html-css
phase: 6
summary: "Three cards stack because divs are block elements. Make their parent a flex container and they line up in a row - the fix is never on the cards themselves."
tags: [css, flexbox, layout, display-flex, gap, containers]
difficulty: intermediate
synonyms:
  - how to put divs side by side
  - why are my divs stacking vertically
  - what does display flex do
  - css make elements sit in a row
  - flexbox gap between items
  - css cards side by side
updated: 2026-07-17
---

# Flexbox: a row of cards

Three cards, stacked one under another, each stretching the full width of the
page. Nobody asked for that. It happens because a `<div>` is a *block* element,
and block means "take the whole line, push the next thing below me". Three
divs, three lines.

You want them side by side. The instinct is to do something to each card - and
that instinct is exactly what makes flexbox feel strange at first, because the
fix is not on the cards at all. It is on their parent.

Give the container `display: flex` and it stops stacking its children and lays
them out along a row instead. The cards themselves did not change. Their
container changed, so the rules for arranging them changed. That is the whole
shift: layout is a property of the parent, and the children just live inside
it.

A flex container also understands `gap`, which puts space *between* the
children and nowhere else - no space before the first card, none after the
last, nothing to subtract back off later.

**Your task:** the three cards are stacked. Make them sit side by side in a
row, with 16px of space between them. Style the container, `.cards` - not
`.card`.

**You'll practice:**

- Turning a parent into a flex container so its children lay out in a row
- Spacing children with `gap` instead of a margin on each one

```lesson
{
  "language": "html",
  "starterCode": "<style>\n  .card {\n    background: #eef2f7;\n    border-radius: 8px;\n    padding: 16px;\n  }\n</style>\n\n<div class=\"cards\">\n  <div class=\"card\">\n    <h3>Starter</h3>\n    <p>$0 a month</p>\n  </div>\n  <div class=\"card\">\n    <h3>Team</h3>\n    <p>$12 a month</p>\n  </div>\n  <div class=\"card\">\n    <h3>Business</h3>\n    <p>$40 a month</p>\n  </div>\n</div>\n",
  "solution": "<style>\n  .cards {\n    display: flex;\n    gap: 16px;\n  }\n  .card {\n    background: #eef2f7;\n    border-radius: 8px;\n    padding: 16px;\n  }\n</style>\n\n<div class=\"cards\">\n  <div class=\"card\">\n    <h3>Starter</h3>\n    <p>$0 a month</p>\n  </div>\n  <div class=\"card\">\n    <h3>Team</h3>\n    <p>$12 a month</p>\n  </div>\n  <div class=\"card\">\n    <h3>Business</h3>\n    <p>$40 a month</p>\n  </div>\n</div>\n",
  "checks": [
    { "name": "all three cards are still on the page", "selector": ".card", "count": true },
    { "name": "the cards sit side by side in a row", "selector": ".cards", "styles": ["display", "flex-direction"] },
    { "name": "there is 16px of space between the cards", "selector": ".cards", "styles": ["column-gap"] }
  ],
  "hints": [
    "The cards stack because each one is a block element claiming a whole line. Nothing you add to the .card rule changes who does the arranging - that job belongs to whatever contains them. So the rule you are missing is a new one, for .cards.",
    "Add a rule for .cards and give it display: flex. That alone drops the three cards into a row. They will be touching, though, so they also need air between them: a flex container takes a gap property, and the task asks for 16px of it.",
    "Add this rule above the .card rule: .cards { display: flex; gap: 16px; } - both declarations go on the container. Leave the .card rule exactly as it is."
  ]
}
```
