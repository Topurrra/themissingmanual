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

Here's the payoff: the specs on a laptop box are just numbers describing the parts you now understand, and a slow computer is a part that can't keep up. Let's decode the specs, then turn the model into a calm troubleshooting checklist.

## The cheat-card: "my computer is slow" → which part?

A slow computer is rarely a mystery and rarely "just old" - it's almost always one part being the bottleneck. Start here; the sections below give the why.

| What you notice | Most likely the culprit | The plain fix |
|---|---|---|
| Everything crawls when many apps/tabs are open; gets better when you close some | **Not enough RAM** (desk too small) | Close apps/tabs; longer term, more RAM |
| The whole machine is sluggish even with little open; apps take ages to *start* | **Slow storage** (old spinning hard drive) | Move to an **SSD** |
| One specific heavy task (video export, a game, lots of number-crunching) is slow | **CPU** can't do the work fast enough | A faster / more-core CPU helps; or expect it to take time |
| "Disk full" warnings; can't save or update | **Storage is full** (cabinet stuffed) | Delete files; bigger drive |
| Was fine, suddenly slow, fans roaring | Often a program stuck in the fetch-execute loop, or **storage full** | Check what's using the CPU/disk; restart |

Every row points at a part you've already met.

## CPU specs: cores and GHz

The CPU is the worker. Two numbers describe it, both straight from the fetch-execute loop in [Phase 2](02-running-a-program.md).

**Cores - how many workers.** A **core** is one worker running the fetch-execute loop. More cores = more clerks doing separate piles of work *at the same time*: a 4-core chip genuinely runs four things at once; an 8-core, eight.

```text
   1 core:   [worker] ── one pile of work at a time
   4 cores:  [worker][worker][worker][worker] ── four piles at once
```

More cores help most for many things at once, or one app smart enough to split its work across workers (video editors, photo tools, big games). An unsplittable chain of steps sits on one core no matter how many you have.

**GHz - how fast each worker goes.** **Clock speed**, measured in **gigahertz (GHz)**, is roughly how many fetch-execute steps each core gets through per second. One GHz is a billion ticks per second.

📝 **Terminology.** "8-core, 3.2 GHz" means eight independent workers, each running about 3.2 billion ticks a second.

⚠️ **Gotcha.** GHz isn't a cross-chip "speed score": a newer 3 GHz CPU can run circles around an older 3.5 GHz one by getting *more useful work done per tick*. It compares cleanly only within the same generation and family - a rough hint, never "more GHz = faster computer."

**For buying:** almost any modern CPU is plenty for browsing, email, documents, and video - the CPU is rarely your bottleneck. Pay up for cores and GHz only for genuinely heavy work: video editing, serious gaming, compile-heavy programming, number-crunching.

## RAM: how big the desk is

RAM is the desk; the spec is **how many gigabytes**, and its effect on daily life is direct. The thing to internalize: RAM mostly doesn't make a given task *faster* - it lets you keep *more going at once* before the computer runs out of desk space and starts parking overflow in slow storage, the exact slowdown from [Phase 2](02-running-a-program.md).

```text
   Enough RAM:   plenty of desk → everything you opened fits → snappy
   Too little:   desk overflows → spill onto slow storage → crawl
```

💡 **Key point.** RAM is the single spec most likely to fix an *everyday* "this feels slow" - everyday slowness is usually too many things open for the desk you've got. It's why "close some tabs" genuinely helps: you're clearing the desk.

**For buying:** RAM is where a beginner's money is usually best spent. Rough, honest guide for a general-purpose laptop today: around 8 GB handles light use but fills up fast with many browser tabs; around 16 GB suits most people; 32 GB and up is for heavy multitaskers and demanding creative or development work. Rules of thumb, not hard limits - your real number depends on how much you keep open. When unsure, more RAM ages better than a slightly faster CPU.

## Storage: SSD vs hard drive, and size

Storage has *two* things worth caring about, and they're different.

**The kind matters more than people expect.** An **SSD** (solid-state drive) is dramatically faster than an old-style **hard drive (HDD)** with its spinning platter. This one choice is often the biggest single difference between a computer that feels instant and one that feels sluggish *everywhere* - because everything you open has to be read up from storage first ([Phase 2](02-running-a-program.md), step 2).

```text
   SSD:  no moving parts, reads fast   → apps & files open quickly
   HDD:  spinning platter, reads slow   → everything feels draggy
```

🪖 **War story.** The classic "my old laptop became unusable" complaint is, more often than not, a slow hard drive - not a worn-out CPU. Swapping its HDD for an SSD can make it feel years younger: the bottleneck was always the slow climb from storage.

**The size is the other number.** Capacity (GB or TB) is how much you can keep - files, photos, apps, the OS. Running low causes its own troubles: "disk full," failed updates, and on some systems extra slowness because the OS has no room to work.

⚠️ **Gotcha.** Don't confuse the *kind* of storage with the *amount*: a huge slow hard drive holds a lot but feels sluggish; a smaller SSD holds less but feels fast. For everyday responsiveness, the SSD wins nearly every time.

**For buying:** prioritize an SSD - treat a spinning hard drive as a deal-breaker for a primary computer. Then pick a capacity that fits your stuff with room to spare.

## Putting it all together

The model one last time, labeled with the specs on the box:

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

You don't need the biggest number in every row: for most people, a modern CPU, comfortable RAM, and a fast SSD make a computer that feels great. When something is slow, ask "which part can't keep up?" - and actually answer it.

## Recap

1. The specs on the box describe the parts you already know: **CPU** (cores + GHz), **RAM** (gigabytes), **storage** (SSD vs HDD, plus size).
2. **CPU cores** = how many workers at once; **GHz** = how fast each goes. Big tasks benefit; GHz isn't comparable across chip families.
3. **RAM** is the desk - more lets you keep more open before slowdown, and it's the most common fix for everyday sluggishness.
4. **Storage**: an **SSD** vastly outperforms an old hard drive for snappiness; capacity is a separate concern about how much you can keep.
5. **"My computer is slow" is diagnosable** - almost always one part as the bottleneck, and the cheat-card maps symptom to part.

That's the whole machine, connected to real decisions. To go deeper on the three parts that matter most, [CPU, RAM, and Storage](/guides/cpu-ram-and-storage) picks up here; for the software layer on top, read [What an Operating System Is](/guides/what-an-operating-system-is).

---

[← Phase 2: How They Work Together to Run a Program](02-running-a-program.md) · [Guide overview](_guide.md)
