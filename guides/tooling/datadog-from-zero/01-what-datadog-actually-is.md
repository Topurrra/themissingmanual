---
title: "Datadog, From Zero"
guide: datadog-from-zero
phase: 1
summary: "The all-in-one observability platform: the agent, metrics and dashboards, APM traces, log management, and monitors — plus the bill that surprises teams."
tags: [datadog, observability, metrics, apm, tracing, logs, monitoring, agent, tags]
difficulty: intermediate
synonyms: ["what is datadog", "datadog agent explained", "datadog tags", "datadog metrics vs logs vs traces", "how does datadog work", "datadog mental model"]
updated: 2026-06-30
---

# What Datadog actually is

Here's the reality most teams start from: the metrics live in one place, the logs in another, the traces somewhere else, and a "dashboard" is three browser tabs and a lot of squinting at timestamps. When a request is slow, you can see the latency spike on a graph, but the graph can't tell you *which* request or *why* — for that you go hunting in logs, and now you're correlating by eyeball.

Datadog's core idea is simple to say and the whole reason it exists: those three kinds of data are one story. It collects all of them through one agent, stamps them with the same tags, and lets you pivot from a spiking graph straight to the exact trace and the exact log lines behind it. The product surface is enormous, but the spine is small. Learn the spine and the rest is menus.

## The three signals

Almost everything in Datadog is one of three telemetry types. If you've read [Observability: Logs, Metrics, Traces](/guides/observability-logs-metrics-traces) this will be familiar — Datadog is one vendor's take on exactly those three.

- **Metrics** — numbers over time. CPU at 73%, 1,200 requests per second, 14 items in a queue. Cheap to store, great for trends and alerts, but they're aggregates: a metric tells you *that* latency rose, never *which* request.
- **Traces (APM)** — the story of one request as it moves through your services. A trace is made of spans, each span a unit of work (a DB query, an HTTP call), nested to show what called what and how long each took. This is the *why* behind a latency metric.
- **Logs** — the timestamped lines your code already writes. Datadog ingests, parses, and indexes them so you can search across every service at once instead of SSH-ing into boxes.

```text
METRIC   api.request.latency  p95 = 840ms   ← something is slow (the "what")
   │
TRACE    request abc123: web → auth → db    ← which request, where the time went (the "why")
   │       └─ db query span took 790ms
   │
LOG      "slow query: SELECT * FROM orders…" ← the exact line, with context
```

*What just happened:* one incident, read top to bottom — the metric raises the alarm, the trace localizes it to the DB span, the log shows the offending query. The value isn't any single signal; it's being able to walk between them without changing tools.

## The agent: one collector to ship them all

You don't send data to Datadog from a hundred places. You run **the Datadog Agent** — a small process on each host (or as a DaemonSet pod on each Kubernetes node) — and it does the collecting. It scrapes system metrics, receives traces from your instrumented apps, tails log files, runs integration checks against things like Postgres or nginx, and forwards all of it to Datadog over HTTPS.

```yaml
# /etc/datadog-agent/datadog.yaml — the agent's main config
api_key: "<YOUR_API_KEY>"
site: datadoghq.com        # which Datadog region/site to report to

logs_enabled: true         # off by default; logs are a separate paid product
apm_config:
  enabled: true            # turn on the trace receiver (listens on :8126)

tags:                      # host-level tags applied to everything this agent sends
  - env:prod
  - service:checkout
  - team:payments
```

*What just happened:* one config file turns on the three pipelines. Note `logs_enabled` is `false` until you set it — Datadog won't quietly start billing you for log ingestion. The `tags` block is the most important part of the file, and that's the next section.

> **Heads up:** the agent runs as a privileged process and ships data off your network. Treat the `api_key` like a credential — environment variable or a secrets manager, never committed to git.

## Tags: the one idea that makes it all useful

This is the concept that separates people who *have* Datadog from people who *use* it. A **tag** is a `key:value` label attached to your telemetry — `env:prod`, `service:checkout`, `region:us-east-1`, `version:1.4.2`. Tags are applied at the agent (host tags), in your app (service/span tags), and by integrations automatically.

Why they matter: tags are how you *slice* the data. Untagged, a latency metric is a single line — the average across everything, which hides every interesting problem. Tagged, the same metric becomes "p95 latency, grouped by `version`," and suddenly you can see that only `version:1.4.2` is slow, which means the last deploy did it.

```text
# Reading the same metric two ways

avg:api.request.latency                          → one line, tells you almost nothing

avg:api.request.latency{env:prod} by {version}   → one line per version
   version:1.4.1  → 120ms
   version:1.4.2  → 840ms   ← the deploy that broke it, found in one query
```

*What just happened:* the `{filter} by {grouping}` syntax is the heart of every Datadog query — metrics, traces, and logs all use the same tag-based filtering. Good tagging is what lets one query answer "is it this environment? this version? this customer?" Bad tagging makes Datadog an expensive line chart.

The flip side, which phase 3 returns to: every distinct combination of tag values on a metric is a separate thing Datadog stores and bills as a *custom metric*. Tags are the power and the cost in the same breath.

> **In the wild:** the teams who love Datadog enforce a small, consistent tag vocabulary — `env`, `service`, `version`, `team` on everything — usually through a shared agent config or a deploy template. The teams who fight it let every service invent its own tag names, and nothing lines up across dashboards.

## So what is it, really?

Datadog is one agent that collects metrics, traces, and logs, a tagging system that ties them together so you can pivot between them, and a pile of UI (dashboards, monitors, SLOs) built on top of that data. The "all-in-one" promise is real — and so is the bill that comes with sending it everything. Phase 2 is the daily loop; phase 3 is the money.

```quiz
[
  {
    "q": "What is the Datadog Agent's job?",
    "choices": [
      "It's the web dashboard you log into",
      "A process on each host that collects metrics, traces, and logs and forwards them to Datadog",
      "A billing console for tracking spend",
      "A database where your telemetry is stored long-term"
    ],
    "answer": 1,
    "explain": "The agent runs on your hosts (or as a DaemonSet in Kubernetes), gathers the three signals plus integration checks, and ships them to Datadog over HTTPS."
  },
  {
    "q": "Why are tags described as the key to slicing data?",
    "choices": [
      "They compress the data to reduce storage cost",
      "They let you filter and group telemetry, e.g. latency by version, to isolate exactly what's affected",
      "They are required for the agent to start",
      "They encrypt the data in transit"
    ],
    "answer": 1,
    "explain": "Tags turn a flat metric into something you can pivot on — by env, service, version, customer — which is how you go from 'it's slow' to 'only this version is slow.'"
  },
  {
    "q": "Which signal best answers 'WHY was this specific request slow,' as opposed to 'THAT latency rose'?",
    "choices": [
      "Metrics, because they're numbers over time",
      "A trace (APM), because it shows the spans of one request and where the time went",
      "Logs, because they're timestamped",
      "Tags, because they group data"
    ],
    "answer": 1,
    "explain": "A metric is an aggregate that flags the 'what.' A trace breaks one request into spans, showing which call (e.g. a DB query) consumed the time — the 'why.'"
  }
]
```

[← Overview](_guide.md) | [Phase 2: The everyday loop](02-the-everyday-loop.md) →
