---
title: "System Calls Explained"
guide: system-calls-explained
phase: 0
summary: "The controlled doorway between your program and the kernel — why it exists, what happens during one, and why it matters for real performance."
tags: [operating-systems, system-calls, kernel, syscall, user-mode, performance]
category: operating-systems
order: 12
difficulty: intermediate
synonyms:
  - what is a system call
  - how does a syscall work
  - user mode vs kernel mode
  - why cant programs access hardware directly
  - why is write slow if called too often
  - what does strace show
updated: 2026-07-11
---

# System Calls Explained

Every time your program reads a file, sends a network packet, or even asks what time it is, it can't do that work itself. It has to ask the kernel — the core of the operating system — through a tightly controlled doorway called a **system call**. That doorway exists for a reason, costs something every time you walk through it, and understanding both explains a surprising number of real performance decisions you'll run into as a developer.

## How to read this

Read it in order. Phase 1 explains why programs can't touch hardware directly. Phase 2 walks through the mechanics of a syscall: the trap, the mode switch, the return. Phase 3 gets practical — why the cost of a mode switch is real, why buffering exists, and how tools like `strace` let you watch syscalls happen live. The mechanism is the same shape on Linux, macOS, and Windows, even though the exact instructions and tool names differ.

## The phases

1. [Why programs can't touch hardware directly](01-user-mode-vs-kernel-mode.md) — the wall between user mode and kernel mode, and why it exists.
2. [What actually happens during a syscall](02-the-mechanics-of-a-syscall.md) — the trap, the mode switch, the syscall number and arguments, the return.
3. [Why syscalls matter for real performance](03-why-syscalls-matter-for-performance.md) — the cost of a mode switch, why you buffer, and watching syscalls with strace.

[Phase 1: Why programs can't touch hardware directly](01-user-mode-vs-kernel-mode.md) →
