---
title: "Text: Cleaning, Splitting, and Joining"
guide: "excel-formulas-that-do-real-work"
phase: 4
summary: "Clean messy text with TRIM, slice it with LEFT, MID, RIGHT, and TEXTSPLIT, join it with TEXTJOIN, format numbers and dates with TEXT, and fix numbers stored as text, the cause of many lookups and totals that quietly miss."
tags: [excel, text-functions, trim, textjoin, textsplit, left-mid-right, numbers-stored-as-text]
difficulty: intermediate
synonyms: ["excel trim function", "how to split text in excel", "excel textjoin example", "numbers stored as text excel", "excel mid and find", "excel text function date format", "why xlookup returns na for numbers", "excel remove extra spaces", "excel convert text to number"]
updated: 2026-10-06
---

# Text: Cleaning, Splitting, and Joining

Data that comes from other people and other systems is rarely clean. Names have extra spaces, IDs arrive glued together, and numbers show up as text that looks like numbers. None of that is visible on screen, but every one of them makes a lookup return `#N/A` or a total come out too small. This phase gives you the tools to see it and fix it.

## The mental model: text is a string of characters

A cell value is either a **number**, a **date** (a number with a format, see phase 5), or **text**. Text is a sequence of characters counted from 1, spaces included. `LEFT`, `MID`, and `RIGHT` take slices of that sequence.

## Measuring and cleaning: LEN and TRIM

`LEN(text)` returns the number of characters. `TRIM(text)` removes all spaces from text except single spaces between words.

Suppose `A2` holds a name someone typed carelessly: two spaces before, three between, one after (underscores stand for spaces in the table):

| Cell | Contents | Formula | Result |
|---|---|---|---|
| A2 | `__Nora___Patel_` | `=LEN(A2)` | 15 |
| B2 | | `=TRIM(A2)` | `Nora Patel` |
| C2 | | `=LEN(B2)` | 10 |

The raw cell has 2 + 4 + 3 + 5 + 1 = 15 characters; the clean one has `4 + 1 + 5 = 10`. Comparing `LEN` before and after is the fastest way to catch a hidden space.

**This is why a lookup fails.** `=XLOOKUP("P200 ", Products!$A$2:$A$7, Products!$D$2:$D$7)` has a space after the key and returns `#N/A`, because `"P200 "` and `"P200"` are different strings. Cure it at the source: `=XLOOKUP(TRIM(D2), ...)`, or clean the column once with `TRIM` and paste the values.

One limit, documented by Microsoft: `TRIM` removes the ordinary space (character code 32) but **not** the non-breaking space (code 160) that often comes from web pages. Convert it first:

```excel
=TRIM(SUBSTITUTE(A2, CHAR(160), " "))
```

## Slicing: LEFT, RIGHT, MID, FIND

```excel
=LEFT(text, [num_chars])
=RIGHT(text, [num_chars])
=MID(text, start_num, num_chars)
```

Say `A2` holds an order reference `WEST-1002-P100` (14 characters: `WEST`, a hyphen, `1002`, a hyphen, `P100`).

| Formula | Result | Why |
|---|---|---|
| `=LEFT(A2, 4)` | `WEST` | the first 4 characters |
| `=RIGHT(A2, 4)` | `P100` | the last 4 characters |
| `=MID(A2, 6, 4)` | `1002` | 4 characters starting at position 6 |
| `=FIND("-", A2)` | `5` | position of the first hyphen |
| `=MID(A2, FIND("-", A2) + 1, 4)` | `1002` | start one past the hyphen |

`FIND` makes the slice survive references of different lengths, because it locates the delimiter instead of hard-coding a position. (`FIND` is case-sensitive; `SEARCH` is the case-insensitive version.)

### Splitting in one step: TEXTSPLIT

In Microsoft 365 and Excel 2024:

```excel
=TEXTSPLIT(A2, "-")
```

spills the pieces across three cells: `WEST`, `1002`, `P100`. Its full form is `TEXTSPLIT(text, col_delimiter, [row_delimiter], [ignore_empty], [match_mode], [pad_with])`. In older versions use `LEFT`, `MID`, `FIND`, or the Data > Text to Columns tool.

## Joining: TEXTJOIN and &

`&` joins two things: `=C2&" "&D2`. For many pieces with a separator, use `TEXTJOIN` (Excel 2019 and newer):

```excel
=TEXTJOIN(delimiter, ignore_empty, text1, [text2], ...)
```

`ignore_empty` is required: `TRUE` skips empty cells, `FALSE` includes them. With first name `Nora` in `A2`, an empty middle name in `B2`, and last name `Patel` in `C2`:

| Formula | Result |
|---|---|
| `=TEXTJOIN(" ", TRUE, A2:C2)` | `Nora Patel` |
| `=TEXTJOIN(" ", FALSE, A2:C2)` | `Nora  Patel` (two spaces) |

Because it accepts ranges, it can list things: `=TEXTJOIN(", ", TRUE, Products!B2:B4)` gives `Desk Lamp, Office Chair, Standing Desk`.

## Formatting for display: TEXT

`TEXT(value, format_text)` turns a number or date into text formatted a given way. It is for building labels:

```excel
="Order "&A2&" total "&TEXT(H2, "$#,##0")
```

For order 1001 (total 240) this gives `Order 1001 total $240`. Other codes: `TEXT(DATE(2026,1,5), "yyyy-mm-dd")` gives `2026-01-05`, `TEXT(DATE(2026,1,5), "mmm yyyy")` gives `Jan 2026`, and `TEXT(0.05, "0%")` gives `5%`.

Two cautions. The result is **text**, so you cannot sum it; Microsoft recommends keeping the original number in its own cell. And format codes follow regional settings (the thousands separator varies, and some languages use different letters for year or day), so a workbook shared across countries can behave differently.

## Numbers stored as text

A cell can show `1002` and still be text. Signs: it is left-aligned, a small green triangle appears, `=ISNUMBER(cell)` returns `FALSE`. The usual sources are imported files, leading apostrophes, and the slices above: `MID`, `LEFT`, and `RIGHT` always return **text**, even when it looks like a number.

That matters for lookups. Orders `A2:A9` hold real numbers (`1001` to `1008`):

```excel
=XLOOKUP(MID(A2, 6, 4), Orders!$A$2:$A$9, Orders!$C$2:$C$9)
```

with `A2` of a scratch sheet holding `WEST-1002-P100` looks for the text `"1002"` among numbers, and returns `#N/A`. Convert it with `VALUE`:

```excel
=XLOOKUP(VALUE(MID(A2, 6, 4)), Orders!$A$2:$A$9, Orders!$C$2:$C$9)
```

This returns `Ben Ortiz` (order 1002). Other ways to convert: multiply by 1, use Data > Text to Columns, or re-enter the data. Text-numbers also hurt totals: `SUM` ignores text in a range, so a column with a few text-numbers adds up to less than it should with no warning.

## Your turn: predict the result

```exercise
[
  {
    "type": "predict",
    "task": "A2 holds WEST-1002-P100. What does =RIGHT(A2, 4) return?",
    "accept": ["P100"],
    "hint": "RIGHT takes characters from the end of the text."
  },
  {
    "type": "predict",
    "task": "A2 holds WEST-1002-P100. What does =LEN(A2) return? Give the number.",
    "accept": ["14"],
    "hint": "Count WEST (4), the hyphen (1), 1002 (4), the hyphen (1), and P100 (4)."
  }
]
```

Check yourself before moving on:

```quiz
[
  {"q": "XLOOKUP returns #N/A for a key that visibly matches a value in the table. Which is a likely cause?", "choices": ["The lookup table is too short", "A trailing space or a number stored as text makes the two values different", "XLOOKUP cannot look up text", "The result column is formatted as currency"], "answer": 1, "explain": "Exact lookups compare the characters. P200 with a trailing space is a different string from P200, and the text 1002 does not equal the number 1002.", "why": ["Length of the table does not matter if the key is in it.", null, "XLOOKUP works with text and numbers.", "Formatting of the result cell does not affect matching."]},
  {"q": "MID(A2, 6, 4) returns 1002 from a reference code. What type is that result?", "choices": ["A date", "It depends on the cell format", "A number", "Text"], "answer": 3, "explain": "LEFT, MID, and RIGHT always return text. Wrap the result in VALUE to get a number."},
  {"q": "TRIM does not clean a cell that came from a web page. What is the likely reason?", "choices": ["TRIM only works on numbers", "The cell contains non-breaking spaces (character 160), which TRIM does not remove", "TRIM removes only the leading spaces", "TRIM needs a second argument"], "answer": 1, "explain": "Microsoft notes TRIM removes the ordinary space character (code 32) but not the non-breaking space (code 160). Replace it with SUBSTITUTE(A2, CHAR(160), \" \") first.", "why": ["TRIM works on text.", null, "It also removes extra trailing and between-word spaces.", "TRIM takes only one argument."]}
]
```

## Recap

1. Text is a numbered sequence of characters; `LEN` counts them and exposes hidden spaces.
2. `TRIM` removes extra ordinary spaces; use `SUBSTITUTE(x, CHAR(160), " ")` for non-breaking ones.
3. `LEFT`, `RIGHT`, `MID`, and `FIND` slice by position; `TEXTSPLIT` splits by delimiter in Microsoft 365.
4. `TEXTJOIN(delimiter, ignore_empty, ...)` joins with a separator; `TEXT` formats numbers and dates into text for labels.
5. Slices are text. Convert with `VALUE`, or lookups and totals will quietly miss.

Next up, [Phase 5: Dates and the Classic Mistakes](05-dates-and-the-classic-mistakes.md): how Excel stores dates, and a symptom-to-fix table.
