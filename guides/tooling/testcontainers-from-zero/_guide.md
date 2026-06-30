---
title: "Testcontainers, From Zero"
guide: testcontainers-from-zero
phase: 0
summary: "Integration tests against the real thing: spin up a throwaway Postgres, Kafka, or Redis in Docker for each test run, then tear it down automatically."
tags: [testing, docker, integration-tests, postgres, kafka, redis]
category: tooling
group: "Testing Tools"
order: 40
difficulty: intermediate
synonyms: [testcontainers, integration test database, docker test database, throwaway postgres test, real dependencies in tests, testcontainers java, testcontainers python, testcontainers go]
updated: 2026-06-30
---

# Testcontainers, From Zero

You wrote a beautiful mock of your database, every test is green, and then production falls over on a query the mock happily accepted. The mock told you what you wanted to hear. Testcontainers fixes that by booting a real Postgres, a real Redis, a real Kafka in a throwaway Docker container for the duration of your test run, then deleting it the moment you're done. Your tests talk to the actual engine, not your guess about how it behaves. No shared staging database to fight over, no leftover state between runs.

## How to read this

Read the three phases in order. Phase 1 builds the mental model: why mocks lie and what a "throwaway container" really is. Phase 2 is the everyday loop: start a container, get its real port, point your code at it, clean up. Phase 3 is where it gets real: the Docker requirement, slow first runs, port collisions, and CI. Type the commands as you go; the muscle memory matters more than the prose.

## The phases

1. [Why mocks lie and what a container gives you](01-why-mocks-lie.md)
2. [The everyday loop: start, connect, tear down](02-the-everyday-loop.md)
3. [Production reality: Docker, speed, and CI](03-production-reality.md)

[Phase 1: Why mocks lie and what a container gives you](01-why-mocks-lie.md) →
