---
title: "What '100% CPU' Really Means"
guide: "processes-memory-and-cpu"
phase: 2
summary: "Your CPU has several cores; the scheduler gives processes rapid turns. '100% CPU' usually means one runaway process pinning a core — find it by sorting top / Task Manager by CPU."
tags: [cpu, cores, scheduler, load-average, top, task-manager, performance]
difficulty: intermediate
synonyms: ["what does 100 percent cpu mean", "what is a cpu core", "what is the scheduler", "what is load average", "why is one process using all my cpu", "how to find what is using cpu", "cpu pinned at 100"]
updated: 2026-06-19
---

# What "100% CPU" Really Means

The fan spins up to jet-engine volume, the cursor jerks, and something reports **100% CPU**. The instinct is to read that as "the computer is full, there's no room" — like a glass that's overflowing. That picture is wrong, and the wrong picture is why it feels hopeless.

Here's the true picture: 100% CPU doesn't mean *broken*, it means *fully booked*. The CPU is doing the maximum amount of work it can per second, and right now demand is higher than supply. The useful question is never "why is it 100%" — it's **"who is taking it all?"** And that has an answer you can read off a list in about ten seconds.

> ⏭️ This phase uses *process*, *PID*, and *running vs. sleeping* from [Phase 1](01-processes-up-close.md). If those are fuzzy, skim Phase 1's recap first.

## Find the culprit (do this first)

You're probably here mid-slowdown, so the cheat-card comes first; the *why* is underneath.

| You're on | Open it | Then |
|---|---|---|
| **Windows** | Task Manager (Ctrl + Shift + Esc) | Click the **CPU** column header to sort; the top row is your culprit |
| **macOS** | Activity Monitor → **CPU** tab | Click the **% CPU** column to sort descending |
| **Linux / any terminal** | type `top` | It already sorts by CPU; the top row is the culprit. Press `q` to quit |

The process at the top of that sorted list, sitting at a high `%CPU`, is what's burning your machine. Now here's why that number means what it means.

## A CPU is several cores: several lanes, not one

**What it actually is.** Your CPU isn't a single worker — it's several independent workers called **cores**, each able to run one process at a time. A "4-core" chip can genuinely do four things at once; an 8-core, eight. Think of cores as checkout lanes at a store: more lanes, more customers served simultaneously.

📝 **Terminology.** A *core* is one independent processing unit inside the CPU. "How many cores" = how many processes can *truly* run at the same instant. (Some chips advertise more "threads" than cores via hyper-threading — treat each thread as roughly a lane for our purposes.)

**Why this matters for that percentage.** This is the trap in "100% CPU." On some tools the number is averaged across *all* cores, so 100% means *every* lane is full. But other tools — including the classic `top` — count each core as 100%, so a single process hammering one core out of four shows up as **100%** there, even though three lanes are idle. Same machine, two different numbers. Knowing whether you're looking at per-core or overall is the difference between "one process gone wild" and "the whole machine is slammed."

## The scheduler: how dozens of processes share a few lanes

**What it actually is.** You have hundreds of processes and maybe 4–8 cores. The part of the kernel that decides *who runs on which core, and for how long* is the **scheduler**. It runs a process for a few milliseconds, pauses it, runs the next, and cycles through everyone fast enough that it *looks* simultaneous — the trick from the OS guide, now with a name and a job.

```text
   One core, over a few milliseconds:

   ms 1   ms 2   ms 3   ms 4   ms 5   ms 6
   [chrome][music][edit ][chrome][music][edit ]   ← scheduler rotates turns

   Plenty of cores, light load → everyone gets turns instantly → feels fast.
   Too many hungry processes → your turn comes around late → feels sluggish.
```

**Why this saves you later.** "Slow" usually isn't a broken CPU — it's the scheduler with more demand than it can satisfy, so each process's turn arrives later. That's why closing a couple of greedy programs makes everything *else* snap back: you freed up turns for the rest. The CPU was never sick; it was overbooked.

## Load average: the line at the door

**What it actually is.** On macOS and Linux, `top` shows three **load average** numbers. Load average is, roughly, the average number of processes that *wanted* a CPU core over the last 1, 5, and 15 minutes — those running plus those queued and waiting for a turn. It's the length of the line at the checkout, including people already being served.

**How to read it (the key rule):** compare load to your **core count**.

```text
   load average: 0.42, 0.55, 0.59     ← example readout

   On a 4-core machine:
     load ~4   → lanes roughly full; healthy and busy
     load < 4  → cores to spare (0.42 here = very relaxed)
     load > 4  → more demand than cores; processes queueing, things lag
     load 8 on 4 cores → twice the work the cores can serve → sluggish
```
*What just happened:* These three numbers (an example, not a measurement of your machine) read newest-first: `0.42` over the last minute, `0.55` over five, `0.59` over fifteen. All well under a 4-core budget, and roughly flat — a calm machine, no buildup. If the one-minute figure were *much higher* than the fifteen-minute one, that's a spike just starting; *much lower* means a storm that's passing.

⚠️ **Gotcha.** Load average counts processes waiting on **disk and other resources**, not only on the CPU. So a machine can show a high load while the CPU itself looks idle — that's usually a *disk* or *I/O* bottleneck (something stuck waiting to read/write), not a CPU one. High load + low CPU% = look at the disk, not the cores.

## Why one runaway process can pin a whole core

**What it actually is.** A **runaway** process is one stuck doing useless work without pausing — most often an infinite loop, or a retry that never gives up. Remember from Phase 1: only a *running* process burns CPU. A normal program does a little work, then **sleeps** (waiting for input, network, a timer). A runaway never sleeps — it stays in the *running* state, so the scheduler keeps handing it turns, and it devours one core completely.

```text
   Healthy process:   work · sleep · work · sleep · work · sleep   (shares nicely)
   Runaway process:   work · work · work · work · work · work …    (never lets go)
                      └─ pins one core at 100%, fan screams ─┘
```

**A real example.** Here's `top` with a culprit, sorted by CPU (the default):

```console
$ top
top - 16:48:22 up 5 days,  6:31,  2 users,  load average: 1.74, 0.98, 0.71
Tasks: 318 total,   2 running, 316 sleeping
%Cpu(s): 26.1 us,  1.4 sy, 72.0 id
MiB Mem :  15872.0 total,   4810.2 free,   7002.1 used,   4059.7 buff/cache

    PID USER      %CPU  %MEM     TIME+ COMMAND
   7731 ada       99.4   0.6   2:14.83 python3
   4821 ada        6.2   7.1   4:03.11 firefox
   1190 ada        1.1   2.1   1:22.04 gnome-shell
   9032 ada        0.4   0.3   0:00.09 top
```
*What just happened:* (an illustrative readout) Read it as a story. `Tasks: ... 2 running` — out of 318 processes, only **two** are actually running; the other 316 are sleeping, costing nothing. The top row is the whole problem: PID `7731`, a `python3` script, at **99.4% CPU**. On this per-core tool that's one core completely pinned. Its `TIME+` of `2:14` (over two minutes of CPU time burned, fast) and the rising `load average` 1.74-over-the-last-minute vs 0.71-over-fifteen both say this started recently and is climbing. Everything else — even Firefox — is barely using the CPU. The machine isn't sick; *one script* is.

From here you have the two facts you need: the **name** (`python3` — what is it? a script you ran? a stuck tool?) and the **PID** (`7731` — the handle to stop it). Recall its parent with `ps` if you want to know *what launched it* before you kill it.

⚠️ **Gotcha.** Before you `kill -9` a CPU hog, check it's truly *runaway* and not just *busy*. A video export, a code compile, or a backup *should* use lots of CPU — that's the work you asked for, and it'll finish. A runaway is work that has no end: same task, climbing `TIME+`, no progress, often a process you didn't knowingly start. Busy is temporary and purposeful; runaway is forever and pointless.

🪖 **War story.** The classic 2am page: "server slow, users complaining." `top`, sorted by CPU, one row at `99%` — a deploy script that hit an error and retried in a tight loop with no delay, spinning one core forever. The fix wasn't restarting the server or "adding more CPU." It was `kill 7731` (politely) and a one-line `sleep` added to the retry. The whole drama, the whole 2am, was *one row in a list*.

## Recap

1. **100% CPU = fully booked, not broken.** The right question is *who's taking it,* and that's a sortable list.
2. **Cores are lanes.** Several processes run truly at once; the per-tool meaning of "100%" depends on whether it counts per-core or overall.
3. **The scheduler** hands out rapid turns; "slow" is usually more demand than turns, which is why closing greedy apps revives the rest.
4. **Load average** = the line at the door; compare it to your **core count**. High load with idle CPU means a *disk/I-O* bottleneck.
5. **A runaway process** never sleeps, so it pins a core. Find it by sorting on CPU; grab it by **name + PID**; confirm it's runaway (endless, pointless) not just busy (purposeful, finite) before you kill it.

CPU is one of the two things a stuck machine runs out of. The other feels different — not a screaming fan but a grinding, molasses slowness, ending in "out of memory." That's a different mechanism with a different fix, and it's next.

---

[← Phase 1: Processes, Up Close](01-processes-up-close.md) · [Guide overview](_guide.md) · [Phase 3: What "Out of Memory" Really Means →](03-what-out-of-memory-really-means.md)
