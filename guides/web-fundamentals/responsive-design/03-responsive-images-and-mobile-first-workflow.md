---
title: "Responsive Images and Mobile-First Workflow"
guide: "responsive-design"
phase: 3
summary: "Serving the right image size with srcset/sizes, swapping images entirely with <picture>, and why writing CSS mobile-first (min-width up) beats desktop-first (max-width overrides down)."
tags: [css, html, srcset, picture, mobile-first, responsive-design, web-fundamentals]
difficulty: intermediate
synonyms: ["srcset sizes explained", "picture element art direction", "mobile first vs desktop first css", "responsive images html", "when to use srcset vs picture"]
updated: 2026-07-06
---

# Responsive Images and Mobile-First Workflow

A single 2400px-wide hero image looks great on a 4K monitor and wastes bandwidth on a phone that
displays it at 380px. Responsive images fix that by letting the browser pick a file size that matches
the screen. Then there's a second habit worth building alongside it: which direction you write your
media queries, because it changes how tangled your stylesheet gets.

## `srcset` and `sizes`: same image, different resolutions

Add each card in the layout an image, and provide multiple resolutions of the same picture:

```html
<img
  src="card-800.jpg"
  srcset="card-400.jpg 400w, card-800.jpg 800w, card-1200.jpg 1200w"
  sizes="(max-width: 600px) 100vw, 33vw"
  alt="Product photo">
```

- `srcset` lists candidate files with their real pixel width (`400w` means that file is 400px wide).
- `sizes` tells the browser how wide the image will actually render at different viewport widths -
  here, full viewport width below 600px (one card per row), or a third of the viewport above it (three
  cards per row).
- `src` is the fallback for browsers that don't support `srcset`.

The browser combines its own screen width and pixel density with `sizes` to pick the smallest `srcset`
candidate that still looks sharp, and downloads only that one file. Nothing to compute by hand - you
supply the options and the rendered size, the browser picks.

This solves a bandwidth problem, not a content problem: it's still fundamentally the same photo at
different resolutions.

## `<picture>`: swapping the image itself

Sometimes the fix isn't a smaller version of the same photo - it's a different crop or composition
entirely. A wide banner photo showing three people side by side reads fine on desktop, but on a phone,
shrunk down, faces disappear into a blur. That's **art direction**, and it needs `<picture>`:

```html
<picture>
  <source media="(max-width: 600px)" srcset="team-portrait-crop.jpg">
  <source media="(max-width: 1024px)" srcset="team-wide-crop.jpg">
  <img src="team-full.jpg" alt="The team at our office">
</picture>
```

The browser checks each `<source>` top to bottom and uses the first one whose `media` condition
matches, falling back to the `<img>` if none do. Below 600px it loads a tighter crop focused on faces;
between 600-1024px, a medium crop; above that, the full wide shot.

Rule of thumb: **`srcset`/`sizes` for the same image at different sizes (resolution switching);
`<picture>` when the image content itself should change (art direction).** Most product/card images
only need `srcset`. Hero banners and portraits often need `<picture>`.

## Mobile-first: write `min-width` and layer up

Two ways to structure a stylesheet with breakpoints. Desktop-first starts with the wide layout as the
default, then uses `max-width` queries to strip things down for smaller screens:

```css
.cards {
  display: flex;
  gap: 24px;
}

.card {
  width: 30%;
}

@media (max-width: 900px) {
  .card { width: 45%; }
}

@media (max-width: 600px) {
  .cards { flex-direction: column; }
  .card { width: 100%; }
}
```

Mobile-first flips it: the default styles target the smallest screen, and `min-width` queries add
complexity as the screen grows:

```css
.cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card {
  width: 100%;
}

@media (min-width: 600px) {
  .cards { flex-direction: row; flex-wrap: wrap; }
  .card { width: 45%; }
}

@media (min-width: 900px) {
  .card { width: 30%; gap: 24px; }
}
```

Both render the same result at every width. The difference shows up in how you think while writing
them. Desktop-first means every mobile fix is an override fighting the desktop default - you write a
rule, then write another rule to partially undo it, and the two live far apart in the file. Mobile-first
means each larger breakpoint only *adds* capability (more columns, more spacing) on top of a base that
already works everywhere, so there's less to undo and less to hold in your head at once.

Mobile-first also matches how phones actually load pages: a phone never has to parse and immediately
override desktop rules it will never use, since the base styles already target it.

This isn't a hard rule - a desktop-heavy internal dashboard where mobile is an afterthought can
reasonably go desktop-first. But for anything public-facing where phone traffic matters, mobile-first
tends to produce a shorter, less tangled stylesheet by the time the project has five breakpoints instead
of two.

Check your understanding of responsive images and mobile-first CSS:

```quiz
[
  {
    "q": "When should you reach for `<picture>` instead of `srcset`/`sizes`?",
    "choices": [
      "Whenever you have more than one image on the page",
      "When you need the actual image content to change (different crop or composition), not just resolution",
      "srcset and picture always do the same thing",
      "picture is only for background images in CSS"
    ],
    "answer": 1,
    "explain": "srcset/sizes serves the same image at different resolutions. picture swaps in a genuinely different image - art direction - based on conditions."
  },
  {
    "q": "In a mobile-first stylesheet, what do the base (non-media-query) styles target?",
    "choices": [
      "The widest screen the site supports",
      "The narrowest/smallest screen, with min-width queries adding complexity as width grows",
      "Whatever screen size the developer's monitor happens to be",
      "Print styles"
    ],
    "answer": 1,
    "explain": "Mobile-first means the default rules are the small-screen layout; min-width media queries layer on additional styling for larger viewports."
  },
  {
    "q": "Why does mobile-first tend to produce a less tangled stylesheet than desktop-first?",
    "choices": [
      "Because min-width queries execute faster in the browser than max-width queries",
      "Because each breakpoint only adds capability on top of a working base, instead of every mobile rule being an override fighting a desktop default",
      "Because mobile-first stylesheets don't need media queries at all",
      "There's no real difference - it's purely a style preference"
    ],
    "answer": 1,
    "explain": "Desktop-first requires override-on-override to strip a wide layout down; mobile-first only adds rules as space becomes available, which stays easier to follow as breakpoints multiply."
  }
]
```

## Where to go next

Responsive layout handles screen size, but not every visitor navigates by sight or with a mouse. Pair
this guide with [Accessibility From Day One](/guides/accessibility-from-day-one) to make sure the same
layout also works with keyboards, screen readers, and zoomed text.

---

[← Phase 2: Fluid Layouts](02-fluid-layouts.md) · [Guide overview](_guide.md)
