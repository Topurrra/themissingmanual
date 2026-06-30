---
title: "Internal Tools, Fast"
guide: retool
phase: 1
summary: "What an internal tool actually is, how Retool's drag-a-component-onto-data model works, and how to connect your first database or API."
tags: [retool, internal-tools, components, data-source, crud]
difficulty: intermediate
synonyms:
  - "what is an internal tool"
  - "connect retool to a database"
  - "drag and drop admin panel"
  - "build a crud interface fast"
  - "retool components overview"
updated: 2026-06-30
---

# Internal Tools, Fast

Picture the work your team does that never makes it into the product. Support needs to look up a customer and issue a refund. Ops needs to see which orders shipped late. Finance needs to approve invoices over a threshold. None of this is customer-facing. It's all the same shape underneath: read some rows, show them in a table, let a human change one, write it back. That shape has a name in the trade - CRUD, for Create, Read, Update, Delete. Internal tools are CRUD interfaces on your own data.

The reason these are painful to build from scratch is that the boring parts dominate. A real web app means a front-end framework, a build pipeline, a hosting setup, auth, and a back-end to talk to your database safely. For a page two people use twice a day, that's a wildly bad trade. So companies either over-build (a neglected mini-app per task) or under-build (everyone shares a database password and edits rows by hand, which goes wrong eventually). Retool sits in the middle: it gives you the front-end and the safe connection to your data, so the only thing left to decide is what the screen should do.

## The canvas-and-components model

A Retool app is a canvas you drop components onto. Components are the building blocks of the interface - the visible parts a user sees and touches. The catalog is large, but you'll live in a handful:

| Component | What it's for |
|---|---|
| Table | The workhorse. Shows rows of data, sortable and filterable. |
| Text Input / Number Input | Capture a value to search or save. |
| Select / Dropdown | Pick from a fixed list. |
| Button | Trigger an action - save, refresh, delete. |
| Form | A group of inputs that submit together. |
| Text | Labels, headings, read-only values. |
| Modal | A pop-up for confirmation or a detail view. |

You drag these from a side panel onto a grid. They snap into place and resize by dragging. Each component has an inspector panel where you set its properties - what a table shows, what a button says, what happens on click. The key mental shift: a component is not static. Its content can come from data, and its data can come from another component. A table's rows come from a query; a query's filter comes from a search box; a detail panel shows whichever row is selected in the table. Components reference each other by name, and Retool keeps everything in sync as values change. That live wiring is the whole game, and it's where Phase 2 goes deep.

For now, the takeaway is the layout-first feeling: you build the screen you want a human to use, then attach data to it. You're not writing an app, you're assembling one.

## Connecting to your data

A canvas with no data is a mockup. The thing that makes Retool useful is the resource - Retool's word for a connection to a data source. You set up a resource once, then any app can use it. Resources come in two broad families.

The first is databases. Retool connects to the usual suspects - PostgreSQL, MySQL, Microsoft SQL Server, plus warehouses like Snowflake and BigQuery, and many more. You give it the host, port, database name, and credentials, and it stores that connection on Retool's side. From then on, your apps talk to "Production DB" by name and never see the raw password. Inside a database resource you write SQL queries (or use a guided GUI mode for plain reads and writes if SQL isn't your thing).

The second is APIs. If your data lives behind an HTTP service - your own back-end, Stripe, a CRM, an internal microservice - you set up a REST or GraphQL resource with the base URL and auth (an API key, a bearer token, OAuth). Retool also ships pre-built integrations for many common SaaS tools so you don't wire the auth by hand.

```text
Resource (set up once)
  name:     Production DB
  type:     PostgreSQL
  host:     db.internal.example.com
  database: app_production
  creds:    stored on Retool's side, not in the app

App "Refund Tool"  ──uses──▶  Resource "Production DB"
App "Order Board"  ──uses──▶  Resource "Production DB"
```

One detail worth internalizing now, because it shapes everything: where the connection lives. On Retool's cloud, the resource connection runs from Retool's servers, so your database has to be reachable from the internet (or via an allowlist of Retool's IPs, or a tunnel). Many teams aren't comfortable opening their production database that way, which is the main reason they self-host Retool - we cover that trade in Phase 3. For your first tool, a read-only connection to a non-critical database is the safe way to learn.

## The first-tool arc

Here's the shape of building your first real tool, before any wiring detail:

```text
1. Add a resource for your database or API.
2. Create a new app, drop a Table on the canvas.
3. Write one query that reads rows; point the table at it.
4. Add a search input; feed it into the query's filter.
5. Add a button that writes a change back.
```

Steps 1 and 2 you've seen. Steps 3 through 5 - turning a static table into something that reads, filters, and writes live - are the craft of Retool, and that's exactly where Phase 2 picks up.
