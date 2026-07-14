---
title: "Time Series & Dates"
guide: "pandas-from-zero"
phase: 8
summary: "Turn date strings into real datetimes with to_datetime, pull date parts with the .dt accessor, slice by partial dates via a DatetimeIndex, and roll daily data up to any period with resample - groupby over time."
tags: [pandas, time-series, datetime, resample, date-index, to-datetime, dt-accessor]
difficulty: intermediate
synonyms: ["pandas datetime", "pandas to_datetime", "pandas resample", "pandas date index", "pandas dt accessor", "pandas time series", "pandas group by month"]
updated: 2026-07-10
---

# Time Series & Dates

Almost every sales dataset has a `date` column, and almost every interesting question about it is a time
question: how did revenue trend month over month? Which weekday sells best? What's the seven-day moving
average? pandas has a whole toolkit for this, but it only works once pandas knows your dates are *dates*.

Here's the mental model for the entire phase: **a date is only powerful once pandas stores it as a real
datetime instead of text.** A column of date strings is just letters to pandas - it can't sort them by
calendar, can't pull the month out, can't bucket by week. The moment you convert it to the `datetime64`
type, three superpowers unlock at once: extract any part of the date, slice by partial dates, and roll the
data up to any time period. The rest of this phase is those three powers, plus a couple of tools you'll
reach for on real, messy time series.

We'll keep working the running sales dataset (`date`, `product`, `region`, `units`, `price`), with the
`revenue` column we built earlier - but with a longer stretch of daily rows so the time tools have
something to chew on:

```python
import pandas as pd
import numpy as np

sales = pd.DataFrame({
    "date":    ["2024-01-05", "2024-01-12", "2024-02-03", "2024-02-20", "2024-03-08", "2024-03-25"],
    "product": ["Widget", "Gadget", "Widget", "Gadget", "Widget", "Gadget"],
    "region":  ["North", "South", "North", "West", "South", "North"],
    "units":   [10, 4, 7, 12, 5, 9],
    "price":   [9.99, 19.99, 9.99, 19.99, 9.99, 19.99],
})
sales["revenue"] = sales["units"] * sales["price"]
```

## Parsing dates: from text to real datetimes

📝 When you load a CSV, a date column almost always arrives as **strings** - pandas stores it with the
`object` dtype, the same type it uses for plain text. It looks like a date to *you*, but to pandas
`"2024-01-05"` is just six characters. `pd.to_datetime(df["date"])` converts that text into real
`datetime64` values, and that conversion is the gate you have to walk through before any date math, date
sorting, or resampling will work.

Watch the dtype change - that's the whole point:

```python
print(sales["date"].dtype)
sales["date"] = pd.to_datetime(sales["date"])
print(sales["date"].dtype)
```
```console
object
datetime64[ns]
```

*What just happened:* before conversion, `sales["date"]` reported `object` - pandas was holding the dates as
text. After `pd.to_datetime`, the same column reports `datetime64[ns]` (the `[ns]` means nanosecond
precision), so each value is now a true point on the calendar. Nothing looks different when you print the
column, but everything that follows in this phase now works.

⚠️ This is not optional housekeeping - a date stored as a string lies to you in two quiet ways. It **sorts
alphabetically**, not chronologically: text sorting puts `"2024-1-9"` after `"2024-1-10"` because `9` comes
after `1` character by character. And you **cannot resample** it - every time tool in this phase will either
error or silently treat the column as meaningless text. When in doubt, check `.dtype` and convert. A common
shortcut is to parse at load time: `pd.read_csv("sales.csv", parse_dates=["date"])` hands you a real
datetime column straight away.

## The .dt accessor: pulling date parts out

📝 Just as `.str` gives you string methods on a column of text, **`.dt` gives you date methods on a column
of datetimes** - and like everything in pandas, they're vectorized, running over the whole column at once.
`df["date"].dt.year`, `.dt.month`, `.dt.day_name()`, `.dt.quarter` each pull one piece out of every date in
a single sweep.

This is how you derive the columns that time analysis usually wants - a month number to group by, a weekday
name to compare:

```python
sales["month"]   = sales["date"].dt.month
sales["weekday"] = sales["date"].dt.day_name()
sales["quarter"] = sales["date"].dt.quarter
print(sales[["date", "month", "weekday", "quarter"]])
```
```console
        date  month   weekday  quarter
0 2024-01-05      1    Friday        1
1 2024-01-12      1    Friday        1
2 2024-02-03      2  Saturday        1
3 2024-02-20      2   Tuesday        1
4 2024-03-08      3    Friday        1
5 2024-03-25      3    Monday        1
```

*What just happened:* `.dt.month` pulled the month number from every date, `.dt.day_name()` produced the
spelled-out weekday, and `.dt.quarter` gave the calendar quarter - each as a new column, computed for all
six rows at once. None of this would work on a string column; the `.dt` accessor only exists on real
datetimes (try it on text and pandas raises `AttributeError`). Now that you have a `weekday` column, you
could lean on the previous phase and group by it - `sales.groupby("weekday")["revenue"].sum()` - to see
which day of the week sells best. The `.dt` accessor is what turns a single date into the categories you
slice your sales by.

## A DatetimeIndex: slicing by partial dates

📝 Set the date column as the DataFrame's **index** with `df.set_index("date")`, and you unlock something
that feels like magic the first time you see it: **time-based slicing by partial date strings.** With a
`DatetimeIndex`, `df.loc["2024-01"]` returns every row in January - you name the period and pandas figures
out the range. `df.loc["2024-01":"2024-03"]` returns the whole first quarter.

```python
sales_ts = sales.set_index("date").sort_index()
print(sales_ts.loc["2024-02", ["product", "revenue"]])
```
```console
           product  revenue
date
2024-02-03  Widget    69.93
2024-02-20  Gadget   239.88
```

*What just happened:* `set_index("date")` moved the date column into the index (we `sort_index()` too, since
range selection wants the index in order), and then `loc["2024-02"]` matched every date whose year and
month are February 2024 - no `>=`/`<` boolean mask, no manual date comparison. This is **partial-string
date selection**, and it's one of pandas' genuine superpowers. A range works the same way:

```python
print(sales_ts.loc["2024-01":"2024-02", ["product", "revenue"]])
```
```console
           product  revenue
date
2024-01-05  Widget    99.90
2024-01-12  Gadget    79.96
2024-02-03  Widget    69.93
2024-02-20  Gadget   239.88
```

*What just happened:* `loc["2024-01":"2024-02"]` grabbed everything from the start of January through the end
of February - and note the range is **inclusive on both ends**, unlike normal Python slicing where the stop
is excluded. You wrote the months you cared about and pandas handled the calendar boundaries. ⚠️ For range
slicing to behave, the index must be sorted; an unsorted DatetimeIndex can raise or return surprising
results, which is why `sort_index()` is a good reflex right after `set_index`.

## Resampling: groupby over time

📝 **`resample` is groupby, but the groups are time buckets instead of category values.** Where Phase 6's
`groupby("region")` made one group per region, `resample("ME")` makes one group per month-end, `"W"` per
week, `"D"` per day - then you aggregate each bucket exactly like a groupby. It needs a DatetimeIndex (the
one you just set), and the whole shape mirrors what you already know:
`df.resample("ME")["revenue"].sum()` gives monthly revenue totals.

Here we roll our scattered daily sales up into monthly revenue:

```python
monthly = sales_ts.resample("ME")["revenue"].sum()
print(monthly)
```
```console
date
2024-01-31    179.86
2024-02-29    309.81
2024-03-31    229.86
Freq: ME, dtype: float64
```

*What just happened:* `resample("ME")` bucketed the rows by calendar month (`ME` = month-end, so each bucket
is labeled with the last day of its month), `["revenue"]` picked the column to aggregate, and `.sum()` added
up the revenue in each bucket. January's two orders summed to `179.86`, February's to `309.81`, and so on.
Notice the chain reads exactly like a groupby - *split into time buckets, pick a column, aggregate* - because
that's precisely what it is. Swap `"ME"` for `"W"` to get weekly totals or `"D"` for daily, and swap `.sum()`
for `.mean()`, `.max()`, or `.count()` just as you would after a groupby.

💡 The one sentence to remember: **resample = "group by a time period."** Once that clicks, every frequency
string (`"D"`, `"W"`, `"ME"`, `"QE"` for quarter, `"YE"` for year) is just choosing how wide your buckets
are, and every aggregation you learned for groupby works unchanged.

## Rolling windows and timezones (brief)

A close cousin of resampling is the **rolling window** - instead of collapsing data into fixed buckets, it
slides a window of N rows along the series and aggregates within it. The classic use is smoothing a noisy
daily series into a moving average so the trend shows through the wiggle:

```python
daily = sales_ts.resample("D")["revenue"].sum()
print(daily.rolling(7).mean().tail(3))
```
```console
date
2024-03-23      0.0
2024-03-24      0.0
2024-03-25    142.84
```

*What just happened:* `resample("D")` first filled in every calendar day (days with no sale become `0`), then
`rolling(7).mean()` slid a seven-day window across that daily series and averaged each window - so the last
value is the mean revenue over the trailing week ending March 25. Rolling averages are how you turn a spiky
day-to-day series into a readable trend line. (The leading days read as their own short-window averages; with
default settings a window only produces a number once it has enough rows.)

One plain warning about **timezones**, because they bite people on real data. The datetimes you've made so
far are *naive* - they carry no timezone, just a wall-clock reading. You can attach one with
`df.index.tz_localize("UTC")` and convert between zones with `tz_convert("America/New_York")`. ⚠️ The trap is
mixing the two: pandas refuses to compare or combine a naive datetime with a timezone-aware one, and will
raise rather than guess. Pick one convention (storing everything in UTC is the common, sane default) and
stick to it across your whole dataset.

💡 Put it all together and the toolkit is complete: with real datetimes you can **slice by date**
(`loc["2024-02"]`), **extract parts** (`.dt.month`, `.dt.day_name()`), and **roll up to any period**
(`resample("ME").sum()`). That trio - plus rolling windows for smoothing - is the foundation of essentially
any time-based analysis you'll ever do.

## Recap

1. **A date is only powerful once it's a real datetime.** CSVs load dates as `object` (text) strings;
   `pd.to_datetime(df["date"])` converts them to `datetime64`, which is required before any date math,
   sorting, or resampling. ⚠️ A string date sorts alphabetically and can't be resampled.
2. **The `.dt` accessor** is `.str` for dates: `df["date"].dt.year`, `.dt.month`, `.dt.day_name()`,
   `.dt.quarter` pull date parts out, vectorized over the whole column - handy for deriving columns to group by.
3. **A DatetimeIndex** (`df.set_index("date")`) unlocks partial-string date slicing: `df.loc["2024-01"]` for a
   whole month, `df.loc["2024-01":"2024-03"]` for a range (inclusive on both ends). Sort the index first.
4. **`resample` is groupby over time.** `df.resample("ME")["revenue"].sum()` buckets by month-end and sums;
   `"W"` is weekly, `"D"` daily. Same split-pick-aggregate shape as Phase 6 - resample = "group by a time period."
5. **Rolling windows** (`rolling(7).mean()`) slide a window along the series to smooth noisy data into a moving
   average - collapsing nothing, just averaging locally.
6. **Timezones bite.** Naive datetimes carry no zone; `tz_localize` / `tz_convert` add and shift one, and
   mixing naive with timezone-aware values raises an error. Store everything in one convention (UTC is the safe default).

## Quick check

Lock in the three superpowers - convert first, then extract, slice, and roll up:

```quiz
[
  {
    "q": "Your `date` column loaded from a CSV has dtype `object` and won't resample. What's the fix?",
    "choices": [
      "Convert it with pd.to_datetime(df[\"date\"]) so it becomes datetime64",
      "Sort the DataFrame by the date column",
      "Rename the column to \"datetime\"",
      "Nothing - object columns resample fine"
    ],
    "answer": 0,
    "explain": "An object column holds dates as plain strings. pd.to_datetime converts them to real datetime64 values, which is required before resampling, the .dt accessor, or chronological sorting will work."
  },
  {
    "q": "With a DatetimeIndex, what does `df.loc[\"2024-02\"]` return?",
    "choices": [
      "Every row whose date falls in February 2024",
      "Only the single row dated exactly 2024-02-01",
      "An error - loc needs a full date string",
      "The 2024th and 2nd rows by position"
    ],
    "answer": 0,
    "explain": "Partial-string date selection: a DatetimeIndex lets you pass just \"2024-02\" and pandas matches every date in that month. \"2024-01\":\"2024-03\" works the same way for a range (inclusive on both ends)."
  },
  {
    "q": "How is `df.resample(\"ME\")[\"revenue\"].sum()` related to groupby?",
    "choices": [
      "It's groupby where the groups are time buckets (here, each month) instead of category values",
      "It's unrelated - resample sorts the data, it doesn't aggregate",
      "It only counts rows and can't sum a column",
      "It replaces the date index with integers"
    ],
    "answer": 0,
    "explain": "resample is groupby over time: \"ME\" makes one bucket per month-end, then you pick a column and aggregate exactly like a groupby. resample = \"group by a time period.\""
  }
]
```

---

[← Phase 7: Joining & Combining](07-joining-and-combining.md) · [Guide overview](_guide.md) · [Phase 9: Reshaping & Pivoting →](09-reshaping-and-pivoting.md)
