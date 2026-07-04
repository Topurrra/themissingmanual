---
title: "How teams fool themselves"
guide: ab-testing-explained
phase: 3
summary: "How randomized splits let you measure which variant actually performs better, and the three ways teams accidentally fool themselves with the results."
tags: [ab-testing, experimentation, product-analytics, statistics, data-analytics]
difficulty: beginner
synonyms:
  - what is a/b testing
  - how does ab testing work
  - what is a control group
  - is this result statistically significant
  - why do we need a control group
  - how to tell if an experiment result is real
updated: 2026-07-04
---

# How teams fool themselves

A properly randomized, well-structured test can still produce a false conclusion — not because the setup was wrong, but because of what people do while it's running and after it ends. These three mistakes account for most of the "the test said it worked but it didn't" stories you'll hear.

## Peeking early and stopping the moment it looks good

You launch a test planned to run for two weeks and hit a target sample size. On day three, someone checks the dashboard and the variant is ahead. It "looks like a winner," so the test gets shut down early and shipped.

The problem: a metric that's genuinely tied (no real difference between control and variant) will still drift ahead and behind randomly as data comes in, the same way a fair coin can run heads-heavy for a stretch before evening out. If you check constantly and stop the instant the variant is ahead, you're not measuring "did the variant win" — you're measuring "did the variant get ahead at some point during a noisy walk," which happens far more often than a genuine effect does. This is sometimes called **peeking**, and it's the single most common way a "significant" result turns out to be nothing once the full sample is in.

The fix isn't "never look" — checking for a broken test (errors, a metric collecting zero events) is fine and normal. The fix is: decide the sample size or the end date in advance, and don't treat an early lead as the answer. Let the test finish the run it was planned for.

## Testing so many metrics that something looks significant by chance

Say you track twenty metrics on a test instead of the one you pre-registered: signup rate, time on page, scroll depth, button color engagement, session length, and so on. Pure chance says some of those twenty will show an apparent "win" for the variant even if the variant does absolutely nothing differently from the control — that's how randomness spreads across many measurements.

The trap is picking whichever metric happened to move and presenting it as "the winner," as if it had been the point of the test all along. It wasn't — it was one of twenty lottery tickets, and one of twenty tickets winning isn't a story about the variant, it's a story about how many tickets you bought.

```text
Track 1 metric  -> a "significant" result is meaningful
Track 20 metrics -> expect a few to look "significant" by pure chance
```

*What just happened:* the more things you measure, the more chances randomness has to hand you a coincidence that resembles a real effect. This is exactly why Phase 2 insisted on choosing one metric before the test starts — it's not a formality, it's the thing that prevents this exact mistake.

## Novelty effects fading once the new thing stops being new

Sometimes a redesigned feature genuinely performs better for the first week — and then, three weeks later, the gap has closed or reversed. Nothing about the code changed. What changed is that users were curious about something new and clicked around more, or paid closer attention because it looked different, not because it was better. Once the novelty wears off and the new version becomes the new normal, behavior settles back to whatever it would have been anyway.

This is a **novelty effect**, and it's a real risk for anything visually or structurally different, especially with users who visit repeatedly. A test that only runs for a few days can mistake temporary curiosity for a permanent improvement. The practical guard: for changes likely to trigger novelty (redesigns, new UI patterns, anything visually loud), run the test long enough to see whether the effect holds after the initial curiosity fades, and pay attention to whether the gap is shrinking over the course of the test rather than holding steady.

> A win in week one that's gone by week three isn't a failed test — it's the test doing its job and revealing that the effect wasn't durable.

## The thread connecting all three

Every mistake in this phase comes from the same root: treating a noisy process as if a single glance at it tells the whole truth. Peeking early trusts a glance mid-run. Metric fishing trusts whichever glance happened to look good. Novelty effects trust a glance taken before the effect had time to settle. The discipline that fixes all three is the same one from Phase 2 — decide the metric and the sample size before you start, and let the test run its planned course before you draw a conclusion from it.

[← Phase 2: How a real test is structured](02-structuring-a-test.md) | [Overview](_guide.md)
