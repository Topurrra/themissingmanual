---
title: "Datadog, From Zero"
guide: datadog-from-zero
phase: 0
summary: "The all-in-one observability platform: the agent, metrics and dashboards, APM traces, log management, and monitors - plus the bill that surprises teams."
tags: [datadog, observability, metrics, apm, tracing, logs, monitoring, dashboards, slo]
category: tooling
group: "Observability"
order: 33
difficulty: intermediate
synonyms: ["what is datadog", "datadog tutorial", "datadog agent setup", "datadog apm tracing", "datadog log management", "datadog tags explained", "datadog monitors alerts", "datadog custom metrics cost", "why is datadog so expensive", "datadog metrics vs logs vs traces"]
updated: 2026-06-30
---

# Datadog, From Zero

You have metrics in one tool, logs in another, and traces in a third - and when something breaks at 2am you're flipping between three tabs trying to line up timestamps by hand. Datadog's whole pitch is that those three are one story, told through one agent, sliced by one tag. This guide takes you from "we pay for Datadog but only I know how to use it" to a real mental model: how the agent collects everything, why tagging is the lever that makes the data useful, how to read a trace and wire up a monitor - and the plain part nobody puts on the marketing page, which is how the bill sneaks up on you.

## How to read this

Read the phases in order. Phase 1 builds the mental model: the three telemetry types, the one agent that ships them, and the tagging system that ties them together. Phase 2 is the daily loop: metrics on a dashboard, a distributed trace in APM, logs you can actually query, and a monitor that pages the right person. Phase 3 is production reality - the cost model, where the surprise charges come from (custom metrics cardinality, log volume, per-host pricing), and how to keep the platform useful without setting money on fire. Each phase ends with a short quiz so you can check yourself.

## The phases

1. [What Datadog actually is](01-what-datadog-actually-is.md) - one agent, three signals, and tags as the connective tissue.
2. [The everyday loop](02-the-everyday-loop.md) - dashboards, APM traces, log queries, and monitors that page the right human.
3. [The bill, and how it sneaks up](03-the-bill-and-how-it-sneaks-up.md) - custom-metric cardinality, log volume, host pricing, and keeping the cost in check.

[Phase 1: What Datadog actually is](01-what-datadog-actually-is.md) →
