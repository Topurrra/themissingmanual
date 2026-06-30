---
title: "How to Reproduce a Bug"
guide: "how-to-reproduce-a-bug"
phase: 0
summary: "Reproduction is the skill that makes every fix possible: turn a vague report into a bug you can trigger on demand, shrink it to its essence, and tame the intermittent ones that won't show up when you're watching."
tags: [debugging, reproduction, troubleshooting, heisenbug, minimal-repro]
category: debugging
order: 4
difficulty: intermediate
synonyms: ["how to reproduce a bug", "can't reproduce the bug", "works on my machine", "how to make a bug happen reliably", "what is a minimal reproduction", "intermittent bug won't reproduce", "how to fix a heisenbug"]
updated: 2026-06-19
---

# How to Reproduce a Bug

A ticket lands: "App crashes sometimes." Or a teammate leans over: "It's broken, can you look?" You open the code, you stare, and nothing is obviously wrong. The dread that follows isn't really about the bug - it's the sinking feeling that you have no way to *get at* it. You can't see it happen, so you can't tell if it's fixed, so you're poking in the dark and hoping.

Here's the relief: almost every "I can't fix this" is actually "I can't reproduce this yet." Reproduction is the skill that turns a ghost story into a controllable experiment - something you can trigger whenever you want, watch closely, shrink down, and finally confirm dead. Get good at this one thing and the rest of debugging stops being scary. This guide shows you how.

## How to read this

- **Fighting a bug that won't show itself right now?** Jump to [Phase 3: When It Won't Reproduce (Heisenbugs)](03-when-it-wont-reproduce.md) - the cheat-card at the top maps each "it's intermittent" symptom to a tactic.
- **Want the skill to finally click?** Read in order. Each phase builds the one before it: why reproduction is the whole game, how to pin a bug down, then what to do when it fights back.

## The phases

1. **[Why Reproduction Is the Whole Game](01-why-reproduction-is-the-whole-game.md)** - you can't fix (or *prove* you fixed) what you can't trigger on demand. The mental model: make it happen reliably, then shrink it.
2. **[Nailing It Down](02-nailing-it-down.md)** - the four variables that actually matter (steps, environment, data, state/timing), and how to build a minimal reproduction by removing everything that isn't load-bearing. Includes "works on my machine," decoded.
3. **[When It Won't Reproduce (Heisenbugs)](03-when-it-wont-reproduce.md)** - the intermittent ones: the usual culprits (timing, uninitialized state, external dependencies, caching) and the tactics that drag them into the light.

> Deliberately deferred to follow-up guides: how to *fix* a bug once you can trigger it (see [Using a Debugger](/guides/using-a-debugger)), reading the crash output it produces (see [Reading a Stack Trace](/guides/reading-a-stack-trace)), and hunting down *which commit* introduced it (see [Bisecting a Bug](/guides/bisecting-a-bug)). This guide is only about getting the bug to happen on command.
