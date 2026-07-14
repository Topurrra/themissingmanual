---
title: "What Power BI Actually Is & Getting Set Up"
guide: "power-bi-from-zero"
phase: 1
summary: "What Power BI actually does under the hood (it's a database with a report on top, not a fancier Excel chart), and how to install Power BI Desktop and get oriented before touching a single visual."
tags: [power-bi, beginner, getting-started, business-intelligence, power-bi-desktop, data-analytics]
difficulty: beginner
synonyms: ["what is power bi", "power bi for beginners", "how to install power bi desktop", "power bi vs excel", "power bi from scratch", "learn power bi", "is power bi free", "power bi desktop vs power bi service"]
updated: 2026-07-14
---

# What Power BI Actually Is & Getting Set Up

If you've only ever seen Power BI over someone's shoulder, it probably looked like Excel that grew extra chart types. That's the wrong mental model, and it's the one that trips people up for months. Power BI is not a charting tool. It's a small, self-contained analytics database with a report sitting on top of it - and once that clicks, everything else in this guide (relationships, DAX, refresh) stops feeling like arbitrary rules and starts feeling like the obvious way a database-with-a-report-on-top would have to work.

## The mental model: three layers, one file

Every Power BI report, no matter how simple, is really three layers stacked on top of each other:

1. **Get & transform (Power Query).** You pull data in from somewhere - a CSV, a SQL database, a SharePoint list - and clean it up: rename columns, fix types, remove junk rows. This happens *before* anything is stored.
2. **The data model.** The cleaned tables land in an actual in-memory database, compressed and columnar (it's called **VertiPaq**, and you'll never type that word again after this paragraph, but knowing it exists explains why a 10-million-row table can open instantly). You define how tables relate to each other here.
3. **Visuals and DAX.** Charts, tables, and cards sit on top and query that in-memory database live, using a formula language called DAX to do the summing, filtering, and comparing.

Here's the part that matters most: **layers 1 and 2 happen once (or on a schedule), and layer 3 happens every time someone looks at the report.** When you click a bar in a chart, Power BI isn't recalculating a spreadsheet - it's firing a query against that compressed in-memory database and getting an answer back in milliseconds. That's why Power BI reports stay fast even over millions of rows, where the equivalent Excel workbook would grind to a halt: Excel recalculates formulas cell by cell; Power BI's engine was built from day one to scan and aggregate huge columns of numbers fast.

This also explains the thing that confuses every Excel refugee: **a Power BI file (`.pbix`) is not "the data with some charts drawn on it."** It's a snapshot of a real database, plus the report that queries it, plus the transformation steps that built it. Change the source data and hit refresh, and the whole thing - model and all - rebuilds from scratch, deterministically, using the steps you defined. Nothing is hand-edited. That determinism is what makes a Power BI report something you can trust and schedule, instead of something you have to babysit.

## Power BI Desktop vs. the Power BI Service

You'll hear "Power BI" used to mean two different things, and separating them now saves confusion later:

| | **Power BI Desktop** | **Power BI Service** |
|---|---|---|
| What it is | A free Windows app you install | A cloud website (app.powerbi.com) |
| What you do there | Build: connect to data, shape it, model it, design reports | Publish, share, schedule refresh, set permissions |
| Cost | Free, no account needed to build | Free tier exists; sharing with others usually needs a Pro/Premium license |
| Where you'll live in this guide | Phases 1-9 | Phases 10-11 |

Think of Desktop as your code editor and the Service as your deployment target. You build and iterate in Desktop, then publish to the Service when the report is ready for other people to see. This guide builds everything in Desktop first and only reaches the Service in phase 10, when publishing and sharing actually matters.

## Installing Power BI Desktop

Power BI Desktop only runs on Windows (there's no native Mac version - Mac users typically run it in a Windows VM or use the Service's browser-based editing for light work). Installation is genuinely uneventful:

1. Go to **powerbi.microsoft.com/desktop** and download it, or
2. Open the **Microsoft Store** on Windows and search "Power BI Desktop."

The Store version is the better default: it updates itself automatically, and Power BI ships monthly feature updates, so you want that on autopilot rather than something you remember to do by hand.

You do **not** need a Microsoft 365 subscription, a work email, or an account of any kind to install Desktop and start building reports with local files. You'll only be prompted to sign in when you try to publish to the Service or connect to an organizational data source later on.

## A first look around

Open Power BI Desktop and you'll land on a mostly blank canvas with a small stack of icons running down the left edge. Three of them are your three layers from before, made literal:

- **Report view** (the default view) - where you drag visuals onto a canvas. This is what people picture when they hear "Power BI."
- **Data view** - a spreadsheet-style look at the actual rows sitting in your model, after Power Query has processed them. Useful for sanity-checking that a column really contains what you think it does.
- **Model view** - a diagram of your tables and how they're connected to each other. This is where phase 4 will spend most of its time.

Recent versions add a fourth icon, **DAX query view**, for writing and running DAX queries directly against the model. You can ignore it for now; it isn't part of the three-layer mental model and you won't need it in this guide.

There's a fifth, easy-to-miss entry point: **Get Data**, front and center on the Home ribbon. This is where Power Query lives - it's the door into layer 1, and it's the very first thing you'll click in phase 2.

Before moving on, click around Report, Data, and Model view a few times, even with nothing loaded yet. The goal isn't to learn buttons - it's to get the three-layer model to stop being an idea on a page and start being three tabs you can point at.

## Why the "spreadsheet with extra steps" instinct leads you astray

It's worth stating plainly, because it will save you real pain later: if you treat Power BI like Excel - typing formulas directly into cells, hard-coding a number here and there to make a chart look right - you will hit a wall the moment your data needs to be refreshed, or the moment two people need to look at the same report and get the same answer. Every value on a Power BI report should trace back to a repeatable step: a Power Query transformation, a relationship, or a DAX formula - never a manual edit. That's not a style preference. It's the difference between a report you can refresh with one click in a year and one you'll be secretly afraid to touch.

Keep that rule in your back pocket. Every phase from here builds toward it: get the data in cleanly (phase 2-3), model it correctly (phase 4), calculate with DAX instead of hard-coded numbers (phases 5-7), and only then does the visual layer even enter the picture (phase 8-9).

## Recap

1. Power BI is a small in-memory analytics database (Power Query loads it, VertiPaq stores it) with a live-querying report layer on top - not a spreadsheet with nicer charts.
2. **Desktop** is where you build (free, install locally); the **Service** is where you publish and share (needs a license to share with others).
3. Report, Data, and Model view are the three layers of the mental model made into clickable tabs.
4. The rule that will save you months of pain: every number on the report should come from a repeatable step, not a manual edit.

## Quick check

Test yourself on the idea that matters most here - that Power BI is a live-querying database, not a spreadsheet with charts drawn on it:

```quiz
[
  {
    "q": "When you click a bar in a Power BI chart to filter the report, what actually happens?",
    "choices": [
      "Power BI recalculates every cell in the underlying spreadsheet, like Excel would",
      "Power BI fires a query against the compressed in-memory model (VertiPaq) and gets an answer back",
      "Nothing - visuals are static images generated once at publish time",
      "Power BI re-runs the Power Query steps from scratch to rebuild the data"
    ],
    "answer": 1,
    "explain": "Layer 3 (visuals) queries the already-built in-memory model live; it doesn't touch Power Query or recalculate cell by cell the way Excel does, which is why it stays fast even over millions of rows."
  },
  {
    "q": "You want to build a Power BI report using only a local CSV file, on your own machine. Do you need a Microsoft 365 subscription or account?",
    "choices": [
      "Yes, Power BI Desktop requires sign-in before you can open it",
      "No - Desktop needs no account for building with local files; sign-in is only required to publish to the Service or connect to organizational data",
      "Only if the CSV has more than a few thousand rows",
      "Yes, but only a free Microsoft account, not a paid subscription"
    ],
    "answer": 1,
    "explain": "Desktop is free to install and use for local work with no account; the Service (and organizational data sources) is where sign-in comes into play."
  },
  {
    "q": "A number on your report looks slightly wrong, and the deadline is in ten minutes. Why is manually typing over the value in a text box a bad fix, even if it's tempting?",
    "choices": [
      "It isn't a bad fix - as long as the number looks right now, how you got there doesn't matter",
      "It breaks the report's determinism: every value should trace back to a Power Query step, a relationship, or a DAX formula, or the report can't be trusted or refreshed safely",
      "Power BI doesn't allow manual text edits on top of visuals at all",
      "It only matters for reports with more than one page"
    ],
    "answer": 1,
    "explain": "A Power BI report is supposed to rebuild identically from its source data and defined steps every time you hit refresh; a hand-edited value breaks that guarantee and turns the report into something you have to babysit instead of trust."
  }
]
```

---

[Phase 2: Connecting to Data Sources →](02-connecting-to-data-sources.md)
