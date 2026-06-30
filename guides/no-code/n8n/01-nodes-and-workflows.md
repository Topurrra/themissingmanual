---
title: "Nodes & Workflows"
guide: n8n
phase: 1
summary: "The core mental model - nodes, the connections between them, the visual editor, executions, and why teams choose an open-source, self-hostable tool."
tags: [n8n, nodes, workflows, executions, open-source]
difficulty: intermediate
synonyms:
  - what is an n8n node
  - n8n workflow basics
  - n8n editor explained
  - n8n executions
  - why use self-hosted n8n
updated: 2026-06-30
---

# Nodes & Workflows

Picture an assembly line. Something arrives at one end, passes through a row of stations - each does one job - and comes out the other end transformed. n8n is that line, drawn on a canvas. Each station is a **node**. The whole line is a **workflow**. Once you see it that way, the rest is detail.

## A node is one step

A node does a single thing: fetch rows from Google Sheets, send a Slack message, call an API, filter a list, wait an hour. n8n ships with hundreds of pre-built nodes for common apps - Gmail, Notion, Stripe, Airtable, Postgres, HubSpot - plus generic ones like "HTTP Request" that can talk to any service with an API.

Every node takes **data in**, does its job, and passes **data out** to the next node. The data flows as a list of items. If a node pulls 50 spreadsheet rows, the next node runs 50 times, once per row, without you writing a loop. That "one node, runs over every item" behavior is the single most important thing to internalize - it's why a three-node workflow can process a thousand records.

Nodes come in a few flavors:

| Flavor | What it does | Example |
|---|---|---|
| Trigger | Starts the workflow | "New email in Gmail", "Every day at 9am", "Webhook" |
| Action | Does work in an app | "Create row", "Send message", "Update record" |
| Logic | Routes or shapes data | "IF", "Filter", "Merge", "Edit Fields" |
| Code | Runs your own snippet | "Code" node (more on this in Phase 2) |

Every workflow needs exactly one starting point - a trigger. Everything else hangs off it.

## A connection is the wire

You build a workflow by dragging nodes onto the canvas and drawing **connections** between them - literally pulling a line from one node's output dot to the next node's input dot. The line means "send your output here next." Data flows left to right along those wires.

Connections can branch. An IF node has two outputs - true and false - so you can send paid customers down one path and free users down another. You can also merge two branches back together. The shape of the wiring *is* the logic. There's no hidden order; what you see on the canvas is exactly what runs, in that order.

```text
[Schedule: every morning]
        |
[Get new signups from DB]
        |
   [IF paid plan?]
     /         \
  true        false
   |            |
[Send to    [Add to
 sales]      nurture list]
```

## The editor is where you live

The canvas is the n8n **editor**, in your browser. You drag nodes from a panel, click a node to open its settings, fill in fields, and - this is the part that makes n8n pleasant - run a single node on the spot to see what comes out. You don't have to run the whole thing to test a step. Click "execute node," look at the real data it produced, and only then wire up the next one. Build a step, see the data, build the next step against that real data. That tight loop is most of the skill.

When you open a node you'll see input data on the left, the settings in the middle, and output data on the right. Watching real records move through is how you catch mistakes early - a field named `Email` versus `email`, a date in the wrong format, an empty list where you expected rows.

## An execution is one run

Every time a workflow fires - on a schedule, from a webhook, or because you hit "test" - that's one **execution**. n8n keeps a log of executions so you can open any past run and see exactly what each node received and sent. When something breaks at 3am, that history is where you go: you open the failed execution, find the red node, and read the actual data it choked on. No guessing.

This matters for cost and debugging both. On usage-based plans, executions are often the thing you're billed for, so a workflow that fires once per email versus once per batch can mean very different bills (we'll come back to this in Phase 2).

## Why teams pick n8n

Two reasons, and they're related.

**It's open-source and self-hostable.** You can run n8n on your own server - a cheap cloud box, a machine in your office, a Docker container - and your data never leaves your walls. For a hospital, a law firm, or anyone handling customer records under GDPR or HIPAA, "the automation runs on infrastructure we control" is not a nice-to-have. The core is source-available under a "fair-code" license; for most internal business automation, self-hosting it is free of license fees (you pay only for the server it runs on).

**It doesn't trap you when no-code runs out.** Click-only tools are smooth until you hit the one thing they can't express - a weird date math, a custom API call, a transformation with no pre-built node. In n8n you drop into a Code node, write a few lines, and keep going. You're never stuck waiting for the vendor to add a feature. That ceiling-with-an-escape-hatch is the whole appeal, and it's where the next phase begins.

The trade-off, stated plainly: more power means more ways to shoot yourself in the foot. Self-hosting means you own updates and backups. Code nodes mean you own the bugs. n8n hands you the keys; Phase 2 is about driving safely.
