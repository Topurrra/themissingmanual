---
title: "OpenTelemetry, From Zero"
guide: opentelemetry-from-zero
phase: 0
summary: "The vendor-neutral standard for telemetry: traces, metrics, and logs from one instrumentation, exported anywhere via the OTel collector."
tags: [opentelemetry, otel, observability, tracing, metrics, collector, instrumentation]
category: tooling
group: "Observability"
order: 30
difficulty: intermediate
synonyms: ["opentelemetry tutorial", "otel collector", "what is opentelemetry", "distributed tracing setup", "otel spans context propagation", "instrument once export anywhere", "otel vs vendor agent"]
updated: 2026-06-30
---

# OpenTelemetry, From Zero

You picked a monitoring vendor, sprinkled their SDK through your code, and shipped. Eighteen months later the bill tripled, you want to switch, and you realize their agent is welded into every service. That trap is exactly what OpenTelemetry exists to disarm. You instrument your code once against an open standard, and you point the data wherever you want - today's vendor, tomorrow's vendor, or your own stack.

This guide gives you the mental model first: what the three signals are, how a trace stitches itself across services, and what the collector actually does. Then you wire it up and live with it.

## How to read this

Read phase 1 even if you're in a hurry - the whole thing makes sense once you see *why* "instrument once, export anywhere" is the entire point. Phase 2 is the hands-on core: SDK, auto-instrumentation, the collector pipeline. Phase 3 is the part nobody warns you about: sampling, cost, and the failures that look like OTel's fault but aren't.

If you're fuzzy on what traces, metrics, and logs even are as concepts, read [the observability primer](/guides/observability-logs-metrics-traces) first, then come back here for the standard that ties them together.

## The phases

1. [What OpenTelemetry actually is](01-what-otel-actually-is.md) - the standard, the three signals, and why it won.
2. [Instrumenting and exporting](02-instrumenting-and-exporting.md) - SDK, auto vs manual, the collector pipeline.
3. [Sampling, cost, and reality](03-sampling-cost-and-reality.md) - what breaks, what it costs, and how to keep it sane.

[Phase 1: What OpenTelemetry actually is](01-what-otel-actually-is.md) →
