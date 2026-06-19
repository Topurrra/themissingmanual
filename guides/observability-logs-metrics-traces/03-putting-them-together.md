---
title: "Putting Them Together"
guide: "observability-logs-metrics-traces"
phase: 3
summary: "Debug a real slowdown end to end — a metric alert points at the symptom, a trace finds the slow service, logs explain why — plus a quick map of the tool landscape and the two traps that bite teams: cardinality explosions and alert fatigue."
tags: [observability, debugging, distributed-tracing, opentelemetry, prometheus, grafana, dynatrace, cardinality, alert-fatigue]
difficulty: intermediate
synonyms: ["how to debug a slow service", "metric trace log workflow", "how to find a slow query in production", "what is opentelemetry", "what is cardinality explosion", "what is alert fatigue", "observability tools landscape"]
updated: 2026-06-19
---

# Putting Them Together

Three pillars are interesting on their own, but the payoff is what happens when you use them *as a chain*.
The skill that separates someone who flails during an incident from someone who looks calm isn't knowing
more tools — it's knowing the *order* to reach for them. You go from "something's slow" to "here's the
line of code" by zooming in deliberately, one pillar handing off to the next.

This phase walks that exact path through one realistic slowdown, then maps the tools lightly so the
product names stop being intimidating, then names the two traps that quietly ruin observability setups.

## The cheat-card: the debugging chain

When something is slow or broken and you don't yet know why, walk it in this order:

| Step | Pillar | The question it answers | What you learn |
|---|---|---|---|
| 1 | **Metric** | Is something actually wrong, and how widespread? | "p99 latency on `/checkout` doubled at 14:00, for everyone." |
| 2 | **Trace** | *Where* in the request is the time going? | "In a sample slow request, one DB span ate 690 of 812ms." |
| 3 | **Log** | *Why* did that specific step misbehave? | "That query did a full table scan — a missing index." |

Metric → trace → log. *That it's wrong* → *where it's wrong* → *why it's wrong.* Keep reading for the full
walkthrough underneath.

## Walking a real slowdown

Let's debug it for real. The setup: a checkout flow spanning an API gateway, an auth service, a checkout
service, and a database. Users are complaining that checkout "feels slow."

### Step 1 — the metric tells you *that* it's wrong

You don't start by reading logs. With six services, you don't yet know *where* to read. You start with the
metric that's closest to the symptom: checkout latency.

```console
$ # p99 latency for the checkout endpoint, last 2 hours (PromQL)
$ histogram_quantile(0.99, rate(http_request_duration_seconds_bucket{route="/checkout"}[5m]))

13:55  0.31
14:00  0.74
14:05  0.79
14:10  0.81
```

*What just happened:* The 99th-percentile latency for `/checkout` jumped from about 0.31s to ~0.8s right
around 14:00 and stayed there. The metric just earned its keep: it confirmed the problem is real (not one
user's bad wifi), told you it affects the slow tail of *many* requests, and pinned the start time. What it
can't tell you is *which* of the four services got slow — for that, you follow a single request.

### Step 2 — the trace tells you *where*

Now you pull up a trace for one of the slow `/checkout` requests. This is the waterfall from Phase 2, and
the slow span jumps out:

```text
trace_id: 4bf92f3577b34da6        total: 812 ms
api-gateway        ████████████████████████████████████████  812 ms
  └─ auth-service  ██                                          38 ms
  └─ checkout-svc    ████████████████████████████████████     740 ms
       └─ payment-db   ██████████████████████████████████     690 ms  ◄── here
```

*What just happened:* The trace collapsed "checkout is slow" into "the `payment-db` span took 690 of the
812ms." Auth, the gateway's own work, everything else — fine. You now know *exactly* which service and
which operation to investigate, and you didn't have to guess or read four services' worth of logs. You
also have the `trace_id`, which is your key into the logs.

### Step 3 — the log tells you *why*

Finally, you filter logs to that one `trace_id` and look at what the database service recorded for it:

```console
$ grep 4bf92f3577b34da6 /var/log/checkout/db.log
{"ts":"2026-06-19T14:02:11.4Z","level":"WARN","service":"payment-db","trace_id":"4bf92f3577b34da6","msg":"slow query","duration_ms":690,"query":"SELECT * FROM payments WHERE customer_id = ?","rows_scanned":4210567,"plan":"Seq Scan"}
```

*What just happened:* There it is — the *why*. That query scanned 4.2 million rows with a `Seq Scan` (a
full table scan, no index). Someone shipped a query at 14:00 that hits `payments` by `customer_id` without
an index to support it, so it reads the entire table every time. The fix is now obvious: add the index.

Notice what made this fast and calm: you used each pillar for the question it's actually good at, and the
shared `trace_id` carried you across the handoffs. That's the whole game.

```text
   METRIC                TRACE                  LOG
   "p99 doubled    ──►   "payment-db span  ──►  "Seq Scan, 4.2M rows,
    at 14:00"             ate 690/812 ms"        missing index"
   THAT (+ how widespread)   WHERE              WHY
```

## The tool landscape, lightly

The product names are just implementations of these three pillars. You don't need to memorize them — you
need to know which pillar each one lives in.

- **Prometheus + Grafana** — the common open-source pairing for **metrics**. Prometheus scrapes and stores
  the numbers; Grafana charts them and drives alerts. (The metric query in Step 1 is PromQL, Prometheus's
  query language.) → [Prometheus and Grafana](/guides/prometheus-and-grafana).
- **Dynatrace** (and peers like Datadog, New Relic, Honeycomb) — commercial, all-in-one platforms that
  cover **all three pillars** in one place, with strong **tracing** waterfalls and automatic correlation
  between them. → [Reading Dynatrace](/guides/reading-dynatrace).
- **OpenTelemetry (OTel)** — *not* a backend you look at; it's the **open standard and toolkit for
  producing** logs, metrics, and traces in a vendor-neutral way. Your code emits OTel data; you then ship
  it to *any* backend (Prometheus, Dynatrace, Grafana, whatever). This is the big shift of the last few
  years: instrument once with OTel, and you're not locked into one vendor's agent.

💡 **The one thing to hold onto:** tools come and go, but every one of them is collecting, storing, or
displaying logs, metrics, or traces. Learn the three pillars and you can pick up any tool by asking "which
pillar is this, and which question is it for?"

## The two traps

Observability has two failure modes that don't announce themselves until they hurt. Name them now so you
spot them coming.

### Cardinality explosions

📝 **Cardinality** — the number of distinct values a label (a tag on a metric) can take. `status` has low
cardinality (a handful of HTTP codes). `user_id` has *enormous* cardinality (one value per user).

⚠️ **The gotcha.** Metric systems store a separate time series for *every unique combination of label
values*. Attach a high-cardinality label like `user_id`, `order_id`, or a raw URL with embedded IDs to a
metric, and you don't get one series — you get one *per user*, per *order*, per URL. That count multiplies
across every other label, and your metrics backend's memory and cost can blow up fast, sometimes taking
the whole monitoring system down. This is one of the most common ways teams accidentally break their own
observability.

The rule of thumb: **metrics labels should be low-cardinality** (service, endpoint, status, region —
things with a small, bounded set of values). When you genuinely need per-request detail like a user id or
order id, that belongs on a **log or a trace**, not a metric label. The pillars have different cost
shapes for a reason — respect them and you stay out of this hole.

### Alert fatigue

⚠️ **The gotcha.** If every metric has an alert and every alert pages a human, people stop reading the
alerts. After the tenth false alarm at 3am, the on-call's brain learns to swipe the notification away
without looking — and that's precisely the night the alert was real. An alert nobody trusts is worse than
no alert, because it costs attention *and* delivers nothing.

The fixes are mostly about restraint, not technology:

- **Alert on symptoms users feel, not on every internal number.** "Checkout p99 is above target" is worth
  waking someone. "CPU touched 81% for 30 seconds" usually isn't.
- **Page only on things a human must act on *now*.** Everything else is a dashboard or a low-priority
  ticket, not a page.
- **Tune thresholds and add a bit of duration** ("above target for 5 minutes") so a brief blip doesn't
  fire.

The goal is that when a page arrives, the on-call *believes* it. That trust is the actual product of a
good alerting setup — and the thing alert fatigue quietly destroys.

## Recap

1. Debug in the order **metric → trace → log**: *that* it's wrong (and how widespread) → *where* in the
   request → *why* in that one step.
2. A shared **`trace_id`** is what carries you across the handoffs from metric to trace to log.
3. The tools are just pillars wearing brand names: **Prometheus/Grafana** for metrics,
   **Dynatrace/Datadog/etc.** for all three with strong tracing, and **OpenTelemetry** as the
   vendor-neutral standard for *producing* the data.
4. **Cardinality explosion** — never put high-cardinality values (user/order ids, raw URLs) on metric
   labels; that detail belongs on logs and traces.
5. **Alert fatigue** — alert on symptoms users feel, page only on what needs action now, so that when a
   page fires, people still trust it.

---

[← Guide overview](_guide.md) · [Reading Logs Without Drowning →](/guides/reading-logs-without-drowning)
