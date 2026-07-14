---
title: "Designing One People Actually Use"
guide: "bi-dashboards-that-work"
phase: 3
summary: "Lay out the most important answer first, pick the chart that fits the question, and dodge the traps that mislead even with good data: bad axes, wrong aggregation, no context, and the dashboard with no owner."
tags: [dashboard-design, data-visualization, charts, layout, data-analytics]
difficulty: intermediate
synonyms: ["how to lay out a dashboard", "which chart for which question", "dashboard design traps", "misleading axis", "dashboard nobody uses", "dashboard owner", "right chart type"]
updated: 2026-07-10
---

# Designing One People Actually Use

You've got the right metrics with the right context. Now comes the part where good data still goes to waste: the layout. A viewer's eye lands somewhere first and gives up fast if the answer isn't obvious - design is how you make sure the thing they came for is the thing they see. Start with the checklist below if you're here to fix something already live.

## The trap checklist (read this first if a dashboard isn't landing)

| Symptom | Likely trap | Calm fix |
|---|---|---|
| "These numbers feel exaggerated" | Axis doesn't start at zero (bar chart) | Start bar-chart y-axes at zero; see below |
| "This contradicts what I know" | Wrong aggregation (avg vs median, double-counted join) | Re-check the aggregation and the data grain |
| "Is this good or bad? No idea." | No context - bare number, no comparison/target | Add comparison + target + trend (Phase 2) |
| "Nobody opens it" | No owner, no decision behind it | Tie it to one decision + one named owner; see below |
| "Too busy, I don't know where to look" | No hierarchy - everything same size | Put the main answer top-left, big; shrink the rest |
| "The trend line looks insane" | Cherry-picked time range or mismatched scales | Use a consistent, non-cherry-picked time window |

Most "bad dashboards" are good data arranged or scaled in a way that misleads - each row is unpacked below.

## Layout for the eye: most important answer first

People read a dashboard the way they read a page - roughly top-left first, then across and down. That corner is the most valuable real estate you have, so the single most important answer goes there, big.

The instinct is to treat every tile as equal - a tidy grid of same-sized charts. But "everything is important" reads to the eye as "nothing is important," and a wandering eye closes the tab.

Here's a dashboard with a job - *"tell the head of growth, each morning, whether we're on track for the signup target"* - arranged so the headline answer lands first:

```text
   ┌──────────────────────────────┬───────────────────┐
   │  SIGNUPS THIS MONTH vs TARGET │  Cost per signup  │
   │                               │   $4.20           │
   │     8,200 / 10,000            │   ▲ 8% vs target  │
   │     ████████████░░░  82%      │                   │
   │     on pace: slightly behind  ├───────────────────┤
   │                               │  Active this week  │
   │   (the one answer, top-left,  │   ▼ 3% vs last wk  │
   │    biggest tile on the board) │                   │
   ├──────────────────┬───────────┴───────────────────┤
   │  Signups / day    │   Signups by channel          │
   │  (trend line)     │   (bar chart, ranked)         │
   │   ╱╲    ╱╲╱       │   organic   ████████          │
   │  ╱  ╲╱╲╱          │   paid      █████             │
   │                   │   referral  ██                │
   └──────────────────┴───────────────────────────────┘
```
*What just happened:* The decision-driving answer - *are we on pace?* - owns the biggest tile, top-left, with a target and a plain-English read ("slightly behind"). Supporting numbers sit smaller to the right; the *why* (daily trend, channel breakdown) lives below, for when the headline raises a question. Size *is* hierarchy, and the eye obeys it.

💡 **Key point.** A dashboard should answer its main question before the viewer consciously reads anything - good metrics in a layout nobody can scan still fail the job.

## The right chart for the question

Each chart type answers a particular *shape* of question. Pick by the question, not by which chart looks coolest:

| The question is... | Use | Why |
|---|---|---|
| How has this changed over time? | Line chart | The eye reads slope as change; that's its whole job |
| How do a few categories compare? | Bar chart | Length is the easiest visual to compare accurately |
| What's the single current value vs a target? | Big number + comparison | Fastest possible read for "are we good?" |
| How are two numbers related? | Scatter plot | Shows correlation and outliers at a glance |

⚠️ **The pie chart trap.** For "parts of a whole," reach for a bar chart, not a pie. Pie charts ask the eye to compare angles and areas, which humans are bad at - with more than two or three slices, nobody can tell whether the 18% slice beats the 21% slice. A ranked bar chart answers "which is biggest?" instantly, because comparing lengths is easy and comparing wedges is not.

**The gotcha.** Tools make it one click to switch any data into any chart, tempting you to choose by aesthetics. Resist - a line chart of unordered categories is meaningless (slope between "organic" and "paid" implies a change that doesn't exist). Match the chart to the question's shape first; make it pretty second.

## The trap that mistrusts your data: misleading axes

A bar chart's whole message is *length* - a bar twice as tall means twice as much. The moment the y-axis doesn't start at zero, that promise breaks, and small differences look enormous.

```text
   y-axis starts at 0 (accurate)      y-axis starts at 95 (misleading)

   100 ┤                              100 ┤        ██
       │   ██   ██   ██                   │   ██   ██
       │   ██   ██   ██                98 ┤   ██   ██   ██
       │   ██   ██   ██                   │   ██   ██   ██
       │   ██   ██   ██                96 ┤   ██   ██   ██
     0 ┴───────────────              95 ┴───────────────
        A    B    C                      A    B    C
   "A, B, C are about the same"       "C is WAY ahead of A!"
        (97, 98, 99)                       (same data: 97, 98, 99)
```
*What just happened:* Same three numbers - 97, 98, 99 - drawn two ways. Starting the axis at zero (left) tells the truth: they're nearly identical. Starting it at 95 (right) inflates a 2-point gap into what looks like a landslide. Nobody had to lie about the data; the axis did the lying.

⚠️ **Rule of thumb:** bar charts must start their value axis at zero - bars encode length. Line charts can start elsewhere (they encode slope, not length), but label a zoomed-in trend clearly so it isn't mistaken for a dramatic crash.

## The biggest trap of all: the dashboard nobody opens

Every trap so far misleads a viewer. This one skips having a viewer at all - the most common failure by a wide margin. A dashboard with no owner is born dead: built because someone asked for "a dashboard," it drifts out of date because no one needs it to be right. Teams build them anyway because building feels productive - but a dashboard is a living thing: data changes, definitions shift, columns get renamed upstream, and without an owner to notice, it rots. A dashboard everyone half-trusts is worse than no dashboard, because people decide on stale numbers.

**Two requirements before you build anything:**

1. **A real question** - one sentence naming the decision it serves (decision → question → metric, from Phase 1). Can't say it? Don't build yet.
2. **A real owner** - one named person who relies on it and will complain when it's wrong. That complaint is the immune system that keeps it alive.

🪖 **War story.** A company I saw had a wall-mounted TV cycling through eight "team dashboards." Six showed errors or numbers frozen for months - broken queries nobody noticed because nobody used them; pure décor. The two that worked had a named owner who checked them daily and raised hell when something looked off. We turned off the broken six, and trust in the surviving two went *up* - the wall stopped showing things people had learned to ignore. Build fewer dashboards, each with a decision and an owner: one someone relies on every morning beats ten that look impressive and rot in silence.

## Recap

1. **Lay out for the eye.** The main answer goes top-left and biggest; size is hierarchy.
2. **Match the chart to the question's shape.** Line for change over time, bar for comparing categories, big number for "are we good?" Avoid pie charts beyond two or three slices.
3. **Don't let the axis lie.** Bar charts start at zero; label any line chart that doesn't.
4. **The deadliest trap is no owner.** Build only what serves a real decision for a real, named person.

One last check, for any dashboard you've built: *if this number changed, what would someone do?* Cut every tile that can't answer it.

> Where next. To go upstream - where these numbers come from and how to shape them - see [Warehouses vs Lakes](/guides/warehouses-vs-lakes) and [Querying Basics: SELECT and WHERE](/guides/querying-basics-select-where).

---

[← Phase 2: Metrics That Inform vs Vanity Metrics](02-metrics-that-inform.md) · [Guide overview](_guide.md)
