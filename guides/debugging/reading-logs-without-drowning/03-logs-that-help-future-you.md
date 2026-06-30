---
title: "Logs That Help Future-You"
guide: "reading-logs-without-drowning"
phase: 3
summary: "What makes a log line genuinely useful - structured key/value fields, levels used honestly, and enough context to act - plus the writing habits that save future-you, and a light nod to log aggregators."
tags: [logs, logging, structured-logging, best-practices, observability, beginner]
difficulty: beginner
synonyms: ["what makes a good log", "structured logging explained", "how to write useful logs", "key value logs", "logging best practices", "what is a log aggregator", "should i log this"]
updated: 2026-06-19
---

# Logs That Help Future-You

Reading logs and writing logs are two halves of the same skill. Once you've spent an evening hunting for
the one line that mattered, you understand - in your bones - what a *useful* log line looks like, because
you just wished a hundred of them had been better. This phase turns that hard-won frustration into a short
set of habits, so the logs you write save the next person (often you, at 2am, six months from now).

## What makes a log line actually useful

You can feel the difference the moment you read each of these. Same event, two versions:

```console
ERROR  Something went wrong
```
versus:

```console
2026-06-19T14:32:07.214Z  ERROR  [payment]  req=8f3a2  Charge failed for order 4821: card declined (code=insufficient_funds)
```

*What just happened:* The first line tells you nothing you can act on - no time, no place, no *what*, no
*why*. You'd have to go read the code to even guess. The second answers every question you'd ask: when,
where, which request, which order, what failed, and why. The first one wastes your evening; the second one
ends the investigation. The difference between them is the entire craft of logging.

Three things separate the good line from the useless one:

**1. Enough context to act without reading the code.** A log message should name the *specific thing*: not
"failed to save," but "failed to save order 4821: disk full." Include the IDs (order, user, request) and
the actual values involved. The test: could someone who's never seen the code understand what happened and
roughly where to look? If not, add context.

**2. Levels used honestly.** This is the one that bites readers hardest, as you saw in Phase 2. If you tag
routine, self-correcting events as ERROR, you train everyone to ignore ERROR - and then a real error hides
in plain sight. Use the levels the way [Phase 1](01-what-logs-actually-are.md) defined them: INFO for
normal events, WARN for "off but surviving," ERROR for "this actually failed," FATAL for "can't continue."
Honest levels are a gift to whoever greps your logs later.

**3. The error *and* its cause, together.** When you catch and log an error, log *why* it happened, not
just *that* it did. "Could not connect to database" is a start; "Could not connect to database at
db-prod:5432: connection refused" tells the reader exactly what to check next. Log the underlying reason,
not only the surface symptom.

## Structured logs - key/value instead of a sentence

**What it actually is.** A **structured log** records each piece of information as a labeled `key=value`
pair (or as JSON), instead of mashing everything into one prose sentence. Same facts, but tagged so a
machine - and your `grep` - can pick out any single field.

📝 **Terminology.** A **structured log** is one where the data is in named fields, like
`level=error order=4821 reason=card_declined`, rather than free-form text like
`error charging order 4821 because the card was declined`. The fields are the same; the structure is what
lets tools filter and group by them.

Compare the two styles for the same event:

```console
2026-06-19T14:32:07Z  ERROR  charging order 4821 failed because the card was declined
```
versus the structured version:

```console
time=2026-06-19T14:32:07Z  level=error  event=charge_failed  order=4821  reason=card_declined
```

*What just happened:* Both lines carry identical information, but the second one is *labeled*. Now a tool
(or you) can ask precise questions - "every line where `reason=card_declined`," "count of
`event=charge_failed` by hour" - without guessing at sentence wording. With the prose version you're stuck
matching fragile text; with the structured version you're querying clean fields. This is why most modern
services log in a structured format: it's still readable by a human, but it's also *searchable by exact
field*, which is what makes large-scale log tools work.

**The trade-off (so you can decide honestly).** Structured logs are a little less pleasant to skim with the
naked eye - `event=charge_failed order=4821` reads less like English than a sentence does. For a small
script you run by hand, plain prose is perfectly fine. The payoff of structure shows up at scale: many
services, many machines, a search box on top. Pick the style that matches where the logs will be read.

## Habits that save future-you

A handful of small disciplines, learned from reading bad logs, that make yours good:

- **Log decisions and boundaries, not every step.** A note when a request arrives, when it calls out to
  another service, and when it finishes (with the outcome) tells a clear story. Logging every line of a
  loop just rebuilds the flood you fought in Phase 2. Aim for "enough to reconstruct what happened," not
  "everything."
- **Include an ID you can grep.** Whatever ties the lines of one operation together - a request ID, an
  order ID, a user ID - put it on every related line. It's the difference between [following one
  request](02-finding-the-needle.md) in a single `grep` and reconstructing it by hand.
- **Never log secrets.** Passwords, tokens, API keys, full credit-card numbers - logs are often readable by
  many people and kept for a long time, so anything sensitive in a log is a leak waiting to happen. Log
  *that* a charge happened, not the card number. (There's much more on this in the security guides; the
  rule for now: secrets never go in logs.)
- **Write the message for the person reading it in a panic.** That person is stressed, unfamiliar with this
  code, and skimming fast. Plain words, the specific thing, the actual values. Future-you will be grateful.

🪖 **War story.** Every team has had the outage where the logs said only `ERROR: operation failed`, over
and over, with no ID, no reason, no values - and someone burned hours guessing what "operation" meant while
the site was down. Nobody decides to write logs like that; they just never had to *read* their own logs
under pressure. You have now. That's exactly why your logs will be better.

## A light nod to log aggregators

Everything in this guide assumed logs you can reach directly - a file on a server, lines in your terminal.
That works beautifully for one or a few machines. But a real system might run dozens of servers, each
writing its own diary, and you can't `tail -f` all of them at once.

**What happens at that scale.** Companies run a **log aggregator** - a central service that collects log
lines from every machine, stores them together, and puts a search box on top. Instead of SSHing into a
server to `grep` a file, you open a web page, type a query, and search *all* the logs at once. Tools you'll
hear named include **Graylog**, the **ELK / OpenSearch** stack, and broader observability platforms like
**Dynatrace** and **Datadog**.

Here's the reassuring part, and why this is only a nod: **the skills don't change.** Filtering by level,
narrowing by time, searching for an ID, following one request, reading upward from the loud error to its
quiet cause - that's exactly what you do in an aggregator's search box, and it's exactly why structured
logs matter so much there (the search runs on those `key=value` fields). The aggregator is a bigger room
for the same work. You'll meet these tools properly when we get to **performance and observability** in a
later guide; for now, know they exist and that everything you just learned carries straight over.

## Recap

1. A **useful log line** has enough context to act on without reading the code, an **honest level**, and
   the error's **cause**, not just its symptom.
2. **Structured logs** record `key=value` fields instead of prose, so any field is exactly searchable -
   the trade-off is they're a touch less skimmable by eye, which is worth it at scale.
3. Habits that pay off: **log decisions, not every step**; put a **greppable ID** on related lines; **never
   log secrets**; write for the **stressed person** reading at 2am.
4. At many-server scale, **log aggregators** (Graylog, ELK/OpenSearch, Dynatrace, Datadog) gather all logs
   into one searchable place - **the reading skills you learned here carry over unchanged.** You'll meet
   them in a future performance guide.

---

You can now read a log as a story, shrink any flood to the line that matters, see past the loud error to
its quiet cause, and write logs that don't betray the next person. That's the whole skill - and it pays off
on every system you'll ever touch.

**Where to go next.** Logs tell you *that* something failed and roughly where; the program's own crash
report often tells you the *exact* line. Reading that report is its own short skill:
**[Reading a Stack Trace](/guides/reading-a-stack-trace)**. And if `tail`, `grep`, and pipes still feel
shaky, the foundation under all of it is here: **[The Terminal and Shell](/guides/the-terminal-and-shell)**.

---

[← Phase 2: Finding the Needle](02-finding-the-needle.md) · [Guide overview](_guide.md)
