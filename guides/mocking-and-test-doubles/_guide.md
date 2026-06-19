---
title: "Mocking, Stubbing & Test Doubles"
guide: "mocking-and-test-doubles"
phase: 0
summary: "What test doubles actually are, the difference between a dummy, stub, fake, spy, and mock, and the judgment call of when to fake a dependency versus use the real thing."
tags: [testing, mocking, stubbing, test-doubles, unit-tests, fakes, spies]
category: testing
difficulty: intermediate
order: 4
synonyms: ["what is mocking in testing", "difference between mock and stub", "what is a test double", "when should I use a mock", "stub vs fake vs mock", "should I mock the database", "over-mocking tests"]
updated: 2026-06-19
---

# Mocking, Stubbing & Test Doubles

You wrote a function. It does one small, sensible thing. But to *run* it in a test, it insists on calling
a payment API, or reading from a database, or checking what time it is. Suddenly your tiny unit test needs
a network connection, a live database, and a credit card. The thing you actually want to test is buried
under a pile of dependencies you don't control.

This guide is about the escape hatch: **test doubles** — stand-ins you swap in for the awkward, slow, or
expensive parts so you can test *your* logic in isolation. You'll learn what each kind of double actually
is (the words "mock," "stub," and "fake" get thrown around interchangeably, and we'll untangle that), and
the harder part — knowing when faking *helps* and when it quietly *hurts*.

## How to read this

- **Just need to know mock vs stub vs fake right now?** Jump to [Phase 2: The Doubles, Defined Honestly](02-the-doubles-defined-honestly.md) — it's a labeled tour of the whole family.
- **Want it to finally make sense?** Read in order. Phase 1 builds the mental model (why we fake anything at all), Phase 2 names the tools, and Phase 3 gives you the judgment to use them well.

## The phases

1. **[Why Fake Anything?](01-why-fake-anything.md)** — the core problem: your code talks to slow, unreliable, or expensive things, and to test your own logic you replace them with stand-ins. The stunt-double mental model.
2. **[The Doubles, Defined Honestly](02-the-doubles-defined-honestly.md)** — the family with the confusion cleared up: dummy, stub, fake, spy, and mock. What each one is *for*, with a small example each.
3. **[When Mocking Helps vs Hurts](03-when-mocking-helps-vs-hurts.md)** — the judgment call: mock at the boundaries, not your own internals; the over-mocking trap (green tests over a broken product); when a real object or a fake beats a mock.

> Test-double *libraries* (Jest's `jest.fn()`, Python's `unittest.mock`, Mockito, Sinon) all have their
> own syntax, and we won't try to be a reference for any one of them. This guide teaches the concepts that
> sit underneath every one of them — once you understand those, the library docs read easily.
