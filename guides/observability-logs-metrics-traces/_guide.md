---
title: "Observability: Logs, Metrics & Traces"
guide: "observability-logs-metrics-traces"
phase: 0
summary: "What observability actually is, how logs, metrics, and traces each see a different slice of your running system, and how to use all three together to find out why something is slow."
tags: [observability, monitoring, logs, metrics, traces, opentelemetry, distributed-tracing, performance]
category: performance
difficulty: intermediate
order: 4
synonyms: ["what is observability", "observability vs monitoring", "difference between logs metrics and traces", "what are the three pillars of observability", "what is a trace and a span", "how to debug a slow service", "what is opentelemetry", "metrics vs logs"]
updated: 2026-06-19
---

# Observability: Logs, Metrics & Traces

Your service is misbehaving. The dashboard says response times are up, but it doesn't say *why*. You SSH
into a box and start tailing logs, but you don't even know which of your six services is the slow one.
You're poking at a black box, hoping to bump into the problem. That feeling — knowing something is wrong
but having no way to ask the system what — is what observability exists to fix.

Here's the reframe that makes the whole topic click: a running system is constantly throwing off three
different *kinds* of evidence about itself. **Logs** are the diary of individual events. **Metrics** are
the numbers it counts over time. **Traces** are the story of one request's whole journey. None of them is
"the right one" — each sees something the others can't. Once you know what each kind is best at, you stop
guessing and start asking precise questions: *which* service, *how* slow, and *why*. This guide gets you
there.

## How to read this
- **Already drowning in a slowdown right now?** Jump to [Phase 3: Putting Them Together](03-putting-them-together.md) — it walks the exact metric → trace → log path from "something's slow" to "here's the line of code."
- **Want observability to finally make sense?** Read in order. We start with the mental model (Phase 1), then meet the three kinds of evidence (Phase 2), then use them together (Phase 3).

## The phases
1. **[Monitoring vs Observability](01-monitoring-vs-observability.md)** — the core distinction: monitoring watches the things you already knew to watch; observability lets you ask *new* questions about a misbehaving system without shipping new code to answer them.
2. **[The Three Pillars](02-the-three-pillars.md)** — logs (discrete events), metrics (numbers over time: counters, gauges, histograms), and traces (one request across services, broken into spans). What each is genuinely best at, and where each falls down.
3. **[Putting Them Together](03-putting-them-together.md)** — debugging a real slowdown end to end (metric alert → trace finds the slow service → logs explain why), a quick map of the tool landscape, and the two traps that bite teams: cardinality explosions and alert fatigue.

> This guide stays at the level of *concepts and how they fit together*. The hands-on, tool-specific deep
> dives live in their own guides: [reading logs line by line](/guides/reading-logs-without-drowning),
> [Prometheus and Grafana for metrics](/guides/prometheus-and-grafana), and
> [reading a Dynatrace trace](/guides/reading-dynatrace). Read this first to get the map; read those when
> you're in a specific tool.
