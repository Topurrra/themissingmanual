---
title: "Building and Reshaping a PivotTable"
guide: "excel-pivot-tables-and-charts"
phase: 2
summary: "Build a PivotTable with the Rows, Columns, Values, and Filters areas, switch Sum to Count or Average, use Show Values As for percentages and running totals, and group dates and numbers."
tags: [excel, pivot-tables, value-field-settings, show-values-as, grouping, sorting]
difficulty: intermediate
synonyms: ["how to create a pivot table in excel", "pivot table rows columns values filters", "change sum to count in pivot table", "pivot table percent of total", "pivot table running total", "group dates by month in pivot table", "group numbers in pivot table", "sort pivot table largest to smallest"]
updated: 2026-10-06
---

# Building and Reshaping a PivotTable

You have the data in a Table. Now you build the summary, and then, the part that makes pivots addictive, you rearrange it in seconds to ask a different question. This phase covers the four areas where fields live, how to change what gets calculated, and how to bucket dates and numbers. Every number below comes from the twelve-row sales sheet in [Phase 1](01-what-a-pivottable-does-and-getting-your-data-ready.md), so you can check it by hand.

## Build your first one

1. Click any cell inside the Table.
2. Choose **Insert > PivotTable**. In the dialog, the **Table/Range** box shows your Table name. Pick **New Worksheet** and select **OK**.
3. A blank pivot appears with a **PivotTable Fields** pane. Tick **Region**, then tick **Revenue**.

Excel puts Region (text) in **Rows** and Revenue (a number) in **Values**, where it shows as **Sum of Revenue**. You get the table from Phase 1: East 13200, North 5400, West 6900, Grand Total 25500.

## The four areas

The field pane has four drop zones, and each one answers a different job:

| Area | What it does | In our example |
|---|---|---|
| **Rows** | Each distinct value becomes a row (a group) | Region |
| **Columns** | Each distinct value becomes a column, giving a second grouping | Product |
| **Values** | The number that gets aggregated in every cell | Sum of Revenue |
| **Filters** | Narrows the whole pivot to some values, shown as a dropdown above it | Product |

Drag Product from Rows or the field list into **Columns** and you get a two-way grid:

| Sum of Revenue | Laptop | Monitor | Grand Total |
|---|---|---|---|
| East | 10800 | 2400 | 13200 |
| North | 3600 | 1800 | 5400 |
| West | 4800 | 2100 | 6900 |
| Grand Total | 19200 | 6300 | 25500 |

East and Laptop: 2400 + 4800 + 3600 = 10800. Every cell is "group by Region and Product, then sum Revenue".

Now drag Product out of Columns and into **Filters** instead. A dropdown appears above the pivot. Choose Laptop and the pivot shows only laptop rows: East 10800, North 3600, West 4800, Grand Total 19200. Filters change which rows the pivot sees. Rows and Columns change how they are grouped.

## Sum, Count, Average

The Values area aggregates with Sum for numbers by default. Right-click any number in the pivot, choose **Summarize Values By**, and pick another function. The same Revenue field gives three different answers:

| Region | Sum of Revenue | Count of Revenue | Average of Revenue |
|---|---|---|---|
| East | 13200 | 5 | 2640 |
| North | 5400 | 3 | 1800 |
| West | 6900 | 4 | 1725 |
| Grand Total | 25500 | 12 | 2125 |

Count is how many rows are in each group, which is how many sales there were. Average is Sum divided by Count: East is 13200 / 5 = 2640. Note the Grand Total average, 25500 / 12 = 2125. It is not the average of the three region averages (that would be 2055), because East has more rows and counts for more. A pivot averages rows, not groups.

For more control, right-click a value and choose **Value Field Settings**. Its **Summarize Values By** tab also lists Max, Min, Product, and Count Numbers.

> ⚠️ **Gotcha**
> Excel picks Sum for a column of numbers but Count when the column holds text or blank cells. If a number column has text in it, such as "n/a" or numbers stored as text, or has blank cells, the pivot labels the field **Count of Revenue** instead of **Sum of Revenue** and gives you row counts where you expected dollars. Always read the field label after you add it to Values.

## Show Values As

Sometimes the question is not "how much" but "what share" or "how far along". Right-click a value, choose **Show Values As**, and pick a calculation. The pivot recalculates what each cell displays without touching your data.

With Region in Rows and Sum of Revenue in Values, **% of Grand Total** gives each region's share of 25500:

| Region | Sum of Revenue | % of Grand Total |
|---|---|---|
| East | 13200 | 51.8% |
| North | 5400 | 21.2% |
| West | 6900 | 27.1% |

East is 13200 / 25500 = 0.5176, shown as 51.8%. The displayed figures add to 100.1% only because of rounding; the real shares sum to exactly 100%.

Other choices you will use: **% of Row Total** (each cell as a share of its row) and **% of Column Total**. With Region in Rows and Product in Columns, **% of Row Total** shows each region's laptop and monitor mix:

| Region | Laptop | Monitor |
|---|---|---|
| East | 81.8% | 18.2% |
| North | 66.7% | 33.3% |
| West | 69.6% | 30.4% |

East laptop: 10800 / 13200 = 81.8%. **Running Total In** accumulates down a field you choose, which needs dates, so we come back to it right after grouping.

To see the raw number and the percentage side by side, drag Revenue into Values a second time, then set Show Values As on only the second copy.

## Group dates

Real data has a date on every row, but you rarely want 4,000 individual dates. You want months or quarters. Drag **Date** into Rows. In current Microsoft 365 builds, Excel usually groups dates automatically, choosing levels such as Years, Quarters, or Months based on how far your dates span (you may see extra Quarters or Years fields in the pivot field list). If you see ungrouped dates, or levels you do not want, right-click any date in the pivot, choose **Group**, and in the **By** list select **Months** (and **Years** if your data spans more than one year, so January 2026 and January 2027 do not merge). Select **OK**.

Our three months:

| Month | Sum of Revenue |
|---|---|
| Jan | 4800 |
| Feb | 11400 |
| Mar | 9300 |
| Grand Total | 25500 |

February: 1200 + 3600 + 4800 + 1800 = 11400. Now **Running Total In** makes sense. Right-click a value, choose **Show Values As > Running Total In**, and choose the base field (the month field):

| Month | Running total of Revenue |
|---|---|
| Jan | 4800 |
| Feb | 16200 |
| Mar | 25500 |

February is 4800 + 11400 = 16200, and March lands on the grand total, 25500.

> ⚠️ **Gotcha**
> Grouping dates fails with the message "Cannot group that selection" when the date column contains blanks or text instead of real dates. Dates typed as text such as "5th Jan" are the usual culprit. Fix the source cells, then group again.

## Group numbers

You can bucket a number field too. Drag **Units** into Rows and Revenue into Values, right-click a Units value, and choose **Group**. Set **Starting at** 1, **Ending at** 6, **By** 2:

| Units | Sum of Revenue |
|---|---|
| 1-2 | 7800 |
| 3-4 | 12900 |
| 5-6 | 4800 |
| Grand Total | 25500 |

Excel labels the buckets 1-2, 3-4, and 5-6. The 1-2 group holds five rows (units 2, 1, 2, 1, 2 with revenue 2400, 1200, 600, 2400, 1200), which add to 7800. To undo a grouping, right-click a grouped item and choose **Ungroup**.

## Sort

Right-click any value in the pivot, choose **Sort**, then **Sort Largest to Smallest**. The regions reorder to East 13200, West 6900, North 5400. Sorting a pivot by its values answers "who is biggest" in one click.

## Your turn: reshape it

Starting from Region in Rows and Sum of Revenue in Values, which single change shows the average sale per region? Right-click a value, choose **Summarize Values By > Average**, and you get East 2640, North 1800, West 1725. No formula needed.

Check yourself before moving on:

```quiz
[
  {
    "q": "In the sales pivot, where does the Region field go to make one row per region?",
    "choices": ["Values", "Rows", "Filters"],
    "answer": 1,
    "explain": "Rows creates one row for each distinct value of the field. Values is for the number that gets aggregated, and Filters narrows what the pivot sees."
  },
  {
    "q": "Your pivot shows Count of Revenue where you expected Sum of Revenue. What is the most likely cause?",
    "choices": ["The Revenue column contains text, so Excel defaulted to Count", "The pivot needs refreshing", "Rows and Columns are swapped"],
    "answer": 0,
    "explain": "Excel defaults to Sum for numbers and Count when the column has text or blanks. A number column with text in it flips the default."
  },
  {
    "q": "In our data, East has 5 sales totaling 13200 and the whole company has 12 sales totaling 25500. What is the Grand Total of Average of Revenue?",
    "choices": ["2055, the average of the three region averages", "2125, the total revenue divided by 12 rows", "25500"],
    "answer": 1,
    "explain": "A pivot averages rows. 25500 divided by 12 rows is 2125, which differs from the average of the region averages."
  }
]
```

## Recap

1. Insert > PivotTable on a cell in your Table, then drag fields into Rows, Columns, Values, and Filters.
2. Rows and Columns group, Values aggregates, Filters narrows. Each cell is a group-by of its row and column labels.
3. Right-click a value to switch among Sum, Count, and Average with Summarize Values By, and read the field label to catch Count-instead-of-Sum.
4. Show Values As turns the same numbers into % of Grand Total, % of Row Total, or a running total.
5. Group dates into months or years and numbers into ranges, which needs clean date and number cells.
6. Sort by right-clicking a value and choosing Sort Largest to Smallest.

Next up, [Slicers, Timelines, and Keeping a Pivot Fresh](03-slicers-timelines-and-keeping-a-pivot-fresh.md): point-and-click filters, refreshing, and the formula Excel writes behind your back.
