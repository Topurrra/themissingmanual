---
title: "Loading & Inspecting Data"
guide: "pandas-from-zero"
phase: 2
summary: "How real analysis starts: read_csv (and read_excel/json/sql/parquet) to load data, then head/info/describe/value_counts to know exactly what you've got before you trust a single number."
tags: [pandas, read-csv, dataframe, info, describe, dtypes, data-inspection]
difficulty: beginner
synonyms: ["pandas read_csv", "pandas load data", "pandas head info describe", "pandas dtypes shape", "pandas read excel sql", "pandas inspect dataframe", "pandas first look at data"]
updated: 2026-06-22
---

# Loading & Inspecting Data

In Phase 1 we hand-built a tiny DataFrame to learn what one *is*. Real work never starts that way. Real work starts with a file somebody emailed you, or a query result, or an export from a tool — and the very first question is always the same: *what is actually in here?*

Here's the mental model for this whole phase: **loading data and trusting data are two separate steps, and the gap between them is where bugs are born.** pandas will happily load almost anything and guess what it means. Sometimes it guesses wrong — a date read as text, a number read as a string, a blank cell read as the literal word "NA". So the rhythm we build here is: load the data, then *interrogate* it with a handful of inspection commands before you compute anything. Inspect first, analyze second. That habit will save you more grief than any clever one-liner.

We'll work the same small sales dataset the whole guide uses: each row is a sale, with a date, a product, a region, a unit count, and a price.

## Reading real data — `read_csv` and friends

📝 The overwhelming majority of analysis begins with `pd.read_csv("something.csv")`. CSV (comma-separated values) is the lingua franca of data: every tool can export it, and pandas reads it in one line. pandas also has a matching reader for nearly every other format you'll meet:

- `pd.read_csv(...)` — comma-separated (and tab/pipe/anything-separated) text files.
- `pd.read_excel(...)` — `.xlsx` / `.xls` spreadsheets (needs the `openpyxl` package).
- `pd.read_json(...)` — JSON data.
- `pd.read_sql(query, connection)` — the result of a SQL query, straight into a DataFrame.
- `pd.read_parquet(...)` — Parquet, a fast compressed columnar format common in data pipelines.

They all return the same thing: a DataFrame. Learn the inspection habits once and they apply no matter how the data arrived.

Say we have a file `sales.csv` that looks like this:

```text
date,product,region,units,price
2026-01-03,Widget,North,12,9.99
2026-01-03,Gadget,South,5,19.50
2026-01-04,Widget,East,8,9.99
2026-01-05,Gadget,North,3,19.50
2026-01-05,Doohickey,West,20,4.25
```

Loading it is one line:

```python
import pandas as pd

df = pd.read_csv("sales.csv")
```

*What just happened:* `read_csv` opened the file, used the first line as column names (`date`, `product`, `region`, `units`, `price`), split every following line on commas, and built a DataFrame with one row per sale. You now have a table in memory called `df`.

That worked because the file was clean. Real CSVs rarely are, so `read_csv` has arguments for the common messes. The ones you'll reach for constantly:

```python
df = pd.read_csv(
    "sales.csv",
    sep=",",                     # the delimiter; use "\t" for tab-separated, "|" for pipe
    header=0,                    # which row holds the column names (0 = first row; None = no header)
    parse_dates=["date"],        # read these columns as real dates, not text
    dtype={"units": "int64"},    # force a column's type instead of letting pandas guess
    na_values=["", "NA", "n/a"], # treat these strings as missing (NaN)
    usecols=["date", "product", "units", "price"],  # load only the columns you need
    nrows=1000,                  # load only the first N rows (great for peeking at a huge file)
)
```

*What just happened:* each argument steers one part of the read. `sep` picks the delimiter; `header` says where the names live; `parse_dates` turns the `date` column into actual datetime values (so you can do date math later); `dtype` pins a column's type so pandas can't guess wrong; `na_values` tells pandas which oddball strings mean "missing"; `usecols` and `nrows` keep memory down by loading less. You rarely need all of these at once — reach for them when the defaults misread your file.

⚠️ **`read_csv` guesses column types, and guesses can be wrong.** A CSV is just text — there are no types in the file itself, so pandas infers them from the values it sees. A ZIP code like `02134` can come in as the number `2134` (leading zero gone); a column with one stray letter in it gets read as text instead of numbers. Never assume the types are right. *Verify them* — which is exactly what the rest of this phase is about.

## First look: `head`, `tail`, `sample`

The instant you load data, look at some of it. Three methods show you rows:

- `df.head(n)` — the first `n` rows (default 5).
- `df.tail(n)` — the last `n` rows.
- `df.sample(n)` — `n` random rows.

```python
df.head()
```

```console
        date    product region  units  price
0 2026-01-03     Widget  North     12   9.99
1 2026-01-03     Gadget  South      5  19.50
2 2026-01-04     Widget   East      8   9.99
3 2026-01-05     Gadget  North      3  19.50
4 2026-01-05  Doohickey   West     20   4.25
```

*What just happened:* `head()` showed the top 5 rows plus the header and that leftmost unlabeled column — the **index** (0, 1, 2, …), pandas' built-in row labels. In two seconds you can confirm the columns landed in the right places, the values look sane, and nothing shifted by one. 💡 `head` answers "did this load like I expect?"; `tail` is great for spotting a junk summary row at the bottom of a spreadsheet export; `sample` guards against being fooled by data that happens to be sorted (the first 5 rows of a date-sorted file all look like January).

## Shape & structure: `info`, `dtypes`, `shape`, `columns`

`head` shows you *values*. Next you need the *structure*: how big is this, what are the columns, what type is each, and where are the holes?

📝 **`df.info()` is the single best first command on any new DataFrame.** In one printout it tells you the number of rows, every column name, how many non-null (non-missing) values each column has, and each column's type. It's your data's vital signs.

```python
df.info()
```

```console
<class 'pandas.core.frame.DataFrame'>
RangeIndex: 5 entries, 0 to 4
Data columns (total 5 columns):
 #   Column   Non-Null Count  Dtype
---  ------   --------------  -----
 0   date     5 non-null      object
 1   product  5 non-null      object
 2   region   5 non-null      object
 3   units    5 non-null      int64
 4   price    5 non-null      float64
dtypes: float64(1), int64(1), object(3)
memory usage: 332.0 bytes
```

*What just happened:* `info()` reported 5 rows (`RangeIndex: 5 entries`), 5 columns, and for each column the **non-null count** and the **dtype**. Two things jump out: every column is `5 non-null`, so there's no missing data — good. But notice `date` is type **`object`**, not a date. We loaded this without `parse_dates`, so pandas read the dates as plain text. That's a bug waiting to happen, and `info` caught it in one line.

The companions to `info` give you each piece on its own:

```python
print(df.shape)      # (rows, columns)
print(df.columns)    # the column names
print(df.dtypes)     # each column's type
```

```console
(5, 5)
Index(['date', 'product', 'region', 'units', 'price'], dtype='object')
date        object
product     object
region      object
units        int64
price      float64
dtype: object
```

*What just happened:* `shape` returned the tuple `(5, 5)` — 5 rows, 5 columns (rows always come first). `columns` listed the names so you can copy them exactly. `dtypes` gave the per-column types: `units` is `int64` (integers), `price` is `float64` (decimals), and the text columns are `object`.

⚠️ **A dtype of `object` almost always means "Python strings" — or, worse, mixed junk.** That's expected for genuine text like `product` and `region`. But if a column you *expect* to be numeric shows up as `object`, that's a red flag: pandas hit something non-numeric (a stray `"unknown"`, a `"$9.99"` with a dollar sign, a number with a thousands comma) and gave up, storing the whole column as text. You can't average a text column. Spotting an `object` where a number belongs — right here, before you compute — is the difference between a clean analysis and a confusing crash later.

## Summary stats: `describe`, `value_counts`, `nunique`

Now that you trust the structure, get a feel for the *distribution* of values. Three methods do the heavy lifting.

`df.describe()` gives a numeric summary of every number column at once:

```python
df.describe()
```

```console
           units      price
count   5.000000   5.000000
mean    9.600000  12.646000
std     6.580274   6.605779
min     3.000000   4.250000
25%     5.000000   9.990000
50%     8.000000   9.990000
75%    12.000000  19.500000
max    20.000000  19.500000
```

*What just happened:* `describe()` computed, for each numeric column, the **count** (non-missing values), **mean** (average), **std** (standard deviation, a spread measure), the **min** and **max**, and the **quartiles** — `25%`, `50%` (the median), and `75%`. At a glance: units run 3 to 20 averaging ~9.6; prices run \$4.25 to \$19.50. This is your fastest way to catch impossible values — a negative price, a `max` of 9999, an age of 200 — that signal a data problem.

`describe()` only looks at numbers. For text/category columns, you want frequencies — that's `value_counts()`:

```python
df["region"].value_counts()
```

```console
region
North    2
South    1
East     1
West     1
Name: count, dtype: int64
```

*What just happened:* `value_counts()` counted how many rows had each distinct value in the `region` column and sorted by frequency. North appears twice; the rest once each. This is how you check categories: are the regions spelled consistently (no `"north"` *and* `"North"`)? Is one value swamping the rest? Are there surprise categories you didn't expect? Add `normalize=True` to get proportions instead of counts.

And `nunique()` answers "how many distinct values?" without listing them:

```python
print(df["product"].nunique())   # 3 distinct products
```

```console
3
```

*What just happened:* `nunique()` returned the count of unique products (Widget, Gadget, Doohickey) — `3`. It's the quick way to gauge a column's cardinality: a few distinct values means a category to group by later; thousands means it's more like an ID.

## The inspect-first discipline

💡 Pull these together into a habit you run on *every* dataset, in this order, before you analyze anything:

1. **`info()`** — types and missing values. Is anything the wrong type? Are there holes?
2. **`head()`** (and `sample()`) — the shape of the actual values. Did it load right? Do the numbers look plausible?
3. **`describe()` and `value_counts()`** — distributions. Any impossible numbers? Any messy or surprising categories?

This three-step sweep takes under a minute and catches the exact problems that quietly wreck an analysis: dates read as text, numbers trapped as strings, missing values you didn't know were there, categories spelled three different ways, a stray summary row at the bottom. Every one of those produces *wrong answers that look right* — the most dangerous kind of bug — if you skip straight to computing.

Inspect first, analyze second. Now that you can load data and know exactly what's in it, the next phase is about reaching for the parts you want: selecting columns, slicing rows with `loc` and `iloc`, and filtering with boolean masks.

## Recap

1. **Analysis starts with loading.** `pd.read_csv` is the workhorse; `read_excel`, `read_json`, `read_sql`, and `read_parquet` cover other sources. All return a DataFrame.
2. **`read_csv` has arguments for messy files** — `sep`, `header`, `parse_dates`, `dtype`, `na_values`, `usecols`, `nrows` — because the defaults can't read your mind.
3. ⚠️ **pandas guesses types, and guesses can be wrong.** A column of `object` where you expected numbers means something non-numeric snuck in. Always verify.
4. **`head`/`tail`/`sample`** show you real rows; **`info`** is the best single command — rows, columns, types, and null counts in one shot.
5. **`describe`** summarizes numeric columns (count/mean/std/min/quartiles/max); **`value_counts`** counts category frequencies; **`nunique`** counts distinct values.
6. 💡 **Inspect before you analyze:** `info` → `head` → `describe`/`value_counts`. One minute of looking prevents wrong-but-plausible answers later.

## Quick check

Run the inspect-first sweep in your head and pick the best answer:

```quiz
[
  {
    "q": "You load a CSV and `df.info()` shows the `price` column has dtype `object`. What's the most likely explanation?",
    "choices": [
      "Some values in the column aren't pure numbers (e.g. a '$' sign or the text 'N/A'), so pandas stored the whole column as text",
      "The column is fine — `object` is pandas' normal type for decimal numbers",
      "pandas ran out of memory and downgraded the column",
      "The file was saved in the wrong encoding"
    ],
    "answer": 0,
    "explain": "A CSV has no types, so pandas infers them. If even one value in a column isn't numeric, pandas falls back to `object` (text) for the entire column. You can't do math on it until you clean and convert it — which is exactly why inspecting types early matters."
  },
  {
    "q": "Which single command gives you row count, column names, each column's type, AND how many non-missing values each column has, all at once?",
    "choices": [
      "df.info()",
      "df.head()",
      "df.describe()",
      "df.shape"
    ],
    "answer": 0,
    "explain": "`df.info()` is the best first command on any new DataFrame: it reports the number of rows, every column with its non-null count, and each column's dtype in one printout. `head` shows values, `describe` shows numeric stats, and `shape` only gives the (rows, columns) tuple."
  },
  {
    "q": "You want to check whether the `region` column is spelled consistently and see how many sales fall in each region. Which method fits best?",
    "choices": [
      "df['region'].value_counts() — it counts each distinct value",
      "df.describe() — it summarizes every column",
      "df['region'].nunique() — it returns just the number of distinct values",
      "df.head() — it shows the first five rows"
    ],
    "answer": 0,
    "explain": "`value_counts()` lists each distinct value with its frequency, so you immediately see both the counts per region and any inconsistencies (like 'North' vs 'north' showing up as separate entries). `nunique` would only tell you how many distinct values exist, not what they are or how often they appear."
  }
]
```

---

[← Phase 1: What pandas Is & the DataFrame](01-what-pandas-is.md) · [Guide overview](_guide.md) · [Phase 3: Selecting & Filtering →](03-selecting-and-filtering.md)
