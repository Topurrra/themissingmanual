---
title: "Where Everyone Starts: Spreadsheets"
guide: "spreadsheets-to-sql-to-pipelines"
phase: 1
summary: "Spreadsheets win because they're visible, flexible, and instant - and they break on size, missing types, copy-paste errors, no single source of truth, and manual steps that can't be repeated."
tags: [spreadsheets, excel, google-sheets, data-analytics, beginner-friendly]
difficulty: beginner
synonyms: ["why are spreadsheets so popular", "what are spreadsheets bad at", "limits of excel", "when does a spreadsheet break", "spreadsheet problems"]
updated: 2026-07-10
---

# Where Everyone Starts: Spreadsheets

Open a spreadsheet and there's your data, right in front of you - a grid you can click, sort, color, and
fix on the spot. No setup, no login, no waiting. This is why it's the most-used data tool on Earth - 
starting there isn't a beginner's mistake. For a huge amount of real work, a spreadsheet is exactly the
right answer.

The skill that actually matters isn't avoiding spreadsheets. It's knowing the precise moments they stop
serving you - so you can move up *before* a deadline or a broken report forces your hand.

## Why spreadsheets are genuinely great

**You can see everything.** The data is the interface. There's no hidden layer between you and the
numbers - what you see is what you've got. For exploring a new dataset, spotting an obvious outlier, or
showing a colleague "look, here," nothing beats it.

**They're endlessly flexible.** A cell can hold a number, a word, a date, a formula, or a note to
yourself. You can restructure on a whim - insert a column, jot a comment, paste a chart next to the
table. The tool never tells you "no."

**They're instant.** Type a formula, see the answer. Change a number, watch everything recalculate. That
tight feedback loop is genuinely powerful for thinking through a problem.

💡 **Key point.** A spreadsheet's strengths - visible, flexible, instant - are exactly what make it the
right tool for small, exploratory, one-person, one-time work. Hold onto that. It's the same yardstick
you'll use to know when you've outgrown it.

## Where spreadsheets quietly break

None of the following means spreadsheets are bad. It means they have a *range*, and past that range the
very flexibility that helped you starts working against you.

### Size limits

A spreadsheet keeps everything in memory and re-runs every formula on every change. That's why it feels
instant at small sizes - and why it crawls, then chokes, as rows pile up. There's even a hard ceiling.

```text
   Excel:         max 1,048,576 rows per sheet   (source: Microsoft docs)
   Google Sheets: max 10,000,000 cells per file  (source: Google docs)
```

*What just happened:* Those aren't "slows down around here" numbers - they're walls. Hit them and the
tool refuses more data. You'll feel pain long before the wall, too: a sheet with a few hundred thousand
rows and a column of lookups can take seconds to recalc on every edit.

### No real types

In a database, a column is *declared* - "this column holds dates, and nothing else." A spreadsheet makes
no such promise. Every cell decides its own type, and the tool guesses.

```text
   A column you think is "dates":

   2026-03-01      ← stored as a date
   3/1/2026        ← stored as a date, different format
   March 1         ← stored as TEXT (no year, can't sort)
   '2026-03-01     ← leading apostrophe → stored as TEXT
```

*What just happened:* Four cells that all look like the same date to you are four different things to the
spreadsheet. Sort that column and the text rows scatter to the wrong place. Sum a "number" column where
one cell is secretly text, and it silently leaves that row out - no guard rail, because there's no
declared type.

⚠️ **The gotcha that eats real data.** Spreadsheets auto-convert anything that *looks* like a number or
date. A gene name like `SEPT2` becomes the date "September 2." A part number `00123` loses its leading
zeros and becomes `123`. This is so common that scientists renamed human genes to stop spreadsheets from
corrupting them (source: HUGO Gene Nomenclature Committee, 2020). If your IDs or codes matter exactly as
written, the spreadsheet is silently rewriting them.

### Copy-paste errors

Because the data and the formulas live in the same grid, one stray paste or one dragged-too-far formula
can quietly break a calculation - and there's nothing to catch it. A famous economics paper's
conclusions were undone when a formula was found to have skipped five rows of a selected range (source:
Herndon, Ash & Pollin, 2013). The error wasn't exotic. It was a range that didn't cover all the data - 
the most ordinary spreadsheet mistake there is.

```text
   =AVERAGE(B2:B15)     ← you meant B2:B20, dragged the box too short
                          → the answer is wrong, and nothing warns you
```

*What just happened:* The formula ran perfectly. It averaged exactly what you told it to - which wasn't
what you meant. Spreadsheets do exactly as asked, and "as asked" is easy to get subtly wrong by hand.

### No single source of truth

The moment a spreadsheet matters, it multiplies. Someone emails `budget_final.xlsx`. Someone replies
with `budget_final_v2.xlsx`. A third person edits the copy in their Downloads folder. Now there are three
"truths" and no way to know which is current.

```text
   budget.xlsx
   budget_final.xlsx
   budget_final_v2.xlsx
   budget_final_USE_THIS_ONE.xlsx      ← which number is real?
```

*What just happened:* Each copy drifted independently. With files, "the latest version" is a hope, not a
guarantee. Shared cloud sheets help - one file, many editors - but they trade the version problem for a
new one: two people editing the same cell, with the last save quietly winning.

### Manual means unrepeatable

This is the deepest one. The work in a spreadsheet lives partly in the file and partly in *your head* - 
the steps you did by hand. "Paste the new data here, delete the blank rows, fix the date column, drag the
formula down, refresh the chart." Next month you have to remember and redo all of it, perfectly.

```text
   Every Monday, by hand:
     1. download this week's export
     2. paste into the sheet
     3. clean the date column
     4. drag formulas down
     5. update the chart range
     6. email the result

   ← miss one step, or do it slightly differently, and the report is wrong
```

*What just happened:* Nothing was recorded. The process exists only as a habit, which means it can't be
trusted to run the same way twice, can't be handed to a teammate cleanly, and stops entirely the week
you're on vacation. A spreadsheet stores *results*, not *the steps that produced them*.

## So when do you move up?

You move up when the work crosses one of those lines - not before. As a quick read:

| The pain you're feeling | What it's telling you |
|---|---|
| The file is slow, or you're near the row limit | Size has outgrown the sheet |
| IDs or dates keep getting mangled | You need real, declared types |
| Numbers don't match and nobody knows which file is right | You need one shared source of truth |
| You redo the same steps every week, by hand | The work needs to be automated |

The first three point you toward a **database and SQL** - Phase 2. The last one, once a database is in
place, points toward a **pipeline** - Phase 3. We'll take them in that order, because that's the order
the pain usually arrives.

## Recap

1. Spreadsheets win at being **visible, flexible, and instant** - perfect for small, exploratory,
   one-person work.
2. They break on **size** (real, hard row/cell limits), **no real types** (cells guess, and auto-convert
   your IDs and dates), and **copy-paste errors** (formulas do exactly as asked, which is easy to get
   wrong).
3. They break on **no single source of truth** (files multiply and drift) and on being **manual**
   (the steps live in your head, so the work can't be repeated reliably).
4. You graduate when the work crosses one of those lines - and the *which line* tells you *where* to go
   next.

Next: the tool built precisely for the first three pains - a database, and the language you ask it
questions in.

---

[← Guide overview](_guide.md) · [Phase 2: Outgrowing the Sheet - SQL & Databases →](02-outgrowing-the-sheet-sql-and-databases.md)
