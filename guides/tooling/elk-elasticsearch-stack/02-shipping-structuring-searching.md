---
title: "Shipping, structuring, and searching"
guide: elk-elasticsearch-stack
phase: 2
summary: "Centralized logging with Elasticsearch, Logstash, and Kibana: ship logs from everywhere, index them, and search and visualize across your whole fleet."
tags: [elk, elasticsearch, logstash, kibana, beats, logging, observability, search]
difficulty: intermediate
synonyms: ["elk stack", "elastic stack", "elasticsearch logstash kibana", "centralized logging", "log aggregation", "filebeat", "kibana dashboards", "log search elasticsearch"]
updated: 2026-06-30
---

# Shipping, structuring, and searching

The model from phase 1 only pays off when real logs are flowing. This phase is the daily loop: get logs off the boxes, give them structure so they're worth searching, and ask questions in Kibana. The single biggest lever here isn't any tool - it's structured logging. Get that right and everything downstream gets easier.

## Step one: ship the logs with Filebeat

Filebeat is the workhorse. You install it on a host, point it at some files, tell it where to send them, and it tails forever - surviving restarts by remembering its position.

```yaml
# filebeat.yml
filebeat.inputs:
  - type: filestream
    id: app-logs
    paths:
      - /var/log/app/*.log

output.elasticsearch:
  hosts: ["http://es01:9200"]
  index: "app-logs-%{+yyyy.MM.dd}"
```

*What just happened:* Filebeat now tails every `.log` file under `/var/log/app/` and ships each line to Elasticsearch, into a fresh index per day (`app-logs-2026.06.30`, and so on). The daily rollover isn't cosmetic - it's what makes deleting old data cheap later, which phase 3 leans on hard. You can point `output` at Logstash instead when you need heavier parsing.

Start it and confirm data is arriving:

```console
$ systemctl start filebeat
$ curl -s "http://es01:9200/_cat/indices/app-logs-*?v"
health status index               docs.count  store.size
green  open   app-logs-2026.06.30      12483       8.4mb
```

*What just happened:* the `_cat/indices` endpoint is your "is anything happening?" smoke test. A growing `docs.count` means logs are landing. If this stays empty, the problem is upstream - Filebeat config, network, or permissions on the log files - not Elasticsearch.

## Step two: structure beats parsing

You can ship raw text and parse it later, but the better move is to log structured data at the source. Compare these two log lines for the same event:

```text
# unstructured - a human sentence
2026-06-30 14:22:01 ERROR could not charge card for order 88213, gateway timed out

# structured - JSON
{"ts":"2026-06-30T14:22:01Z","level":"ERROR","msg":"charge failed","order_id":88213,"reason":"gateway_timeout","service":"payments"}
```

*What just happened:* the second line costs you nothing extra to write but means Elasticsearch stores `order_id`, `level`, and `service` as real fields. Now "show me every ERROR in `payments` for order 88213" is a precise query. With the first line you'd be writing fragile regex to claw those values back out. **Structure at the source is the cheapest win in the whole stack.**

If you can't change the app - third-party software, legacy code - that's exactly when Logstash earns its keep. Its `grok` filter pattern-matches raw lines into fields:

```text
# logstash pipeline filter
filter {
  grok {
    match => { "message" => "%{TIMESTAMP_ISO8601:ts} %{LOGLEVEL:level} %{GREEDYDATA:msg}" }
  }
}
```

*What just happened:* grok carved `ts`, `level`, and `msg` out of an otherwise opaque line. It's powerful, but every grok pattern is a small parser you now own and must keep matching as the log format drifts. Prefer structured logging; reach for grok when you have no other choice.

## Step three: search in Kibana

Open Kibana, create a **data view** (older versions call it an *index pattern*) that matches `app-logs-*`, and you get one searchable view across every daily index. The bar at the top speaks **KQL** (Kibana Query Language):

```text
level: "ERROR" and service: "payments"
order_id: 88213
status >= 500 and not url: "/healthcheck"
message: *timeout*
```

*What just happened:* each line is a real filter. The first narrows to payment errors; the second pulls one order's whole story across services; the third finds server errors while ignoring noisy health checks; the last does a wildcard text match. Because these run against the inverted index, they return fast even over millions of documents - and because your logs are *structured*, the field names actually exist to filter on.

> The `*timeout*` wildcard query is handy but slow at scale - leading wildcards can't use the index efficiently. For anything you search often, make it a real field (`reason: gateway_timeout`) instead of fishing in free text.

A data view also unlocks the rest of Kibana: time-series charts of error rate, a table of top failing endpoints, a dashboard you pin to a wall during an incident. The search bar is where you live; dashboards are how you spot trouble before the alert fires.

## The daily loop, end to end

```text
app logs ──▶ Filebeat tails ──▶ Elasticsearch indexes
                                      │
                                      ▼
                       Kibana: search, chart, dashboard
```

*What just happened:* that's the whole everyday cycle. Note Logstash isn't in it - plenty of healthy setups run Beats-straight-to-Elasticsearch and only add Logstash when parsing or routing demands it. Don't stand up Logstash because a diagram told you to; add it when you have a job for it.

## In the wild

The teams that get the most out of ELK share one habit: they agreed on a **log schema** early. Same field names everywhere - `service`, `level`, `request_id`, `ts` - so a query written for one service works for all of them. A consistent `request_id` threaded through every service is what turns a pile of logs into a traceable story across a request's whole journey. That discipline costs a meeting; the lack of it costs you every incident. For the human side of actually making sense of what you find, see /guides/reading-logs-without-drowning.

```quiz
[
  {
    "q": "Why is structured (JSON) logging preferred over parsing raw text later?",
    "choices": ["It makes log files smaller on disk", "Fields like order_id become real, queryable fields with no fragile regex", "It is required by Filebeat", "It removes the need for Elasticsearch"],
    "answer": 1,
    "explain": "Logging structured data at the source gives Elasticsearch real fields to index, avoiding brittle grok/regex parsing downstream."
  },
  {
    "q": "When does adding Logstash to the pipeline actually make sense?",
    "choices": ["Always - Beats cannot send to Elasticsearch", "When you need heavier parsing/transforming logs you can't change at the source", "Only for drawing dashboards", "Never - it has been removed from the stack"],
    "answer": 1,
    "explain": "Beats can ship straight to Elasticsearch; Logstash earns its place when you need to parse, enrich, or route logs you can't restructure at the source."
  },
  {
    "q": "What does a KQL query like `level: \"ERROR\" and service: \"payments\"` do in Kibana?",
    "choices": ["Deletes matching logs", "Filters to documents where both fields match", "Creates a new index", "Restarts Filebeat"],
    "answer": 1,
    "explain": "KQL filters the data view to documents matching the field conditions, fast because it uses the inverted index."
  }
]
```

[← Phase 1: What ELK actually is](01-what-elk-actually-is.md) | [Overview](_guide.md) | [Phase 3: Cost, retention, and production reality →](03-cost-retention-production.md)
