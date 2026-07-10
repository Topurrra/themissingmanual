---
title: "What pandas Is & the DataFrame"
guide: "pandas-from-zero"
phase: 1
summary: "The mental model that makes pandas click: a DataFrame is a spreadsheet or SQL table living in memory that you manipulate with code. Meet the Series, the DataFrame, the index, and the column-first habit."
tags: [pandas, dataframe, series, python, data-analysis, getting-started]
difficulty: beginner
synonyms: ["what is pandas", "pandas dataframe explained", "pandas series vs dataframe", "pandas vs excel", "create a dataframe", "pandas import", "python data analysis library"]
updated: 2026-07-10
---

# What pandas Is & the DataFrame

If you've ever stared at a spreadsheet and thought "I wish I could do this with code instead of dragging
formulas around," pandas is the answer. It's the library Python people reach for the moment data is
involved — and before you write a single line of it, there's one idea that makes everything else fall
into place. Get this idea, and pandas stops being a wall of unfamiliar methods and becomes a tool you
already half-understand.

That idea is this: **a DataFrame is a spreadsheet — or a SQL table — that lives in your computer's memory,
and you poke at it with code instead of a mouse.** Rows and columns. Filters. Group-bys. Joins. You know
these from Excel and SQL ([Spreadsheets to SQL to Pipelines](/guides/spreadsheets-to-sql-to-pipelines))
already. pandas gives you the same shapes with a programmer's superpower: repeatable, scriptable,
version-controllable operations on data of any size.

## What pandas actually is

📝 **pandas** — a Python library for working with **tabular data** (rows and columns). It's built on top of
**NumPy** (Python's fast numerical array library), and it's the standard, default tool for data analysis,
cleaning, and prep in Python. If a data scientist or analyst is writing Python, they're using pandas.

The reason it won is the mental model. A spreadsheet is a grid you edit by hand. A SQL table is a grid you
query. pandas is a grid that *lives in a variable* — you load it once, then transform it with code, see the
result, transform it again. Fast feedback, no manual steps, every operation written down.

By universal convention, you import it under the name `pd`:

```python
import pandas as pd
```

*What just happened:* You pulled in the library and gave it the short alias `pd`. Every pandas tutorial,
Stack Overflow answer, and codebase on Earth writes `pd.something`. Follow the convention — `import pandas
as pd` is as standard as it gets, and writing it any other way only makes your code harder for others (and
future you) to read.

> 💡 pandas isn't available in this guide's in-browser runtime, so the code blocks here aren't runnable. To
> follow along for real, type these into a Jupyter notebook or a Python REPL where pandas is installed
> (`pip install pandas`). Each example shows its output so you can check yourself either way.

## The Series — one labeled column

Before the table, the column. The building block of pandas is the **Series**.

📝 **Series** — a single column of data: a one-dimensional array of values, each paired with a **label**
(its index). Think of it as one column lifted out of a spreadsheet, carrying its row labels with it.

Let's make one from the `units` figures in our running sales dataset:

```python
import pandas as pd

units = pd.Series([10, 4, 7, 12])
print(units)
```
```console
0    10
1     4
2     7
3    12
dtype: int64
```

*What just happened:* You handed pandas a plain Python list and got back a Series. Notice there are **two**
columns in that output, not one. On the right are your values (`10, 4, 7, 12`). On the left — the `0, 1, 2,
3` — is the **index**: the label attached to each value. You didn't ask for it; pandas added a default
numbered index automatically. The `dtype: int64` at the bottom tells you pandas figured out these are
64-bit integers (a NumPy type — that's the NumPy foundation showing through). A Series is always "values +
their labels," and that left-hand index is the part that makes pandas different from a bare list.

## The DataFrame — a table of Series

Now the main event. Stack several Series side by side, sharing one set of row labels, and you have a
**DataFrame**.

📝 **DataFrame** — a table with rows and columns. Mechanically, it's a dict of Series that all share the
same index. Each **column** is a Series; the **index** labels the rows they have in common. This is the
object you'll spend 95% of your pandas life working with.

Here's our sales dataset — five columns: `date`, `product`, `region`, `units`, `price` — built from a
dict where each key is a column name and each value is that column's data:

```python
import pandas as pd

sales = pd.DataFrame({
    "date":    ["2024-01-05", "2024-01-05", "2024-01-06", "2024-01-06", "2024-01-07"],
    "product": ["Widget", "Gadget", "Widget", "Gadget", "Widget"],
    "region":  ["North", "South", "North", "West", "South"],
    "units":   [10, 4, 7, 12, 5],
    "price":   [9.99, 19.99, 9.99, 19.99, 9.99],
})
print(sales)
```
```console
         date product region  units  price
0  2024-01-05  Widget  North     10   9.99
1  2024-01-05  Gadget  South      4  19.99
2  2024-01-06  Widget  North      7   9.99
3  2024-01-06  Gadget   West     12  19.99
4  2024-01-07  Widget  South      5   9.99
```

*What just happened:* You passed a dict of equal-length lists, and pandas assembled them into a table. Each
dict key became a **column header**; each list became that column's values. Down the left edge is the same
default index (`0`–`4`) you saw on the Series — it labels the rows, and every column shares it. That's the
"dict of Series sharing one index" definition made concrete. Pull out any single column and you get a
Series right back:

```python
print(sales["product"])
```
```console
0    Widget
1    Gadget
2    Widget
3    Gadget
4    Widget
Name: product, dtype: object
```

*What just happened:* Indexing the DataFrame with a column name (`sales["product"]`) handed you that one
column as a Series — values plus the shared index, with `Name: product` noting which column it came from.
`dtype: object` is how pandas labels columns of text/strings. A DataFrame really is just its columns; ask
for one and a Series falls out.

## The index — labels, not row numbers

You've now seen that `0, 1, 2, ...` running down the left side three times. It's worth slowing down on,
because it's a pandas signature that trips up newcomers.

📝 **Index** — the set of labels for the rows of a Series or DataFrame. By default it's a range `0, 1, 2, …
n-1`, but it doesn't have to be numbers, and it doesn't have to be sequential. It's how pandas finds rows
and **aligns** data across operations.

The default index is just pandas being helpful when you didn't supply labels. But you can promote any
column to *be* the index — useful when a column is a natural identifier for each row, like the date:

```python
by_date = sales.set_index("date")
print(by_date)
```
```console
           product region  units  price
date
2024-01-05  Widget  North     10   9.99
2024-01-05  Gadget  South      4  19.99
2024-01-06  Widget  North      7   9.99
2024-01-06  Gadget   West     12  19.99
2024-01-07  Widget  South      5   9.99
```

*What just happened:* `set_index("date")` moved the `date` column out of the body and made it the row
labels. Now rows are identified by their date instead of by `0`–`4`. `date` is no longer a regular column
you'd select — it's the index, sitting in that left-hand position. (`set_index` returns a *new* DataFrame;
your original `sales` is untouched.)

⚠️ **Gotcha — the index is a label, not a row number.** It looks like a counter, but it isn't one. When you
filter or sort a DataFrame, rows keep their original index labels — so after filtering you might see an
index like `0, 2, 4`, with gaps. More importantly, pandas uses the index to **align** data: when you
combine two Series or DataFrames, it matches them up *by index label*, not by position. Treat the index as
each row's identity, and the surprises you'll hit later (mismatched merges, `NaN`s appearing out of
nowhere) start making sense.

## Why columns, not loops

Here's the habit that separates people who fight pandas from people who fly with it. Coming from regular
Python ([Python From Zero](/guides/python-from-zero)), your instinct for "compute revenue for every row"
is a loop:

```python
# The Python instinct — DON'T do this in pandas
revenue = []
for i in range(len(sales)):
    revenue.append(sales["units"][i] * sales["price"][i])
```

That works, but it's slow, verbose, and not how pandas thinks. pandas operates on **whole columns at
once** — a style called **vectorization**, powered by the NumPy underneath. You write the operation as if
the columns were single values, and pandas applies it to every row in one fast, C-level sweep:

```python
sales["revenue"] = sales["units"] * sales["price"]
print(sales)
```
```console
         date product region  units  price  revenue
0  2024-01-05  Widget  North     10   9.99    99.90
1  2024-01-05  Gadget  South      4  19.99    79.96
2  2024-01-06  Widget  North      7   9.99    69.93
3  2024-01-06  Gadget   West     12  19.99   239.88
4  2024-01-07  Widget  South      5   9.99    49.95
```

*What just happened:* `sales["units"] * sales["price"]` multiplied the two columns element-by-element — row
0's units times row 0's price, row 1's times row 1's, all the way down — and produced a new Series of
results in one expression. Assigning it to `sales["revenue"]` added that result as a brand-new column. No
loop, no index bookkeeping, no `append`. One line that reads like the math you actually mean, and it runs
far faster than the loop because the work happens in NumPy's compiled core, not in Python.

💡 **Key point.** Think in columns, not rows. Almost everything in pandas is a whole-column (vectorized)
operation: arithmetic, comparisons, string methods, filters. Whenever you catch yourself about to write
`for i in range(len(df))`, stop — there's almost always a column expression that's shorter, clearer, and
much faster. This single habit runs through the entire rest of this guide.

## Recap

1. **pandas** is Python's standard library for tabular data, built on **NumPy**. The mental model: a
   **DataFrame is a spreadsheet / SQL table that lives in memory** and that you manipulate with code.
2. Import it the one true way: `import pandas as pd`.
3. A **Series** is one labeled column — values paired with an **index**. A **DataFrame** is a dict of
   Series sharing one index: a table whose every column is a Series.
4. Every Series and DataFrame has an **index** labeling its rows (default `0…n-1`). ⚠️ The index is a
   *label*, not a row number — operations align data by index, and you can set any column as the index.
5. Build a DataFrame from a dict of equal-length lists (one key per column); select a column with
   `df["name"]` and you get a Series back.
6. **Think in columns, not loops.** Vectorized operations like `df["price"] * df["units"]` compute a whole
   new column in one fast, readable step — the core habit for the rest of this guide.

## Quick check

Test yourself on the two ideas that everything else builds on — what a DataFrame *is*, and the column-first
habit:

```quiz
[
  {
    "q": "What is the best mental model for a pandas DataFrame?",
    "choices": [
      "A spreadsheet or SQL table that lives in memory and that you manipulate with code",
      "A faster replacement for Python's print() function",
      "A file format for saving data to disk",
      "A type of for-loop that runs over rows one at a time"
    ],
    "answer": 0,
    "explain": "A DataFrame is a table of rows and columns held in memory — like a spreadsheet or SQL table — that you transform with code instead of a mouse or a query window."
  },
  {
    "q": "How does a Series relate to a DataFrame?",
    "choices": [
      "A Series is one labeled column; a DataFrame is several Series sharing one index",
      "A Series is a DataFrame with no index",
      "They are completely unrelated objects",
      "A DataFrame is a single Series with extra colors"
    ],
    "answer": 0,
    "explain": "A Series is a single column (values plus an index). A DataFrame is a dict of Series that all share the same row index — so each column of a DataFrame is itself a Series."
  },
  {
    "q": "Why prefer `sales[\"units\"] * sales[\"price\"]` over a Python for-loop over the rows?",
    "choices": [
      "It is vectorized — pandas computes the whole column at once in NumPy's fast core, and reads more clearly",
      "Loops are not allowed anywhere in pandas",
      "It rounds the numbers automatically to save memory",
      "It is the only way to create a new column"
    ],
    "answer": 0,
    "explain": "Vectorized column operations apply to every row in one compiled NumPy sweep — faster than a Python loop and far easier to read. Thinking in whole columns instead of row loops is the central pandas habit."
  }
]
```

---

[Guide overview](_guide.md) · [Phase 2: Loading & Inspecting Data →](02-loading-and-inspecting-data.md)
