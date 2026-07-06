---
title: "Flexbox and Grid"
guide: "flexbox-and-grid"
phase: 0
summary: "The two CSS layout systems that replaced floats and hacks: Flexbox for rows and columns, Grid for full two-dimensional layouts, and how to pick between them."
tags: [css, flexbox, grid, layout, web-fundamentals, intermediate]
category: web-fundamentals
order: 4
difficulty: intermediate
synonyms: ["flexbox vs grid", "css flexbox tutorial", "css grid tutorial", "how to center a div", "how to build a navbar with css", "responsive grid layout css", "when to use flexbox vs grid"]
updated: 2026-07-06
---

# Flexbox and Grid

Before Flexbox and Grid, lining up boxes in CSS meant floats, `inline-block` hacks, and table layouts
abused for their alignment behavior. Centering something vertically was a running joke. Flexbox (2015)
and Grid (2017) fixed this properly: two purpose-built layout systems that handle alignment, spacing,
and responsiveness without a single hack.

This guide assumes you know the box model and `position` from [CSS Without Tears](/guides/css-without-tears).
It builds the layouts you'll actually use: navbars, card rows, dashboards, photo galleries, and the
classic "holy grail" page layout.

## The phases

1. **[Flexbox: One-Dimensional Layout](01-flexbox-one-dimensional-layout.md)** - `display: flex`, the
   main axis and cross axis, `justify-content`/`align-items`, wrapping, and growing/shrinking items.
   Builds a navbar and a row of equal-width cards.
2. **[CSS Grid: Two-Dimensional Layout](02-css-grid-two-dimensional-layout.md)** - `display: grid`,
   defining columns and rows, `grid-template-areas`, and spanning cells. Builds a dashboard layout and
   a responsive photo gallery.
3. **[Choosing Between Them (and Combining Them)](03-choosing-between-them-and-combining-them.md)** -
   the one-dimension-vs-two-dimension rule of thumb, and a holy grail layout that uses both together.

By the end you'll reach for the right tool instead of fighting the wrong one.
