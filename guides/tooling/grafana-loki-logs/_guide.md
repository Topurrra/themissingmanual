---
title: "Grafana Loki"
guide: grafana-loki-logs
phase: 0
summary: "Logs that act like Prometheus: Loki indexes only labels (not full text), making centralized logging cheap, and ties them to your metrics in Grafana."
tags: [loki, grafana, logging, logql, promtail, observability, labels, alloy]
category: tooling
group: "Observability"
order: 34
difficulty: intermediate
synonyms: ["grafana loki", "loki logs", "logql query language", "loki vs elasticsearch", "loki labels index", "promtail log shipping", "loki cheap logging", "loki grafana logs metrics", "what is loki"]
updated: 2026-06-30
---

# Grafana Loki

You want centralized logs, but the full-text logging stack you priced out costs more than the app it watches. Indexing every word of every log line is expensive, and most of those words you never search. Loki takes the opposite bet: index only a handful of labels, store the raw log lines compressed and cheap, and lean on brute-force scanning for the rest. This guide takes you from "logging is too expensive to centralize" to running queries in the same Grafana pane as your metrics.

## How to read this

Read the phases in order. Phase 1 builds the mental model: why Loki indexes labels instead of content, and how that one decision shapes everything else. Phase 2 is the everyday core — shipping logs with an agent and querying them with LogQL. Phase 3 is production reality: the cardinality trap, the Elasticsearch tradeoff, and what breaks at scale. Each phase ends with a short quiz so you can check yourself before moving on.

## The phases

1. [What Loki actually is](01-what-loki-actually-is.md) — the mental model: index the labels, not the log content.
2. [Shipping logs and querying with LogQL](02-shipping-and-querying-logql.md) — agents, label streams, and the query language.
3. [Cardinality, cost, and the Elasticsearch tradeoff](03-cardinality-cost-tradeoffs.md) — where Loki shines, where it bites, and how to size it.

[Phase 1: What Loki actually is](01-what-loki-actually-is.md) →
