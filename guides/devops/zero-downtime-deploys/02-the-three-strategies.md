---
title: "The Three Strategies"
guide: "zero-downtime-deploys"
phase: 2
summary: "Rolling, blue-green, and canary: how each moves live traffic from the old version to the new without a gap, and when to reach for which."
tags: [deployment, rolling-deploy, blue-green, canary, load-balancer, traffic, devops]
difficulty: intermediate
synonyms: ["rolling deploy vs blue green", "what is a canary deployment", "blue green deployment explained", "how does a rolling update work", "when to use canary vs blue green"]
updated: 2026-06-30
---

# The Three Strategies

Now that something sits in front of your instances, you have choices about *how* to move traffic from the old version to the new. There are three patterns worth knowing, and they're not really competitors — they trade off speed, cost, and how much risk you want to take in one swing. Most teams use more than one over time.

The thread running through all three: at no point is there a moment where the only thing that can serve a request is mid-restart. You always have a healthy version answering while the change happens.

## Rolling: replace a few at a time

A rolling update keeps your fleet mostly intact and swaps instances out in small batches. Take one (or a few) out of rotation, upgrade them, wait until they're healthy, put them back, then move to the next batch. Repeat until the whole fleet runs the new version.

```text
start:   [v1] [v1] [v1] [v1]      all old

step 1:  [v2] [v1] [v1] [v1]      one upgraded, rest still serving
step 2:  [v2] [v2] [v1] [v1]
step 3:  [v2] [v2] [v2] [v1]
done:    [v2] [v2] [v2] [v2]      all new, never fewer than 3 serving
```

*What just happened:* at every step, a majority of instances stay healthy and in-rotation, so there's always capacity to serve traffic. The new version proves itself healthy on one instance before the next one is touched. This is the default for Kubernetes and most container platforms because it needs no extra hardware — you reuse the instances you already have.

The catch with rolling: for a while, **both versions serve real traffic at the same time.** A user might hit v2 on one request and v1 on the next. If those versions disagree about the shape of the data or an API response, that user sees something inconsistent. Hold that thought — it's the whole reason Phase 3 exists.

## Blue-green: two full environments, flip the switch

Blue-green runs two complete copies of your environment. "Blue" is live and serving everyone. You deploy the new version to "green" — an idle full-size copy — and let it warm up and pass its checks with zero real traffic on it. When green looks good, you point the load balancer at green. One change, all traffic moves.

```text
before flip:   users ──► [ BLUE  v1 ]  (live)
                         [ GREEN v2 ]  (ready, no traffic)

after flip:    users ──► [ GREEN v2 ]  (live)
                         [ BLUE  v1 ]  (idle — kept warm for rollback)
```

*What just happened:* the flip is near-instant and atomic — traffic goes from all-blue to all-green in one routing change, so there's never a mix of versions serving at once. The superpower is rollback: if green misbehaves, you flip straight back to blue, which is still sitting there fully running. Recovery is seconds, not a redeploy.

The cost is in the name: you're paying for **two full environments** during the deploy. For a large fleet that's real money, even if green only exists for a short window. Blue-green also doesn't give you a gentle "try it on a few users first" — it's all or nothing.

## Canary: a small slice first, watch the numbers

A canary deploy sends a *small percentage* of traffic to the new version and keeps the rest on the old one. You watch your metrics — error rate, latency, the business numbers that matter — on that small slice. If it stays healthy, you raise the percentage in steps until it's serving everyone. If it goes bad, you've only exposed a few percent of users, and you pull it back.

```text
phase 1:   95% ──► [v1]      5% ──► [v2]   watch error rate, latency
phase 2:   75% ──► [v1]     25% ──► [v2]   still healthy? continue
phase 3:    0% ──► [v1]    100% ──► [v2]   full rollout
```

*What just happened:* the new version is tested against *real production traffic* but with a blast radius you control. The name comes from the canary in a coal mine — a small, early warning. The trade-off is that canary needs the most machinery: traffic-splitting at a percentage, and good enough metrics to actually tell "this canary is sick" from normal noise. Without solid observability, a canary is just a slower rollout you can't read.

## Which one, when

| Strategy   | Extra cost          | Rollback speed     | Both versions live at once? | Reach for it when |
|------------|---------------------|--------------------|-----------------------------|-------------------|
| Rolling    | None (reuse fleet)  | Roll back forward  | Yes, during the roll        | Default; you have many instances and limited budget |
| Blue-green | A second full env   | Instant (flip back)| No (atomic flip)            | Rollback speed matters most; you can afford the double |
| Canary     | Traffic-split + metrics | Fast (small slice) | Yes, by design          | Risky change; you want real-traffic proof on a few users first |

*What just happened:* there's no winner — there's a fit. Rolling is the cheap default. Blue-green buys you instant rollback at the price of a second environment. Canary buys you a tiny blast radius at the price of needing real observability. Teams often combine them: canary the risky releases, blue-green the ones where rollback speed is everything, roll the routine stuff.

> Notice what blue-green and canary lean on that rolling tries to skip: a clean way to **not mix versions**, or to mix them *on purpose and carefully*. Whenever two versions touch the same database, the strategy alone isn't enough — the data has to be ready for both. That's the hard part, and it's next.

**For builders:** start with what your platform already does. Kubernetes, ECS, and most PaaS offer rolling out of the box — you may already be doing zero-downtime deploys and not know it. Reach for blue-green or canary when a specific pain shows up: "rollback takes too long" points at blue-green; "that last release broke things for everyone before we noticed" points at canary. Don't build canary infrastructure you don't yet need — see [What CI/CD Does](/guides/what-cicd-does) for where these fit in the bigger release picture.

```quiz
[
  {
    "q": "During a rolling update, what is true about the versions serving traffic?",
    "choices": [
      "Only the old version serves until the very last second",
      "Both the old and new versions serve real traffic simultaneously for part of the rollout",
      "Neither version serves; there is a planned gap",
      "Only the new version serves from the first instant"
    ],
    "answer": 1,
    "explain": "Rolling swaps instances in batches, so for a stretch some instances run v1 and some run v2, both taking live requests — which is why version compatibility matters."
  },
  {
    "q": "What is the defining advantage of blue-green over rolling?",
    "choices": [
      "It uses no extra infrastructure",
      "It splits traffic by percentage for gradual testing",
      "Rollback is near-instant because the old environment is still fully running, ready to flip back to",
      "It guarantees the database never needs changes"
    ],
    "answer": 2,
    "explain": "Blue-green keeps the previous environment alive and idle, so a bad release is reverted by flipping the router back — seconds, not a redeploy."
  },
  {
    "q": "What does a canary deploy most depend on to be useful?",
    "choices": [
      "A second full copy of the environment",
      "Good observability — metrics that can tell a sick canary from normal noise on a small traffic slice",
      "The ability to stop all traffic during the deploy",
      "A single instance running the app"
    ],
    "answer": 1,
    "explain": "Canary exposes the new version to a small percentage of real traffic; without solid metrics you can't read whether that slice is healthy, so it's just a slow rollout."
  }
]
```

[← Phase 1: Why Naive Deploys Hurt](01-why-naive-deploys-hurt.md) | [Overview](_guide.md) | [Phase 3: The Hard Part →](03-migrations-and-health.md)
