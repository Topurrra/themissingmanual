---
title: "The everyday loop"
guide: datadog-from-zero
phase: 2
summary: "The all-in-one observability platform: the agent, metrics and dashboards, APM traces, log management, and monitors — plus the bill that surprises teams."
tags: [datadog, dashboards, apm, tracing, logs, monitors, alerts, slo, observability]
difficulty: intermediate
synonyms: ["datadog dashboard tutorial", "datadog apm trace reading", "datadog log query syntax", "datadog monitor setup", "datadog alert example", "datadog slo", "how to use datadog day to day"]
updated: 2026-06-30
---

# The everyday loop

Phase 1 was the map. This is the territory: the four things you'll actually do in Datadog on a normal week. You'll graph a metric on a dashboard, follow a slow request through a trace, search logs across every service at once, and set up a monitor so the platform pages you instead of a customer telling you it's down. Each of these leans on the same tag-based query syntax, so once one clicks the others come quickly.

## Dashboards: metrics you can read at a glance

A dashboard is a saved set of widgets — graphs, query values, heatmaps — each backed by a metric query. The query language is the `{filter} by {grouping}` shape from phase 1, wrapped in an aggregation.

```text
# A timeseries widget query, read left to right:

sum:web.requests{env:prod, service:checkout} by {status_code}.as_rate()
 │   │            │                            │              │
 │   │            │                            │              └─ per-second rate, not raw count
 │   │            │                            └─ one line per HTTP status
 │   │            └─ scope: only prod checkout traffic
 │   └─ the metric name
 └─ space aggregation across matching hosts/tags
```

*What just happened:* one line of query language produces a graph of checkout request rate, split by status code, in prod only. Watch the `5xx` line and you have a live error-rate panel. Datadog ships pre-built dashboards for its integrations (Postgres, Kubernetes, nginx), so you rarely start from a blank page — you clone one and adjust the scope.

A useful habit: **template variables**. Define `$env` and `$service` at the top of a dashboard, reference them in every query (`{env:$env}`), and one dropdown re-scopes the whole board. That's how a single dashboard serves staging and prod without duplication.

## APM: reading a trace

When a metric says latency is up, APM tells you where the time went. The **service map** shows your services and the calls between them; the **flame graph** breaks one request into spans.

```text
Trace 7f3a… total: 840ms
─────────────────────────────────────────────────────────
web          ████████████████████████████████████  840ms
 └ auth      ██                                      40ms
 └ db.query  ████████████████████████████████       790ms   ← the culprit
      "SELECT * FROM orders WHERE user_id = ?"
 └ render    █                                       10ms
```

*What just happened:* the flame graph makes the bottleneck obvious — 790 of 840ms is a single database span, and it shows you the query. Without the trace you'd know the request was slow; with it you know to add an index on `orders.user_id`. Traces carry the same tags as metrics, so you can filter to `version:1.4.2` and confirm only the new deploy is slow.

Two terms that trip people up: **sampling** and **trace retention**. Datadog doesn't necessarily keep every trace forever — high-throughput services sample (keep a representative fraction), and retention filters decide which traces are indexed for search. The defaults usually keep error traces and slow traces, which are the ones you want. This matters for cost, which phase 3 covers.

## Logs: search across everything at once

Once `logs_enabled: true` is set, the agent tails your log files and ships them. In the Log Explorer you query with the same facet/tag idea, not grep.

```text
# Log Explorer query
service:checkout status:error @http.status_code:500 env:prod

# meaning: checkout service, error level, HTTP 500, in prod
```

*What just happened:* one query searched every checkout host's logs at once and returned only prod 500s. The `@http.status_code` syntax (with the `@`) queries a *parsed attribute* — a field Datadog extracted from structured (JSON) logs. This is the payoff of logging in JSON: you get queryable fields instead of full-text search across a wall of strings.

The strongest move here is **trace-log correlation**. If your app injects the `trace_id` into its logs, Datadog links them — from a slow trace you jump to that exact request's log lines, and from a log line you jump to its trace. That's the "one story" promise made literal.

> **For builders:** correlation is worth setting up early. Most Datadog tracing libraries can auto-inject `trace_id` and `span_id` into your log context. Do it once and every future incident gets shorter, because "show me the logs for *this* request" becomes a click instead of a timestamp hunt.

## Monitors: getting paged at the right time

A **monitor** watches a query and changes state (OK → Warn → Alert) when it crosses a threshold, then notifies a channel — Slack, PagerDuty, email. This is what turns passive graphs into something that wakes the right person.

```text
# A metric monitor, in plain terms
Query:    avg(last_5m): avg:web.request.latency{env:prod} by {service} > 500
Warn:     > 400 ms
Alert:    > 500 ms
Notify:   @slack-payments-oncall  @pagerduty-payments
Message:  "p95 latency on {{service.name}} is {{value}}ms in prod. Runbook: …"
```

*What just happened:* this monitor evaluates per-service latency every few minutes and pages the payments on-call only when prod latency crosses 500ms. The `{{service.name}}` and `{{value}}` are template variables filled in at alert time, so the message names the actual broken service. A good monitor message includes a runbook link — future-you, half-asleep, will thank present-you.

Two refinements that keep monitors from becoming noise:

- **Notify on the right grain.** A monitor grouped `by {service}` alerts per service, so one bad service doesn't silence alerts for the others. Without grouping, the first thing to break masks everything after it.
- **SLOs.** A Service Level Objective tracks a target over a window — "99.9% of requests under 300ms over 30 days" — and burns down an *error budget*. Alert on the budget burn rate, not every blip, and you page for trends that matter instead of every transient spike. This is the difference between actionable alerts and alert fatigue. [Prometheus and Grafana](/guides/prometheus-and-grafana) frames the same SLO/error-budget idea in the open-source stack if you want a second angle.

## The loop, end to end

Here's a normal incident, using all four: a monitor pages that prod checkout latency crossed 500ms → you open the linked dashboard and see `5xx` and latency both spiking on `version:1.4.2` → you click into APM, filter to that version, and the flame graph shows a 790ms DB span → you jump from the trace to its correlated logs and read the slow query → you ship an index and watch the monitor recover. Four tools, one tab-free path, because the tags line up. Phase 3 is what that convenience costs.

```quiz
[
  {
    "q": "In a flame graph for one request, what does a single very wide span usually tell you?",
    "choices": [
      "That span is where most of the request's time was spent — the bottleneck",
      "That span errored",
      "That span was sampled out",
      "The request was retried that many times"
    ],
    "answer": 0,
    "explain": "Span width is duration. A span that fills most of the trace's total time is where the latency lives — e.g. a slow DB query — which is exactly what you go fix."
  },
  {
    "q": "What does the `@` prefix mean in a log query like `@http.status_code:500`?",
    "choices": [
      "It mentions a user",
      "It queries a parsed attribute (a structured field) rather than full text",
      "It's a comment",
      "It escapes a reserved word"
    ],
    "answer": 1,
    "explain": "@ targets an extracted/parsed attribute, which you get from structured (JSON) logs. It's far more precise than full-text search and is a big reason to log in JSON."
  },
  {
    "q": "Why alert on an SLO's error-budget burn rate instead of on every metric spike?",
    "choices": [
      "Burn-rate alerts are cheaper to evaluate",
      "It pages for sustained problems that threaten your target, cutting noise from transient blips",
      "SLOs disable all other monitors",
      "Error budgets never run out, so you never get paged"
    ],
    "answer": 1,
    "explain": "An SLO tracks a target over a window with an error budget. Alerting on burn rate fires for trends that actually endanger the objective, instead of every momentary spike — far less alert fatigue."
  }
]
```

[← Phase 1: What Datadog actually is](01-what-datadog-actually-is.md) | [Overview](_guide.md) | [Phase 3: The bill, and how it sneaks up](03-the-bill-and-how-it-sneaks-up.md) →
