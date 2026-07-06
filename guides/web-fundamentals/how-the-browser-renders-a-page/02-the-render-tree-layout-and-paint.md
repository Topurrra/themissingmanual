---
title: "The Render Tree, Layout, and Paint"
guide: "how-the-browser-renders-a-page"
phase: 2
summary: "The DOM and CSSOM combine into a render tree of only the visible boxes, layout computes each box's exact size and position, and paint fills in the actual pixels."
tags: [browser, rendering, layout, paint, render-tree, css]
difficulty: intermediate
synonyms: ["what is the render tree", "display none vs visibility hidden", "what is reflow", "how does layout work in the browser"]
updated: 2026-07-06
---

# The Render Tree, Layout, and Paint

You've got a DOM tree and a CSSOM tree from Phase 1. Neither one, alone, is enough to draw anything - the
DOM doesn't know what's visible or where, and the CSSOM doesn't know what elements exist. The browser
combines them into something new, then does two more passes before a single pixel changes color.

## Building the render tree

**What it actually is.** The render tree is DOM nodes merged with their computed CSS, but with one
important filter: only nodes that will actually be visible on the page make it in.

**What it does in real life.** `<head>`, `<script>`, and `<meta>` tags never appear in the render tree -
they produce no visual box, so there's nothing to render. The same is true for any element styled with
`display: none`.

**The gotcha: `display: none` vs `visibility: hidden`.** These sound similar and behave nothing alike.

```css
.a { display: none; }
.b { visibility: hidden; }
```

`display: none` removes the element from the render tree entirely - it takes up no space, as if it
weren't in the document. `visibility: hidden` keeps the element in the render tree, gives it a box, sets
aside its layout space - it's invisible, nothing more. Toggle `display: none` off and the whole page around it
reflows. Toggle `visibility: hidden` off and nothing else moves, because the space was reserved the whole
time.

```console
$ # Both hide the element visually, but:
$ # display: none    → element has no box, siblings shift to fill the gap
$ # visibility: hidden → element keeps its box, siblings don't move
```

*What just happened:* there's no command to run here, but open DevTools on any page, toggle each property
on an element, and watch the layout. `display: none` collapses the space; `visibility: hidden` leaves a
hole exactly the element's size.

**Why this saves you later.** Reach for `visibility: hidden` (or `opacity: 0`, covered in Phase 3) when
you want to hide something without the rest of the page jumping around - a common need for tooltips,
tabs, and toggles where a layout shift would be jarring.

## Layout: computing the geometry

**What it actually is.** Layout (also called reflow) is the pass where the browser walks the render tree
and calculates the exact pixel position and size of every box - starting from the viewport width and
working down through every nested element's margins, padding, and content.

**What it does in real life.** A `<div>` with `width: 50%` has no actual size until layout runs the math:
50% of what? The browser has to know the parent's width first, which depends on its parent, all the way
up to the viewport. This is why layout is inherently a tree-wide calculation, not a per-element lookup.

**A real example.** Say you have:

```html
<div style="width: 400px;">
  <p style="width: 50%; padding: 10px;">Text</p>
</div>
```

Layout resolves the outer `div` to 400px wide (fixed), then resolves the `p` to 200px content width
(50% of 400px) plus 20px of padding, for a final box of 220px. Every box's final geometry depends on
boxes above it.

**The gotcha: layout is expensive precisely because it's not isolated.** Changing one box's width can
ripple through every box after it and every box nested inside it. The browser is efficient about
recalculating only what changed where it can, but a change near the root of a deep tree can force a
recalculation of most of the page.

**Why this saves you later.** Layout cost is why "changing an element's size or position" and "changing
its color" are not the same kind of operation to the browser - Phase 3 makes that difference concrete.

## Paint: filling in the pixels

**What it actually is.** Once every box has a final size and position, paint fills in the actual visual
detail inside each box - text, colors, borders, shadows, images - onto layers the browser will later
combine into the final image.

**What it does in real life.** Paint runs after layout, using the geometry layout already computed. It
doesn't decide where things go; it decides what they look like once they're already placed.

**Why this saves you later.** Not every visual change needs layout redone first. If a box's size and
position haven't changed - only its background color, say - the browser can skip straight to paint. That
distinction is the whole story of Phase 3.

## Recap

1. The render tree is the DOM merged with computed CSS, minus anything with no visual box (`<head>`, `display: none`).
2. `display: none` removes the box and its space; `visibility: hidden` keeps the space, hides the content.
3. Layout computes the exact size and position of every box, and one box's change can ripple through the tree.
4. Paint runs after layout, filling in colors, text, and borders using the geometry layout produced.

Check that the render tree and layout stuck before we get to which changes cost what.

```quiz
[
  {
    "q": "Which elements are excluded from the render tree?",
    "choices": ["Only elements with no text content", "Elements with no visual box, like <head> or display: none elements", "Elements styled with visibility: hidden"],
    "answer": 1,
    "explain": "The render tree only includes nodes that produce a visual box. visibility: hidden still gets a box; display: none does not."
  },
  {
    "q": "If you toggle an element from visibility: hidden to visible, what happens to the surrounding layout?",
    "choices": ["Everything around it shifts to make room", "Nothing shifts - the space was already reserved", "The whole page reloads"],
    "answer": 1,
    "explain": "visibility: hidden keeps the element's box in the render tree and its space reserved in layout, so making it visible again doesn't move anything else."
  },
  {
    "q": "What does the layout (reflow) pass calculate?",
    "choices": ["The colors and text rendering of each box", "The exact size and position of every box in the tree", "Which JavaScript event handlers to attach"],
    "answer": 1,
    "explain": "Layout walks the render tree and computes each box's final geometry - width, height, and position - which paint then uses to draw."
  }
]
```

---

[← Phase 1: Parsing: From Bytes to DOM and CSSOM](01-parsing-from-bytes-to-dom-and-cssom.md) · [Guide overview](_guide.md) · [Phase 3: Why Some Changes Are Expensive →](03-why-some-changes-are-expensive.md)
