---
title: "Evaluating LLM Output"
guide: "evaluating-llm-output"
phase: 0
summary: "Evals, not vibes: how to measure whether an LLM feature actually works, catch prompt regressions, and ship changes with confidence."
tags: [evals, llm, testing, quality, ai, regression]
category: ai-ml
order: 9
difficulty: intermediate
synonyms: ["how to evaluate llm output", "what is an eval", "llm as a judge", "how to test prompts", "did my prompt change make it better or worse", "how to measure llm quality", "regression testing prompts", "llm benchmark for my app"]
updated: 2026-07-10
---

# Evaluating LLM Output

You changed the prompt, ran it on three examples, and it looked better - so you shipped. A week later support tells you the summaries got worse for a whole category of inputs you never tried. The plain, uncomfortable truth is that you didn't *know* the change was an improvement. You felt it. And feelings don't catch the case you forgot to look at.

This guide is about replacing the feeling with a measurement. Not a research lab, not a leaderboard - a small, boring set of real inputs with a way to score the output, so that "is this better?" becomes a number you can compare instead of a vibe you can argue about. Once you have that, prompt changes and model upgrades stop being scary leaps in the dark.

## How to read this

- **Want the core idea fast?** Read [Phase 1: Why Vibes Don't Scale](01-why-vibes-dont-scale.md) - what an eval actually is and why three eyeballed examples lie to you.
- **Already convinced, need the how?** Go to [Phase 2: How to Actually Grade Output](02-how-to-grade-output.md) - exact checks, reference-based scoring, and LLM-as-judge with its caveats.
- **Shipping changes and afraid of regressions?** [Phase 3: Evals as a Habit](03-evals-as-a-habit.md) covers regression testing, model upgrades, tracking quality over time, and where offline evals end and production monitoring begins.

## The phases

1. **[Why Vibes Don't Scale](01-why-vibes-dont-scale.md)** - the mental model: you can't improve what you don't measure, eyeballing doesn't scale, and an eval is a real input set plus an expected behavior you can score.
2. **[How to Actually Grade Output](02-how-to-grade-output.md)** - the three grading methods: exact and rule-based checks, reference-based metrics, and LLM-as-judge - when each fits and where each lies to you.
3. **[Evals as a Habit](03-evals-as-a-habit.md)** - regression testing prompts and model upgrades, tracking quality over time, and the line between offline evals, production monitoring, and real user feedback.

> This guide assumes you've already wired a model into your app. If "call the model" is still fuzzy, read [Using an LLM API](/guides/using-an-llm-api) first; the craft of writing the instructions you'll be evaluating lives in [Prompt Engineering, Honestly](/guides/prompt-engineering-honestly).

[Phase 1: Why Vibes Don't Scale](01-why-vibes-dont-scale.md) →
