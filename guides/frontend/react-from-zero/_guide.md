---
title: "React from Zero - The UI Library, Finally Explained"
guide: "react-from-zero"
phase: 0
summary: "What React actually is, why it re-renders, and how components, state, and effects fit together - taught from the mental model up, not from boilerplate down."
tags: [react, frontend, components, hooks, beginner-friendly]
category: frontend
order: 1
difficulty: beginner
synonyms: ["learn react", "react for beginners", "how does react work", "what is react", "react tutorial from scratch", "understand react hooks"]
updated: 2026-07-18
---

# React from Zero - The UI Library, Finally Explained

You've seen React on every job posting. Maybe you've copied a component from a tutorial, changed a
line, and watched the whole thing break with an error about hooks or keys that meant nothing to you.
That's not a you problem. Most React teaching starts with boilerplate and vocabulary instead of the
one idea the entire library is built on. This guide starts with that idea, and everything else - state,
props, effects, keys - falls out of it in order.

By the end you'll be able to read a React codebase and know *why* it's shaped the way it is, build
components that don't fight you, and recognize the five errors every React developer meets in their
first month before they cost you an afternoon.

## How to read this

- **In a panic right now?** Jump to [Phase 8: When React Breaks](08-when-it-breaks.md) and use the
  cheat-card at the top.
- **Want it to finally make sense?** Read in order - each phase builds on the last, and the first one
  is the foundation everything else stands on.

## The phases

1. **[What React Actually Is](01-what-react-actually-is.md)** - the one idea under everything:
   your UI is a function of your data.
2. **[Components and Props](02-components-and-props.md)** - functions that return descriptions of
   UI, and how data flows between them.
3. **[State and Re-renders](03-state-and-re-renders.md)** - `useState`, why changing state redraws
   the screen, and why React insists you never mutate.
4. **[Lists, Keys, and Conditional Rendering](04-lists-keys-and-conditional-rendering.md)** - showing
   many things, showing things sometimes, and what that `key` warning is really about.
5. **[Events and Forms](05-events-and-forms.md)** - handling clicks and keystrokes, and the
   controlled-input pattern that confuses everyone once.
6. **[Effects](06-effects.md)** - `useEffect` is for talking to the world outside React, and almost
   nothing else.
7. **[Sharing State](07-sharing-state.md)** - lifting state up, context, and when prop drilling is
   actually fine.
8. **[When React Breaks](08-when-it-breaks.md)** - the classic errors ("too many re-renders", stale
   state, missing keys), what each one means, and the calm fix.
9. **[Where to Go Next](09-where-to-go-next.md)** - the ecosystem without the hype: what to learn
   next and what to ignore for now.

> Deliberately deferred to follow-up guides: server-side rendering and Next.js, performance tuning
> (`memo`, `useMemo`, profiling), advanced patterns (reducers, portals, suspense), and testing. This
> guide makes the core model solid; those build on it.
