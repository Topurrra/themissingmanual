---
title: "Charts That Tell the Truth"
guide: "excel-pivot-tables-and-charts"
phase: 4
summary: "Choose the chart type that fits your question, build a PivotChart that follows your pivot, and avoid the axis, pie, and dual-scale tricks that make true numbers look false."
tags: [excel, charts, pivotcharts, data-visualization, misleading-charts, axes]
difficulty: intermediate
synonyms: ["how to make a pivot chart in excel", "which chart type should i use", "column chart vs bar chart vs line chart", "when to use a pie chart", "truncated axis misleading chart", "excel chart axis start at zero", "pivotchart not available chart types", "how to avoid misleading charts"]
updated: 2026-10-06
---

# Charts That Tell the Truth

A chart is a claim. "East is much bigger than West" is a sentence, and the chart is that sentence drawn so it hits in a second. The danger is that a chart can say something louder than the numbers do, and Excel will happily draw the louder version if you let it. This phase is about choosing a chart that matches your question and checking the few settings that decide whether it is straight with the reader.

## Pick the chart for the question

Start with what you are asking, not with what looks nice:

| Your question | Chart | Why |
|---|---|---|
| Which category is bigger? | **Column** (or **bar** when labels are long) | Length from a common baseline is what the eye compares most accurately |
| How did it change over time? | **Line** (or columns for a few periods) | A line connects ordered points and shows direction |
| What share of a whole is each part? | **Pie**, only for a few parts | Slices are hard to compare, so use it only when the message is "this part is most of the whole" |

Our data gives one example of each:

| Question | Pivot | Chart |
|---|---|---|
| Which region leads? | East 13200, West 6900, North 5400 | Column, sorted largest to smallest |
| How did revenue move? | Jan 4800, Feb 11400, Mar 9300 | Line or column, months in order |
| How much is laptops? | Laptop 19200 of 25500 (75.3%), Monitor 6300 (24.7%) | Pie works with two slices |

Keep months in calendar order, not sorted by size, since time has a natural order. Sort category charts by value so the biggest bar comes first.

Pie charts have hard limits. Microsoft's guidance is that a pie shows one data series, cannot show negative values, and works best with no more than about seven categories that are all parts of one whole. Past that, switch to a sorted bar chart.

## PivotCharts: a chart tied to the pivot

A normal chart points at cells. A **PivotChart** points at a pivot, so it reshapes whenever the pivot does. Filter the pivot, click a slicer, or drag a field, and the chart follows.

To make one on Windows, click a cell in the pivot and choose **PivotTable Analyze > PivotChart**, then pick a chart type and select **OK**. You can also use **Insert > PivotChart** from a cell in your data. On Excel for Mac and Excel for the web, build the pivot first, then insert a chart from the **Insert** tab. It acts as a PivotChart when you change fields in the pivot field list.

Three things to know:

- **Not every type works.** Microsoft's documentation says treemap, statistical, and combo charts do not work with PivotTables. Column, line, pie, and radar do. If you need an unsupported type, copy the pivot values to cells and chart those, remembering they will not refresh.
- **Pair it with a slicer.** One slicer drives both the pivot and the chart, which turns your sheet into a clickable mini-dashboard.
- **The chart shows what the pivot shows.** A Grand Total row or a filtered pivot appears in the chart. Check the pivot before you trust the picture.

## Trap 1: the truncated axis

Column and bar charts show a number as the length of a bar. That only works if the bars start at zero. Excel chooses the axis range automatically unless you set it, so always look at where the value axis starts.

Take East 13200 and West 6900. With the axis starting at 0, East's bar is about 1.9 times West's, which matches the data (13200 / 6900 = 1.91). Now set the axis minimum to 6000. East's bar rises 7200 above the baseline and West's only 900:

| Axis minimum | East bar height | West bar height | East looks like |
|---|---|---|---|
| 0 | 13200 | 6900 | 1.9 times West |
| 6000 | 7200 | 900 | 8 times West |

Same data, a very different story. To check or change it, select the vertical axis, choose **Format > Format Selection**, open **Axis Options**, and look at the **Minimum** box. **Reset** returns it to Excel's automatic choice. The rule for columns and bars: start at 0. Line charts encode value by position and slope, so a zoomed axis is sometimes reasonable, but then say so on the chart.

## Trap 2: pies that cannot be read

A pie with ten slices of similar size cannot be compared by eye, and one with negative values cannot be drawn at all. Two slices (laptops 75%, monitors 25%) read fine. Four slices at 28%, 26%, 24%, and 22% do not. When the point is a comparison, use bars.

## Trap 3: two axes that invent a relationship

Excel can plot one series on a second vertical axis with its own scale. Slide that scale and you can make two unrelated series seem to rise together. Be careful with this and label both axes. If the point is how two measures relate, show them as two separate small charts stacked on the same time scale.

## Trap 4: an unfinished period

If you chart revenue by month on the 10th, the current month is one-third full and looks like a collapse. Our March has data through the 30th, so it is complete. Exclude partial periods, or mark them clearly.

## Trap 5: decoration that distorts

3D columns make the front bars look bigger than the back ones. A column's top edge sits at a different visual height from its value. Use flat 2D charts. Skip gradients and picture fills that add no information.

> 💡 **Key point**
> A chart's job is to show the pattern the data really has. Ask before sharing: if someone read only this picture, would they leave with the same conclusion as someone who read every number? For the wider habit of questioning metrics, see [Metrics That Lie](/guides/metrics-that-lie), and for putting charts into one view people use daily, see [BI Dashboards That Work](/guides/bi-dashboards-that-work) and [Power BI From Zero](/guides/power-bi-from-zero).

## Your turn: audit a chart

A teammate sends a column chart of region revenue with the axis starting at 6000 and a title "East dominates". The chart makes East look 8 times West. What do you tell them? Reset the axis minimum to 0. Now East is 1.9 times West, which is still a clear lead and a true one. You lose none of the message and keep the reader's trust.

Check yourself before moving on:

```quiz
[
  {
    "q": "Which chart type best answers 'how did revenue change from January through March'?",
    "choices": ["Pie chart", "Line chart with months in calendar order", "Column chart sorted from largest to smallest month"],
    "answer": 1,
    "explain": "Time has a natural order, so a line (or columns) in calendar order shows the direction of change. Sorting by size destroys the order."
  },
  {
    "q": "East is 13200 and West is 6900. If a column chart's value axis starts at 6000, how do the bars compare?",
    "choices": ["East's bar is about 1.9 times West's", "East's bar is 8 times West's, exaggerating the gap", "The bars are equal"],
    "answer": 1,
    "explain": "The visible heights are 13200 minus 6000 equals 7200, and 6900 minus 6000 equals 900. 7200 divided by 900 is 8."
  },
  {
    "q": "Which statement about PivotCharts is correct?",
    "choices": ["They are tied to a pivot, so filtering or using a slicer on the pivot changes the chart", "They support every chart type including treemap and combo", "They keep their values after the pivot is deleted"],
    "answer": 0,
    "explain": "A PivotChart follows its PivotTable. Microsoft documents that treemap, statistical, and combo charts are not supported."
  }
]
```

## Recap

1. Choose the chart from the question: columns or bars to compare, lines for change over time, pie only for a few parts of one whole.
2. A PivotChart follows its pivot, so slicers and filters change it. Supported types include column, line, pie, and radar, but not treemap, statistical, or combo.
3. Columns and bars must start at zero. Check the axis Minimum under Format Selection, Axis Options.
4. Avoid crowded pies, unlabeled dual axes, unfinished periods, and 3D effects.
5. Before you share a chart, ask whether someone looking only at the picture would reach the same conclusion as someone reading the numbers.

You have the full path now: shape the data, build the pivot, keep it fresh, and chart it straight. For formulas that pull from your data, go to [Excel Formulas That Do Real Work](/guides/excel-formulas-that-do-real-work), and for data models and Power Query, [Advanced Excel](/guides/advanced-excel).
