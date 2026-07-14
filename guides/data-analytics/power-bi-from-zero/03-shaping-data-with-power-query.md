---
title: "Shaping Data with Power Query"
guide: "power-bi-from-zero"
phase: 3
summary: "How to turn messy, real-world spreadsheets and exports into clean tables Power BI can model - Power Query's Applied Steps, the core transforms (unpivot, split, merge, append), and why query folding matters."
tags: [power-bi, power-query, etl, data-cleaning, m-language, query-folding, data-analytics]
difficulty: beginner
synonyms: ["power query tutorial", "how to clean data in power bi", "power query applied steps explained", "unpivot columns power bi", "power query merge vs append", "power query M language basics", "query folding explained", "power bi wide to long data", "power query remove duplicates", "power bi split column by delimiter"]
updated: 2026-07-14
---
# Shaping Data with Power Query

Phase 2 got data into Power BI. This phase is about the step almost nobody's spreadsheet is ready for on arrival: real data has merged header rows, a "Q1 Sales" column next to a "Q2 Sales" column instead of a proper date, trailing spaces, numbers stored as text, and three duplicate rows nobody noticed. Power Query is where you fix all of that - and the mental model behind it is the thing that makes everything downstream (the model, DAX, refresh) actually trustworthy.

## The mental model: a recorded script, not a one-time cleanup

**What it actually is.** When you click "Remove Duplicates" or "Split Column" in the Power Query Editor, Power BI doesn't quietly change your data once. It appends a step to a list, visible in the **Applied Steps** pane on the right, and writes that step in a language called **M**. Every transform you've ever clicked is sitting there as an ordered, named, editable step.

**Why this exists.** Your source data is never touched. Power Query reads it fresh every time you hit Refresh, then replays the *entire list of steps* from scratch, in order. That's what "repeatable" from phase 1 actually means in practice: you're not cleaning a spreadsheet once, you're writing a small program that cleans *whatever the source looks like next month*, automatically, the same way every time.

This has a very practical consequence: **order matters, and steps can break.** If you rename a column in step 3 and a later step still refers to the old name, refresh fails with a red error - not a silent wrong answer. That's a feature, not a bug. It's the same "compiler catches it before it ships" trade you saw with Power BI's determinism in phase 1, just applied to data cleaning instead of a formula.

📝 **Terminology.** The **Applied Steps** pane lists your transforms top to bottom, each one a checkpoint you can click to preview the data *at that point*. The **Advanced Editor** (Home → Advanced Editor) shows the same steps as raw M code - useful once you want to see what a click actually generated, or to hand-edit something the UI can't reach.

## A worked example: from wide export to tidy table

Say a source export looks like this - one row per product, one column per month, the classic shape a spreadsheet produces and a data model can't use directly:

| Product | Jan | Feb | Mar |
|---|---|---|---|
| Widget | 120 | 95 | 140 |
| Gadget | 60 | 70 | 55 |

Walk through the transforms that get this into model-ready shape.

**1. Fix data types first.** Every column has a little type icon (`ABC`, `123`, calendar) in its header. Power Query often guesses wrong - a `Product Code` column of `001`, `002` gets auto-detected as a number and silently drops the leading zero. Set types explicitly, right after import, before anything else touches the column. This one habit prevents a disproportionate share of "why is my total wrong" bugs later.

**2. Unpivot the month columns.** This is the single most useful transform in Power Query, and the one most beginners don't know exists. Select the `Product` column (the one you want to *keep*), right-click → **Unpivot Other Columns**, and Power Query turns your wide table into a tall one:

| Product | Attribute | Value |
|---|---|---|
| Widget | Jan | 120 |
| Widget | Feb | 95 |
| Widget | Mar | 140 |
| Gadget | Jan | 60 |
| Gadget | Feb | 70 |
| Gadget | Mar | 55 |

Rename `Attribute` to `Month` and `Value` to `Sales`, and you now have one row per fact - exactly the shape a data model (and DAX) wants. A wide table can't grow new months without a schema change; a tall one just gets more rows. This is also why a fresh export next quarter with a `Apr` column added doesn't break anything downstream - because you pinned `Product` and melted *everything else*, unpivot picks up whatever month columns exist. (Had you instead selected the months and chosen plain **Unpivot Columns**, Power Query would hardcode that `Jan`/`Feb`/`Mar` list, and `Apr` would arrive as a stray un-melted column.)

**3. Split, trim, and replace.** `Split Column by Delimiter` breaks `"Smith, John"` into two columns on the comma. `Trim` and `Clean` (under Transform → Format) strip stray whitespace and non-printing characters that make two visually-identical values fail to match later. `Replace Values` fixes known bad data - `"N/A"` becoming a real null, for instance.

**4. Filter rows and remove duplicates early.** Do this near the top of your steps, not the bottom. Every step downstream processes fewer rows if junk rows are gone first - and on large sources, this can be the difference between a five-second refresh and a five-minute one.

## Merge vs. Append: the two ways to combine queries

These get confused constantly because both involve two queries, but they answer completely different questions.

| | **Merge** | **Append** |
|---|---|---|
| Answers | "Add *columns* from another table" | "Add *rows* from another table" |
| SQL equivalent | JOIN | UNION ALL |
| Use it when | You have a `Sales` table and a `Products` table and want product names on the sales rows | You have `Sales_Jan.csv` and `Sales_Feb.csv` and want them as one table |
| Needs | A matching key column in both tables | The same column structure in both tables |

**Merge** is how you'd bring a lookup table's columns onto your fact rows *before* modeling - though more often (as phase 4 covers) you leave tables separate and use a relationship instead of merging, because a relationship stays live and a merge is a one-time flattening. **Append** is exactly what you want for "twelve monthly export files that are really one table" - point Power Query at the folder, and Append stacks them.

## Seeing the M code, and why query folding matters

Open the Advanced Editor on any query and you'll see something like this - the actual program your clicks wrote:

```m
let
    Source = Csv.Document(File.Contents("C:\data\sales.csv")),
    ChangedType = Table.TransformColumnTypes(Source,
        {{"Product", type text}, {"Jan", Int64.Type}, {"Feb", Int64.Type}}),
    Unpivoted = Table.UnpivotOtherColumns(ChangedType, {"Product"},
        "Month", "Sales")
in
    Unpivoted
```

Each `let` line is one Applied Step, in order, each one built on the last. You never need to write M by hand for ordinary cleanup - the UI generates this for you - but recognizing it removes the mystery, and it's the only way to fix the rare step the UI itself can't undo cleanly.

**Query folding** is the performance idea worth knowing early: when your source is a real database (SQL Server, Postgres, a warehouse), Power Query tries to translate your steps into a single query and run it *on the source*, pulling back only the final, already-filtered, already-aggregated result. Filter, remove-columns, and group-by steps usually fold. A custom M function, or a step that mixes two different data sources, usually doesn't - and once folding breaks, every step after it runs locally, row by row, in Power BI instead of on the server. You can check whether a step still folds by right-clicking it: if "View Native Query" is available, it's still folding. For small local files this never matters. For a multi-million-row database table, it's the difference between a refresh that takes seconds and one that times out.

## Recap

1. Power Query records every transform as an ordered, named **Applied Step**, written in **M**, replayed in full on every refresh - your source data is never touched.
2. Set data types explicitly and early; a wrong auto-detected type is the most common silent-bug source.
3. **Unpivot** turns wide spreadsheet exports (one column per period) into the tall, one-row-per-fact shape a data model needs.
4. **Merge** adds columns (a join); **Append** adds rows (a union) - don't confuse them.
5. **Query folding** pushes your steps back to the source database when possible; it's why the same transforms can be instant on a database and slow on a giant local file.

## Quick check

Test yourself on the two ideas that trip people up most: what refresh actually does, and Merge vs. Append.

```quiz
[
  {
    "q": "When you hit Refresh in Power BI, what does Power Query actually do?",
    "choices": [
      "Re-reads the source fresh and replays every Applied Step from scratch, in order",
      "Directly edits and overwrites the original source file with the cleaned version",
      "Applies only the newest step to the data that's already loaded",
      "Skips any step that didn't change the row count last time"
    ],
    "answer": 0,
    "explain": "Your source is never touched - refresh re-reads it and replays the entire ordered list of Applied Steps every time, which is why a renamed column upstream can break a later step."
  },
  {
    "q": "A monthly export has one column per month (Jan, Feb, Mar...). Why is Unpivot the fix, rather than just leaving it as-is?",
    "choices": [
      "It deletes any column that contains duplicate values",
      "It turns the wide, one-column-per-period layout into a tall, one-row-per-fact table, so a new month just adds rows instead of needing a new column",
      "It automatically detects and fixes wrong data types",
      "It merges the export with a lookup table"
    ],
    "answer": 1,
    "explain": "A data model wants one row per fact. Unpivot reshapes wide-by-period data into that tall shape, so next quarter's new column doesn't require touching the query at all."
  },
  {
    "q": "You have a Sales table and a Products table sharing a ProductID column, and you want product names added onto each sales row. Merge or Append?",
    "choices": [
      "Append, because you're combining two tables into one",
      "Merge, because you're adding columns from another table based on a matching key",
      "Unpivot, because the two tables have different shapes",
      "Either works the same way here"
    ],
    "answer": 1,
    "explain": "Merge is a join - it adds columns using a matching key. Append is a union - it stacks rows from tables with the same columns, like twelve monthly files that are really one table."
  }
]
```

---

[← Phase 2: Connecting to Data Sources](02-connecting-to-data-sources.md) · [Phase 4: The Data Model & Relationships →](04-the-data-model-and-relationships.md)
