---
title: "Prometheus & Grafana, Explained"
guide: "prometheus-and-grafana"
phase: 0
summary: "Prometheus scrapes and stores your metrics; Grafana queries and draws them. What each one actually does, how to read a PromQL query, and how to build dashboards and alerts that don't lie to you."
tags: [prometheus, grafana, metrics, promql, observability, monitoring]
category: performance
difficulty: intermediate
synonyms: ["what is prometheus", "what is grafana", "difference between prometheus and grafana", "how does prometheus work", "promql for beginners", "how to read a promql query", "what is a counter vs gauge", "prometheus alerting explained"]
order: 7
updated: 2026-06-19
---

# Prometheus & Grafana, Explained

You've seen the dashboards — the wall of green graphs someone set up, the one with a red spike at 3am that everyone points at during the incident review. Maybe you've even been handed a Grafana URL and a vague "the metrics are in there somewhere." But nobody ever sat you down and explained which tool does what, why the graphs show `rate(...)` instead of a plain number, or why one bad label can take the whole thing down.

Here's the short version, and the thing that makes the rest make sense: **these are two tools with two jobs.** Prometheus collects and stores the numbers. Grafana draws pictures of them. Once that division of labor clicks, everything else — the query language, the panels, the alerts — falls into place.

This guide walks you through both, calmly, with the mental model first.

> 📝 **Metrics** are the numbers a system reports about itself — requests served, memory used, errors thrown. If "metrics vs logs vs traces" is fuzzy, start with [Observability: Logs, Metrics & Traces](/guides/observability-logs-metrics-traces) and come back. This guide assumes you know roughly what a metric is.

## How to read this

- **Just need the lay of the land?** Read [Phase 1: What Each One Does](01-what-each-one-does.md) — it's the whole division of labor in one sitting.
- **Want it to finally make sense?** Read in order. Each phase builds on the last: what the tools are, how to read what they store, then how to display and alert on it.

## The phases

1. **[What Each One Does](01-what-each-one-does.md)** — Prometheus is a time-series database that *scrapes* metrics from your services and stores them; Grafana is the dashboard layer that *queries and visualizes* them. The collect-and-store vs display split, drawn out.
2. **[Metrics & a Taste of PromQL](02-metrics-and-promql.md)** — the metric types (counter, gauge, histogram), what labels are for, and how to read a real query — including why you graph a *rate* over a counter instead of the raw counter.
3. **[Dashboards & Alerting](03-dashboards-and-alerting.md)** — building a panel that answers a real question, the RED/USE method for deciding *what* to chart, and getting an alert to fire on a condition — plus the three ways this all goes wrong: dashboards nobody reads, alert fatigue, and cardinality blowups.

> Deep PromQL (joins, subqueries, recording rules) and running Prometheus at scale (federation, remote-write, long-term storage) are deliberately left out — this guide is about understanding the pair well enough to use them, not operating them at scale. If you want the all-in-one commercial alternative, see [Reading Dynatrace](/guides/reading-dynatrace) for how a full APM packages collection, storage, and display into one product.
