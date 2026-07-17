---
title: "CSS Grid: Two-Dimensional Layout"
guide: "flexbox-and-grid"
phase: 3
summary: "How display: grid lays out rows and columns together, using grid-template-columns/rows, gap, named grid-template-areas, and spanning, to build a dashboard layout and a responsive photo gallery."
tags: [css, grid, grid-template-columns, grid-template-areas, gap, responsive]
difficulty: intermediate
synonyms: ["css grid tutorial", "grid-template-areas explained", "how to build a dashboard layout css", "responsive gallery css grid", "auto-fit minmax explained", "grid-column span"]
updated: 2026-07-06
---

# CSS Grid: Two-Dimensional Layout

Flexbox handles one direction at a time. Grid handles rows *and* columns together, as a single
layout - which is what you actually want for a page skeleton: a header across the top, a sidebar down
one side, a footer across the bottom, all defined at once instead of nested flex containers fighting
each other.

With Flexbox, getting a sidebar to line up with a header above it and a footer below it means
carefully matching widths across three separate flex containers that don't know about each other.
Grid defines all three regions as one layout, so they can't drift out of alignment - they're cells in
the same table-like structure, not three unrelated rows guessing at the same width.

## Turning it on

```css
.dashboard {
  display: grid;
  grid-template-columns: 200px 1fr;
  grid-template-rows: auto 1fr auto;
}
```

Every direct child becomes a **grid item**, placed into the cells this creates - by default, in source
order, left to right, top to bottom.

## Defining columns and rows

`grid-template-columns` and `grid-template-rows` take a list of sizes, one per track:

```css
.layout {
  display: grid;
  grid-template-columns: 200px 1fr 100px; /* three columns */
  grid-template-rows: 80px auto;          /* two rows */
}
```

The unit to know is **`fr`** (fraction) - it divides *leftover* space after fixed-size tracks are
subtracted, similar in spirit to `flex-grow`. `1fr 1fr 1fr` is three equal columns; `200px 1fr` is a
fixed sidebar plus a column that eats everything else.

`repeat()` avoids repeating yourself:

```css
grid-template-columns: repeat(3, 1fr); /* same as 1fr 1fr 1fr */
```

**`gap`** puts consistent space between tracks, no margin hacks on edge items:

```css
.layout {
  display: grid;
  gap: 1rem;
}
```

## Naming the layout: grid-template-areas

The most readable way to build a page skeleton is naming regions and drawing the layout as ASCII art
directly in your CSS:

```css
.dashboard {
  display: grid;
  grid-template-columns: 220px 1fr;
  grid-template-rows: 70px 1fr 50px;
  grid-template-areas:
    "header  header"
    "sidebar main"
    "footer  footer";
  gap: 1rem;
  min-height: 100vh;
}

.header  { grid-area: header; }
.sidebar { grid-area: sidebar; }
.main    { grid-area: main; }
.footer  { grid-area: footer; }
```

```html
<div class="dashboard">
  <header class="header">Dashboard</header>
  <nav class="sidebar">Nav</nav>
  <main class="main">Content</main>
  <footer class="footer">Footer</footer>
</div>
```

*What just happened:* `grid-template-areas` is a literal picture of the layout - "header" spans both
columns on row one, "sidebar" and "main" split row two, "footer" spans both columns on row three.
Each child is placed by name with `grid-area`, not by counting rows and columns. Read the CSS, see the
page.

💡 **Key point.** This is the single biggest readability win Grid has over Flexbox. Six months from
now, `grid-template-areas` still reads like a floor plan. Nested flex containers reconstructing the
same layout do not.

## Spanning cells: grid-column and grid-row

An item can span multiple tracks with `grid-column` / `grid-row`, using `span`:

```css
.featured-photo {
  grid-column: span 2; /* takes up two columns instead of one */
  grid-row: span 2;    /* and two rows */
}
```

This is how a "featured" item in a grid of photos or cards gets to be visibly bigger than its
neighbors while everything else still auto-places around it. You don't have to hand-place every other
item either - only the spanning one needs an explicit rule. Grid's auto-placement algorithm flows the
rest into whatever cells are left, in source order, exactly like it would without any spanning at all.

## Build it: a responsive photo gallery

The pattern for "as many equal-width columns as fit, wrapping automatically, no media queries":

```css
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
}
```

```html
<div class="gallery">
  <img src="a.jpg" alt="" />
  <img src="b.jpg" alt="" />
  <img src="c.jpg" alt="" />
  <!-- more images -->
</div>
```

*What just happened:* `minmax(180px, 1fr)` tells each column "never shrink below 180px, but grow to
fill available space." `auto-fit` computes how many 180px+ columns fit the container width and
generates exactly that many tracks - four on a wide screen, two on a tablet, one on a phone - with zero
`@media` rules. Resize the browser and watch columns appear and disappear on their own.

⚠️ **Gotcha - `auto-fit` vs `auto-fill`.** `auto-fit` collapses empty tracks to `0px` and lets existing
items stretch to fill the row, which is what you want for a gallery. `auto-fill` keeps empty tracks at
their minimum size (visible gaps, items don't stretch) - useful only when you specifically want
placeholder-style blank columns.

Lock in the two properties before moving on:

```quiz
[
  {
    "q": "What does grid-template-areas let you do that raw grid-template-columns/rows doesn't as directly?",
    "choices": ["Add animations to grid items", "Draw the layout as named regions that read like a floor plan", "Make the grid responsive automatically", "Skip using display: grid entirely"],
    "answer": 1,
    "explain": "grid-template-areas names each region and lays it out as ASCII art, so the CSS visually matches the page structure."
  },
  {
    "q": "grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)) produces what kind of layout?",
    "choices": ["A fixed 3-column grid regardless of screen size", "As many 180px-minimum columns as fit the container, wrapping automatically", "A single column on all screen sizes", "A grid that requires JavaScript to resize"],
    "answer": 1,
    "explain": "auto-fit calculates how many minmax-sized tracks fit the available width and generates that many columns, with 1fr letting them stretch to fill the row."
  },
  {
    "q": "What does grid-column: span 2 do to a grid item?",
    "choices": ["Moves it to column 2", "Makes it occupy two columns instead of one", "Duplicates it into two items", "Hides it on screens narrower than 2 columns"],
    "answer": 1,
    "explain": "span 2 tells the item to stretch across two column tracks, letting it sit visibly larger than single-column siblings."
  }
]
```

---

[← Phase 2: When a Flex Item Won't Shrink](02-when-a-flex-item-wont-shrink.md) · [Guide overview](_guide.md) · [Phase 4: Choosing Between Them (and Combining Them) →](04-choosing-between-them-and-combining-them.md)
