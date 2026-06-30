---
title: "The bill, and how it sneaks up"
guide: datadog-from-zero
phase: 3
summary: "The all-in-one observability platform: the agent, metrics and dashboards, APM traces, log management, and monitors — plus the bill that surprises teams."
tags: [datadog, cost, pricing, custom-metrics, cardinality, log-volume, observability, billing]
difficulty: intermediate
synonyms: ["why is datadog so expensive", "datadog custom metrics cost", "datadog cardinality bill", "datadog log volume pricing", "datadog per host pricing", "datadog cost optimization", "datadog billing surprise"]
updated: 2026-06-30
---

# The bill, and how it sneaks up

Everything so far is the part Datadog wants you to love, and you will. This phase is the conversation that doesn't happen until the invoice does. Datadog is genuinely excellent and genuinely expensive, and the worst version is the surprise: a bill that doubles month over month because of a config change nobody flagged as a spending decision. The pricing isn't a trick — the things that make Datadog powerful (send everything, tag everything) are the same things that make it costly, and the meter runs quietly. Knowing where the money goes is the difference between a tool you control and a tool that controls your budget.

## The shape of the bill

Datadog bills each product separately, mostly on volume. The exact numbers change and depend on your contract, so this guide stays qualitative — the *categories* are what you need to internalize:

- **Infrastructure** — billed **per host per month**. A "host" is a machine reporting metrics. This is the floor, and it scales with your fleet.
- **APM** — billed **per host** (often a higher per-host rate than infra), sometimes plus ingested/indexed span volume.
- **Logs** — billed on two separate axes: **ingestion** (bytes received) *and* **indexing/retention** (how many you make searchable, and for how long). You can ingest a log without indexing it, which matters a lot below.
- **Custom metrics** — billed per **custom metric**, where the unit is not what you'd guess. This is the single most common source of a shock bill, so it gets its own section.

The trap is that each is individually reasonable and they're additive across a growing fleet. Three products times more hosts times more volume compounds fast.

## The custom-metrics cardinality trap

This is the one that gets everyone. A **custom metric** in Datadog's billing is not "a metric name." It's a **unique combination of metric name plus tag values** — each distinct combination is a separate billed metric. The number of those combinations is the metric's **cardinality**.

```text
Metric: orders.processed
Tags:   env (2 values) × region (4) × service (3)
        = 2 × 4 × 3 = 24 custom metrics.  Fine.

Now someone adds a tag: user_id (say 50,000 active users)
        = 2 × 4 × 3 × 50,000 = 1,200,000 custom metrics.
        From ONE metric name. From ONE line of code.
```

*What just happened:* multiplying tag values multiplies billed metrics. Adding a high-cardinality tag — `user_id`, `request_id`, `email`, a raw URL with IDs in it, a container ID — explodes the count, and nothing in your code looks wrong. The graph still works; the invoice quietly grew by a million metrics. **The rule: never put unbounded or per-request identifiers in metric tags.** Those belong on logs and traces (where they're searchable and not multiplied), never on metrics.

> **Heads up:** the dangerous part is that the explosion is invisible at write time. Your code emits one `orders.processed` either way — the cost is decided by how many *distinct tag combinations* show up over the month. A single new tag can be a five-figure decision that looks like a one-line change.

Datadog gives you a **Metrics Summary** page and a **Metrics without Limits** feature to see per-metric cardinality and to drop tags you don't query on. Auditing cardinality is the highest-leverage cost work you can do.

## Log volume: ingest cheap, index deliberately

Logs are the second classic surprise, because **ingestion and indexing are billed separately** and teams forget the second axis. The expensive part is usually *indexing* — making logs searchable and retaining them.

The fix is built into the product: **ingest everything, index selectively.** Datadog lets you ingest all your logs (cheaper, and you keep them via archive to S3) but apply **exclusion filters** in the pipeline so only the logs worth searching get indexed.

```text
# Log indexing pipeline (conceptual)
INGEST  all logs ─────────────────────────────►  archive to your S3 (cheap, rehydrate later)
            │
            ├─ index:  status:error, status:warn        ← keep searchable
            └─ exclude: status:info on /healthz 200      ← ingest but DON'T index (90% of volume)
```

*What just happened:* the health-check and routine 200-OK lines — often the overwhelming majority of log volume — get ingested and archived but not indexed, so you stop paying to make noise searchable. If you ever need them, you **rehydrate** from the archive on demand. The art is excluding the chatter while keeping every error and warning indexed.

## Hosts and APM: watch the fleet definition

Per-host pricing sounds simple until autoscaling and short-lived containers get involved. Datadog typically bills the **high-water mark** or a percentile of concurrent hosts over the billing period, not a flat snapshot — so a fleet that bursts to 200 hosts under load costs more than its steady-state 50 suggests. Ephemeral containers can each register as billable depending on how they're counted, so a chatty autoscaler or a CI pipeline that spins up agent-enabled hosts can quietly inflate the count.

The practical guardrails: don't run the full agent (especially APM) on machines that don't need observability, scope APM to the services that matter rather than everything, and check whether short-lived CI/build hosts are reporting as billable infra.

## Keeping it honest

You don't fix Datadog cost once; you keep it honest with a few habits:

- **Set a tag budget.** Agree on a small set of allowed metric tags (`env`, `service`, `version`, `region`, `team`) and forbid per-user/per-request IDs on metrics. Most cardinality blowups are one rogue tag.
- **Audit cardinality monthly.** The Metrics Summary page sorts by volume — the top few metrics are usually most of the bill.
- **Index logs deliberately.** Exclusion filters for health checks and routine successes; archive the rest to your own storage.
- **Treat config changes as spend changes.** "Add a tag," "turn on logs for this service," "enable APM everywhere" are budget decisions. Route them through whoever owns the bill.
- **Use Datadog's own usage dashboards.** It bills you using data it'll happily graph — build a usage/cost dashboard and put a monitor on *that*. Page yourself when spend spikes, the same way you'd page on latency.

## The honest mental model, completed

Datadog earns its reputation: one agent, three correlated signals, dashboards and monitors that genuinely shorten incidents. The catch is that its pricing rewards exactly the behavior the product encourages — send everything, tag everything, keep everything — and the meter runs in categories (per-host, per-custom-metric-cardinality, per-log-byte) that don't show up in your code review. Use it fully, but treat cardinality and log indexing as first-class engineering concerns, not afterthoughts. The teams who are happy with Datadog aren't the ones who use it less — they're the ones who decided, on purpose, what to send.

> **In the wild:** the recurring horror story is identical every time — a tag with `user_id` or a raw request path lands in a metric, the next invoice arrives with an extra zero, and someone spends a frantic afternoon in the Metrics Summary page hunting the one tag. Set the tag budget before that happens, not after.

```quiz
[
  {
    "q": "In Datadog billing, what counts as one 'custom metric'?",
    "choices": [
      "One metric name, regardless of tags",
      "One unique combination of metric name plus tag values (its cardinality)",
      "One host reporting the metric",
      "One dashboard widget using the metric"
    ],
    "answer": 1,
    "explain": "Each distinct combination of name + tag values is a separate billed custom metric. That's why adding a high-cardinality tag like user_id can explode the count from one line of code."
  },
  {
    "q": "Why is adding `user_id` as a tag on a metric dangerous, while putting it on a log or trace is fine?",
    "choices": [
      "user_id is personally identifiable and banned on metrics",
      "Metrics bill per tag-value combination, so a high-cardinality tag multiplies billed metrics; logs/traces don't multiply that way",
      "Logs can't store user_id",
      "It makes the metric query slower but costs the same"
    ],
    "answer": 1,
    "explain": "Tag-value combinations on metrics are the billing unit, so an unbounded id multiplies cost. On logs and traces that same id is a searchable field, not a multiplier — which is where per-request identifiers belong."
  },
  {
    "q": "What's the standard way to cut log cost without losing the ability to investigate later?",
    "choices": [
      "Turn off logging entirely",
      "Index every log to be safe",
      "Ingest everything but apply exclusion filters so only useful logs (errors, warnings) are indexed; archive the rest",
      "Lower the agent's CPU limit"
    ],
    "answer": 2,
    "explain": "Ingestion and indexing are billed separately, and indexing is the costly part. Ingest all, index selectively with exclusion filters, archive the rest to your own storage, and rehydrate on demand."
  }
]
```

[← Phase 2: The everyday loop](02-the-everyday-loop.md) | [Overview](_guide.md)
