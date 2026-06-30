---
title: "The ELK Stack"
guide: elk-elasticsearch-stack
phase: 1
summary: "Centralized logging with Elasticsearch, Logstash, and Kibana: ship logs from everywhere, index them, and search and visualize across your whole fleet."
tags: [elk, elasticsearch, logstash, kibana, beats, logging, observability, search]
difficulty: intermediate
synonyms: ["elk stack", "elastic stack", "elasticsearch logstash kibana", "centralized logging", "log aggregation", "filebeat", "kibana dashboards", "log search elasticsearch"]
updated: 2026-06-30
---

# What ELK actually is

You already know how to read one log file. The skill that doesn't transfer is reading a *hundred* log files, scattered across machines that come and go, while a customer is yelling. That's the problem ELK was built for, and once you see the shape of the problem, the four pieces fall into place on their own.

## The pain ELK removes

Here's the workflow centralized logging kills:

```console
$ ssh web-03
$ tail -f /var/log/app/server.log | grep "order_id=88213"
# nothing here. wrong box.
$ exit
$ ssh web-07
$ tail -f /var/log/app/server.log | grep "order_id=88213"
# found it — but the request also touched the payment service. which box was that?
```

*What just happened:* you spent five minutes guessing which machine held the line you needed, and the trail went cold the moment the request crossed a service boundary. Multiply that by every box and every incident. SSH-and-grep is fine for one server; it does not survive a fleet.

The fix is to stop going to the logs and make the logs come to you. Every line from every machine streams into one store, gets indexed for fast search, and you query all of it from a single screen. That's the whole idea. ELK is one popular way to build that.

## The letters: E, L, K (and B)

ELK is three tools, plus a fourth that joined later and quietly took over the front door.

```text
  [your apps]          write logs to files / stdout
       │
   ┌───▼────┐
   │ Beats  │  lightweight shippers on each host — read & forward
   └───┬────┘
       │   (optionally through)
   ┌───▼──────┐
   │ Logstash │  parse, transform, enrich, route
   └───┬──────┘
       │
 ┌─────▼─────────┐
 │ Elasticsearch │  index & store — the searchable database
 └─────┬─────────┘
       │
   ┌───▼────┐
   │ Kibana │  search & visualize in the browser
   └────────┘
```

*What just happened:* logs flow left to right. **Beats** ship, **Logstash** parses, **Elasticsearch** indexes and stores, **Kibana** is the window you look through. The name "ELK" predates Beats; you'll also hear "Elastic Stack," which is the same thing with Beats included. Many setups skip Logstash entirely and let Beats send straight to Elasticsearch — more on that in phase 2.

Take each one on its own terms:

- **Elasticsearch** is the heart. It's a distributed search engine that stores your logs as JSON *documents* and builds an *inverted index* over them — the same trick a search engine uses, so "find every log mentioning `timeout` in the last hour" comes back in milliseconds instead of a full-file scan.
- **Logstash** is the pipeline. It takes messy input (a raw log line), pulls structure out of it (timestamp, level, request ID), and hands clean JSON to Elasticsearch. It's powerful and heavy; it runs on the JVM and likes a lot of memory.
- **Kibana** is the face. Search bar, tables, charts, dashboards, saved queries. It's where humans actually live during an incident.
- **Beats** are the couriers. Small, single-purpose agents you install on each host. **Filebeat** tails log files; **Metricbeat** collects metrics; there are others. They're deliberately dumb and cheap so you can run one on every box without thinking about it.

> A useful frame: Elasticsearch is a *search engine that happens to be great at logs*, not a logging tool that happens to search. Everything good and everything expensive about ELK traces back to that.

## Why "search engine" is the key word

A normal log file is a flat stream of text. To find something you read it top to bottom. Elasticsearch instead breaks every document into terms and builds an index from term back to document — exactly like the index at the back of a book.

```text
Document 1: "GET /orders 200 ok in 14ms"
Document 2: "GET /orders 500 timeout"

inverted index (term → which docs contain it):
  "GET"     → [1, 2]
  "orders"  → [1, 2]
  "200"     → [1]
  "timeout" → [2]
```

*What just happened:* asking "which logs say `timeout`?" is now a single lookup, not a scan of every line. This is why Elasticsearch search feels instant — and it's also the seed of the cost story in phase 3, because building and holding that index for *every field of every log* is not free.

## What this is, and what it isn't

ELK gives you centralized, searchable **logs**. That's one of the three pillars of observability — logs, metrics, and traces. ELK can stretch toward metrics (Metricbeat) and there are tracing add-ons, but its center of gravity is log search. If you want the full picture of how logs sit next to metrics and traces, see /guides/observability-logs-metrics-traces. And for the underlying skill of actually reading what you find — not drowning in volume — see /guides/reading-logs-without-drowning.

## For builders

You don't have to run ELK yourself to get the model. Cloud providers and Elastic itself offer managed Elasticsearch, and the mental model is identical: something ships logs, Elasticsearch indexes them, a UI searches them. The pieces you'll spend real time on are the *edges* — getting clean, structured logs in (phase 2) and keeping storage from eating you alive (phase 3). The middle mostly takes care of itself.

```quiz
[
  {
    "q": "What is the core job of Elasticsearch in the stack?",
    "choices": ["Tailing log files on each host", "Indexing and storing logs as searchable JSON documents", "Drawing dashboards in the browser", "Parsing raw log lines into fields"],
    "answer": 1,
    "explain": "Elasticsearch is the distributed search engine that indexes and stores documents; Beats tail, Logstash parses, Kibana visualizes."
  },
  {
    "q": "Why does searching for a term in Elasticsearch feel instant?",
    "choices": ["It scans every file in parallel", "It uses an inverted index mapping terms to documents", "It caches the last query", "It only searches the most recent log"],
    "answer": 1,
    "explain": "The inverted index maps each term back to the documents containing it, so a search is a lookup rather than a full scan."
  },
  {
    "q": "Where do Beats fit in the pipeline?",
    "choices": ["They store and index documents", "They are the browser-based search UI", "They are lightweight shippers on each host that read and forward logs", "They replace Elasticsearch"],
    "answer": 2,
    "explain": "Beats (like Filebeat) are small agents on each host that forward logs, often straight to Elasticsearch or via Logstash."
  }
]
```

[← Overview](_guide.md) | [Phase 2: Shipping, structuring, and searching →](02-shipping-structuring-searching.md)
