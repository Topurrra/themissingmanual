---
title: "Grouping with a Dict"
guide: csv-summary-python
phase: 3
summary: "Group rows by a category column and total each group using collections.defaultdict."
tags: [python, csv, grouping, defaultdict, data]
difficulty: intermediate
synonyms:
  - group by python
  - defaultdict example
  - sum per category python
  - group csv rows
  - aggregate by group
updated: 2026-07-16
---

# Grouping with a Dict

A single grand total is fine, but the question people really have is "where's it coming from?" Total per region. Sales per product. That's grouping: split the rows into buckets by a category column, then total each bucket.

## The idea

We walk through every row, look at its `region`, and add its `amount` to a running total for that region. We need somewhere to keep those running totals - one slot per region - and that's a dict:

```
{"North": 330.50, "South": 223.00, "East": 465.50}
```

The catch is the first time we see a region, there's no slot yet. We have to create it before we can add to it.

## The clumsy way first

So you can see what `defaultdict` saves you, here's grouping with a plain dict. Every loop has to check "have I seen this region before?":

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

totals = {}
for row in rows:
    region = row["region"]
    amount = float(row["amount"])
    if region not in totals:      # first time? make the slot.
        totals[region] = 0.0
    totals[region] += amount

for region, total in totals.items():
    print(f"{region}: {total:.2f}")
```

It works, but that `if region not in totals` line is noise we repeat in every grouping script. There's a cleaner tool.

## defaultdict does the check for you

`collections.defaultdict(float)` is a dict that, when you ask for a key it's never seen, quietly creates it with a default value first. Pass `float` and missing keys start at `0.0`. Pass `int` and they start at `0`. Pass `list` and they start at `[]`.

**Your turn.** This is the technique the rest of the guide leans on, so try it yourself first. Write `total_by_group` using `defaultdict` instead of the `if region not in totals` check from the clumsy version above. The checks underneath tell you if it works. My version is right after.

```python runnable
from collections import defaultdict


def total_by_group(rows, group_col, value_col):
    # Return a dict mapping each distinct value in `group_col`
    # to the sum of `value_col` for rows with that value.
    # Use defaultdict(float) so you don't need to check
    # "have I seen this key before?"
    pass


# --- checks: fix your function until this prints "All good." ---
sample = [
    {"region": "North", "amount": "10"},
    {"region": "South", "amount": "5"},
    {"region": "North", "amount": "3"},
]
totals = total_by_group(sample, "region", "amount")
assert isinstance(totals, dict), f"total_by_group should return a dict, got: {totals!r}"
assert totals["North"] == 13.0, f"North should total 13.0, got: {totals.get('North')}"
assert totals["South"] == 5.0, f"South should total 5.0, got: {totals.get('South')}"
assert len(totals) == 2, f"expected 2 groups, got: {len(totals)}"
print("All good.")
```

Stuck? Look at the clumsy version above - `total_by_group` is that same loop, minus the `if`.

### One way to write it

`totals[region] += amount` works even the first time with a defaultdict - the slot gets created as `0.0` on the spot, then the amount is added. The `if` disappears:

```python runnable
import csv
import io
from collections import defaultdict

CSV_TEXT = """date,region,product,amount
2026-01-03,North,Widget,120.50
2026-01-05,South,Gadget,89.00
2026-01-08,North,Gadget,210.00
2026-01-11,East,Widget,55.50
2026-01-14,South,Widget,134.00
2026-01-19,East,Gadget,410.00"""

rows = list(csv.DictReader(io.StringIO(CSV_TEXT)))


def total_by_group(rows, group_col, value_col):
    totals = defaultdict(float)
    for row in rows:
        totals[row[group_col]] += float(row[value_col])
    return totals


totals = total_by_group(rows, "region", "amount")
for region in sorted(totals):
    print(f"{region}: {totals[region]:.2f}")
```

Same result, less ceremony. `sorted(totals)` prints the regions alphabetically so the output is stable instead of in whatever order the rows happened to arrive.

## Count and total per group

Usually you want more than the total - you also want how many sales made up that total. Keep two defaultdicts side by side, or keep one dict of small lists. Two is the readable choice.

Before you run this, guess which region has the highest *average* sale - not the highest total.

```python runnable
import csv
import io
from collections import defaultdict

CSV_TEXT = """date,region,product,amount
2026-01-03,North,Widget,120.50
2026-01-05,South,Gadget,89.00
2026-01-08,North,Gadget,210.00
2026-01-11,East,Widget,55.50
2026-01-14,South,Widget,134.00
2026-01-19,East,Gadget,410.00"""

rows = list(csv.DictReader(io.StringIO(CSV_TEXT)))

totals = defaultdict(float)
counts = defaultdict(int)
for row in rows:
    region = row["region"]
    totals[region] += float(row["amount"])
    counts[region] += 1

for region in sorted(totals):
    avg = totals[region] / counts[region]
    print(f"{region:6}  {counts[region]} sales  total {totals[region]:7.2f}  avg {avg:6.2f}")
```

Now each line shows the region, how many sales, the total, and the per-region average. Notice the format codes are doing the alignment: `{region:6}` pads the name to six characters, `{totals[region]:7.2f}` reserves seven characters for the number. That's a preview of the report formatting coming in the last phase.

## Group by a different column

The grouping key is only a column name. Swap `region` for `product` and the same loop totals sales per product instead - no other change.

Before you run it, guess whether Widget or Gadget has the higher total.

```python runnable
import csv
import io
from collections import defaultdict

CSV_TEXT = """date,region,product,amount
2026-01-03,North,Widget,120.50
2026-01-05,South,Gadget,89.00
2026-01-08,North,Gadget,210.00
2026-01-11,East,Widget,55.50
2026-01-14,South,Widget,134.00
2026-01-19,East,Gadget,410.00"""

rows = list(csv.DictReader(io.StringIO(CSV_TEXT)))

GROUP_BY = "product"   # change to "region" and rerun

totals = defaultdict(float)
for row in rows:
    totals[row[GROUP_BY]] += float(row["amount"])

print(f"Totals by {GROUP_BY}:")
for key in sorted(totals):
    print(f"  {key:8} {totals[key]:.2f}")
```

Pulling the column into a `GROUP_BY` variable means you can repoint the whole script at a different breakdown by editing one line. That's the kind of small lever that makes a script reusable.

## What you've got

The per-group breakdown - total and count for each region (or product, or anything). Combined with the grand totals from the last phase, you now have every number the report needs. The only thing left is presentation: lining it all up so it reads like a report instead of debug output.

That's the final phase, where the pieces become one script - and where you'll learn to point it at a real file on your machine.
