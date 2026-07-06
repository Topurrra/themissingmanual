---
title: "Building Your Own Mini Framework"
guide: "building-your-own-mini-framework"
phase: 0
summary: "React, Vue, and Svelte feel like magic until you build the two ideas underneath them yourself: a virtual DOM diff and a signal-based reactivity system. Write both from scratch in plain JavaScript."
tags: [javascript, frameworks, virtual-dom, reactivity, web-fundamentals, advanced]
category: web-fundamentals
order: 11
difficulty: advanced
synonyms: ["how does virtual dom work", "build your own framework", "how does react rendering work", "what is a signal in javascript", "how does reactivity work", "diffing algorithm explained"]
updated: 2026-07-06
---

# Building Your Own Mini Framework

Every framework tutorial tells you to trust the black box: change some state, and the UI updates. That's the entire pitch, and it works, right up until something re-renders when it shouldn't, or doesn't when it should, and you have no mental model to debug from. The fix isn't reading React's source (millions of lines, years of edge cases). It's building the two ideas underneath it yourself, small enough to fit in your head.

This guide assumes you're comfortable with the real DOM - `querySelector`, `addEventListener`, creating and removing nodes by hand. If any of that is shaky, work through [The DOM Explained](/guides/the-dom-explained) first. Here, the DOM is a tool you already have; the question is what to build on top of it.

## The phases

1. **[A Virtual DOM From Scratch](01-a-virtual-dom-from-scratch.md)** - why frameworks avoid touching the real DOM for every change, and a working `diff()` / `patch()` pair, under 60 lines, that you can read top to bottom.
2. **[Reactivity Without Magic](02-reactivity-without-magic.md)** - a `createSignal()` built from a value and a subscriber list, wired into phase 1's renderer so changing state triggers a real re-render.
3. **[What React/Vue/Svelte Actually Add On Top](03-what-react-vue-svelte-actually-add-on-top.md)** - the real gap between your ~100 lines and a production framework: lifecycle hooks, batching, keyed diffing, fiber scheduling, and Svelte's compiler.

By the end, "the framework re-rendered the component" stops being a black box and becomes a sequence of function calls you wrote yourself. That's also the natural jumping-off point into [what a framework even is](/guides/what-a-framework-even-is) at a higher level.
