---
title: "Connecting to Data Sources"
guide: "power-bi-from-zero"
phase: 2
summary: "How does Power BI actually get your data in, and why does the connection mode you pick (Import vs DirectQuery vs Live Connection) quietly decide how the rest of the report behaves?"
tags: [power-bi, data-sources, get-data, import-vs-directquery, connectors, data-analytics]
difficulty: beginner
synonyms: ["power bi get data", "power bi import vs directquery", "how to connect power bi to excel", "power bi connect to sql server", "power bi live connection vs import mode", "power bi data source settings", "power bi connect to web api", "power bi connector list"]
updated: 2026-07-14
---

# Connecting to Data Sources

Before you can shape data, model it, or write a single DAX formula, Power BI needs to know two things: *where* your data lives, and *how* it should talk to it. That second part is the one beginners skip past, and it's the one that comes back to bite them. The connector you pick and the mode you connect in decide, right at the start, how fast your report will feel, whether it shows live numbers or a snapshot, and how much you can reshape the data later. Get this phase right and everything downstream is easier.

## What "connecting" actually means

**What it actually is.** Connecting means Power BI reaches out to a source system (a file, a database, a web service) and asks two questions: "what data do you have?" and "how do I fetch it?" It doesn't necessarily copy that data into itself right away - what happens next depends entirely on the mode you choose. This is a genuinely different idea from opening a file in Excel, where the data is just *there* the moment you open it. In Power BI, "connect" and "load the data in" are two separate steps, and understanding that split is the key to this whole phase.

**Why this exists.** Real organizations don't keep their data in one tidy spreadsheet. It's scattered across Excel files on someone's laptop, a SQL Server database the IT team runs, a folder of CSV exports, a SaaS tool's API. Power BI's job is to be the one tool that can reach into all of them without you learning a different language for each. Under the hood, every connector - Excel, SQL Server, a REST API, a SharePoint list - funnels into the same engine: Power Query, which you'll meet properly in the next phase. Connecting is just Power Query's front door.

## Get Data: the front door

Everything starts at **Home → Get Data** in Power BI Desktop. You'll see a search box and a long list of connectors, grouped by category: Files (Excel, CSV, PDF, folder), Database (SQL Server, PostgreSQL, MySQL, Oracle...), Power Platform, Azure, Online Services (SharePoint, Salesforce, Google Analytics...), and a catch-all "Other" that includes Web and Blank Query. There are well over 100 connectors, but you'll live in maybe five of them: Excel, a database connector, Web, Folder, and SharePoint.

Picking a connector isn't just picking a file format. Each connector knows the *shape* of its source - a SQL connector can ask a database for just one table's schema without pulling any rows yet; a Web connector has to actually fetch the page or API response to see what's there. That difference matters once you're connecting to something large: some connectors let you preview cheaply, others don't.

## The real fork in the road: Import vs DirectQuery vs Live Connection

This is the decision that actually deserves your attention in this phase - more than which specific connector you pick.

**What it actually is.** When you connect to most sources, Power BI asks how you want the data to reach your report:

- **Import** - Power BI copies the data into its own compressed in-memory model, right now. Your report queries that copy, not the original source.
- **DirectQuery** - Power BI stores no data. Every time a visual needs numbers, it sends a live query back to the source and waits for the answer.
- **Live Connection** - a special case, used with Analysis Services / an existing Power BI semantic model (renamed from "dataset" in late 2023, so older docs and menus may still say dataset): you connect to someone else's already-built data *model*, not raw tables, and can't add your own new tables to it.

**Why this exists.** These aren't three flavors of the same thing - they trade off completely different things:

| | Import | DirectQuery |
|---|---|---|
| Speed | Very fast - queries hit an in-memory model | As slow as the source database |
| Freshness | A snapshot, only as fresh as your last refresh | Always current, live at click time |
| Data size | Limited by available RAM / your Power BI capacity | Limited only by the source database |
| Power Query transforms | Full power, all steps run at refresh time | Restricted - fewer transforms allowed |
| Offline use | Works without a live connection to the source | Needs the source reachable at all times |

**Why people get this wrong.** DirectQuery *sounds* better - "always live data!" - so beginners reach for it by default. In practice, most reports should default to **Import**. It's dramatically faster (Power BI's engine is built to crunch millions of rows in memory), it works offline, and it doesn't hammer a production database every time someone opens a dashboard. Reach for DirectQuery only when the data is too big to import, changes by the second, or a security policy forbids copying it out of the source. You'll set up scheduled refresh (phase 11) to keep an Import model current - that's the normal way Power BI handles "I want fresh numbers," not DirectQuery.

💡 **Key point.** You can mix modes across tables in one model (**Composite mode**), but that's an advanced move - as a beginner, pick Import for the whole report unless you have a specific reason not to.

## A worked example: connecting to an Excel workbook

Say you have `Sales.xlsx` with a `Transactions` sheet. Walk through it:

1. **Home → Get Data → Excel workbook**, browse to the file.
2. The **Navigator** window opens, showing every sheet and named table in the file with a checkbox and a live preview pane on the right.
3. Tick `Transactions`. The preview confirms it looks like the table you expect - headers in the first row, no stray merged cells.
4. Two buttons: **Load** and **Transform Data**. Click **Transform Data**, not Load, almost every time - it opens Power Query Editor *before* anything lands in your model, so you can fix column types, remove a junk header row, or split a column first. Loading straight in and cleaning up after is the harder way to work.

*What just happened:* Power BI didn't load anything until you told it to. The Navigator step only reads the file's *structure* (sheet names, a preview) - the actual import happens when you hit Load or Transform Data. That lazy behavior is Power Query underneath, and it's why you can connect to a source with a billion rows and still get an instant preview: it only asks for a sample.

## A worked example: connecting to a database

For SQL Server: **Get Data → SQL Server database**, enter the server name and (optionally) a database name, then choose **Import** or **DirectQuery** right there in the dialog - this is the one moment that choice gets made. You'll then hit a credentials prompt: Windows auth, a database login, or an organizational account, depending on how the server's configured. Once connected, the Navigator shows every table and view in the database - tick the ones you need, or write a custom SQL query in **Advanced options** if you only want a specific slice (useful for cutting a huge table down before it ever reaches Power BI).

```sql
-- example custom query, pasted into Get Data's Advanced options
SELECT OrderID, CustomerID, OrderDate, Total
FROM Orders
WHERE OrderDate >= '2024-01-01'
```

*What just happened:* that query runs on the SQL Server itself, and only the results come back to Power BI - filtering at the source instead of importing everything and filtering later is almost always faster.

## Connecting to a web source

**Get Data → Web**, paste a URL. For a public API returning JSON, Power BI fetches the response and, if it's structured data, offers to turn it straight into a table. For a plain webpage, it detects any HTML tables on the page and lets you pick one from the Navigator - genuinely useful for pulling, say, a public data table off a government site without copy-pasting cells by hand.

⚠️ **The "it worked once, now it's broken" trap.** A Web or folder connection depends on something outside Power BI's control - a URL staying valid, a folder keeping the same file names. When a refresh suddenly fails, check the source first before you suspect Power BI. This is also why credentials and privacy levels (Home → Data source settings) matter: a connection that worked interactively on your machine can still fail on a scheduled refresh if the stored credentials expired or the privacy level blocks combining that source with another.

## Recap

1. **Connecting is a two-part question**: which connector, and which mode (Import, DirectQuery, or Live Connection) - the mode decides speed, freshness, and how you can transform the data later.
2. **Default to Import.** It's faster, works offline, and you refresh it on a schedule rather than querying live. Reach for DirectQuery only when the data's too big or too live to copy.
3. **Get Data → Navigator → Transform Data** is the standard path - preview first, clean in Power Query before it ever loads, don't clean up after.
4. **Push filtering to the source where you can** (a custom SQL query, a Web URL that's already scoped) - it's faster than importing everything and trimming it down inside Power BI.
5. Credentials and data source settings live outside the report file itself - a broken scheduled refresh is often a credentials or source problem, not a Power BI bug.

## Quick check

Test yourself on the idea that matters most in this phase - that the connection mode you pick decides how the report behaves, not just how it connects:

```quiz
[
  {
    "q": "A beginner says: \"DirectQuery is the better default - it's always live, so why would I ever pick Import?\" What's wrong with that reasoning?",
    "choices": [
      "Import is dramatically faster (queries hit an in-memory copy), works offline, and covers 'fresh data' via scheduled refresh - DirectQuery should be reserved for data too big or too live to copy",
      "Nothing - DirectQuery should always be the default for every report",
      "DirectQuery is only for Excel files, so it doesn't apply to most sources anyway",
      "Import can't be refreshed once loaded, so it's always stale"
    ],
    "answer": 0,
    "explain": "DirectQuery sounds better because it's always current, but every visual has to wait on a live query to the source, which is as slow as that source. Import copies the data into a fast in-memory model and you keep it current with scheduled refresh - that's the normal path, not DirectQuery."
  },
  {
    "q": "You click Get Data → Excel workbook and the Navigator window opens showing your sheets with a preview. Has Power BI loaded your data into the report yet?",
    "choices": [
      "No - the Navigator only reads the file's structure and a preview sample; the actual import happens when you click Load or Transform Data",
      "Yes - opening the Navigator already copies the full sheet into the model",
      "Yes, but only the first row of each sheet is loaded at this point",
      "No - nothing happens until you close and reopen Power BI Desktop"
    ],
    "answer": 0,
    "explain": "Connecting and loading are two separate steps. The Navigator step only asks the source what it has and shows a preview - it doesn't pull the real data in until you tell it to, which is why you can preview a source with a billion rows instantly."
  },
  {
    "q": "In the Navigator, why click Transform Data instead of Load when connecting to a new source?",
    "choices": [
      "Transform Data opens Power Query Editor before anything lands in the model, so you can fix column types or remove a junk header row before it loads - cleaning up after Load is the harder way to work",
      "Load and Transform Data do the same thing; the button choice is just cosmetic",
      "Transform Data is required for database connectors and skipped for files",
      "Load discards the data permanently, while Transform Data keeps a backup copy"
    ],
    "answer": 0,
    "explain": "Transform Data gets you into Power Query before the data is committed to the model, so fixes happen at the source of the pipeline instead of being bolted on afterward. Loading first and cleaning later just means redoing that work under worse conditions."
  }
]
```

---

[← Phase 1: What Power BI Actually Is & Getting Set Up](01-what-power-bi-actually-is-and-getting-set-up.md) · [Phase 3: Shaping Data with Power Query →](03-shaping-data-with-power-query.md)
