---
title: "Build a Mini UI Framework - The Magic, Demystified"
guide: "mini-framework-js"
phase: 0
summary: "Build the machinery inside React, Vue, and Svelte yourself in ~120 lines of plain JavaScript: a proxy-based reactivity system, effects and computed values, a virtual DOM, and a diff."
tags: [javascript, project, reactivity, virtual-dom, frameworks, build-along]
category: projects
group: "Build On Your Machine"
order: 14
difficulty: intermediate
synonyms: ["build your own react", "how does reactivity work internally", "build a virtual dom from scratch", "write a ui framework in javascript", "proxy reactivity tutorial"]
updated: 2026-07-18
---

# Build a Mini UI Framework - The Magic, Demystified

You've used a frontend framework - maybe you've read our [React](../../frontend/react-from-zero/_guide.md),
[Vue](../../frontend/vue-from-zero/_guide.md), or [Svelte](../../frontend/svelte-from-zero/_guide.md)
guides - and somewhere in your head there's still a box labeled "magic." *How* does changing
`count` update the screen? What *is* a virtual DOM, physically? What does "tracking dependencies"
actually track?

This project empties the box. In about 120 lines of plain JavaScript, run right here in your
browser, you'll build the load-bearing machinery of a modern UI framework: a reactivity system
that knows who read what (Vue's engine, Svelte's engine), an effect and computed layer on top of
it, a virtual DOM with a render function (React's core idea), and a diff that finds the minimal
set of changes. At the end you'll wire them into one working micro-framework and map each piece
onto the real frameworks' names for it.

Nothing here is a toy in the pejorative sense - these are the *actual algorithms*, minus the
production hardening. After this project, framework documentation reads like a description of
code you've written.

## What you need

Comfortable JavaScript: objects, functions as values, arrays, `map`/`filter`. Having read one of
the frontend from-zero guides helps you connect the dots but isn't required - this project also
works as a *prequel* that makes those guides land harder.

## How to read this

Every phase builds and runs real code in the page. Run every block - and do the exercises before
peeking at the next block, because each phase's machinery becomes the next phase's raw material.

## The phases

1. **[Reactive Objects](01-reactive-objects.md)** - a Proxy that notices reads and writes: the
   atom of all reactivity.
2. **[Effects and Computed](02-effects-and-computed.md)** - automatic dependency tracking, the
   trick every framework shares.
3. **[The Virtual DOM](03-the-virtual-dom.md)** - UI as cheap description objects, and a render
   function.
4. **[The Diff](04-the-diff.md)** - comparing two descriptions to find the minimal change - and
   why keys exist.
5. **[Wiring It Together](05-wiring-it-together.md)** - state → render → diff as one loop, and
   the map from your 120 lines to React, Vue, Svelte, and Angular.
