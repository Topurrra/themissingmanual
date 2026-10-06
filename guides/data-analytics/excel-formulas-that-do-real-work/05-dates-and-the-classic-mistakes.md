---
title: "Dates and the Classic Mistakes"
guide: "excel-formulas-that-do-real-work"
phase: 5
summary: "Understand that Excel dates are serial numbers, then use TODAY, EDATE, EOMONTH, NETWORKDAYS, and DATEDIF correctly, and finish with a symptom-to-fix table for the classic mistakes: text-numbers, stray spaces, shifting ranges, and approximate matches."
tags: [excel, dates, serial-numbers, edate, eomonth, networkdays, datedif, troubleshooting]
difficulty: intermediate
synonyms: ["how does excel store dates", "excel date serial number", "excel edate vs eomonth", "excel networkdays with holidays", "excel datedif not working", "excel date is text not a date", "excel today function", "excel formulas not working wrong result"]
updated: 2026-10-06
---

# Dates and the Classic Mistakes

Dates look like text and behave like numbers, which is why they are both convenient to calculate with and fragile to break. Once you know what is under the hood, "30 days from the order date" is one subtraction. This phase covers the date functions you actually use, then closes with a table of the mistakes from the whole guide, organized by symptom.

## Dates are serial numbers

Excel stores a date as a count of days. By default, January 1, 1900 is serial number `1`. Microsoft's reference gives a second anchor: January 1, 2008 is `39448`, which is 39,447 days after January 1, 1900. Our order dates follow the same counting:

| Date | Serial number |
|---|---|
| 2026-01-05 | 46027 |
| 2026-01-30 | 46052 |
| 2026-03-09 | 46090 |

The only difference between a date and a number is the **cell format**. Type `46027` in a cell, choose a date format, and it shows `2026-01-05`; choose General and a real date shows `46027`.

Because dates are numbers, subtraction gives a duration in days:

```excel
=B9-B2
```

Order 1008 (2026-03-09) minus order 1001 (2026-01-05) is `46090 - 46027 = 63` days. Adding works too: `=B2+30` gives the date 30 days after order 1001, `2026-02-04`. (Format the result cell as a date or you will see a plain number.)

**Is it a real date?** `=ISNUMBER(B2)` is `TRUE` for a real date. If a date is left-aligned, or `ISNUMBER` says `FALSE`, it is text, and no date function will work on it. Convert it with `DATEVALUE`, retype it, or rebuild it with `DATE(year, month, day)`. Prefer `DATE` in formulas: a typed text date like `03/04/2026` can mean March 4 or April 3 depending on regional settings, while `DATE(2026,3,4)` cannot.

## TODAY

`=TODAY()` returns the current date. It recalculates whenever the workbook recalculates, so the same formula gives a different answer tomorrow. That is the point for "days since the order" (`=TODAY()-B2`), and a hazard when you need a number to stay fixed in a report you are saving: paste the value instead.

## EDATE and EOMONTH: month arithmetic

Adding 30 days is not the same as adding one month. Month functions handle the varying lengths for you.

```excel
=EDATE(start_date, months)
=EOMONTH(start_date, months)
```

Both return a serial number (format the cell as a date). `months` can be negative to go back.

- `EDATE` returns the same day-of-month the given number of months away.
- `EOMONTH` returns the **last day** of the month that is that many months away. `0` means the same month.

| Order | Order date | Formula | Result |
|---|---|---|---|
| 1001 | 2026-01-05 | `=EDATE(B2, 1)` | 2026-02-05 |
| 1003 | 2026-01-30 | `=EDATE(B4, 1)` | 2026-02-28 |
| 1003 | 2026-01-30 | `=EOMONTH(B4, 0)` | 2026-01-31 |
| 1003 | 2026-01-30 | `=EOMONTH(B4, -1) + 1` | 2026-01-01 |

February has no 30th, so `EDATE` lands on the last day, February 28. `EOMONTH(date, -1) + 1` is the standard way to get the **first** day of a month: the end of last month, plus one day. Putting `=EOMONTH(B2, 0)` in a helper column gives every order a month key you can group and `SUMIFS` on.

## NETWORKDAYS

```excel
=NETWORKDAYS(start_date, end_date, [holidays])
```

Counts whole working days (Monday to Friday) between two dates, **including both ends**, minus any dates in the optional `holidays` range. Microsoft recommends building dates with `DATE`, because text dates cause problems.

```excel
=NETWORKDAYS(DATE(2026,1,5), DATE(2026,1,16))
```

January 5, 2026 is a Monday and January 16 a Friday: two full work weeks, so `10`. If `E1` holds a holiday of `2026-01-12`, then `=NETWORKDAYS(DATE(2026,1,5), DATE(2026,1,16), E1)` returns `9`. Different weekend days need `NETWORKDAYS.INTL`.

## DATEDIF, with caveats

```excel
=DATEDIF(start_date, end_date, unit)
```

`unit` is one of `"Y"` (complete years), `"M"` (complete months), `"D"` (days), `"MD"`, `"YM"`, `"YD"`. It was kept for compatibility with older spreadsheet programs, and Microsoft warns it can give incorrect results in some scenarios and advises against the `"MD"` unit because of known limitations.
From a customer's start date of 2025-03-15 to 2026-01-05:

| Formula | Result | Why |
|---|---|---|
| `=DATEDIF(DATE(2025,3,15), DATE(2026,1,5), "Y")` | 0 | not yet a full year |
| `=DATEDIF(DATE(2025,3,15), DATE(2026,1,5), "M")` | 9 | 15 March to 15 December is 9 months; 5 January is before the 15th |
| `=DATEDIF(DATE(2025,3,15), DATE(2026,1,5), "D")` | 296 | total days |

If the start date is later than the end date you get `#NUM!`. For a plain day count, subtract the dates instead, as Microsoft recommends.

## The classic mistakes: symptom to fix

When a formula returns something wrong or odd, check this table before rewriting anything.

| Symptom | Likely cause | Fix |
|---|---|---|
| `#N/A` from a lookup for a key that is visibly there | Trailing or leading space; or number vs text mismatch | `TRIM` the key, check `ISNUMBER`, convert with `VALUE` |
| Lookup returns a plausible price for a missing key | VLOOKUP or MATCH using the approximate default | Write `FALSE` or `0`; or use XLOOKUP |
| First row correct, later rows `#N/A` after filling down | Lookup table not locked with `$` | `$A$2:$A$7`, press `F4` |
| VLOOKUP returns the wrong column after the table changed | Hard-coded column number | Use XLOOKUP or `INDEX`/`MATCH` |
| Every value is `0` and no errors are visible | `IFERROR(..., 0)` hiding `#REF!` or a bad column | Remove IFERROR to see it; use `IFNA` or `if_not_found` |
| `SUMIFS` total is too low | Text-numbers or stray spaces in the criteria range or sum range | Convert or clean the data |
| `SUMIFS` returns `#VALUE!` | Range arguments of different sizes | Make every range the same size |
| `SUMIF` / `SUMIFS` returns 0 or an odd number | Mixed up the argument order (sum range third in SUMIF, first in SUMIFS) | Rewrite with `SUMIFS(sum_range, ...)` |
| Date arithmetic returns `#VALUE!` | A date stored as text | `DATEVALUE` or `DATE(y, m, d)` |
| A date shows as a 5-digit number | Cell formatted as General | Apply a date format |
| `AVERAGEIFS` returns `#DIV/0!` | No row matched | Check the criteria, do not mask it blindly |

## Your turn: predict the result

```exercise
[
  {
    "type": "predict",
    "task": "B4 holds 2026-01-30. What date does =EDATE(B4, 1) return? Give it as yyyy-mm-dd.",
    "accept": ["2026-02-28"],
    "hint": "February 2026 has 28 days, and there is no 30th, so EDATE returns the last day of that month."
  },
  {
    "type": "predict",
    "task": "How many whole working days does =NETWORKDAYS(DATE(2026,1,5), DATE(2026,1,16)) count? Both dates are included, Jan 5 is a Monday and Jan 16 a Friday.",
    "accept": ["10"],
    "hint": "Two full Monday-to-Friday weeks."
  }
]
```

Check yourself before moving on:

```quiz
[
  {"q": "What is a date in Excel, underneath?", "choices": ["A number counting days, shown through a date format", "A pair of numbers for month and day", "A reference to the system clock", "A text string in a special format"], "answer": 0, "explain": "Dates are serial numbers: 1 is January 1, 1900 by default. Formatting decides whether you see 46027 or 2026-01-05.", "why": [null, "A date is a single number.", "Only TODAY reads the clock; a stored date is a fixed number.", "Text dates are the broken case, not the normal one."]},
  {"q": "Which formula gives the last day of the same month as the date in B4?", "choices": ["=B4+30", "=EDATE(B4, 1)", "=EOMONTH(B4, 0)", "=EOMONTH(B4, 1)"], "answer": 2, "explain": "EOMONTH with months set to 0 stays in the same month and returns its last day. EDATE keeps the day-of-month, and adding 30 days ignores month lengths.", "why": ["Month lengths vary, so 30 days is not a month.", "EDATE moves one month ahead and keeps the day number.", null, "That would return the end of the following month."]},
  {"q": "What does Microsoft advise about DATEDIF?", "choices": ["It can give incorrect results in some cases, and the MD unit has known limitations", "It only works in Excel 2010", "It always returns days", "Use it for all date math"], "answer": 0, "explain": "DATEDIF is kept for compatibility. Microsoft warns about incorrect results and advises against the MD unit; subtract dates for a plain day count."}
]
```

## Recap

1. A date is a serial number (1 is January 1, 1900); formatting makes it look like a date, and subtraction gives days.
2. If `ISNUMBER` is false, the date is text and must be converted; build dates with `DATE(y, m, d)`.
3. `EDATE` moves by months and clips to the month's last day; `EOMONTH(date, 0)` is month end, and `EOMONTH(date, -1) + 1` is month start.
4. `NETWORKDAYS(start, end, [holidays])` counts weekdays inclusive; `DATEDIF` works but has caveats, so avoid `"MD"`.
5. Most wrong answers come from the same handful of causes: text-numbers, spaces, unlocked ranges, approximate matches, and hidden errors.

Where to go from here: summarize all this with pivot tables in [Excel Pivot Tables and Charts](/guides/excel-pivot-tables-and-charts), or go further with [Advanced Excel](/guides/advanced-excel).
