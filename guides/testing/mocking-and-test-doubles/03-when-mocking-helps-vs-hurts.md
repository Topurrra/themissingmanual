---
title: "When Mocking Helps vs Hurts"
guide: "mocking-and-test-doubles"
phase: 3
summary: "Mock at the boundaries (external systems), not your own internals; avoid the over-mocking trap of green tests over a broken product; prefer real objects or fakes when they're cheap."
tags: [testing, mocking, over-mocking, test-design, integration-tests, boundaries]
difficulty: intermediate
synonyms: ["when should I mock", "over-mocking problem", "tests pass but app broken", "should I mock my own code", "mock at the boundary", "mocking makes tests brittle", "stop mocking everything"]
updated: 2026-07-10
---

# When Mocking Helps vs Hurts

Here's the uncomfortable truth nobody tells you when they hand you a mocking library: **a test full of mocks
can pass while your product is on fire.** Doubles let you replace reality, and the more of reality you
replace, the less your test is actually checking. Used at the right seam, doubles are essential. Used
everywhere, they produce a suite that's green, fast, and worthless.

This phase is the judgment - and it comes down to one question and a couple of habits.

## The one question: is this the boundary, or my own code?

Picture your application as a region with a border. Inside the border is **code you own** - your functions
calling your other functions, your objects, your business logic. At the border are the **external systems**
you don't own - the database, third-party APIs, the network, the file system, the clock, the payment
provider.

```text
        ┌─────────────── your application ───────────────┐
        │                                                │
        │   service ──► validator ──► calculator         │   ← your own code:
        │      │                                         │     use the REAL objects
        │      │                                         │
        └──────┼──────────────── boundary ──────────────-┘
               │
               ▼
        ┌─────────────┐  ┌─────────────┐  ┌────────────┐
        │  database   │  │  payment API │  │  the clock │   ← external systems:
        └─────────────┘  └─────────────┘  └────────────┘     fake THESE
```

💡 **Key point - mock at the boundary, not inside it.** Replace the things at the border (slow, external,
nondeterministic - exactly the four reasons from [Phase 1](01-why-fake-anything.md)). Use the *real* thing
for your own code. When `service` calls `validator`, let it call the real `validator` - that interaction is
part of what you're trying to verify, not noise to be stubbed away.

This single rule prevents most mocking pain. Everything below is *why* it works.

## The over-mocking trap, made concrete

When you mock your own internals, two specific failures appear. They're worth seeing clearly because they're
sneaky - the tests look fine.

### Trap 1: green tests over a broken product

Suppose `calculateTotal` has a real bug - it forgets to add tax. Now look at a test of the function that
*calls* it:

```javascript
// We mocked our OWN calculator instead of using the real one.
const calculatorMock = {
  calculateTotal: jest.fn().mockReturnValue(108.0), // we hand-typed the "right" answer
};

const receipt = await buildReceipt(cart, calculatorMock);

expect(receipt.total).toBe(108.0); // passes! ...but the real calculator returns 100.0
```
*What just happened:* We told the mock to return `108.0` - the answer we *believe* is correct - so the test
passes. But the real `calculateTotal` is broken and returns `100.0`. Our test never ran the real code, so
it can't see the bug: we've encoded our *assumption* and verified it against itself. The test is green; the
customer gets undercharged.

⚠️ **Gotcha - a mock freezes your belief about a dependency in time.** The mock returns what you *thought*
the dependency does on the day you wrote the test. If the real dependency changes (or was wrong all along),
the mock keeps cheerfully returning the old answer, and the test keeps passing while production breaks. Real
objects can't lie to you like this; they run the actual code.

### Trap 2: tests welded to implementation details

Over-mocking pushes you to assert on *how* your code works internally instead of *what* it produces:

```javascript
// Asserting on internal call sequence - coupled to the implementation, not the behavior.
expect(repo.beginTransaction).toHaveBeenCalled();
expect(repo.insertRow).toHaveBeenCalledBefore(repo.commit);
expect(repo.commit).toHaveBeenCalledTimes(1);
```
*What just happened:* These assertions don't check that the order was *saved correctly* - they check the
exact sequence of internal calls the code happens to make today. The moment someone refactors `save` to do
the same thing a slightly different way (say, a batch insert), every one of these tests breaks, even though
the behavior is identical and correct.

This is the quiet tax of over-mocking: tests that **break when you refactor working code** and **stay green
when you break working code** - exactly backwards from what a test is for. A test should pin down *behavior*
and stay silent about *implementation*, so you can refactor freely.

🪖 **War story.** A team I know had a 4,000-test suite that ran in 90 seconds and was almost entirely mocks.
It went green on every commit. Then a real outage: a downstream API had changed a field name months earlier
and not one test caught it - every test touching that API used a mock returning the *old* shape. The suite
wasn't testing the software; it was testing a museum replica of it as it existed the day each mock was
written.

## Prefer real objects and fakes when they're cheap

The instinct to reach for a mock is often premature. Walk down this ladder and stop at the first rung that
works:

| Reach for… | When | Why it's better |
|---|---|---|
| **The real object** | It's your own code, or a fast pure dependency | Tests the actual code; survives refactors |
| **A fake** (in-memory) | The dependency has real behavior (a DB, a cache) | Real logic + state, still fast and deterministic |
| **A stub** | You just need to *feed* one canned situation | Simple; forces a specific input |
| **A mock** | The *interaction itself* is the contract you must guarantee | Verifies the call was made correctly |

The order matters. A real object is the most honest test you can write, so prefer it. Drop to a fake when
the real thing is too slow or external but still has behavior worth honoring (an in-memory database is the
classic - see [Phase 2](02-the-doubles-defined-honestly.md)). Drop to a stub when you only need to set up a
situation. Only reach for a strict mock when the *interaction* is genuinely the point - "we must call the
payment gateway exactly once, never twice." Double-charging is a real bug a mock catches well.

## Where doubles thin out: the testing pyramid

This connects to a bigger picture. Different layers of tests use *different amounts* of faking, on purpose:

- **Unit tests** sit at the bottom: small, fast, lots of doubles at the boundary so a single piece of logic
  can be checked in isolation.
- **Integration tests** sit above: they wire several real pieces together - often including a real (or
  fake) database - and use *far fewer* doubles, precisely so they catch the "the parts don't actually fit
  together" bugs an over-mocked unit test sails right past.
- **End-to-end tests** sit at the top: ideally almost no doubles - the real system, exercised like a user
  would.

The mocked-unit-test and the no-mocks-integration-test aren't competitors; they're checking different
things. The bug in Trap 1 (real calculator returns the wrong number) is exactly what an integration test
with a real calculator would catch - why you don't rely on heavily-mocked unit tests alone.

> ⏭️ For how these layers fit together - what each one is for, how many of each to write, and why the shape
> matters - see [Unit, Integration & E2E Tests](/guides/unit-integration-e2e). The one-line version: the
> further up the pyramid, the fewer doubles, because the whole point of the higher layers is to test the
> real seams that doubles hide.

## A short checklist before you mock

Before you replace something with a double, ask:

1. **Is it at the boundary?** (external, slow, nondeterministic, or has irreversible side effects) → a
   double is appropriate. **Is it my own code?** → strongly prefer the real object.
2. **Could a real object or a fake do this cheaply?** → use that instead of a mock.
3. **Am I about to assert on *how* the code works rather than *what* it produces?** → stop; that test will
   break on the next harmless refactor.
4. **If the real dependency changed shape tomorrow, would any test catch it?** → if every test of it is
   mocked, the answer is no. Make sure *something* (an integration test) exercises the real seam.

## Recap

1. **Mock at the boundary, not inside it.** Fake external systems; use real objects for your own code.
2. **Over-mocking produces lying tests** - green over a broken product (because the mock encodes your
   assumption) and brittle against refactors (because it's welded to implementation details).
3. A mock **freezes your belief** about a dependency; if reality drifts, the mock keeps the test green while
   production breaks.
4. **Walk the ladder:** real object → fake → stub → mock. Stop at the first rung that works; only mock when
   the *interaction* is the contract.
5. **Doubles thin out as you go up the pyramid** - integration and E2E tests use fewer of them on purpose,
   to catch exactly the bugs heavily-mocked unit tests miss. See
   [Unit, Integration & E2E Tests](/guides/unit-integration-e2e).

That's the whole craft: doubles are a scalpel for isolating *your* logic, not a way to make every test fast
and green. Use them at the seams, keep your own code real, and let the higher layers test what the doubles hid.

---

[← Phase 2: The Doubles, Defined Honestly](02-the-doubles-defined-honestly.md) · [Guide overview](_guide.md)

**Related guides:** [Your First Unit Test](/guides/your-first-unit-test) · [Unit, Integration & E2E Tests](/guides/unit-integration-e2e)
