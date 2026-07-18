---
title: "Where to Go Next"
guide: "react-from-zero"
phase: 9
summary: "A hype-free map of the React ecosystem: what you can already build, what to learn when a real need appears, and what to cheerfully ignore for now."
tags: [react, ecosystem, nextjs, state-management, learning-path]
difficulty: intermediate
synonyms: ["what to learn after react basics", "react ecosystem overview", "do i need redux", "react vs nextjs", "react roadmap"]
updated: 2026-07-18
---

# Where to Go Next

The React ecosystem is famous for making newcomers feel behind before they start: Redux, Zustand,
TanStack Query, Next, Remix, RSC, signals discourse... Take a breath. Here's the load-bearing
truth: **everything in that pile is an optimization of something you now already understand** -
state, props, effects, and rendering. None of it is a second React to learn. This phase is a map of
when each piece becomes worth picking up, and a permission slip to ignore it until then.

## What you can already build

With phases 1-8 you can build real applications: multi-view UIs, forms with live validation, lists
with filtering and sorting, data fetched from APIs and kept in sync. Do that first. Two or three
small real projects will teach you more React than any amount of ecosystem reading, and they'll
generate the *specific pains* the ecosystem tools exist to solve - which is the only reliable way to
evaluate those tools.

## The map: learn it when you feel this pain

| When you feel this | Reach for | What it is |
|---|---|---|
| "My fetching effects are repetitive: loading flags, error flags, caching, refetching" | **TanStack Query** (or SWR) | Server-data management - the fetch effect from phase 6, industrialized: cache, retries, background refresh |
| "I need pages, URLs, and back-button behavior" | **React Router** | Client-side routing - URL state mapped to component trees |
| "I need SEO, fast first paint, or a server anyway" | **Next.js** | A framework around React: server rendering, file-based routing, data loading conventions |
| "Passing state around is getting genuinely painful at scale" | **Zustand**, then maybe **Redux Toolkit** | External stores - phase 7's table, one row further |
| "One state object, many complex update rules" | **useReducer** | Built into React: setters consolidated into a single dispatch/reducer |
| "The app is visibly slow" | **React DevTools Profiler**, then `memo`/`useMemo` | Measure first; memoization is a targeted tool, not a seasoning |
| "I keep writing the same form logic" | **react-hook-form** | Forms at scale, uncontrolled under the hood for performance |

Notice what's *not* on the list: nothing is labeled "you must learn this next." Every row is gated
on a pain you'll recognize when it arrives.

## Three specific pieces of advice

**On state libraries:** the industry default for new apps is much less "Redux everywhere" than the
older tutorials suggest. `useState` + lifting covers small apps entirely; add TanStack Query and
most of what people used to put in Redux (server data) has a better home; what's left - genuinely
client-side, genuinely global state - is often small enough for context or a tiny Zustand store.
Learn Redux Toolkit when a codebase you work in uses it, not preemptively.

**On Next.js:** learn it when you need what a framework adds (server rendering, routing, SEO, API
routes) - and you'll be glad plain React came first, because Next's hardest concepts (what runs on
the server vs the client) are only understandable on top of the rendering model you now have.

**On TypeScript:** if you already know it, use it with React immediately - props types alone pay
for the setup. If you don't, it's a bigger lever on your career than any item in the table above.

## Additional resources

- [react.dev](https://react.dev) - the official docs, rewritten around hooks and genuinely
  excellent; "Thinking in React" and "You Might Not Need an Effect" extend phases 2 and 6 directly.
- [TanStack Query docs](https://tanstack.com/query/latest) - even the introduction sharpens your
  sense of what server state *is*; read it before building your third fetch effect.
- [Next.js Learn](https://nextjs.org/learn) - the official interactive course, for when the
  framework pain arrives; assumes exactly the React you now know.

## Recap

1. You already know the model; the ecosystem is optimizations of it, adopted pain-by-pain.
2. Build two or three real things before adding any tool - the pains are the curriculum.
3. Server data → TanStack Query; routing → React Router; framework needs → Next.js; the rest can
   wait until it hurts.

```quiz
[
  {
    "q": "You've finished this guide and your fetch effects are getting repetitive - loading flags, error handling, caching. What's the reasonable next step?",
    "choices": [
      "Learn Redux, since state management is the standard next topic",
      "Adopt a server-data library like TanStack Query that industrializes exactly that pattern",
      "Rewrite the app in Next.js",
      "Move all fetching into one giant effect in App"
    ],
    "answer": 1,
    "why": [
      "Redux addresses shared client state - repetitive fetching is server-data pain, a different problem with a dedicated tool.",
      "",
      "A framework migration is a big hammer for a fetching-ergonomics problem - Next earns its place when you need server rendering, routing, or SEO.",
      "Centralizing every fetch recreates the library badly: one component re-rendering the world, no caching, no retries."
    ],
    "explain": "Match the tool to the felt pain: repetitive fetch/loading/cache logic is exactly what TanStack Query (or SWR) exists to absorb."
  }
]
```

---

[← Phase 8: When React Breaks](08-when-it-breaks.md) · [Guide overview](_guide.md)
