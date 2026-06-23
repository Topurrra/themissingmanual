---
title: "Transforming Data"
guide: "pandas-from-zero"
phase: 5
summary: "Derive new columns the pandas way: vectorized arithmetic, np.where and pd.cut for conditionals, map and replace for translation, apply as the flexible escape hatch — and why looping over rows is the #1 performance mistake."
tags: [pandas, vectorization, apply, map, new-columns, transformation, performance]
difficulty: intermediate
synonyms: ["pandas new column", "pandas apply map", "pandas vectorized operations", "pandas don't loop dataframe", "pandas np.where", "pandas transform column", "pandas performance vectorize"]
updated: 2026-06-22
---

# Transforming Data

Cleaning got your data trustworthy. Now you make it *useful* — and most of that work is the same move over
and over: take the columns you have and compute new ones from them. Revenue from units and price. A
"high value" flag from revenue. A size bucket from a number. A full region name from a code.

Here's the mental model for the whole phase, and it's the same one from Phase 1
([What pandas Is](01-what-pandas-is.md)) wearing a different hat: **a transformation is a column in, a
column out.** You describe what each value should become, and pandas computes the result for every row at
once. The whole skill is learning the right tool for each shape of transformation — and there's a clear
pecking order, from blazing-fast vectorized math down to the slow-but-flexible escape hatch you reach for
only when nothing else fits.

We'll keep working the running sales dataset (`date`, `product`, `region`, `units`, `price`), with the
`revenue` column we built in Phase 1:

```python
import pandas as pd
import numpy as np

sales = pd.DataFrame({
    "date":    ["2024-01-05", "2024-01-05", "2024-01-06", "2024-01-06", "2024-01-07"],
    "product": ["Widget", "Gadget", "Widget", "Gadget", "Widget"],
    "region":  ["North", "South", "North", "West", "South"],
    "units":   [10, 4, 7, 12, 5],
    "price":   [9.99, 19.99, 9.99, 19.99, 9.99],
})
sales["revenue"] = sales["units"] * sales["price"]
```

## Creating columns the vectorized way

📝 **Deriving a column** means computing a brand-new column from existing ones in a single column
operation — no loop, no row-by-row work. You write the expression as if the columns were single values, and
pandas applies it to every row in one fast sweep.

You already met the headline example. It's worth seeing again, because every other tool in this phase is a
variation on it:

```python
sales["revenue"] = sales["units"] * sales["price"]
print(sales[["product", "units", "price", "revenue"]])
```
```console
  product  units  price  revenue
0  Widget     10   9.99    99.90
1  Gadget      4  19.99    79.96
2  Widget      7   9.99    69.93
3  Gadget     12  19.99   239.88
4  Widget      5   9.99    49.95
```

*What just happened:* `sales["units"] * sales["price"]` multiplied the two columns element by element — row
0's units times row 0's price, and so on down — producing a new Series, which we assigned to a new column
named `revenue`. This is **vectorization**: one expression, every row computed at C speed under the hood. It
isn't only multiplication — `+`, `-`, `/`, `**`, comparisons (`>`, `==`), and string methods like
`sales["product"].str.upper()` all work the same column-at-a-time way. When the transformation is plain
arithmetic or a built-in operation, this is the tool. Reach for nothing fancier.

## Vectorized conditionals: np.where and pd.cut

Plenty of derived columns aren't arithmetic — they're a *decision*. "Is this a high-value order?" "Is this
order small, medium, or large?" You could imagine writing an `if`/`else` per row, but that's a loop in
disguise. There are vectorized tools built exactly for this.

For a **two-way choice** — pick value A where a condition is true, value B where it's false — use
`np.where(condition, a, b)`:

```python
sales["high_value"] = np.where(sales["revenue"] > 100, "high", "normal")
print(sales[["product", "revenue", "high_value"]])
```
```console
  product  revenue high_value
0  Widget    99.90     normal
1  Gadget    79.96     normal
2  Widget    69.93     normal
3  Gadget   239.88       high
4  Widget    49.95     normal
```

*What just happened:* `sales["revenue"] > 100` produced a column of `True`/`False` — a boolean mask, the
same kind you filter with. `np.where` walked that mask and chose `"high"` wherever it was `True` and
`"normal"` wherever it was `False`, all in one vectorized call. (If you only need the boolean itself,
`sales["high_value"] = sales["revenue"] > 100` is even simpler — a bare comparison *is* a vectorized
conditional.) `np.where` is what you want the moment the answer depends on two outcomes.

When the decision is "**which bucket does this number fall into**" — splitting a continuous value into named
ranges — `pd.cut` is the purpose-built tool:

```python
sales["order_size"] = pd.cut(
    sales["units"],
    bins=[0, 5, 10, np.inf],
    labels=["small", "medium", "large"],
)
print(sales[["product", "units", "order_size"]])
```
```console
  product  units order_size
0  Widget     10     medium
1  Gadget      4      small
2  Widget      7     medium
3  Gadget     12      large
4  Widget      5      small
```

*What just happened:* `pd.cut` chopped the `units` column into the ranges set by `bins` and gave each range
a label. The bins read as intervals: `(0, 5]` → `small`, `(5, 10]` → `medium`, `(10, ∞]` → `large` (by
default the right edge is included, the left excluded — that's why `5` units lands in `small`). One call
turned a numeric column into a tidy categorical one. ⚠️ Watch the edges: a value of exactly `0`, or one
below your lowest bin, falls *outside* every interval and comes back as `NaN`. Set your bins to cover the
full range you expect, and sanity-check with `value_counts()` afterward.

## map and replace: translating values

A different flavor of transformation is **substitution** — swap each value for another according to a
lookup. The classic case is expanding codes into readable names. `Series.map` does this with a dict:

```python
region_names = {"North": "Northern", "South": "Southern", "West": "Western"}
sales["region_full"] = sales["region"].map(region_names)
print(sales[["region", "region_full"]])
```
```console
  region region_full
0  North    Northern
1  South    Southern
2  North    Northern
3   West     Western
4  South    Southern
```

*What just happened:* `map` looked up each value of `region` in the dict and replaced it with the matching
value, building a new column in one pass. ⚠️ The catch with `map`: any value **not** in your dict becomes
`NaN`. That's a feature when you want to catch unexpected codes, but a footgun if you only meant to fix a
couple of values and accidentally wiped the rest. For that "change a few, leave the rest alone" job, use
`replace` instead:

```python
sales["region"] = sales["region"].replace({"West": "Pacific"})
print(sales[["region", "region_full"]])
```
```console
    region region_full
0    North    Northern
1    South    Southern
2    North    Northern
3  Pacific     Western
4    South    Southern
```

*What just happened:* `replace` swapped only the keys you listed (`"West"` → `"Pacific"`) and left every
other value untouched — no surprise `NaN`s. Rule of thumb: **`map` is a full translation** (every value
should be in the dict); **`replace` is a targeted edit** (a few specific swaps).

## apply: the flexible (and slower) escape hatch

Sometimes the logic doesn't fit a clean vectorized expression — it's a chain of `if`s, a string-parsing
routine, a call into another library. For those, pandas gives you an escape hatch.

📝 **`apply(func)`** runs a Python function once per element (on a Series) or once per row/column (on a
DataFrame with `axis=1`). It's the "just run my own code on each piece" tool — maximally flexible, because
the function can be *any* Python you want.

Per element on a Series:

```python
def label_order(rev):
    if rev > 200:
        return "big"
    elif rev > 80:
        return "medium"
    return "small"

sales["rev_label"] = sales["revenue"].apply(label_order)
print(sales[["revenue", "rev_label"]])
```
```console
   revenue rev_label
0    99.90    medium
1    79.96     small
2    69.93     small
3   239.88       big
4    49.95     small
```

*What just happened:* `apply(label_order)` called your function once for every value in `revenue` and
collected the returns into a new column. Per *row* works the same with `axis=1`, where the function receives
the whole row and you read columns off it:

```python
sales["summary"] = sales.apply(
    lambda row: f"{row['product']} x{row['units']}",
    axis=1,
)
print(sales[["product", "units", "summary"]])
```
```console
  product  units    summary
0  Widget     10  Widget x10
1  Gadget      4   Gadget x4
2  Widget      7   Widget x7
3  Gadget     12  Gadget x12
4  Widget      5   Widget x5
```

*What just happened:* with `axis=1`, `apply` handed your lambda each row as a little Series, and you built a
string from its fields. Readable and powerful.

💡 But here's the honest catch: **`apply` is a Python loop wearing a pandas coat.** It calls your function
once per row in plain Python, so it's far slower than a vectorized operation — often 10–100× on real data.
Use it when no vectorized tool fits. When one *does* fit, prefer it. The `rev_label` above, for instance,
has a vectorized equivalent — `pd.cut` does the exact same bucketing without the per-row Python call:

```python
sales["rev_label"] = pd.cut(
    sales["revenue"],
    bins=[0, 80, 200, np.inf],
    labels=["small", "medium", "big"],
)
```

*What just happened:* same three buckets, same result column — but computed in one vectorized sweep instead
of five Python function calls. On five rows you'd never notice; on five million you'd feel it. Before
reaching for `apply`, always ask: "is there a built-in that does this?"

## The performance lesson (the heart of this phase)

This is the part to tattoo somewhere. ⚠️ **The single biggest pandas performance mistake is iterating over
rows with a `for` loop or `iterrows()` instead of operating on whole columns.** It's the instinct everyone
brings from regular Python, and it's the slowest thing you can do — routinely *orders of magnitude* slower
than the vectorized equivalent, and longer to write besides.

Here's the same task — compute revenue — done the wrong way and the right way. First, the row loop:

```python
# The slow, un-pandas way — DON'T do this
revenue = []
for index, row in sales.iterrows():
    revenue.append(row["units"] * row["price"])
sales["revenue"] = revenue
```

*What just happened:* `iterrows()` handed you one row at a time, and you did the math row by row in pure
Python, accumulating into a list. It produces the correct numbers — and it is the wrong tool. Every
iteration pays Python's per-row overhead and rebuilds a Series object for the row. It's verbose, and it
crawls as the data grows. Now the same result, vectorized:

```python
# The pandas way — DO this
sales["revenue"] = sales["units"] * sales["price"]
```

*What just happened:* one column expression replaced the entire loop. pandas multiplied the two columns in
NumPy's compiled core, computing all rows in a single fast operation. Same answer, a fraction of the code,
and dramatically faster — the gap only widens with more rows.

Keep this **hierarchy of preference** in your head and reach down it only as far as you must:

1. **Vectorized operation** — column arithmetic, comparisons, `.str` methods. Fastest, clearest. Default here.
2. **Vectorized helpers / built-ins** — `np.where`, `pd.cut`, `map`, `replace`. Still vectorized, for conditionals and lookups.
3. **`.apply`** — when the logic genuinely doesn't vectorize. Flexible, but a Python loop underneath.
4. **An explicit `for` loop / `iterrows()`** — last resort, almost never needed for transforming data.

💡 "Think in columns" isn't a style preference or a nicety — it's about correctness *and* speed. Vectorized
code is shorter, so it has fewer places to hide bugs; it aligns on the index, so it does the right thing
across rows; and it runs in compiled code, so it scales. Whenever your fingers start typing
`for ... in df...`, stop and ask what column operation you actually mean. There almost always is one.

## Recap

1. **A transformation is a column in, a column out.** Derive new columns from existing ones in single
   column operations — the Phase 1 habit, applied everywhere.
2. **Vectorized arithmetic** (`df["a"] * df["b"]`, comparisons, `.str` methods) is the default tool: fast,
   readable, applied to every row at once.
3. **Vectorized conditionals:** `np.where(cond, a, b)` for a two-way choice; `pd.cut(col, bins, labels)` to
   bucket a numeric column into named ranges. ⚠️ Mind `pd.cut`'s edges — values outside the bins become `NaN`.
4. **Translate values** with `Series.map(dict)` for a full lookup (missing keys → `NaN`) and `replace` for
   targeted swaps that leave everything else alone.
5. **`apply`** is the flexible escape hatch — any Python function, per element or per row (`axis=1`) — but
   it's a Python loop under the hood and is much slower. Prefer a vectorized equivalent when one exists.
6. **The #1 performance mistake is looping over rows (`iterrows()` / `for`) instead of using columns.**
   Preference order: vectorized op → `np.where`/`pd.cut`/`map` → `apply` → explicit loop (last resort).

## Quick check

Lock in the pecking order — the right tool for each shape of transformation, and why looping loses:

```quiz
[
  {
    "q": "You want a new column that is \"high\" where revenue > 100 and \"normal\" otherwise. What's the idiomatic tool?",
    "choices": [
      "np.where(sales[\"revenue\"] > 100, \"high\", \"normal\")",
      "A for-loop over sales.iterrows() with an if/else",
      "sales[\"revenue\"].map({100: \"high\"})",
      "There is no way to do a two-way choice in pandas"
    ],
    "answer": 0,
    "explain": "np.where(condition, a, b) is the vectorized two-way conditional: it picks the first value where the mask is True and the second where it's False, for every row at once."
  },
  {
    "q": "Why is `df.apply(func, axis=1)` slower than a vectorized column expression?",
    "choices": [
      "apply runs your Python function once per row — it's a Python loop under the hood, not a compiled column sweep",
      "apply secretly sorts the DataFrame first",
      "apply copies the entire DataFrame to disk before running",
      "It isn't slower; apply and vectorization are identical in speed"
    ],
    "answer": 0,
    "explain": "apply calls your Python function per row/element, paying Python's per-row overhead each time. Vectorized operations run in NumPy's compiled core over the whole column, so they're often 10–100x faster."
  },
  {
    "q": "What is the #1 pandas performance mistake when transforming data?",
    "choices": [
      "Iterating over rows with a for-loop or iterrows() instead of operating on whole columns",
      "Importing pandas as pd instead of its full name",
      "Adding too many columns to a DataFrame",
      "Using np.where instead of pd.cut"
    ],
    "answer": 0,
    "explain": "Row-by-row iteration is the slowest, most un-pandas approach — often orders of magnitude slower than the vectorized equivalent. The preference order is: vectorized op > np.where/pd.cut/map > apply > explicit loop (last resort)."
  }
]
```

---

[← Phase 4: Cleaning Data](04-cleaning-data.md) · [Guide overview](_guide.md) · [Phase 6: GroupBy & Aggregation →](06-groupby-and-aggregation.md)
