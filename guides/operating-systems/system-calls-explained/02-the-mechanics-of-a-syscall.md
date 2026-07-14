---
title: "What actually happens during a syscall"
guide: system-calls-explained
phase: 2
summary: "The controlled doorway between your program and the kernel - why it exists, what happens during one, and why it matters for real performance."
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

# What actually happens during a syscall

Phase 1 established that a system call is the only sanctioned way across the user-mode/kernel-mode wall. This phase opens that mechanism up: the specific steps between your program calling `read()` and getting bytes back.

## Step 1: your program requests a specific syscall, by number

Every system call the kernel supports has a fixed, agreed-upon number. `read` might be syscall number 0, `write` might be 1, `open` might be 2 - the exact numbers differ by operating system, but the idea is universal: there's a numbered table, and your program's C library (or runtime) knows which number corresponds to which operation.

```text
read(fd, buffer, count)
  -> your language's standard library translates this into:
     syscall number: 0 (on Linux x86-64, for example)
     arguments: fd, buffer address, count
```

*What just happened:* when you call a high-level function like `read()`, a thin layer underneath - the C standard library, or your language runtime - packages that call into the specific syscall number and arguments the kernel expects. You almost never deal with the raw number yourself; the library handles the translation.

## Step 2: the trap - a deliberate software interrupt

Here's the part that makes the mode switch possible. Your program executes a special CPU instruction whose entire purpose is to voluntarily trigger a switch into kernel mode - on x86-64 Linux this is the `syscall` instruction (older systems used a software interrupt, `int 0x80`). This is called a **trap**: not an error, but a deliberate signal that says "kernel, take over from here."

```text
user mode:   ... normal instructions ...
             syscall            <- special instruction: trap into kernel mode
kernel mode: (CPU privilege level switches, kernel's trap handler runs)
```

*What just happened:* this single instruction is the entire crossing point. Before it executes, the CPU is in user mode and restricted. The instant it executes, the CPU privilege level flips to kernel mode, and control jumps to a fixed, known entry point inside the kernel - the kernel's trap handler, waiting specifically for this. Nothing about this is negotiable from the user-mode side; the program can't pick where in the kernel execution lands, which is itself part of the protection Phase 1 described.

## Step 3: the kernel reads the syscall number and dispatches

Once inside the trap handler, the kernel looks at the syscall number your program placed in a specific CPU register before trapping, and uses it to look up which internal kernel function handles that request - a **syscall table**, essentially an array of function pointers indexed by syscall number.

```text
syscall_table[0]  -> sys_read()
syscall_table[1]  -> sys_write()
syscall_table[2]  -> sys_open()
...

kernel: number = 0 -> calls sys_read(fd, buffer, count)
```

*What just happened:* the kernel doesn't guess or parse anything fuzzy - it does a direct lookup by number and calls the corresponding function, passing along the arguments your program provided. `sys_read()` is real kernel code that knows how to talk to the filesystem layer and, eventually, the actual disk driver, entirely in kernel mode where it's allowed to do so.

## Step 4: the kernel does the actual work

Now the requested work actually happens - with full kernel privileges. For `read()`, that means checking the file descriptor is valid, checking permissions, asking the filesystem where those bytes live on disk, and asking the disk driver to fetch them. None of this could have happened in user mode; this is precisely the privileged work Phase 1 said only the kernel can do.

## Step 5: the return - switching back to user mode

Once the kernel finishes the work (or fails - the same path handles both cases, with a return value indicating error or success), it executes a return-from-trap instruction. This flips the CPU back to user mode and resumes your program exactly where it left off, right after the `syscall` instruction, with the result available.

```text
kernel mode: sys_read() finishes, places result in a register
             sysret / iret         <- return-from-trap: flips back to user mode
user mode:   ... program resumes here, with the read bytes now available ...
```

*What just happened:* your program's execution wasn't destroyed or restarted - it was paused at one precise instruction boundary, the kernel did privileged work on its behalf, and execution resumed at the next instruction as if nothing unusual happened, except now a buffer that was empty is full of file data.

> A syscall is not a function call to some code living in your own process. It's a full round trip out of your program's privilege level, into the kernel, and back - with a hardware-enforced wall crossed twice, once in each direction.

## The whole sequence, together

```text
1. Your code calls a library function (e.g. read())
2. Library sets up the syscall number + arguments in specific registers
3. `syscall` instruction traps into kernel mode
4. Kernel looks up the syscall number in its table, dispatches to the handler
5. Handler does the privileged work (touches the filesystem/disk/network)
6. Kernel returns; CPU switches back to user mode
7. Your program resumes with the result
```

*What just happened:* every one of your program's interactions with the outside world - every file, every socket, every millisecond of wall-clock time it asks for - runs this exact seven-step sequence. It happens so often, and usually so fast, that you never see it directly. But it isn't free, and that cost is the subject of Phase 3.

[← Phase 1: Why programs can't touch hardware directly](01-user-mode-vs-kernel-mode.md) | [Phase 3: Why syscalls matter for real performance →](03-why-syscalls-matter-for-performance.md)
