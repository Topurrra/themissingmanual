---
title: "Metrics That Inform vs Vanity Metrics"
guide: "bi-dashboards-that-work"
phase: 2
summary: "A useful metric changes a decision; a vanity metric only feels good. Choose the right aggregation, the right denominator, and add the context — comparison, target, trend — that turns a number into meaning."
tags: [metrics, vanity-metrics, kpis, aggregation, data-analytics]
difficulty: intermediate
synonyms: ["what are vanity metrics", "useful metrics vs vanity metrics", "total signups vs active users", "how to choose a metric", "average vs median dashboard", "what denominator to use", "add context to metrics"]
updated: 2026-06-19
---

# Metrics That Inform vs Vanity Metrics

Picture two numbers on a dashboard. One says **Total signups: 1,284,000** — big, green, always going up, feels amazing in a board deck. The other says **Active users this week: 8,200, down 4% from last week.** Only one of these will ever make anyone do anything. The first can literally never go down (it's a cumulative count), so it can't tell you whether you're winning or losing. The second just told you something's slipping.

The difference between those two numbers is the whole game of this phase. A **vanity metric** feels good and informs nothing. A metric that informs *changes a decision*. Here's how to tell them apart, and how to build numbers that actually carry meaning.

## The dividing line: does it change a decision?

**What it actually is.** A vanity metric is a number that mostly goes up and to the right, looks good, and would not change anyone's plans no matter what it did. A useful metric is one where a different value would lead to a different action.

📝 **Terminology.** *Vanity metric* — a measurement chosen because it flatters (big, always rising, easy to grow) rather than because it informs a decision. The classic tell: you can't imagine an action you'd take if it dropped.

**The test, applied.** Run any metric through the question from Phase 1: *"If this changed, what would someone do?"*

| Metric | If it changed, you'd... | Verdict |
|---|---|---|
| Total signups ever | ...nothing. It can't drop, and it doesn't tell you if anyone's still here. | Vanity |
| Active users this week | ...investigate a drop, double down on a rise. | Informs |
| Total page views | ...usually nothing — views without context don't map to an action. | Vanity (mostly) |
| Conversion rate this week vs last | ...change the funnel if it dropped. | Informs |
| Cumulative revenue all-time | ...nothing; it only ever grows. | Vanity |
| Revenue this month vs target | ...push sales / cut spend if you're behind. | Informs |

Notice the pattern: the vanity column is full of **cumulative all-time totals**, and the informs column is full of **rates, recent windows, and comparisons**. That's not a coincidence — it's the next three sections.

⚠️ **Vanity metrics aren't lies — they're just unactionable.** "Total signups" is a real, correct number. The problem isn't accuracy; it's that it can't lose. Anything that only ever goes up can't tell you when you're in trouble, and a metric that can't deliver bad news can't drive a decision.

## Choosing the right aggregation

**What it actually is.** An aggregation is how you squash many rows into one number — count, sum, average, median, percentile. The aggregation you pick decides what story the number tells, and the wrong one quietly lies.

**Where it bites: average vs median.** "Average" is the reflex, and it's often the wrong reflex. Averages get dragged around by a few extreme values; medians don't.

```text
   Page load times (seconds) for 9 sessions:
      0.4  0.5  0.5  0.6  0.6  0.7  0.8  0.9  14.0
                                              └── one stuck session

   Average (mean): 2.1 s   ← dragged up by the single 14 s outlier
   Median:         0.6 s   ← the typical experience, unmoved
```
*What just happened:* Eight of nine users had a snappy sub-second load. One session hung at 14 seconds. The **average** says "2.1 seconds — kind of slow," painting almost everyone as having a bad time when they didn't. The **median** says "0.6 seconds — the middle user is fine," which is true, but it also hides that one user had an awful time. Neither is "right" on its own; they answer different questions. If the decision is "is the typical experience good?", median. If the decision is "is anyone having a terrible time?", you want a percentile (like the 95th) that surfaces the tail.

💡 **Key point.** The aggregation is a decision, not a default. Ask what question the number serves: *typical* → median; *total volume* → sum; *worst-case experience* → a high percentile. Reaching for "average" out of habit is how dashboards mislead while being technically correct.

**The gotcha.** Many BI tools default new number tiles to *sum* or *average* with one click, and it's easy to ship that default without thinking. Always ask: does summing/averaging this column actually mean anything? (Summing a column of percentages, for instance, is nonsense — yet the tool will happily do it.)

## Choosing the right denominator

**What it actually is.** A raw count rarely means anything until you divide it by something. "47 errors" — out of how many requests? The denominator is what turns a count into a *rate*, and a rate is what you can compare and act on.

**Why this matters.** Counts grow as your business grows, which makes them sneakily misleading. More users means more errors, more support tickets, more everything — even if things are getting *better* per user.

```text
                     January        June
   Support tickets      300          900     ← "tickets tripled! we're drowning!"
   Active users      10,000       60,000
   ─────────────────────────────────────
   Tickets per user    0.030       0.015     ← actually HALVED per user
```
*What just happened:* The raw ticket count tripled, which looks alarming and would push you to panic-hire support staff. But you grew 6x over the same period. Per active user, tickets *halved* — support is doing better, not worse. The raw count pointed you toward exactly the wrong decision. The denominator (active users) rescued it.

⚠️ **Pick a denominator that matches the question.** "Errors per request" answers "how reliable is the service?" "Errors per user" answers "how many people got hurt?" Same numerator, different denominators, different decisions. Choosing the wrong denominator is as misleading as choosing the wrong numerator.

## Add context: a number alone means nothing

**What it actually is.** "Revenue: $84,000." Good? Bad? You have no idea, because a single number has no meaning without something to compare it against. Context is what converts a number into a judgment. There are three kinds worth adding, and the best tiles have all three.

**1. Comparison — versus what?** Always show the number next to a reference point: last week, last month, same period last year. The comparison is where the meaning lives.

```text
   ┌─────────────────────────────┐
   │  Revenue (this week)        │
   │                             │
   │     $84,000                 │
   │     ▲ 12% vs last week      │   ← the comparison turns a number into news
   └─────────────────────────────┘
```
*What just happened:* "$84,000" became "$84,000, up 12% from last week" — and suddenly it's a story you can act on. Without the comparison, a viewer has to remember last week's number to know if this is good. The dashboard's job is to carry that memory so they don't have to.

**2. Target — versus where we wanted to be.** A goal line tells the viewer whether the number is good *enough*, not just whether it moved.

**3. Trend — which way and how fast.** One number is a dot; a small line chart behind it shows direction. "Up 12% this week" is fine, but a sparkline that shows it's been climbing four weeks straight tells a different (and more decision-ready) story than one that's bouncing around.

💡 **Key point.** A bare number is a trivia question. *Number + comparison + target + trend* is a decision. When a tile feels useless, it's almost always missing one of these three.

## Recap

1. **The line between vanity and useful is "would it change a decision?"** Cumulative all-time totals almost always fail this; rates and recent windows pass it.
2. **Aggregation is a choice.** Average gets dragged by outliers — reach for median for "typical," a percentile for "worst case." Don't ship the tool's default blindly.
3. **Counts need denominators.** A rate (per user, per request) survives growth; a raw count gets misleading as you scale.
4. **A number alone means nothing.** Give it a comparison, a target, and a trend — that's what turns trivia into a decision.

You now know *which* numbers belong on a dashboard. The last phase is about arranging them so the most important answer hits the eye first — and dodging the visual traps that mislead even with the right metrics.

---

[← Phase 1: What BI Actually Is](01-what-bi-actually-is.md) · [Phase 3: Designing One People Actually Use →](03-designing-one-people-use.md)
