---
title: "Finding the Needle"
guide: "reading-logs-without-drowning"
phase: 2
summary: "The practical moves for finding the one line that matters: watch logs live with tail -f, filter with grep, zoom to the moment of failure by timestamp, and follow a single request through using a correlation ID."
tags: [logs, grep, tail, search, correlation-id, debugging, troubleshooting, beginner]
difficulty: beginner
synonyms: ["how to search a log file", "tail -f explained", "grep logs for error", "grep before and after lines", "find the error in the logs", "what is a correlation id", "follow a request through logs", "error that is actually harmless"]
updated: 2026-06-19
---

# Finding the Needle

You have a flood of log lines and need the one that explains the failure. A handful of small commands
handle almost every case, all doing the same thing - **shrink the flood until only the relevant part is
left.** Cheat-card first, then the sections below.

## The cheat-card

> **Match what you're trying to do to the row, then read the section under it.**

| You want to… | Reach for | Section |
|---|---|---|
| Watch what's happening *right now*, live | `tail -f app.log` | §1 |
| Keep only lines that mention a word | `grep "order 4821" app.log` | §2 |
| See ERRORs only (ignore the calm noise) | `grep ERROR app.log` | §2 |
| See an error *and the lines around it* | `grep -B 5 -A 5 ERROR app.log` | §2 |
| Jump to a specific time | `grep "14:32" app.log` | §3 |
| Follow one request through everything | `grep <request-id> app.log` | §4 |
| Combine: live + filtered | `tail -f app.log \| grep ERROR` | §1 |

> ⏭️ New to pipes (`\|`) and `grep`? Full treatment in
> [The Terminal and Shell](/guides/the-terminal-and-shell) - the quick version below is enough for here.

---

## 1. `tail -f` - watch the diary as it's written

`tail` shows the *end* of a file. Add `-f` ("follow") and it stays open, printing each new line as the
program writes it - a live window onto the diary. Handy when *reproducing* a bug: click the button, submit
the form, watch exactly which lines it produces.

```console
$ tail -f app.log
2026-06-19T14:45:01.110Z  INFO   [api]      Server ready, listening on :3000
2026-06-19T14:45:18.402Z  INFO   [api]      Received request GET /health
2026-06-19T14:45:18.405Z  INFO   [api]      Responded 200 OK
```
*What just happened:* `tail -f` printed the last lines then *kept running* - new lines appear live as the
program writes them. (`Ctrl-C` stops following.)

Pipe it into `grep` to watch *only* the lines you care about as they happen:

```console
$ tail -f app.log | grep ERROR
2026-06-19T14:46:33.871Z  ERROR  [payment]  Charge failed for order 5099: gateway timeout
```
*What just happened:* The live stream flowed through `grep ERROR`, dropping every calm INFO line and
showing only errors as they occurred - nothing to scroll past. This one line you'll use for the rest of
your career.

## 2. `grep` - keep only the lines that match

`grep` reads a file (or stream) line by line and prints **only the lines that contain the text you asked
for**, dropping the rest. You usually know *something* about the line you want - an order number, an error
word, a username. `grep` turns "somewhere in 50,000 lines" into "here are the 6 that mention it."

```console
$ grep "order 4821" app.log
2026-06-19T14:31:55.001Z  INFO   [api]       Received request POST /orders (order 4821)
2026-06-19T14:32:07.214Z  ERROR  [payment]   Charge failed for order 4821: card declined
2026-06-19T14:32:07.220Z  INFO   [api]       Responded 402 Payment Required (order 4821)
```
*What just happened:* `grep` printed only the three lines containing `order 4821`, dropping thousands about
other orders. (Quote any pattern with a space, like `"order 4821"`.)

Filtering by level is the same move:

```console
$ grep ERROR app.log
2026-06-19T14:32:07.214Z  ERROR  [payment]   Charge failed for order 4821: card declined
2026-06-19T14:48:12.660Z  ERROR  [email]     Could not send receipt: SMTP connection refused
```
*What just happened:* `grep ERROR` collapsed a giant log into the short list of things that failed -
usually your **first** command on an unfamiliar log. (`grep` is case-sensitive by default; add `-i` to
ignore case.)

**The most useful flag: context with `-B` and `-A`.** An error line tells you *that* something failed, but
the *why* is often just before it. `grep -B 5 -A 5` prints each match plus 5 lines **B**efore and 5
**A**fter:

```console
$ grep -B 5 -A 1 "Charge failed" app.log
2026-06-19T14:31:55.001Z  INFO   [api]       Received request POST /orders (order 4821)
2026-06-19T14:31:55.040Z  INFO   [inventory] Reserved 2 units of item SKU-99
2026-06-19T14:32:06.900Z  INFO   [payment]   Contacting payment gateway for order 4821
2026-06-19T14:32:07.020Z  WARN   [payment]   Payment gateway slow to respond, retrying (attempt 2 of 3)
2026-06-19T14:32:07.180Z  WARN   [payment]   Payment gateway slow to respond, retrying (attempt 3 of 3)
2026-06-19T14:32:07.214Z  ERROR  [payment]   Charge failed for order 4821: card declined
2026-06-19T14:32:07.220Z  INFO   [api]       Responded 402 Payment Required (order 4821)
```
*What just happened:* Instead of a lone error line, you got the lead-up: request arrived, inventory
reserved, gateway contacted, slow *twice* (two WARN retries), *then* the charge failed. Reach for
`-B`/`-A` almost every time you grep an error.

## 3. Use timestamps to zoom to the moment of failure

Often you don't have a word - you have a *time*. A user says "it broke around 2:32," or an alert fired at
a known minute. Grep the time itself and land right at the moment:

```console
$ grep "14:32" app.log
2026-06-19T14:32:06.900Z  INFO   [payment]   Contacting payment gateway for order 4821
2026-06-19T14:32:07.020Z  WARN   [payment]   Payment gateway slow to respond, retrying (attempt 2 of 3)
2026-06-19T14:32:07.180Z  WARN   [payment]   Payment gateway slow to respond, retrying (attempt 3 of 3)
2026-06-19T14:32:07.214Z  ERROR  [payment]   Charge failed for order 4821: card declined
```
*What just happened:* `grep "14:32"` matched every line in that minute - no scrolling. Widen or narrow by
how much time you type: `"14:3"` catches 14:30-14:39; `"14:32:07"` pins a single second.

⚠️ **Gotcha - the time zone again.** As covered in [Phase 1](01-what-logs-actually-are.md), the log may be
in UTC. If the user's "2:32" is local time, grepping `"14:32"` may show a calm, unrelated minute. Confirm
the zone, do the math, then grep the *server's* time - many "nothing at that time" dead ends are just an
offset.

## 4. Follow one request all the way through (correlation IDs)

When a server handles many users at once, lines for *your* broken request are **interleaved** with
everyone else's. Grepping `ERROR` shows an error, but whose? Scattered among thousands of unrelated lines.

**The fix: a correlation ID.**

📝 **Terminology.** A **correlation ID** (also *request ID* or *trace ID*) is a unique tag stamped onto
*every* log line for one request - like a case number, gathering every note on one case however mixed-in
they are. Following one request through the flood becomes one `grep`:

```console
$ grep "req=8f3a2" app.log
2026-06-19T14:31:55.001Z  INFO   [api]       req=8f3a2 Received POST /orders (order 4821)
2026-06-19T14:31:55.040Z  INFO   [inventory] req=8f3a2 Reserved 2 units of item SKU-99
2026-06-19T14:32:06.900Z  INFO   [payment]   req=8f3a2 Contacting payment gateway
2026-06-19T14:32:07.214Z  ERROR  [payment]   req=8f3a2 Charge failed: card declined
2026-06-19T14:32:07.220Z  INFO   [api]       req=8f3a2 Responded 402 Payment Required
```
*What just happened:* Grepping one request ID (`req=8f3a2`) pulled *only* that request's lines - across
three parts of the program - out of a log full of interleaved activity. One clean story instead of a
tangle, and a gentle on-ramp to "tracing," which you'll meet properly in a later guide.

To find the ID: grep what you *do* know (order number, user, error), read the ID off one line, then grep
that ID for the complete thread.

## The trap that wastes the most time: the loud ERROR that isn't the cause

This burns everyone, repeatedly. **The first ERROR you see is not always the real cause - sometimes the
real cause is a quieter WARN above it.** Two flavors:

- **The harmless ERROR** - some programs log noisy ERROR lines for routine, self-correcting things: a
  health check that failed once then passed, a retry that succeeded next attempt, a normal disconnect.
- **The real cause is upstream** - the eye-catching ERROR is often just the *last* domino. What started
  the fall is a WARN (or even INFO) several lines *earlier*:

```console
2026-06-19T14:31:50.300Z  WARN   [db]      Connection pool exhausted, waiting for a free connection
2026-06-19T14:31:55.001Z  INFO   [api]     Received request POST /orders (order 4821)
2026-06-19T14:32:00.118Z  WARN   [db]      Still waiting for a database connection (5s)
2026-06-19T14:32:07.214Z  ERROR  [api]     Request failed: timed out waiting for the database
```
*What just happened:* The loud line is the ERROR at the bottom - "request timed out." The *cause* is the
WARN at the top: the connection pool ran out, so the request sat waiting until it gave up. Fixing the
timeout itself would do nothing; the real problem was announced calmly, sixteen seconds earlier. **This is
why you grep with `-B` context** - the quiet cause shows up beside the loud symptom.

💡 **Key point.** Don't stop at the first ERROR. Read *upward*: "what's the earliest sign of trouble here?"
- usually the real cause. The loudest line is the symptom; the cause is quieter, earlier.

## Recap

1. **`tail -f`** - a live window on the diary; pair with `grep` (`tail -f app.log | grep ERROR`) to watch
   only what matters while reproducing a bug. `Ctrl-C` to stop.
2. **`grep "word" file`** - keep only matching lines. First move on an unfamiliar log: `grep ERROR`. Add
   `-i` to ignore case.
3. **`grep -B 5 -A 5`** - show lines *around* a match; the *why* lives in the surrounding lines.
4. **Grep a timestamp** (`grep "14:32"`) to jump to the moment of failure - mind the **UTC** offset.
5. **Correlation / request IDs** let you `grep` one request's complete story out of an interleaved flood.
6. **The trap:** the loud ERROR isn't always the cause. Read *upward* - the real cause is often a quiet
   **WARN** above it.

Watch it animated: [debugging with logs](/explainers/LogDebugging.dc.html)

---

[← Phase 1: What Logs Actually Are](01-what-logs-actually-are.md) · [Phase 3: Logs That Help Future-You →](03-logs-that-help-future-you.md)

## Try it yourself

Find the lines that matter - edit the pattern and watch matches highlight:

```playground-regex
ERROR|WARN
2026-06-20 12:01 INFO  request ok
2026-06-20 12:02 ERROR db timeout after 5s
2026-06-20 12:03 WARN  slow query 1200ms
2026-06-20 12:04 INFO  request ok
```
