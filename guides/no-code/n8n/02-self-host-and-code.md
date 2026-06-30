---
title: "Self-Host, Credentials & the Code Node"
guide: n8n
phase: 2
summary: "The grown-up concerns - running n8n yourself versus n8n Cloud, where credentials and secrets live, expressions that pass data between steps, and the Code node for when no-code runs out."
tags: [n8n, self-hosted, credentials, expressions, code-node]
difficulty: intermediate
synonyms:
  - n8n cloud vs self hosted
  - n8n credentials and secrets
  - n8n expressions explained
  - n8n code node tutorial
  - how to host n8n
updated: 2026-06-30
---

# Self-Host, Credentials & the Code Node

Phase 1 was the toy version: drag nodes, draw wires, watch data move. This phase is the part that decides whether your automations survive contact with reality - where they run, how they hold your secrets, how data flows between steps, and what you do when the pre-built nodes can't express what you need.

## Cloud or your own box

You have two ways to run n8n.

**n8n Cloud** is the hosted version. You sign up, you get a URL, n8n keeps it running, patched, and backed up. You pay a monthly subscription, and the plan is shaped around how many workflow **executions** you run and how many active workflows you have - not per-task like some competitors. For a small team that wants to skip server administration, this is the path of least resistance.

**Self-hosting** means you run n8n yourself, usually as a Docker container on a cloud server you rent (a $5–$20/month box handles a lot). The software itself is free of license fees for this; you pay only for the machine. In exchange you get: your data stays on your infrastructure, no execution caps beyond what your server can handle, and full control. You also get the chores - updates, backups, and keeping it online are now your job.

| | n8n Cloud | Self-hosted |
|---|---|---|
| Setup | Minutes, no server | You run a server / container |
| Cost shape | Monthly, by executions + active workflows | Server rent only (license-free for most use) |
| Data location | n8n's infrastructure | Yours |
| Updates & backups | Handled for you | Your responsibility |
| Execution limits | Per plan | Whatever your server takes |

A common pattern: prototype on Cloud or a local install, then self-host once it's load-bearing and the data sensitivity matters.

> A self-hosting trap worth naming: when you upgrade a self-hosted instance, **back up first**. Your workflows and credentials live in a database; a botched upgrade or a wiped container can take them with it. "It's just a container" has eaten many people's automations.

## Credentials: where the secrets live

Almost every node needs to prove who you are to some service - a Gmail login, a Stripe API key, a database password. In n8n these are stored as **credentials**, separately from the workflows that use them.

This separation is deliberate and good. You enter your Slack token once, as a credential named "Company Slack," and any node that needs Slack picks it from a dropdown. The secret itself is encrypted at rest and never shown back to you in plain text after you save it. If you export or share a workflow, the credentials don't travel with it - only a reference does. So you can hand a colleague a workflow without handing them your API keys.

A few rules that save pain:

- **One credential, many workflows.** Rotate a key once in the credential, and every workflow using it updates. Don't paste keys into individual node fields.
- **Self-hosters: set an encryption key and guard it.** n8n encrypts credentials with a key it generates on first run. If you lose that key (or spin up a fresh instance against an old database), your saved credentials become unreadable. Back it up alongside your database.
- **Least privilege.** Give each credential the narrowest access that works. An API key that can only read is a smaller disaster if it leaks than one that can delete.

## Expressions: pulling data from earlier steps

Static fields are fine until you need step three to use something step one produced. That's what **expressions** are for. Anywhere you'd type a fixed value, you can instead flip a field to expression mode and reference live data from upstream nodes.

Expressions are written in `{{ }}` and pull from the data flowing through. The common shapes:

```text
{{ $json.email }}              the "email" field of the current item
{{ $json.customer.name }}      a nested field
{{ $now }}                     the current date/time
{{ $node["Get Customer"].json.plan }}   a field from a named earlier node
```

You'll mostly use `$json` (the current item's data) and references to earlier nodes by name. The editor shows you a live preview of what an expression resolves to against your real test data, so you're not guessing. Expressions are how a Slack message becomes "New signup: {{ $json.name }} on the {{ $json.plan }} plan" instead of the same text every time.

## The Code node: the escape hatch

Eventually you hit a wall. You need a transformation no node offers, date math that's fiddly, or you want to reshape a messy list before it moves on. This is the moment n8n earns its reputation. You drop in a **Code node** and write a short snippet (JavaScript, or Python on supported setups) that takes the incoming items and returns new ones.

You don't write a whole program. You get the input items in a variable, you transform them, you return a list. A typical job is "take these 200 rows, keep only the ones from this month, and add a `fullName` field by joining first and last." Five lines, and you're back to dragging nodes.

When to reach for it:

- A transformation or calculation no pre-built node does.
- Reshaping data - flattening, grouping, renaming a pile of fields at once.
- Calling something obscure that the generic HTTP node makes awkward.

When **not** to: if a normal node already does it, use the node. Code is the thing your teammate can't read at a glance and the thing that breaks silently when an upstream field is missing. Reach for it when no-code runs out - not before. The point of the escape hatch is that it's there when you need it, not that you live inside it.

With hosting, secrets, expressions, and the code escape hatch in hand, you have everything to build something real. Phase 3 does exactly that.
