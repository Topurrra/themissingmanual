---
title: "Recipes, Limits & Gotchas"
guide: zapier
phase: 3
summary: "Understand task-based pricing, polling vs instant triggers, deduplication, error handling and replay, plus a few high-value real-world Zap recipes."
tags: [zapier, pricing, tasks, errors, recipes]
difficulty: beginner
synonyms:
  - "how does zapier pricing work"
  - "zapier task limit"
  - "zapier polling delay"
  - "zapier duplicate runs"
  - "zapier error replay"
  - "useful zapier recipes"
updated: 2026-06-30
---

# Recipes, Limits & Gotchas

This is the phase that saves you money and saves you a bad afternoon. The mechanics from Phases 1 and 2 work fine in a demo; the things below are what bite you once real volume flows through.

## How Zapier charges you: tasks

Zapier bills on **tasks.** A task is one **action** step that successfully runs. Read that carefully, because the details decide your bill:

- The **trigger does not cost a task.** Zapier watching your form for new entries is free; only the actions it then performs count.
- **Each action that runs is one task.** A Zap with four actions that fires once = four tasks. The same Zap firing 100 times = 400 tasks.
- A **Filter that stops a Zap costs nothing** for the steps that didn't run. This is why filters are your budget's best friend — guard early and you don't pay to do work you didn't want.
- Formatter, Filter, and Paths steps themselves generally **don't count as tasks** (they're built-in utilities, not app actions), though policy can shift over time, so treat that as "cheap," not "always literally zero," and watch your usage.

The lesson: **task cost scales with actions × how often the trigger fires.** A noisy trigger feeding a five-action Zap burns through a plan fast. Two ways to control it: filter aggressively so most events stop early, and don't add actions you don't truly need.

```text
Zap fires 500 times this month
  × 3 action steps that run each time
  = 1,500 tasks
(but if a filter stops 60% of runs early after step 1,
 you pay far fewer than 1,500)
```

Plans come with a monthly task allowance. Cross it and, depending on your plan, Zaps pause or you're moved into overage — so watch the usage meter, not only the calendar.

## Polling vs instant triggers

Not every Zap reacts the instant something happens. Triggers come in two flavors:

- **Instant (webhook-based):** the app actively pushes Zapier the moment the event occurs. Near-real-time.
- **Polling:** Zapier *checks* the app on a schedule — "any new entries since last time?" The check interval depends on your plan, and on lower tiers it can be as long as **every 15 minutes.**

So a polling Zap can sit idle for up to that interval before it notices a new row and runs. That's not a bug; it's how polling works. If your test seemed to "do nothing," it may be waiting for the next poll — give it the interval before you panic. When you genuinely need instant reaction (a "thanks for paying" message), prefer an app whose trigger is marked **Instant**, or use a direct webhook.

## Duplicates and missed runs

Two failure shapes show up at scale.

**Duplicate runs** — the Zap fires twice for one event. Causes vary: a record gets edited and re-detected, an app re-sends an event, or your own two Zaps form a loop (Zap A updates a record, which triggers Zap B, which updates it back, which re-triggers Zap A). Defenses:

- Trigger on a *one-time* event ("new charge") rather than a *re-occurring* state ("charge exists") where you can.
- Use a **Find or Create** lookup (Phase 2) so a second run updates the existing record instead of making a twin.
- Add a Filter that checks a "processed?" marker and skips if it's already set.

**Missed runs** — the Zap doesn't fire when you expected. Usual culprits: it was switched Off, a polling interval hadn't elapsed yet, the trigger field was empty so a Filter stopped it, or the connected account's login expired and needs reconnecting.

## When a Zap breaks: errors and replay

Zaps break quietly. An app changes, a required field comes through empty, or a reconnect is needed — and the Zap **errors** instead of completing. Where to look and what to do:

- **Zap History** is the log of every run: which succeeded, which were filtered out, which errored. This is the first place to check when "the automation stopped working."
- **Turn on error alerts.** Zapier can email you when a Zap starts failing. Set this up the day you build anything important; otherwise you find out when a customer does.
- **Replay.** When you fix the cause (reconnect the account, handle the blank field), you can **replay** the failed runs from history so the work that got skipped still happens — you don't lose those events.
- **Autoreplay** exists on higher plans to retry transient failures automatically.

A reliable Zap isn't one that never errors — it's one that tells you when it does and lets you recover the missed work.

## A few high-value recipes

These are workhorses, not party tricks.

**Lead capture, deduplicated.**
```text
TRIGGER  →  New form submission
LOOKUP   →  Find or create CRM contact by email
ACTION   →  Update contact + notify sales in Slack
```

**Payment to bookkeeping + receipt.**
```text
TRIGGER  →  New successful Stripe charge  (Instant)
FILTER   →  Continue only if Amount > 0
ACTION   →  Add row to accounting sheet
ACTION   →  Send branded receipt email
```

**Inbox triage.**
```text
TRIGGER  →  New labeled email (Gmail)
PATHS    →  Subject contains "invoice" → save attachment to Drive + log it
            Subject contains "refund"  → create a support ticket
```

**Scheduled digest.**
```text
TRIGGER  →  Schedule (every weekday 8am)
ACTION   →  Read yesterday's rows from the sheet
ACTION   →  Post a summary to Slack
```

## The short version

Tasks are actions that run, so filter early and keep action counts lean. Polling means "soon," not "instant" — pick instant triggers when timing matters. Guard against duplicates with one-time triggers and lookups. And the day you build something you'll rely on, turn on error alerts and learn where Zap History lives — because the Zaps that hurt are the ones that fail silently while you assume they're working.
