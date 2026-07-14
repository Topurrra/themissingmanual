---
title: "BDD: Describing Behavior"
guide: "tdd-and-bdd-honestly"
phase: 2
summary: "Behavior-driven development frames tests as readable behavior using Given/When/Then language, so non-developers can understand and even help write them - a collaboration and vocabulary layer that sits on top of the TDD loop."
tags: [bdd, behavior-driven-development, given-when-then, gherkin, testing]
difficulty: intermediate
synonyms: ["what is bdd", "given when then explained", "bdd vs tdd", "how does bdd relate to tdd", "gherkin example", "writing tests stakeholders can read"]
updated: 2026-07-10
---

# BDD: Describing Behavior

You've watched a beautifully tested feature ship and still be *wrong* - it did exactly what the tests said,
and the tests said the wrong thing because nobody checked them against what the business actually wanted.
That gap is the problem behavior-driven development was invented to close.

BDD doesn't replace the red-green-refactor loop from [Phase 1](01-red-green-refactor.md). It wraps a layer
of *language* around it - a way of writing tests that reads like a sentence about what the software should
do, plain enough that a product manager, a designer, or a support lead can read it, nod, and say "yes,
that's the behavior we want" (or "no, that's not it"). Catch the misunderstanding in a readable test, and
you never write the wrong code at all.

## The mental model: tests as readable behavior

**What it actually is.** BDD reframes "a test" as "an example of how the system should behave," written in a
structured, near-English format. The format almost everyone uses is **Given / When / Then**:

```text
  GIVEN   the starting situation   ── the context, the setup
  WHEN    an action happens        ── the thing the user or system does
  THEN    an outcome is observed   ── what should be true afterward
```

That's it. Every behavior gets described as: *given* some context, *when* something happens, *then* expect
some result. It maps cleanly onto how people already describe what they want ("when a user with an empty
cart hits checkout, they should see a message, not a crash").

**Why people get this wrong.** BDD is often mistaken for "a testing framework" or "Cucumber" (a popular
tool). The tool is not the point. BDD is a *practice*: describe behavior in shared language first, so the
whole team agrees on what "done" means before anyone argues about code. The Given/When/Then format is the
vocabulary that makes that conversation possible.

📝 **Terminology.** **Gherkin** is the name of the plain-text Given/When/Then syntax used by tools like
Cucumber and Behave. A **scenario** is one concrete Given/When/Then example. A **feature** is a group of
related scenarios. You'll hear all three; they're just the nouns of this format.

## A small Given/When/Then example

Let's describe a behavior for a shopping cart: applying a discount code. First, the human-readable scenario,
written in Gherkin. This is the part a non-developer can read and sign off on:

```text
Feature: Discount codes

  Scenario: A valid code reduces the total
    Given a cart with one item priced at $50.00
    When the customer applies the code "SAVE10"
    Then the cart total should be $45.00
```
*What just happened:* You wrote an executable specification in language anyone on the team can understand. No
mention of functions, classes, or assertions - just the behavior. A stakeholder reads this and confirms the
*business rule* ("SAVE10 takes 10% off") is captured correctly, before a line of logic exists.

Underneath, each `Given`/`When`/`Then` line is wired to real code - the **step definitions** - that drives
the actual system. With Python's `behave`, that looks like:

```console
$ cat features/steps/discount_steps.py
from behave import given, when, then
from cart import Cart

@given('a cart with one item priced at ${price:f}')
def step_cart_with_item(context, price):
    context.cart = Cart()
    context.cart.add_item(price=price)

@when('the customer applies the code "{code}"')
def step_apply_code(context, code):
    context.cart.apply_code(code)

@then('the cart total should be ${expected:f}')
def step_check_total(context, expected):
    assert context.cart.total() == expected
```
*What just happened:* Each plain-English line now maps to a small Python function. The `{price:f}` and
`{code}` placeholders pull the values straight out of the sentence, so one step definition serves many
scenarios. The `@then` step is where the real check lives - it's an ordinary assertion, the same kind you'd
write in a plain unit test.

Now run it:

```console
$ behave
Feature: Discount codes

  Scenario: A valid code reduces the total
    Given a cart with one item priced at $50.00   ... passed
    When the customer applies the code "SAVE10"    ... passed
    Then the cart total should be $45.00           ... passed

1 feature passed, 1 scenario passed, 3 steps passed
```
*What just happened:* The runner read the English scenario, executed each step through your step definitions
against the real `Cart`, and reported pass/fail *per line*. The output reads like the specification because
it *is* the specification - that's the whole trick. When this fails, it tells you which sentence of the
agreed behavior broke.

## How BDD relates to TDD

This is the connection that makes it click: **BDD is the same red-green-refactor loop, pitched at the level
of behavior instead of functions.**

```text
  TDD                                  BDD
  ───                                  ───
  unit-level                           behavior-level
  "format_price returns '$4.05'"       "applying SAVE10 makes the total $45.00"
  written by & for developers          readable by the whole team
  test()  assert x == y                Given / When / Then

         └──────────  same loop: write it failing, make it pass, clean up  ──────────┘
```

You still write the scenario first and watch it fail (red), make it pass (green), and refactor underneath.
In practice, teams often use both at once: a BDD scenario describes the outer behavior the business cares
about, and TDD drives the small units inside that make it work. BDD is the outside-in framing; TDD is the
inside-out construction.

⚠️ **Gotcha - the plain English is a feature *and* a cost.** Those readable scenarios have to be maintained
like any code, plus the layer of step definitions that connects them. If nobody outside the dev team ever
reads them, you're paying for a translation layer that translates to an audience of no one. That trade-off
is exactly what [Phase 3](03-when-they-help.md) is about.

## Why this saves you later

The expensive bugs usually aren't "the code did the wrong thing." They're "the code did exactly what we
asked, and what we asked was wrong." BDD pulls the requirements conversation forward into a shared, concrete
artifact - *before* code is written - so the misunderstanding surfaces in a fifteen-minute scenario review
instead of in production three weeks later. The scenarios also double as living documentation that never
drifts out of date, because the build fails the moment they stop being true.

## Recap

1. **BDD describes tests as behavior** in structured, near-English **Given/When/Then** language.
2. The point is **shared understanding** - stakeholders can read and confirm scenarios before code exists.
3. **Gherkin** is the syntax; **scenarios** and **features** are the units; **step definitions** wire the English to real code.
4. **BDD sits on top of TDD** - same red-green-refactor loop, aimed at behavior rather than individual functions.
5. The readable layer is a **real cost** - worth it when someone outside the dev team actually reads it.

You now know what both techniques are and how they fit together. The last and most important phase is the
plain-spoken one: deciding *when* to actually use them.

---

[← Phase 1: TDD - Red, Green, Refactor](01-red-green-refactor.md) · [Guide overview](_guide.md) · [Phase 3: Straight Talk - When They Help, When They Don't →](03-when-they-help.md)
