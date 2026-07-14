---
title: "Cleaning Data"
guide: "pandas-from-zero"
phase: 4
summary: "Real data is messy. Find and handle missing values with isna/dropna/fillna, fix wrong types with astype and to_numeric/to_datetime, kill duplicates, rename columns, and scrub strings with the .str accessor."
tags: [pandas, data-cleaning, missing-values, nan, dropna, fillna, dtypes, duplicates]
difficulty: intermediate
synonyms: ["pandas clean data", "pandas missing values nan", "pandas dropna fillna", "pandas astype convert types", "pandas drop duplicates", "pandas rename columns", "pandas string methods str"]
updated: 2026-07-10
---

# Cleaning Data

Here's the part nobody warns you about when you start: the analysis is the easy bit; the data is the hard
bit. Real sales exports come with blank cells where someone forgot to enter a price, a `units` column that
loaded as text because one row had "N/A" in it, the same order pasted in twice, and a `region` field where
the same place shows up as `"North"`, `"north"`, and `"North "` with a trailing space. None of that is
exotic - it's Tuesday. Cleaning this up is most of the job, and the people who are good at data are mostly
people who are patient and systematic about cleaning.

The mental model to hold the whole way through: **cleaning is a loop, not a step.** You inspect the data
(the `head`/`info`/`describe` habit from Phase 2), you spot a problem, you fix that one thing, and then you
inspect *again* to confirm the fix worked and didn't create a new mess. Dirty data doesn't announce itself
with an error - it sits there quietly and corrupts every total, average, and chart you build on top of it.
This is the same fear that drives whole data teams: a pipeline can run green and still produce wrong
numbers ([Data Quality & Observability](/guides/data-quality-and-observability) is the grown-up version of
this chapter). You're learning the hand-tool version: how to find the dirt and decide, column by column,
what to do about it.

We'll work a messier cousin of our running sales dataset - the same five columns, but with the kinds of
problems a real CSV hands you:

```python
import pandas as pd
import numpy as np

sales = pd.DataFrame({
    "date":    ["2024-01-05", "2024-01-05", "2024-01-06", "2024-01-06", "2024-01-06", "2024-01-07"],
    "product": ["Widget", "Gadget", "Widget", "Gadget", "Gadget", "Widget"],
    "region":  ["North", "south", "North ", "WEST", "WEST", None],
    "units":   ["10", "4", "7", "12", "12", "5"],
    "price":   ["9.99", "19.99", None, "19.99", "19.99", "9.99"],
})
print(sales)
```
```console
         date product  region units  price
0  2024-01-05  Widget   North    10   9.99
1  2024-01-05  Gadget   south     4  19.99
2  2024-01-06  Widget  North      7   None
3  2024-01-06  Gadget    WEST    12  19.99
4  2024-01-06  Gadget    WEST    12  19.99
5  2024-01-07  Widget    None     5   9.99
```

*What just happened:* We built a DataFrame that looks fine at a glance but is quietly broken in four ways.
Look closely: `region` has casing chaos (`"south"`, `"North "`, `"WEST"`) and a `None` in row 5; `price`
has a `None` in row 2; `units` and `price` are full of *quoted* numbers - they're strings, not numbers (a
CSV often loads them this way when even one cell is non-numeric); and rows 3 and 4 are byte-for-byte
identical (a duplicate). One DataFrame, every common kind of dirt. Let's clean it.

## Missing values: finding the holes

📝 **NaN** - pandas marks a missing value as `NaN` ("Not a Number"), a special float that means "there's
nothing here." When you load a CSV, blank cells, `None`, and `NA` all become `NaN`. It is *not* the same as
`0` or an empty string `""` - it specifically means **absent**, and pandas treats it specially (most math
skips it rather than crashing).

You can't fix holes you can't see. The first move is always to count them. `isna()` returns a same-shaped
DataFrame of `True`/`False` (`True` = missing), and chaining `.sum()` counts the `True`s per column:

```python
print(sales.isna().sum())
```
```console
date       0
product    0
region     1
price      1
units      0
dtype: int64
```

*What just happened:* `sales.isna()` turned every cell into "is this missing?" and `.sum()` added up the
`True`s column by column (`True` counts as 1). The verdict: `region` has 1 missing value, `price` has 1,
everything else is clean. ⚠️ Notice `units` shows `0` missing even though it's a mess - that's because its
problem is *type*, not absence. Every value is present; they're just strings. `isna().sum()` is the single
most useful first command on any new dataset - run it before you do anything else, so you know exactly
where the holes are.

## Handling missing: drop vs fill

Once you've found the holes, you have two straightforward choices, and they pull in opposite directions.

⚠️ **The judgment call.** Dropping rows **loses real data**. Filling them **invents data that wasn't there.**
There is no free option - every missing value forces you to pick which kind of wrong you can live with, and
the right answer changes column by column. Don't reach for one reflexively; decide on purpose.

**Option A - drop.** `dropna()` removes any row that has a missing value in *any* column:

```python
print(sales.dropna())
```
```console
         date product  region units  price
0  2024-01-05  Widget   North    10   9.99
1  2024-01-05  Gadget   south     4  19.99
3  2024-01-06  Gadget    WEST    12  19.99
4  2024-01-06  Gadget    WEST    12  19.99
```

*What just happened:* `dropna()` threw out rows 2 and 5 - the ones with a missing `price` and a missing
`region` - and handed back the survivors. Notice the index now reads `0, 1, 3, 4`: the dropped labels are
gone, leaving gaps (exactly the "index is a label, not a row number" point from Phase 1). You can narrow it
with `subset=` to only drop on specific columns (`sales.dropna(subset=["price"])` drops only rows missing a
price) or `axis=1` to drop whole *columns* that have holes. Like everything else, `dropna()` returns a new
DataFrame - your original is untouched unless you reassign it.

**Option B - fill.** `fillna()` plugs the holes with a value of your choosing:

```python
filled = sales.copy()
filled["region"] = filled["region"].fillna("Unknown")
print(filled["region"])
```
```console
0     North
1     south
2    North 
3      WEST
4      WEST
5    Unknown
```

*What just happened:* `fillna("Unknown")` replaced the `None` in row 5 with the string `"Unknown"`. For a
categorical column like `region`, a constant placeholder is clear - it says "we don't know" out loud
instead of silently dropping a sale. For a *numeric* column you'd often fill with a computed value, like the
column's own mean, or carry the previous value forward with `method="ffill"` (forward-fill):

```python
print(filled["price"].fillna(method="ffill"))
```
```console
0     9.99
1    19.99
2    19.99
3    19.99
4    19.99
5     9.99
```

*What just happened:* `ffill` walked down the column and copied the last seen value into each hole - row 2's
missing price became `19.99`, the value from row 1. (That only makes sense for `price` here because it's
still a string column; we fix that next, and you'd normally fill numbers *after* converting.) 💡 Forward-fill
is great for ordered data like time series where "same as the last reading" is a reasonable guess, and
dangerous for unordered data where it just smears arbitrary neighbors around. Choose the fill that matches
what the column *means*.

## Fixing types: numbers that are secretly strings

Look back at `units` and `price`: they hold things like `"10"` and `"9.99"` - quoted, because they're text.

⚠️ **Why this matters.** A number stored as `object` (pandas-speak for "string/mixed") breaks everything you'd
want to do with it. Sorting goes alphabetical (`"10"` sorts *before* `"4"`). Math either errors or, worse,
silently concatenates (`"10" + "4"` becomes `"104"`, not `14`). Sums are nonsense. **Fix types early**, right
after you've handled missing values, before any calculation touches the column. `df.info()` (from Phase 2)
or `df.dtypes` shows you the current types so you know what needs fixing.

The blunt tool is `astype()`, which converts a column to a type you name:

```python
clean = sales.dropna().copy()
clean["units"] = clean["units"].astype(int)
print(clean["units"])
```
```console
0    10
1     4
3    12
4    12
Name: units, dtype: int64
```

*What just happened:* `astype(int)` converted the `units` column from strings to real 64-bit integers - note
the `dtype: int64` at the bottom, where it used to be `object`. Now `units` will sort numerically and do
arithmetic correctly. ⚠️ But `astype(int)` is brittle: it throws an error the instant it hits a value it
can't convert (a stray `"N/A"`, a blank), and it can't run on a column that still has `NaN` in it. That's
why we dropped missing rows first.

For real-world data you usually want the *robust* converters, which handle the junk gracefully:

```python
clean["price"] = pd.to_numeric(clean["price"], errors="coerce")
clean["date"]  = pd.to_datetime(clean["date"])
print(clean.dtypes)
```
```console
date       datetime64[ns]
product            object
region             object
units               int64
price             float64
dtype: object
```

*What just happened:* `pd.to_numeric(..., errors="coerce")` turned `price` into real floats, and the
`errors="coerce"` part is the magic word: instead of crashing on anything unconvertible, it quietly turns
that value into `NaN` - so one bad cell doesn't blow up your whole conversion (you'd then handle those new
`NaN`s with `fillna`/`dropna`). `pd.to_datetime` parsed the `date` strings into a proper `datetime64` type,
which unlocks all the date math you'll meet in Phase 8 (sorting by date, filtering by month, resampling).
Strings in, real typed columns out.

## Duplicates and renaming

Remember rows 3 and 4 were identical. Duplicated rows double-count revenue, inflate totals, and skew every
average - and they sneak in constantly (a re-run export, a double-paste, a bad join). `duplicated()` flags
them; `drop_duplicates()` removes them:

```python
print("dupes flagged:")
print(sales.duplicated())
deduped = sales.drop_duplicates()
print(deduped)
```
```console
dupes flagged:
0    False
1    False
2    False
3    False
4     True
5    False
dtype: bool

         date product  region units  price
0  2024-01-05  Widget   North    10   9.99
1  2024-01-05  Gadget   south     4  19.99
2  2024-01-06  Widget  North      7   None
3  2024-01-06  Gadget    WEST    12  19.99
5  2024-01-07  Widget    None     5   9.99
```

*What just happened:* `duplicated()` walked the rows and marked the *second* occurrence of an identical row
as `True` - row 4 is the repeat of row 3, so it's the one flagged (the first copy is kept by default).
`drop_duplicates()` then dropped it, leaving four unique rows plus the still-clean ones. You can dedupe on a
*subset* of columns when "same" means same key rather than same everything: `drop_duplicates(subset=["date",
"product"])` keeps one row per date-product pair regardless of the other columns. Think about what "the same
record" actually means for your data before you dedupe.

While we're tidying structure, column names often need standardizing too - inconsistent casing, spaces,
names you'd rather not type. `rename` fixes specific ones via a `{old: new}` mapping:

```python
renamed = deduped.rename(columns={"units": "quantity", "price": "unit_price"})
print(renamed.columns.tolist())
```
```console
['date', 'product', 'region', 'quantity', 'unit_price']
```

*What just happened:* `rename(columns={...})` swapped `units`→`quantity` and `price`→`unit_price`, leaving
the untouched columns alone. For a bulk cleanup you'd often run a transform over *all* names at once - e.g.
`df.columns = df.columns.str.lower().str.replace(" ", "_")` to force every header to lowercase
snake_case - so your code never has to guess whether it's `Region`, `region`, or `REGION`.

## String cleaning with `.str`

That brings us to the messiest column: `region`, with `"North "`, `"south"`, and `"WEST"` all meaning the
same handful of places. To a computer, `"North"` and `"North "` are *different values* - they'll group
separately, count separately, and split your totals in ways that are maddening to debug.

📝 **The `.str` accessor** - pandas gives every text column a `.str` attribute that vectorizes Python's
string methods over the whole column at once. `series.str.lower()` lowercases every value; `series.str.strip()`
trims whitespace from every value - no loop, same column-first thinking as everywhere else in pandas.

Let's standardize `region` in one chain:

```python
clean = sales.drop_duplicates().copy()
clean["region"] = clean["region"].str.strip().str.lower()
print(clean["region"])
```
```console
0    north
1    south
2    north
3     west
5     None
```

*What just happened:* `.str.strip()` knocked the trailing space off `"North "`, then `.str.lower()`
folded `"North"` and `"WEST"` down to `"north"` and `"west"` - so the two spellings of North now collapse to
one value that will group and count together. Notice the `None` in row 5 stayed `None`: `.str` methods skip
missing values rather than crashing on them, which is exactly what you want (handle the `NaN` separately with
`fillna`). The wider `.str` toolkit is deep: `.str.replace("old", "new")` swaps substrings,
`.str.contains("dget")` returns a boolean mask you can filter with (great for "rows where product name
contains X"), `.str.split`, `.str.startswith`, and more - the whole string library, applied column-wide.

💡 **Cleaning is iterative - don't skip the re-inspect.** The straightforward workflow is: inspect (Phase 2) → fix
nulls → fix types → drop dupes → scrub strings → **inspect again**. After every fix, re-run `isna().sum()`,
`dtypes`, and `head()` to confirm the fix landed and didn't introduce a new problem (a coerced column full
of fresh `NaN`s, a rename that broke later code). Skipping this is how dirty data survives into your final
chart and quietly makes every number wrong. Patient inspection is the whole skill.

## Recap

1. **Missing values** show up as `NaN` (absent, not zero). Find them first with `df.isna().sum()` to count
   nulls per column - your standard first command on any new dataset.
2. **Handle missing deliberately:** `dropna()` loses real rows; `fillna(value)` invents data (a constant,
   the mean, or `method="ffill"`). ⚠️ Every choice is a tradeoff - decide per column based on what it means.
3. **Fix types early.** Numbers/dates loaded as `object` (string) break sorting and math. Convert with
   `astype()`, or robustly with `pd.to_numeric(..., errors="coerce")` and `pd.to_datetime(...)`, which turn
   junk into `NaN` instead of crashing.
4. **Duplicates** double-count: `duplicated()` flags them, `drop_duplicates()` (optionally `subset=`) removes
   them. **Rename/standardize** columns with `rename(columns={...})` or a bulk `df.columns.str...` transform.
5. **The `.str` accessor** vectorizes string methods over a column: `.str.strip()`, `.str.lower()`,
   `.str.replace()`, `.str.contains()` - perfect for collapsing inconsistent text like `"North "`/`"WEST"`.
6. **Cleaning is a loop:** inspect → fix nulls/types/dupes/strings → re-inspect. Dirty data fails silently,
   so confirm every fix before you build on it.

## Quick check

Lock in the three decisions every cleaning pass forces - how to find holes, how missing-value handling
trades off, and why types come first:

```quiz
[
  {
    "q": "What does `df.isna().sum()` tell you?",
    "choices": [
      "The number of missing values in each column",
      "The total of all numeric values in the DataFrame",
      "How many duplicate rows exist",
      "The data type of every column"
    ],
    "answer": 0,
    "explain": "isna() marks every cell True/False for missing, and .sum() counts the Trues per column - giving you a per-column tally of holes, the ideal first command on a new dataset."
  },
  {
    "q": "What is the core tradeoff between `dropna()` and `fillna()`?",
    "choices": [
      "dropna() loses real data, while fillna() invents data that wasn't there",
      "dropna() is faster but fillna() uses less memory",
      "There is no difference - they produce identical results",
      "fillna() only works on text and dropna() only works on numbers"
    ],
    "answer": 0,
    "explain": "Dropping rows throws away real records; filling them substitutes values that were never measured. Neither is free, so you choose per column based on what the data means."
  },
  {
    "q": "Why convert a `price` column from strings to floats before doing math on it?",
    "choices": [
      "As strings, sorting goes alphabetical and '+' concatenates instead of adding, so totals are wrong",
      "Strings take up more disk space than floats always",
      "pandas refuses to display string columns",
      "Floats are the only type that can be missing"
    ],
    "answer": 0,
    "explain": "A numeric column stored as object sorts alphabetically and makes '+' glue strings together rather than add - so sums and averages are silently wrong. Fix types early with astype or pd.to_numeric(errors='coerce')."
  }
]
```

---

[← Phase 3: Selecting & Filtering](03-selecting-and-filtering.md) · [Guide overview](_guide.md) · [Phase 5: Transforming Data →](05-transforming-data.md)
