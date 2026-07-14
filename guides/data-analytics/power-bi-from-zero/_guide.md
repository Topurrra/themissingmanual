---
title: "Power BI, From Zero"
guide: "power-bi-from-zero"
phase: 0
summary: "Take a spreadsheet from your desktop to a live, scheduled, trustworthy Power BI report - Power Query, the data model, DAX, real visualizations, and publishing done right."
tags: [power-bi, dax, power-query, data-modeling, business-intelligence, data-analytics, microsoft]
category: data-analytics
order: 40
difficulty: intermediate
synonyms: ["learn power bi", "power bi tutorial for beginners", "power bi from scratch", "how does power bi work", "power bi dax explained", "power bi data model", "power bi vs excel", "power bi star schema", "power bi rls row level security", "power bi refresh and gateway", "power bi measures vs calculated columns", "power bi publish to workspace"]
updated: 2026-07-14
---

# Power BI, From Zero

Most people meet Power BI backwards. Someone hands them a `.pbix` file, or drops them into an existing
report, and they learn by poking at buttons until something moves. That works, eventually - but it leaves
gaps you don't notice until they cost you: a report that recalculates the wrong number for last quarter, a
dashboard that quietly breaks when the source file gets renamed, a measure that's actually a calculated
column wearing a trench coat. This guide builds the tool the other way: from the ground up, so every piece
you add sits on a model you actually understand.

Power BI looks like four different products stapled together - a query editor, a modeling layer, a formula
language, and a drag-and-drop canvas - and that's roughly what it is. **Power Query** gets data in and
cleans it up. The **data model** decides how your tables relate to each other. **DAX** is the formula
language that turns rows into answers. And the **report canvas** is just the last mile - the part everyone
sees, built on everything underneath it. Learn them in that order and Power BI stops feeling like a pile of
menus and starts feeling like a pipeline: data in, shaped, modeled, calculated, shown.

The spine of this guide is one idea that shows up everywhere in analytics tooling once you know to look for
it: the **star schema** - one central table of *facts* (the numbers you measure) surrounded by *dimension*
tables (the things you slice by: date, product, region, customer). Power BI's data model is a star schema
in different clothes, and once that clicks, relationships, DAX context, and even your report design start
making sense as consequences of that one shape rather than as separate things to memorize. If you want the
concept on its own first, [The Star Schema, Explained](/guides/star-schema-explained) covers it without any
Power BI in the way - worth a detour before phase 4 if the term is new to you.

We go mental-model-first throughout: before any button or formula, you'll understand what the thing
actually *is* and why it's shaped that way. By the end you won't just have a report - you'll have one that
refreshes on a schedule, shows the right numbers to the right people, and that you'd trust with your own
name on it.

## How to read this

- **Never opened Power BI? Read 1-6 in order.** Phases 1-3 get real data into a clean shape. Phase 4 is the
  turning point - the data model - and it changes how you think about everything after it. Phases 5-6 build
  DAX from first principles instead of throwing syntax at you.
- **Come from Excel?** You already know rows, columns, and formulas like `SUM()`. The adjustment is phase
  4 (a model isn't one big flat table) and phase 5 (DAX formulas live on the *model*, not a cell - there's
  no "cell reference" to drag down). Skim 1-3, slow down from 4 onward.
- **Already building reports, want to stop guessing?** Jump to [Phase 6: Measures vs Calculated
  Columns](06-measures-vs-calculated-columns.md) - the single most common source of "why is this number
  wrong" - then keep going through time intelligence, visuals, and publishing.

## The phases

1. **[What Power BI Actually Is & Getting Set Up](01-what-power-bi-actually-is-and-getting-set-up.md)** 🟢 -
   the four layers (Query, Model, DAX, canvas), Desktop vs Service, and installing Power BI Desktop.
2. **[Connecting to Data Sources](02-connecting-to-data-sources.md)** 🟢 - Excel, CSV, databases, and web
   sources; import vs DirectQuery, and why that choice matters early.
3. **[Shaping Data with Power Query](03-shaping-data-with-power-query.md)** 🟡 - get & transform, the
   Applied Steps list, and why Power Query records *how* you cleaned the data, not just the result.
4. **[The Data Model & Relationships](04-data-model-and-relationships.md)** 🟡 - a star schema in different
   clothes: fact tables, dimension tables, relationships, and cardinality.
5. **[DAX From Intuition](05-dax-from-intuition.md)** 🟡 - row context vs filter context, the idea that
   makes every DAX formula make sense once it clicks.
6. **[Measures vs Calculated Columns](06-measures-vs-calculated-columns.md)** 🟡 - the distinction that
   causes most "why is this number wrong" bugs, and how to pick the right one every time.
7. **[Time Intelligence](07-time-intelligence.md)** 🔴 - `CALCULATE`, a real date table, and
   year-to-date/prior-period comparisons that don't silently lie.
8. **[Visualizations That Do Not Lie](08-visualizations-that-do-not-lie.md)** 🟡 - choosing the chart that
   matches the question, axis and scale traps, and what to leave out.
9. **[Building Reports & Dashboards](09-building-reports-and-dashboards.md)** 🟡 - pages, slicers,
   drill-through, bookmarks, and report vs dashboard (they are not the same thing).
10. **[Publishing & Sharing (Workspaces, Apps, RLS)](10-publishing-and-sharing.md)** 🔴 - workspaces, Apps,
    and row-level security so the right person sees only their own data.
11. **[Refresh, Gateways & Capacity Basics](11-refresh-gateways-and-capacity-basics.md)** 🔴 - scheduled
    refresh, the on-premises data gateway, and what capacity limits mean for you in practice.

> Power BI's DAX engine and the star schema underneath it aren't unique to Power BI - the same shape
> powers Tableau, Looker, and most modern warehouses. Learn it here and it transfers.

---

[Phase 1: What Power BI Actually Is & Getting Set Up →](01-what-power-bi-actually-is-and-getting-set-up.md)
