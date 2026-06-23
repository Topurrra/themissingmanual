---
title: "What Actually Happens When Your Code Runs"
guide: "what-happens-when-code-runs"
phase: 0
summary: "The journey from the text you type to a living program: how source code gets translated into machine instructions, where your data lives while it runs, and what 'running' actually means to the operating system and CPU."
tags: [programming, compilers, interpreters, stack, heap, processes, mental-model]
category: programming-concepts
order: 2
difficulty: beginner
synonyms: ["what happens when code runs", "how does code run", "compiled vs interpreted", "what is a compiler", "what is an interpreter", "stack vs heap", "what is machine code", "how does a program become a process"]
updated: 2026-06-19
---

# What Actually Happens When Your Code Runs

You can write a little code. You've typed something, pressed Run, and watched it work — or watched it break — without ever being told what happened in between. The file you wrote is just text. The machine in front of you doesn't read English, or Python, or anything that looks like what you typed. So how does a page of words become a thing that *does something*?

That gap — between the code you write and the machine that runs it — is where a lot of programming feels like magic, or superstition. "Use Go because it's compiled." "Python is slow because it's interpreted." "Watch out for stack overflow." These are real, knowable things, and once you can picture the whole chain — text → translated → running program → CPU — they stop being spells and start being something you can reason about.

This guide walks that chain end to end, in plain language, with pictures.

## How to read this
- **Want the big picture fast?** Read [Phase 1](01-source-to-machine.md) — it's the heart of it: how your text becomes something the machine can run.
- **Want it to finally make sense?** Read in order. Each phase is one link in the chain, and they connect: how code is *translated*, then *where its data lives* while running, then what *"running"* even means.

## The phases
1. **[From Source Code to Something the Machine Runs](01-source-to-machine.md)** — your code is text; the CPU runs machine instructions. How a compiler (translate-ahead) and an interpreter (translate-as-you-go) bridge that gap, and the trade-off between them.
2. **[Where Your Data Lives: the Stack & the Heap](02-stack-and-heap.md)** — when code runs, every value sits somewhere in memory. The stack (fast, automatic, for function calls) versus the heap (flexible, for things that outlive a function) — and what "stack overflow" really is.
3. **[What "Running" Means](03-what-running-means.md)** — your program becomes a *process* the operating system schedules onto the CPU, using RAM as its workspace. We tie the whole chain together.

> Deeper material lives in neighboring guides: how the OS juggles many running programs at once is [Processes, Memory & the CPU](/guides/processes-memory-and-cpu); how the hardware itself is laid out is [CPU, RAM & Storage](/guides/cpu-ram-and-storage); and how a program's memory gets cleaned up afterward is [Memory & Garbage Collection](/guides/memory-and-garbage-collection). Brand new to writing code at all? Start with [Programming from Zero](/guides/programming-from-zero).
