---
title: "How the Browser Renders a Page"
guide: "how-the-browser-renders-a-page"
phase: 0
summary: "What happens between the browser receiving HTML/CSS bytes and pixels showing on screen - parsing, the render tree, layout, paint, and why some style changes are far more expensive than others."
tags: [browser, rendering, performance, web-fundamentals, intermediate]
category: web-fundamentals
order: 7
difficulty: intermediate
synonyms: ["how does a browser render a webpage", "what is the critical rendering path", "dom vs render tree", "why is my animation janky", "reflow vs repaint vs composite"]
updated: 2026-07-06
---

# How the Browser Renders a Page

You know HTML, CSS, and the DOM. You've built pages. But when the browser turns your markup into pixels,
something happens in between that most tutorials skip - and it explains two things that otherwise feel
like magic: why a stray `<script>` tag can freeze your page mid-load, and why animating `left` feels
janky while animating `transform` stays buttery smooth.

This guide opens that gap. Three phases, each building on the last: how bytes become trees, how trees
become boxes on screen, and why some changes to those boxes cost far more than others.

## How to read this
- **Want the performance payoff fast?** Jump to [Phase 3: Why Some Changes Are Expensive](03-why-some-changes-are-expensive.md).
- **Want it to actually click?** Read in order - parsing sets up the render tree, the render tree sets up why costs differ.

## The phases
1. **[Parsing: From Bytes to DOM and CSSOM](01-parsing-from-bytes-to-dom-and-cssom.md)** - how the browser streams HTML into a tree while it's still downloading, why an unmarked `<script>` tag blocks that process, and how CSS becomes its own tree in parallel.
2. **[The Render Tree, Layout, and Paint](02-the-render-tree-layout-and-paint.md)** - how DOM and CSSOM combine into what actually gets drawn, why `display: none` and `visibility: hidden` behave completely differently, and how the browser computes geometry and fills in pixels.
3. **[Why Some Changes Are Expensive](03-why-some-changes-are-expensive.md)** - the real cost of changing geometry versus color versus `transform`/`opacity`, and how to avoid layout thrashing in your own code.

> Browser internals like the compositor's tiling strategy or GPU layer promotion rules are deep enough for their own guide - this one gives you the mental model that makes the DevTools Performance tab make sense.
