---
title: "Why This Explains 'Fast vs Slow' (and Buying a Computer)"
guide: "how-a-computer-works"
phase: 3
summary: "The parts model explains real life: CPU cores and GHz, the amount of RAM, and SSD size each map to a part you now understand - and 'my computer is slow' almost always traces to one of them, so you can diagnose it instead of just suffering."
tags: [hardware, buying-a-computer, specs, cpu-cores, ghz, ram, ssd, performance, troubleshooting]
difficulty: beginner
synonyms: ["what specs matter when buying a laptop", "what do cpu cores mean", "what is ghz", "how much ram do i need", "ssd vs hard drive", "why is my computer slow", "what makes a computer fast", "what should i look for in a laptop"]
updated: 2026-06-19
---

# Why This Explains "Fast vs Slow" (and Buying a Computer)

Here's the payoff. Everything you've learned about the parts isn't just trivia - it's exactly what you need to read a laptop ad without getting fooled, and to figure out why a slow computer is slow. The specs on the box are just numbers describing the parts you already understand. Let's decode them, then turn the model into a calm troubleshooting checklist.

## The cheat-card: "my computer is slow" → which part?

When a computer feels slow, it's rarely a mystery and rarely "it's just old." It's almost always one part being the bottleneck. Start here, then read the sections below for the why.

| What you notice | Most likely the culprit | The plain fix |
|---|---|---|
| Everything crawls when many apps/tabs are open; gets better when you close some | **Not enough RAM** (desk too small) | Close apps/tabs; longer term, more RAM |
| The whole machine is sluggish even with little open; apps take ages to *start* | **Slow storage** (old spinning hard drive) | Move to an **SSD** |
| One specific heavy task (video export, a game, lots of number-crunching) is slow | **CPU** can't do the work fast enough | A faster / more-core CPU helps; or expect it to take time |
| "Disk full" warnings; can't save or update | **Storage is full** (cabinet stuffed) | Delete files; bigger drive |
| Was fine, suddenly slow, fans roaring | Often a program stuck in the fetch-execute loop, or **storage full** | Check what's using the CPU/disk; restart |

Notice that *every* row points at a part from the earlier phases. That's the whole trick: a slow computer is a part that can't keep up, and you now know all the parts.

## CPU specs: cores and GHz

The CPU is the worker. Two numbers describe it, and both come straight from the fetch-execute loop you met in [Phase 2](02-running-a-program.md).

**Cores - how many workers.** A **core** is one worker running the fetch-execute loop. A CPU with more cores is like having more clerks at more desks: they can do separate piles of work *at the same time*. A 4-core chip can genuinely run four things at once; an 8-core, eight.

```text
   1 core:   [worker] ── one pile of work at a time
   4 cores:  [worker][worker][worker][worker] ── four piles at once
```

More cores help most when you run many things at once, or one app that's smart enough to split its work across workers (video editors, photo tools, big games). They help *less* for tasks that are one long unsplittable chain of steps - that work can only sit on one core no matter how many you have.

**GHz - how fast each worker goes.** **Clock speed**, measured in **gigahertz (GHz)**, is roughly how many fetch-execute steps each core gets through per second. One GHz is a billion ticks per second; a 3 GHz core is doing on the order of three billion of those tiny steps every second. Higher GHz means each individual worker is faster.

📝 **Terminology.** *Core* = one independent worker inside the CPU. *GHz (gigahertz)* = how many cycles per second each core runs - loosely, how fast one worker goes. "8-core, 3.2 GHz" means eight workers, each running about 3.2 billion ticks a second.

⚠️ **Gotcha.** You can't compare GHz across different chip designs as if it's a single "speed score." A newer 3 GHz CPU can run circles around an older 3.5 GHz one, because it gets *more useful work done per tick*. GHz only compares cleanly within the same generation and family. Treat it as a rough hint, not a verdict - and never assume "more GHz = faster computer" on its own.

**What this means for buying.** For everyday use - browsing, email, documents, video - almost any modern CPU is plenty; the CPU is rarely your bottleneck. Cores and GHz only become worth paying up for if you do genuinely heavy work: video editing, serious gaming, programming that compiles a lot, or heavy number-crunching.

## RAM: how big the desk is

RAM is the workspace - the desk. The spec is simple: **how many gigabytes**, and unlike the CPU it has a very direct, very noticeable effect on daily life.

Here's the thing to internalize: RAM mostly doesn't make a given task *faster*. What it does is let you keep *more going at once* before the computer runs out of desk space and has to start parking overflow in slow storage - the exact slowdown from [Phase 2](02-running-a-program.md). Enough RAM and everything stays snappy; too little and the machine crawls the moment you open one tab too many.

```text
   Enough RAM:   plenty of desk → everything you opened fits → snappy
   Too little:   desk overflows → spill onto slow storage → crawl
```

💡 **Key point.** RAM is the single spec most likely to fix an *everyday* "this feels slow" - because everyday slowness is usually too many things open for the desk you've got. It's also why "close some tabs" genuinely speeds things up: you're clearing the desk.

**What this means for buying.** RAM is where a beginner's money is usually best spent. As a rough, honest guide for a general-purpose laptop today: small amounts (around 8 GB) handle light use but fill up fast with many browser tabs; a comfortable middle (around 16 GB) suits most people; more (32 GB and up) is for heavy multitaskers and demanding creative or development work. These are practical rules of thumb, not hard limits - your real number depends on how many things you keep open. When unsure, more RAM ages better than a slightly faster CPU.

## Storage: SSD vs hard drive, and size

Storage is the filing cabinet, and it has *two* things worth caring about - and they're different.

**The kind matters more than people expect.** An **SSD** (solid-state drive) is dramatically faster than an old-style **hard drive (HDD)** with its spinning platter. This one choice is often the biggest single difference between a computer that feels instant and one that feels sluggish *everywhere* - because everything you open has to be read up from storage first ([Phase 2](02-running-a-program.md), step 2). On an SSD that read is quick; on a slow hard drive, every app launch and every file open drags.

```text
   SSD:  no moving parts, reads fast   → apps & files open quickly
   HDD:  spinning platter, reads slow   → everything feels draggy
```

🪖 **War story.** The classic "my old laptop became unusable" complaint is, more often than not, a slow hard drive - not a worn-out CPU. Swapping that same machine's HDD for an SSD can make it feel years younger, because the bottleneck was always the slow climb from storage, not the worker.

**The size is the other number.** Storage capacity (in GB or TB) is how much you can keep - files, photos, apps, the operating system. Running low causes its own troubles: "disk full," failed updates, and on some systems extra slowness because the OS has no room to work.

⚠️ **Gotcha.** Don't confuse the *kind* of storage with the *amount*. A huge slow hard drive holds a lot but feels sluggish; a smaller SSD holds less but feels fast. For everyday responsiveness, a fast SSD beats a big slow drive nearly every time. Buy the SSD; size it to how much you actually keep.

**What this means for buying.** Prioritize an SSD - treat a spinning hard drive as a deal-breaker for a primary computer. Then pick a capacity that fits your stuff with room to spare.

## Putting it all together

Here's the model one last time, now labeled with the specs you'll see on the box:

```text
   ┌──────────────────────────────────────────────────────────────┐
   │  CPU      = cores (how many workers) + GHz (how fast each)     │
   │             → matters most for heavy tasks                     │
   │  RAM      = gigabytes (how big the desk)                       │
   │             → matters most for everyday "many things open"     │
   │  STORAGE  = SSD vs HDD (how fast) + GB/TB (how much)           │
   │             → SSD matters for overall snappiness; size for fit │
   └──────────────────────────────────────────────────────────────┘
```

And the reassuring part: you don't need the biggest number in every row. For most people, a modern CPU, a comfortable amount of RAM, and a fast SSD make a computer that feels great - and you now understand *why* each of those does what it does, instead of guessing. When something is slow, you can ask "which part can't keep up?" and actually answer it.

## Recap

1. The specs on the box just describe the parts you already know: **CPU** (cores + GHz), **RAM** (gigabytes), **storage** (SSD vs HDD, plus size).
2. **CPU cores** = how many workers run at once; **GHz** = how fast each goes. Big tasks benefit; GHz isn't comparable across chip families.
3. **RAM** is the desk - more of it lets you keep more open before slowdown, and it's the most common fix for everyday sluggishness.
4. **Storage**: an **SSD** vastly outperforms an old hard drive for overall snappiness; capacity is a separate concern about how much you can keep.
5. **"My computer is slow" is diagnosable** - it's almost always one specific part as the bottleneck, and the cheat-card at the top maps the symptom to the part.

That's the whole machine - named, understood, and connected to real decisions. When you're ready to go a level deeper on the three parts that matter most, [CPU, RAM, and Storage](/guides/cpu-ram-and-storage) picks up here. And to understand the software layer that sits on top of all this hardware, read [What an Operating System Is](/guides/what-an-operating-system-is).

---

[← Phase 2: How They Work Together to Run a Program](02-running-a-program.md) · [Guide overview](_guide.md)
