---
title: "Why Vibes Don't Scale"
guide: "evaluating-llm-output"
phase: 1
summary: "You can't improve what you don't measure: eyeballing a few examples lies to you, and an eval is a real input set plus an expected behavior you can score."
tags: [evals, llm, quality, mental-model, testing]
difficulty: intermediate
synonyms: ["what is an eval", "why eyeballing llm output is bad", "how to measure if a prompt is better", "what does an eval set look like", "vibe check llm"]
updated: 2026-07-10
---

# Why Vibes Don't Scale

Here's the loop almost everyone runs at first. Write a prompt. Paste in an example. Read the output. "Yeah, that's good." Ship it. Then tweak the prompt to fix one annoying thing, paste in the *same* example, read it again, "better," ship. That loop feels like progress because each step ends with you nodding at a screen.

The problem is what the loop can't see. You tested the input you happened to pick. You judged it with a brain that already knew what you wanted and read it in charitably. And you have no record of yesterday's output to compare against, so you can't actually tell whether today's change helped, hurt, or moved the problem somewhere you didn't look.

## You can't improve what you don't measure

This isn't an AI-specific law; it's an engineering one. If "better" is a feeling in your head, then two people can look at the same output and disagree, and *you* can disagree with yourself next week. There's nothing to point at.

A model feature has a sharper version of this problem than normal code, for three reasons:

- **The output space is huge.** A function returns `true` or `false`; a model returns one of effectively infinite strings. "Correct" is often a range, not a single value.
- **It's non-deterministic.** The same input can give different output on different runs, so a single good result doesn't prove the next one will be good.
- **Changes have spooky reach.** Editing one line of a prompt can improve the case you were looking at and silently break a category you weren't. There's no compiler to catch it.

Put together: the thing most likely to mislead you is exactly the thing you're using to judge it - your eyes, on a handful of cases, once.

## What "eyeballing doesn't scale" really means

It's not that looking at output is wrong. Looking is essential. The failure is *only* looking, *a few times*, *with no fixed set*.

```text
The vibe loop                         What it misses
─────────────                         ──────────────
1 input you picked       ──────────▶  the 20 inputs you didn't
read it once, charitably ──────────▶  the reader who isn't you
no saved baseline        ──────────▶  "is this better than before?"
ship on a nod            ──────────▶  the regression three categories over
```

*What just happened:* Each thing the vibe loop skips is a place a real bug hides. Eyeballing scales fine for one look at one case - it falls apart the moment you need to compare versions or cover the inputs you didn't think of.

The fix isn't to look harder. It's to **write down what you're looking for, once, against a set of inputs you keep** - so the judgment is fixed, repeatable, and the same every time you run it. That fixed set is an eval.

## What an eval actually is

Strip away the jargon and an eval is two things:

1. **A set of real inputs** - the kinds of things your feature actually receives. Not toy examples; the messy, boring, edge-y cases from real usage.
2. **A way to decide if the output was acceptable** for each input - an *expected behavior* you can check, whether that's an exact value, a rule, or a judgment.

If you've written a test suite, this will feel familiar, because it *is* a test suite - for a component whose output you can't pin to a single exact string. Each row is "given this input, the output should behave like *this*," and running the eval scores the current model-plus-prompt against the whole set at once.

A single row might look like this:

```json
{
  "input": "Reset my password, I'm locked out and the reset email never arrives.",
  "expected_intent": "account_access",
  "must_mention": ["spam folder", "support"],
  "must_not": ["refund", "make up a ticket number"]
}
```

*What just happened:* This row turns a fuzzy hope ("the bot should handle locked-out users well") into checkable facts: it should classify the intent as `account_access`, it should mention the spam folder and a way to reach support, and it must not wander into refunds or invent a ticket number. None of that needs a human re-reading it each run.

The magic isn't any one row. It's that you have *thirty* of them, drawn from real inputs, and you can run all thirty in seconds - so "did my change help?" becomes "27/30 passed, up from 24/30" instead of "felt good to me."

## Where the inputs come from

The most common eval mistake is making up clean, easy inputs that the model was always going to nail. An eval full of softballs tells you nothing. Get real ones:

- **Production logs.** The actual inputs your feature received. Gold.
- **The failures you remember.** Every time the model embarrassed you, that case belongs in the set - permanently. An eval is also a graveyard of past bugs that must never come back.
- **Edge cases on purpose.** Empty input, very long input, a different language, an adversarial "ignore your instructions" attempt, the input that's *almost* in scope but isn't.

You don't need hundreds to start. Twenty to fifty real, varied cases beat a thousand synthetic clean ones, because they exercise the places the model actually fails.

> 🪖 **War story.** A team "improved" their summarizer prompt and shipped on a glowing demo. The new prompt was tuned, unknowingly, for short articles - the demo input. On long articles it now truncated halfway and dropped the conclusion. A ten-row eval with two long articles in it would have turned the celebration into a red row before anyone shipped. They built the eval *after* the incident, which is the most common time teams build their first one.

## For builders

Start smaller than feels respectable. A `evals.jsonl` file with fifteen real inputs and a five-line script that runs them and prints `passed/total` is already better than every team still shipping on vibes - including, until recently, you. The discipline that matters is *keeping* the file and *adding to it* every time something breaks. Phase 2 is about the scoring; this phase is about accepting that without a fixed set to score against, you're guessing with extra steps.

```quiz
[
  {
    "q": "Why is eyeballing a few outputs especially misleading for an LLM feature compared to ordinary code?",
    "choices": [
      "Models are always wrong, so any output looks bad",
      "The output space is huge and non-deterministic, and prompt changes can silently break cases you didn't look at",
      "You can't read model output without special tools",
      "Ordinary code never has bugs"
    ],
    "answer": 1,
    "explain": "Huge output space, run-to-run variation, and far-reaching prompt changes mean a few charitable looks miss the cases that actually break."
  },
  {
    "q": "What are the two core ingredients of an eval?",
    "choices": [
      "A bigger model and a faster GPU",
      "A leaderboard score and a benchmark name",
      "A set of real inputs plus a way to decide if each output is acceptable",
      "A long prompt and a low temperature"
    ],
    "answer": 2,
    "explain": "An eval is real inputs paired with an expected behavior you can score - essentially a test suite for fuzzy output."
  },
  {
    "q": "Where do the best eval inputs come from?",
    "choices": [
      "Clean made-up examples the model is sure to pass",
      "Production logs, remembered failures, and deliberate edge cases",
      "The model's own training data",
      "Whatever input is shortest to type"
    ],
    "answer": 1,
    "explain": "Real, messy, and previously-failing inputs exercise where the model actually breaks; softball synthetic inputs tell you nothing."
  }
]
```

[← Guide overview](_guide.md) · [Phase 2: How to Actually Grade Output →](02-how-to-grade-output.md)
