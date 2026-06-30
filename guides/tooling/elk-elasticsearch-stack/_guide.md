---
title: "The ELK Stack"
guide: elk-elasticsearch-stack
phase: 0
summary: "Centralized logging with Elasticsearch, Logstash, and Kibana: ship logs from everywhere, index them, and search and visualize across your whole fleet."
tags: [elk, elasticsearch, logstash, kibana, beats, logging, observability, search]
category: tooling
group: "Observability"
order: 32
difficulty: intermediate
synonyms: ["elk stack", "elastic stack", "elasticsearch logstash kibana", "centralized logging", "log aggregation", "filebeat", "kibana dashboards", "log search elasticsearch"]
updated: 2026-06-30
---

# The ELK Stack

It's 2am, the alert fired, and the incident spans four services on a dozen machines. The old move is to SSH into a box, `tail` a file, guess which box, SSH into the next one, and `grep` until your eyes blur. That doesn't scale past a handful of servers, and it falls apart the moment a container dies and takes its logs with it. ELK fixes the shape of the problem: every log lands in one searchable place, and you ask questions across the whole fleet from a browser.

## How to read this

Three phases, in order. Phase 1 builds the mental model - the four pieces, what each one does, and why centralizing logs beats logging into boxes. Phase 2 is the everyday core: shipping logs with Beats, structuring them, and searching in Kibana. Phase 3 is production reality - the cost of indexing everything, index lifecycle and retention, and the failure modes that page you. Read 1 even if you're impatient; the model makes the rest obvious.

## The phases

1. [What ELK actually is](01-what-elk-actually-is.md) - the four pieces and why centralized logs win.
2. [Shipping, structuring, and searching](02-shipping-structuring-searching.md) - Beats, parsing, index patterns, and Kibana queries.
3. [Cost, retention, and production reality](03-cost-retention-production.md) - index lifecycle, the price of indexing, and what breaks.

[Phase 1: What ELK actually is](01-what-elk-actually-is.md) →
