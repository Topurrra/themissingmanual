---
title: "Formatting the Report"
guide: csv-summary-python
phase: 4
summary: "Assemble the totals and per-group breakdown into one aligned text report, then run it on a real file."
tags: [python, csv, formatting, report, data]
difficulty: intermediate
synonyms:
  - format text report python
  - align columns python
  - print report python
  - write report to file
  - read csv file python
updated: 2026-06-30
---

# Formatting the Report

Time to put it all together. We have the grand totals from phase 2 and the per-group breakdown from phase 3. This phase turns those numbers into a single report that lines up cleanly, then wires the whole thing into one function — and shows you how to run it on a real CSV on your own machine.

## Lining numbers up

Raw `print()` output looks ragged because names and numbers are different widths. Format specs fix that. Two you'll use constantly:

| Spec | Effect | Example |
|------|--------|---------|
| `{name:<10}` | left-align in 10 chars | `North     ` |
| `{value:>10.2f}` | right-align in 10 chars, 2 decimals | `    642.50` |

Left-align text, right-align numbers — that's the whole secret to a column that reads well. Numbers line up on their right edge so the decimal points stack.

A thousands separator helps too: `{value:,.2f}` prints `1884.5` as `1,884.50`. Easier to read large totals at a glance.

## The whole script

Here's everything from the last three phases, assembled into one function that prints a finished report. Run it.

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
2026-01-19,East,Gadget,410.00
2026-01-22,North,Widget,98.00
2026-01-25,South,Gadget,175.50"""


def build_report(rows, group_col="region", value_col="amount"):
    amounts = [float(r[value_col]) for r in rows]
    count = len(amounts)
    total = sum(amounts)
    average = total / count if count else 0.0
    largest = max(amounts) if amounts else 0.0

    group_totals = defaultdict(float)
    for r in rows:
        group_totals[r[group_col]] += float(r[value_col])

    lines = []
    lines.append("SALES SUMMARY")
    lines.append("=" * 13)
    lines.append(f"Rows:          {count}")
    lines.append(f"Total amount:  {total:>12,.2f}")
    lines.append(f"Average:       {average:>12,.2f}")
    lines.append(f"Largest sale:  {largest:>12,.2f}")
    lines.append("")
    lines.append(f"By {group_col}:")
    for key in sorted(group_totals):
        lines.append(f"  {key:<10} {group_totals[key]:>12,.2f}")

    return "\n".join(lines)


rows = list(csv.DictReader(io.StringIO(CSV_TEXT)))
report = build_report(rows)
print(report)
```

That's the project. One function takes the rows and gives you the formatted report as a string. Building the report into a list of lines and joining at the end (instead of printing as you go) means you can return it, write it to a file, or print it — your choice, decided by the caller.

Try changing `build_report(rows)` to `build_report(rows, group_col="product")` and rerun. Same report, broken out by product instead. That flexibility came free from passing the column name as an argument.

## A quick sanity check

When you write aggregation code, check it against a number you can verify by hand. The per-group totals must add up to the grand total — if they don't, something's double-counting or dropping rows. Let's assert exactly that:

```python runnable
import csv
import io
from collections import defaultdict

CSV_TEXT = """date,region,product,amount
2026-01-03,North,Widget,120.50
2026-01-05,South,Gadget,89.00
2026-01-08,North,Gadget,210.00
2026-01-11,East,Widget,55.50"""

rows = list(csv.DictReader(io.StringIO(CSV_TEXT)))

grand = sum(float(r["amount"]) for r in rows)

group_totals = defaultdict(float)
for r in rows:
    group_totals[r["region"]] += float(r["amount"])
group_sum = sum(group_totals.values())

# Floats don't compare exactly; allow a tiny tolerance.
assert abs(grand - group_sum) < 0.001, "groups don't sum to the total!"
print(f"Grand total:     {grand:.2f}")
print(f"Sum of groups:   {group_sum:.2f}")
print("Check passed: the groups add up.")
```

The `abs(...) < 0.001` is there because floats don't always compare exactly — `0.1 + 0.2` famously isn't `0.3` to a computer. Comparing with a small tolerance instead of `==` is the right habit for any money math.

## Running it on a real file

Everything so far ran in the browser using `StringIO`. On your own machine you read an actual file instead — and that's the only line that changes. The rest of `build_report` is identical.

You don't need to install anything; `csv` ships with Python. Save this as `report.py` next to your CSV, then run `python report.py sales.csv`:

```python
import csv
import sys
from collections import defaultdict


def build_report(rows, group_col="region", value_col="amount"):
    amounts = [float(r[value_col]) for r in rows]
    count = len(amounts)
    total = sum(amounts)
    average = total / count if count else 0.0
    largest = max(amounts) if amounts else 0.0

    group_totals = defaultdict(float)
    for r in rows:
        group_totals[r[group_col]] += float(r[value_col])

    lines = ["SALES SUMMARY", "=" * 13]
    lines.append(f"Rows:          {count}")
    lines.append(f"Total amount:  {total:>12,.2f}")
    lines.append(f"Average:       {average:>12,.2f}")
    lines.append(f"Largest sale:  {largest:>12,.2f}")
    lines.append("")
    lines.append(f"By {group_col}:")
    for key in sorted(group_totals):
        lines.append(f"  {key:<10} {group_totals[key]:>12,.2f}")
    return "\n".join(lines)


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else "sales.csv"
    with open(path, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    report = build_report(rows)
    print(report)

    # Also save it next to the input.
    with open("report.txt", "w", encoding="utf-8") as out:
        out.write(report)
    print("\nSaved to report.txt")


if __name__ == "__main__":
    main()
```

Run it from a terminal:

```bash
python report.py sales.csv
```

Three things to notice about the file version:

- `open(path, newline="", encoding="utf-8")` — the `newline=""` is the one `csv` quirk worth remembering. It stops Python from mangling line endings on Windows; the `csv` docs ask for it every time you open a CSV file. `encoding="utf-8"` handles names with accents.
- `sys.argv[1]` lets you pass the filename on the command line, with `sales.csv` as a fallback. No argument-parsing library needed.
- We write the report to `report.txt` as well as printing it, so you've got a file to email. Same string, two destinations.

## What you built

A working CSV summary tool. It reads rows, totals and averages a numeric column, breaks the total out by any category, and prints a clean aligned report — from an embedded sample in the browser, or from a real file on your machine with one changed line.

The shape you learned here — parse to dicts, convert to numbers, accumulate into a `defaultdict`, format with alignment specs — is the backbone of nearly every quick data script you'll write. Next time someone asks "what's the total per X?", you won't open a spreadsheet. You'll write ten lines and have the answer.
