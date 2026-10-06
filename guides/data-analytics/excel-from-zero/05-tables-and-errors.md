---
title: "Tables and Error Values"
guide: "excel-from-zero"
phase: 5
summary: "Turn a loose range into an Excel Table with Ctrl + T so it grows, fills formulas, and uses readable structured references, then decode #DIV/0!, #NAME?, #REF!, #VALUE!, and #N/A."
tags: [excel, tables, structured-references, ctrl-t, error-values, troubleshooting]
difficulty: beginner
synonyms: ["how to make a table in excel", "excel ctrl t table", "what is a structured reference in excel", "why use an excel table instead of a range", "what does @ mean in an excel formula", "what does #DIV/0! mean", "what does #NAME? mean in excel", "what does #REF! mean in excel", "what does #N/A mean in excel", "how to fix #VALUE! in excel"]
updated: 2026-10-06
---

# Tables and Error Values

Your sales list is a loose range: Excel only knows it as "some cells with data". Every formula you wrote points at fixed addresses like `F2:F9`, and a new sale in row 10 is invisible to all of them. An Excel Table fixes that by making the list a single object that Excel understands, with a name, a header row, and rows that can grow. This phase also gives you a cheat-card for the five error values, so a `#` in a cell stops being alarming.

## Make the list a Table

Click any cell inside `A1:G9` and press `Ctrl + T`. (Insert > Table and Home > Format as Table do the same, and work on Mac too.) A dialog confirms the range and asks whether **My table has headers**. Keep it ticked and press OK.

What changed:

- The block got a style with banded rows.
- Every header has filter arrows built in, so sort and filter from Phase 4 are always on.
- Excel treats the block as one object that can expand and shrink.

Click a cell in the table and a **Table Design** tab appears on the ribbon (older versions put it under Table Tools > Design). Its **Table Name** box on the left shows a default like `Table1`. Rename it to something meaningful: type `Sales` and press Enter. Names cannot contain spaces.

To undo the conversion later, use Table Design > **Convert to Range**.

## Structured references: formulas that read like English

Inside a Table, you refer to columns by name instead of by address. The pattern is `TableName[ColumnName]`.

| Formula | Meaning | Result on our data |
|---|---|---|
| `=SUM(Sales[Total])` | add the whole Total column | 121.9 |
| `=AVERAGE(Sales[Total])` | average of the Total column | 15.2375 |
| `=SUM(Sales[Qty])` | all units sold | 32 |
| `=MAX(Sales[Qty])` | the largest quantity | 10 |
| `=COUNTA(Sales[Item])` | number of items | 8 |

`=SUM(Sales[Total])` says what it does. `=SUM(F2:F9)` needs you to go look at column F. You can type these, or click a column header while building a formula and Excel writes the name for you.

### Calculated columns and `[@Column]`

Inside a Table row, `[@Column]` means "the value in this same row". Add a new column: click `H1`, type `Gross`, and press Enter. Because H1 sits directly beside the table, the table extends itself to include it. Now in `H2` type:

```excel
=[@Total]+[@Tax]
```

You can click F2 and G2 while typing and Excel fills in the names. Press Enter and the formula fills into every row of the column automatically. This is a **calculated column**. No dragging, no fill handle.

| Row | Total | Tax | Gross |
|---|---|---|---|
| Notebook (Oct 1) | 13.5 | 1.08 | 14.58 |
| Pen Pack (Oct 1) | 11 | 0.88 | 11.88 |
| Stapler | 12 | 0.96 | 12.96 |
| Notebook (Oct 2) | 9 | 0.72 | 9.72 |
| Marker Set | 25 | 2 | 27 |
| Desk Lamp | 18.9 | 1.512 | 20.412 |
| Pen Pack (Oct 4) | 22 | 1.76 | 23.76 |
| Sticky Notes | 10.5 | 0.84 | 11.34 |

`=SUM(Sales[Gross])` gives 131.652, which is 121.9 times 1.08.

If a header has a space or punctuation in it, such as `Unit Price`, the row form needs an extra pair of brackets, `[@[Unit Price]]`. Excel writes it for you when you click the cell, so you rarely type it.

## Why a Table beats a loose range

Now add a sale. In `A10` type `2026-10-05`, then `Eraser`, `Writing`, `8`, and `0.60` across row 10.

- The Table **expands** to include row 10, banding and all.
- `=SUM(Sales[Qty])` changes from 32 to 40. A loose `=SUM(D2:D9)` typed before the conversion would have stayed at 32.
- The `Gross` column is a calculated column, so it fills the new row by itself. If `F10` and `G10` stayed empty (those two were ordinary formulas before the conversion), select `F9:G10` and press `Ctrl + D` to copy them down.

Once F10 and G10 are filled, `=SUM(Sales[Total])` is 126.7 and `=SUM(Sales[Gross])` is 136.836.

*What just happened:* the Table is one object, so "the whole Total column" always means all of it, however long it gets. Anything that points at the Table by name, including charts and PivotTables (see [Excel Pivot Tables and Charts](/guides/excel-pivot-tables-and-charts)), follows the growth too.

| Loose range | Table |
|---|---|
| Formulas end at a fixed row | Column references grow with the data |
| You copy formulas down yourself | Calculated columns fill automatically |
| Formulas read `F2:F9` | Formulas read `Sales[Total]` |
| Add filter arrows by hand | Filters built in, on every header |
| Banding and totals by hand | Style and Total Row are checkboxes |

The Total Row: tick **Total Row** on the Table Design tab and a row appears under the data with a drop-down in every cell. Choosing Sum for the Total column writes `=SUBTOTAL(109,[Total])`, the filter-aware total from Phase 4. Filter the Table and the Total Row follows.

## Error values: a cheat-card

When a formula cannot produce an answer, the cell shows an error value that starts with `#`. Each one names a different failure.

| You see | It means | Typical cause | First move |
|---|---|---|---|
| `#DIV/0!` | divided by zero | the divisor is 0 or empty | check the cell you divide by |
| `#NAME?` | Excel does not recognize a word | misspelled function, text without quotes | check the spelling |
| `#REF!` | a reference is no longer valid | you deleted a cell, row, or column a formula used | undo with `Ctrl + Z` |
| `#VALUE!` | the wrong kind of value | arithmetic on text | find the text cell |
| `#N/A` | the value is not available | a lookup found no match | check the lookup value |

### #DIV/0!

Division needs a non-zero divisor. `=F2/0` fails, and so does `=F2/D2` when D2 is empty or 0. `=AVERAGE` over a range with no numbers fails too, because it divides by a count of zero. Guard it with an IF: `=IF(D2=0, "", F2/D2)` shows nothing when the divisor is zero and divides otherwise.

### #NAME?

Excel found a word it cannot match to anything. `=SUMM(F2:F9)` is a misspelled function. Text must be in double quotes: `="Writing"` is text, `=Writing` is Excel hunting for a name called Writing. A function your Excel version does not have also gives `#NAME?`, which can happen when a file from newer Excel opens in an older one.

### #REF!

A formula pointed at a cell that no longer exists. If `=B2+C2` lives in D2 and you delete column C, the formula slides left into C2 and becomes `=B2+#REF!`. Undo right away if you can; the original address is gone from the formula, and Excel cannot guess it.

### #VALUE!

A formula got a kind of value it cannot use. If M1 contains the text `n/a`, then `=M1*2` returns `#VALUE!`, because text that is not a number cannot be multiplied. The `+` operator breaks on text where `SUM` would have skipped it (Phase 3), which is a reason to prefer SUM over chains of plus signs.

### #N/A

"Not available". You mostly meet it with lookups. `=MATCH("Calculator", B2:B10, 0)` asks for the position of "Calculator" in the Item column, using exact matching, and returns `#N/A` because no such item was sold. It is Excel saying "I looked and found nothing", often a data mismatch such as a trailing space. Lookups are covered in [Excel Formulas That Do Real Work](/guides/excel-formulas-that-do-real-work).

### Two things that look like errors

- `####` in a cell is not an error value. The column is too narrow to show the number; widen it.
- A green triangle in a cell's corner is Excel's own warning, for example for numbers stored as text. It is a suggestion, not a failure.

Excel has a few more error values (`#NUM!`, `#NULL!`, `#SPILL!`), which show up in more advanced formulas.

### Errors spread

Errors flow through dependent formulas. If one cell in `F2:F9` shows `#DIV/0!`, then `=SUM(F2:F9)` also shows `#DIV/0!`. Find the first error, not the last. Select the cell and use **Formulas > Error Checking > Trace Error**, or press Ctrl and the backtick key (left of 1 on a US keyboard) to show every formula as text and scan for the odd one. **Formulas > Evaluate Formula** steps through a formula one piece at a time.

`IFERROR(value, value_if_error)` replaces any error with a result you choose. Use it deliberately, in the one place you expect a failure. Wrapping a whole sheet in IFERROR hides real mistakes behind blank cells.

Test yourself:

```exercise
[
  {
    "type": "predict",
    "task": "Which error value does =SUMM(F2:F9) return? (SUM is misspelled.)",
    "accept": ["#NAME?", "NAME?"],
    "hint": "Excel does not recognize the word SUMM."
  },
  {
    "type": "predict",
    "task": "M1 contains the text n/a. Which error value does =M1*2 return?",
    "accept": ["#VALUE!", "VALUE!"],
    "hint": "The formula needs a number and got text."
  },
  {
    "type": "predict",
    "task": "A Table is named Sales and has a column called Qty. Type a formula that adds up that whole column, starting with the equals sign.",
    "accept": ["=SUM(Sales[Qty])", "SUM(Sales[Qty])"],
    "hint": "The pattern is TableName[ColumnName] inside SUM."
  }
]
```

Check yourself before moving on:

```quiz
[
  {
    "q": "You add a new row directly under a Table. What happens?",
    "choices": ["Nothing, the new row stays outside the Table", "The Table expands to include it, and formulas using Sales[Total] include it", "Excel asks you to retype every formula"],
    "answer": 1,
    "explain": "A Table grows when you type in the row directly below it, and column references like Sales[Total] cover the whole column."
  },
  {
    "q": "Inside a Table, what does [@Qty] mean?",
    "choices": ["The Qty value in the same row as the formula", "The sum of the Qty column", "The first value in the Qty column"],
    "answer": 0,
    "explain": "The @ symbol means this row. =[@Qty]*[@Price] multiplies the two values on the row where the formula lives."
  },
  {
    "q": "A formula that read =B2+C2 now reads =B2+#REF! after you edited the sheet. What most likely happened?",
    "choices": ["Column C was deleted", "C2 contains text", "Excel does not recognize a function name"],
    "answer": 0,
    "explain": "#REF! means a reference is no longer valid, usually because the cell, row, or column it pointed to was deleted."
  }
]
```

## Recap

1. `Ctrl + T` turns a range into a Table: one named object with built-in filters, banding, and the ability to grow.
2. Structured references like `Sales[Total]` name a whole column and always cover all of it.
3. `[@Column]` means "this row", and a formula typed in one cell fills the whole calculated column.
4. A Total Row writes `SUBTOTAL(109, ...)`, so it respects filters.
5. `#DIV/0!` is a zero divisor, `#NAME?` is an unknown word, `#REF!` is a deleted reference, `#VALUE!` is the wrong type, `#N/A` is a lookup that found nothing.
6. Errors spread to dependent formulas, so find the first one and fix it there.

For where this goes next, read [Excel Formulas That Do Real Work](/guides/excel-formulas-that-do-real-work) and [Excel Pivot Tables and Charts](/guides/excel-pivot-tables-and-charts). When one spreadsheet no longer holds the data, see [Spreadsheets to SQL to Pipelines](/guides/spreadsheets-to-sql-to-pipelines).
