---
title: "Visualizations That Do Not Lie"
guide: "power-bi-from-zero"
phase: 8
summary: "Power BI will build any chart you drag onto the canvas, including ones that quietly mislead - this phase covers which visual actually fits the question you're asking, and which of Power BI's own defaults (truncated axes, dual-axis scales, 3D, packed pie slices) distort the answer without you asking for that."
tags: [power-bi, data-visualization, charts, dashboards, misleading-charts, data-analytics]
difficulty: intermediate
synonyms: ["power bi misleading charts", "power bi dual axis chart problems", "power bi pie chart too many slices", "how to choose the right chart type power bi", "power bi truncated axis", "power bi 3d charts bad", "clear data visualization power bi", "power bi chart best practices", "power bi gauge vs kpi card"]
updated: 2026-07-14
---

# Visualizations That Do Not Lie

You've built measures ([Phase 6](06-measures-vs-calculated-columns.md)), you understand how they roll up over time ([Phase 7](07-time-intelligence.md)), and the number in your DAX is correct. None of that protects you from the next step, because a *correct* number can still be shown in a way that leads someone to the wrong conclusion. A bar chart that starts its axis at 80 instead of 0 turns a 2% wobble into what looks like a landslide. A pie chart with eleven slices turns "compare these categories" into a squint-and-guess exercise. The DAX was fine. The picture lied.

This phase is not about DAX or data modeling. It's about the last six inches between a correct number and a reader's brain, and about the specific defaults in Power BI that make that gap easy to fall into.

## The mental model: match the visual to the question, not the data

Every chart answers one of a small number of question *shapes*. Before you drag a visual onto the canvas, name the shape of your question - it tells you almost everything about which chart tells it clear and which is decoration.

| Question shape | Example | Right family |
|---|---|---|
| How does this compare across categories? | Revenue by region | Bar / column chart |
| How does this change over time? | Revenue by month | Line chart |
| How does this break into parts? | Revenue by product, 2-4 slices | Stacked bar, or a small pie |
| How is this distributed? | Order sizes across all customers | Histogram |
| Is there a relationship between two things? | Ad spend vs. signups | Scatter plot |
| What's the single number right now? | This month's revenue vs. target | Card + KPI |

📝 **Terminology.** A visual gives you *the real picture* when equal differences in the data produce equal differences in what your eye perceives. A bar twice as tall should represent a value twice as large. When that link breaks - through a truncated axis, a mismatched scale, or a 3D tilt - the chart is technically built from real numbers but visually asserting something false.

💡 **Key point.** Power BI has one bug you can't file a ticket for: it will render *any* chart type against *any* field, correct or not. Nothing stops you from putting a continuous measure into a pie chart or plotting two wildly different scales on one axis. The tool trusts you to pick the right shape. This phase is that judgment.

## Where Power BI's own defaults betray you

These four are the ones that bite real reports, because each one looks *reasonable* the moment you build it.

**1. The truncated axis.** By default, Power BI's column and bar charts start the Y-axis at zero - good. But the moment you or a stakeholder switches on **Format visual → Y-axis → Range → Start** and types a non-zero value "to make the difference more visible," you've built a lie. A 2% change between two bars that start at 0 looks like 2%. The same two bars with an axis starting at 95 look far larger than 2% - one bar towering over its neighbor.

```text
   Axis starts at 0                    Axis starts at 95
   ┌──────────────┐                    ┌──────────────┐
   │         ▓▓    │                    │              │
   │         ▓▓    │                    │         ▓▓    │
   │  ▓▓     ▓▓    │                    │  ▓▓     ▓▓    │  ← same two values,
   │  ▓▓     ▓▓    │                    │  ▓▓─────▓▓    │     wildly different
   │  ▓▓     ▓▓    │                    └──────────────┘     story
   └──────────────┘
   Region A: 97    Region B: 99         Region A: 97    Region B: 99
```

⚠️ **The fix isn't "never truncate."** For a line chart tracking something that only ever moves in a narrow, meaningful band (a stock's intraday price, a server's CPU hovering near 100%), zooming the axis can be the clear choice - it's what lets you see real movement at all. The rule is narrower: if you truncate, say so. Label the axis start, or add a note. The lie isn't the truncation, it's the silence about it.

**2. Dual-axis combo charts.** Power BI's line-and-clustered-column chart lets you plot two measures on two independently-scaled axes - say, Revenue on the left and Units Sold on the right. This is one of the most requested visuals and one of the easiest to misuse: because the two axes scale independently, you can drag either one until the two lines "cross" dramatically, implying a relationship that's really just two arbitrary scales lining up. If you genuinely need two measures on one chart, keep both axes starting at zero and label which line belongs to which axis clearly - don't let Power BI auto-scale them into a coincidence.

**3. 3D and decorative effects.** Power BI's native visuals don't ship 3D pie charts, but the custom visual gallery still has plenty, and people import them because they look impressive in a screenshot. A 3D pie tilts slices so the ones in "front" look larger than equal slices in "back," purely from the camera angle - the data didn't change, your perception of it did. Same problem with drop shadows and heavy gradients on bars: they add visual weight that isn't in the number. If a formatting choice can't be explained by "this represents the data," it's decoration, and decoration in a chart is a small tax on the reader's ability to read it correctly.

**4. Pie charts past four or five slices.** A pie chart works because humans are decent at comparing a *few* angles, especially against a clean quarter or half. Past four or five slices, most people can no longer rank the wedges by eye - "Product C" and "Product F" might be off by 3 percentage points and you'd never know from the picture. Power BI will happily render fifteen slices in decreasingly-distinguishable shades of blue. When you have more than four or five categories, a sorted bar chart is almost always the clearer answer: it turns "guess the angle" into "read down a sorted list," which is a task humans are actually good at.

## Color that carries meaning, not decoration

Power BI's default theme assigns colors to categories in the order they appear, which is fine until the *same* category (say, "Region: West") gets a different color on two different pages because the underlying field order changed. Set up a **theme** (Format → Themes, or a custom JSON theme) once, so a category's color is consistent everywhere it appears. That consistency is what lets a reader learn "orange means West" once and reuse it across your whole report instead of re-learning the legend on every page.

Use color changes to mean something specific, not to make a chart prettier:

- **Conditional formatting** (data bars, color scales, icon sets on a table) should map directly to a threshold that matters - red below target, green above - not to an arbitrary gradient.
- Reserve your most saturated, attention-grabbing color for the one series that matters most (this year vs. last year, actual vs. target). Everything else can sit in muted gray so the eye knows where to land first.
- Never use color as the *only* signal for something important - a portion of any audience is colorblind, and red/green "good/bad" without a label or icon is invisible to them.

## Context lives in the card and the tooltip, not just the chart

Phase 6 already established that a bare number is a trivia question - "$84,000" means nothing without a comparison, a target, and a trend. In Power BI that context is built with specific, small features:

```dax
Revenue vs LY % =
DIVIDE(
    [Total Revenue] - [Total Revenue LY],
    [Total Revenue LY]
)
```

Drop that measure next to `[Total Revenue]` on a **KPI** visual and the reader gets "up 12% vs. last year" at a glance instead of having to hold last year's number in their head. Add a **target** in the KPI visual's format pane (or a target measure via [Time Intelligence](07-time-intelligence.md) patterns) and Power BI colors the indicator green or red against it, so the card answers "good or bad?" as well as "which direction?" That's the same comparison-target-trend triad from [Bi Dashboards That Work](/guides/bi-dashboards-that-work), just built with Power BI's specific card and KPI controls instead of generic dashboard tiles.

Tooltips deserve the same discipline. Power BI lets you build a **report-page tooltip** - a small custom visual that appears on hover, showing a mini trend line or a breakdown. Use it to hold the *detail* a chart doesn't have room for, instead of cramming a dozen data labels onto the main visual and making it noisy for everyone who didn't need that detail.

## Recap

1. **Name the question's shape first** - comparison, trend, part-to-whole, distribution, relationship, single value - and let that pick the chart family, not visual appeal.
2. **A truncated axis, a mismatched dual-axis scale, 3D tilt, and a pie past four or five slices** are Power BI's four most common ways to make a correct number look like the wrong thing. Each has a specific, clearer alternative.
3. **Color should carry meaning** - a consistent theme per category, saturation reserved for what matters, and never color alone as the only signal.
4. **Context (comparison, target, trend) belongs on the card and in the tooltip**, built with measures like a year-over-year % and a target line, not left for the reader to remember.

Getting the individual visual right is half the job. The other half is arranging several of them on one page so the most important answer hits the eye first - that's next.

## Quick check

Test yourself on the idea that demystifies this phase - that a chart can be built from correct numbers and still visually assert something false:

```quiz
[
  {
    "q": "A stakeholder asks you to set the Y-axis to start at 90 instead of 0 so a small revenue bump is 'easier to see.' What's the actual problem with doing that silently?",
    "choices": [
      "It makes equal differences in the data produce unequal differences on screen, so a 2% change can visually read as a far bigger gap",
      "Power BI will refuse to render the chart with a non-zero axis start",
      "It's fine as long as the underlying DAX measure is still correct",
      "Nothing - axis start is purely a formatting choice with no effect on interpretation"
    ],
    "answer": 0,
    "explain": "The numbers stay correct, but truncating the axis breaks the link between the size of a visual difference and the size of the real one - which is the definition of a chart that shows the real picture."
  },
  {
    "q": "You have a report field with 12 product categories and want to show revenue share for each. Why is a pie chart the wrong default here, even though the data is correct?",
    "choices": [
      "Past four or five slices, people can no longer rank the wedges by eye, so a sorted bar chart communicates the same data far more clearly",
      "Pie charts can only display percentages that sum to under 50%",
      "Power BI limits pie charts to 8 slices and will drop the rest",
      "Pie charts are never appropriate for any part-to-whole question"
    ],
    "answer": 0,
    "explain": "Pie charts work for a handful of slices because humans are decent at comparing a few angles; past four or five, a sorted bar chart turns 'guess the angle' into 'read down a sorted list.'"
  },
  {
    "q": "A dual-axis combo chart shows Revenue (left axis) and Units Sold (right axis) crossing dramatically in the middle of the year. What should you check before trusting that 'crossing point' means anything?",
    "choices": [
      "Whether the two axes are independently auto-scaled, since two arbitrary scales can be nudged until any two lines appear to cross",
      "Whether the chart uses a line or a column for each measure",
      "Whether both measures are formatted as currency",
      "Nothing - a visual crossing point always indicates a real relationship in the data"
    ],
    "answer": 0,
    "explain": "Independently-scaled axes can make unrelated series 'cross' anywhere; the crossing point only means something if both axes start at zero and the scales are chosen deliberately, not auto-fit."
  }
]
```

---

[← Phase 7: Time Intelligence](07-time-intelligence.md) · [Phase 9: Building Reports & Dashboards →](09-building-reports-and-dashboards.md)
