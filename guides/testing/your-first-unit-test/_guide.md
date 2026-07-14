---
title: "Your First Unit Test"
guide: "your-first-unit-test"
phase: 0
summary: "Write and run a real unit test from scratch: learn the Arrange-Act-Assert shape, watch a test pass green and fail red, and pick up the habits that make a test worth keeping."
tags: [testing, unit-tests, pytest, python, beginner-friendly, arrange-act-assert]
category: testing
order: 2
difficulty: beginner
synonyms: ["how to write a unit test", "my first unit test", "how to use pytest", "what is arrange act assert", "how to run a test in python", "writing tests for beginners"]
updated: 2026-06-19
---

# Your First Unit Test

You've heard you "should write tests." Maybe you've opened a project full of `test_` files and felt
that quiet dread - everyone seems to know how this works except you. Here's the secret nobody tells you:
a unit test is one of the smallest, simplest pieces of code you'll ever write. It's a little function
that calls *your* function and checks the answer. That's the whole idea.

In this guide you'll write a real test, run it with a real test runner, watch it pass, then break your
code on purpose to watch it fail - because a test you've never seen fail is a test you can't trust. By
the end you'll have done the full loop yourself, and the dread will be gone.

We'll use **Python** with **pytest** because it's the gentlest place to start: the tests read almost like
plain English, and you check results with the ordinary `assert` keyword. The *shape* you'll learn is the
same in every language and every test framework - only the spelling changes.

## How to read this
- **Want it to finally make sense?** Read in order - each phase builds on the last, and you'll be typing
  along in your own terminal.
- **Already know the shape and just want to run one?** Jump to [Phase 2: Write It and Run It](02-write-it-and-run-it.md).

## The phases
1. **[Arrange, Act, Assert](01-arrange-act-assert.md)** - the universal shape every test takes: set up
   the inputs, call your code, check the result. We'll map out a tiny function and its test on paper first.
2. **[Write It and Run It](02-write-it-and-run-it.md)** - actually do it: create the test file, run
   pytest, read a green pass, then break the code on purpose and read the red failure (expected vs. actual).
3. **[What Makes a Good Test](03-what-makes-a-good-test.md)** - the habits that separate a test you trust
   from one that lies to you: one behavior per test, a clear name, speed and independence, and the edge
   cases that catch real bugs.

> This guide gets you writing tests for plain functions. Mocking, fixtures, and testing code that talks to
> databases or the network are their own skills - see the [related guides](#) below when you're ready.

**Related:** [Why Test At All?](/guides/why-test-at-all) · [Unit, Integration, E2E](/guides/unit-integration-e2e) · [Mocking and Test Doubles](/guides/mocking-and-test-doubles)
