---
title: "When the numbers lie and the system breaks"
guide: load-testing-k6-jmeter
phase: 3
summary: "The traps that quietly fake a passing load test, plus what real production load does that your tidy localhost run never showed you."
tags: [load-testing, gotchas, production, bottleneck, caching, coordinated-omission]
difficulty: intermediate
synonyms: [load test invalid results, why load test passed but prod failed, load generator bottleneck, cached load test data, testing against localhost, error rate hidden, load test best practices]
updated: 2026-06-30
---

# When the numbers lie and the system breaks

You ran the test. It passed. The graph is green, p95 is comfortable, and you are ready to call it done. This phase is the friend who pulls you aside and asks whether the test measured what you think it did — because a load test that passes for the wrong reason is more dangerous than no test at all. It hands you confidence you did not earn, and you spend it in production.

Let us walk through the ways a green run lies, and then what production does that no test fully captures.

## The load generator is the bottleneck

The first thing to suspect when your numbers look strange is the machine *running the test*, not the machine under test. Generating thousands of concurrent requests is itself hard work. If your laptop (or the tiny CI runner) maxes out its CPU or runs out of open file descriptors, it cannot send requests fast enough, and you measure *its* limit while believing you measured the server's.

```console
$ k6 run --vus 2000 orders-test.js
WARN[0012] Request Failed   error="dial: i/o timeout"
WARN[0014] Request Failed   error="socket: too many open files"
```

*What just happened:* those errors are not your server failing — they are the *generator* failing. The server may be perfectly healthy and starved of traffic. Always watch the generator's own CPU and network during a run. When one box cannot push enough load, you move to distributed generation (k6 supports running across multiple machines; JMeter has a controller/worker setup) rather than trusting numbers from a saturated client.

## Your test data is too clean

This one is subtle and bites almost everyone. If every virtual user logs in as the same account and requests the same record, your database serves that row from cache after the first hit. Your test then measures cache performance, which is dazzlingly fast and completely unlike production, where users hit *different* rows and the cache misses constantly.

```javascript
// trap: every VU reads the same id -> warm cache, fake-fast results
http.get('https://api.example.com/orders/42');

// better: spread reads across many ids the way real users do
const id = Math.floor(Math.random() * 100000) + 1;
http.get(`https://api.example.com/orders/${id}`);
```

*What just happened:* the first line lets one cached row carry the whole test and reports a latency you will never see in production. The second spreads reads across the dataset, forcing real cache misses and real database work. Realistic, varied test data is often the difference between a useful test and a comforting fiction. The same applies to JMeter via a CSV Data Set Config that feeds different values per thread.

## You forgot to check whether requests succeeded

A fast response is worthless if it is an error. Under load, a server protecting itself often returns `429 Too Many Requests` or `503 Service Unavailable` *instantly* — those failures are blazing fast, and they will drag your average latency *down* while your error rate quietly climbs. If you only watch latency, the test looks like it got faster under load. It got faster because it stopped working.

```console
http_req_duration..........: avg=31ms  p(95)=44ms     ← looks great!
http_req_failed............: 73.0%   ✗ 14209         ← it's on fire
```

*What just happened:* p95 dropped to 44 ms not because the system sped up but because three-quarters of requests were fast rejections. This is why error rate sits next to latency in every report from Phase 1 — latency without error rate is a number that can lie to your face. In k6, an `http_req_failed` threshold catches it; in JMeter, watch the **Error %** column.

## Find the bottleneck, do not only name a number

A load test tells you *that* the system slowed at 200 req/s. It does not tell you *why*. The "why" lives in metrics from the system under test, observed during the run: CPU, memory, database connection pool usage, disk and network I/O. The number from the load tool and the resource graphs from the server are two halves of one diagnosis.

```text
req/s climbs ──► p95 climbs ──► look at the server, NOT the tool:
   CPU pinned at 100%?        → compute-bound, scale or optimize code
   DB connections maxed?      → pool too small / queries too slow
   memory climbing, no plateau?→ probable leak (run a soak test)
   CPU idle but slow anyway?  → waiting on a downstream / lock contention
```

*What just happened:* the load tool found the symptom; the server's own metrics name the cause. A passing or failing number with no resource graphs behind it is a verdict with no evidence. Watch both, always.

## Production reality the test never showed you

Even a careful test is a model, and the territory has features the map omits. Keep these in mind before you trust a green run too far:

- **The network is real.** Testing against `localhost` removes latency, TLS handshakes, and bandwidth limits that real users carry on every request. Run the generator from somewhere with a realistic network path to the server.
- **Caches were warm (or cold) differently.** A short test may ride a warm cache that a real cold start would not have. A real deploy restarts everything; consider whether your test reflects that.
- **Real traffic is spiky and mixed.** Users do not arrive in a tidy ramp. They spike, they hit a mix of cheap and expensive endpoints, and they retry on failure (which *amplifies* load right when you can least afford it). A single-endpoint test misses this entirely.
- **Downstream dependencies have their own limits.** Your service may scale fine, but the third-party payment API, the shared database, or the rate-limited search backend may not. The bottleneck is often something you do not own.

> The honest summary of any load test: it tells you a *lower bound* on your problems under one specific, simplified scenario. It cannot prove the system is fine. It can only prove it is not *clearly* broken in the way you tested. Treat a green run as one piece of evidence, not a guarantee.

## In the wild

Mature teams do not run a load test once before launch and forget it. They keep a small, fast k6 test in CI as a regression gate (catching the day a code change quietly doubles a query count), and they run a larger, more realistic stress and soak test against a production-like environment before big events. The cheap test guards every commit; the expensive test guards the launch. For where this fits in the broader practice, see [/guides/load-and-performance-testing](/guides/load-and-performance-testing), and for what "fast enough" even means, [/guides/what-performance-means](/guides/what-performance-means).

```quiz
[
  {
    "q": "Under heavy load your p95 latency suddenly drops to 40ms but error rate jumps to 70%. What is the most likely explanation?",
    "choices": ["The server got faster under load", "The server is returning instant 429/503 rejections, which are fast and pull latency down", "The load generator sped up", "Caching finally kicked in"],
    "answer": 1,
    "explain": "Fast failures (429/503) lower average latency while the system stops working. Always read error rate alongside latency."
  },
  {
    "q": "Every virtual user requests `/orders/42`. Why does this produce misleading results?",
    "choices": ["It overloads the network", "The same row stays cached, so you measure cache speed, not real database load", "It causes too many open files", "k6 cannot handle a static URL"],
    "answer": 1,
    "explain": "Identical requests ride a warm cache and hide real database work. Spread reads across varied data (random ids, CSV data sets) to force realistic cache misses."
  },
  {
    "q": "Your load tool reports p95 climbing past your goal at 200 req/s. What is the single best next step to find the cause?",
    "choices": ["Add more virtual users", "Lower the threshold so the test passes", "Look at the server's own resource metrics (CPU, memory, DB pool) during the run", "Rerun against localhost"],
    "answer": 2,
    "explain": "The load tool shows the symptom; the system's resource graphs name the cause. Diagnosis needs both halves together."
  }
]
```

[← Phase 2: Writing the same test in k6 and JMeter](02-k6-and-jmeter-in-practice.md) · [Overview](_guide.md)
