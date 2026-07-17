---
title: "Building Reports & Dashboards"
guide: "power-bi-from-zero"
phase: 9
summary: "What's the actual difference between a Power BI report and a dashboard, and how do you turn a data model into a canvas people actually click around in - filters, slicers, bookmarks, drillthrough, tooltips, and pinned tiles?"
tags: [power-bi, reports, dashboards, bookmarks, drillthrough, tooltips, data-analytics]
difficulty: intermediate
synonyms: ["power bi report vs dashboard", "how to build a power bi dashboard", "power bi bookmarks explained", "power bi drillthrough page", "power bi tooltip page", "cross filtering and cross highlighting power bi", "pin a visual to a dashboard power bi", "power bi slicers vs filters"]
updated: 2026-07-14
---

# Building Reports & Dashboards

You've got a clean model (Phase 4) and measures that answer real questions (Phase 5, Phase 6). Now comes the part most people picture when they hear "Power BI" at all: a canvas full of charts someone can actually click around in. This phase is about that canvas - and about a word collision that trips up nearly everyone starting out, because Power BI uses "report" and "dashboard" for two genuinely different things.

## Report vs. dashboard: not the same word twice

**What they actually are.** A **report** is a multi-page canvas you build in Power BI Desktop (or in the browser). It's made of visuals wired to your data model, and it's fully interactive - click a bar, and every other visual on the page reacts. A **dashboard** is a single page, built only in the Power BI *Service* (the web app, after you publish), made of **tiles** you pin from one or more reports. A dashboard tile is closer to a snapshot than a chart: click it and it takes you back to the live report behind it, but the tile itself doesn't cross-filter anything else on the dashboard.

**Why the split exists.** They solve different problems. A report is for *exploring* - slicing sales by region, drilling into a weird spike, comparing this quarter to last. A dashboard is for *monitoring* - one screen, pulled from several reports if needed, that answers "is everything still fine?" at a glance, first thing in the morning, without clicking anything. Once you see them as "explore" vs. "check," the two-tool split stops being confusing and starts being useful: you build one report with real depth, then pin the three or four numbers someone actually needs to see daily onto a dashboard.

💡 **Key point.** Everything in this phase up to the last section happens in a *report*. The dashboard is what you get at the very end, by pinning pieces of that report.

## The canvas and its filters

A report page is a grid of visuals, each bound to fields and measures from your model. What makes it more than a static picture of charts is the **filter pane**, which works in layers:

| Filter level | Scope | Typical use |
|---|---|---|
| Visual-level | One visual only | "Just this chart, top 10 products" |
| Page-level | Every visual on this page | "This whole page is Q3 only" |
| Report-level | Every page in the report | "Exclude test accounts everywhere" |

Filters stack from the top down - a visual sees the report filter, then the page filter, then its own filter, narrowing each time. Set the broad rule once at the report level instead of repeating it on every visual; that's the same instinct as pushing shaping decisions upstream in Power Query (Phase 3) rather than patching them in ten places downstream.

## Cross-filtering: the interactivity that's on by default

Click a bar in one visual, and every *other* visual on the page filters itself to match, instantly, with no code. This is **cross-filtering**, and it's on by default because it comes free from the relationships you built in Phase 4 - click "West" on a region bar chart, and the model follows that one-to-many relationship out to every fact row tagged West, updating every other visual to match.

```text
[Region bar chart]        [Sales by month]         [Top products]
  West  ████████            (click West bar,          (click West bar,
  East  █████                 this redraws to           this redraws to
  North ███                   West-only trend)          West-only ranking)
```
*What just happened:* one click, three visuals updated, zero code. This is the payoff for the modeling work in Phase 4 - a clean star schema is what makes cross-filtering *correct* instead of just fast. A visual can also be set to cross-*highlight* instead of filter (dim the rest instead of removing it), or excluded from the interaction entirely per pair of visuals, from Format > Edit interactions.

## Slicers: filters you can see and click

A **slicer** is a filter rendered as its own visual on the canvas - a list, a dropdown, a date range - so the viewer sets it themselves instead of you hard-coding a value. Drop a Date slicer and a Region slicer at the top of a page, and every visual below responds to whatever the viewer picks, the same cross-filtering mechanism as clicking a chart, just driven by a control built for exactly that job.

⚠️ **The gotcha.** A slicer only filters visuals on its *own page* by default. If you want one date range to hold across every page of the report, sync the slicer (View > Sync slicers) instead of copy-pasting it onto each page - copies drift out of sync the moment someone changes one and forgets the others.

## Bookmarks: saving a view, not just a picture

A **bookmark** captures the current state of a page - which filters are set, which visuals are visible, even scroll position - so you can jump back to it with one click. Combine two bookmarks with a pair of buttons and you get a toggle: a "This Year / Last Year" switch, or a "Summary / Detail" view swap, all on one page, with no extra pages built.

```text
[This Year] [Last Year]   <- two buttons, each linked to a bookmark
     ↑
  currently selected bookmark applies its saved filter state
  to the visuals below, instantly
```

Bookmarks are also how you build a guided walkthrough: a **bookmark navigator** groups several bookmarks into a slideshow-style sequence, useful for a report meant to be presented rather than freely explored.

## Drillthrough: click into the detail

A **drillthrough** page is a detail page a viewer reaches by right-clicking a data point and choosing "Drill through" - Power BI carries the clicked value (say, one product) along as an implicit filter and lands on a page built to show everything about *that one thing*. It's the report-building answer to "I don't want to cram every possible detail onto the summary page" - keep the overview page clean, and let anyone who needs the deep dive click through to it.

## Tooltips: a whole report page as a hover

By default, hovering a data point shows a small tooltip with its value. You can replace that with a **tooltip page**: a small report page (toggled on with "Allow use as tooltip" under Page information in its page settings) that renders inside the hover instead of a plain box, showing a mini chart or a few extra measures. It's the same drillthrough idea, but for a glance instead of a click.

## From report to dashboard: pinning

Once the report is published to the Service, open it there and pin any individual visual (or a whole page) to a dashboard - it becomes a tile. Pin the handful of numbers someone genuinely checks every morning, not the whole report; a dashboard that tries to be the report defeats the point of having two tools. One thing only a dashboard tile can do that a report visual can't: a **data alert** (notify you when a numeric tile crosses a threshold). Dashboards also carry a natural-language **Q&A** box, where a viewer can type "total sales last quarter by region" and get a chart back on the fly - though reports can host a Q&A visual for the same type-a-question interaction.

## Recap

1. **Report and dashboard are different tools.** Reports (Desktop, multi-page, interactive) are for exploring; dashboards (Service, single-page, pinned tiles) are for monitoring at a glance.
2. **Filters stack** visual → page → report; push a rule as high as it applies to avoid repeating it.
3. **Cross-filtering is automatic** because of the relationships from Phase 4 - click one visual, the rest follow.
4. **Slicers** put filtering in the viewer's hands; sync them across pages instead of duplicating them.
5. **Bookmarks** save a filter state for one-click toggles or guided walkthroughs; **drillthrough** and **tooltip pages** push detail out of the summary view until someone asks for it.
6. **Pin sparingly.** A dashboard is the two or three numbers someone checks every morning, not a copy of the report.

## Quick check

Test yourself on the ideas that trip people up most in this phase - the report/dashboard split and why cross-filtering needs no code:

```quiz
[
  {
    "q": "What's the actual difference between a Power BI report and a dashboard?",
    "choices": [
      "A dashboard is built in Desktop, a report is built in the Service",
      "A report is a multi-page interactive canvas built in Desktop; a dashboard is a single page of tiles pinned from one or more reports, built in the Service",
      "They're two names for the same canvas",
      "A dashboard is a static, printed export of a report"
    ],
    "answer": 1,
    "explain": "Reports are for exploring - multi-page, fully interactive, built in Desktop. Dashboards are for monitoring - one page, pinned tiles, built only in the Service after publishing."
  },
  {
    "q": "You click 'West' on a region bar chart and two other visuals on the page redraw instantly. Why, with no code written?",
    "choices": [
      "Power BI reruns a background script on every click",
      "Cross-filtering follows the relationships already built into the data model, so the click propagates through the star schema automatically",
      "The visuals were manually synced together in Format settings",
      "Dashboards refresh their tiles live, and this page is a dashboard"
    ],
    "answer": 1,
    "explain": "Cross-filtering is on by default because it rides the relationships from the model (Phase 4) - a clean star schema is what makes it correct, not some extra wiring on the visuals."
  },
  {
    "q": "A slicer on page 1 has no effect on page 2. What's the right fix?",
    "choices": [
      "Copy-paste the slicer onto page 2",
      "Sync the slicer across pages (View > Sync slicers)",
      "Rebuild the relationship in the model",
      "Switch the slicer to a page-level filter"
    ],
    "answer": 1,
    "explain": "A slicer only filters its own page by default. Syncing keeps one control driving every page; copies drift out of sync the moment someone changes one and forgets the others."
  }
]
```

---

[← Phase 8: Visualizations That Do Not Lie](08-visualizations-that-do-not-lie.md) · [Phase 10: Publishing & Sharing (Workspaces, Apps, RLS) →](10-publishing-and-sharing-workspaces-apps-rls.md)
