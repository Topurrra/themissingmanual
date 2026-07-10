---
title: "The Data You Never See"
guide: "metrics-that-lie"
phase: 2
summary: "How honest-looking numbers mislead: averages hiding skew, survivorship bias, Simpson's paradox, and vanity metrics. Read a dashboard without being fooled."
tags: [metrics, statistics, data-analytics, bias, critical-thinking]
difficulty: beginner
synonyms: ["how averages lie", "survivorship bias explained", "Simpson's paradox example", "vanity metrics vs actionable metrics", "misleading charts truncated axis", "why is the average misleading", "how to read a dashboard critically"]
updated: 2026-07-11
---

# The Data You Never See

Phase 1 was about a number describing the data badly. This phase is scarier: the data itself can be honest and complete-looking, and still point you the wrong way — because of who's *missing* from it, what the background rate is, or how it's sliced. No bad math required. These three biases fool smart people daily.

## Survivorship bias: the dataset only contains the winners

The classic story: in World War II, analysts looked at returning bombers, mapped where they'd been shot, and proposed armoring those spots. Statistician Abraham Wald pointed out the obvious-once-said: those are the planes that *came back*. The bullet holes mark where a plane can take a hit and survive. The armor belongs on the spots with *no* holes — planes hit there never returned to be measured.

```text
Planes that returned:    holes on wings, tail, fuselage
Planes that didn't:      (not in your dataset at all)

  Naive read:  "wings get hit most → armor the wings"
  Wald's read: "we only see survivors → armor the UNmarked spots"
```

*What just happened:* the data was real and carefully collected — and still misleading, because the most important cases (the planes that went down) were silently absent. **Survivorship bias is the error of analyzing only the things that made it through some filter, while the filtered-out cases hold the answer.**

You hit this constantly:
- "Successful founders all dropped out of college" — you're not counting the far larger pile of dropouts who failed and never got interviewed.
- "Our long-time customers love feature X" — the people who hated it churned and aren't in your survey.
- "This trading strategy returned 30%/year backtested" — funds that blew up got dropped from the database you tested against.

The defense is one reflex question: **who or what got filtered out before this data was collected?**

## Base rates: a number means nothing without its denominator

A test for a rare disease is "99% accurate." You test positive. Are you 99% likely to be sick? Almost everyone says yes. The real answer is often *no* — because of the **base rate**, how common the thing is to begin with.

```text
Disease affects 1 in 1,000 people.
Test: 99% accurate (1% false-positive rate).
Test 100,000 people:

  Actually sick:     100  →  ~99 test positive   (true positives)
  Actually healthy:  99,900 → ~999 test positive  (false positives)

  Of everyone who tests positive:  99 / (99 + 999) ≈ 9%
```

*What just happened:* even with a "99% accurate" test, a positive result means only ~9% chance you're actually sick — the disease is so rare that false positives from the huge healthy group swamp the true positives. **A rate (accuracy, conversion, click-through) is meaningless until you anchor it to how common the underlying event is.** Ignore the base rate and you'll wildly over-react to any positive signal.

## Simpson's paradox: the trend flips when you split it

This is the one that breaks people's brains. A trend that's clearly true in the combined data can *reverse* in every subgroup. Same numbers, opposite conclusions.

```text
Treatment success rates, combined:
  Treatment A:  78%   ← looks better overall
  Treatment B:  83%

Now split by case severity:

              Mild cases        Severe cases
  Treatment A   93% (81/87)       73% (192/263)
  Treatment B   87% (234/270)     69% (55/80)

  → A wins in mild AND in severe, but loses overall.
```

*What just happened:* Treatment A beats B in mild cases *and* severe cases — yet loses on the combined number. The trick is **which group each treatment was given to.** A got mostly the hard, severe cases (lower success rates for anyone); B got mostly the easy mild ones. The combined average reflects the *case mix*, not the treatment. Aggregate first and you'd pick the worse treatment.

```text
The lurking variable here is CASE SEVERITY.
It correlates with both:
  - which treatment you got (assignment)
  - how likely you were to succeed (outcome)
That hidden third variable is what flips the sign.
```

*What just happened:* Simpson's paradox always comes from a **lurking variable** — a hidden third thing tied to both the group and the outcome. When the groups aren't comparable (different case mixes, traffic sources, time periods), the combined number can say the opposite of the truth. The defense: **when comparing two things, ask whether the groups are actually alike — and split by the obvious confounder to see if the story holds.**

> Survivorship bias, base rates, and Simpson's paradox share one root: **the number is fine, but the data behind it isn't representative of the question you're asking.** Who's missing, what's the background rate, and are the groups comparable. Three questions, most of your defense.

### For builders

When you build a comparison view — A/B test results, cohort tables, regional performance — give people a **"split by" control** for the obvious confounders (device, plan tier, signup channel, time period). A single combined KPI is precisely where Simpson's paradox hides; letting a user break the number down by one dimension turns an invisible reversal into a visible one. The deeper machinery — confidence intervals, controlling for variables — lives in [Probability and Statistics](/guides/probability-and-statistics).

```quiz
[
  {
    "q": "A VC says 'most unicorn founders are under 30, so we only fund young founders.' What bias is most likely at work?",
    "choices": [
      "Simpson's paradox",
      "Survivorship bias — failed young founders aren't in the 'unicorn' dataset",
      "Truncated axis",
      "Base-rate neglect only"
    ],
    "answer": 1,
    "explain": "Looking only at unicorns ignores the far larger pool of young founders who failed; the dataset contains only survivors."
  },
  {
    "q": "A disease affects 1 in 1,000. A test is 99% accurate. You test positive. Roughly how likely are you to actually have it?",
    "choices": [
      "About 99%",
      "About 90%",
      "About 9%",
      "Exactly 50%"
    ],
    "answer": 2,
    "explain": "Because the disease is rare, false positives from the large healthy group dominate, dropping the real probability to roughly 9%."
  },
  {
    "q": "Treatment A beats B in both mild and severe cases, yet loses on the combined rate. The cause is:",
    "choices": [
      "A calculation error in one subgroup",
      "A lurking variable (case mix) that differs between the groups",
      "The mean being pulled by an outlier",
      "A truncated chart axis"
    ],
    "answer": 1,
    "explain": "This is Simpson's paradox: a hidden variable tied to both group assignment and outcome flips the combined result."
  }
]
```

[← Phase 1: The Average Is Lying to You](01-the-average-is-lying.md) | [Overview](_guide.md) | [Phase 3: Reading a Dashboard Without Getting Fooled →](03-reading-without-getting-fooled.md)
