---
title: "Selecting & Filtering"
guide: "pandas-from-zero"
phase: 3
summary: "Pull out the columns and rows you actually want: single vs double brackets, loc vs iloc, boolean masks, combining conditions safely, and query()."
tags: [pandas, loc, iloc, boolean-indexing, filtering, selection, query]
difficulty: beginner
synonyms: ["pandas select columns", "pandas loc iloc", "pandas boolean filtering", "pandas filter rows condition", "pandas query method", "pandas mask", "pandas select rows by condition"]
updated: 2026-07-10
---

# Selecting & Filtering

Loading a file gives you the whole table. Real work almost never wants the whole table — it wants *these columns* and *the rows where something is true*, and this phase is about carving out exactly that slice.

Here is the mental model to carry through everything below. Picture your sales DataFrame as a spreadsheet:

| | date | product | region | units | price |
|---|---|---|---|---|---|
| **0** | 2026-01-03 | Widget | West | 120 | 9.99 |
| **1** | 2026-01-03 | Gadget | East | 45 | 19.99 |
| **2** | 2026-01-04 | Widget | North | 80 | 9.99 |
| **3** | 2026-01-04 | Gizmo | West | 200 | 4.50 |
| **4** | 2026-01-05 | Gadget | West | 60 | 19.99 |

Two questions answer almost everything you'll ever do:

1. **Which columns?** Grab them by name.
2. **Which rows?** Build a *mask* — a column of True/False — and keep the True ones.

Selecting columns is the easy half. The row half — boolean masks — is the real engine of pandas, and the thing worth getting fluent in. Let's take them in order.

## Selecting columns

To pull one column, index the DataFrame with its name:

```python
df["price"]
```

```console
0     9.99
1    19.99
2     9.99
3     4.50
4    19.99
Name: price, dtype: float64
```

*What just happened:* `df["price"]` handed back a single column — and a single column is a **Series**, the 1-D pandas object from phase 1. Notice the output: it has the index on the left, the values on the right, and a `Name`/`dtype` footer. That's a Series, not a table.

To pull several columns, pass a **list** of names:

```python
df[["product", "price"]]
```

```console
  product  price
0  Widget   9.99
1  Gadget  19.99
2  Widget   9.99
3   Gizmo   4.50
4  Gadget  19.99
```

*What just happened:* the inner `[...]` is a Python list of column names, and asking for a list of columns gives you back a **DataFrame** — a 2-D table, with column headers across the top.

> ⚠️ This is the single most common beginner trip-up: **single brackets vs double brackets.** `df["price"]` (one name) is a Series; `df[["price"]]` (a list with one name) is a one-column DataFrame. Same data, different *type* — and the type changes what methods work and what your downstream code expects. When something later complains that a Series has no such method, or a DataFrame showed up where you wanted a column, check your brackets first.

## `loc` vs `iloc`

Selecting whole columns is fine, but often you want a specific *cell* or a rectangular block — particular rows *and* particular columns. pandas gives you two indexers for that, and the difference between them is the thing everyone has to internalize once and never forgets again.

> 📝 **`loc` selects by LABEL** — the actual index values and column *names*. **`iloc` selects by POSITION** — integer offsets, counting from 0, exactly like list slicing. Label vs position. That's the whole distinction.

Here's `loc`, working by name:

```python
df.loc[0, "price"]          # row labelled 0, column named "price"
```

```console
9.99
```

```python
df.loc[:, ["product", "units"]]   # all rows, just these two columns
```

```console
  product  units
0  Widget    120
1  Gadget     45
2  Widget     80
3   Gizmo    200
4  Gadget     60
```

*What just happened:* `loc` reads the labels you give it. `0` is the row's index label, `"price"` is the column's name. The `:` means "every row," and the list picks columns by name. Because our index happens to be 0,1,2,… the row label `0` looks like a position — but it isn't. If the index were dates or product codes, you'd pass *those* to `loc`.

Now `iloc`, working by position:

```python
df.iloc[0, 3]      # first row, fourth column (0-based) -> units
```

```console
120
```

```python
df.iloc[:5]        # first five rows, like list slicing
```

```console
        date product region  units  price
0 2026-01-03  Widget   West    120   9.99
1 2026-01-03  Gadget   East     45  19.99
2 2026-01-04  Widget  North     80   9.99
3 2026-01-04   Gizmo   West    200   4.50
4 2026-01-05  Gadget   West     60  19.99
```

*What just happened:* `iloc` ignores names entirely and counts. `[0, 3]` is "row index 0, column index 3" — and since columns go `date`(0), `product`(1), `region`(2), `units`(3), that cell is `120`. `df.iloc[:5]` slices the first five rows by position, and just like Python slices, the end is *exclusive*.

> 💡 One quirk worth knowing: `loc` slicing is *inclusive* of its endpoint (`df.loc[0:2]` gives rows 0, 1, **and** 2), because labels aren't necessarily contiguous numbers. `iloc` slicing is *exclusive* like normal Python. When a slice returns one more or one fewer row than you expected, this is usually why.

## Boolean filtering (masks) — the workhorse

Now the important half: keeping rows where a condition holds. This is where you'll spend most of your pandas life, so go slow here.

> 📝 A comparison on a column doesn't return one True/False — it returns a whole **Series of True/False**, one per row. That Series is called a **mask**. When you index the DataFrame *with* a mask, pandas keeps every row where the mask is True and drops the rest.

Look at the mask by itself first:

```python
df["units"] > 100
```

```console
0     True
1    False
2    False
3     True
4    False
Name: units, dtype: bool
```

*What just happened:* `df["units"] > 100` compared every value in the `units` column against 100 *at once* (vectorized — no loop) and gave back a boolean Series. Rows 0 and 3 cleared the bar; the rest didn't. This Series *is* the mask.

Now hand that mask back to the DataFrame:

```python
df[df["units"] > 100]
```

```console
        date product region  units  price
0 2026-01-03  Widget   West    120   9.99
3 2026-01-04   Gizmo   West    200   4.50
```

*What just happened:* `df[ mask ]` kept only the rows where the mask was True — the two high-volume sales. The original index labels (0 and 3) come along for the ride, which is your proof these are the same rows from the source table, not renumbered copies.

That two-step — *build a mask, index with it* — is **the** way to filter rows in pandas. Everything in the next section is just building fancier masks.

## Combining conditions

Real filters usually have more than one clause: West region *and* more than 50 units. You combine masks with `&` (and), `|` (or), and `~` (not) — and there are two rules you must follow or pandas bites you.

```python
df[(df["region"] == "West") & (df["units"] > 50)]
```

```console
        date product region  units  price
0 2026-01-03  Widget   West    120   9.99
3 2026-01-04   Gizmo   West    200   4.50
4 2026-01-05  Gadget   West     60  19.99
```

*What just happened:* two masks — "region is West" and "units over 50" — combined with `&`, which does an element-by-element AND. A row survives only if it's True in *both*. Each condition is wrapped in its own parentheses, and that's not optional.

> ⚠️ **Use `&` / `|` / `~`, never Python's `and` / `or` / `not`.** The word `and` tries to collapse a whole Series into a single True/False and throws; the symbols operate element-wise, which is what you want. **And wrap every condition in parentheses.** `&` binds tighter than `>` in Python, so without parens, `df["region"] == "West" & df["units"] > 50` is parsed as `"West" & df["units"]` first — nonsense — and you get this classic error:

```console
ValueError: The truth value of a Series is ambiguous. Use a.empty, a.bool(), a.item(), a.any() or a.all().
```

*What just happened:* pandas couldn't reduce a whole boolean Series to one yes/no, which is exactly what writing `and` (or forgetting parens) asks it to do. When you see "truth value of a Series is ambiguous," it's nearly always a missing pair of parentheses or a stray `and`/`or`. Add the parens, swap to symbols.

Two more mask-builders you'll reach for constantly:

```python
df[~(df["region"] == "East")]              # ~ negates: everything NOT East
df[df["region"].isin(["West", "North"])]   # membership: region in a set
df[df["units"].between(50, 150)]           # range: 50 <= units <= 150 (inclusive)
```

*What just happened:* `~` flips a mask (keep the rows the condition is False for). `.isin([...])` builds a mask that's True wherever the value is in your list — far cleaner than chaining `==` with `|`. `.between(a, b)` is shorthand for `(col >= a) & (col <= b)`, inclusive on both ends. Each still returns a mask, so each still goes inside `df[ ... ]`.

## `query()` & the assignment gotcha

Once filters get long, all those `df["..."]` repetitions get noisy. `query()` lets you write the condition as a string, referring to columns by bare name:

```python
df.query("region == 'West' and units > 50")
```

```console
        date product region  units  price
0 2026-01-03  Widget   West    120   9.99
3 2026-01-04   Gizmo   West    200   4.50
4 2026-01-05  Gadget   West     60  19.99
```

*What just happened:* same result as the `&` version above, but easier to read. Inside the `query()` string you *do* write `and`/`or` (it's a mini-language pandas parses, not raw Python), and columns are referenced by name without `df[...]`. Use whichever style is clearer for the filter at hand; for long multi-clause filters, `query()` usually wins.

Now the gotcha that catches everyone eventually. Filtering gives you a *view or a copy* of the original — pandas itself isn't always sure which — and **writing to a filtered slice may silently fail to update the original** while warning you about it:

```python
high = df[df["units"] > 100]
high["price"] = 0.0        # triggers a warning, may not write back to df
```

```console
SettingWithCopyWarning:
A value is trying to be set on a copy of a slice from a DataFrame.
Try using .loc[row_indexer, col_indexer] = value instead
```

*What just happened:* you filtered into `high`, then tried to assign into it. pandas couldn't guarantee `high` was a real view onto `df`, so it warned that your write might land on a throwaway copy and vanish. This is the infamous `SettingWithCopyWarning`, and it means "your edit might not do what you think."

There are two clean ways out, depending on intent:

```python
df.loc[df["units"] > 100, "price"] = 0.0   # edit the ORIGINAL, in place
subset = df[df["units"] > 100].copy()      # an INDEPENDENT subset to edit freely
```

*What just happened:* if you mean to change the original table, do the masking and the assignment in **one `.loc` step** — pandas knows that targets `df` directly, no ambiguity, no warning. If you instead want a separate working table, call `.copy()` to make the break explicit; now editing `subset` can't surprise you because it's genuinely its own object.

> 💡 Step back and notice the shape of this whole phase: boolean masks are the heart of pandas. Selecting columns, `loc`/`iloc`, `query()` — all useful — but you will *build masks* constantly, every day you touch pandas. Get comfortable reading `df[(...) & (...)]` at a glance and most of the rest follows. Next phase puts these to work on data that's actually messy.

## Recap

- **One column is a Series, a list of columns is a DataFrame.** `df["price"]` (single brackets) → Series; `df[["product", "price"]]` (double brackets) → DataFrame. Wrong type downstream usually traces back to your brackets.
- **`loc` is by label, `iloc` is by position.** `df.loc[0, "price"]` uses index/column *names*; `df.iloc[0, 3]` counts from 0. `loc` slices are inclusive of the endpoint; `iloc` slices are exclusive.
- **A comparison builds a mask** — a boolean Series — and `df[mask]` keeps the True rows. This two-step (build a mask, index with it) is the core way to filter.
- **Combine conditions with `&` `|` `~`, not `and` `or` `not`, and parenthesize each clause.** Forgetting either gives "The truth value of a Series is ambiguous." `.isin([...])` and `.between(a, b)` build common masks cleanly.
- **`query("...")` reads cleaner for complex filters** and lets you use bare column names and `and`/`or` inside the string.
- **Editing a filtered slice triggers `SettingWithCopyWarning`** and may not write back. Use `df.loc[mask, "col"] = value` to edit the original, or `.copy()` to take an independent subset.

## Quick check

```quiz
[
  {
    "q": "What type does df[[\"product\", \"price\"]] return?",
    "choices": ["A Series", "A DataFrame", "A Python list"],
    "answer": 1,
    "explain": "Passing a list of column names returns a DataFrame. A single name in single brackets, df[\"price\"], would return a Series."
  },
  {
    "q": "Which selects the cell at the first row and fourth column by position?",
    "choices": ["df.loc[0, 3]", "df.iloc[0, 3]", "df[0][3]"],
    "answer": 1,
    "explain": "iloc selects by integer position (0-based). loc selects by label, so df.loc[0, 3] would look for a column literally named 3."
  },
  {
    "q": "Why does df[df[\"region\"] == \"West\" & df[\"units\"] > 50] raise 'truth value of a Series is ambiguous'?",
    "choices": ["You must use 'and' instead of '&'", "Each condition needs its own parentheses because & binds tighter than the comparisons", "isin() is required for multiple conditions"],
    "answer": 1,
    "explain": "& has higher precedence than == and >, so without parentheses pandas tries to combine the wrong pieces. Wrap each condition: (df[\"region\"] == \"West\") & (df[\"units\"] > 50)."
  }
]
```

---

[← Phase 2: Loading & Inspecting Data](02-loading-and-inspecting-data.md) · [Guide overview](_guide.md) · [Phase 4: Cleaning Data →](04-cleaning-data.md)
