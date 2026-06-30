---
title: "Shipping logs and querying with LogQL"
guide: grafana-loki-logs
phase: 2
summary: "Logs that act like Prometheus: Loki indexes only labels (not full text), making centralized logging cheap, and ties them to your metrics in Grafana."
tags: [loki, grafana, logging, logql, promtail, observability, alloy]
difficulty: intermediate
synonyms: ["promtail log shipping", "logql query", "loki grafana alloy", "loki label filter", "logql line filter", "loki metric query"]
updated: 2026-06-30
---

# Shipping logs and querying with LogQL

You have the mental model: index labels, store content cheap. Now you need to actually get logs into Loki and ask questions of them. There are two halves to the day-to-day: an **agent** that tails your logs and ships them with the right labels, and **LogQL**, the query language you use to read them back. Both will feel familiar if you've touched Prometheus, because both were built to rhyme with it.

## An agent tails the files and attaches labels

Loki doesn't pull logs; something pushes them to it. That something is a collection agent running next to your workloads. The classic one is **Promtail**; the current recommended agent is **Grafana Alloy**, which does the same job and more. Either way the agent's responsibilities are the same: find the log sources, attach labels, and push the lines to Loki.

Here's a stripped-down Promtail config for tailing a file:

```yaml
clients:
  - url: http://loki:3100/loki/api/v1/push   # where to send logs

scrape_configs:
  - job_name: checkout
    static_configs:
      - targets: [localhost]
        labels:
          app: checkout        # ← becomes an indexed label
          env: prod            # ← indexed label
          __path__: /var/log/checkout/*.log   # which files to tail
```

*What just happened:* the agent tails every file matching `__path__`, and stamps each line it ships with `app="checkout"` and `env="prod"`. Those labels are exactly what Loki will index, so they're the dimensions you'll be able to query and correlate on later. The `__path__` is a directive telling the agent what to read; it does not become a label.

The single most important discipline here lives in this config block: **choose labels that have few possible values.** `app`, `env`, `level`, `namespace` - good. Anything per-request or per-user - bad, for reasons Phase 3 makes painful. Promtail can extract fields from log content into labels with pipeline stages, and that power is exactly where people accidentally create cardinality disasters. When in doubt, attach fewer labels.

> In Kubernetes, you don't hand-write paths. The agent runs as a DaemonSet, auto-discovers pods, and turns Kubernetes metadata - namespace, pod, container, app - into labels for you. The model is the same; the label values come from the cluster instead of a static file.

## LogQL: pick the streams, then filter the lines

LogQL has a deliberate two-step shape that mirrors how Loki works internally. First you select streams by their labels - this is the cheap, indexed part. Then you filter the content of those streams - this is the scan.

```logql
{app="checkout", env="prod"} |= "payment declined"
└──── stream selector ──────┘ └── line filter ──┘
```

*What just happened:* the part in braces is the **stream selector** - Loki uses the label index to find only the checkout/prod streams, fast. Then `|=` is a **line filter** meaning "keep lines containing this string," applied by scanning just those streams. This is the brute-force scan from Phase 1, made visible in the query.

The stream selector is mandatory - every LogQL query must start with one. You cannot ask Loki "find this string everywhere," because there is no global content index to answer that. You always narrow by label first. The line filter operators are worth memorizing:

```text
|=  "text"      line contains the string
!=  "text"      line does NOT contain the string
|~  "regex"     line matches the regular expression
!~  "regex"     line does NOT match the regex
```

*What just happened:* these four operators are most of what you'll ever use for reading logs. Chain them - `{app="checkout"} |= "error" != "timeout"` - and each one further narrows the scan, left to right.

## Parse fields out of the line at query time

Because Loki stores raw content, you often want to pull structured fields out of a line *when you query*, not when you ingest. LogQL parsers do this. If your app logs JSON, the `json` parser turns fields into temporary labels you can filter on for that query only:

```logql
{app="checkout"} | json | status_code >= 500
```

*What just happened:* `| json` parses each line's JSON body into fields, then `status_code >= 500` filters on a parsed field. Crucially, `status_code` is **not** an indexed label - it's extracted at query time, so it costs you nothing in cardinality. This is the Loki way to get rich filtering without paying the index price: keep indexed labels tiny, parse the detail on demand.

## Turn logs into metrics with a range query

LogQL has a second mode. Wrap a log query in a **range aggregation** and Loki computes a number over time - letting a stream of log lines behave like a Prometheus metric.

```logql
sum by (status_code) (
  rate({app="checkout"} | json | __error__="" [5m])
)
```

*What just happened:* `rate(...[5m])` counts matching lines per second over a 5-minute window, and `sum by (status_code)` groups the result. You've turned raw logs into a graphable time series - error rate straight from log volume, no separate metric needed. This is why Loki panels sit so comfortably next to Prometheus panels in Grafana: the query language and the output shape match. (The [prometheus-and-grafana](/guides/prometheus-and-grafana) guide covers the `rate` and `sum by` machinery in depth.)

**For builders:** start every dashboard query with the narrowest stream selector that's correct, and add a small time range. The selector and the range together decide how much data Loki has to scan - and an unscoped query over a wide window is the number-one way to make Loki feel slow when it shouldn't.

```quiz
[
  {
    "q": "What must every LogQL query begin with?",
    "choices": [
      "A regular expression",
      "A stream selector (label matchers in braces)",
      "A time range",
      "The word SELECT"
    ],
    "answer": 1,
    "explain": "Every LogQL query starts with a stream selector. There's no global content index, so you always narrow by labels first, then filter the content of those streams."
  },
  {
    "q": "In `{app=\"checkout\"} |= \"payment declined\"`, what does the `|=` part do?",
    "choices": [
      "Selects which streams to read by label",
      "Keeps only lines that contain the string 'payment declined', by scanning the selected streams",
      "Assigns a new label to each line",
      "Deletes matching lines from Loki"
    ],
    "answer": 1,
    "explain": "`|=` is a line filter: after the label index narrows to the checkout streams, Loki scans them and keeps lines containing the string. That scan is the brute-force step."
  },
  {
    "q": "Why is filtering on a field via `| json | status_code >= 500` safe for cardinality?",
    "choices": [
      "Because JSON fields are automatically indexed",
      "Because the field is parsed at query time and is never an indexed label",
      "Because Loki ignores numeric fields",
      "It isn't safe; it creates a new stream per status code"
    ],
    "answer": 1,
    "explain": "Parsers extract fields at query time only. The parsed field is not an indexed label, so it adds no streams and no cardinality cost - that's how you get rich filtering cheaply."
  }
]
```

[← Phase 1: What Loki actually is](01-what-loki-actually-is.md) · [Overview](_guide.md) · [Phase 3: Cardinality, cost, and the Elasticsearch tradeoff →](03-cardinality-cost-tradeoffs.md)
