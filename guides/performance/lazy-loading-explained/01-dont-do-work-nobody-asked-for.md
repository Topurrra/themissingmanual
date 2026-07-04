---
title: "Don't do work nobody asked for yet"
guide: lazy-loading-explained
phase: 1
summary: "Why deferring work until it's actually needed is one of the cheapest performance wins available, and where it stops paying off."
tags: [performance, lazy-loading, images, code-splitting, frontend]
difficulty: beginner
synonyms:
  - what is lazy loading
  - lazy loading vs eager loading
  - 'loading="lazy" images'
  - code splitting explained
  - defer loading until needed
  - infinite scroll performance
updated: 2026-07-04
---

# Don't do work nobody asked for yet

Here's the default most software falls into without anyone deciding it on purpose: when the page loads, fetch everything the page could ever need. Every image, every script, every chunk of data — all of it, up front, before the user has scrolled a pixel or clicked a button. This is called **eager loading**, and it has one real virtue: it's simple to reason about. Everything is just... there.

The problem is that "could ever need" and "will actually use" are very different sets. A product page might have twenty photos, but the visitor reads the first three and leaves. A dashboard might have six tabs, but a given session only opens one. Fetching all twenty photos and all six tabs' worth of code is work spent on a bet that mostly doesn't pay off.

**Lazy loading** flips the default: defer the work until something concrete proves it's needed — the element scrolls into view, the route gets visited, the button gets clicked. Nobody asked for the twentieth photo yet, so don't fetch it yet.

> The question lazy loading always asks is: has anyone actually asked for this, or are we guessing they might?

## Eager vs. lazy, side by side

Picture a page with a hero image at the top and nine more images stacked below it, off-screen.

```text
eager:  fetch all 10 images the instant the page starts loading
        -> user sees the hero after all 10 downloads compete for bandwidth

lazy:   fetch the hero image now; fetch each of the other 9
        only as the user scrolls close to it
        -> user sees the hero almost immediately, nothing else competes
```

*What just happened:* in the eager version, the browser doesn't know the user cares more about the hero than image #9 — it started ten downloads at once and let them race. In the lazy version, the one thing the user can actually see gets the network to itself, and the other nine only start when there's a real signal ("we're about to scroll there") that they're about to matter.

## It's not about doing less work — it's about doing it later, or never

A common misreading is that lazy loading is a trick to skip work. Mostly it isn't skipping — it's rescheduling. The twentieth photo still loads if the user scrolls that far. The dashboard tab's code still runs the moment it's opened. What lazy loading buys you is that the work happens closer to the moment it's needed, instead of all being crammed into the first render.

But there's a real bonus hiding in that reschedule: for anyone who *doesn't* scroll that far, or *doesn't* open that tab, the work never happens at all. Nobody had to decide "let's skip the twentieth photo for users who leave early" — it falls out naturally from only doing work once it's asked for.

```text
100 visitors load a 20-photo page, average visitor views the first 4 photos

eager:  100 visitors x 20 photo-downloads = 2,000 downloads
lazy:   100 visitors x  ~4 photo-downloads = ~400 downloads
```

*What just happened:* nobody wrote code that says "only download 4 photos." The savings are a side effect of only fetching what scrolling into view actually asks for. That's the core appeal — the lazy version isn't a smarter algorithm, it's the same plain rule ("fetch it when it's needed") applied consistently.

## Where this idea shows up outside images

This principle is older and broader than any one web API. A few examples that are all the same idea wearing different clothes:

- A database connection pool that opens connections as requests need them, instead of opening the maximum possible connections at startup.
- A settings screen that only builds its "advanced options" panel when the user clicks "show advanced," instead of building every panel on page load.
- An object whose expensive field is computed the first time something reads it, and cached from then on — rather than computed in the constructor whether anyone reads it or not.

The database example is worth calling out by name: this project has a separate guide on N+1 queries that discusses "lazy loading" in the ORM sense — a related object fetched from the database only when your code touches it. That's the same underlying idea (defer until asked) applied to database relationships instead of UI assets. This guide focuses specifically on the frontend/asset flavor: images, routes, and scroll-triggered content.

## The mental model to keep

One sentence: **do the work when something proves it's needed, not on the chance that it might be.** Whenever you catch yourself writing code that loads, fetches, or computes something "just in case," ask whether there's a concrete trigger you could wait for instead — a scroll position, a click, a route change. If there is, that's a lazy-loading opportunity. Phase 2 walks through the three places you'll use this constantly.

```quiz
[
  {
    "q": "What does lazy loading actually change about the work being done?",
    "choices": [
      "It makes the work run faster once it starts",
      "It defers the work until something concrete shows it's needed",
      "It moves the work from the browser to the server",
      "It compresses the data before sending it"
    ],
    "answer": 1,
    "explain": "Lazy loading is a scheduling change, not a speed change: the same fetch or computation happens later, triggered by a real signal like scroll position or a click."
  },
  {
    "q": "In the 100-visitor photo example, why did lazy loading cut total downloads without anyone writing a rule like 'only load 4 photos'?",
    "choices": [
      "The browser automatically compresses unseen images",
      "Downloads only start when scrolling proves a photo is about to be seen, so visitors who leave early never trigger the rest",
      "Lazy loading caches images across different visitors",
      "The server refuses to send more than 4 images per session"
    ],
    "answer": 1,
    "explain": "The savings are a side effect of consistently applying 'fetch on demand' — nobody special-cased early-leavers, it falls out of the rule on its own."
  },
  {
    "q": "Why is eager loading not \"wrong\" outright?",
    "choices": [
      "It's always slower in every situation",
      "It's simple to reason about — everything is available immediately, with no scheduling logic",
      "It only works on mobile devices",
      "It's required by every browser"
    ],
    "answer": 1,
    "explain": "Eager loading trades efficiency for simplicity: nothing to schedule, nothing conditional. That tradeoff is sometimes the right one, which Phase 3 covers."
  }
]
```

Watch it animated: [lazy loading](/explainers/LazyLoading.dc.html)

[← Overview](_guide.md) | [Phase 2: Where you'll actually use it →](02-where-youll-use-it.md)
