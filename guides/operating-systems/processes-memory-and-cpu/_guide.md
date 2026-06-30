---
title: "Processes, Memory & the CPU - Diagnosing a Slow or Stuck Machine"
guide: "processes-memory-and-cpu"
phase: 0
summary: "What '100% CPU' and 'out of memory' actually mean, and how to find the one process that's the culprit - using top and Task Manager you already have."
tags: [operating-systems, processes, cpu, memory, ram, swap, performance]
category: operating-systems
order: 4
difficulty: intermediate
synonyms: ["what does 100% cpu mean", "what does out of memory mean", "why is my computer slow", "what is a process", "how to find what is using my cpu", "what is swap memory", "what is the oom killer", "how to read top command"]
updated: 2026-06-19
---

# Processes, Memory & the CPU

The machine is dragging. The fan is screaming, the cursor stutters, and a status bar somewhere says **100% CPU** or your editor pops up a box that says **out of memory** and dies. You don't know which program did it, or even what those words really mean - so it feels like the computer is just *unwell*, the way a person gets a fever.

Here's the relief: those phrases aren't vague. They name something exact, happening right now, that you can *find* - usually one specific process, sitting in a list, misbehaving. This guide teaches you to read that list. By the end, "100% CPU" and "out of memory" stop being weather and become a row you can point at.

This guide builds on [What an Operating System Is](/guides/what-an-operating-system-is). If "process," "kernel," or "RAM vs. disk" are fuzzy, read that first - we won't re-teach the basics here, we'll go deeper into the two jobs (running programs and handing out memory) that slowdowns come from.

## How to read this
- **Machine on fire right now?** Jump to whichever symptom matches - CPU pinned at 100% is [Phase 2: What "100% CPU" Really Means](02-what-100-cpu-really-means.md); "out of memory" or grinding-to-a-crawl slowness is [Phase 3: What "Out of Memory" Really Means](03-what-out-of-memory-really-means.md). Each opens with how to find the culprit.
- **Want it to finally make sense?** Read in order. Phase 1 gives you the vocabulary (what a process actually is and how you stop one) that the other two phases lean on.

## The phases
1. **[Processes, Up Close](01-processes-up-close.md)** - what a process really is: its PID, its parent, foreground vs. background, the states it sits in (running, sleeping, zombie), and what Ctrl-C, `kill`, and "End task" actually *do* to it.
2. **[What "100% CPU" Really Means](02-what-100-cpu-really-means.md)** - cores, the scheduler handing out turns, what "load average" tells you, why one runaway process can pin a core, and how to spot it in `top` / Task Manager.
3. **[What "Out of Memory" Really Means](03-what-out-of-memory-really-means.md)** - RAM vs. virtual memory, paging/swap and why swapping makes everything crawl, what "this app uses 4 GB" means, and the OOM killer - the OS killing a process to save itself.

> This guide is about *diagnosis* - naming the culprit. Deep tuning (changing scheduler priorities with `nice`, sizing a swap file, configuring cgroup memory limits) is deferred to a follow-up guide; here we get you to "that process, right there."

---

[Phase 1: Processes, Up Close →](01-processes-up-close.md)
