---
title: "Interfaces, Sharing & When It Breaks"
guide: airtable
phase: 3
summary: "Building Interfaces as clean app screens on top of your data, controlling who sees what, the real record and performance limits, and how to tell when you've outgrown Airtable."
tags: [airtable, interfaces, permissions, limits, scaling]
difficulty: beginner
synonyms:
  - "what are airtable interfaces"
  - "airtable record limit per base"
  - "airtable sharing and permissions"
  - "when to leave airtable for a database"
  - "airtable performance slow large base"
updated: 2026-06-30
---

# Interfaces, Sharing & When It Breaks

You've got a base that holds clean, linked data and does work on its own. But
the grid is still the grid - dense, editable, a little intimidating. You don't
want your sales team rearranging fields or your client poking at raw tables.
You want them to see a tidy screen that answers their question and nothing
else. That's what Interfaces are for, and that's where this last phase starts.

## Interfaces: an app on top of your data

An **Interface** is a page you design that sits on top of a base. Same data
underneath - you're building a friendlier front door to it. You drag in
elements: a chart, a list of records, a few number cards at the top, a filter
the user can change, buttons. The result looks like a small app, not a
spreadsheet, and you built it without writing code.

The key thing to hold onto: an Interface is a **view of the data, not a copy
of it.** Someone edits a record through the Interface and the base updates,
the same as if they'd typed in the grid. There's no syncing, no export, no
second source of truth. The Interface is a window; the base is the room.

Typical uses:

- A **dashboard** - charts and big-number cards so a manager sees the state
  of things at a glance, with no way to accidentally break a formula.
- A **record review screen** - pick a deal from a list, see its full detail,
  update a status, leave a comment.
- A **focused workflow** - "here are the requests assigned to you; approve or
  reject each one" - hiding every field that isn't part of that decision.

The same base can carry several Interfaces, each aimed at a different person.
The sales rep gets their pipeline. The exec gets the dashboard. The contractor
gets one screen with only their tasks. Everyone touches the same live data;
nobody sees more than they should.

## Sharing and permissions

Control over who-can-do-what works at a few levels.

| Level | Common roles | What they can do |
|---|---|---|
| Whole base | Owner / Creator | Build tables, fields, automations |
| Whole base | Editor | Change records, not the structure |
| Whole base | Commenter | Comment, not edit |
| Whole base | Read-only | Look, not touch |
| Interface | Per-user / group | See only the Interface, not the raw base |

That Interface row matters most for outsiders. You can share an Interface with
someone and they never see the underlying tables at all - they get the clean
screen and nothing behind it. For one-off external input, a **Form view**
(from the last phase) lets anyone with the link add a record without an
account. And a **shared view link** lets you send a read-only or filtered
slice of a table to someone outside your workspace.

A practical caution: collaborator-level access is what most plans charge for,
per seat. Read-only Interface and form sharing is the cheap way to let lots of
people see or submit data without paying for each of them as an editor. Reach
for that before you start buying seats for everyone who needs a peek.

## The real limits

Airtable is generous until it isn't, and the ceilings are real. The exact
numbers shift with your plan and over time, so treat these as the shape of the
limits rather than gospel - but the shape is what matters for deciding whether
Airtable fits.

- **Records per base are capped**, and the cap scales with your plan - roughly
  a few thousand on the free plan, tens of thousands on paid, into the
  hundreds of thousands on the top tiers. This is the single most important
  number. A base is not built to hold millions of rows.
- **Attachment storage** is metered too; a base full of photos and PDFs eats
  space fast.
- **Performance sags as a base grows.** Big tables with many lookups,
  rollups, and links get noticeably slower to load and edit long before you
  hit the hard record cap. Tens of thousands of heavily-linked records is
  where people start feeling the lag.
- **Automation runs** are rationed monthly, as covered earlier.

None of this is a flaw - it's the trade. Airtable spends performance and scale
to give you a friendly, no-code, multi-view tool. For most internal projects
that trade is the right one for years.

## When to graduate to a real database

Airtable stops being the right tool when your needs cross a few lines. Watch
for these:

- **Scale.** You're approaching the record cap, or the base is sluggish under
  daily use. Millions of rows is a database job, not an Airtable job.
- **High-volume writes.** Thousands of records changing per minute - a busy
  web app's backend, live event data - is past what Airtable is built for.
- **Powering a public product.** If real customers hit it constantly through
  an app or website, you want a proper database (Postgres, MySQL) behind a
  real backend. Airtable's API has rate limits that a public product will
  trip.
- **Strict integrity and complex rules.** When you need guarantees a typical
  spreadsheet-style tool doesn't enforce - transactions, intricate
  validation, audited access - that's database-and-engineer territory.

Here's the clear-eyed framing. Airtable is excellent at being the **operational
hub for a team**: pipelines, content calendars, inventory, project tracking,
applicant lists, anything where a handful to a few hundred people manage
thousands to tens of thousands of records together. It is not the engine for a
consumer product or a data warehouse, and trying to force it into that role is
how you end up fighting the tool.

The graceful path is to let Airtable be the prototype. Build your idea in it
fast, learn what the data and the workflow really need, and run on it as long
as it's comfortable. When you hit the walls above - and you'll feel them
coming - that's your signal to move the heavy part to a real database, often
keeping Airtable around as the friendly internal admin view on top. Knowing
where that line is, before you slam into it, is the difference between a tool
that served you well and a migration you did at 2am.
