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
updated: 2026-06-30
---

# Grouping with a Dict

A single grand total is fine, but the question people really have is "where's it coming from?" Total per region. Sales per product. That's grouping: split the rows into buckets by a category column, then total each bucket.

## The idea

We walk through every row, look at its `region`, and add its `amount` to a running total for that region. We need somewhere to keep those running totals — one slot per region — and that's a dict:

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

That means `totals[region] += amount` works even the first time — the slot gets created as `0.0` on the spot, then the amount is added. The `if` disappears:

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
for row in rows:
    totals[row["region"]] += float(row["amount"])

for region in sorted(totals):
    print(f"{region}: {totals[region]:.2f}")
```

Same result, less ceremony. `sorted(totals)` prints the regions alphabetically so the output is stable instead of in whatever order the rows happened to arrive.

## Count and total per group

Usually you want more than the total — you also want how many sales made up that total. Keep two defaultdicts side by side, or keep one dict of small lists. Two is the readable choice:

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

The grouping key is only a column name. Swap `region` for `product` and the same loop totals sales per product instead — no other change:

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

The per-group breakdown — total and count for each region (or product, or anything). Combined with the grand totals from the last phase, you now have every number the report needs. The only thing left is presentation: lining it all up so it reads like a report instead of debug output.

That's the final phase, where the pieces become one script — and where you'll learn to point it at a real file on your machine.
