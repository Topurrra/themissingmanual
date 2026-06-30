---
title: "Debugging in the Browser"
guide: "debugging-in-the-browser"
phase: 0
summary: "Browser DevTools without the overwhelm: the Console, breakpoints in the Sources panel, and the Network tab solve most frontend mysteries."
tags: [debugging, devtools, browser, console, breakpoints, network]
category: debugging
order: 8
difficulty: intermediate
synonyms: ["how to use browser devtools", "chrome devtools tutorial", "debug javascript in the browser", "where is the network tab", "set a breakpoint in the browser", "console.log vs breakpoint", "find the failed api call", "inspect element css", "why is my page broken"]
updated: 2026-06-30
---

# Debugging in the Browser

The page is broken. A button does nothing, the data won't load, a section is the wrong color — and you're
staring at the screen with no idea where to even look. Most people respond by scattering `console.log`
everywhere and refreshing, hoping a clue falls out. There's a calmer way: the browser already ships a full
debugging toolkit (the DevTools), and three of its panels answer almost every "why is this broken?" you'll
ever have.

This guide isn't a button tour of one browser. It teaches the four panels you actually use — Console,
Sources, Network, Elements — as a way of *thinking*, so the moves carry over whether you're in Chrome,
Edge, Firefox, or Safari.

## How to read this

- **New to DevTools?** Read in order. Phase 1 gives you the map and the Console; Phase 2 teaches real
  breakpoints and the Network tab; Phase 3 walks a full investigation start to finish.
- **Already comfortable in the Console?** Skip to [Phase 2](02-breakpoints-and-the-network-tab.md) — that's
  where breakpoints beat scattered logging.

## The phases

1. **[The DevTools Map and the Console](01-the-devtools-map-and-the-console.md)** — the mental model: DevTools
   is a window into the *running* page. Open it, read errors, log and live-evaluate in the Console.
2. **[Breakpoints and the Network Tab](02-breakpoints-and-the-network-tab.md)** — pause your JavaScript with
   breakpoints (step over / into, watch expressions, the call stack) instead of scattering logs, and use the
   Network tab to find the request that failed.
3. **[A Real Investigation](03-a-real-investigation.md)** — walk one "why is this broken?" bug end to end
   across Console, Network, Sources, and Elements, plus the gotchas that send people chasing ghosts.

Related reading: [Reading a Stack Trace](/guides/reading-a-stack-trace) and
[What an Error Message Tells You](/guides/what-an-error-message-tells-you) — the Console throws both at you,
and they're far less scary once you can read them.

[Phase 1: The DevTools Map and the Console](01-the-devtools-map-and-the-console.md) →
