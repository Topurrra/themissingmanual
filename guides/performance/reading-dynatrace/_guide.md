---
title: "Reading Dynatrace (What It's Showing You)"
guide: "reading-dynatrace"
phase: 0
summary: "What Dynatrace actually is, how to follow one request through a distributed trace, and how to read a 'Problem' and its proposed root cause without trusting it blindly."
tags: [dynatrace, apm, observability, distributed-tracing, root-cause, monitoring]
category: performance
order: 5
difficulty: intermediate
synonyms: ["how to read dynatrace", "understand dynatrace dashboard", "what is dynatrace apm", "dynatrace service flow", "dynatrace distributed trace", "dynatrace problem root cause", "dynatrace smartscape", "make sense of dynatrace"]
updated: 2026-06-19
---

# Reading Dynatrace (What It's Showing You)

Someone shares a Dynatrace link in the incident channel and says "the trace is right there." You open it
and find a wall of charts, a glowing map of boxes, a red banner, percentages, waterfalls, and a panel
confidently announcing a "root cause." It looks like it knows everything — and somehow that makes it
harder to read, not easier. Where do you even look first?

Here's the calm version. Dynatrace is not a magic oracle and it's not a hundred unrelated dashboards. It's
**one model of your system, kept continuously up to date**, with a few specific views layered on top. Once
you know what each view is *showing you* — and, just as important, what it's only *guessing* — the wall of
charts turns back into a story about one request, one service, one bad afternoon.

This guide assumes you already know the three pillars — logs, metrics, and traces — from
[Observability: Logs, Metrics & Traces](/guides/observability-logs-metrics-traces). Here we apply those
ideas to one specific tool, so you can read its screens instead of being read by them.

## How to read this

- **Handed a Dynatrace link mid-incident?** Jump to [Phase 3: Problems & Root Cause](03-problems-and-root-cause.md) —
  it walks you from the red alert to the actual cause, and tells you which parts to trust.
- **Want the tool to finally make sense?** Read in order. Phase 1 builds the mental model, Phase 2 teaches
  you to read a single trace, and Phase 3 puts it together when something is on fire.

## The phases

1. **[What Dynatrace Actually Is](01-what-dynatrace-actually-is.md)** — an always-on x-ray of your system:
   auto-instrumentation, the entity model, and Smartscape. The picture everything else sits on.
2. **[Reading a Service Flow & a Trace](02-reading-a-service-flow-and-a-trace.md)** — follow one request
   across services, read the response-time breakdown, and spot the slow tier or the failing dependency.
3. **[Problems & Root Cause](03-problems-and-root-cause.md)** — how Dynatrace folds many symptoms into one
   "Problem," proposes a cause, and why you verify that cause instead of trusting it blindly.

> Deep material — building custom dashboards, writing DQL queries, tuning alerting profiles and management
> zones, and the deployment/OneAgent setup itself — is deliberately left out. This guide is about *reading*
> what's already in front of you, not configuring the platform.
