---
title: "pandas From Zero"
guide: "pandas-from-zero"
phase: 0
summary: "Learn the Python data-analysis workhorse: the DataFrame mental model, loading and inspecting data, selecting and filtering, cleaning messy data, transforming with vectorized operations, the split-apply-combine power of groupby, joining datasets, time series, reshaping and pivoting, and plotting. The tool every Python data person reaches for, explained idea-first."
tags: [pandas, python, data-analysis, dataframe, groupby, data-cleaning, numpy, data]
category: frameworks
order: 10
group: "Python"
difficulty: beginner
synonyms: ["learn pandas", "pandas tutorial", "pandas dataframe", "pandas for beginners", "pandas groupby aggregation", "pandas filtering selecting", "pandas merge join", "pandas data cleaning", "pandas vs excel sql"]
updated: 2026-06-22
---

# pandas From Zero

If you do anything with data in Python - analysis, cleaning, reporting, feeding a machine-learning model
 - you'll do it through **pandas**. It's the library that turns a messy CSV into something you can query,
reshape, and summarize with a few lines instead of a hundred. The mental model that makes it click is
simple: pandas gives you a **DataFrame**, which is a spreadsheet or a SQL table that lives in memory and
that you manipulate with code. Once you think of it that way - rows, columns, filters, group-bys, joins - 
the whole library lines up with things you already understand from Excel and SQL.

We build that model first the whole way, and we lean on one habit that separates people who fight pandas
from people who fly with it: **think in whole columns, not in loops.** pandas operations work on entire
columns at once (vectorized), which is both faster and clearer than looping row by row. By the end you'll
load real data, clean it, filter it, group and aggregate it, join datasets, and chart the result.

> 📝 This assumes you know **Python** - lists, dicts, functions ([Python From Zero](/guides/python-from-zero)).
> No data-science background needed. It pairs naturally with the data work in
> [What Data Engineering Is](/guides/what-is-data-engineering) and
> [Spreadsheets to SQL to Pipelines](/guides/spreadsheets-to-sql-to-pipelines).
>
> 💡 The best way to learn pandas is hands-on: open a Jupyter notebook (or any Python REPL) and type these
> examples as you read - each one shows its output so you can check yourself.

## How to read this

Read in order - it works one small sales dataset from raw CSV to a finished chart, adding one pandas
skill per phase. Phases carry difficulty badges.

## The phases

**Part 1 - The basics (🟢 Basic)**
1. **[What pandas Is & the DataFrame](01-what-pandas-is.md)** 🟢 - Series vs DataFrame, and the "spreadsheet/table in memory" mental model.
2. **[Loading & Inspecting Data](02-loading-and-inspecting-data.md)** 🟢 - `read_csv` and friends, then `head`/`info`/`describe` to know what you've got.
3. **[Selecting & Filtering](03-selecting-and-filtering.md)** 🟢 - columns, `loc`/`iloc`, and boolean masks to slice the data you want.

**Part 2 - Real data work (🟡 Intermediate → 🔴)**
4. **[Cleaning Data](04-cleaning-data.md)** 🟡 - missing values, types, duplicates, and messy strings.
5. **[Transforming Data](05-transforming-data.md)** 🟡 - new columns, `apply`/`map`, and why you vectorize instead of loop.
6. **[GroupBy & Aggregation](06-groupby-and-aggregation.md)** 🔴 - split-apply-combine, the single most powerful pandas idea.
7. **[Joining & Combining](07-joining-and-combining.md)** 🟡 - `merge` (the SQL joins), `concat`, and stitching datasets together.
8. **[Time Series & Dates](08-time-series.md)** 🟡 - parsing dates, date indexing, and resampling.
9. **[Reshaping & Pivoting](09-reshaping-and-pivoting.md)** 🟡 - `pivot_table`, `melt`, and wide-vs-long data.

**Part 3 - Output & beyond (🟢)**
10. **[Plotting & Where to Go Next](10-plotting-and-where-next.md)** 🟢 - quick charts, performance habits, and what to learn next.

> The throughline: a DataFrame is a table you compute on, and almost everything is a column operation.
> Hold those two ideas and pandas stops being a grab-bag of methods and becomes a coherent tool.

---

[Phase 1: What pandas Is & the DataFrame →](01-what-pandas-is.md)
