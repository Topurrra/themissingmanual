---
title: "Logic: IF, IFS, AND, OR, and IFERROR"
guide: "excel-formulas-that-do-real-work"
phase: 2
summary: "Make a cell decide with IF and IFS, combine tests with AND and OR, and learn exactly when IFERROR turns a loud error into a silent wrong number and what to use instead."
tags: [excel, if, ifs, and, or, iferror, ifna, error-handling]
difficulty: intermediate
synonyms: ["how to use ifs in excel", "nested if vs ifs", "excel if and or together", "when to use iferror", "iferror hides errors", "excel ifna vs iferror", "excel if statement multiple conditions"]
updated: 2026-10-06
---

# Logic: IF, IFS, AND, OR, and IFERROR

Soon after lookups, spreadsheets need decisions: flag the big orders, label the tiers, show a message instead of an error. The functions are short. The skill is in the order you write the tests, and in knowing that the most popular helper, `IFERROR`, can hide a bug for months.

Keep the Orders sheet from phase 1: column `G` is Unit Price, `H` is Total (`=E2*G2`). The totals for orders 1001 to 1008 are `240, 200, 300, 210, 120, 220, 600, 90`.

## IF: one yes/no decision

```excel
=IF(logical_test, value_if_true, value_if_false)
```

Label an order "Bulk" when the quantity is 5 or more:

```excel
=IF(E2>=5, "Bulk", "Regular")
```

Only order 1002 (quantity 5) says `Bulk`; the other seven say `Regular`. Text results go in quotes. Comparisons with `=` ignore upper and lower case, so `F2="east"` is true for `East`.

## IFS: several tests in order

Nesting `IF` inside `IF` gets unreadable. `IFS` (Excel 2019 and newer) takes pairs of test and result:

```excel
=IFS(H2>=500, "Large", H2>=200, "Medium", TRUE, "Small")
```

Excel checks the tests **from left to right and returns the result of the first one that is true**. The final `TRUE, "Small"` is the standard way to write a default. Without it, a row that matches nothing returns `#N/A`.

| OrderID | Total | Result |
|---|---|---|
| 1001 | 240 | Medium |
| 1002 | 200 | Medium |
| 1005 | 120 | Small |
| 1007 | 600 | Large |

Because the first true test wins, **order matters**. Swap the first two tests:

```excel
=IFS(H2>=200, "Medium", H2>=500, "Large", TRUE, "Small")
```

Now order 1007 (`600`) is `Medium`, because `600>=200` is true and Excel never reaches the `500` test. Write the strictest test first.

## AND and OR

`AND` is true only when **every** test is true. `OR` is true when **at least one** is. Each returns `TRUE` or `FALSE`, so they usually live inside an `IF`.

```excel
=IF(AND(F2="East", H2>=250), "Review", "OK")
```

Flags East orders worth 250 or more. Of the four East orders (1001: 240, 1003: 300, 1006: 220, 1008: 90), only 1003 says `Review`. Order 1007 is worth 600 but is West, so it says `OK`.

```excel
=IF(OR(E2>=5, H2>=500), "Priority", "Normal")
```

Order 1002 qualifies by quantity and order 1007 by total; both say `Priority`, and the other six say `Normal`.

## IFERROR: handle the error, or hide the bug

```excel
=IFERROR(value, value_if_error)
```

If `value` evaluates to an error, you get `value_if_error`; otherwise you get `value`. It catches every error type: `#N/A`, `#VALUE!`, `#REF!`, `#DIV/0!`, `#NUM!`, `#NAME?`, and `#NULL!`.

That last sentence is the problem. `#N/A` from a lookup that found nothing is an expected situation. `#REF!` from a broken column number is a mistake in your formula. IFERROR treats them the same and shows your fallback for both.

Here is a real trap. Someone writes the price lookup this way:

```excel
=IFERROR(VLOOKUP(D2, Products!$A$2:$D$7, 5, FALSE), 0)
```

The range has only 4 columns, so the `5` makes VLOOKUP return `#REF!` on every row. IFERROR swallows it. Every price becomes `0`, every order total becomes `0`, and the sheet shows no error at all. A bare formula would have shown `#REF!` in the first cell and you would have fixed it in seconds.

Safer habits:

- **Handle only the expected case.** For a lookup, use XLOOKUP's built-in `if_not_found`, which fires only when the key is missing: `=XLOOKUP(D2, Products!$A$2:$A$7, Products!$D$2:$D$7, "CHECK SKU")`.
- **Use `IFNA(value, value_if_na)`** when you need to wrap an older lookup. It replaces only `#N/A` and lets every other error through, so a broken column number still shouts.
- **Make the fallback visible.** A fallback of `0` blends into real numbers; text like `"CHECK SKU"` stands out and breaks later math loudly instead of quietly.
- **Prefer an explicit guard for known edge cases.** For a possible blank quantity: `=IF(E2="", "", H2/E2)` instead of wrapping the division in IFERROR.

Use IFERROR when you truly mean "any failure here is fine", for example a cosmetic display cell nothing else depends on. For anything feeding totals, aim at the one error you expect.

## Your turn: predict the result

```exercise
[
  {
    "type": "predict",
    "task": "Order 1007 has a total of 600. What does =IFS(H2>=200, \"Medium\", H2>=500, \"Large\", TRUE, \"Small\") return for it? Answer with the single word.",
    "accept": ["Medium"],
    "hint": "IFS returns the result of the FIRST true test, reading left to right. Is 600 >= 200?"
  },
  {
    "type": "predict",
    "task": "Order 1005 is West, quantity 1, total 120. What does =IF(OR(E2>=5, H2>=500), \"Priority\", \"Normal\") return? Answer with the single word.",
    "accept": ["Normal"],
    "hint": "OR needs at least one true test. Is 1 >= 5? Is 120 >= 500?"
  }
]
```

Check yourself before moving on:

```quiz
[
  {"q": "A price lookup is wrapped as IFERROR(VLOOKUP(...), 0) and a typo in the column number makes it return #REF! on every row. What does the sheet show?", "choices": ["A circular reference warning", "Only the first row is wrong", "#REF! in every row", "0 in every row, with no error visible"], "answer": 3, "explain": "IFERROR catches every error type, including #REF!, so the real bug is replaced by the fallback value 0.", "why": ["Nothing in the formula refers to its own cell.", "The mistake affects every row the same way.", "That is what you would see without IFERROR.", null]},
  {"q": "Which choice replaces only #N/A and lets other errors through?", "choices": ["IFERROR", "IFNA", "IFS", "AND"], "answer": 1, "explain": "IFNA(value, value_if_na) only handles #N/A. IFERROR handles all error types."},
  {"q": "In an IFS formula the tests are H2>=200 then H2>=500. A total of 600 returns the result for which test?", "choices": ["Both results, joined together", "An error, because the tests overlap", "The second test, because 600 is larger", "The first test, because IFS returns the first true one"], "answer": 3, "explain": "IFS stops at the first true test. Put the strictest condition first."}
]
```

## Recap

1. `IF(test, if_true, if_false)` decides one thing; `IFS` takes test and result pairs and returns the first true one, so strictest test first and `TRUE` as the default.
2. `AND` needs all tests true; `OR` needs one.
3. `IFERROR` catches every error type, so it can turn a broken formula into a plausible-looking `0`.
4. Prefer XLOOKUP's `if_not_found`, `IFNA`, or an explicit `IF` guard, and make fallbacks visible.

Next up, [Phase 3: Conditional Totals](03-conditional-totals.md): adding up only the rows that match.
