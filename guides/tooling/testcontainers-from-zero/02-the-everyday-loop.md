---
title: "Testcontainers, From Zero"
guide: testcontainers-from-zero
phase: 2
summary: "Integration tests against the real thing: spin up a throwaway Postgres, Kafka, or Redis in Docker for each test run, then tear it down automatically."
tags: [testing, docker, integration-tests, postgres, kafka, redis]
difficulty: intermediate
synonyms: [testcontainers, integration test database, docker test database, throwaway postgres test, real dependencies in tests, testcontainers java, testcontainers python, testcontainers go]
updated: 2026-06-30
---

# The everyday loop: start, connect, tear down

Once the mental model clicks, the day-to-day is a tight loop you'll repeat for every integration test file: declare a container, start it, ask it for the connection details, point your code at those details, and let the library tear it down. The single thing beginners get wrong is hardcoding a port. Let's kill that habit first, because it's the heart of how Testcontainers works.

## The dynamic port is the whole trick

Postgres listens on 5432 *inside* the container. But Testcontainers does not publish it on your host's 5432. It maps the container's 5432 to a random free port on your machine, something like 49173, different on every run. This is deliberate: it's why you can run ten containers at once without collisions and why CI never trips over a port that's already taken. You never hardcode the port. You ask the container what port it got.

```python
from testcontainers.postgres import PostgresContainer

with PostgresContainer("postgres:16") as pg:
    url = pg.get_connection_url()
    print(url)
    # postgresql+psycopg2://test:test@localhost:49173/test
```

*What just happened:* the container started, mapped Postgres's internal 5432 to a random host port, and `get_connection_url()` handed back the full address including that port, so your code connects to the right place without you ever naming a number.

The shape is identical across languages. In Java you call `container.getJdbcUrl()`; in Go you call `container.ConnectionString(ctx)`; in Node you read `container.getMappedPort(5432)`. Same idea every time: the library knows the real port, so you ask it.

> Hardcoding `localhost:5432` is the number-one Testcontainers mistake. It accidentally works on your laptop if you happen to have a local Postgres on 5432, then fails everywhere else, or worse, your test silently talks to your real local database. Always read the mapped port.

## The full loop, start to finish

Here's a complete, realistic test in Python so you can see every step. The `with` block is doing the lifecycle work: start on enter, stop and delete on exit, even if the test throws.

```python
import psycopg2
from testcontainers.postgres import PostgresContainer

def test_user_is_persisted():
    with PostgresContainer("postgres:16") as pg:
        conn = psycopg2.connect(pg.get_connection_url().replace("+psycopg2", ""))
        cur = conn.cursor()

        # run your real schema, not a mock
        cur.execute("CREATE TABLE users (id SERIAL PRIMARY KEY, email TEXT UNIQUE)")
        cur.execute("INSERT INTO users (email) VALUES ('a@b.com')")
        conn.commit()

        cur.execute("SELECT email FROM users WHERE id = 1")
        assert cur.fetchone()[0] == "a@b.com"
```

*What just happened:* a real Postgres started, you created a real table with a real `UNIQUE` constraint, inserted and read back a real row, and when the `with` block ended the container was destroyed, leaving nothing behind.

Notice what this test would now catch that a mock wouldn't: insert two rows with the same email and Postgres rejects the second one for real. That's the constraint actually firing, not your imagination of it.

## Start the container once per suite, not per test

Booting a container takes a second or two. If you start a fresh one for every single test, your suite crawls. The standard move is to start the container once for the whole test file (or session), and reset *data* between tests instead of restarting the *container*. Reset is cheap; restart is not.

```text
SLOW (don't):                  FAST (do):
test_a -> start container       start container ONCE
test_a -> stop                    test_a -> TRUNCATE tables
test_b -> start container         test_b -> TRUNCATE tables
test_b -> stop                    test_c -> TRUNCATE tables
test_c -> start container       stop container ONCE
...
```

*What just happened:* the fast version pays the startup cost a single time and clears data with a quick `TRUNCATE` between tests, so the suite stays fast while every test still starts from a clean slate.

In pytest you'd put the container in a session- or module-scoped fixture; in JUnit you'd mark the container `static` with `@Container`; in Go you start it in `TestMain`. Same goal: one slow startup, many fast tests.

## Containers other than databases

The same loop works for anything with a Docker image. Redis, Kafka, RabbitMQ, Elasticsearch, even a real HTTP service, all follow declare-start-read-port-teardown. When there's no dedicated module for your image, there's a generic container you point at any image and tell which port to wait for.

```python
from testcontainers.core.container import DockerContainer
from testcontainers.core.waiting_utils import wait_for_logs

with DockerContainer("redis:7").with_exposed_ports(6379) as redis:
    wait_for_logs(redis, "Ready to accept connections")
    host = redis.get_container_host_ip()
    port = redis.get_exposed_port(6379)
    print(host, port)  # 127.0.0.1 49201
```

*What just happened:* a generic Redis container started, you waited until its log said it was ready (so you don't connect too early), and then read the mapped host and port to connect, the same pattern as the Postgres module but spelled out by hand.

That `wait_for_logs` line is important: a container being *started* is not the same as the service inside it being *ready*. The dedicated modules bake in a sensible wait strategy for you; with the generic container you specify your own. More on readiness traps in Phase 3.

## In the wild

Most teams split fast unit tests from slower Testcontainers-backed integration tests so the quick feedback loop stays quick, then run both in CI. For how those layers fit together in a pipeline, see /guides/testing-in-ci.

```quiz
[
  {
    "q": "Why should you never hardcode localhost:5432 in a Testcontainers test?",
    "choices": [
      "Postgres doesn't use 5432",
      "The container maps the internal port to a random host port, so you must read the mapped port",
      "Docker blocks port 5432",
      "It's slower than a random port"
    ],
    "answer": 1,
    "explain": "Testcontainers maps the container port to a random free host port to avoid collisions; you ask the container for the actual port."
  },
  {
    "q": "What's the recommended way to keep a Testcontainers suite fast?",
    "choices": [
      "Start a fresh container for every test",
      "Mock the container",
      "Start the container once per suite and reset data (e.g. TRUNCATE) between tests",
      "Disable the wait strategy"
    ],
    "answer": 2,
    "explain": "Container startup is the slow part; start once and clear data between tests so each test is still isolated but the suite stays fast."
  },
  {
    "q": "When using the generic container for an image without a dedicated module, what extra step matters most?",
    "choices": [
      "Hardcoding the port",
      "Specifying a wait strategy so you connect only after the service is actually ready",
      "Disabling Docker",
      "Running it as root"
    ],
    "answer": 1,
    "explain": "A started container isn't necessarily a ready service; the generic container needs you to define when it's ready (e.g. wait_for_logs)."
  }
]
```

[← Phase 1: Why mocks lie](01-why-mocks-lie.md) | [Overview](_guide.md) | [Phase 3: Production reality →](03-production-reality.md)
