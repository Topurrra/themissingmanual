---
title: "What load testing actually measures"
guide: load-testing-k6-jmeter
phase: 1
summary: "Load vs stress vs soak, what a virtual user is, and why the average response time hides the failure your users actually feel."
tags: [load-testing, virtual-users, percentiles, p95, soak-test, stress-test]
difficulty: intermediate
synonyms: [load vs stress vs soak test, what is a virtual user, why average response time is misleading, what does p95 mean, throughput vs latency, breaking point of a server]
updated: 2026-06-30
---

# What load testing actually measures

Here is the reality you are starting from. Your service feels fast. You click around, it responds instantly, the unit tests are green. That feeling is built on a sample size of one: you, alone, with a warm cache and an idle database. Load testing exists to answer a different question, the one you cannot feel from your chair: *what happens when a thousand of you show up at the same second?*

The trap is thinking load testing is about making traffic. Anyone can flood a server. The skill is making traffic that resembles your real users, then reading the response so you learn the truth instead of a number that sounds impressive in a meeting.

## Three tests, three questions

People say "load test" to mean three different experiments. They overlap in tooling but answer different questions, and mixing them up is how you end up confidently wrong.

- **Load test** — "Does the system meet its target under expected traffic?" You drive the load you actually expect (say, your busy-hour traffic plus some headroom) and check that response times and error rates stay inside your goals. This is the everyday test, the one you run in CI.
- **Stress test** — "Where does it break, and how?" You push past expected traffic, deliberately, until something gives. The goal is not to pass; the goal is to find the cliff and watch how the system falls off it. Does it slow down gracefully, or does it fall over and refuse to recover?
- **Soak test** — "Does it survive over time?" You hold a moderate, realistic load for hours. This is how you catch the slow leaks: memory creeping up, connection pools that never release, a disk filling with logs. A system can pass a ten-minute load test and die at hour six.

```text
load     ████████░░░░  expected traffic, short, "do we meet target?"
stress   ████████████  push past the limit, "where's the cliff?"
soak     ██████░░░░░░  moderate, for hours, "does it leak?"
```

*What just happened:* the same tool can run all three. The difference is the shape and duration of the load you apply and the question you brought with you. Decide the question first, then design the test.

## What a virtual user actually is

Both k6 and JMeter work in terms of **virtual users** (VUs in k6, threads in JMeter). A virtual user is a loop: do a request, maybe wait a moment like a human reading the page, do the next request, repeat. Concurrency comes from running many of these loops at once.

This matters because *VU count is not request count.* Fifty virtual users does not mean fifty requests per second. If each user pauses one second between requests and each request takes 200 ms, each user completes roughly one iteration every 1.2 seconds, so fifty users produce around 40 requests per second. The thing your server actually feels is **throughput** — requests per second — and it falls out of VUs, think time, and how fast the server responds. Slow the server down and throughput drops even though your VU count never moved.

> Two numbers describe load from opposite sides. **Concurrency** (virtual users) is how many clients are in flight. **Throughput** (requests/sec) is how much work lands on the server. Report both — one without the other is half a story.

## Why the average lies to you

This is the single most important idea in the guide, so sit with it. Suppose you make 100 requests. Ninety-five come back in 50 ms. Five take 4 seconds because they hit a cold cache, a lock, or a slow query. The **average** is about 250 ms, which sounds fine. But five percent of your users waited four full seconds. The average smeared their pain across everyone and made it disappear.

**Percentiles** put the pain back. The **p95** (95th percentile) is the value that 95% of requests came in *under*. In our example, p95 is around 4 seconds — and that number screams what the average whispered.

```text
sorted response times (ms): 48 49 50 ... 51 | 3900 3950 4000 4100 4200
                            └── 95 fast ──┘   └──── 5 slow ────┘
average = ~250 ms   (looks fine)
p95     = ~4000 ms  (tells the truth)
p99     = ~4200 ms  (the worst real users see)
```

*What just happened:* the average got dragged toward the middle of two clusters and described nobody. p95 and p99 describe the slow tail — the users who notice, complain, and leave. Always read percentiles. Treat the average as decoration.

The numbers you should report from any run are: **p95 latency** (and p99 if your goals are strict), **throughput** (requests/sec), and **error rate** (percent of requests that failed). Those three, together, tell you whether the system met its target, how much work it was doing when it did, and whether it was quietly dropping requests to get there.

## For builders

Before you write a single line of test script, write down your **goals as numbers**: "p95 under 300 ms at 200 requests/sec with error rate under 1%." That sentence is the difference between a test that passes or fails and a test that only produces a graph. A graph invites debate; a threshold gives you a verdict. Phase 2 turns exactly this kind of sentence into a runnable check in both tools.

```quiz
[
  {
    "q": "You hold a moderate, realistic load steady for six hours to catch a slow memory leak. Which test is this?",
    "choices": ["Load test", "Stress test", "Soak test", "Smoke test"],
    "answer": 2,
    "explain": "A soak test runs a moderate load over a long duration specifically to surface slow problems like memory leaks and pool exhaustion."
  },
  {
    "q": "95 requests return in 50 ms and 5 return in 4000 ms. Why is the average a misleading metric here?",
    "choices": ["It is calculated wrong by most tools", "It blends the slow tail into the fast majority, hiding the 5% who waited 4 seconds", "Averages only work for error rates", "It overstates how slow the system is"],
    "answer": 1,
    "explain": "The average smears the painful tail across all requests. p95/p99 expose the slow requests real users actually feel."
  },
  {
    "q": "You run 50 virtual users, each pausing ~1s between requests that take ~200ms. Roughly what does the server feel?",
    "choices": ["50 requests per second", "Around 40 requests per second", "200 requests per second", "Exactly 50 concurrent requests at all times"],
    "answer": 1,
    "explain": "VU count is not throughput. Each user does ~1 iteration per 1.2s, so 50 users produce roughly 40 req/s. Report concurrency and throughput separately."
  }
]
```

[← Overview](_guide.md) · [Phase 2: Writing the same test in k6 and JMeter →](02-k6-and-jmeter-in-practice.md)
