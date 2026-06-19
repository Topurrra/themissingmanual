---
title: "Designing One People Actually Use"
guide: "bi-dashboards-that-work"
phase: 3
summary: "Lay out the most important answer first, pick the chart that fits the question, and dodge the traps that mislead even with good data: bad axes, wrong aggregation, no context, and the dashboard with no owner."
tags: [dashboard-design, data-visualization, charts, layout, data-analytics]
difficulty: intermediate
synonyms: ["how to lay out a dashboard", "which chart for which question", "dashboard design traps", "misleading axis", "dashboard nobody uses", "dashboard owner", "right chart type"]
updated: 2026-06-19
---

# Designing One People Actually Use

You've got the right metrics with the right context. Now comes the part where good data still goes to waste: the layout. A viewer's eye lands somewhere first, reads in a rough order, and gives up fast if the answer isn't obvious. Design is how you make sure the thing they came for is the thing they see.

This phase is the practical finish: arrange for the eye, match the chart to the question, and step around the traps that quietly mislead. Start with the trap checklist if you're here to fix something that's already live.

## The trap checklist (read this first if a dashboard isn't landing)

| Symptom | Likely trap | Calm fix |
|---|---|---|
| "These numbers feel exaggerated" | Axis doesn't start at zero (bar chart) | Start bar-chart y-axes at zero; see below |
| "This contradicts what I know" | Wrong aggregation (avg vs median, double-counted join) | Re-check the aggregation and the data grain |
| "Is this good or bad? No idea." | No context — bare number, no comparison/target | Add comparison + target + trend (Phase 2) |
| "Nobody opens it" | No owner, no decision behind it | Tie it to one decision + one named owner; see below |
| "Too busy, I don't know where to look" | No hierarchy — everything same size | Put the main answer top-left, big; shrink the rest |
| "The trend line looks insane" | Cherry-picked time range or mismatched scales | Use an honest, consistent time window |

Each of these is unpacked below. The short version: most "bad dashboards" aren't bad data — they're good data arranged or scaled in a way that misleads.

## Layout for the eye: most important answer first

**What it actually is.** People read a dashboard the way they read a page — roughly top-left first, then across and down. That top-left corner is the most valuable real estate you have. The single most important answer goes there, big.

**Why people get this wrong.** The instinct is to treat every tile as equal — a tidy grid of same-sized charts. But "everything is important" reads to the eye as "nothing is important." Without a clear focal point, the viewer's eye wanders, and a wandering eye is a viewer about to close the tab.

**A real layout.** Here's a dashboard with a job — *"tell the head of growth, each morning, whether we're on track for the signup target"* — arranged so the headline answer lands first:

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
*What just happened:* The decision-driving answer — *are we on pace?* — owns the biggest tile in the top-left, with a target and a plain-English read ("slightly behind"). The supporting numbers (cost, active users) sit smaller to the right. The *why* (daily trend, channel breakdown) lives below, where you look only after the headline raises a question. A viewer gets the answer in under two seconds and can dig if they want. Size *is* hierarchy: the biggest thing is the most important thing, and the eye obeys.

💡 **Key point.** A dashboard should answer its main question before the viewer consciously reads anything. If they have to hunt for the headline, the layout has failed — no matter how good the underlying metrics are.

## The right chart for the question

**What it actually is.** Each chart type answers a particular *shape* of question. Pick by the question you're answering, not by which chart looks coolest. Here's the honest short list that covers most real needs:

| The question is... | Use | Why |
|---|---|---|
| How has this changed over time? | Line chart | The eye reads slope as change; that's its whole job |
| How do a few categories compare? | Bar chart | Length is the easiest visual to compare accurately |
| What's the single current value vs a target? | Big number + comparison | Fastest possible read for "are we good?" |
| How are two numbers related? | Scatter plot | Shows correlation and outliers at a glance |
| What are the parts of a whole? | Bar chart (usually) | See the gotcha on pie charts below |

⚠️ **The pie chart trap.** Pie charts ask the eye to compare angles and areas, which humans are bad at. With more than two or three slices, nobody can tell whether the 18% slice beats the 21% slice. A ranked bar chart answers "which is biggest?" instantly, because comparing lengths is easy and comparing wedges is not. Reach for pie only with two or three clearly different slices — and even then a bar usually wins.

**The gotcha.** Tools make it one click to switch any data into any chart, which tempts you to choose by aesthetics. Resist. A line chart of unordered categories is meaningless (slope between "organic" and "paid" implies a change that doesn't exist). Match the chart to the question's *shape* first; make it pretty second.

## ⚠️ The trap that mistrusts your data: misleading axes

**What it actually is.** A bar chart's whole message is *length* — a bar twice as tall means twice as much. The moment the y-axis doesn't start at zero, that promise breaks, and small differences look enormous.

```text
   y-axis starts at 0 (honest)        y-axis starts at 95 (misleading)

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
*What just happened:* Same three numbers — 97, 98, 99 — drawn two ways. Starting the axis at zero (left) tells the truth: they're nearly identical. Starting it at 95 (right) inflates a 2-point gap into what looks like a landslide. Nobody had to lie about the data; the axis did the lying. Someone glancing at the right chart would make a confident decision based on a difference that's basically noise.

⚠️ **Rule of thumb:** bar charts must start their value axis at zero, because bars encode length. Line charts *can* start elsewhere (they encode slope, not length, so zooming in to see a trend is legitimate) — but label it clearly so nobody mistakes a zoomed view for a dramatic crash.

## The biggest trap of all: the dashboard nobody opens

Every trap so far is about misleading a viewer. This one's about not having a viewer at all — and it's the most common failure by a wide margin.

**What it actually is.** A dashboard with no owner and no decision behind it is born dead. It gets built because someone asked for "a dashboard," it goes up on a screen, and then it slowly drifts out of date because no single person needs it to be right.

**Why people get this wrong.** It feels productive to *build* dashboards, so teams accumulate them. But a dashboard is a living thing — data changes, definitions shift, a column gets renamed upstream. Without an owner who'd notice when it breaks, it rots. And a dashboard everyone half-trusts is worse than no dashboard, because people make decisions on stale numbers.

**The fix — two requirements before you build anything:**

1. **A real question.** You can say in one sentence what decision it serves (this is Phase 1 — *decision → question → metric*). If you can't, don't build it yet.
2. **A real owner.** One named person who opens it, relies on it, and will complain when it's wrong. That complaint is the immune system that keeps it alive.

🪖 **War story.** A company I saw had a wall-mounted TV cycling through eight "team dashboards." Six of them showed errors or numbers that hadn't moved in months — broken queries nobody had noticed, because nobody actually used them; they were *décor*. The two that worked had a named owner who checked them daily and raised hell when something looked off. The dead six weren't a data problem. They were an ownership problem. We turned off the broken ones, and trust in the surviving two went *up* — because the wall stopped showing things people had learned to ignore.

💡 **Key point.** Build fewer dashboards, each with a decision and an owner. A single dashboard someone relies on every morning beats ten that look impressive and rot in silence.

## Recap

1. **Lay out for the eye.** The main answer goes top-left and biggest; size is hierarchy. The viewer should get the answer before they consciously read.
2. **Match the chart to the question's shape.** Line for change over time, bar for comparing categories, big number for "are we good?" Avoid pie charts beyond two or three slices.
3. **Don't let the axis lie.** Bar charts start at zero; label any line chart that doesn't, so a zoom isn't mistaken for a crash.
4. **The deadliest trap is no owner.** Build only what serves a real decision for a real, named person — fewer dashboards, each alive and trusted.

You've now got the whole arc: BI is about decisions, useful metrics change those decisions, and good design puts the answer where the eye lands. Go look at a dashboard you've built and ask the one question that started this guide — *if this number changed, what would someone do?* The tiles that can't answer it are the ones to cut.

> Where next. To go upstream — where these numbers come from and how to shape them — see [Warehouses vs Lakes](/guides/warehouses-vs-lakes) and [Querying Basics: SELECT and WHERE](/guides/querying-basics-select-where).

---

[← Phase 2: Metrics That Inform vs Vanity Metrics](02-metrics-that-inform.md) · [Guide overview](_guide.md)
