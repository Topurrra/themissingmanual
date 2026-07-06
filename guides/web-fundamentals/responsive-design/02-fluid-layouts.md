---
title: "Fluid Layouts"
guide: "responsive-design"
phase: 2
summary: "Building layouts from relative units and wrapping Flexbox/Grid instead of fixed pixel widths, plus clamp() for typography and spacing that scale continuously without extra media queries."
tags: [css, fluid-layout, clamp, flexbox, grid, responsive-design, web-fundamentals]
difficulty: intermediate
synonyms: ["css clamp function explained", "fluid typography css", "relative units vs pixels css", "flex-wrap responsive cards", "fixed width vs fluid layout"]
updated: 2026-07-06
---

# Fluid Layouts

Media queries fix specific breakpoints, but they're patches on top of a layout that's fundamentally
rigid. A fluid layout bends on its own between breakpoints, so you need fewer of them. The tool is
simple: stop hardcoding pixel widths, and let the browser do the flexing.

## The problem with fixed pixels

Here's the card layout from Phase 1, but built the way a lot of beginners first reach for it - fixed
widths instead of `flex: 1`:

```css
.cards {
  display: flex;
  gap: 16px;
}

.card {
  width: 300px;
  padding: 24px;
  border: 1px solid #ddd;
}
```

Three cards at `300px` plus gaps need at least 964px of space. On a 1440px desktop, fine. On a 375px
phone, the cards don't shrink - they overflow, and the whole page grows a horizontal scrollbar. The
browser won't compress a fixed width to fit; content spills past the viewport edge instead.

## The fix: relative units and wrapping

Swap fixed widths for flexible ones:

```css
.cards {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.card {
  flex: 1 1 280px;
  padding: 24px;
  border: 1px solid #ddd;
}
```

`flex: 1 1 280px` means: grow to fill space, shrink if needed, but use 280px as the natural starting
size. Combined with `flex-wrap: wrap`, cards that no longer fit on one row drop to the next row instead
of overflowing. At 1440px you get three cards per row; around 900px, two; below 600px, one per row -
all without writing a single media query. Grid does the same job with `repeat(auto-fit, minmax(280px, 1fr))`
on `grid-template-columns`, which wraps columns automatically as space runs out.

This is the core habit: reach for units and layout modes that respond to available space before reaching
for a breakpoint. Media queries still matter for bigger structural changes (Phase 1's stacked-column
example), but fluid layout should handle the small adjustments on its own.

## Relative units over `px`

| Unit | Relative to | Good for |
|------|-------------|----------|
| `%` | Parent element's size | Widths inside a flexible container |
| `rem` | Root (`html`) font size | Font sizes, spacing - scales if the user changes browser font size |
| `em` | Current element's font size | Spacing that should scale with local text size |
| `vw`/`vh` | Viewport width/height | Full-bleed sections, fluid type (see below) |

A card grid built with `padding: 24px` ignores a user who bumped their browser's default font size for
readability. `padding: 1.5rem` (24px at the default 16px root size) scales with that setting. Pixels
aren't banned - border widths and small fixed details are fine in `px` - but layout dimensions and type
should default to relative units.

## `clamp()` for fluid values without breakpoints

`clamp(min, preferred, max)` picks a value that scales smoothly between a floor and a ceiling:

```css
h2 {
  font-size: clamp(1.25rem, 4vw, 2rem);
}
```

Below the width where `4vw` equals `1.25rem`, the font size stays at the `1.25rem` floor. Above the
width where `4vw` hits `2rem`, it caps there. In between, the size scales continuously with viewport
width - no jump at a breakpoint, no separate rule for tablet.

Apply the same idea to spacing:

```css
.cards {
  gap: clamp(8px, 2vw, 24px);
}

.card {
  padding: clamp(16px, 3vw, 32px);
}
```

Gaps and padding shrink on small screens and grow on large ones, continuously, with one line each.

## Before and after: the full card layout

Fixed-width version - breaks below ~964px, overflows on phones:

```css
.cards {
  display: flex;
  gap: 16px;
}

.card {
  width: 300px;
  padding: 24px;
  border: 1px solid #ddd;
}

.card h3 {
  font-size: 24px;
}
```

Fluid version - wraps at any width, spacing and type scale on their own:

```css
.cards {
  display: flex;
  flex-wrap: wrap;
  gap: clamp(8px, 2vw, 24px);
}

.card {
  flex: 1 1 280px;
  padding: clamp(16px, 3vw, 32px);
  border: 1px solid #ddd;
}

.card h3 {
  font-size: clamp(1.1rem, 3vw, 1.5rem);
}
```

Same three cards, same visual intent, but the second version needs zero media queries to survive the
jump from a 320px phone to a 1920px monitor. You'd still add a media query for a structural change -
say, hiding a sidebar entirely below 700px - but the day-to-day sizing is handled by the layout itself.

Check your understanding of fluid layout:

```quiz
[
  {
    "q": "Why does a flex item with `width: 300px` cause a horizontal scrollbar on a narrow phone screen?",
    "choices": [
      "Fixed widths automatically convert to percentages on small screens",
      "The browser refuses to shrink a fixed width below its set value, so content overflows the viewport",
      "Phones ignore the width property entirely",
      "flex-wrap is required for width to work at all"
    ],
    "answer": 1,
    "explain": "A fixed pixel width is a hard floor - the browser won't compress it, so if three of them don't fit, the layout overflows instead of shrinking."
  },
  {
    "q": "What does `clamp(1.25rem, 4vw, 2rem)` do?",
    "choices": [
      "Always renders the font at exactly 4vw",
      "Picks whichever value is smallest",
      "Scales the value with viewport width, but never below 1.25rem or above 2rem",
      "Applies 1.25rem on mobile and 2rem on desktop with no in-between"
    ],
    "answer": 2,
    "explain": "clamp(min, preferred, max) scales continuously between the floor and ceiling, using the preferred value when it falls in range."
  },
  {
    "q": "Which combination lets a row of cards wrap onto a new line automatically as space runs out?",
    "choices": [
      "display: block with fixed widths",
      "flex-wrap: wrap with a flex-basis like flex: 1 1 280px",
      "position: absolute on each card",
      "A media query for every possible screen width"
    ],
    "answer": 1,
    "explain": "flex-wrap: wrap plus a flexible basis lets items reflow onto new rows without any breakpoint-specific CSS."
  }
]
```

---

[← Phase 1: The Viewport and Media Queries](01-the-viewport-and-media-queries.md) · [Guide overview](_guide.md) · [Phase 3: Responsive Images and Mobile-First Workflow →](03-responsive-images-and-mobile-first-workflow.md)
