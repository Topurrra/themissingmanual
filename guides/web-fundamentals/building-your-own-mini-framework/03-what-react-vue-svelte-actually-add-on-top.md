---
title: "What React/Vue/Svelte Actually Add On Top"
guide: "building-your-own-mini-framework"
phase: 3
summary: "The mini virtual DOM and signal system from phases 1-2 cover the core loop - here's the real gap between that and a production framework: lifecycle, batching, keyed diffing, scheduling, and compilers."
tags: [javascript, frameworks, react, vue, svelte, web-fundamentals]
difficulty: advanced
synonyms: ["how is react different from vanilla js", "what does a framework actually do", "why use react instead of vanilla javascript", "svelte compiler explained"]
updated: 2026-07-06
---

# What React/Vue/Svelte Actually Add On Top

Phases 1 and 2 built a real diff/patch renderer and a real signal system, wired together, in under 150 lines total. That's not a toy that resembles a framework - it's the actual core loop every virtual-DOM framework runs. It's worth being precise about what's still missing, because the gap is where framework teams spend most of their engineering effort.

## Lifecycle hooks

Your `mount()` function renders once and reacts to signal writes forever. Real components need to run code at specific moments: after first mount (fetch data), before an update (compare props), after unmount (cancel a subscription, clear a timer). React's `useEffect`, Vue's `onMounted`/`onUnmounted`, Svelte's `onMount` all exist because "just re-run the render function" isn't enough - side effects need their own hooks into the same lifecycle, with cleanup guaranteed even if the component disappears mid-flight.

## Batching updates

In phase 2, `setCount(1)` followed immediately by `setCount(2)` triggers `rerender()` twice - once per `write()` call. In a real app, an event handler that updates three different signals would cause three separate diff/patch passes in your version. Frameworks batch: multiple state changes within the same tick (a single event handler, for instance) collapse into one re-render. React does this by queuing updates and flushing them together; Vue's reactivity system defers effects to a microtask. The visible symptom when batching is missing: janky, redundant DOM work for something that should be a single atomic change.

## Keyed diffing

The `diff()` from phase 1 compares children by index - position 0 against position 0, position 1 against position 1. That breaks down on reordering. Insert one item at the front of a 100-item list and every single item shifts position, so the diff sees 100 "changed" nodes instead of one "inserted" node. Production differs assign each child a stable `key` and match by key first, position second - the same list, reordered, produces a handful of moves instead of a full rewrite. This is why React warns loudly when you render a list without `key` props: without it, the diff degrades to the naive index-based version you just built.

## Fiber-style scheduling

Your `patch()` walks the whole patch tree synchronously, in one function call, blocking the main thread until it finishes. For a small tree that's invisible. For a large one, a big update can block user input for long enough to feel like a freeze. React's fiber architecture breaks rendering work into interruptible units, so it can pause mid-render, let the browser handle a keystroke or a paint, and resume - prioritizing urgent work (typing) over less urgent work (a list re-render off-screen). That's a scheduler bolted onto the diff algorithm, not a different diff algorithm.

## A compiler step: Svelte's different bet

React and Vue ship the diffing algorithm to the browser and run it at runtime, every render. Svelte takes a different approach: it's a compiler. At build time, Svelte reads your component and generates JavaScript that updates the exact DOM node a variable affects - no virtual DOM tree, no diff, no patch. If `count` only ever appears in one `<span>`, the compiled output is close to `span.textContent = count` directly, decided at build time instead of computed at runtime. This is why Svelte bundles can be smaller and updates faster for simple cases: there's no diffing library, and no tree comparison at all - the "diff" already happened, once, in your terminal, before the browser ever ran a line.

## Developer tooling

The last gap is invisible until you need it: React DevTools and Vue DevTools let you inspect the component tree, see which signal changed and which component re-rendered because of it, and time-travel through state changes. None of that comes from the diff or the signal system - it's a parallel layer of instrumentation, hooks into every render and every write, that frameworks maintain because debugging "why did this re-render" without it is close to impossible at scale.

None of this means phases 1 and 2 were a simplification to the point of being wrong. The loop you built - state changes, subscribers fire, a new tree gets diffed against the old one, only the difference touches the DOM - is the actual mechanism. What's layered on top is what turns a working idea into something that survives a 500-component app with real users typing into it while data streams in from a server. Knowing where that line sits is the difference between fearing the framework and reading its source.

One more pass before you're done with this guide.

```quiz
[
  {
    "q": "Why do frameworks warn about missing 'key' props on list items?",
    "choices": [
      "Keys are required for CSS styling",
      "Without keys, diffing falls back to comparing children by index, turning a single insert into a full rewrite",
      "Keys prevent memory leaks"
    ],
    "answer": 1
  },
  {
    "q": "What problem does update batching solve?",
    "choices": [
      "It makes signals store more values",
      "It collapses multiple state changes in the same tick into a single re-render instead of one per change",
      "It removes the need for a diff algorithm"
    ],
    "answer": 1
  },
  {
    "q": "How does Svelte's approach differ from React's and Vue's at a fundamental level?",
    "choices": [
      "Svelte compiles away the diff step, generating direct DOM updates at build time instead of comparing trees at runtime",
      "Svelte doesn't support component state",
      "Svelte uses a faster virtual DOM diffing algorithm than React"
    ],
    "answer": 0,
    "explain": "React and Vue diff at runtime; Svelte's compiler figures out the exact update ahead of time."
  }
]
```

---

[← Phase 2: Reactivity Without Magic](02-reactivity-without-magic.md) · [Guide overview](_guide.md)

Next stop: zoom back out to [what a framework even is](/guides/what-a-framework-even-is) and see how this core loop fits into the bigger picture of routing, state management, and ecosystem tooling.
