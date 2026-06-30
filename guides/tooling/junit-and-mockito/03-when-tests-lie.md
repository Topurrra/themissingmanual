---
title: "When tests lie"
guide: junit-and-mockito
phase: 3
summary: "The Java testing duo: JUnit 5 for structuring and running tests with assertions and lifecycle, and Mockito for mocking the collaborators you want to isolate."
tags: [junit, mockito, java, testing, unit-tests, mocking, jupiter]
difficulty: intermediate
synonyms: ["junit 5 tutorial", "mockito mock example", "java unit testing", "junit jupiter", "when thenReturn mockito", "verify mockito", "beforeeach junit", "parameterized test junit"]
updated: 2026-06-30
---

# When tests lie

Here's the uncomfortable truth about a green test suite: passing tests prove your *tests* pass, not that your *code is correct*. Mockito makes this especially easy to get wrong, because a mock does exactly what you told it to — including agreeing with bugs. This phase is the set of failure modes that turn a test suite from a safety net into a wall of false confidence, and how to spot them before they cost you a production incident.

## The mock-too-much trap

This is the big one. When you mock every collaborator, your test stops describing reality and starts describing your *assumptions* about reality. If your assumption is wrong, the mock is wrong, and the test passes anyway.

```java
@Test
void calculatesDiscount() {
    // mocking the thing we're supposedly testing the math of
    when(pricingRules.discountFor(customer)).thenReturn(0.20);

    BigDecimal total = checkout.total(customer, items);

    verify(pricingRules).discountFor(customer);
    // ...but did the discount actually get APPLIED to the total? Untested.
}
```

*What just happened:* this test stubs the discount, then verifies the stub was *called* — but it never checks that the discount changed the total. If `checkout.total` fetches the discount and then ignores it, this test stays green while the customer gets charged full price. The mock answered the phone; nobody checked what was done with the answer. The fix is to assert on the real output (`assertEquals(new BigDecimal("80.00"), total)`), not on the fact that a collaborator was consulted.

The deeper rule: **don't mock the thing you're testing, and don't mock value objects you could build yourself.** If `pricingRules` is simple enough to instantiate with real data, use the real one. Mock the things that are slow, non-deterministic, or have side effects — the database, the clock, the payment gateway — not the things that are pure logic.

## Brittle verification: testing how, not what

Over-verification couples your test to the *implementation* instead of the *behavior*. Then a harmless refactor — same result, different internal calls — turns your suite red for no real reason.

```java
// brittle: asserts the exact sequence of internal calls
InOrder order = inOrder(cache, repository);
order.verify(cache).get("user:1");
order.verify(repository).findById(1L);
order.verify(cache).put("user:1", user);
```

*What just happened:* this locks in three calls in a specific order. The moment someone reorders the cache write, adds a metrics call, or swaps the caching strategy, this test fails — even though `getUser(1)` still returns the right user. The test is now an obstacle to good changes. Unless the *ordering itself is the contract* (rare, but real for things like "lock before write"), verify the outcome and skip the choreography.

A test that breaks every time you refactor working code isn't protecting you — it's taxing you. The signal of a healthy mock-based test: you can rewrite the method's internals freely, and as long as the behavior is unchanged, the test stays green.

## NullPointerException from an unstubbed mock

A mock returns "empty" defaults for anything you didn't stub — `null` for objects, `false` for booleans, `0` for numbers. That `null` is a landmine.

```java
@Test
void greetsUser() {
    // forgot to stub findById, so it returns Optional... no, plain null
    User user = userService.load(1L);   // NPE inside load()
    assertEquals("Alice", user.name());
}
```

*What just happened:* `findById` was never stubbed, so the mock returned `null`, and `load` exploded trying to use it. The error points *inside your production code*, so it looks like a bug there — but the real cause is a missing stub in the test. When a mock-based test throws an unexpected NPE, your first suspect should be an un-stubbed collaborator returning `null`, not a flaw in the code under test.

## Static, time, and the things mocks can't reach cleanly

Plenty of code reaches for `LocalDateTime.now()`, `Math.random()`, or a static factory deep in a method. Mockito can mock statics now (`mockStatic`), but reaching for it is often a smell — it usually means the dependency wasn't injected and should have been.

```java
// hard to test: time is grabbed internally
public boolean isExpired() {
    return expiry.isBefore(LocalDateTime.now());   // now() is uncontrollable
}

// testable: time comes in as a Clock you can fix in a test
public boolean isExpired(Clock clock) {
    return expiry.isBefore(LocalDateTime.now(clock));
}
```

*What just happened:* the first version bakes "now" into the method, so a test can't pin time down and can't reliably check the boundary. The second takes a `Clock`, and a test passes `Clock.fixed(...)` to make "now" deterministic. The lesson generalizes: when something is painful to test, the design — not the test tool — is usually telling you to inject the dependency instead of grabbing it.

> **In the wild:** the most valuable thing a mature team does is keep a few **un-mocked** tests that wire real objects together and only fake the true edges (DB, network, clock). Heavily-mocked unit tests verify each part in isolation; a handful of integration tests catch the wiring bugs that mocks define away. You want both, weighted toward the cheap unit tests but never zero of the integration ones.

## A quick gut-check before you commit a test

- Does it assert on a real **output**, or only that a collaborator was *called*?
- Would it survive a refactor that keeps behavior identical?
- Are you mocking slow/external things, or also mocking plain logic you could run for real?
- If it passes, would a genuine bug in this method make it fail? (If not, it's decoration.)

```quiz
[
  {
    "q": "What is the core danger of the 'mock too much' trap?",
    "choices": ["Mocks make tests run slower", "Tests verify that collaborators were called but never that the real output is correct, so bugs pass", "Mockito can't create more than three mocks per test", "Mocks always throw NullPointerException"],
    "answer": 1,
    "explain": "When you stub a value and only verify the stub was consulted, you never check the actual result. The code can ignore the value and the test still passes."
  },
  {
    "q": "A test throws an unexpected NullPointerException inside the production method. What should you suspect first in a mock-heavy test?",
    "choices": ["A bug in JUnit's runner", "An un-stubbed mock returning null by default", "The @Test annotation is missing", "assertEquals arguments are reversed"],
    "answer": 1,
    "explain": "Unstubbed mock methods return defaults — null for objects. The NPE surfaces in production code but is caused by the missing stub."
  },
  {
    "q": "Why is asserting an exact ordered sequence of internal calls usually a bad idea?",
    "choices": ["InOrder is deprecated in Mockito", "It couples the test to implementation, so a behavior-preserving refactor breaks it", "Ordered verification is slower than unordered", "You can only verify one call at a time"],
    "answer": 1,
    "explain": "Locking in the call sequence tests HOW the method works, not WHAT it does. A refactor with identical results turns the suite red for no real reason — unless the order itself is the contract."
  }
]
```

[← Phase 2](02-mocking-with-mockito.md) | [Overview](_guide.md)
