---
title: "Parsing the CSV"
guide: csv-summary-python
phase: 1
summary: "Read an embedded CSV sample into a list of dicts with the csv module's DictReader."
tags: [python, csv, dictreader, parsing, data]
difficulty: intermediate
synonyms:
  - read csv python
  - dictreader example
  - parse csv string
  - csv to list of dicts
  - stringio csv
updated: 2026-06-30
---

# Parsing the CSV

The first job is getting the rows out of the file and into something Python can work with. We'll turn the raw CSV text into a list of dictionaries - one dict per row, keyed by the column header.

## Why not split on commas yourself?

It's tempting to do `line.split(",")` and call it a day. Don't. Real CSV data has commas inside quoted fields (`"Smith, John"`), quotes inside values, and blank cells. The `csv` module handles all of that correctly, and it's already in the standard library. Splitting strings by hand is the kind of shortcut that works on your test data and breaks the day someone has a comma in a product name.

So we reach for `csv`.

## The file that isn't a file

Normally you'd open a CSV with `open("sales.csv")`. But this code runs in your browser, where there's no file to open. The trick: `io.StringIO` wraps a string so it behaves exactly like an open file. The `csv` module can't tell the difference.

That means we can keep our sample data right inside the code, and the same `DictReader` call you'd use on a real file works here unchanged. (In the last phase, you'll swap `StringIO` for `open()` and nothing else changes.)

## DictReader

`csv.DictReader` reads the first line as the header, then hands you each following row as a dict. So this CSV:

```
region,amount
North,120.50
```

becomes `{"region": "North", "amount": "120.50"}`.

Notice the amount is a **string**, not a number. CSV is only text - every value comes back as a string, even the ones that look numeric. We'll deal with converting those in the next phase. For now, our goal is to get the rows parsed and look at them.

Here's the full thing. Run it.

```python runnable
import csv
import io

# Our sample data lives right here in the code.
CSV_TEXT = """date,region,product,amount
2026-01-03,North,Widget,120.50
2026-01-05,South,Gadget,89.00
2026-01-08,North,Gadget,210.00
2026-01-11,East,Widget,55.50
2026-01-14,South,Widget,134.00
2026-01-19,East,Gadget,410.00"""

# StringIO makes the string behave like an open file.
f = io.StringIO(CSV_TEXT)
reader = csv.DictReader(f)

# DictReader gives one dict per row; collect them into a list.
rows = list(reader)

print(f"Parsed {len(rows)} rows.\n")
for row in rows:
    print(row)
```

You should see six dictionaries, each with `date`, `region`, `product`, and `amount` keys. The headers became the keys automatically - that's `DictReader` doing its job.

## Reading the output

Look closely at one row:

```
{'date': '2026-01-03', 'region': 'North', 'product': 'Widget', 'amount': '120.50'}
```

Every value is in quotes - they're all strings. `'120.50'` is text, not the number `120.50`. If you tried to add up the amounts right now, you'd get `'120.50' + '89.00'` which concatenates into `'120.5089.00'`. Not what we want. Holding onto that fact is the whole reason the next phase exists.

## Pull out one column

Since each row is a dict, grabbing a single column across all rows is one line. Let's list every region we saw:

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

regions = [row["region"] for row in rows]
print("All regions:", regions)
print("Unique regions:", sorted(set(regions)))
```

That `set()` trick collapses duplicates, and `sorted()` makes the order stable. You now have a clean list of the categories you'll group by later.

## What you've got

A reliable way to turn CSV text into a list of dicts you can loop over, index by column name, and pull values from. That's the foundation. The data's a little raw - everything's still a string - but it's structured, and that's the hard part done.

In the next phase we'll convert the `amount` column to real numbers and start adding things up. Keep this parsing pattern in your head: `StringIO` (or `open`) → `DictReader` → `list`. You'll write it at the top of every one of these scripts.
