---
title: "Searching Effectively"
guide: "reading-graylog"
phase: 2
summary: "The query model: field:value searches, time-range scoping as your biggest lever, boolean operators, following one request by its correlation id, and reading the histogram to find the spike."
tags: [graylog, log-search, query-syntax, field-value, time-range, boolean-operators, correlation-id, request-id, histogram]
difficulty: intermediate
synonyms: ["graylog search syntax", "how to search field value in graylog", "graylog time range search", "boolean operators graylog query", "follow request id across services", "what is a correlation id", "read the graylog histogram", "find the spike in logs", "kibana query language basics"]
updated: 2026-07-10
---

# Searching Effectively

You're in the search box. The pager went off two minutes ago. The instinct is to type the error message
and hit enter - and then you get ten thousand results spanning three days and you're drowning again,
this time in a nicer UI. The fix isn't a cleverer search string. It's a small set of moves, applied in
the right order, that shrink the haystack before you go looking for the needle.

## Cheat-card: drowning right now?

| You want to… | Do this first |
|---|---|
| Stop seeing yesterday's noise | **Scope the time range** to the incident window (last 15m, or a fixed start/end). This is the #1 lever. |
| Find errors in one service | `service:checkout AND level:error` |
| See only failed requests | `status:500` (or `status:>=500`) |
| Follow one user's broken request | `request_id:a1b2c3` (across *all* services at once) |
| Find *when* it started | Look at the **histogram** above the results - the spike is the start. |
| Exclude known noise | `... AND NOT message:"health check"` |

Each of these is explained below. The order matters: **scope time, then filter, then drill in.**

## The query model: search by field

**What it actually is.** A search is a question about the labeled cards from Phase 1. The basic unit is
`field:value` - "show me cards where this field has this value."

**A real example.**

```text
service:checkout AND level:error
```
```text
   timestamp            level   service    status  request_id  message
   2026-06-19 14:02:11  error   checkout   500     a1b2c3      payment gateway timeout
   2026-06-19 14:02:14  error   checkout   500     d4e5f6      payment gateway timeout
   2026-06-19 14:03:02  error   checkout   500     7g8h9i      payment gateway timeout
   … (showing 41 results in the selected time range)
```
*What just happened:* Instead of full-text searching for the word "error" everywhere, you asked for cards
where the `service` field is exactly `checkout` and the `level` field is exactly `error`. Three lines in,
a pattern is already obvious: same message, `status` 500, "payment gateway timeout." You're not reading
ten thousand lines - you're reading the 41 that matter.

⚠️ **Field names and values must actually exist as you typed them.** `level:error` only works if your
logs carry a `level` field with the value `error` (some apps log `ERROR`, some log `severity` instead of
`level`). When a search returns nothing, suspect a wrong field name or value before you suspect the
outage fixed itself. Click an existing log line to see its real field names.

📝 **Syntax differs slightly by tool.** Graylog and Kibana both use a Lucene-style `field:value` syntax,
so most of what's here ports directly. Kibana also has its own **KQL** (Kibana Query Language) where you
might write `service: "checkout" and level: "error"`. The *ideas* - field, value, boolean, range - are
identical; only the punctuation moves. When in doubt, the UI usually shows which mode you're in.

## Time-range scoping: your single biggest lever

**Why it's first.** Every other filter narrows *what*; the time range narrows *how much*. An incident
happened in a window. If you search "all time," you're fighting every log the system ever produced. If you
scope to the 15 minutes around the alert, you've often cut the haystack by orders of magnitude before
typing a single field.

**What it does in real life.** There's a time-range picker near the search box - relative ("last 15
minutes," "last 1 hour") or absolute (a fixed start and end). Set it to the incident window *first*, then
search.

```text
   ┌─────────────────────────────────────────────┐
   │  Search: service:checkout AND status:500     │
   │  Time:   [ Last 15 minutes ▾ ]   ← set this FIRST
   └─────────────────────────────────────────────┘
```

🪖 **War story.** A teammate spent twenty minutes convinced a bug was "intermittent and unreproducible."
The search was scoped to the last 24 hours, so a handful of real failures were buried under a day of
unrelated noise. Narrowing the time range to the ten minutes the user reported turned "intermittent" into
"happens every single time, here it is." The bug hadn't changed. The window had.

## Boolean operators: combine and exclude

**What they are.** `AND`, `OR`, and `NOT` (Graylog also accepts `&&`, `||`, and `-` as shorthands)
combine field searches into one precise question.

**A real example.**

```text
service:checkout AND status:500 AND NOT message:"health check"
```
*What just happened:* You asked for checkout's failed requests, then subtracted the routine health-check
noise that also happens to be in the window. `NOT` (or a leading `-`) is how you carve away the known,
boring lines so the unfamiliar ones stand out. `OR` does the opposite - `service:checkout OR
service:payments` widens to two services at once.

⚠️ **Quote multi-word values and watch your operators.** `message:payment gateway timeout` may be read
as `message:payment` plus the loose words `gateway timeout`. Quote it: `message:"payment gateway
timeout"`. And uppercase your booleans - most query parsers expect `AND`/`OR`/`NOT`, not `and`/`or`.

**Ranges, when fields are numeric.** For numeric fields you can ask for ranges: `status:>=500` (server
errors), or `took_ms:>2000` (requests slower than two seconds), if your app logs those as numbers.

## Following one request by its correlation id

This is the move that pays for the whole centralized setup, so it's worth doing deliberately.

**The problem it solves.** Back in Phase 1, one request's story was smeared across the load balancer,
one app server, and the database - on different boxes. On a single machine you couldn't reassemble it.
Centrally, you can - *if* every service stamped the request with the same id.

📝 **Correlation id / request id / trace id.** A unique string generated when a request first arrives
(often at the load balancer or API gateway) and passed along to every service that touches it, each of
which logs it. Same request, same id, everywhere.

**A real example.** You found a failing request and copied its `request_id`. Now drop the service filter
and search *only* the id:

```text
request_id:a1b2c3
```
```text
   timestamp            service   message
   14:02:09.812  gateway    inbound POST /checkout  request_id=a1b2c3
   14:02:09.998  checkout   creating order, calling payment provider
   14:02:11.004  checkout   payment gateway timeout after 1000ms
   14:02:11.006  checkout   returning 500 to client
   14:02:11.040  gateway    response 500 for /checkout  request_id=a1b2c3
```
*What just happened:* By searching the id across *all* services at once, the scattered diary entries snap
back into one timeline. You can read the request's whole life in order: it came in, checkout called the
payment provider, the provider didn't answer within a second, checkout gave up and returned a 500. You
didn't reconstruct that by hand across five machines - the shared id and one search did it for you.

⚠️ **No id, no trail.** If a service doesn't log the correlation id, it won't appear in this
timeline - there'll be a gap. That gap is a logging gap, not proof that nothing happened there. (This is
the Phase 1 gotcha biting in practice: the tool can only show what was logged.)

## Reading the histogram: find *when* it started

**What it's showing you.** Above the results, the search UI draws a bar chart of *how many matching log
lines occurred over time* - each bar is a time bucket (per minute, per hour, depending on your range).
It's not decoration; it's the shape of the problem.

```text
   matching lines per minute (search: service:checkout AND level:error)

   count
    120 ┤                          ███
        │                          ███ ███
     80 ┤                          ███ ███ ███
        │                          ███ ███ ███
     40 ┤                          ███ ███ ███
        │  ·   ·   ·   ·   ·   ·   ███ ███ ███   ·
      0 ┼──────────────────────────────────────────▶ time
        13:50      13:55      14:00  ↑  14:05
                                   14:01 - errors jump from ~1/min to ~100/min
```
*What just happened:* The flat baseline on the left is the normal background rate of `checkout` errors -
a stray one here and there. At 14:01 the bars shoot up. That cliff *is* the start of the incident. Now
you know exactly which minute to scope to, and you can line it up against a deploy, a config change, or a
dependency going down.

💡 **Key point.** Read the *shape* before the *lines*. A sudden cliff says "something changed at this
moment" (a deploy, an outage). A slow ramp says "something is degrading" (a leak, a filling queue, a
dying disk). The histogram tells you which kind of problem you have before you've read a word of any log.

## The order, every time

1. **Scope the time range** to the incident window. (Biggest lever.)
2. **Filter by field** - `service:`, `level:`, `status:` - to the slice you care about.
3. **Read the histogram** to find when it started and what shape it is.
4. **Grab a `request_id`** from a failing line and search it alone to follow the request across services.
5. **Subtract noise** with `NOT` / `-` until only the unfamiliar lines remain.

## Recap

1. Searches are `field:value` questions over labeled cards; combine them with `AND` / `OR` / `NOT`.
2. Time-range scoping is your #1 lever - set the window *before* you refine the query.
3. Quote multi-word values; uppercase your booleans; verify field names against a real log line.
4. Searching a correlation/request id alone reassembles one request's story across every service.
5. The histogram shows matches over time - a cliff means a change, a ramp means degradation; read the
   shape first.

---

[← Phase 1: Why Centralized Logs](01-why-centralized-logs.md) · [Phase 3: Streams, Dashboards & Alerts →](03-streams-dashboards-alerts.md)

## Try it yourself

Build a pattern for the responses you care about (here: 4xx/5xx status codes):

```playground-regex
\b[45]\d\d\b
GET /api/users 200 12ms
GET /api/order 404 3ms
POST /api/pay 500 80ms
GET /health 200 1ms
```
