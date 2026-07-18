---
title: "Svelte from Zero - The Framework That Compiles Away"
guide: "svelte-from-zero"
phase: 0
summary: "How Svelte actually works - a compiler that turns your components into surgical DOM updates at build time - and how runes, templates, and components build on that one idea."
tags: [svelte, frontend, compiler, runes, beginner-friendly]
category: frontend
order: 4
difficulty: beginner
synonyms: ["learn svelte", "svelte 5 tutorial from scratch", "what is svelte", "svelte runes explained", "svelte vs react", "how does svelte work"]
updated: 2026-07-18
---

# Svelte from Zero - The Framework That Compiles Away

React ships a runtime that diffs descriptions of your UI. Vue ships a runtime that tracks who reads
what. Svelte's bet is stranger and simpler: **do the framework's thinking at build time.** Your
component is compiled - analyzed like source code, because it is source code - into small,
direct instructions: "when `count` changes, update this one text node." At runtime there's no
diffing and no dependency graph to consult, because the compiler already worked out exactly what
depends on what.

Full disclosure of bias: the site you're reading is built with Svelte. We picked it for the same
reasons this guide will show you - and we'll flag its trade-offs with the same candor as everyone
else's.

## How to read this

- **In a panic right now?** Jump to [Phase 7: When Svelte Breaks](07-when-it-breaks.md) and use the
  cheat-card.
- **Want it to finally make sense?** Read in order - phase 2 (runes) is the foundation the rest
  stands on.

## The phases

1. **[What Svelte Actually Is](01-what-svelte-actually-is.md)** - the compiler idea, and the
   anatomy of a `.svelte` file.
2. **[Runes: State That Compiles](02-runes-state-that-compiles.md)** - `$state`, `$derived`, and
   how reactivity works when it's a language feature.
3. **[Template Logic](03-template-logic.md)** - `{#if}`, `{#each}` with keys, `{#await}`, and
   `bind:`.
4. **[Components: Props, Callbacks, and Snippets](04-components-props-snippets.md)** - talking
   down, up, and passing markup.
5. **[Sharing State](05-sharing-state.md)** - lifting, context, and shared state in `.svelte.js`
   modules.
6. **[Effects, Lifecycle, and Fetching](06-effects-lifecycle-fetching.md)** - `$effect` used
   sparingly, `onMount`, and data loading.
7. **[When Svelte Breaks](07-when-it-breaks.md)** - lost reactivity, effect loops, and the
   compiler's own error messages, decoded.
8. **[Where to Go Next](08-where-to-go-next.md)** - SvelteKit and the ecosystem, sized fairly.

> Deliberately deferred to follow-up guides: SvelteKit itself (routing, server loading, form
> actions), transitions and animation (a genuine Svelte strength), stores in depth, and testing.

> 📝 A dialect note before you start: this guide teaches **Svelte 5 with runes** (`$state`,
> `$derived`) - the current syntax. Code in the wild often uses the older dialect (`let` +
> `$:` labels, `export let`); phase 2 and 4 include translation notes so you can read both.
