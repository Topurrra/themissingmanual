---
title: "Logs That Help Future-You"
guide: "reading-logs-without-drowning"
phase: 3
summary: "What makes a log line genuinely useful - structured key/value fields, levels used accurately, and enough context to act - plus the writing habits that save future-you, and a light nod to log aggregators."
tags: [logs, logging, structured-logging, best-practices, observability, beginner]
difficulty: beginner
synonyms: ["what makes a good log", "structured logging explained", "how to write useful logs", "key value logs", "logging best practices", "what is a log aggregator", "should i log this"]
updated: 2026-06-19
---

# Logs That Help Future-You

Reading logs and writing logs are two halves of the same skill. Once you've spent an evening hunting for
the one line that mattered, you know - in your bones - what a *useful* log line looks like, because you
wished a hundred had been better. Here's that frustration turned into habits, so the logs you write save
the next person (often you, at 2am, six months from now).

## What makes a log line actually useful

You can feel the difference the moment you read each of these. Same event, two versions:

```console
ERROR  Something went wrong
```
versus:

```console
2026-06-19T14:32:07.214Z  ERROR  [payment]  req=8f3a2  Charge failed for order 4821: card declined (code=insufficient_funds)
```

*What just happened:* The first line tells you nothing actionable - no time, place, *what*, or *why*;
you'd have to read the code to guess. The second answers every question: when, where, which request,
which order, what failed, why. The first wastes your evening; the second ends the investigation.

Three things separate the good line from the useless one:

**1. Enough context to act without reading the code.** Name the *specific thing*: not "failed to save,"
but "failed to save order 4821: disk full." Include IDs (order, user, request) and actual values - could
someone who's never seen the code understand what happened and roughly where to look?

**2. Levels used accurately.** This bites hardest, as you saw in Phase 2. Tag routine, self-correcting events
as ERROR and you train everyone to ignore ERROR - then a real one hides in plain sight. Use the levels as
[Phase 1](01-what-logs-actually-are.md) defined them: INFO normal, WARN "off but surviving," ERROR
"actually failed," FATAL "can't continue."

**3. The error *and* its cause, together.** Log *why* it happened, not just *that* it did. "Could not
connect to database" is a start; "Could not connect to database at db-prod:5432: connection refused" tells
the reader exactly what to check next.

## Structured logs - key/value instead of a sentence

📝 **Terminology.** A **structured log** records each field as a labeled `key=value` pair (or JSON) instead
of one prose sentence - `level=error order=4821 reason=card_declined` rather than "error charging order
4821 because the card was declined." Same facts, tagged so a machine (and your `grep`) can pick out any
single field.

Compare the two styles for the same event:

```console
2026-06-19T14:32:07Z  ERROR  charging order 4821 failed because the card was declined
```
versus the structured version:

```console
time=2026-06-19T14:32:07Z  level=error  event=charge_failed  order=4821  reason=card_declined
```

*What just happened:* Both lines carry identical information, but the second is *labeled* - a tool (or
you) can now ask "every line where `reason=card_declined`" without guessing at sentence wording. This is
why most modern services log in structured format: still human-readable, but *searchable by exact field*.

**The trade-off.** Structured logs are less pleasant to skim by eye than prose. Fine for a small script
you run by hand; the payoff shows at scale, with many services, many machines, and a search box on top.

## Habits that save future-you

A handful of small disciplines, learned from reading bad logs, that make yours good:

- **Log decisions and boundaries, not every step.** A note when a request arrives, calls another service,
  and finishes (with outcome) tells a clear story. Logging every loop iteration rebuilds the Phase 2
  flood - aim for "enough to reconstruct what happened," not "everything."
- **Include an ID you can grep.** Whatever ties one operation's lines together - request, order, or user
  ID - put it on every related line: the difference between [following one
  request](02-finding-the-needle.md) in a single `grep` and reconstructing it by hand.
- **Never log secrets.** Passwords, tokens, API keys, full card numbers - logs are widely readable and
  kept a long time, so anything sensitive is a leak waiting to happen. Log *that* a charge happened, not
  the card number.
- **Write for the person reading it in a panic.** Stressed, unfamiliar with the code, skimming fast. Plain
  words, the specific thing, the actual values.

🪖 **War story.** Every team has had the outage where logs said only `ERROR: operation failed`, over and
over - no ID, no reason, no values - while someone burned hours guessing what "operation" meant. Nobody
chooses to write logs like that; they just never had to *read* their own under pressure. You have now.

## A light nod to log aggregators

Everything here assumed logs you reach directly - a file on a server, lines in your terminal. That works
for one or a few machines, but a real system might run dozens, each writing its own diary, and you can't
`tail -f` all of them at once.

**What happens at that scale.** Companies run a **log aggregator** - a central service that collects log
lines from every machine, stores them together, and puts a search box on top: open a web page and search
*all* the logs at once. Tools you'll hear named: **Graylog**, the **ELK / OpenSearch** stack, and
platforms like **Dynatrace** and **Datadog**.

**The skills don't change.** Filtering by level, narrowing by time, searching an ID, reading upward from
the loud error to its quiet cause - that's what you do in an aggregator's search box, and why structured
logs matter so much there. It's a bigger room for the same work; you'll meet these tools properly in a
later **performance and observability** guide.

## Recap

1. A **useful log line** has enough context to act on without reading the code, an **accurate level**, and
   the error's **cause**, not just its symptom.
2. **Structured logs** record `key=value` fields instead of prose, so any field is exactly searchable -
   less skimmable by eye, but worth it at scale.
3. Habits that pay off: **log decisions, not every step**; put a **greppable ID** on related lines; **never
   log secrets**; write for the **stressed person** reading at 2am.
4. At many-server scale, **log aggregators** (Graylog, ELK/OpenSearch, Dynatrace, Datadog) gather all logs
   into one searchable place - **the reading skills here carry over unchanged.** You'll meet them in a
   future performance guide.

---

You can now read a log as a story, shrink any flood to the line that matters, see past the loud error to
its quiet cause, and write logs that don't betray the next person. That's the whole skill, and it pays off
on every system you'll touch.

**Where to go next.** Logs tell you *that* something failed and roughly where; the program's own crash
report often tells you the *exact* line. Reading that report is its own short skill:
**[Reading a Stack Trace](/guides/reading-a-stack-trace)**. And if `tail`, `grep`, and pipes still feel
shaky, the foundation under all of it is here: **[The Terminal and Shell](/guides/the-terminal-and-shell)**.

---

[← Phase 2: Finding the Needle](02-finding-the-needle.md) · [Guide overview](_guide.md)
