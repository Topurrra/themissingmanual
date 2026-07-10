---
title: "The Average Is Lying to You"
guide: "metrics-that-lie"
phase: 1
summary: "How honest-looking numbers mislead: averages hiding skew, survivorship bias, Simpson's paradox, and vanity metrics. Read a dashboard without being fooled."
tags: [metrics, statistics, data-analytics, bias, critical-thinking]
difficulty: beginner
synonyms: ["how averages lie", "survivorship bias explained", "Simpson's paradox example", "vanity metrics vs actionable metrics", "misleading charts truncated axis", "why is the average misleading", "how to read a dashboard critically"]
updated: 2026-07-11
---

# The Average Is Lying to You

You ask "how's the checkout flow doing?" and someone says "average load time is 1.2 seconds." Feels fine. Ship it. Except a chunk of your users are sitting at 9 seconds, rage-quitting, and that pain got blended into a number that sounds healthy. The average didn't lie about the math. It lied by smoothing a cliff into a gentle slope.

This is the first trick to learn because it's underneath all the others: **the mean assumes the world is symmetric and well-behaved, and the world almost never is.**

## What "average" actually does

The arithmetic mean adds everything up and divides by the count — a move that assumes every value pulls with equal, fair weight. Fine when the data is roughly symmetric (heights, say). But the moment a few extreme values show up, they yank the mean toward themselves with no resistance.

```text
Salaries on a small team (in thousands):
  40, 42, 45, 47, 50, 52, 900   ← the founder

  mean   = (40+42+45+47+50+52+900) / 7 = 168
  median = 47   (the middle value when sorted)
```

*What just happened:* the mean says the "average" person earns 168k — nobody on the team earns near that. The single 900 dragged it 120k away from where everyone actually lives. The median, unmoved by extremes, says 47k: a real person on the team.

## Skew is the tell

A distribution is **skewed** when it has a long tail on one side. Income, response times, file sizes, time-on-page, revenue per customer — nearly everything interesting in tech and business is skewed, usually with a long tail to the right (a few huge values).

```text
Right-skewed (long tail to the right):

  count
   |####
   |######
   |####
   |##         tail ─────────────────►
   |#    .   .      .          .
   +----------------------------------------
      median   mean
        ▲        ▲
        |        └─ dragged right by the tail
        └─ sits where most values actually are
```

*What just happened:* in any right-skewed distribution the mean sits to the *right* of the median, pulled by the tail. Reliable gut check: **if the mean is noticeably higher than the median, your data is skewed and the mean is over-reporting the typical case.** Close together means roughly symmetric — the mean can be trusted.

## Why this matters more than it looks

"Average" leaks into decisions everywhere — each leak is a chance to be wrong:

- **Performance:** "average API latency is 120ms" hides the user stuck at 4 seconds. This is exactly why engineers track **p95 / p99** (the value 95% or 99% of requests come in under) instead of the mean — the tail is where the suffering lives.
- **Money:** "average order value is $80" can mean everyone spends ~$80, or it can mean most spend $20 and a few whales spend $5,000. Those are two completely different businesses with the same average.
- **People:** "average time to close a ticket is 2 days" sounds great until you learn half close in an hour and a long tail festers for three weeks.

> The fix isn't "never use the mean." It's: **always ask for the median alongside it, and look at the spread.** Mean and median together tell you the shape. Either one alone is half a sentence.

Let's make the gut check concrete:

```python runnable
data = [40, 42, 45, 47, 50, 52, 900]

mean = sum(data) / len(data)
ordered = sorted(data)
median = ordered[len(ordered) // 2]   # odd count: the middle value

print(f"mean:   {mean:.0f}")
print(f"median: {median}")
print("skewed!" if mean > median * 1.2 else "roughly symmetric")
```

*What just happened:* the code flags skew when the mean runs more than 20% above the median, printing `mean: 168`, `median: 47`, `skewed!` — a one-line alarm that the average isn't describing the typical case here.

### For builders

When you expose a metric in a dashboard or an API, default to showing **median plus a high percentile** (p90 or p95), not the mean. It's the same query cost and it stops your own team from making the average mistake. If you must show one number, the median is the safer default for anything skewed — which is most of what you'll measure.

```quiz
[
  {
    "q": "Seven response times (ms): 80, 85, 90, 95, 100, 110, 5000. Which statement is true?",
    "choices": [
      "The mean describes the typical request well",
      "The mean is dragged far above the typical value by the 5000ms outlier",
      "The median is 5000",
      "Mean and median will be nearly equal"
    ],
    "answer": 1,
    "explain": "One huge outlier yanks the mean upward; the median (~95ms) describes the typical request, the mean does not."
  },
  {
    "q": "For a right-skewed distribution (long tail to the right), where does the mean sit relative to the median?",
    "choices": [
      "To the left of the median",
      "Exactly on the median",
      "To the right of the median",
      "It is impossible to say"
    ],
    "answer": 2,
    "explain": "The long right tail pulls the mean toward the high values, so the mean lands to the right of the median."
  },
  {
    "q": "Why do engineers track p95/p99 latency instead of the mean?",
    "choices": [
      "Percentiles are easier to compute",
      "The mean hides the slow tail where users actually suffer",
      "p99 is always smaller than the mean",
      "The mean cannot be calculated for latency"
    ],
    "answer": 1,
    "explain": "A healthy-looking mean can hide a painful tail; high percentiles expose the worst experiences real users hit."
  }
]
```

[← Overview](_guide.md) | [Phase 2: The Data You Never See →](02-the-data-you-never-see.md)
