---
title: "Reshaping & Pivoting"
guide: "pandas-from-zero"
phase: 9
summary: "The same data wears two shapes — long (one row per observation) and wide (categories as columns). Reshape freely with pivot_table, melt, stack/unstack, and crosstab."
tags: [pandas, pivot-table, melt, reshape, wide-long, stack-unstack, crosstab]
difficulty: intermediate
synonyms: ["pandas pivot_table", "pandas melt", "pandas wide vs long format", "pandas stack unstack", "pandas reshape data", "pandas crosstab", "pandas pivot vs pivot_table"]
updated: 2026-06-22
---

# Reshaping & Pivoting

You've spent eight phases working data row by row — selecting, cleaning, grouping. This phase is about a
different superpower: changing the *shape* of the table itself without changing a single number in it.

📝 Here's the mental model that runs the whole phase: **the same data can be stored in two shapes, and
neither is more "correct" than the other.** It's *long* (one row per observation, lots of rows, few columns)
or it's *wide* (categories spread out across columns, like a spreadsheet report). Reshaping is just
converting between them. Different tasks want different shapes — a human reading a report wants wide; a
plotting library or a model usually wants long — so the skill is recognizing which shape you have, which one
your task needs, and the one command that gets you there.

We'll keep working the running sales dataset (`date`, `product`, `region`, `units`, `price`, `revenue`):

```python
import pandas as pd

sales = pd.DataFrame({
    "date":    ["2024-01-05", "2024-01-05", "2024-01-06", "2024-01-06", "2024-01-07", "2024-01-07"],
    "product": ["Widget", "Gadget", "Widget", "Gadget", "Widget", "Gadget"],
    "region":  ["North", "South", "North", "West", "South", "North"],
    "units":   [10, 4, 7, 12, 5, 8],
    "price":   [9.99, 19.99, 9.99, 19.99, 9.99, 19.99],
})
sales["revenue"] = sales["units"] * sales["price"]
```

*What just happened:* the same setup as ever, with `revenue` derived from `units * price`. Notice the shape
it's in: one row per sale, with `region` and `product` living as *values* inside columns. That's **long
format** — and it's the shape pandas (and almost every data tool) prefers to receive.

## Wide vs long: the core idea

📝 The two shapes are easiest to feel by seeing the same fact in both.

**Long** is what we have above: each row is one observation, and the things you'd group by (`region`,
`product`) are stored as ordinary column values. If you added a new region, you'd add *rows*, not columns.

**Wide** takes one of those category columns and spreads its distinct values across the *top* as column
headers. Imagine total revenue by region and product laid out as a grid:

```console
product   Gadget  Widget
region
North     159.92  169.83
South      79.96   49.95
West      239.88     NaN
```

*What just happened:* nothing changed about the underlying numbers — this is the *same revenue*, reshaped.
In long form, `product` was a column of values (`"Gadget"`, `"Widget"`). In wide form, those values became
the column *headers*, and each cell holds the revenue where a region meets a product. A person reading a
report loves this layout; a plotting library usually hates it. That tension is the whole reason reshaping
exists.

💡 Quick gut-check for "which shape am I looking at?": if adding a new category (a new product) would mean
adding a **row**, you're long; if it would mean adding a **column**, you're wide.

## pivot_table: long → wide summary

The workhorse for going long → wide is `pivot_table`, and it's exactly the spreadsheet feature of the same
name. You tell it three things: what goes down the side (`index`), what spreads across the top (`columns`),
and what fills the cells (`values`, plus how to combine them with `aggfunc`).

```python
report = sales.pivot_table(
    values="revenue",
    index="region",
    columns="product",
    aggfunc="sum",
)
print(report)
```
```console
product   Gadget  Widget
region
North     159.92  169.83
South      79.96   49.95
West      239.88     NaN
```

*What just happened:* `pivot_table` put each distinct `region` down the side as a row, each distinct
`product` across the top as a column, and filled every cell with the **sum** of `revenue` for that
region-product pair. North bought both products, so it has two numbers; West only bought Gadgets, so its
Widget cell is `NaN` (there were no Widget sales in West to sum).

💡 Here's the connection to lean on: this *is* a groupby from [Phase 6](06-groupby-and-aggregation.md),
reshaped into a grid. `sales.groupby(["region", "product"])["revenue"].sum()` computes the exact same six
numbers — `pivot_table` just lays them out as a 2-D table instead of a stacked list. Same aggregation, prettier
shape. That's why it's the go-to for human-readable reports.

Two options make those reports much nicer. `fill_value` replaces the gaps, and `margins=True` adds totals:

```python
report = sales.pivot_table(
    values="revenue",
    index="region",
    columns="product",
    aggfunc="sum",
    fill_value=0,
    margins=True,
)
print(report)
```
```console
product   Gadget  Widget     All
region
North     159.92  169.83  329.75
South      79.96   49.95  129.91
West      239.88    0.00  239.88
All       479.76  219.78  699.54
```

*What just happened:* `fill_value=0` swapped that empty West/Widget cell for a clean `0.00`, and
`margins=True` added an `All` row and `All` column holding the row totals, column totals, and the
grand total (`699.54`) in the corner. That's a finished report in one call — exactly what you'd hand a
stakeholder.

## pivot vs pivot_table

There's a near-twin called `pivot`, and the difference is worth knowing so it doesn't bite you.

⚠️ **`pivot` does no aggregation.** It assumes each index/column pair appears exactly once, and it errors
out the moment two rows land in the same cell — `ValueError: Index contains duplicate entries`. Our data
*has* duplicates (North/Widget shows up on two different dates), so `sales.pivot(index="region",
columns="product", values="revenue")` would blow up trying to fit two revenue numbers into one cell with no
instruction for how to combine them.

`pivot_table` doesn't have that problem because aggregating duplicates is its whole job — that's what
`aggfunc="sum"` is *for*. It takes the two North/Widget rows and sums them into one cell.

💡 Rule of thumb: **reach for `pivot_table` by default.** Use plain `pivot` only when you're certain every
index/column pair is unique (already-summarized data, for example) and you want it to *fail loudly* if
that assumption is wrong. For real, messy data, `pivot_table` is the safe choice.

## melt: wide → long

`melt` is the inverse move — it takes a wide table and collapses those spread-out columns back into long
key/value rows. This comes up constantly: someone hands you a spreadsheet-shaped report (months across the
top, say) and you need it long before you can plot, filter, or feed it to a model.

Picture a wide table where each region has its monthly revenue across columns:

```python
wide = pd.DataFrame({
    "region": ["North", "South", "West"],
    "Jan":    [329.75, 129.91, 239.88],
    "Feb":    [410.20, 188.40, 301.55],
})
long = pd.melt(
    wide,
    id_vars="region",
    var_name="month",
    value_name="revenue",
)
print(long)
```
```console
  region month  revenue
0  North   Jan   329.75
1  South   Jan   129.91
2   West   Jan   239.88
3  North   Feb   410.20
4  South   Feb   188.40
5   West   Feb   301.55
```

*What just happened:* `melt` kept `region` fixed (that's `id_vars` — the column to anchor on) and unpivoted
the two month columns (`Jan`, `Feb`) into rows. The old column *names* became values in a new `month` column
(`var_name`), and the old cell *contents* became values in a new `revenue` column (`value_name`). Three wide
rows became six long ones. Now each row is a single observation again — which is exactly the tidy shape that
plotting and modeling tools expect. `melt` is `pivot_table` run backward.

## stack, unstack, and crosstab

Two more reshaping tools round out the kit. Keep these in your back pocket.

`stack` and `unstack` reshape between columns and a **MultiIndex** — the multi-level index you got from
grouping by more than one key in [Phase 6](06-groupby-and-aggregation.md). `unstack` lifts an index level up
into columns (long → wide); `stack` pushes columns down into the index (wide → long):

```python
grouped = sales.groupby(["region", "product"])["revenue"].sum()
print(grouped.unstack())
```
```console
product   Gadget  Widget
region
North     159.92  169.83
South      79.96   49.95
West      239.88     NaN
```

*What just happened:* `groupby` gave us a Series with a two-level (`region`, `product`) MultiIndex —
the same six numbers as before, stacked vertically. `unstack()` popped the inner `product` level up to become
columns, producing the very same wide grid `pivot_table` gave us. That's not a coincidence: `pivot_table` is
essentially `groupby` + `unstack` bundled into one friendly call. `stack()` would undo it, folding the
columns back down into the index.

For a pure **frequency table** — how many times each combination occurs — `pd.crosstab` is the shortcut:

```python
print(pd.crosstab(sales["region"], sales["product"]))
```
```console
product  Gadget  Widget
region
North         1       1
South         1       1
West          1       0
```

*What just happened:* `crosstab` counted the *rows* for each region/product pair — North had one Gadget sale
and one Widget sale, West had one Gadget sale and zero Widget sales. It's `pivot_table` with `aggfunc="count"`
wired in by default, purpose-built for "how often does each combination show up?"

💡 The takeaway for the whole phase: **pick the shape your task needs, and reshape freely to get there.**
Wide for a human-readable report; long for plotting and modeling. The numbers never change — only their
arrangement does — so reshaping is a cheap, reversible move you should make without hesitation the moment a
tool wants the other shape.

## Recap

1. **Long vs wide is the core idea.** Long = one row per observation, categories as column *values*; wide =
   categories spread across column *headers*. Same data, different arrangement — neither is more correct.
2. **`pivot_table(values, index, columns, aggfunc)`** goes long → wide: it's a [Phase 6](06-groupby-and-aggregation.md)
   groupby reshaped into a grid. Add `fill_value` to clean gaps and `margins=True` for row/column totals.
3. **`pivot` vs `pivot_table`:** ⚠️ plain `pivot` does no aggregation and errors on duplicate index/column
   pairs; `pivot_table` aggregates duplicates. Default to `pivot_table` for real data.
4. **`pd.melt(df, id_vars, var_name, value_name)`** goes wide → long, unpivoting spread-out columns back into
   key/value rows — the shape plotting and modeling tools want.
5. **`stack`/`unstack`** reshape between columns and a MultiIndex (`unstack` = long → wide, `stack` = wide →
   long); `pd.crosstab` builds frequency tables in one call.
6. **Pick the shape your task needs and reshape freely** — wide for reports, long for plotting/modeling. The
   numbers stay put; only the layout moves.

## Quick check

Make sure the two shapes — and the one command for each direction — have stuck:

```quiz
[
  {
    "q": "Your sales data is long (one row per sale) and you want a report with regions down the side and products across the top, summing revenue. Which tool fits?",
    "choices": [
      "sales.pivot_table(values=\"revenue\", index=\"region\", columns=\"product\", aggfunc=\"sum\")",
      "pd.melt(sales, id_vars=\"region\")",
      "sales.stack()",
      "sales.sort_values(\"revenue\")"
    ],
    "answer": 0,
    "explain": "pivot_table is the long → wide summary: index goes down the side, columns spread across the top, and aggfunc combines the values in each cell. It's a groupby reshaped into a grid."
  },
  {
    "q": "Why prefer pivot_table over plain pivot for real-world data?",
    "choices": [
      "pivot_table aggregates duplicate index/column pairs; plain pivot does no aggregation and errors when a pair appears more than once",
      "pivot is deprecated and no longer works",
      "pivot can only handle numeric columns",
      "There is no difference — they are aliases for the same function"
    ],
    "answer": 0,
    "explain": "pivot assumes each index/column pair is unique and raises a ValueError on duplicates. pivot_table aggregates them (via aggfunc), so it's the safe default for messy data."
  },
  {
    "q": "You receive a wide table with months as columns (Jan, Feb, ...) and need it long for plotting. Which function reshapes it?",
    "choices": [
      "pd.melt — it unpivots the month columns into key/value rows",
      "pd.pivot_table — it spreads values into columns",
      "pd.crosstab — it builds a frequency table",
      "df.fillna — it fills missing values"
    ],
    "answer": 0,
    "explain": "melt is the wide → long move: it keeps id_vars fixed and collapses the spread-out columns into a var_name/value_name pair of long rows — the tidy shape plotting tools expect."
  }
]
```

---

[← Phase 8: Time Series & Dates](08-time-series.md) · [Guide overview](_guide.md) · [Phase 10: Plotting & Where to Go Next →](10-plotting-and-where-next.md)
