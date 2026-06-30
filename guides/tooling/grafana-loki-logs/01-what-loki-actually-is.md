---
title: "What Loki actually is"
guide: grafana-loki-logs
phase: 1
summary: "Logs that act like Prometheus: Loki indexes only labels (not full text), making centralized logging cheap, and ties them to your metrics in Grafana."
tags: [loki, grafana, logging, logql, promtail, observability, labels]
difficulty: intermediate
synonyms: ["grafana loki", "loki labels index", "what is loki", "loki vs elasticsearch", "loki cheap logging", "loki streams"]
updated: 2026-06-30
---

# What Loki actually is

Here is the reality Loki was built for. You have logs scattered across dozens of containers that come and go. You want them in one place you can search. So you look at the standard full-text logging stack, and you flinch at the bill - because to make every word searchable, that kind of system builds an index over the entire content of every line. Indexes are not free; a full-text index can rival or exceed the size of the data itself. For something as high-volume and low-value-per-line as logs, you end up paying to index a haystack you mostly never read.

Loki's founders, the same people behind Grafana and the Prometheus ecosystem, asked a sharper question: *what do you actually search by?* In practice, you almost always start narrow - "show me the logs from this service, in this namespace, at error level" - and then you grep within that slice. Loki is built around exactly that habit.

## It indexes labels, not content

This is the one idea that explains everything else about Loki. Loki does **not** index the text of your log lines. It indexes a small set of **labels** attached to each stream of logs - things like `app`, `env`, `level`, `namespace`. The log content itself is stored compressed in cheap object storage and left un-indexed.

Picture a single log line and how Loki splits it:

```text
{app="checkout", env="prod", level="error"}   user 90431 payment declined: card expired
└──────────────── indexed labels ───────────┘  └──────── NOT indexed, just stored ───────┘
```

*What just happened:* the part in braces is the only part Loki builds an index over. The message after it - the actual content - is compressed and parked in object storage. Loki never builds a word-by-word index of "payment declined" or "card expired."

If that sounds like it would make text search impossible, it doesn't - it makes it *deferred*. When you search for a string, Loki first uses the label index to find the matching streams, then **brute-force scans** the raw content of only those streams. The label index does the cheap narrowing; a fast linear scan does the rest. You trade "index everything up front" for "store cheaply, scan a small slice on demand."

## A stream is a unique set of labels

In Loki, a **stream** is the unit of everything. A stream is one unique combination of label key-value pairs, and the log lines for that combination, in time order.

```text
Stream A:  {app="checkout", env="prod", level="info"}   → lines, lines, lines...
Stream B:  {app="checkout", env="prod", level="error"}  → lines, lines, lines...
Stream C:  {app="api",      env="prod", level="info"}    → lines, lines, lines...
```

*What just happened:* each distinct label set is its own stream with its own ordered log lines. Change one label value - `info` to `error` - and you have a different stream. This is identical to how Prometheus treats a time series, which is the whole point: if you know Prometheus, you already know Loki's data model.

That deliberate symmetry with Prometheus is why Loki fits the rest of the stack so naturally. The label model, the query feel, the agent-based collection - they mirror metrics on purpose. If the broader picture of logs, metrics, and traces is still fuzzy, the [observability-logs-metrics-traces](/guides/observability-logs-metrics-traces) guide maps how the three pillars relate.

## Why this makes logging cheap

The expensive part of a logging system is the index, and the index is what scales with your data volume in the nastiest way. By indexing only labels, Loki keeps its index tiny - it grows with the *number of unique label combinations*, not with the *number of bytes of log text*. The bulk of your data, the raw lines, lands in object storage like S3 or GCS, which is about the cheapest durable storage you can buy.

```text
Full-text approach:  big index over all content  +  content        → index dominates cost
Loki approach:       tiny index over labels       +  compressed content in object storage
```

*What just happened:* Loki moves the cost from an ever-growing index into cheap object storage. That's the lever that makes "centralize all our logs" affordable instead of a budget fight.

> The flip side, and the thing that bites newcomers: because the index is keyed on labels, the *number of unique label values* is what you must protect. A label like `level` has a few values and is perfect. A label like `user_id` or `request_id` has millions of values, would create millions of streams, and would blow up the very index Loki works hard to keep small. This is **cardinality**, and Phase 3 is largely about respecting it.

## It lives inside Grafana, next to your metrics

Loki's other reason to exist is correlation. Because Loki shares Prometheus's label model and plugs into Grafana as a first-class data source, you can put a metrics graph and the matching logs on the **same dashboard**, scoped by the **same labels**.

```text
Grafana dashboard
  ┌─ panel: error rate for {app="checkout"}  (Prometheus)  ▲ spike at 14:22
  └─ panel: logs for {app="checkout", level="error"} (Loki) ── the lines behind the spike
```

*What just happened:* the metric tells you *something* spiked; the Loki panel right below it, filtered by the same `app` label, shows you the exact lines from that spike. You pivot from "the graph went red" to "here is why" without leaving the page or re-typing a query into a different tool.

**In the wild:** teams already running Prometheus and Grafana reach for Loki precisely because it's the path of least resistance - same labels, same UI, same mental model, and a fraction of the storage cost of a full-text stack. If you haven't met the metrics side yet, [prometheus-and-grafana](/guides/prometheus-and-grafana) is the natural companion to this guide.

```quiz
[
  {
    "q": "What does Loki build its index over?",
    "choices": [
      "Every word in every log line",
      "Only the labels attached to each log stream",
      "The timestamps only",
      "Nothing; it never indexes anything"
    ],
    "answer": 1,
    "explain": "Loki indexes only the labels (like app, env, level). The log content itself is stored compressed and un-indexed, which is what keeps the index tiny and storage cheap."
  },
  {
    "q": "How does Loki find a text string inside log content if it doesn't index that content?",
    "choices": [
      "It can't - text search is impossible in Loki",
      "It uses the label index to narrow to matching streams, then brute-force scans only those",
      "It rebuilds a full-text index on every query",
      "It searches a separate Elasticsearch cluster"
    ],
    "answer": 1,
    "explain": "Labels do the cheap narrowing; Loki then linearly scans the raw content of only the matching streams. Index up front is traded for scan on demand."
  },
  {
    "q": "What is a 'stream' in Loki?",
    "choices": [
      "A single log line",
      "One unique combination of label key-value pairs and its ordered log lines",
      "A network connection to the Loki server",
      "A Grafana dashboard panel"
    ],
    "answer": 1,
    "explain": "A stream is one unique label set plus its time-ordered lines - the same idea as a Prometheus time series, which is why the data models match."
  }
]
```

[← Overview](_guide.md) · [Phase 2: Shipping logs and querying with LogQL →](02-shipping-and-querying-logql.md)
