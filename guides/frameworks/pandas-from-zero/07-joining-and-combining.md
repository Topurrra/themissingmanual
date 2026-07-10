---
title: "Joining & Combining"
guide: "pandas-from-zero"
phase: 7
summary: "Stitch separate tables together: merge is the SQL join in DataFrame clothing (inner/left/right/outer), the key traps that explode your row count, and concat for stacking more of the same data."
tags: [pandas, merge, join, concat, sql-joins, combining-data, inner-outer-join]
difficulty: intermediate
synonyms: ["pandas merge", "pandas join dataframes", "pandas concat", "pandas inner outer left join", "pandas merge on key", "pandas combine dataframes", "pandas merge vs sql join"]
updated: 2026-07-10
---

# Joining & Combining

Up to now we've worked one table — the sales DataFrame, all by itself — but real analysis is almost never
one table. Your sales rows know the `product` name and a `units` count — but *what category is that product?
Who's the supplier?* That information lives somewhere else, in a `products` table, because repeating
"Widgets are Hardware, supplied by Acme" on every single sales row would be wasteful and error-prone. So the
data gets split across tables on purpose, linked by a shared value. This phase is about putting it back
together.

📝 Here's the mental model: **combining means matching rows from one table to rows in another using a shared
key.** If you've touched SQL, you already know this move by its real name — it's a **JOIN**, and pandas'
`merge` *is* that join, just with DataFrame syntax instead of `SELECT ... JOIN ... ON`. Same picture, same
join types, same gotchas. If joins have never quite clicked, the calm walkthrough in
[SQL Joins, Finally Explained](/guides/sql-joins-explained) draws the picture in pure SQL terms; everything
there maps one-to-one onto what we're about to do.

We'll keep the running sales dataset, and introduce a second `products` table to join to it:

```python
import pandas as pd

sales = pd.DataFrame({
    "date":    ["2024-01-05", "2024-01-05", "2024-01-06", "2024-01-06", "2024-01-07"],
    "product": ["Widget", "Gadget", "Widget", "Gadget", "Gizmo"],
    "region":  ["North", "South", "North", "West", "South"],
    "units":   [10, 4, 7, 12, 5],
    "price":   [9.99, 19.99, 9.99, 19.99, 14.99],
})
sales["revenue"] = sales["units"] * sales["price"]

products = pd.DataFrame({
    "product":  ["Widget", "Gadget", "Sprocket"],
    "category": ["Hardware", "Electronics", "Hardware"],
    "supplier": ["Acme", "Globex", "Acme"],
})
```

*What just happened:* we built two tables that share a `product` column — that shared column is the **key**
that lets us tie a sales row to its product details. Notice the deliberate mismatch: `sales` has a `Gizmo`
that isn't in `products`, and `products` has a `Sprocket` that never sold. Those non-matches are exactly
where join types start to matter.

## merge and the join types

The core function is `pd.merge`. You hand it two DataFrames, tell it the key with `on=`, and tell it *which
rows to keep* with `how=`. Start with the default, `how="inner"`:

```python
result = pd.merge(sales, products, on="product", how="inner")
print(result[["product", "units", "category", "supplier"]])
```
```console
  product  units     category supplier
0  Widget     10     Hardware     Acme
1  Widget      7     Hardware     Acme
2  Gadget      4  Electronics   Globex
3  Gadget     12  Electronics   Globex
```

*What just happened:* `merge` matched each sales row to the `products` row with the same `product`, and
glued the `category` and `supplier` columns on. The `how="inner"` means **keep only rows that matched on
both sides** — so the `Gizmo` sale (no product entry) and the `Sprocket` product (no sale) both vanished.
Inner join = the intersection.

Often you don't want rows to disappear — you want every sales row preserved, matched detail where it exists
and blanks where it doesn't. That's a **left** join (`how="left"`): keep all of the left table:

```python
result = pd.merge(sales, products, on="product", how="left")
print(result[["product", "units", "category", "supplier"]])
```
```console
  product  units     category supplier
0  Widget     10     Hardware     Acme
1  Gadget      4  Electronics   Globex
2  Widget      7     Hardware     Acme
3  Gadget     12  Electronics   Globex
4   Gizmo      5          NaN      NaN
```

*What just happened:* every original sales row survived — including the `Gizmo` sale. But `Gizmo` has no
entry in `products`, so pandas had nothing to fill `category` and `supplier` with and put `NaN` there.
⚠️ This is the thing to internalize about left/right/outer joins: **non-matches don't drop the row, they
fill the borrowed columns with `NaN`.** A sudden crop of `NaN`s after a merge usually means keys that didn't
line up, not missing source data.

The `how=` options, in one breath:

- **`inner`** — only rows that match on both sides (the default). The intersection.
- **`left`** — every row from the left table; `NaN` in the right's columns where there's no match.
- **`right`** — mirror image: every row from the right table; `NaN` on the left where there's no match.
- **`outer`** — every row from *both* tables; `NaN` wherever either side had no match. The union.

An outer join shows both lonely rows at once:

```python
result = pd.merge(sales, products, on="product", how="outer")
print(result[["product", "units", "category"]])
```
```console
    product  units     category
0    Gadget    4.0  Electronics
1    Gadget   12.0  Electronics
2     Gizmo    5.0          NaN
3  Sprocket    NaN     Hardware
4    Widget    7.0     Hardware
5    Widget   10.0     Hardware
```

*What just happened:* the outer join kept everything — the `Gizmo` sale with no product (`category` is
`NaN`) *and* the `Sprocket` product with no sale (`units` is `NaN`). Notice `units` turned into floats
(`4.0`): pandas widens an integer column to float so it can hold `NaN`, since plain ints can't represent
missing. 💡 Pick the join type by asking "which rows must survive even if they don't match?" — none (inner),
the left ones (left), or all of them (outer).

## Choosing the join keys

`on="product"` works when both tables name the key column identically. They often don't. Say `sales` calls
it `product` but `products` calls it `item` — use `left_on` and `right_on` to name each side:

```python
products_alt = products.rename(columns={"product": "item"})
result = pd.merge(sales, products_alt, left_on="product", right_on="item", how="inner")
print(result[["product", "item", "category"]].head(2))
```
```console
  product    item     category
0  Widget  Widget     Hardware
1  Widget  Widget     Hardware
```

*What just happened:* `left_on="product"` and `right_on="item"` told merge that those two differently-named
columns hold the same key. The match worked exactly as before; you just get *both* key columns in the result
(drop one with `.drop(columns="item")` if it bothers you). If your key sits in the **index** rather than a
column, use `left_index=True` / `right_index=True` the same way.

Now the trap that bites everyone at least once. ⚠️ **A merge multiplies rows when the key isn't unique on the
side you're joining to.** If `products` accidentally listed `Widget` twice, every `Widget` sale would match
*both* rows and your result would silently double:

```python
products_dupe = pd.concat([products, products.iloc[[0]]])  # Widget appears twice
print(len(sales), "sales rows ->",
      len(pd.merge(sales, products_dupe, on="product", how="inner")), "after merge")
```
```console
5 sales rows -> 6 after merge
```

*What just happened:* the duplicate `Widget` in the lookup table turned a 5-row merge into a 6-row one — each
of the two `Widget` sales matched two product rows... but here only one extra appeared because of how the
counts fell, and on bigger data this kind of many-to-many blow-up can multiply your rows into the millions.
The defense is to declare what you expect with `validate=`:

```python
pd.merge(sales, products_dupe, on="product", how="inner", validate="many_to_one")
```
```console
MergeError: Merge keys are not unique in right dataset; not a one-to-many merge
```

*What just happened:* `validate="many_to_one"` asserts "many sales rows, but each product key appears once in
the lookup." Because the key *wasn't* unique on the right, pandas refused the merge and told you why — far
better than a silently inflated result you discover three steps later. Reach for `validate=` whenever you're
joining a fact table to what's supposed to be a one-row-per-key lookup.

## concat: stacking, not matching

`merge` relates tables side by side on a key. The other combining move is just **stacking** — gluing rows
on top of each other, or columns next to each other, with no key matching at all.

📝 **`pd.concat([df1, df2])` stacks tables.** By default it stacks rows (one DataFrame's rows after the
other's) — perfect for "I have January sales in one DataFrame and February in another, give me one table":

```python
jan = sales.iloc[:2]
feb = sales.iloc[2:]
combined = pd.concat([jan, feb])
print(len(jan), "+", len(feb), "->", len(combined), "rows")
```
```console
2 + 3 -> 5 rows
```

*What just happened:* `concat` lined the two frames up and stacked February's rows below January's into one
5-row table. The two frames have the **same columns**, which is what makes stacking sensible — concat aligns
by column name and fills `NaN` for any column one frame lacks. Pass `axis=1` instead and concat glues columns
side by side (aligning on the index) rather than stacking rows.

So when do you reach for which? **merge when the tables *relate by a key*** (sales ↔ products: different
shapes, joined on a shared value). **concat when the tables are *more of the same thing*** (Jan + Feb sales:
same columns, appended). That distinction — relate by key vs. stack more of the same — covers the vast
majority of data assembly you'll ever do.

## Suffixes and verifying the join

One last practicality. When both tables have a non-key column with the **same name**, merge can't keep two
columns named the same, so it disambiguates with `_x` (left) and `_y` (right) suffixes:

```python
# both tables happen to have a "region" column
prod_region = pd.DataFrame({"product": ["Widget", "Gadget"], "region": ["Imported", "Domestic"]})
result = pd.merge(sales, prod_region, on="product", how="inner")
print(result[["product", "region_x", "region_y"]].head(2))
```
```console
  product region_x  region_y
0  Widget    North  Imported
1  Widget    North  Imported
```

*What just happened:* both frames carried a `region` column, so merge kept the sales one as `region_x` and
the product one as `region_y`. Cryptic. Set readable names yourself with `suffixes=`:
`pd.merge(sales, prod_region, on="product", suffixes=("_sale", "_origin"))` gives you `region_sale` and
`region_origin`.

⚠️ And the habit that saves you the most grief: **check the row count before and after every merge.** A
left/inner merge should never *increase* your left table's row count — if it does, your key isn't unique and
rows multiplied. A merge that was meant to enrich your data but changed how many rows you have is a bug, not
a result:

```python
before = len(sales)
result = pd.merge(sales, products, on="product", how="left")
print("before:", before, " after:", len(result))
```
```console
before: 5  after: 5
```

*What just happened:* a left join with a clean one-row-per-product lookup left the row count untouched at 5 —
exactly what you want. The two-second `len()` check is the cheapest bug-catcher in pandas; make it reflex.
💡 The whole phase boils down to two verbs: **merge** to look up related data by key, **concat** to stack
more of the same — and almost every "combine these datasets" task is one or the other.

## Recap

1. **Combining = matching rows across tables on a shared key.** `pd.merge` is exactly the SQL JOIN
   ([SQL Joins, Finally Explained](/guides/sql-joins-explained)) in DataFrame form.
2. **`how=` picks which rows survive:** `inner` (matches only), `left` (all left rows), `right` (all right),
   `outer` (all rows from both). ⚠️ Non-matches don't drop the row in left/right/outer — they fill the
   borrowed columns with `NaN`.
3. **Keys:** `on=` for an identically-named column, `left_on`/`right_on` for differently-named ones,
   `left_index`/`right_index` to join on the index.
4. **The multiplication trap:** if the key isn't unique on the side you join to, rows multiply (a
   many-to-many join can explode the row count). Guard with `validate=`.
5. **`concat` stacks** rather than matches — rows by default, columns with `axis=1`. Use it for "more of the
   same" (Jan + Feb sales); use merge for "relate by key."
6. **Verify:** overlapping column names get `_x`/`_y` (override with `suffixes=`), and always check the row
   count before/after a merge — an unexpected change is a bug.

## Quick check

Make sure the join types and the row-count instinct stuck:

```quiz
[
  {
    "q": "You merge sales (5 rows) with a products lookup using how=\"left\", and a few sales have a product not in the lookup. What happens to those rows?",
    "choices": [
      "They're kept, with NaN filled into the columns borrowed from products",
      "They're dropped, because there's no match",
      "The whole merge raises an error",
      "They're duplicated until a match is found"
    ],
    "answer": 0,
    "explain": "A left join keeps every left (sales) row. Where there's no matching product, pandas has nothing to fill the borrowed columns with, so it puts NaN there — the row stays."
  },
  {
    "q": "Your products lookup accidentally lists \"Widget\" on two rows. You inner-merge sales onto it. What's the danger?",
    "choices": [
      "Each Widget sale matches both Widget rows, multiplying your row count",
      "The merge silently drops all Widget rows",
      "pandas automatically deduplicates the lookup for you",
      "Nothing — duplicate keys are always fine"
    ],
    "answer": 0,
    "explain": "A non-unique key on the side you join to multiplies rows: every sale matches every duplicate. Declaring validate=\"many_to_one\" makes pandas refuse the merge instead of silently inflating it."
  },
  {
    "q": "You have January sales and February sales in two DataFrames with identical columns, and want one combined table. Which tool fits?",
    "choices": [
      "pd.concat([jan, feb]) — stacking more of the same",
      "pd.merge(jan, feb, on=\"date\") — relate by key",
      "Neither; you must loop and append row by row",
      "pd.merge with how=\"outer\" on every column"
    ],
    "answer": 0,
    "explain": "Same shape, same columns, just more rows of the same thing — that's concat (stacking). merge is for relating different tables by a shared key, which isn't what's happening here."
  }
]
```

---

[← Phase 6: GroupBy & Aggregation](06-groupby-and-aggregation.md) · [Guide overview](_guide.md) · [Phase 8: Time Series & Dates →](08-time-series.md)