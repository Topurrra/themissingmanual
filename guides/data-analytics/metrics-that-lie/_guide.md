---
title: "Metrics That Lie"
guide: "metrics-that-lie"
phase: 0
summary: "How plausible-looking numbers mislead: averages hiding skew, survivorship bias, Simpson's paradox, and vanity metrics. Read a dashboard without being fooled."
tags: [metrics, statistics, data-analytics, bias, critical-thinking]
category: data-analytics
order: 9
difficulty: beginner
synonyms: ["how averages lie", "survivorship bias explained", "Simpson's paradox example", "vanity metrics vs actionable metrics", "misleading charts truncated axis", "why is the average misleading", "how to read a dashboard critically"]
updated: 2026-07-11
---

# Metrics That Lie

Someone drops a number in a slide - "average response time is 200ms," "90% of users love it," "revenue is up and to the right" - and the room nods. The number is real, nobody made it up, and it's still steering you off a cliff. The lie isn't in the arithmetic; it's in what the number quietly leaves out.

This guide hands you the small set of tricks that fool almost everyone: an average that hides a long tail, data that only contains the survivors, a trend that flips when you split it by group, and pretty numbers that move without meaning. Once you've seen each one, you can't unsee it - and you stop getting played.

## How to read this
- **Got a number in front of you right now that smells off?** Skim [Phase 3: Reading a Dashboard Without Getting Fooled](03-reading-without-getting-fooled.md) - it's a field checklist for the moment of suspicion.
- **Want it to actually stick?** Read in order. We start with the one mistake under all the others (averages), then the biases hiding in the data, then how to defend yourself live.

## The phases
1. **[The Average Is Lying to You](01-the-average-is-lying.md)** - why the mean breaks the moment data is skewed or has outliers, what the median does instead, and why "average" is the most over-trusted word in analytics.
2. **[The Data You Never See](02-the-data-you-never-see.md)** - survivorship bias, base rates, and Simpson's paradox: three ways a dataset can be accurate and still point you the wrong way because of who's missing or how it's split.
3. **[Reading a Dashboard Without Getting Fooled](03-reading-without-getting-fooled.md)** - vanity vs actionable metrics, cherry-picked date ranges, truncated axes, and a quick interrogation you can run on any number in under a minute.

> This guide is the applied, paranoid sibling of [Probability and Statistics](/guides/probability-and-statistics) - that one builds the machinery, this one shows you where people abuse it. For turning clean numbers into decisions, see [Building a BI Dashboard That's Actually Useful](/guides/bi-dashboards-that-work).

[Phase 1: The Average Is Lying to You](01-the-average-is-lying.md) →
