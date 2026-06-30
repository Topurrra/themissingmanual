---
title: "Using a Debugger (Breakpoints, Stepping & Watch)"
guide: "using-a-debugger"
phase: 0
summary: "What a debugger actually is - a way to pause your program mid-run and inspect everything that's true at that instant - and how breakpoints, stepping, and watch expressions transfer across every IDE, language, and browser devtools."
tags: [debugging, debugger, breakpoints, stepping, watch-expressions, devtools]
category: debugging
order: 5
difficulty: intermediate
synonyms: ["how to use a debugger", "what is a breakpoint", "step over vs step into", "debugger instead of print", "how to inspect variables while program runs", "conditional breakpoint", "debug backend and frontend together"]
updated: 2026-06-19
---

# Using a Debugger (Breakpoints, Stepping & Watch)

You already know how to debug with `print()`. You add a line, run the program, read the output, guess
what's wrong, add another line, run it again. It works - until the bug only shows up after twenty
iterations, or only when three values line up just so, and each "run it again" costs you a minute and a
fresh dose of frustration.

There's a tool that's been sitting in your editor the whole time, and most people never reach for it
because nobody showed them what it actually does. A debugger lets you **freeze your program mid-run and
look at everything that's true at that exact instant** - every variable, every function that called the
one you're in, the real value of that thing you've been guessing about. No re-running. No guessing. You
just look.

This guide teaches the debugger as a set of ideas, not as a tour of one IDE's buttons. The moves are the
same in VS Code, PyCharm, IntelliJ, GDB, and your browser's devtools - once you understand them, they
follow you everywhere.

## How to read this

- **Want to know if it's even worth it?** Start with [Phase 1: Why a Debugger Beats print()](01-why-a-debugger-beats-print.md)
  - it's honest about when print debugging is still the right call.
- **Want it to finally make sense?** Read in order. Phase 2 teaches the universal controls; Phase 3 levels
  you up to the moves that solve the bugs `print()` can't touch.

## The phases

1. **[Why a Debugger Beats print()](01-why-a-debugger-beats-print.md)** - the mental model: a debugger
   *pauses* your program and lets you inspect reality, instead of guessing and re-running. When that saves
   you hours (and when `print()` is honestly fine).
2. **[The Core Moves](02-the-core-moves.md)** - the universal controls every debugger has: breakpoints,
   step over / into / out, inspecting variables and the call stack, and watch expressions. Explained so
   they transfer across tools.
3. **[Debugging for Real](03-debugging-for-real.md)** - conditional breakpoints, watchpoints, debugging
   across the stack (backend in your IDE, frontend in devtools), and reading the call stack at a
   breakpoint - plus the gotcha where a breakpoint changes the timing of a race condition.

> This guide deliberately stops at the moves that work in every debugger. Tool-specific superpowers -
> time-travel debugging, remote debugging into a container, core-dump analysis - are a deeper topic for a
> follow-up guide. Master the universal moves here first; they're 90% of what you'll ever need.

Related reading: [Reading a Stack Trace](/guides/reading-a-stack-trace) and
[How to Reproduce a Bug](/guides/how-to-reproduce-a-bug) - a debugger is far more powerful once you can
reliably trigger the bug and read where it blew up.
