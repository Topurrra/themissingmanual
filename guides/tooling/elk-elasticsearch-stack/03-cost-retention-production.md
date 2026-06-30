---
title: "Cost, retention, and production reality"
guide: elk-elasticsearch-stack
phase: 3
summary: "Centralized logging with Elasticsearch, Logstash, and Kibana: ship logs from everywhere, index them, and search and visualize across your whole fleet."
tags: [elk, elasticsearch, logstash, kibana, beats, logging, observability, search]
difficulty: intermediate
synonyms: ["elk stack", "elastic stack", "elasticsearch logstash kibana", "centralized logging", "log aggregation", "filebeat", "kibana dashboards", "log search elasticsearch", "index lifecycle management", "log retention"]
updated: 2026-06-30
---

# Cost, retention, and production reality

The first month of ELK is a honeymoon: logs flow, search is instant, dashboards look great. Then the bill arrives — in disk, in memory, in the 3am page where the cluster is red and nothing's indexing. Almost every ELK horror story has the same root cause: indexing everything forever because nobody decided not to. This phase is how you avoid that.

## The thing nobody warns you about: indexing isn't free

Remember the inverted index from phase 1 — the magic that makes search instant. The catch is that Elasticsearch builds and stores that index for *every field of every document*, and the index plus the original document often takes **more** disk than the raw log did.

```text
raw log line:           ~200 bytes
stored in Elasticsearch: ~200 bytes (the source) + index structures
                         → frequently MORE than the original on disk
```

*What just happened:* the speed you love has a storage tax, and you pay it on every log whether or not you ever search that field. A fleet emitting a few hundred gigabytes of logs a day will fill terabytes fast. The lever you control is **what you index** — drop fields you'll never query, and don't ship debug-level noise to a system that charges you to index it.

> The trap is treating ELK like an infinite bucket. It's a search engine with a storage bill. Every field you index is a recurring cost, not a one-time write.

## Retention: decide when logs die, automatically

Logs have a shelf life. Last hour's logs are gold during an incident; last quarter's are dead weight you're paying to keep searchable. The tool for this is **Index Lifecycle Management (ILM)** — a policy that ages indices through phases and eventually deletes them, with no human in the loop.

```text
hot   →  actively written & searched   (fast storage)   days 0–2
warm  →  searched, not written          (cheaper)        days 2–14
cold  →  rarely searched                 (cheapest)       days 14–30
delete → gone                                             day 30
```

*What just happened:* this is why phase 2 shipped to a *daily* index (`app-logs-2026.06.30`). ILM can roll over to a new index and drop whole old ones cheaply — deleting one day's index is one fast operation, where deleting individual old documents would be slow and painful. A retention policy is the single most important production decision you'll make. Pick a number, write the policy, walk away.

Sketch of an ILM policy attached via the API:

```console
$ curl -X PUT "http://es01:9200/_ilm/policy/app-logs-policy" -H 'Content-Type: application/json' -d'
{ "policy": { "phases": {
    "hot":    { "actions": { "rollover": { "max_age": "1d", "max_primary_shard_size": "50gb" } } },
    "delete": { "min_age": "30d", "actions": { "delete": {} } }
}}}'
{"acknowledged":true}
```

*What just happened:* you told Elasticsearch to roll over to a fresh index daily (or sooner if a shard hits ~50GB) and delete anything older than 30 days. From now on, retention runs itself. The `max_primary_shard_size` guard matters because oversized shards are a classic source of slow, unstable clusters.

## The failure modes that page you

A handful of problems cause most ELK outages. Knowing the shape of each saves the panic.

**Disk fills and the cluster goes read-only.** When a node crosses a disk *watermark*, Elasticsearch protects itself by refusing new writes — so indexing silently stops and logs pile up upstream.

```console
$ curl -s "http://es01:9200/_cluster/health?pretty" | grep status
  "status" : "red",
$ curl -s "http://es01:9200/_cat/allocation?v"
shards disk.used disk.avail disk.percent
   412    471gb       12gb           97
```

*What just happened:* `red` plus a near-full disk is the textbook "logs stopped flowing" incident. The fix is to free space (delete old indices — ILM should have, which is why you set it up) or add capacity. The deeper fix is the retention policy that stops you getting here.

**Mapping explosion / field blowup.** Send logs with unpredictable field names — say, a field per user ID — and Elasticsearch tries to index each as a new field, the *mapping* balloons, and the cluster strains. Cap it and keep high-cardinality junk out of indexed fields.

**Too many shards.** Every index is split into shards, and each shard has fixed overhead. Thousands of tiny daily indices each with several shards adds up to a cluster spending all its energy on bookkeeping. Fewer, larger shards beat many tiny ones — another reason ILM rollover by size matters.

```text
green  → all good
yellow → replicas unassigned (often single-node dev) — degraded, not down
red    → some primary data unavailable — STOP, investigate now
```

*What just happened:* cluster color is your at-a-glance health. Yellow is common and survivable on small setups; red means real data is unreachable and is always worth dropping what you're doing for.

## A sane production checklist

- **Set a retention policy on day one.** ILM with a real delete phase. Not "we'll figure it out later" — later is a full disk.
- **Index what you'll search, drop what you won't.** Debug logs and one-off fields are pure cost.
- **Watch disk and shard count**, not vanity dashboards. Those are what actually take the cluster down.
- **Run replicas in production** so a lost node doesn't lose data — and remember replicas roughly double storage.
- **Don't put Logstash in the path until you need it.** It's another JVM service to feed, tune, and keep alive.

## In the wild

The teams that stay happy with ELK treat it as a cost center they actively manage, not a black box. They know their daily ingest in gigabytes, they have a retention number they can defend, and they prune what they index. The teams that get burned are the ones who set it up once, indexed everything, and met it again only when the disk hit 100% during an incident. ELK is genuinely excellent at what it does — searching your whole fleet's logs from one screen beats SSH-and-grep every single time — as long as you respect that the search magic has a running bill. For where logs sit in the bigger observability picture, see /guides/observability-logs-metrics-traces.

```quiz
[
  {
    "q": "What is the most common root cause of ELK storage and stability problems?",
    "choices": ["Using Kibana instead of Grafana", "Indexing everything forever with no retention policy", "Logging in JSON", "Running Filebeat on too few hosts"],
    "answer": 1,
    "explain": "The inverted index has a storage cost on every field; without retention (ILM), disks fill and clusters go read-only."
  },
  {
    "q": "Why does shipping to a daily index make retention cheap?",
    "choices": ["Daily indices compress better", "ILM can delete a whole old index in one fast operation instead of deleting documents one by one", "Kibana only reads daily indices", "It avoids needing Elasticsearch"],
    "answer": 1,
    "explain": "Dropping an entire day's index is a single cheap operation; deleting individual aged documents would be slow and costly."
  },
  {
    "q": "Your cluster health is `red` and disk is at 97%. What does this mean?",
    "choices": ["Everything is healthy", "Replicas are unassigned but data is safe", "Some primary data is unavailable and writes have likely stopped — investigate now", "Kibana needs restarting"],
    "answer": 2,
    "explain": "Red means primary shards are unavailable; near-full disk crosses a watermark and turns the cluster read-only, halting indexing."
  }
]
```

[← Phase 2: Shipping, structuring, and searching](02-shipping-structuring-searching.md) | [Overview](_guide.md)
