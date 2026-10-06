---
title: "Slicers, Timelines, and Keeping a Pivot Fresh"
guide: "excel-pivot-tables-and-charts"
phase: 3
summary: "Filter a PivotTable with clickable slicers and timelines, refresh it when the source changes (the classic pivot did not update gotcha), and understand why clicking a pivot cell writes a GETPIVOTDATA formula."
tags: [excel, pivot-tables, slicers, timelines, refresh, getpivotdata]
difficulty: intermediate
synonyms: ["excel slicer tutorial", "how to add a timeline to a pivot table", "pivot table not updating", "how to refresh a pivot table", "pivot table doesn't include new rows", "getpivotdata automatically appears", "turn off getpivotdata", "connect one slicer to multiple pivot tables"]
updated: 2026-10-06
---

# Slicers, Timelines, and Keeping a Pivot Fresh

A pivot is only useful if people can poke at it and trust it. Slicers and timelines turn filtering into clicking, which is why a pivot with slicers makes a decent mini-dashboard. Trust is the other half: the most common pivot bug is a summary that quietly shows yesterday's numbers. This phase fixes both, and defuses the formula that appears when you try to reference a pivot cell.

## Slicers: filter buttons you can see

A slicer is a panel of buttons, one per value of a field. Click a button and the pivot shows only that value. Unlike the Filters dropdown, a slicer shows at a glance what is selected.

1. Click any cell in the pivot.
2. Choose **Insert > Slicer** (the PivotTable Analyze tab has an **Insert Slicer** button too).
3. Tick **Region** and select **OK**.

A box with buttons East, North, and West appears. Click East and the pivot shows only East rows. Hold Ctrl and click West as well, and the pivot shows both: 13200 + 6900 = 20100 in total revenue. The funnel icon with an X at the top of the slicer clears the filter.

You can share one slicer across several pivots, as long as they use the same data source: select the slicer, open the **Slicer** tab, choose **Report Connections**, and tick the pivots to control. 

## Timelines: a slicer built for dates

A timeline is a slicer for a date field. It gives you a slider you can drag across time instead of a row of buttons.

1. Click a cell in the pivot.
2. Choose **PivotTable Analyze > Insert Timeline**.
3. Tick **Date** and select **OK**.

The timeline needs a field of real dates. Use the dropdown on its right edge to switch the time level among Years, Quarters, Months, and Days. At Months, click the February tile and the pivot shows only February: Sum of Revenue 11400. Drag across two tiles to select a range, such as February through March: 11400 + 9300 = 20700.

## The "my pivot didn't update" gotcha

Here is the trap. A pivot builds its summary from a snapshot of your data (Excel calls it the pivot cache), held inside the workbook. Classically it re-reads the source only when you tell it to, so if you edit a number or add a sale, the pivot keeps showing the old total. Newer builds can refresh some pivots for you (see Auto Refresh below), but you cannot count on it.

Suppose the Table gets a new row:

| Date | Region | Product | Units | Revenue |
|---|---|---|---|---|
| 2026-03-31 | North | Monitor | 4 | 1200 |

The Table grows to 13 rows. The pivot still says North 5400 and Grand Total 25500. Now refresh. Right-click anywhere in the pivot and choose **Refresh**, or select the pivot and choose **PivotTable Analyze > Refresh**, or press Alt+F5. The pivot rebuilds:

| Region | Sum of Revenue |
|---|---|
| East | 13200 |
| North | 6600 |
| West | 6900 |
| Grand Total | 26700 |

North is 5400 + 1200 = 6600, and the total is 25500 + 1200 = 26700.

A few more details to know:

- **Several pivots at once.** Choose the arrow under **Refresh** on the PivotTable Analyze tab and pick **Refresh All**.
- **Refresh on open.** Select the pivot, choose **PivotTable Analyze > Options**, and on the **Data** tab of the dialog, tick **Refresh data when opening the file**.
- **Auto Refresh.** Newer Microsoft 365 builds have an Auto Refresh setting (**PivotTable Analyze > Auto Refresh**) that updates pivots built on data in the same workbook. It does not cover external or Power Query sources, and whether you have it depends on your build and Excel version. Do not rely on it. Make refreshing a habit and check the number.
- **Keyboard.** Alt+F5 refreshes the selected pivot. Ctrl+Alt+F5 refreshes everything in the workbook.
- **Plain range as source.** If the pivot was built from an ordinary range and not a Table, new rows below the range are not part of it, and Refresh will not find them. Select the pivot and choose **PivotTable Analyze > Change Data Source** to widen the range. This is the second reason to use a Table.
- **Column widths jumping.** In the same options dialog, on the **Layout & Format** tab, untick **Autofit column widths on update** to keep your widths, and tick **Preserve cell formatting on update** to keep your formatting.

> ⚠️ **Gotcha**
> Refresh never changes your source, and it cannot see data outside the source range. "My pivot is missing rows" means either you have not refreshed, or the new rows sit outside the range the pivot reads.

## The GETPIVOTDATA surprise

You build a pivot, then in a cell outside it you type `=` and click the cell showing East's total of 13200, expecting `=B4`. Instead Excel writes something like this:

```text
=GETPIVOTDATA("Revenue",$A$3,"Region","East")
```

That is not a bug. GETPIVOTDATA asks the pivot for a value by name: the field to read (`"Revenue"`), any cell inside the pivot (`$A$3`), and then field and item pairs (`"Region","East"`). Excel writes it for you whenever you click a pivot cell while building a formula.

It is actually safer than `=B4`. If you re-sort or rearrange the pivot, East's total moves to another cell, but GETPIVOTDATA still finds "East" by name. The surprise comes when you drag the formula down expecting it to move through the rows. It keeps asking for East, because "East" is written into the formula. And if the item is not visible in the pivot (filtered out by a slicer, for example), the formula returns a #REF! error.

You have two choices:

- **Keep it** when you want a stable link to a named value.
- **Turn it off** to get plain cell references: select a cell in the pivot, choose **PivotTable Analyze**, open the **Options** menu in the PivotTable group, and untick **Generate GetPivotData**. Alternatively, type the cell address instead of clicking.

## Your turn: predict the pivot

A colleague adds two sales rows to the source Table, then looks at the pivot, which has not been refreshed. Does the Grand Total change? No. The pivot holds its earlier snapshot until it is refreshed. After Refresh, the Grand Total includes both new rows.

Check yourself before moving on:

```quiz
[
  {
    "q": "You added rows to the source Table and the pivot still shows the old totals. What is the first thing to try?",
    "choices": ["Rebuild the pivot from scratch", "Right-click the pivot and choose Refresh", "Re-sort the Region field"],
    "answer": 1,
    "explain": "A pivot works from a snapshot and re-reads the source when refreshed. Alt+F5 or right-click Refresh is the usual fix."
  },
  {
    "q": "Which statement about slicers is correct?",
    "choices": ["A slicer shows a button for each value of a field and filters the pivot when clicked", "A slicer changes the source data", "A slicer can only be used on date fields"],
    "answer": 0,
    "explain": "Slicers are filter buttons. They never edit the source data, and timelines, not slicers, are the date-specific control."
  },
  {
    "q": "Excel wrote a GETPIVOTDATA formula when you clicked a pivot cell. Which is true?",
    "choices": ["It is a bug caused by a corrupted pivot", "It reads a value by field and item name, and you can turn this off with Generate GetPivotData", "It always returns the Grand Total"],
    "answer": 1,
    "explain": "GETPIVOTDATA looks up a pivot value by name, and the Generate GetPivotData option controls whether Excel writes it automatically."
  }
]
```

## Recap

1. A slicer is a clickable filter panel for one field. Hold Ctrl to pick several values, and use Report Connections to share it between pivots on the same source.
2. A timeline is a slicer for a real date field, with Years, Quarters, Months, and Days levels.
3. A pivot is a snapshot. After the source changes, Refresh (right-click, or Alt+F5) rebuilds it. Do not count on Auto Refresh being present.
4. A pivot built on a plain range misses rows outside it. Use a Table, or Change Data Source.
5. Clicking a pivot cell in a formula writes GETPIVOTDATA, which looks values up by name. Turn it off with Generate GetPivotData if you want plain references.

Next up, [Charts That Tell the Truth](04-charts-that-tell-the-truth.md): picking the right chart for the question, PivotCharts, and the axis tricks that mislead.
