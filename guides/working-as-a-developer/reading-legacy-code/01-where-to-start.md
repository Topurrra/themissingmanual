---
title: "Where to Start When You Don't Understand Any of It"
guide: "reading-legacy-code"
phase: 1
summary: "Don't read a legacy codebase top to bottom. Pick one real entry point and follow it through, end to end."
tags: [legacy-code, codebase, onboarding, beginner-friendly]
difficulty: beginner
synonyms: ["where to start reading a new codebase", "how to explore an unfamiliar repo", "how to trace a feature through code"]
updated: 2026-07-06
---

# Where to Start When You Don't Understand Any of It

You clone the repo. It's 400 files, three years old, no README worth trusting. The instinct is to open the folder tree and start reading files in order, top to bottom, hoping it clicks. It won't. You'll forget file #3 by the time you reach file #40, and none of it will connect to anything you actually need to change.

Codebases aren't meant to be read like a book. They're meant to be read like a map you're navigating with a destination in mind. Without a destination, every file looks equally important, which means none of them are.

## Pick one thread, not the whole codebase

Instead of "understand the codebase," start with "understand what happens when a user clicks this one button." Pick something small and concrete:

- A single API route (`POST /api/orders`)
- A button in the UI (the "Cancel Subscription" link)
- A scheduled job (the nightly billing sync)

It doesn't matter which one - pick whichever one you were assigned a bug or ticket for. That's your thread. You're going to follow it from the outside in, through every file it touches, and stop caring about everything else for now.

## Trace one feature end to end

Say your ticket is "canceling a subscription doesn't refund the prorated amount." Here's the actual trace, file by file, the way you'd really do it:

1. **Find the entry point.** Grep the frontend for the button text: `grep -r "Cancel Subscription" src/`. You land on `SubscriptionSettings.jsx`, which calls `cancelSubscription()` on click.
2. **Follow the function.** `cancelSubscription()` lives in `api/subscriptions.js` and does a `POST /api/subscriptions/:id/cancel`.
3. **Find the route handler.** Grep the backend for that route: `grep -r "subscriptions/:id/cancel" server/`. You land on `routes/subscriptions.py`, `cancel_subscription()`.
4. **Read that function, not the whole file.** It calls `SubscriptionService.cancel()`, which sets a status flag and calls `RefundCalculator.prorate()`.
5. **Follow the refund logic.** `RefundCalculator.prorate()` is where the actual bug probably lives - now you have a specific, small target instead of a codebase-sized one.

Five files. Not the 400 in the repo - the five that this one feature actually touches. That's the whole codebase you need for this task.

## Use the tools that do the tracing for you

You don't have to do this by memory or by clicking through folders:

- **Grep for UI text or route strings** to jump from "what the user sees" to "what code runs." Exact button labels and URL paths are the most reliable search terms - they don't get renamed as often as variables do.
- **Set a breakpoint or add a print/log statement** at the entry point and run the flow for real. Watching the actual call stack execute beats guessing from static reading, especially in codebases with dependency injection or dynamic dispatch where grep won't show you the real path.
- **Use "find usages" / "go to definition"** in your editor once you've found the first function. This is faster than grepping for every subsequent hop.
- **Check the tests.** A test file named `test_subscription_cancel.py` often lays out the exact call chain you're trying to reconstruct, minus the incidental UI code.

## Let the thread pull you through the architecture

By the time you've traced one feature end to end, you've learned more than a day of skimming would teach you: how the frontend talks to the backend, what the service layer looks like, where business logic lives versus where it's just plumbing, and what naming conventions the codebase actually follows (not what the style guide claims).

Do this for two or three tickets and patterns repeat. The next trace goes faster because you already recognize the shape: route handler → service → data layer. You're not memorizing the codebase - you're building a mental map one real path at a time, and only the paths you actually needed.

This is also why fixing a real bug is often a better first task than "explore the codebase for a week." A bug gives you a thread to pull. Free exploration gives you nothing to anchor to, so it doesn't stick.

Try tracing one feature in a codebase you're new to (work or personal) using the grep-and-follow approach above.

```exercise
[
  {
    "type": "task",
    "task": "Pick one feature in a codebase you didn't write (work, open source, or a sample repo). Trace it from the entry point (button, route, or CLI command) through every file it touches, down to where the actual logic lives.",
    "reveal": "Start by grepping for user-facing text or the route/URL string, not for variable names - those are the most stable search anchors. Follow one function call at a time; resist opening files 'just in case' that the trace didn't lead you to.",
    "checklist": ["Found the real entry point, not just a guess", "Followed the call chain through at least 3 files", "Could explain the flow out loud without re-reading the code"]
  }
]
```

Quick check before moving on:

```quiz
[
  {
    "q": "You're new to a large, undocumented codebase. What's the best first move?",
    "choices": ["Read every file top to bottom before touching anything", "Pick one real feature or ticket and trace it end to end through the files it touches", "Wait until someone writes documentation"],
    "answer": 1,
    "explain": "A single real thread gives you a destination. Reading files with no destination doesn't stick."
  },
  {
    "q": "When tracing a feature from a UI button to backend logic, what's usually the most reliable first grep target?",
    "choices": ["A generic variable name like `data`", "The exact button text or route/URL string", "The name of the file you assume handles it"],
    "answer": 1,
    "explain": "Button text and route strings change far less often than variable or function names, so they're the most stable anchor to start a trace from."
  }
]
```

---

[Guide overview](_guide.md) · [Phase 2: Techniques for Making the Unknown Known →](02-techniques-for-understanding.md)
