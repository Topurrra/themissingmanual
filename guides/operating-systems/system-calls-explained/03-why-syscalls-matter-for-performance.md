---
title: "Why syscalls matter for real performance"
guide: system-calls-explained
phase: 3
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
updated: 2026-07-11
---

# Why syscalls matter for real performance

Phase 2 walked through the mechanics: trap, mode switch, dispatch, work, return. Each step takes real time — not a huge amount on any single call, but enough to shape how experienced developers write I/O code. This phase covers why that small cost adds up, and how to actually watch it happening on a running program.

## The cost of a single mode switch

A system call is slower than a regular function call in your own code, and the reason traces directly back to Phase 2's mechanics. A normal function call is just a jump to a nearby address, still in user mode, with the CPU's instruction pipeline and caches barely disturbed. A syscall does considerably more: it saves your program's register state, flips the CPU's privilege level, jumps into kernel code (which likely isn't sitting in the same CPU cache lines your program was just using — a **cache-cold** jump), does its work, and reverses the whole thing on the way back.

```text
Regular function call:   nanoseconds — stays in user mode, cache-friendly
System call:              tens to low hundreds of nanoseconds — mode switch + kernel dispatch overhead,
                          even before the kernel does any actual work
```

*What just happened:* even a syscall that does almost nothing — like asking for the current time — pays this fixed overhead just for crossing the wall and coming back. The kernel isn't slow at its job; crossing the boundary at all has an unavoidable fixed cost, separate from whatever work happens once you're across.

## Why you buffer instead of calling write() once per byte

This is the most common place this cost shows up in real code. Imagine writing a file one byte at a time:

```text
# the slow way — one syscall per byte
for byte in data:
    write(fd, byte, 1)      # each call: full trap, mode switch, kernel work, return
```

*What just happened:* if `data` is a megabyte, that's roughly a million system calls, each paying the full mode-switch overhead from the section above — on top of whatever the actual disk write costs. The fixed per-call overhead, multiplied a million times, can dwarf the cost of the real work being done.

Compare that to buffering: accumulate data in memory (cheap, cache-friendly, no mode switch) and issue one `write()` call for a large chunk at once.

```text
# the fast way — accumulate in a user-mode buffer, one syscall for the whole chunk
buffer = []
for byte in data:
    buffer.append(byte)     # plain memory write, no syscall, no mode switch
write(fd, buffer, len(buffer))   # one syscall for the entire megabyte
```

*What just happened:* you paid the fixed mode-switch cost exactly once instead of a million times. This is why every serious I/O library — file handles, network sockets, standard output — buffers by default. `printf` doesn't call `write()` for every character you print; it accumulates output and flushes in larger chunks. The N+1-style trap here has the same shape as issuing one database query per row instead of one query for all of them: the fix in both cases is batching the expensive boundary crossing instead of paying its fixed cost over and over.

> The lesson isn't "syscalls are bad." It's that crossing the user/kernel wall has a real, fixed cost per crossing — so the number of crossings matters as much as the total amount of work being done across them.

## Seeing syscalls actually happen: strace and friends

Because syscalls are the exact point where your program touches the outside world, tracing them is one of the most reliable ways to understand what a program is *actually* doing, independent of what its source code claims. On Linux, the tool is `strace`; macOS has `dtruss` (built on DTrace); Windows has Process Monitor for similar visibility into system-level activity.

```text
$ strace -c ./my_program

% time     seconds  usecs/call     calls    syscall
------ ----------- ----------- --------- ----------------
 45.20    0.003821          12       318 write
 30.11    0.002544           8       318 read
 12.03    0.001017          32        32 openat
  ...
```

*What just happened:* `strace -c` runs the program and prints a summary of every syscall it made, how many times, and how much time was spent inside the kernel handling each one. Seeing `write` called 318 times when you expected 3 is often the exact moment you discover an unbuffered loop like the one earlier in this phase — the syscall count is direct, unambiguous evidence, not a guess.

You can also trace without the summary, seeing each call as it happens with its actual arguments:

```text
$ strace ./my_program
openat(AT_FDCWD, "config.json", O_RDONLY) = 3
read(3, "{\"key\": \"value\"}", 4096) = 17
close(3)                               = 0
```

*What just happened:* this is the seven-step sequence from Phase 2, made visible from outside the process — every trap into the kernel, with its arguments and return value, printed in order. When a program is mysteriously slow, hanging, or touching files it shouldn't, this is often the fastest way to find out what it's really doing, because it bypasses whatever the source code claims and shows the actual boundary crossings as they happen.

## Bringing it together

The wall between user mode and kernel mode exists for protection. Crossing it is a specific, mechanical process — trap, mode switch, dispatch, work, return — and that process has a real, fixed cost independent of how much work happens on the other side. Once you internalize that cost, a lot of otherwise-mysterious performance advice stops being folklore: buffer your I/O, batch your writes, and when something's inexplicably slow, look at what it's actually asking the kernel to do.

Watch it animated: [system calls](/explainers/SystemCalls.dc.html)

```quiz
[
  {
    "q": "Why is a system call slower than a normal function call in your own code?",
    "choices": [
      "Syscalls always involve a disk, which is inherently slow",
      "It requires a CPU privilege mode switch and a jump into kernel code, on top of whatever work is actually done",
      "The kernel deliberately adds a delay for security reasons",
      "Syscalls are only slow on older CPUs"
    ],
    "answer": 1,
    "explain": "The mode switch itself — saving state, flipping privilege level, cache-cold jump into the kernel, and back — has a fixed cost separate from the actual work performed."
  },
  {
    "q": "Why do I/O libraries buffer output instead of calling write() for every byte?",
    "choices": [
      "Buffering makes the disk itself write faster",
      "It avoids paying the fixed mode-switch overhead once per byte by batching many bytes into one syscall",
      "The kernel rejects small writes",
      "Buffering is only needed for network sockets, not files"
    ],
    "answer": 1,
    "explain": "Each syscall pays the same fixed crossing cost regardless of how much data it carries — batching into fewer, larger calls amortizes that cost across far more data."
  },
  {
    "q": "What does a tool like strace actually show you?",
    "choices": [
      "The source code of the program being traced",
      "A prediction of future performance based on static analysis",
      "The real system calls the program makes as it runs, with arguments and return values",
      "Only the syscalls that fail"
    ],
    "answer": 2,
    "explain": "strace intercepts and prints the actual trap-into-kernel events as they happen, showing unambiguous evidence of what a program is really doing, independent of its source code."
  }
]
```

[← Phase 2: What actually happens during a syscall](02-the-mechanics-of-a-syscall.md) | [Overview](_guide.md)
