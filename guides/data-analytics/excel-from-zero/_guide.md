---
title: "Excel From Zero"
guide: "excel-from-zero"
phase: 0
summary: "Learn Excel from scratch: what cells and formulas really are, how recalculation works, relative vs absolute references ($A$1), core functions, formatting vs values, sorting, filtering, Tables, and what every error value means."
tags: [excel, spreadsheets, formulas, cell-references, tables, beginner-friendly]
category: data-analytics
order: 30
difficulty: beginner
synonyms: ["learn excel from scratch", "excel for beginners", "what is the difference between relative and absolute references in excel", "how do formulas work in excel", "what does $ mean in an excel formula", "how to make a table in excel", "what does #DIV/0! mean in excel", "excel basics tutorial"]
updated: 2026-10-06
---

# Excel From Zero

You have opened Excel, typed some numbers, maybe used SUM because someone told you to. Then a formula you copied down a column gave nonsense, a total ignored half your data, or a cell filled with `#NAME?` and you had no idea what you did wrong. Most of that confusion comes from not knowing what Excel is actually doing with what you type.

This guide builds the working model first: a cell holds either a value or a recipe, recipes recalculate by themselves, and a reference is an instruction that changes when you copy it. With that in your head, formulas stop being spells you memorize. You will follow one small shop's sales list from an empty sheet to a clean Excel Table.

Checked against Excel for Microsoft 365 on Windows. Where Mac or older versions (2019, 2021) behave differently, the text says so.

## How to read this

- **In a hurry?** Jump to [Phase 2](02-cell-references.md) for the `$` sign, or [Phase 5](05-tables-and-errors.md) for Tables and the error cheat-card.
- **Want it to finally make sense?** Read in order. Each phase reuses the sales list from the one before, so type it in once and keep the file.

## The phases

1. **[Workbooks, Cells, and Formulas](01-workbooks-cells-and-formulas.md)** - what a cell really holds, how a formula recalculates, and the sales list you will build on.
2. **[Cell References: Relative, Absolute, Mixed](02-cell-references.md)** - what happens when you copy a formula, and what `$` is for.
3. **[Ranges and Everyday Functions](03-ranges-and-everyday-functions.md)** - SUM, AVERAGE, COUNT, COUNTA, MIN, MAX, and ROUND, and what each one ignores.
4. **[Formatting, Sorting, and Filtering](04-formatting-sorting-filtering.md)** - why a formatted 0.5 is still 0.5, and how to reorder and narrow data without breaking it.
5. **[Tables and Error Values](05-tables-and-errors.md)** - why Ctrl + T beats a loose range, structured references, and a cheat-card for `#DIV/0!`, `#NAME?`, `#REF!`, `#VALUE!`, and `#N/A`.

## Where to go next

Once this feels solid, [Excel Formulas That Do Real Work](/guides/excel-formulas-that-do-real-work) covers lookups and conditional math, and [Excel Pivot Tables and Charts](/guides/excel-pivot-tables-and-charts) summarizes data in a few clicks. If your data is outgrowing a spreadsheet, read [Spreadsheets to SQL to Pipelines](/guides/spreadsheets-to-sql-to-pipelines), and for dashboards see [Power BI From Zero](/guides/power-bi-from-zero).
