---
title: "Fix the bug: the margin that escapes"
guide: practice-html-css
phase: 11
summary: "A child's margin-top pushes its parent down instead of moving the child inside it, so the gap lands outside the box and the background never grows. Nothing errors. Find out why, and make the box hold its own."
tags: [css, margin-collapse, layout, debugging, box-model]
difficulty: advanced
synonyms:
  - why is my margin outside the div
  - css margin collapse explained
  - child margin pushes the parent down
  - margin-top not working inside a div
  - background does not cover the margin
  - how to stop margins from collapsing
updated: 2026-07-17
---

# Fix the bug: the margin that escapes

Two positive vertical margins that meet do not add up. They **collapse**: the
two become one, and the bigger one wins. A `margin-bottom: 16px` resting on a
`margin-top: 24px` gives you a 24px gap, not 40.

The same rule fires between a **parent and its first child**, and that is where
it bites. If nothing sits between the parent's top edge and the child's top
margin - no border, no padding, not one pixel - then the two are touching, so
they collapse into a single margin *on the parent*. The child's `margin-top`
stops being the child's. It moves the parent instead.

That reads as two bugs at once. The gap turns up on the wrong side of the
parent's background, and the parent's box never grows, because a margin it does
not contain cannot make it taller. CSS has no complaint to make about any of
it - you just get a box with its text jammed against its own top edge.

The note below should have 24px of yellow above its title. Look at the preview:
the yellow starts at the text, and the 24px is out on the grey instead, where it
swallowed the h1's 16px as it went past.

**Your task:** make the note contain that 24px, so the yellow box grows to hold
it. Leave `.note h2 { margin: 24px 0 0 0; }` exactly as it is - the title's
margin is right, so the fix belongs on `.note`.

**You'll practice:**

- Reading a gap that landed outside a box as a collapsed margin
- Giving a parent something that keeps its child's margin inside

```lesson
{
  "language": "html",
  "starterCode": "<style>\n  body { margin: 0; padding: 24px; background: #f2f4f7; font-family: system-ui, sans-serif; }\n  h1   { margin: 0 0 16px 0; font-size: 24px; }\n\n  /* The note's title should have 24px of yellow above it. */\n  .note    { width: 320px; background: #fff3cd; }\n  .note h2 { margin: 24px 0 0 0; font-size: 18px; }\n  .note p  { margin: 0; font-size: 14px; }\n</style>\n\n<h1>Deploy checklist</h1>\n\n<div class=\"note\">\n  <h2>Before you deploy</h2>\n  <p>Run the migration first.</p>\n</div>\n",
  "solution": "<style>\n  body { margin: 0; padding: 24px; background: #f2f4f7; font-family: system-ui, sans-serif; }\n  h1   { margin: 0 0 16px 0; font-size: 24px; }\n\n  /* The note's title should have 24px of yellow above it. */\n  .note    { width: 320px; background: #fff3cd; display: flow-root; }\n  .note h2 { margin: 24px 0 0 0; font-size: 18px; }\n  .note p  { margin: 0; font-size: 14px; }\n</style>\n\n<h1>Deploy checklist</h1>\n\n<div class=\"note\">\n  <h2>Before you deploy</h2>\n  <p>Run the migration first.</p>\n</div>\n",
  "checks": [
    { "name": "the note still shows its title", "selector": ".note h2", "count": true, "text": true },
    { "name": "the 24px above the title sits inside the note, so its box grows to hold it", "selector": ".note", "styles": ["height"] }
  ],
  "hints": [
    "The 24px is not lost. It left the h2 and became the note's own top margin, which is why it draws above the yellow instead of inside it. Two margins collapse only while they are touching, so ask what is currently between the note's top edge and the h2's margin. Nothing is.",
    "Put anything between them and they stop touching. A pixel of padding on .note does it, and so does a border. There is also a display value that means 'this box contains its own layout' - it stops the collapse without adding a pixel of its own.",
    "Add display: flow-root to the .note rule, so it reads .note { width: 320px; background: #fff3cd; display: flow-root; } - the box now contains its own flow, margins included. padding: 1px 0, border-top: 1px solid #f0e0a0, or overflow: auto on .note all work too, for the same reason: each one puts something between the note's top edge and the h2's margin."
  ]
}
```
