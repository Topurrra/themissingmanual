---
title: "Why Naive Deploys Hurt"
guide: "zero-downtime-deploys"
phase: 1
summary: "The mental model: a deploy means two versions of your code want to exist at once, and stop-and-replace drops every request in that gap."
tags: [deployment, zero-downtime, downtime, load-balancer, mental-model, devops]
difficulty: intermediate
synonyms: ["why do deploys cause downtime", "what is a maintenance window", "why does restarting drop requests", "deploy gap explained"]
updated: 2026-06-30
---

# Why Naive Deploys Hurt

Here's the deploy you probably learned first, even if nobody named it. You SSH into the server, pull the new code, stop the app, and start it again. For the few seconds between "stop" and "ready," the server answers nothing. If a user clicks during those seconds, they get an error or a hang. Scale that to a busy site and a "few seconds" of nothing is a wall of failed requests.

The trap is that on your laptop, this *looks* fine. You restart, you refresh, the new version is there. You were the only user, and you weren't clicking during the gap. Production is different in exactly one way that matters: there is never a moment when nobody is clicking.

## The deploy is a moment when two versions want to exist

Strip away the tooling and every deploy is the same shape: right now, version 1 of your code is serving requests. You want version 2 to serve them instead. There is some instant where the switch happens - and the entire problem of zero-downtime deploys is *what occurs during that instant*.

The naive deploy handles it like this:

```text
v1 running ──► [STOP] ──► (nothing answers) ──► [START v2] ──► v2 ready
                            ^^^^^^^^^^^^^^^^
                            requests die here
```

*What just happened:* between stop and ready, there's a window where the port is closed or the app is still booting. Every request that arrives in that window fails. The window might be two seconds or thirty, depending on how slow your app is to start - and a slow-starting app makes the wound bigger.

## Why "it starts in a second" is a lie under load

Booting an app is not instant, and it gets slower exactly when you can least afford it. A real app, on startup, has to:

- Load and parse its code.
- Open a connection pool to the database.
- Warm caches, compile templates, or JIT hot paths.
- Run any startup checks before it's truly ready to answer.

```console
$ systemctl restart myapp
$ curl localhost:8080/health
curl: (7) Failed to connect to localhost port 8080: Connection refused
$ # ...wait...
$ curl localhost:8080/health
curl: (7) Failed to connect to localhost port 8080: Connection refused
$ # ...wait some more...
$ curl localhost:8080/health
{"status":"ok"}
```

*What just happened:* the process was "restarted" the instant the command returned, but the app wasn't *ready* for several more seconds. "Process is up" and "app can serve a request" are two different events, and the gap between them is pure downtime. This distinction - running versus ready - is the seed of everything in Phase 3.

## The fix is never "make the gap smaller" - it's "have no gap"

The instinct is to optimize the restart: faster boot, quicker swap, shave the window down. That's a losing game. Even a one-second gap drops requests under real traffic, and you can't get to zero by subtraction.

The actual fix is structural: **keep the old version serving until the new version is fully ready, then move traffic across - never tear down what's working before the replacement can take over.** To do that, you need something sitting *in front* of your app that decides where requests go.

## The piece that makes it possible: something in front

Every zero-downtime strategy depends on a layer between users and your app instances - a **load balancer** (or reverse proxy, or service mesh; same idea). Users talk to it; it forwards each request to one of your backend instances.

```text
                 ┌──────────────┐
   users ──────► │ load balancer│
                 └──────┬───────┘
                  ┌─────┴─────┐
                  ▼           ▼
              instance A   instance B   (your app, more than one copy)
```

*What just happened:* because the load balancer chooses the target per request, you can change *which* instances are healthy and in-rotation without users ever addressing your app directly. Take instance A out, upgrade it, put it back - the balancer routes around the gap. This indirection is the hinge the next phase turns on: you can't roll, flip, or canary anything if every user is wired straight to a single process.

> The implication people miss: zero-downtime deploys assume **more than one instance** and a router in front. A single box with one process can't be upgraded without *some* gap. If you're on one server, the first real step toward safe deploys is running at least two instances behind a balancer.

**For builders:** look at how your app is reachable right now. If users hit a single process directly (one `node server.js`, one container, one port), there's no seam to deploy through. The cheapest upgrade isn't a fancy tool - it's a second instance and a proxy (nginx, a cloud load balancer, your platform's built-in one) so that "take one down" stops meaning "take the site down."

```quiz
[
  {
    "q": "Why does a stop-and-replace deploy drop requests in production but seem fine in local testing?",
    "choices": [
      "Local machines are faster, so the gap is zero",
      "In production there is never a moment when no one is sending requests, so the stop-to-ready gap always catches some",
      "Production code is buggier than local code",
      "The database is slower in production"
    ],
    "answer": 1,
    "explain": "The gap exists in both places; locally you just aren't sending traffic during it. Under real load, requests always arrive in that window and fail."
  },
  {
    "q": "What is the difference the health gap exposes between 'process is up' and 'app is ready'?",
    "choices": [
      "There is no difference; they happen at the same instant",
      "A process can be running while still booting - opening pools, warming caches - and unable to serve requests yet",
      "'Ready' means the process has exited cleanly",
      "'Up' refers to the database, 'ready' refers to the cache"
    ],
    "answer": 1,
    "explain": "Startup work (pools, caches, compilation) happens after the process launches. Treating 'up' as 'ready' routes traffic to an app that can't answer yet."
  },
  {
    "q": "What structural piece must exist before any zero-downtime strategy can work?",
    "choices": [
      "A faster CPU to shrink the restart window",
      "A single very reliable server",
      "A load balancer (or proxy) in front of more than one instance, so traffic can be routed around an instance being upgraded",
      "A larger database connection pool"
    ],
    "answer": 2,
    "explain": "Zero-downtime deploys rely on indirection: a router in front of multiple instances lets you take one out, upgrade it, and return it without users hitting a gap."
  }
]
```

[← Overview](_guide.md) | [Phase 2: The Three Strategies →](02-the-three-strategies.md)
