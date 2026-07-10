---
title: "What Makes a Good Test"
guide: "your-first-unit-test"
phase: 3
summary: "The habits that make a test trustworthy: test one behavior, name it for what it checks, keep it fast and independent, cover the edge cases, and never trust a test that passes even when the code is wrong."
tags: [testing, unit-tests, pytest, python, edge-cases, test-quality, beginner-friendly]
difficulty: beginner
synonyms: ["what makes a good unit test", "how to name a test", "test edge cases", "independent tests", "test that passes even when code is wrong", "good testing habits"]
updated: 2026-07-10
---

# What Makes a Good Test

You can write a test and run it now. The next thing - the thing that separates tests that genuinely protect
you from tests that just sit there looking responsible - is a handful of habits, none of them hard. They're
the difference between a test suite you trust at 5pm on a Friday and one you secretly suspect is lying to you.

Let's go through them with the same `total_with_tax` function you've been using.

## Test one behavior at a time

A good test checks *one* thing. When it fails, the failure should point at a single, specific behavior - so
the red line tells you not just "something broke" but "*this* broke."

Compare these two:

```python
# Cramming several checks into one test
def test_total_with_tax():
    assert total_with_tax(100, 0.10) == 110
    assert total_with_tax(0, 0.10) == 0
    assert total_with_tax(100, 0) == 100
```

*What just happened:* this runs three different checks in one test. The problem shows up the moment one
fails: pytest stops at the *first* failing `assert` and never reaches the rest. If the middle line is
broken, you won't even hear about the third. And the failure just says `test_total_with_tax` failed -
which of the three? You have to go read the code to find out.

Split them so each behavior stands on its own:

```python
def test_adds_ten_percent_tax():
    assert total_with_tax(100, 0.10) == 110

def test_zero_price_is_zero():
    assert total_with_tax(0, 0.10) == 0

def test_zero_tax_rate_returns_price_unchanged():
    assert total_with_tax(100, 0) == 100
```

*What just happened:* now each behavior is its own test. If the zero-tax case breaks, pytest tells you
`test_zero_tax_rate_returns_price_unchanged` failed by name, and the other two still run and still report.
One red line, one precise meaning.

## Name the test for what it checks

The name is documentation that can't go stale, because it runs. When a test fails six months from now, the
name in the output is the first thing you read - make it a sentence about the behavior, not a label.

```text
   test_1                                    ← tells you nothing
   test_total_with_tax                       ← which behavior?
   test_zero_tax_rate_returns_price_unchanged ← you know exactly what broke
```

💡 **Key point.** Read the test name out loud. If it doesn't describe a behavior - "returns price
unchanged when the tax rate is zero" - rename it. Future-you, staring at a red failure, will be grateful.

## Keep tests fast and independent

Two qualities you want in every unit test:

- **Fast.** A unit test should run in a blink. The pytest runs in Phase 2 finished in hundredths of a
  second, and that's the point - when the whole suite runs in a second or two, you run it constantly, after
  every small change. A slow suite is one you stop running, and a suite you don't run can't protect you.
- **Independent.** Each test must pass or fail entirely on its own, no matter what ran before it. Tests
  shouldn't share state or depend on running in a particular order.

⚠️ **Gotcha: the order-dependent test.** If one test quietly leaves something behind - a changed global
variable, a file on disk, a row in a database - and another test depends on that leftover, your tests pass
*together* but fail when run alone or in a different order. pytest can even run tests in a different order
between machines. The fix: each test arranges its *own* inputs from scratch (that's why "Arrange" is step
one) and cleans up after itself. If two tests can't run in either order and both pass, one of them is lying.

## Cover the edge cases

The happy path - `total_with_tax(100, 0.10) == 110` - is the easy case, and the one least likely to be
broken. The bugs hide at the edges. When you've written the obvious test, ask: *what are the weird inputs?*

For our function, the edges worth a test each:

- **Zero** - `total_with_tax(0, 0.10)` should be `0`. (A free item stays free.)
- **Zero rate** - `total_with_tax(100, 0)` should be `100`. (No tax means no change.)
- **Negative** - what *should* a refund of `-100` do? Decide the behavior, then pin it with a test.

```python
def test_negative_price_keeps_the_sign():
    # A refund of 100 at 10% tax should refund 110, not 90.
    assert total_with_tax(-100, 0.10) == -110
```

```console
$ pytest
========================= test session starts =========================
collected 4 items

test_tax.py ....                                                 [100%]

========================== 4 passed in 0.02s ==========================
```

*What just happened:* four green dots, one per test - the happy path plus three edge cases, each pinning
down one behavior. If a future change accidentally mishandles a refund, this suite catches it. Each edge
case you write is a future bug you've already fenced off.

📝 **Terminology.** An **edge case** is an input at the boundary of what the code handles - zero, empty,
negative, the largest allowed value, the unexpected-but-legal. Edge cases are where bugs live, because
they're the cases people forget while writing the original code.

## The test that passes even when the code is wrong

This is the most dangerous test there is, and it's worth naming so you can spot it. A test can be green for
the wrong reason - it *looks* like protection but checks nothing real.

```python
def test_total_with_tax():
    result = total_with_tax(100, 0.10)
    # Oops - no assert. This test can never fail.
```

*What just happened:* this test calls the function, gets a result, and then... never checks it. There's no
`assert`. It will pass forever - even if `total_with_tax` returns garbage, even if you break the code the
way you did in Phase 2 - because passing only requires that the function doesn't crash. It gives you a
green dot and zero protection.

⚠️ **Gotcha.** This is exactly why Phase 2 made you *break the code and watch the test go red*. A test you
have never seen fail might be a test that *can't* fail. The cure is the same habit: when you write a test,
make the code wrong once and confirm the test catches it. If it stays green while the code is broken, the
test is the thing that's broken.

## Recap

1. **One behavior per test** - so a failure names exactly what broke, and one bad line doesn't hide the rest.
2. **Name it for the behavior** - the name is documentation you read first when it fails.
3. **Fast and independent** - quick enough to run constantly; passes or fails alone, in any order.
4. **Cover the edges** - zero, empty, negative, boundaries; that's where bugs hide.
5. **Never trust a test you haven't watched fail** - a test with no real assertion is worse than none.

You now have the full beginner's toolkit: the shape of a test, how to run it, how to read both outcomes,
and the habits that keep your tests honest. From here, the next question is *which kinds* of tests to write
and where they fit - unit tests are the smallest of several layers.

> Ready for the bigger picture? [Unit, Integration, E2E](/guides/unit-integration-e2e) explains how unit
> tests fit alongside the larger tests that check whole systems - and when to reach for each.

**Related:** [Why Test At All?](/guides/why-test-at-all) · [Unit, Integration, E2E](/guides/unit-integration-e2e) · [Mocking and Test Doubles](/guides/mocking-and-test-doubles)

---

[← Phase 2: Write It and Run It](02-write-it-and-run-it.md) · [Guide overview](_guide.md)
