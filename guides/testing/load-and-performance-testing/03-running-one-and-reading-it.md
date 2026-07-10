---
title: "Running One & Reading It"
guide: "load-and-performance-testing"
phase: 3
summary: "The workflow end to end: pick a realistic scenario, ramp up virtual users, watch throughput/latency/errors, and find the knee - the point where latency spikes and errors climb. With an illustrative readout, and the traps (test like production, or the numbers lie) that fool first-timers."
tags: [load-testing, workflow, ramp-up, breaking-point, knee, reading-results, test-environment]
difficulty: advanced
synonyms: ["how to run a load test", "how to read load test results", "what is the knee in a load test", "find the breaking point of a server", "how to ramp up virtual users", "why do load test numbers lie", "test like production"]
updated: 2026-07-10
---

# Running One & Reading It

You know why you're testing and what the numbers mean. Now the actual loop. A load test isn't a button you press for a verdict - it's a small experiment you design, run, and *read*. Done right, it ends with you pointing at one spot on a graph and saying "that's where we break, and it's at a level we won't hit for months" - the calm, boring outcome you want.

The whole thing is four moves: pick a realistic scenario, ramp the load up, watch the three metrics, and find the knee.

## Step 1 - Pick a realistic scenario

**What it actually is.** A scenario is the *story* of what a virtual user does - the sequence of requests that mimics a real person. Not just hammering one URL, but the journey: load the home page, search, view an item, add to cart, check out, each with a realistic pause ("think time") in between.

**Why this matters.** If you blast a single trivial endpoint - say a `/health` check that returns "ok" and touches nothing - you'll get a gorgeous, enormous throughput number that means *nothing*, because no real user spends their day hitting your health check. The endpoints that break under load are the expensive ones: the search that runs a heavy query, the checkout that writes to the database and calls a payment API. Test the journeys that actually cost something, weighted roughly the way real traffic is.

⚠️ **Gotcha - the model is only as honest as the inputs.** Vary your test data. If all ten thousand virtual users search for the same word and request the same product, your database serves it all from cache and reports dazzling numbers production will never reproduce, because real users search for *different* things and blow past that cache. Same for logins: reusing one account behaves nothing like thousands of distinct sessions. Realistic, *varied* data is the difference between a test that warns you and one that flatters you.

## Step 2 - Ramp up (don't slam)

**What it actually is.** Ramping means adding virtual users *gradually* over time - start at a handful, climb steadily to your target - rather than launching all of them in the first instant. You configure a *ramp profile*: e.g. add 50 users every 30 seconds up to 1,000.

**Why you ramp instead of slamming.** A gradual ramp lets you *see the breaking point coming* - as load rises smoothly, you watch latency and errors rise with it and read the exact level where things turn. Drop all 1,000 users in at once and everything degrades simultaneously, so you learn only "1,000 was too many," not *whether the trouble started at 400 or 900* - the number you actually came for. (Slamming is its own test, the **spike test** from Phase 2 - but for *finding capacity*, you ramp.)

```text
   a ramp profile:

   users
   1000 │                              ┌───────  ← hold at target
        │                        ┌─────┘
    500 │                  ┌─────┘
        │            ┌─────┘
        │      ┌─────┘
      0 └──────┴────────────────────────────────▶ time
         each step up = a new data point on your capacity curve
```

## Step 3 - Watch the three metrics live

As the ramp climbs, keep all three numbers from Phase 2 in view at once - they move as a story:

- **Throughput** rises with the user count… until it flattens. Note the flat ceiling.
- **Latency percentiles** (p95, p99) stay low and steady… until they start curving upward. Watch the tail first; p99 bends before p50 does.
- **Error rate** sits at zero… until it lifts off. This is usually the last and most decisive move.

The moment these three turn together is the whole point of the exercise. It has a name.

## Step 4 - Find the knee (the breaking point)

**What it actually is.** The **knee** (also called the *breaking point* or *saturation point*) is the spot on the curve where the system stops scaling gracefully and starts falling apart: throughput flattens, latency turns sharply upward, and errors begin to climb, all around the same load level. Below the knee, more users get served fine; above it, more users just make everyone slower and then start failing.

📝 **Terminology.** The *knee* is the bend in the latency-vs-load curve - named because the line, flat-then-sharply-up, looks like a bent knee. It marks the capacity ceiling: the honest number for "how much can this take?"

```text
   latency
   (p99)
      │                              ╱  ← past the knee: latency explodes,
      │                            ╱      errors climbing - the cliff
      │                          ╱
      │                       ╱
      │  ─────────────────╱   ← THE KNEE: capacity ceiling
      │ ────────────────       (flat & healthy below it)
      └──────────────────────────────────▶ virtual users
              comfortable          breaking
```

**A real example - reading a stress-test readout.** Here's a ramp result table. The shape of these numbers is **illustrative - not a measurement of any real system** - to show you how to *read* one, not what your server will do.

```console
$ k6 run --vus-max 1000 ramp-checkout.js

  scenarios: ramping from 0 to 1000 VUs over 10m, then hold 5m

  VUs    throughput     p50      p95       p99      error%
  ----   -----------    -----    ------    ------   ------
   100      480 r/s      42ms     88ms     120ms    0.00%
   300    1,410 r/s      45ms     96ms     140ms    0.00%
   500    2,300 r/s      51ms    120ms     210ms    0.01%
   700    2,950 r/s      68ms    240ms     680ms    0.04%
   800    3,050 r/s     110ms    520ms   1,900ms    0.20%
   900    3,040 r/s     280ms  2,100ms   6,400ms    3.10%
  1000    2,780 r/s     640ms  5,800ms  14,000ms   11.40%
```
*What just happened:* (illustrative figures) Read it top to bottom as a story. From 100 to 500 users everything is healthy - throughput climbs in step with users, latency is calm (p99 around 120–210 ms), errors essentially zero. At **700** the first cracks show: throughput growth is slowing and p99 has jumped to 680 ms, the tail stretching even though the typical user (p50, 68 ms) still feels fine. At **800** throughput has basically *stopped climbing* (3,050 r/s, the ceiling) while p99 crosses past a second and errors tick up. By **900–1000** it's a cliff: adding users no longer adds throughput (it's *dropping*), p99 blows out to many seconds, errors hit double digits - real users getting failures, not just waits. **The knee is right around 700–800 users.** That's your honest capacity: comfortable headroom if you expect 300 concurrent users at launch, a problem to fix *now* if you expect 900.

⚠️ **Gotcha - test like production, or the numbers lie.** This is the single biggest way load tests betray you. The result above is only meaningful if the test ran against an environment that *matches production* in the ways that bite:

- **Data volume.** A query against 10,000 rows behaves nothing like the same query against 50 million. Test on production-scale data, or your latency numbers are fiction.
- **Environment shape.** A laptop, or a "staging" box with a quarter of prod's memory and one CPU, will find a fake breaking point far below the real one - or hide a real one you'd hit in prod.
- **Realistic, varied inputs** (from Step 1) - distinct users, varied searches, so caches behave the way they will in real life.

A load test against a tiny, empty, single-core environment produces confident, precise, *wrong* numbers - arguably worse than no test, because it tells you you're safe when you aren't. Can't test against true production scale? Say so out loud and treat the result as a rough floor, not a guarantee.

## When it breaks: symptom, not cause

You found the knee at ~800 users and decided that's not enough headroom. Now what? Here's the boundary of this guide, stated plainly:

The load test told you the **symptom** - *"it saturates around 800 concurrent users; p99 and errors explode there."* It did **not** tell you the **cause** - *which* resource ran out, *which* query went quadratic, *where* the time actually went. Those are different questions answered by different tools: profilers, query plan analysis, flame graphs, distributed tracing - the **performance** category (profiling and observability), a separate hunt with its own guide.

⚠️ **Gotcha.** Don't try to *guess* the cause from the load test alone. The temptation is to eyeball the knee, declare "must be the database," and start adding indexes. Sometimes you're right; often you're not, and you burn a day optimizing the wrong thing. The disciplined order: **load test to find the breaking point → profile/observe to find the cause → fix → load test again to confirm the knee moved.** Load testing is how you *measure*; profiling is how you *diagnose*; re-running the load test proves the fix worked.

🪖 **War story.** A team load-tested a reporting endpoint, found a knee at a few hundred users, and "knew" it was the database - so they spent a sprint adding indexes and a read replica. The knee barely moved. When they finally profiled it, the time was going to JSON serialization of an enormous response payload in the app layer; the database was never the bottleneck. The load test had correctly found *where* it broke - only the profiler found *why*.

## Recap

1. **Pick a realistic scenario** - model real user *journeys* with varied data, not one trivial endpoint, or the numbers flatter you.
2. **Ramp up gradually**, don't slam - a smooth ramp lets you *see the breaking point arrive* and read the exact level where it turns.
3. **Watch throughput, latency percentiles, and error rate together** as the load climbs.
4. **Find the knee** - where throughput flattens, p95/p99 curve sharply up, and errors lift off. That's your honest capacity; compare it to the traffic you actually expect.
5. **Test like production** (data volume, environment, varied inputs) or the result is confident fiction. A load test finds the **symptom**; **profiling** (a future performance guide) finds the cause - keep those two jobs, and that order, separate.

That's the full loop. You can now answer the question that started this guide - *will it hold?* - with a number and a graph instead of a launch-day stomach-drop.

---

[← Phase 2: The Metrics That Matter](02-the-metrics-that-matter.md) · [Guide overview](_guide.md)
