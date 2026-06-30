---
title: "Cardinality, cost, and the Elasticsearch tradeoff"
guide: grafana-loki-logs
phase: 3
summary: "Logs that act like Prometheus: Loki indexes only labels (not full text), making centralized logging cheap, and ties them to your metrics in Grafana."
tags: [loki, grafana, logging, cardinality, elasticsearch, cost, observability]
difficulty: intermediate
synonyms: ["loki cardinality", "loki vs elasticsearch", "loki high cardinality labels", "loki cost", "loki retention object storage", "loki slow queries"]
updated: 2026-06-30
---

# Cardinality, cost, and the Elasticsearch tradeoff

Loki's cheapness is real, but it isn't free of rules. The same design that makes it cheap - index the labels, scan the content - has two sharp edges. The first is **cardinality**: get your labels wrong and the tiny index you were promised explodes. The second is the honest tradeoff against full-text engines like Elasticsearch: Loki is cheaper and label-scoped, but it is not a free-text search engine. Knowing both edges is the difference between Loki that hums and Loki that pages you.

## The cardinality trap

Recall from Phase 1 that Loki's index grows with the number of unique label combinations, not with log volume. Every distinct combination of label values is a separate **stream**, and each stream carries overhead. The math is multiplicative: total streams is roughly the product of how many values each label can take.

```text
labels: app(20 values) × env(3) × level(5)        =     300 streams   ← fine
add a high-cardinality label:
labels: app(20) × env(3) × level(5) × user_id(1M)  = 300,000,000 streams  ← disaster
```

*What just happened:* adding one label with a million possible values multiplied the stream count into the hundreds of millions. Each stream needs index entries and its own write path; this floods the index Loki works to keep small, balloons memory, and grinds ingestion and queries to a crawl. The label that felt convenient quietly broke the system.

The rule is blunt and worth tattooing on your config: **never put unbounded or high-cardinality values in labels.** User IDs, request IDs, trace IDs, email addresses, raw URLs with IDs in them, timestamps, full IP addresses - none of these belong in labels. They belong **in the log line**, where Loki stores them cheaply and you filter them at query time with a line filter or a parser.

```text
WRONG:  {app="checkout", user_id="90431", request_id="a1b2c3"}   → a new stream per request
RIGHT:  {app="checkout", level="info"}  user_id=90431 request_id=a1b2c3 payment ok
                                        └──── these live in the content, not the index ────┘
```

*What just happened:* the right version keeps the high-cardinality detail in the message body. You can still find a specific user - `{app="checkout"} |= "user_id=90431"` - but you do it by scanning content, not by creating a stream for every user. Same answer, none of the index blowup.

> A useful gut check before you add a label: "how many distinct values can this take, ever?" If the answer is bounded and small - tens, maybe low hundreds - it's a candidate. If it's "one per user" or "one per request" or "I'm not sure," it goes in the line, not the label. When unsure, prefer fewer labels; you can always grep the content.

## The Elasticsearch tradeoff, stated honestly

This is the comparison everyone asks about, so here it is without spin. A full-text engine like the one in the [elk-elasticsearch-stack](/guides/elk-elasticsearch-stack) indexes the *content* of every log line. That makes arbitrary free-text search across everything fast - and makes the index large and the cost high. Loki indexes only labels, so it's far cheaper to run, but a content search must scan, and that scan is bounded by how well your stream selector narrowed things first.

```text
Elasticsearch:  index all content   → fast free-text search anywhere   → expensive, heavier to run
Loki:           index labels only    → cheap storage, label-scoped       → content search = scan within the slice
```

*What just happened:* the two tools optimize for different questions. Loki bets that you almost always know the labels to scope by before you search the text - and within a tight label scope, scanning is fast. Elasticsearch bets you need to search raw text broadly and will pay for the privilege.

So the honest decision rule: if your searches naturally start with "which service / namespace / level" and then grep - Loki is a great fit and will save you a lot of money. If you genuinely need ad-hoc full-text search across all logs with no obvious label to scope by, or rich text analytics and relevance ranking, that's Elasticsearch's home turf and Loki will fight you. Many teams run both: Loki for the high-volume operational firehose, a full-text engine for the smaller slice that needs deep text search.

## Retention and storage are a separate dial

Because raw content sits in object storage, retention is mostly a question of how long you keep objects, and it's configured independently of the index. Loki lets you set retention globally or **per stream** via label-matched rules - so you can keep noisy `level="debug"` logs for days and important `level="error"` logs for far longer.

```yaml
limits_config:
  retention_period: 168h          # global default: 7 days

# keep errors longer than the global default
retention_stream:
  - selector: '{level="error"}'
    period: 720h                  # 30 days for errors
```

*What just happened:* most logs age out after 7 days, but anything tagged `level="error"` is kept for 30. You spend your storage budget where it matters instead of paying to keep every debug line for a month. This per-stream control is another payoff of the label model.

## Failure modes that page you

A few real-world ways Loki goes wrong, all traceable to the design you now understand:

```text
Symptom                          Usual cause
queries crawl / OOM              high-cardinality labels → millions of streams
"too many outstanding requests"  query scans too wide a time range, no tight selector
logs missing                     agent stopped, wrong __path__, or label dropped at ingest
ingestion rejected               per-stream or per-tenant rate limits hit
```

*What just happened:* the top two - and most Loki pain in general - trace straight back to cardinality and unscoped queries. Get labels right and keep query scopes tight, and the rest is ordinary operations. Loki's failure modes are mostly self-inflicted, which is good news: they're the ones you control.

**In the wild:** the teams happiest with Loki are the ones who treat label design as the main decision, not an afterthought. They keep a deliberately short, boring list of labels, push everything else into the line, and lean on LogQL parsers at query time. That discipline is the whole game - it's what keeps Loki cheap and fast at the scale where a full-text stack would have been a budget conversation.

```quiz
[
  {
    "q": "Why is putting `user_id` in a Loki label a serious mistake?",
    "choices": [
      "User IDs are sensitive and can't be stored",
      "It creates a separate stream per user, exploding the index Loki tries to keep small",
      "Loki rejects numeric label values",
      "It makes the log lines larger"
    ],
    "answer": 1,
    "explain": "Each unique label combination is a stream. A high-cardinality label like user_id multiplies stream count into the millions, flooding the index and crushing performance."
  },
  {
    "q": "How should you handle high-cardinality data like a request ID in Loki?",
    "choices": [
      "Make it a label so you can filter on it fast",
      "Drop it entirely; Loki can't handle it",
      "Keep it in the log line content and filter with a line filter or parser at query time",
      "Store it in a separate Elasticsearch index automatically"
    ],
    "answer": 2,
    "explain": "High-cardinality values belong in the content, where storage is cheap. You still find them by scanning within a tight label scope - no stream explosion."
  },
  {
    "q": "Compared to Elasticsearch, what is Loki's core tradeoff?",
    "choices": [
      "Loki is faster at every kind of search",
      "Loki indexes only labels - cheaper to run, but content search means scanning within a label-scoped slice rather than free-text-anywhere",
      "Loki stores more data per dollar but can't query labels",
      "There is no tradeoff; Loki is strictly better"
    ],
    "answer": 1,
    "explain": "Elasticsearch indexes all content for fast broad free-text search at higher cost. Loki indexes labels only - cheaper, but text search is a scan bounded by how well labels narrowed it first."
  }
]
```

[← Phase 2: Shipping logs and querying with LogQL](02-shipping-and-querying-logql.md) · [Overview](_guide.md)
