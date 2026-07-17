---
title: "Centring a box: the one everyone googles"
guide: practice-html-css
phase: 7
summary: "The two tools everyone tries first each do half the job. Flexbox centres on both axes with two properties - and quietly swaps which one is which when the direction changes."
tags: [css, flexbox, centering, layout, justify-content, align-items]
difficulty: intermediate
synonyms:
  - how to center a div
  - center a div vertically and horizontally
  - css vertical centering
  - justify-content vs align-items
  - why does align-items not work
  - flexbox centering both axes
updated: 2026-07-17
---

# Centring a box: the one everyone googles

"How do I centre a div" is the oldest joke in CSS, and it was a fair question.
The two tools everyone reaches for first each do half the job.

`text-align: center` only moves **inline** content - text, links, images -
inside a box. Put it on the container and the words inside the card shuffle
over; the card itself does not move. `margin: 0 auto` does move the box, but
only sideways: an auto left or right margin splits the leftover horizontal
space, while an auto top or bottom margin in normal flow just resolves to zero.
There was no vertical equivalent, so people stacked hacks - absolute
positioning plus negative margins, a table cell, a ghost element - because the
language had no way to say "put this in the middle".

Flexbox says it in two properties. Make the parent a flex container and it
gains a **main axis** and a **cross axis**:

- `justify-content` places children along the main axis
- `align-items` places them across the cross axis

By default the main axis runs left to right, so `justify-content: center` is
your horizontal control and `align-items: center` is your vertical one. Add
`flex-direction: column` and the axes rotate with it: now `justify-content`
centres vertically and `align-items` centres horizontally. Neither property
changed meaning - the axes turned underneath them. That swap is why centring
feels random to anyone who memorised the row case as "justify means across".

**Your task:** the hero band is 320px tall and the sign-up card is stuck in its
top-left corner. Make `.hero` place the card dead centre, across and down. The
rules go on the parent, not the card.

**You'll practice:**

- Making a parent a flex container so it can place its children
- Picking between justify-content and align-items by naming the axis you mean

```lesson
{
  "language": "html",
  "starterCode": "<style>\n  body { margin: 0; font-family: system-ui, sans-serif; }\n\n  .hero {\n    height: 320px;\n    background: #eef2f7;\n  }\n\n  .card {\n    width: 240px;\n    padding: 24px;\n    background: #fff;\n    border: 1px solid #d7dee7;\n    border-radius: 8px;\n    text-align: center;\n  }\n</style>\n\n<div class=\"hero\">\n  <div class=\"card\">\n    <h2>Start free</h2>\n    <p>No card needed.</p>\n  </div>\n</div>\n",
  "solution": "<style>\n  body { margin: 0; font-family: system-ui, sans-serif; }\n\n  .hero {\n    height: 320px;\n    background: #eef2f7;\n    display: flex;\n    justify-content: center;\n    align-items: center;\n  }\n\n  .card {\n    width: 240px;\n    padding: 24px;\n    background: #fff;\n    border: 1px solid #d7dee7;\n    border-radius: 8px;\n    text-align: center;\n  }\n</style>\n\n<div class=\"hero\">\n  <div class=\"card\">\n    <h2>Start free</h2>\n    <p>No card needed.</p>\n  </div>\n</div>\n",
  "checks": [
    { "name": "the card is still inside the hero", "selector": ".hero .card", "count": true },
    { "name": "the card sits dead centre of the hero, across and down", "selector": ".hero", "styles": ["display", "justify-content", "align-items"] }
  ],
  "hints": [
    "text-align and margin auto are the two things everyone tries first, and neither one centres a box down the page. The rules you need go on .hero, not on .card - a parent is what places its children.",
    "Give .hero display: flex. On its own that barely changes what you see, but it hands .hero a main axis (left to right by default) and a cross axis (top to bottom), which is what the next two properties talk about.",
    "Add all three rules to .hero: display: flex; justify-content: center; align-items: center. With the default row direction, justify-content centres across and align-items centres down. Swap in flex-direction: column and those two trade jobs, which centres the card just as well."
  ]
}
```
