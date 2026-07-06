---
title: "Responsive Design"
guide: "responsive-design"
phase: 0
summary: "How to build a layout that works from a phone screen to a desktop monitor: the viewport meta tag, media queries, fluid units, and responsive images."
tags: [css, responsive-design, media-queries, mobile-first, web-fundamentals, intermediate]
category: web-fundamentals
order: 8
difficulty: intermediate
synonyms: ["how to make a website responsive", "css media queries tutorial", "mobile first css", "viewport meta tag explained", "responsive images srcset", "why does my site look zoomed in on mobile"]
updated: 2026-07-06
---

# Responsive Design

A page that looks right on your laptop can look broken on a phone: text too small to read, or so huge you
scroll sideways to finish a sentence. Responsive design is the set of techniques that make one HTML/CSS
codebase adapt to whatever screen loads it, instead of shipping a separate "mobile site."

This guide assumes you're comfortable with CSS, Flexbox, and Grid from [Flexbox and Grid](/guides/flexbox-and-grid).
The running example is a 3-column card layout - a common pattern for pricing tables, product grids, and
blog previews - taken from a fixed-width layout that breaks on a phone to a fluid one that doesn't.

## The phases

1. **[The Viewport and Media Queries](01-the-viewport-and-media-queries.md)** - the meta tag that stops
   mobile browsers from faking a desktop screen, and `@media` queries for applying CSS conditionally.
2. **[Fluid Layouts](02-fluid-layouts.md)** - relative units, wrapping Flexbox/Grid, and `clamp()` for
   typography and spacing that scale without extra breakpoints.
3. **[Responsive Images and Mobile-First Workflow](03-responsive-images-and-mobile-first-workflow.md)** -
   `srcset`/`sizes`, `<picture>` for art direction, and why writing mobile-first CSS tends to end up simpler.

By the end, the card layout works from a 320px phone to a wide desktop without a separate mobile site.
