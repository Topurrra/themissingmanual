---
title: "Totals and Counts"
guide: csv-summary-python
phase: 2
summary: "Convert the amount column to numbers and compute sum, count, min, max, and average."
tags: [python, csv, aggregation, statistics, data]
difficulty: intermediate
synonyms:
  - sum csv column python
  - average column python
  - min max csv
  - count rows python
  - aggregate csv data
updated: 2026-06-30
---

# Totals and Counts

We have rows. Now we want numbers about those rows: how much in total, how many sales, the smallest, the largest, the average. This is the part people actually ask for.

## First, fix the strings

Remember from the last phase: every value the CSV gives us is a string. `'120.50'` is text. Before we can do math, we convert the `amount` column to a float.

`float("120.50")` gives `120.5`. We do that for each row. The cleanest move is a list comprehension that pulls out only the numbers we care about:

```python runnable
import csv
import io

CSV_TEXT = """date,region,product,amount
2026-01-03,North,Widget,120.50
2026-01-05,South,Gadget,89.00
2026-01-08,North,Gadget,210.00
2026-01-11,East,Widget,55.50
2026-01-14,South,Widget,134.00
2026-01-19,East,Gadget,410.00"""

rows = list(csv.DictReader(io.StringIO(CSV_TEXT)))

amounts = [float(row["amount"]) for row in rows]
print(amounts)
```

Now they're real numbers - no quotes - and we can add, compare, and average them.

## The five numbers

Python's built-ins do almost all the work here:

| Question | Code |
|----------|------|
| How many? | `len(amounts)` |
| Total? | `sum(amounts)` |
| Smallest? | `min(amounts)` |
| Largest? | `max(amounts)` |
| Average? | `sum(amounts) / len(amounts)` |

There's no special "average" built-in - average is the sum divided by the count, which you already have. Let's compute all five and print them.

```python runnable
import csv
import io

CSV_TEXT = """date,region,product,amount
2026-01-03,North,Widget,120.50
2026-01-05,South,Gadget,89.00
2026-01-08,North,Gadget,210.00
2026-01-11,East,Widget,55.50
2026-01-14,South,Widget,134.00
2026-01-19,East,Gadget,410.00"""

rows = list(csv.DictReader(io.StringIO(CSV_TEXT)))
amounts = [float(row["amount"]) for row in rows]

count = len(amounts)
total = sum(amounts)
smallest = min(amounts)
largest = max(amounts)
average = total / count

print(f"Count:    {count}")
print(f"Total:    {total:.2f}")
print(f"Smallest: {smallest:.2f}")
print(f"Largest:  {largest:.2f}")
print(f"Average:  {average:.2f}")
```

The `:.2f` in the f-string rounds to two decimal places - so `157.041666...` prints as `157.04`. Money never wants fifteen digits after the dot.

## The one bug waiting to happen

Look at `average = total / count`. If `count` is zero - an empty CSV, or one with only a header - that line blows up with `ZeroDivisionError`. It's worth one guard:

```python runnable
import csv
import io

# An empty file: header only, no data rows.
CSV_TEXT = "date,region,product,amount"

rows = list(csv.DictReader(io.StringIO(CSV_TEXT)))
amounts = [float(row["amount"]) for row in rows]

count = len(amounts)
total = sum(amounts)
average = total / count if count else 0.0

print(f"Count:   {count}")
print(f"Total:   {total:.2f}")
print(f"Average: {average:.2f}")
```

`total / count if count else 0.0` reads as "divide if there's anything, otherwise zero." `sum([])` is already `0` and `len([])` is `0`, so those two are fine on their own - it's the division that needs the guard. One small condition saves you a crash on the inevitable empty file.

## Which row was the biggest?

`max(amounts)` tells you the biggest number, but often you want the whole row - what product, what region. For that, give `max` a `key` so it compares rows by their amount and hands back the row itself:

```python runnable
import csv
import io

CSV_TEXT = """date,region,product,amount
2026-01-03,North,Widget,120.50
2026-01-05,South,Gadget,89.00
2026-01-08,North,Gadget,210.00
2026-01-11,East,Widget,55.50
2026-01-14,South,Widget,134.00
2026-01-19,East,Gadget,410.00"""

rows = list(csv.DictReader(io.StringIO(CSV_TEXT)))

biggest = max(rows, key=lambda r: float(r["amount"]))
print("Biggest sale:")
print(f"  {biggest['date']}  {biggest['region']}  {biggest['product']}  {biggest['amount']}")
```

`key=lambda r: float(r["amount"])` tells `max` how to rank the rows. Without the `float`, it would compare the amounts as strings - and `'89.00'` sorts higher than `'410.00'` alphabetically, which would be wrong. The conversion matters everywhere you compare.

## What you've got

The headline numbers for the whole dataset: count, total, min, max, average - plus the single biggest row. That's already a useful summary. But a real report breaks the totals out by category - total per region, per product - so you can see where the money's actually coming from.

That's grouping, and it's the next phase. The pattern there builds straight on what you have: convert to a number, then accumulate. We'll do it per group instead of all at once.
