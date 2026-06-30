---
title: "Reading Graylog (Log Search & Streams)"
guide: "reading-graylog"
phase: 0
summary: "What centralized logging actually is, how to search across dozens of servers from one box, and how streams, dashboards, and alerts turn a flood of logs into something you can stand on."
tags: [graylog, logging, centralized-logging, elk, opensearch, kibana, log-search, observability, intermediate]
category: performance
difficulty: intermediate
order: 6
synonyms: ["what is graylog", "how to search logs in graylog", "graylog query syntax", "field:value search graylog", "what is a graylog stream", "centralized logging explained", "search logs across many servers", "elk stack vs graylog", "kibana search explained", "follow a request id in logs", "how to read the log histogram"]
updated: 2026-06-19
---

# Reading Graylog (Log Search & Streams)

On your laptop, when something breaks, you open one file and `grep` for the error. That works because
there's one file. Now picture the same problem in production: a dozen containers, three app servers, two
load balancers, a queue worker - and the one log line that explains the outage is sitting on whichever
box happened to handle that one unlucky request. You can't `ssh` into all of them and `grep` in parallel
while the pager is going off. That's the moment people discover they're drowning, not because there are
too many logs, but because the logs are *scattered*.

Here's the relief: tools like Graylog (and the very similar ELK / OpenSearch + Kibana stacks) do one
profound thing - they ship every log line from every machine into one place and put a search box on top.
The skill you already have for reading a single log file still applies; what changes is that now your
`grep` reaches across the entire fleet at once, you can scope it to a five-minute window, and you can
follow a single request as it bounced between services. This guide gives you that skill, and the mental
model underneath it so the search box stops feeling like a slot machine.

> ⏭️ New to reading logs at all? Start with [Reading Logs Without Drowning](/guides/reading-logs-without-drowning)
> - what a log line *is*, what the levels mean, how to follow one request. This guide is the
> centralized, many-servers version of that skill.

## How to read this
- **Mid-incident, need to find the failing request right now?** Jump to [Phase 2: Searching Effectively](02-searching-effectively.md) and use the cheat-card at the top.
- **Want centralized logging to finally make sense?** Read in order - Phase 1 installs the mental model (one search box over everything, structured fields vs. raw text), and the rest builds on it.

## The phases
1. **[Why Centralized Logs](01-why-centralized-logs.md)** - why `grep` on one box stops working across a fleet, what Graylog/ELK actually collect and where, and the two ideas everything rests on: one search box over everything, and structured fields vs. raw text.
2. **[Searching Effectively](02-searching-effectively.md)** - the query model: `field:value` searches, time-range scoping (your #1 lever), boolean operators, following one request by its correlation id, and reading the histogram to find the spike.
3. **[Streams, Dashboards & Alerts](03-streams-dashboards-alerts.md)** - routing subsets of logs into streams (e.g. just prod ERRORs), saving dashboards you can glance at, and alerting on log conditions so the system pages you instead of you discovering the fire by accident.

> This guide stays at the level of *reading and searching* centralized logs. The deeper operational
> side - running the cluster, designing index/retention policies, parsing pipelines, and wiring
> logs together with metrics and traces - is its own topic. For where logs sit in the bigger picture,
> see [Observability: Logs, Metrics & Traces](/guides/observability-logs-metrics-traces).
