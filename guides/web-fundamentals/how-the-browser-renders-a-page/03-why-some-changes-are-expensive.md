---
title: "Why Some Changes Are Expensive"
guide: "how-the-browser-renders-a-page"
phase: 3
summary: "Changing geometry re-runs layout, paint, and composite; changing color skips layout; changing transform or opacity can skip both and run on the compositor thread, which is why they're the go-to properties for smooth animation."
tags: [browser, performance, reflow, repaint, compositor, animation]
difficulty: intermediate
synonyms: ["why is my css animation laggy", "reflow vs repaint vs composite", "why animate transform instead of left", "what causes layout thrashing"]
updated: 2026-07-06
---

# Why Some Changes Are Expensive

You've seen layout and paint in Phase 2. Here's the payoff: not every style change triggers both. Which
pipeline stages re-run depends entirely on which CSS property you touch - and that difference is why one
animation stutters while another feels free.

## The three tiers of cost

**What it actually is.** After the initial render, any DOM or style change re-triggers some subset of
layout, paint, and composite (the step that assembles painted layers into the final image on screen,
often on the GPU). Which subset depends on the property changed.

**Tier 1 - geometry changes trigger everything.** `width`, `height`, `top`, `left`, `margin`, `padding` -
anything that can change a box's size or position - forces layout to re-run, which invalidates the
affected paint, which has to be re-composited.

```css
.box { left: 0; }
.box.moved { left: 200px; }
```

Animating `left` means every frame re-runs layout for that box (and potentially its neighbors), repaints
it, and recomposites. On a complex page, that's real work happening 60 times a second.

**Tier 2 - paint-only changes skip layout.** `background-color`, `color`, `box-shadow`, `border-color` -
anything that changes appearance without changing size or position - skips layout entirely and goes
straight to paint, then composite.

```css
.box { background-color: blue; }
.box:hover { background-color: red; }
```

No geometry changed, so layout has nothing to recalculate. Cheaper than Tier 1, but still repaints pixels
every frame if animated.

**Tier 3 - `transform` and `opacity` can skip both.** These two properties are the browser's fast path.
Modern browsers can promote an element to its own compositor layer and handle `transform` and `opacity`
changes entirely on the compositor thread - no layout, no paint, only the GPU repositioning or fading an
already-painted layer.

```css
.box { transform: translateX(0); }
.box.moved { transform: translateX(200px); }
```

Visually, this achieves the same slide as animating `left` - but the browser never touches layout or
paint to do it. That's why `transform`/`opacity` are the standard advice for smooth CSS animations:
they're the only properties with a realistic path to running entirely off the main thread.

**Why this saves you later.** When an animation feels janky in DevTools' Performance tab and you see
purple (layout) and green (paint) bars on every frame, the fix is usually swapping a geometry property
for its `transform` equivalent - `left`/`top` becomes `translate()`, `width`/`height` scaling becomes
`scale()`.

## Layout thrashing: the trap you can cause in JavaScript

**What it actually is.** Reading a layout-dependent property (like `offsetHeight` or `getBoundingClientRect()`)
forces the browser to run any pending layout immediately, instead of waiting for its normal schedule.
Interleave reads and writes in a loop, and you force layout to run over and over in the same frame.

**A real example.**

```js
// Bad: forces layout on every iteration
boxes.forEach(box => {
  box.style.width = box.offsetWidth + 10 + 'px'; // read, then write, then read again next loop
});
```

Each `.offsetWidth` read after a `.style.width` write forces the browser to recalculate layout right then,
because it can't answer "what's the width now?" without running the math first. With a hundred boxes,
that's a hundred forced layouts in one loop - "layout thrashing."

```js
// Good: batch all reads, then all writes
const widths = boxes.map(box => box.offsetWidth); // all reads first
boxes.forEach((box, i) => {
  box.style.width = widths[i] + 10 + 'px'; // then all writes
});
```

*What just happened:* separating reads from writes lets the browser do one layout pass for all the reads,
then one for all the writes, instead of alternating and recalculating every iteration.

**Why this saves you later.** This pattern - read everything, then write everything - is the single
biggest lever you control in your own code for keeping layout cost predictable. Libraries like FastDOM
automate the batching, but the underlying rule is one you can apply by hand.

## Recap

1. Geometry properties (`width`, `left`, `margin`) trigger layout, paint, and composite - the full pipeline.
2. Paint-only properties (`background-color`, `box-shadow`) skip layout but still repaint.
3. `transform` and `opacity` can skip both layout and paint, running on the compositor thread alone.
4. Reading layout properties (`offsetWidth`) after writing styles forces synchronous layout - batch reads before writes to avoid layout thrashing.

One more check before you go - which properties actually determine an animation's cost.

```quiz
[
  {
    "q": "Why are transform and opacity the recommended properties for smooth animation?",
    "choices": ["They're newer CSS properties", "They can run entirely on the compositor thread, skipping layout and paint", "They use less CSS syntax"],
    "answer": 1,
    "explain": "Browsers can promote an element to its own layer and animate transform/opacity purely on the compositor, without re-running layout or paint."
  },
  {
    "q": "What causes 'layout thrashing' in JavaScript?",
    "choices": ["Using too many CSS classes", "Interleaving layout reads (like offsetWidth) with style writes in a loop", "Animating opacity instead of transform"],
    "answer": 1,
    "explain": "Each read of a layout-dependent property after a write forces the browser to run layout immediately, and alternating reads/writes in a loop forces it repeatedly."
  },
  {
    "q": "Animating background-color instead of left is cheaper because it:",
    "choices": ["Skips layout but still repaints", "Skips both layout and paint", "Skips composite only"],
    "answer": 0,
    "explain": "background-color doesn't change any box's size or position, so layout is skipped - but the pixels still need repainting."
  }
]
```

Where to go next: this guide covered the rendering pipeline itself. For turning that knowledge into
measurable page-speed improvements - Core Web Vitals, loading strategy, and what to prioritize -
see [Web Performance & Core Web Vitals](/guides/web-performance-core-web-vitals). To make sure your
layouts hold up across screen sizes without triggering unnecessary reflows, see
[Responsive Design](/guides/responsive-design).

---

[← Phase 2: The Render Tree, Layout, and Paint](02-the-render-tree-layout-and-paint.md) · [Guide overview](_guide.md)
