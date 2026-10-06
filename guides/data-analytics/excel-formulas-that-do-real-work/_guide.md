---
title: "Excel Formulas That Do Real Work"
guide: "excel-formulas-that-do-real-work"
phase: 0
summary: "The Excel formulas people use at work every day: XLOOKUP and its older cousins, IF and IFS, SUMIFS and COUNTIFS, text cleanup, and dates, all on one small orders-and-products dataset, plus the classic mistakes that quietly give wrong answers."
tags: [excel, formulas, xlookup, sumifs, lookups, dates, text-functions, spreadsheets]
category: data-analytics
order: 31
difficulty: intermediate
synonyms: ["excel formulas for work", "how to use xlookup in excel", "xlookup vs vlookup", "why does vlookup return the wrong value", "how to use sumifs in excel", "excel iferror hides errors", "excel formulas everyone should know", "excel lookup formulas explained", "excel text functions trim textjoin", "excel date functions edate eomonth networkdays"]
updated: 2026-10-06
---

# Excel Formulas That Do Real Work

You can write `=SUM(B2:B20)` and you know what a cell reference is. Then a real task shows up: pull each product's price into the orders sheet, total sales for one region in one month, clean up a column of names that someone typed with stray spaces. The formulas for those jobs exist, but the wrong one fails quietly, and a wrong number that looks fine is worse than an error.

This guide teaches the formulas that carry most real spreadsheet work, and the specific ways each one goes wrong. Every example uses one small dataset you can type in yourself, so you can check each result against your own screen.

Written for Excel for Microsoft 365. XLOOKUP, IFS, and TEXTJOIN need a recent version (IFS and TEXTJOIN: Excel 2019 or newer; XLOOKUP: Excel 2021 or newer), and TEXTSPLIT needs Microsoft 365 or Excel 2024. Older functions are covered too, because you will meet them in files other people built.

## Prerequisite

You should know what a cell reference is, how to fill a formula down, and `SUM`. If not, start with [Excel From Zero](/guides/excel-from-zero).

## The running dataset

Three small sheets. Type them in as you go (the values are all you need; formatting is optional).

**Products** sheet, `A1:D7`:

| SKU | Product | Category | Unit Price |
|---|---|---|---|
| P100 | Desk Lamp | Lighting | 40 |
| P200 | Office Chair | Furniture | 120 |
| P300 | Standing Desk | Furniture | 300 |
| P400 | Monitor Arm | Accessories | 55 |
| P500 | Keyboard | Accessories | 70 |
| P600 | Webcam | Accessories | 90 |

**Orders** sheet, `A1:F9` (columns G and H get built with formulas in phase 1):

| OrderID | OrderDate | Customer | SKU | Qty | Region |
|---|---|---|---|---|---|
| 1001 | 2026-01-05 | Nora Patel | P200 | 2 | East |
| 1002 | 2026-01-12 | Ben Ortiz | P100 | 5 | West |
| 1003 | 2026-01-30 | Nora Patel | P300 | 1 | East |
| 1004 | 2026-02-03 | Chloe Dang | P500 | 3 | West |
| 1005 | 2026-02-14 | Ben Ortiz | P200 | 1 | West |
| 1006 | 2026-02-20 | Dev Rao | P400 | 4 | East |
| 1007 | 2026-03-02 | Chloe Dang | P300 | 2 | West |
| 1008 | 2026-03-09 | Nora Patel | P600 | 1 | East |

Enter the dates as real dates: type `2026-01-05` and Excel converts it in most locales. Phase 5 shows how to check.

**Tiers** sheet, `A1:B4` (a quantity discount table):

| Min Qty | Discount |
|---|---|
| 0 | 0% |
| 3 | 5% |
| 5 | 10% |

## How to read this

- **Need a lookup right now?** Phase 1.
- **Getting a wrong number or a stray `#N/A`?** Jump to the cheat table at the end of [Phase 5](05-dates-and-the-classic-mistakes.md).
- **Want it to finally make sense?** Read in order. Each phase reuses the same data.

## The phases

1. **[Lookups: XLOOKUP, INDEX/MATCH, and VLOOKUP](01-lookups.md)** - pulling a value from another table, and why old VLOOKUP files break.
2. **[Logic: IF, IFS, AND, OR, and IFERROR](02-logic-and-iferror.md)** - making a cell decide, and when error-hiding hides a real bug.
3. **[Conditional Totals: SUMIFS, COUNTIFS, AVERAGEIFS](03-conditional-totals.md)** - totals by region, month, or customer.
4. **[Text: Cleaning, Splitting, and Joining](04-text.md)** - TRIM, LEFT, MID, TEXTJOIN, TEXT, and numbers stored as text.
5. **[Dates and the Classic Mistakes](05-dates-and-the-classic-mistakes.md)** - serial numbers, EDATE, EOMONTH, NETWORKDAYS, DATEDIF, and a symptom-to-fix table.

Lookups are joins under another name; if you know [SQL joins](/guides/sql-joins-explained), phase 1 will feel familiar. Pivot tables, charts, and the deeper tools live in [Excel Pivot Tables and Charts](/guides/excel-pivot-tables-and-charts) and [Advanced Excel](/guides/advanced-excel). When a workbook outgrows formulas, see [Power BI From Zero](/guides/power-bi-from-zero).
