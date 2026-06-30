---
title: "Testcontainers, From Zero"
guide: testcontainers-from-zero
phase: 3
summary: "Integration tests against the real thing: spin up a throwaway Postgres, Kafka, or Redis in Docker for each test run, then tear it down automatically."
tags: [testing, docker, integration-tests, postgres, kafka, redis]
difficulty: intermediate
synonyms: [testcontainers, integration test database, docker test database, throwaway postgres test, real dependencies in tests, testcontainers java, testcontainers python, testcontainers go]
updated: 2026-06-30
---

# Production reality: Docker, speed, and CI

Testcontainers is reliable, but it has one hard requirement and a handful of failure modes that look mysterious the first time you hit them. None are hard once you know what you're looking at. This phase is the list of things that will bite you, and the fix for each.

## The Docker requirement is non-negotiable

Testcontainers starts real containers, so it needs a container runtime it can talk to. On a dev laptop that's usually Docker Desktop, Colima, Rancher Desktop, or Podman; in CI it's a Docker daemon the job can reach. No runtime, no containers, and the error is blunt about it.

```text
Could not find a valid Docker environment.
Please check:
  - Docker is installed and the daemon is running
  - the current user can access the Docker socket
```

*What just happened:* Testcontainers tried to reach a container runtime, found nothing it could talk to, and stopped before any test ran, because there is no fallback. Real containers need a real daemon.

This is the trade you accept for testing against the real thing. If a machine genuinely cannot run Docker, Testcontainers is the wrong tool there. Plan for it: developers install a runtime as part of onboarding, and CI uses an image or service that provides Docker.

## The first run is slow because of the image pull

The first time you reference `postgres:16`, Docker has to download it. That can take a noticeable while and makes a fresh checkout's first test run feel broken when it's actually still pulling. Every run after that uses the cached image and is fast.

```text
first run:  pull postgres:16 (downloads layers) ... then start  -> slow
later runs: image already cached locally ......... then start  -> fast
```

*What just happened:* the slowness was a one-time download, not the test, and once the image is cached locally subsequent runs skip straight to starting the container.

In CI, cache the Docker layers between runs (most CI providers support this) or pre-pull the images in a setup step, otherwise every pipeline pays the download tax. Pin image tags (`postgres:16`, not `postgres:latest`) so a surprise upstream change can't silently alter what your tests run against.

## Readiness, not only "started"

The bug that produces flaky tests more than any other: connecting before the service is actually ready. Docker reports the container as running the instant the process starts, but Postgres needs a moment more before it accepts connections, and a database that's mid-startup will refuse you with a connection error that looks random.

```text
container state: RUNNING   <- Docker says go
postgres state:  starting  <- not ready yet!
your test:       connect   -> "connection refused"  (flaky failure)
```

*What just happened:* the test connected during the gap between the process launching and the database being ready to serve, producing an intermittent failure that has nothing to do with your code.

The dedicated modules (`PostgresContainer`, etc.) ship with a correct wait strategy, so prefer them. With the generic container, always set an explicit wait, on a log line, on a port, or on an HTTP health check, so the library blocks until the service is truly serving.

## The leftover-container fear, and Ryuk

A reasonable worry: if my test crashes hard, do containers pile up forever? Testcontainers guards against this with a companion container, commonly called Ryuk, that watches your test session and reaps the containers it started if your process dies without cleaning up. Normal teardown still happens through the lifecycle (the `with` block, `@Container`, `t.Cleanup`); Ryuk is the safety net for the crash case.

> Some locked-down CI environments block Ryuk. You can disable it, but then you must ensure cleanup yourself, otherwise abandoned containers accumulate on the runner. Check your platform's docs before turning it off, and prefer leaving it on where allowed.

## Resource use and parallelism

Each container is a real running service eating real memory and CPU. Spin up Postgres plus Kafka plus Elasticsearch for one test and you're running three real servers at once. That's fine, until you also run the suite in high parallelism on a small CI runner and it starts swapping or getting killed for memory.

```text
1 test, 3 services:  postgres + kafka + elasticsearch  = real RAM x3
x8 parallel workers: 24 real services at once           = OOM on a small box
```

*What just happened:* parallelism multiplies real resource use because each worker starts its own real containers, so a runner that's fine serially can run out of memory under heavy parallel load.

Tune parallelism to the runner's size, give CI integration jobs a box with enough memory, and don't start heavyweight services you don't need for a given test. Keep the truly fast unit tests separate from the container-backed integration tests so the quick loop stays quick.

## For builders

A solid setup looks like this: dedicated container modules with their built-in wait strategies, the container started once per suite with data reset between tests, image tags pinned, Ryuk left on, and CI configured with Docker available plus image-layer caching. Get those right and Testcontainers fades into the background, exactly what you want from a test dependency.

```quiz
[
  {
    "q": "What happens if Testcontainers can't reach a container runtime?",
    "choices": [
      "It falls back to mocks automatically",
      "It runs the tests against an in-memory fake",
      "It fails before any test runs, because real containers need a real daemon",
      "It downloads Docker for you"
    ],
    "answer": 2,
    "explain": "Testcontainers has no fallback; without a reachable Docker-compatible runtime it errors out immediately."
  },
  {
    "q": "Why does the first test run feel slow but later runs are fast?",
    "choices": [
      "The first run compiles the image",
      "The first run pulls (downloads) the image; later runs use the cached copy",
      "Ryuk slows the first run",
      "The wait strategy only runs once"
    ],
    "answer": 1,
    "explain": "The initial image download is a one-time cost; cached images make subsequent runs fast."
  },
  {
    "q": "What is the Ryuk companion container for?",
    "choices": [
      "Speeding up image pulls",
      "Reaping leftover containers if your test process dies without cleaning up",
      "Mapping ports",
      "Replacing the database with a mock"
    ],
    "answer": 1,
    "explain": "Ryuk is the safety net that removes containers Testcontainers started if the test session crashes before normal teardown."
  }
]
```

[← Phase 2: The everyday loop](02-the-everyday-loop.md) | [Overview](_guide.md)
