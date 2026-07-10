---
title: "Metrics & a Taste of PromQL"
guide: "prometheus-and-grafana"
phase: 2
summary: "The three metric types (counter, gauge, histogram), what labels are for, and how to read a real PromQL query - including why you graph rate() over a counter instead of the raw number."
tags: [promql, metrics, counter, gauge, histogram, labels, rate]
difficulty: intermediate
synonyms: ["counter vs gauge prometheus", "what is a histogram metric", "how to read promql", "why use rate in promql", "what does rate do prometheus", "what are prometheus labels", "promql requests per second"]
updated: 2026-07-10
---

# Metrics & a Taste of PromQL

PromQL queries look intimidating the first time - `rate(http_requests_total{status="500"}[5m])` is a lot of punctuation to meet at once. But almost every query you'll read is built from a few small ideas stacked together. Learn the ideas and the punctuation stops being scary.

The single most important one, the thing that confuses *everybody* at first: **why you almost never graph a counter directly, and reach for `rate()` instead.**

## The three metric types

Prometheus metrics come in a few types, and the type tells you how to *read* the number. Three cover the vast majority of what you'll see.

**Counter - a number that only ever goes up.** Total requests served, total errors, total bytes sent. A counter starts at zero when the process starts and climbs. It resets to zero only when the process restarts.

- The wrong picture: "the counter is the current value, like a speedometer." It isn't. `http_requests_total = 18342` doesn't mean "18,342 requests per second" - it means "18,342 requests *ever*, since this process started." On its own that number is nearly useless. What you care about is *how fast it's climbing*, which is the whole reason `rate()` exists (next section).

**Gauge - a number that goes up and down.** Current memory in use, current temperature, number of items in a queue, active connections. A gauge is a snapshot of "right now," and reading it directly *does* make sense - `process_resident_memory_bytes = 58000000` means "using 58 MB right now."

**Histogram - counts bucketed by size.** A histogram answers "how were these values distributed?" - most often for request durations. Instead of one number, it records counts in buckets: "how many requests finished under 0.1s, under 0.5s, under 1s, …". This is what lets you ask for a **percentile** later - "95% of requests finished faster than X" - which is how you actually talk about latency. (A single average latency hides the slow tail; percentiles don't.)

> 📝 There's a fourth type, **summary**, a close cousin of histogram that computes percentiles service-side. Histograms are the more common, more flexible choice - treat summary as histogram's relative and don't lose sleep over it yet.

⚠️ **Gotcha - reading a counter like a gauge.** This is the classic beginner mistake. You put `http_requests_total` on a graph, see a line marching steadily up and to the right, and panic that traffic is exploding. It isn't - a counter *always* goes up and to the right, by definition. A straight diagonal line means *steady* traffic. To see the actual traffic, you need its rate of change.

## Labels - the same metric, sliced many ways

**What they actually are.** Labels are key-value tags attached to a metric that let one metric name cover many related streams. Look back at the `/metrics` page from Phase 1:

```text
http_requests_total{method="GET",status="200"} 18342
http_requests_total{method="GET",status="500"} 12
http_requests_total{method="POST",status="200"} 4071
```

*What just happened:* That's *one* metric name, `http_requests_total`, split into three separate time series by its labels. Each unique combination of label values is its own counter. So you can ask "all requests," or narrow to "just the 500s," or "just POSTs" - all from the same metric, by filtering on labels.

**Why this is the heart of PromQL.** Filtering and grouping by labels is how you turn a firehose of numbers into an answer to a specific question. "How many errors?" → filter to `status="500"`. "Errors per endpoint?" → group by the `path` label. We'll see both below.

⚠️ **Gotcha (the one that bites hardest, covered fully in Phase 3).** Every distinct combination of label values creates a *new* time series Prometheus must store. Put something with unbounded values in a label - a user ID, a full URL with query strings, a request ID - and you generate millions of series. That's a **cardinality** explosion, and it's the most common way people accidentally take Prometheus down. Labels are for things with a *small, bounded* set of values (method, status code, endpoint name), never for unique identifiers.

## Reading your first real query

Let's take that scary-looking query apart, piece by piece:

```promql
rate(http_requests_total{status="500"}[5m])
```

Reading it from the inside out:

- `http_requests_total` - the metric: total HTTP requests, a **counter**.
- `{status="500"}` - a **label filter**: narrow to just the series where the status code is 500 (server errors).
- `[5m]` - a **range**: "give me the last 5 minutes of samples for each matching series," not just the latest point. (This is called a *range vector* - a window of values, which `rate()` needs to do its math.)
- `rate(...)` - the function: take that 5-minute window and compute the **per-second average rate of increase** of the counter.

*What it's showing you:* "Over the last 5 minutes, how many server errors per second, on average?" The output isn't a total - it's a *speed*: errors/sec, calculated freshly at each point on the graph. A flat line at `0` means no errors; a line that jumps to `3` means you're suddenly taking three 500s every second.

## Why you graph rates, not raw counters

This is the payoff. Here's the contrast, drawn out:

```text
RAW COUNTER: http_requests_total          rate(http_requests_total[5m])
("everything ever")                       ("requests per second, now")

 count                                      req/s
   │              ____/                        │      ╱╲      ___
   │         ____/                             │  ___╱  ╲____╱   ╲__
   │    ____/                                  │ ╱
   │___/                                       │╱
   └──────────────────────► time              └──────────────────────► time
   always climbs; slope = the                 the actual traffic shape:
   real signal, but hard to read              spikes and dips you can see
```

*What just happened:* The raw counter only ever rises, so the *information* you want - how busy the service is right now - is hidden in the line's slope, which your eyes are bad at reading. `rate()` does the differencing for you: it turns "total ever" into "per second now," so a traffic spike becomes a visible bump and a quiet period becomes a dip. That's why almost every counter you ever graph is wrapped in `rate()`.

`rate()` is also smart about counter **resets**: when a process restarts and the counter drops back to zero, `rate()` recognizes that as a restart rather than a giant negative blip, and accounts for it. That's another reason to use it instead of subtracting values by hand.

💡 **Key point - the rule of thumb.** *Counters get wrapped in `rate()`. Gauges you read directly.* If you find yourself plotting a bare counter and wondering why every line goes up and to the right, that's the rule reminding you. (A close relative, `increase(...)[1h]`, answers "how many total in the last hour?" - same idea, expressed as a count rather than a per-second rate.)

> The numbers and shapes above are illustrative - drawn to show the *behavior*, not measured from a real system.

## Why this saves you later

When you're staring at a dashboard during an incident and someone asks "is the error rate climbing?", you'll know the panel's query is a per-second rate over a window, not a raw total - and trust the line for the right reasons. In the next phase you'll reach for `rate()` on a counter without thinking, instead of plotting a useless diagonal.

## Recap

1. **Type tells you how to read it.** Counters only go up (read their *rate*); gauges go up and down (read them *directly*); histograms bucket values so you can ask for percentiles.
2. **Labels slice one metric into many series** - filter and group by them to ask specific questions.
3. **High-cardinality labels are dangerous** - never put unique IDs in a label (more in Phase 3).
4. **`rate(counter[window])`** turns "total ever" into "per second now," and handles counter resets for you.
5. **The rule:** wrap counters in `rate()`; read gauges raw.

Now you can read what's stored. Let's put it on a screen and make it page someone when it matters.

---

[← Phase 1: What Each One Does](01-what-each-one-does.md) · [Guide overview](_guide.md) · [Phase 3: Dashboards & Alerting →](03-dashboards-and-alerting.md)
