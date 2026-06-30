---
title: "The Metrics That Matter"
guide: "load-and-performance-testing"
phase: 2
summary: "Three numbers tell the story: throughput (requests/sec), latency (and why you read percentiles p50/p95/p99, not averages - the slow tail is what users feel), and error rate under load. Plus the four test types: load, stress, soak, and spike."
tags: [throughput, latency, percentiles, p95, p99, error-rate, stress-test, soak-test, spike-test]
difficulty: advanced
synonyms: ["what is throughput", "what is latency", "p50 p95 p99 explained", "why percentiles instead of average latency", "what is error rate under load", "load vs stress vs soak vs spike test", "what is a soak test", "what is a spike test"]
updated: 2026-06-19
---

# The Metrics That Matter

A load test throws a wall of numbers at you - graphs, tables, counters ticking up. It's tempting to fixate on the one big number ("we did 5,000 requests a second!") and miss the one that's quietly telling you the system is in trouble. So before you run anything, let's get crisp on *what to watch* and *what each number actually means about your users' experience*.

There are only three measurements you truly need, and one of them - latency - is measured in a way that feels strange until you understand *why*, at which point it becomes the most important number on the screen.

## Throughput - how much work it's getting done

**What it actually is.** Throughput is the **rate of work**: how many requests your system completes per second. You'll see it written as **req/s** (requests per second), sometimes **RPS** or, for full multi-step user journeys, transactions per second. It answers "how much is flowing through right now?"

**What it does in real life.** As you add virtual users, throughput climbs - more users, more requests completed per second. Then, at some point, it *stops climbing* even though you keep adding users. That flat ceiling is a signal: the system is now completing work as fast as it possibly can. Pile on more users past that and they don't get served faster - they get served *slower*, because they're queueing for a system that's already maxed out.

```text
   throughput
   (req/s)
      │                  ┌──────────────  ← ceiling: it can't go faster
      │              ┌───┘
      │          ┌───┘
      │      ┌───┘
      │  ┌───┘
      └──┴────────────────────────────▶  virtual users
         more users → more throughput …
         until it flattens. that flat line is your capacity.
```

⚠️ **Gotcha.** High throughput is not the same as *healthy*. A system can report a big req/s number while half those requests are fast error responses (an error page returns quickly). Throughput tells you *how much* is flowing, never whether it's *good*. Always read it alongside latency and errors - never alone.

## Latency - how long each user waits

**What it actually is.** Latency is the time between a request going out and the response coming back - **how long one user waits**. Throughput is the system's view ("work per second"); latency is the *user's* view ("how long did *I* sit there?"). It's measured in milliseconds (ms).

**Why people get this wrong: the average lies.** The instinct is to track *average* latency. It feels right, and it's almost always misleading. Here's why.

Imagine 100 requests. Ninety-nine come back in 50 ms - lovely. One takes 5,000 ms because it got stuck behind a full connection pool. The average is about 100 ms, which looks great and tells you *nothing* about the user who waited five seconds. Average latency hides the disaster by drowning it in good results. And the slow ones aren't random noise - they're real people, hitting the exact contention that load testing exists to find.

**What it does in real life: read percentiles instead.** A **percentile** answers "what was the experience for the slowest X% of requests?" It's the honest way to see the *tail* - the slow requests that an average smooths away.

📝 **Terminology.** A *percentile* (written **pN**) is the value below which N% of your measurements fall. **p50** (the *median*) = half of requests were faster than this, half slower - your typical experience. **p95** = 95% were faster, so this is roughly your "unlucky but not rare" user. **p99** = 99% were faster; this is the worst 1% - and on a busy site, 1% of requests is a *lot* of real, annoyed people.

```text
   100 requests, sorted slowest-last:

   p50  ──────────────────┐  "typical user"      (half are faster)
   p95  ──────────────────────────────┐  "unlucky user" (1 in 20)
   p99  ──────────────────────────────────────┐  "worst 1%"
                                               │
   [50ms ········ 55ms · 60ms ···· 120ms · 480ms · 5000ms]
    └── the long slow tail is real users, and it's what they remember ──┘
```

💡 **Key point.** Users don't experience your *average* - they experience their *own* request. The person who waited five seconds doesn't feel comforted that the average was 100 ms. Watch **p95 and p99**: they are the felt experience of your unluckiest real users, and they're the first thing to spike when the system gets into trouble. The tail is the truth.

⚠️ **Gotcha.** Don't average percentiles together or across machines - a p99 of two servers is not the average of their two p99s. Percentiles have to be computed from the raw measurements pooled together. Most load tools do this for you; the point is to never hand-compute an "average p99," because the result is meaningless.

## Error rate - is it still actually working?

**What it actually is.** Error rate is the share of requests that *failed* rather than returning a correct response - timeouts, dropped connections, and server errors (HTTP 5xx status codes). Under light load it should be effectively zero. Watching it climb as load rises is the clearest signal that you've pushed past what the system can handle.

📝 **Terminology.** A *5xx* is an HTTP status code in the 500–599 range - the server admitting *it* failed (500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable). Distinct from *4xx* codes (like 404), which mean the *client* asked for something wrong. Under load, the code you dread is 5xx: the server buckling.

**What it does in real life.** Error rate is usually the *last* thing to go and the most decisive. The typical failure story reads in order: throughput flattens (maxed out) → latency climbs, especially p95/p99 (requests queueing) → then errors begin (requests timing out or being rejected outright). By the time errors are climbing, users aren't just waiting - they're getting failures. That's the line you do not want to cross in production.

💡 **Key point.** Read all three together as one story. **Throughput** = how much work is getting done. **Latency (percentiles)** = how it feels to each user. **Error rate** = whether it's working at all. One number alone always misleads; the three together tell you exactly where on the curve you are.

## The four test types - same tool, four questions

You drive all of these with the same load tool and the same three metrics. What changes is the *shape* of the load you apply, because each shape answers a different question.

```text
   virtual users over time:

   LOAD          STRESS              SOAK                SPIKE
   ┌────┐        ┌──────┐ keep       ┌──────────┐       │┐
   │    │        │      │ pushing    │          │       ││  sudden
   ┌┘    └       ┌┘      └→ till it   │ steady,  │      ─┘│  jump, then
   ┘     (hold   ┘        breaks      │ for hours│ ─────  └─ drop
   at peak)                           └──────────┘
   "expected     "where's the        "does it leak       "can it survive
    peak - fine?"  breaking point?"    over time?"         a sudden surge?"
```

- 📝 **Load test** - apply your **expected peak** traffic and hold it. The question: *at the busiest level we realistically expect, does it stay fast and error-free?* This is your baseline confidence check, the one you run most often.
- 📝 **Stress test** - keep **increasing** load past expected peak until the system degrades or breaks. The question: *where's the ceiling, and how does it behave when we cross it - graceful slowdown or sudden collapse?* This finds the breaking point on purpose (Phase 3 is built around it).
- 📝 **Soak test** (also called *endurance*) - apply a **moderate, sustained** load for a long time - hours, sometimes a full day. The question: *does anything slowly degrade?* Soak tests catch the bugs short tests can't see: memory leaks, connection leaks, disks filling with logs, caches growing without bound. The system looks perfect for ten minutes and dies at hour six. Only a soak finds that.
- 📝 **Spike test** - jump from low to very high load **suddenly**, then drop back. The question: *can it absorb a flash crowd?* - the launch tweet, the TV mention, the flash sale at noon. Not just whether it survives the spike, but whether it *recovers* cleanly afterward or stays wedged.

💡 **Key point.** These aren't four different tools - they're four traffic *shapes* you apply with the same setup, each answering a question the others can't. "Will our normal Tuesday hold?" is a load test. "What's our actual ceiling?" is stress. "Will it survive the night?" is soak. "Can it take a sudden flood?" is spike.

## Recap

1. **Throughput** (req/s) = how much work gets done. It climbs with users, then flattens - that flat ceiling is your capacity. High throughput alone doesn't mean healthy.
2. **Latency** = how long each user waits. **Read percentiles (p50/p95/p99), never the average** - the average hides the slow tail, and the slow tail is exactly what real users feel.
3. **Error rate** (timeouts, 5xx) should be near zero and is the decisive signal you've gone too far. Read the three metrics together as one story.
4. **Four test types, one tool, four questions:** **load** (expected peak - fine?), **stress** (where's the breaking point?), **soak** (does it leak over hours?), **spike** (can it absorb a sudden surge?).

You know what to watch and what each number means. Next, the hands-on part: pick a realistic scenario, ramp up the virtual users, and find the exact point where the curve turns - the breaking point.

---

[← Phase 1: Why Load-Test](01-why-load-test.md) · [Guide overview](_guide.md) · [Phase 3: Running One & Reading It →](03-running-one-and-reading-it.md)
