---
title: "Auto-Scaling, Explained"
guide: auto-scaling-explained
phase: 0
summary: "Why fixed capacity always loses to real traffic, how auto-scaling decides when to add or remove servers, and the gotchas that catch teams who turn it on and walk away without a load balancer."
tags: [infrastructure, auto-scaling, cloud, scalability, load-balancing]
category: infrastructure
order: 12
difficulty: intermediate
synonyms:
  - what is auto scaling
  - how does auto scaling work
  - horizontal vs vertical scaling
  - what triggers a scale up event
  - why is my app slow right after it scales up
updated: 2026-07-04
---

# Auto-Scaling, Explained

You provision servers for the traffic you expect, and then real traffic shows up and does whatever it wants - a product launch, a viral post, a Monday-morning login rush, a 3am lull where almost nobody's around. Buy for the busiest moment and you're paying for idle machines the other 20 hours a day. Buy for the average and the busy moment falls over. Auto-scaling is the answer to that exact bind: capacity that grows and shrinks with actual demand instead of a guess made once and left alone. This guide covers why you'd want it, how it actually decides to act, and the sharp edges that show up the first time it kicks in for real.

## The phases

1. [Why you'd want this at all](01-why-you-need-this.md) - the peak-vs-average traffic problem, and what over- and under-provisioning each cost you.
2. [How it actually decides to scale](02-how-it-decides.md) - metrics, thresholds, cooldowns, and the policies that turn a number into an action.
3. [The gotchas](03-the-gotchas.md) - cold starts, the thundering herd, and why auto-scaling needs a load balancer to actually work.

[Phase 1: Why you'd want this at all →](01-why-you-need-this.md)
