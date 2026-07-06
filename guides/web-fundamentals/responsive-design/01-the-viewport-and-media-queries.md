---
title: "The Viewport and Media Queries"
guide: "responsive-design"
phase: 1
summary: "The viewport meta tag stops mobile browsers from rendering a shrunk-down desktop page, and @media queries let you apply different CSS at different screen widths."
tags: [css, viewport, media-queries, responsive-design, web-fundamentals]
difficulty: intermediate
synonyms: ["viewport meta tag explained", "why is my site zoomed out on mobile", "css media query syntax", "common breakpoints css", "meta name viewport content width"]
updated: 2026-07-06
---

# The Viewport and Media Queries

Load a page without the viewport tag on a phone and you get a tiny, zoomed-out version of the desktop
layout - text you have to pinch to read. That single missing line is one of the most common beginner
bugs in web development, and it has nothing to do with your CSS.

## Why phones fake a wide screen

Phone screens are physically narrow, but most sites in the early 2010s were built for desktop widths
around 980px. If phone browsers rendered pages at the phone's actual pixel width, every one of those
sites would break - text would wrap after three words, three-column layouts would collapse into
unreadable slivers.

Mobile browsers solved this by lying. By default, a phone browser renders the page as if the screen were
980px wide, then shrinks the whole result down to fit the physical screen. You get a legible-looking
miniature of the desktop page, zoomed out. That's why unstyled or improperly configured pages look "zoomed
out" on a phone: the browser rendered a wide virtual canvas and shrank it, rather than laying out content
at the screen's real width.

## The fix: `<meta name="viewport">`

Add this to every page's `<head>`:

```html
<meta name="viewport" content="width=device-width, initial-scale=1">
```

- `width=device-width` tells the browser to use the screen's actual CSS pixel width as the layout
  viewport, instead of the fake 980px canvas.
- `initial-scale=1` sets the initial zoom level to 1:1 - no zooming in or out on load.

Without this tag, every media query you write below is close to useless: the browser is still laying
out the page at 980px virtual width, so a `max-width: 600px` query never matches on a phone, no matter
how narrow the physical screen is. This tag is not optional for a responsive page - it's the
prerequisite that makes media queries mean anything on mobile.

## Media query syntax

A media query wraps CSS rules in a condition. The browser applies the rules only when the condition
matches:

```css
@media (max-width: 600px) {
  .card {
    width: 100%;
  }
}
```

This says: when the viewport is 600px wide or narrower, make `.card` full width. Outside a matching
query, the rule inside it doesn't apply at all.

You can query on `min-width`, `max-width`, or combine conditions:

```css
@media (min-width: 600px) and (max-width: 899px) {
  /* applies only between 600px and 899px */
}
```

`min-width` means "this wide or wider"; `max-width` means "this wide or narrower." Media queries also
support orientation (`orientation: landscape`) and other conditions, but width is what you'll use for
almost every layout decision.

## The running example: a 3-column card layout

Say you're building a pricing page with three cards side by side:

```html
<div class="cards">
  <div class="card">Basic</div>
  <div class="card">Pro</div>
  <div class="card">Team</div>
</div>
```

```css
.cards {
  display: flex;
  gap: 16px;
}

.card {
  flex: 1;
  padding: 24px;
  border: 1px solid #ddd;
}
```

Three flexible columns, evenly split. On a desktop this looks fine. On a 375px phone, three columns
squeezed into that width means each card is roughly 100px wide - the padding alone eats most of it, and
any real content wraps into an unreadable mess.

A media query fixes the narrow case:

```css
@media (max-width: 600px) {
  .cards {
    flex-direction: column;
  }
}
```

Below 600px, the cards stack vertically instead of squeezing into three columns. Above 600px, the
default row layout stands. This is the pattern you'll repeat constantly: define the normal layout, then
override it inside a media query for the width range where it breaks.

## Choosing breakpoints

Common breakpoint numbers show up everywhere: 480px (small phones), 768px (tablets), 1024px
(small laptops), 1280px (desktop). These are reasonable starting points, not a spec to memorize or
match to any real device catalog - device sizes vary too much for that to matter.

The actual rule: **resize your own browser window and add a breakpoint wherever your own content starts
looking bad.** If the three-card row gets cramped at 700px, that's your breakpoint - not 768px because a
list said so. Content-driven breakpoints track what you actually built; device-driven ones drift out of
date the moment a new screen size ships.

Check your understanding of the viewport tag and media queries:

```quiz
[
  {
    "q": "Why does a page look tiny and zoomed out on a phone without the viewport meta tag?",
    "choices": [
      "The phone's screen resolution is too low to render CSS",
      "The browser lays out the page at a wide virtual width (like 980px) and shrinks the result to fit the screen",
      "Media queries are disabled by default on mobile browsers",
      "The phone ignores the CSS file entirely without the tag"
    ],
    "answer": 1,
    "explain": "Mobile browsers default to a wide virtual layout viewport for compatibility with old desktop-only sites, then zoom the result out to fit the physical screen."
  },
  {
    "q": "What does `@media (max-width: 600px) { ... }` mean?",
    "choices": [
      "Apply these rules only when the viewport is exactly 600px wide",
      "Apply these rules when the viewport is 600px wide or narrower",
      "Apply these rules when the viewport is 600px wide or wider",
      "Apply these rules only on mobile devices, regardless of width"
    ],
    "answer": 1,
    "explain": "max-width matches at or below the given width. min-width is the opposite: at or above."
  },
  {
    "q": "Where should breakpoint values actually come from?",
    "choices": [
      "A fixed industry standard that never changes",
      "Wherever your own content starts to break, found by resizing the browser",
      "The exact pixel width of the most popular phone model",
      "Whatever number a CSS framework hardcodes"
    ],
    "answer": 1,
    "explain": "Common numbers like 768px are reasonable starting guesses, but the real signal is your own layout breaking at a given width."
  }
]
```

---

[Guide overview](_guide.md) · [Phase 2: Fluid Layouts →](02-fluid-layouts.md)
