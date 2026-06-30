---
title: "Web Performance and Core Web Vitals"
guide: "web-performance-core-web-vitals"
phase: 0
summary: "What actually makes a page feel fast: LCP, CLS, and INP, the Network tab and bundle size, and the fixes that move the numbers."
tags: [performance, web-performance, core-web-vitals, lcp, cls, inp, lighthouse, frontend]
category: performance
order: 9
difficulty: intermediate
synonyms: ["core web vitals explained", "why is my website slow", "what is lcp cls inp", "how to make a web page load faster", "improve lighthouse score", "fix layout shift", "page feels slow to load"]
updated: 2026-06-30
---

# Web Performance and Core Web Vitals

Your page "works." It loads, eventually. But someone — a user, a manager, a Lighthouse report glaring red — says it feels slow, and you're not sure what that means or what to touch first. You open dev tools, see a wall of numbers, and close it again.

Here's the relief: web performance isn't a vague vibe, and it isn't a thousand micro-tricks. It's a small set of things users actually feel, three numbers that measure those feelings, and a short list of levers that move them. This guide gives you the mental model, the everyday tools, and the fixes that actually pay — so the next time a page feels slow, you know exactly where to look.

## How to read this

- **Want it to finally make sense?** Read in order. Each phase builds on the last, and it's short.
- **Already have a bad score and need the fixes?** Jump to [Phase 3: The Levers That Move the Numbers](03-the-levers-that-move-the-numbers.md).
- **Confused about why your local test and the real score disagree?** That's [Phase 2: Measuring What Users Feel](02-measuring-what-users-feel.md).

## The phases

1. **[Perceived Performance and the Three Vitals](01-perceived-performance-and-the-three-vitals.md)** — performance is what the user *feels*, not what a server log says. The three Core Web Vitals — LCP, CLS, and INP — turn those feelings into numbers you can chase.
2. **[Measuring What Users Feel](02-measuring-what-users-feel.md)** — lab versus field data, why Lighthouse and real users disagree, and how to read the Network tab to see where the time and the bytes actually go.
3. **[The Levers That Move the Numbers](03-the-levers-that-move-the-numbers.md)** — the fixes that pay: bundle size and code splitting, images, caching and a CDN, render-blocking resources, and sizing media so the layout stops jumping.

> This guide assumes you already know what "fast" means in the abstract — latency, throughput, measure-before-you-optimize. If that's shaky, start with [What "Performance" Even Means](/guides/what-performance-means). For the disciplined loop that turns a measurement into durable speed, see [Optimizing Real Systems](/guides/optimizing-real-systems).

[Phase 1: Perceived Performance and the Three Vitals](01-perceived-performance-and-the-three-vitals.md) →
