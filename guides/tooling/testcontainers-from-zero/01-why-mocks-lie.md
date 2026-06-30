---
title: "Why mocks lie and what a container gives you"
guide: testcontainers-from-zero
phase: 1
summary: "Integration tests against the real thing: spin up a throwaway Postgres, Kafka, or Redis in Docker for each test run, then tear it down automatically."
tags: [testing, docker, integration-tests, postgres, kafka, redis]
difficulty: intermediate
synonyms: [testcontainers, integration test database, docker test database, throwaway postgres test, real dependencies in tests, testcontainers java, testcontainers python, testcontainers go]
updated: 2026-06-30
---

# Why mocks lie and what a container gives you

Here's the moment that sends most people looking for Testcontainers. You have a function that runs a SQL query. You don't want your unit test to need a database, so you mock the database client: when the code calls `query()`, the mock returns a hand-written row. Green checkmark. Ship it. Then a real query hits a real Postgres and dies on a `JSON` cast, a unique-constraint violation, a timezone the mock never modeled, or a migration that didn't run. The mock didn't test your SQL. It tested your *belief* about your SQL.

That gap has a name, and it's the whole reason this tool exists.

## A mock is a recording of your assumptions

When you mock a dependency, you write down what you think it will do. The mock then plays that recording back, flawlessly, forever. That's genuinely useful for the layers you own and want to isolate. But your database is not your assumption. Postgres has its own type system, its own constraint engine, its own SQL dialect, its own quirks about ordering and nulls. Redis has its own eviction and expiry semantics. Kafka has partitions and offsets and consumer-group rebalancing. None of that lives in your mock unless you re-implement it, badly, by hand.

```text
What you mocked:          What Postgres actually does:
  query() -> [{"id":1}]     - enforces the UNIQUE index
                            - rejects the bad ENUM value
                            - applies the timezone
                            - runs your real migration DDL
```

*What just happened:* the mock returns a clean row and never exercises the engine's rules, so any bug that lives in those rules sails straight past your test suite and into production.

The deeper you go into integration territory, the more this matters. For where mocks legitimately belong versus where you need the real thing, see /guides/unit-integration-e2e.

## What a "throwaway container" actually is

A container is a real running copy of the software, isolated from your machine, started from a published image. `postgres:16` is a complete, real Postgres server. When Testcontainers runs, it asks Docker to start that image, waits until the database is genuinely ready to accept connections, hands your test the connection details, runs your tests, and then destroys the container. Throwaway is the key word: the container exists only for the test run. Next run gets a brand-new one with zero leftover state.

```text
test run starts
   |
   v
docker pulls postgres:16 (first time only) -> starts container
   |
   v
Testcontainers WAITS until the DB accepts connections
   |
   v
your tests run against the REAL Postgres
   |
   v
container is stopped and DELETED  (state gone)
```

*What just happened:* you got a real database for the lifetime of one test run and nothing to clean up afterward, because the container and everything in it is discarded.

This is the mental shift. You are not faking the dependency and you are not borrowing a long-lived shared one. You are renting a real, private, disposable copy for a few seconds.

## Why not a shared staging database?

The other common move is to point integration tests at one shared test database that lives on a server somewhere. It works until two people run tests at once and stomp on each other's rows, or someone leaves the schema in a half-migrated state, or a test fails and leaves garbage data that breaks the *next* test. Shared mutable state plus concurrency is the classic recipe for flaky tests, and flaky tests are worse than no tests because they teach the team to ignore red.

A throwaway container sidesteps the whole problem. Every run is isolated. Two developers, or twenty CI jobs, can run simultaneously, each with its own private container that nobody else can see or corrupt.

> The one real cost: Testcontainers needs a working Docker (or compatible) runtime on whatever machine runs the tests. That's the trade. We confront it head-on in Phase 3, because it's the single thing that surprises people most.

## For builders

The pattern is language-agnostic. There are official Testcontainers libraries for Java, Go, Python, .NET, Node.js, Rust, and more, and they all share the same shape: declare a container, start it, read back the connection details, use them, let it clean up. Learn the model once and it transfers. The image names (`postgres:16`, `redis:7`, `confluentinc/cp-kafka`) are the same images you'd run anywhere else, so what your tests exercise is exactly what runs in production.

```quiz
[
  {
    "q": "Why does a mocked database let real bugs through?",
    "choices": [
      "Mocks are too slow to catch them",
      "A mock replays your assumptions and never runs the real engine's rules",
      "Mocks always return null",
      "Docker isn't involved"
    ],
    "answer": 1,
    "explain": "A mock plays back what you told it to; it doesn't enforce constraints, types, or dialect the way the real engine does."
  },
  {
    "q": "What does 'throwaway' mean for a Testcontainers container?",
    "choices": [
      "It runs forever in the background",
      "It is shared across the whole team",
      "It exists only for the test run and is deleted afterward, with no leftover state",
      "It only holds mocked data"
    ],
    "answer": 2,
    "explain": "The container is created for the run and destroyed after, so each run starts from a clean, isolated state."
  },
  {
    "q": "What is the main downside of a single shared staging database for integration tests?",
    "choices": [
      "It is too realistic",
      "Concurrent runs corrupt each other's state, causing flaky tests",
      "It cannot run migrations",
      "It is incompatible with Docker"
    ],
    "answer": 1,
    "explain": "Shared mutable state plus concurrent test runs produces leftover data and collisions, which makes tests flaky."
  }
]
```

← [Overview](_guide.md) | [Phase 2: The everyday loop →](02-the-everyday-loop.md)
