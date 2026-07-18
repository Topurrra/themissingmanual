---
title: "Vue from Zero - The Framework That Lets You Mutate"
guide: "vue-from-zero"
phase: 0
summary: "How Vue actually works - reactive data that tracks its own readers, templates that re-render themselves, and single-file components - taught from the reactivity model up."
tags: [vue, frontend, reactivity, composition-api, beginner-friendly]
category: frontend
order: 3
difficulty: beginner
synonyms: ["learn vue", "vue 3 tutorial from scratch", "what is vue", "vue composition api explained", "vue vs react", "understand vue reactivity"]
updated: 2026-07-18
---

# Vue from Zero - The Framework That Lets You Mutate

Vue has a reputation as the approachable frontend framework, and the reputation is earned - but
"approachable" gets mistaken for "shallow," and then developers use Vue for a year without knowing
*why* changing `count.value` updates the screen. That gap stays fine right up until the day
reactivity silently stops working and nothing in your mental model explains it.

This guide builds the model properly: what Vue's reactivity actually is (a tracking system built on
proxies), why mutation is the *intended* way to change data here, and how templates, components, and
watchers all hang off that one system. If you've read our React guide, you'll get contrast notes
where the two philosophies split; if you haven't, this guide stands on its own.

## How to read this

- **In a panic right now?** Jump to [Phase 7: When Vue Breaks](07-when-it-breaks.md) - the
  cheat-card at the top covers the classic "reactivity stopped working" mysteries.
- **Want it to finally make sense?** Read in order. Phase 3 (reactivity) is the load-bearing wall.

## The phases

1. **[What Vue Actually Is](01-what-vue-actually-is.md)** - reactive data + templates that follow
   it, and the anatomy of a `.vue` file.
2. **[Templates That React](02-templates-that-react.md)** - `{{ }}`, `:bind`, `@click`, `v-if`,
   `v-for`, and the two-way `v-model`.
3. **[Reactivity for Real](03-reactivity-for-real.md)** - `ref`, `reactive`, `computed`, and the
   traps that silently disconnect your data from the screen.
4. **[Components: Props, Events, and v-model](04-components-props-events.md)** - building blocks
   that talk both directions.
5. **[Slots and Composition](05-slots-and-composition.md)** - components that wrap content, and
   composables that package logic.
6. **[Watchers, Lifecycle, and Fetching](06-watchers-lifecycle-fetching.md)** - reacting to changes
   and talking to servers.
7. **[When Vue Breaks](07-when-it-breaks.md)** - lost reactivity, forgotten `.value`, mutated
   props, and key mistakes, decoded.
8. **[Where to Go Next](08-where-to-go-next.md)** - Router, Pinia, Nuxt, and what to skip for now.

> Deliberately deferred to follow-up guides: Nuxt and server-side rendering, TypeScript-heavy
> component patterns, transitions/animation, and testing. The reactivity model comes first;
> everything else is built on it.
