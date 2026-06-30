---
title: "Links, Views & Automations"
guide: airtable
phase: 2
summary: "Pulling data across linked tables with lookups and rollups, seeing the same records as a grid, kanban, or calendar, filtering them, and letting automations do routine work."
tags: [airtable, lookups, rollups, views, automations, kanban]
difficulty: beginner
synonyms:
  - "airtable lookup vs rollup"
  - "airtable kanban calendar view"
  - "airtable filter and group records"
  - "airtable automations explained"
  - "how to show linked data in airtable"
updated: 2026-06-30
---

# Links, Views & Automations

In the last phase you linked tables together — Orders point at Customers,
Tasks point at Projects. The link by itself only connects records. The next
three features are what turn that connection into something useful: pulling
information across the link, looking at your records in whatever shape fits
the job, and getting the base to act on its own.

## Lookups and rollups: borrowing data across a link

Once an Order is linked to a Customer, you often want the customer's email to
*show up on the order* — not retyped, but pulled live from the linked record.
That's a **Lookup** field. You point it at the link and say "show me the
Email from the linked Customer." It reads through the link and displays the
real value. Change the email on the Customer record and the lookup updates
everywhere it appears. You're seeing one fact in many places without
duplicating it.

A **Rollup** is the same idea, but it *summarizes* many linked records into
one number. Open a Customer and you want their total spend across all orders.
The rollup looks at every linked Order, grabs the Total field from each, and
adds them up.

| You want | Use | What it does |
|---|---|---|
| The customer's email shown on the order | Lookup | Pulls one value across the link |
| Total of all this customer's orders | Rollup (sum) | Adds a value across many links |
| How many orders this customer has | Rollup (count) | Counts the links |
| The latest order date | Rollup (max) | Picks one value from many |

Between linked records, lookups, and rollups, you can build something that
feels alive: a Customers table where each row quietly shows total spend, order
count, and last-order date — all calculated from the Orders table, all
current, none of it typed by hand. That's work a spreadsheet does with
fragile formulas you copy down a thousand rows and break by accident.
Airtable does it once, at the field level, and it stays correct.

## Views: same data, different shape

This is the feature people fall in love with. A **view** is a saved way of
looking at one table. The data underneath never changes — you're only
choosing how to see it. One table can have a dozen views, each tuned for a
different person or a different job.

- **Grid** — the spreadsheet you already know. Good default for editing.
- **Kanban** — cards in columns, grouped by a single-select field. Drag a
  deal from `Lead` to `Negotiating` and the field updates. Sales pipelines
  and task boards live here.
- **Calendar** — records placed on dates by a date field. Content calendars,
  deadlines, bookings.
- **Gallery** — big cards with images. Product catalogs, a team directory,
  anything visual.
- **Form** — a fill-in-the-blank form that creates a new record when
  submitted. Share the link and outsiders add data without ever touching
  your base. Intake requests, signups, surveys.

The win is that the *same records* power all of them at once. Your sales team
works the Kanban board. Your ops person reads the Grid. A customer submits the
Form. The calendar shows what's due. Nobody is copying data between tabs,
because there are no tabs — there's one table and many windows onto it.

## Filtering, sorting, grouping

Each view can **filter** to show only the records that matter there. A "My
open deals" view filters to `Owner = me` and `Status is not Won or Lost`. A
"Overdue" view filters to `Due date is before today`. The hidden records
still exist — they're not deleted, only out of frame for this view.

You can also **sort** (newest first), **group** (cluster all `Won` deals
together with a subtotal), and hide fields you don't care about right now. A
busy 40-field table becomes a calm 6-field view that answers one question
well. Set these up once per view and they stick.

## Automations: the base does the boring part

An **automation** is an if-this-then-that rule that runs inside your base, no
code required. You pick a **trigger** — something that happens — and one or
more **actions** — things Airtable then does.

```text
WHEN  a record's Status changes to "Won"
THEN  send an email to the account owner
AND   create a record in the Onboarding table
AND   post a message to the team Slack channel
```

Common, genuinely useful patterns:

- A form submission comes in → send the submitter a confirmation email.
- A task's due date is tomorrow → notify the assignee.
- A new record is created → fill in default values or stamp the date.
- A status flips to "Approved" → create the matching record in another table.

Triggers can be a record entering a view, a field changing, a form
submission, a scheduled time ("every Monday at 9am"), or a button someone
clicks. Actions can email, update or create records, run on a schedule, or
call out to other apps — directly to a few popular ones like Slack, and to
hundreds more through connector services such as Zapier or Make.

A word of honesty about limits: automations are billed by **runs**, and your
plan includes a monthly allowance. A rule that fires on every record change in
a busy base can eat through that allowance faster than you'd guess. Trigger on
the narrow thing you actually care about — a status reaching one specific
value, not "any edit to this record" — and you'll stay well inside the
budget while the base quietly does your routine work for you.

With links pulling data together, views showing it from every angle, and
automations handling the repetitive parts, you've got something that behaves
like an internal tool. The last step is giving other people a clean way to use
it without handing them the raw grid — and knowing where the whole thing
runs out of road.
