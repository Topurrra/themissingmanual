---
title: "Excel Pivot Tables and Charts"
guide: "excel-pivot-tables-and-charts"
phase: 0
summary: "Summarize thousands of rows in seconds with PivotTables, then chart the result without lying: shape your data, build and reshape a pivot, slice and refresh it, and pick charts and axes that show the truth."
tags: [excel, pivot-tables, charts, data-analysis, spreadsheets, summarizing-data, pivotcharts, slicers]
category: data-analytics
order: 32
difficulty: intermediate
synonyms: ["how to make a pivot table in excel", "excel pivot table tutorial", "what is a pivot table used for", "pivot table not updating", "how to group dates in a pivot table", "excel pivot chart tutorial", "how to summarize data in excel", "excel slicers and timelines", "misleading charts in excel", "pivot table vs group by"]
updated: 2026-10-06
---

# Excel Pivot Tables and Charts

You have a sheet with four thousand sales rows and someone asks, "Which region is selling the most laptops, and is it growing?" You could write a dozen SUMIFS formulas, or you could drag three fields around and have the answer in ten seconds. That is what a PivotTable is for. It is the fastest way most people will ever answer a question about a big table of data.

This guide teaches the idea underneath (a PivotTable is a group-by with a friendly face), the data shape that makes it work, the controls that matter, and how to turn the result into a chart that does not mislead. Checked against Excel for Microsoft 365 on Windows. Where Mac or older versions differ, the text says so.

## Prerequisite

You should be comfortable with cells, ranges, and basic formulas. If not, start with [Excel From Zero](/guides/excel-from-zero). To see the same idea in SQL, [Querying Basics: SELECT and WHERE](/guides/querying-basics-select-where) covers `GROUP BY`.

## How to read this

- **In a hurry?** Read [Phase 1](01-what-a-pivottable-does-and-getting-your-data-ready.md) for the shape rules, then jump to Phase 2 and build one.
- **Pivot not updating?** Phase 3 has the refresh gotcha.
- **Want it to finally make sense?** Read in order. The same twelve-row sales sheet runs through every phase, so you can check every number by hand.

## The phases

1. **[What a PivotTable Does, and Getting Your Data Ready](01-what-a-pivottable-does-and-getting-your-data-ready.md)** - group and aggregate, plus the shape rules and the Table trick.
2. **[Building and Reshaping a PivotTable](02-building-and-reshaping-a-pivottable.md)** - the four areas, Sum vs Count vs Average, Show Values As, grouping, sorting.
3. **[Slicers, Timelines, and Keeping a Pivot Fresh](03-slicers-timelines-and-keeping-a-pivot-fresh.md)** - click-to-filter, refreshing, and the GETPIVOTDATA surprise.
4. **[Charts That Tell the Truth](04-charts-that-tell-the-truth.md)** - choosing a chart, PivotCharts, and the axis tricks that mislead.

## Where to go next

For formulas that reach into your data, see [Excel Formulas That Do Real Work](/guides/excel-formulas-that-do-real-work). For data models, Power Query, and larger datasets, see [Advanced Excel](/guides/advanced-excel). To put charts into a living dashboard, read [BI Dashboards That Work](/guides/bi-dashboards-that-work) and [Power BI From Zero](/guides/power-bi-from-zero), and before you trust any number, [Metrics That Lie](/guides/metrics-that-lie).
