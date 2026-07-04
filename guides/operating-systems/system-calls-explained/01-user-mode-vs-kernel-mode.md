---
title: "Why programs can't touch hardware directly"
guide: system-calls-explained
phase: 1
summary: "The controlled doorway between your program and the kernel — why it exists, what happens during one, and why it matters for real performance."
tags: [operating-systems, system-calls, kernel, syscall, user-mode, performance]
difficulty: intermediate
synonyms:
  - what is a system call
  - how does a syscall work
  - user mode vs kernel mode
  - why cant programs access hardware directly
  - why is write slow if called too often
  - what does strace show
updated: 2026-07-04
---

# Why programs can't touch hardware directly

When you write `print("hello")` or open a file, it feels like your program does it directly, on its own. But nothing in your program is actually touching the disk, the network card, or the screen. There's a wall between your code and the hardware, enforced by the CPU itself, and your program has to ask permission to cross it every single time. That wall has a name: the boundary between **user mode** and **kernel mode**.

## Two modes, enforced by the CPU

Modern CPUs support at least two distinct privilege levels, and they enforce the distinction in hardware, not just in software convention. **Kernel mode** (sometimes called supervisor mode or ring 0) can execute any instruction, including the dangerous ones: directly manipulating hardware registers, managing memory for every process on the machine, halting the CPU. **User mode** (ring 3, on x86) is deliberately restricted — a whole category of instructions refuse to execute there at all, and the CPU raises a fault if you try.

```text
Kernel mode:  can do anything — talk to hardware, manage all memory, control other processes
User mode:    restricted — normal arithmetic and logic only, no direct hardware access
```

*What just happened:* every regular program you run — your browser, your text editor, your own code — runs in user mode. Only the kernel itself runs in kernel mode. This isn't a polite convention your program agrees to follow; it's physically enforced by the processor. Try to execute a privileged instruction from user mode and the CPU refuses, generating a hardware fault instead of running it.

## Why the wall exists at all

Picture a machine with no such wall: any program could directly write to any part of memory, including memory belonging to other programs, or issue raw commands to the disk controller, or halt the entire CPU. One careless program — or one malicious one — could crash the whole system or read another program's private data with nothing standing in the way.

```text
No wall:    Program A can read/write Program B's memory directly. One bug crashes everything.
With wall:  Program A can only touch its own memory. Anything shared must go through the kernel.
```

*What just happened:* this is **protection**, and it's the entire reason the wall exists. The kernel is the one piece of software trusted to touch shared, sensitive resources — physical memory, disks, network hardware — precisely because it's the one piece of software that can enforce rules about *who* gets to touch *what*. Take that arbitration away and you don't have separate programs anymore; you have one shared blob of code where any bug anywhere can corrupt anything.

> The wall isn't there to slow you down. It's there so that a bug in your program stays a bug in your program, instead of becoming a bug in every program running on the machine.

## So how does a program get anything done?

If user mode can't touch hardware directly, your program needs a way to ask the kernel — which *can* touch hardware — to do something on its behalf. That controlled, deliberate crossing point is the **system call**: a program in user mode makes a specific, well-defined request, the CPU switches to kernel mode for exactly as long as the kernel needs to handle it, and control returns to user mode with the result.

```text
Your program (user mode): "please read 100 bytes from this file"
       |
       v  (system call — the only sanctioned way across the wall)
Kernel (kernel mode): actually talks to the disk controller, reads the bytes
       |
       v
Your program (user mode): receives the 100 bytes, keeps running
```

*What just happened:* your program never touches the disk controller. It asks, through the one narrow, audited doorway the kernel exposes, and the kernel does the actual hardware work on its behalf. Every file read, every network send, every memory allocation beyond what your program already owns, every `time()` call — all of it goes through this same doorway.

## The mental model to keep

Think of user mode and kernel mode as two rooms with exactly one door between them, and the kernel controls that door. Your program lives entirely in the user-mode room and can do plenty on its own in there — arithmetic, string manipulation, working with data already in its own memory. The moment it needs something from outside that room — hardware, another process, memory it doesn't yet own — it has to knock on that one door and wait for the kernel to open it, do the work, and close it again.

That knock has a name and a very specific mechanism, and that's exactly what Phase 2 walks through: what actually happens, instruction by instruction, in the moment a system call fires.

[← Overview](_guide.md) | [Phase 2: What actually happens during a syscall →](02-the-mechanics-of-a-syscall.md)
