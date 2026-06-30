---
title: "The Three Levels"
guide: "unit-integration-e2e"
phase: 2
summary: "Unit, integration, and end-to-end tests one at a time: what each one catches, what each costs in speed and flakiness, and a concrete worked example of each."
tags: [testing, unit-tests, integration-tests, e2e-tests, flakiness, test-doubles]
difficulty: intermediate
synonyms: ["difference between unit integration and e2e", "what does an integration test catch", "why are e2e tests flaky", "unit test vs integration test example", "what is an end to end test"]
updated: 2026-06-19
---

# The Three Levels

Now we walk the pyramid one floor at a time. For each level, three questions - the same three every time, because they're the ones that decide where a test belongs:

- **What does it catch** that the others don't?
- **What does it cost** - in speed, and in flakiness (failing for reasons that aren't your bug)?
- **What does one actually look like?**

We'll follow one feature through all three levels so the differences are concrete: a small shopping app where adding an item to your cart updates the cart total.

## Unit - one piece, in isolation

**What it actually is.** A unit test runs a single small piece of your code - one function, one class - completely by itself. Anything that piece would normally reach out to (a database, the network, the clock, the file system) is either not involved or replaced with a stand-in.

📝 **Terminology - "in isolation" / test double.** *In isolation* means the piece runs without its real collaborators. The stand-ins you swap in for those collaborators are called **test doubles** (fakes, stubs, mocks). They exist so the unit test can stay fast and focused on the one piece - building them well is its own skill, covered in [Mocking & Test Doubles](/guides/mocking-and-test-doubles).

**What it catches.** Logic bugs inside that one piece: the off-by-one, the wrong rounding, the forgotten edge case. If a function should sum prices and apply a discount, a unit test pins down whether *the math* is right.

**What it costs.** Almost nothing. No database to start, no server to boot - these run in well under a millisecond each, which is why you can have thousands and still finish in seconds. Flakiness is near zero too: with no network or shared state, there's nothing to wobble. The cost is the blind spot from Phase 1 - a unit test cannot tell you the piece works *with* the real things around it.

**A real example.** Testing the cart-total calculation by itself:

```console
$ npm test cart-total

  cartTotal()
    ✓ sums the prices of all line items (1 ms)
    ✓ applies a percentage discount to the subtotal (1 ms)
    ✓ returns 0 for an empty cart

  3 passing (12 ms)
```

*What just happened:* The test called the `cartTotal()` function directly with a few hand-made line items - no cart was saved to a database, no page was rendered. It checked that the returned number matched what the math should produce. Three cases, twelve milliseconds total. If the discount logic were wrong, exactly this test would go red, and you'd know the bug lives in `cartTotal()` and nowhere else.

## Integration - a few real pieces, working together

**What it actually is.** An integration test runs **two or more of your real pieces together**, with at least one real collaborator that a unit test would have faked - most often a real database, sometimes a real message queue or a second internal service.

**What it catches.** The seams. The things that are invisible when each piece is tested alone: the SQL query that's subtly wrong, the column that's actually nullable, the data that comes back from the database in a different shape than your code assumed. Your `saveCart()` and your `loadCart()` might each have passing unit tests and still disagree about how a cart is stored - an integration test that saves a cart and reads it back is what catches that.

**What it costs.** More than a unit test, less than E2E. There's a real database to talk to, so each test is more like tens of milliseconds and up, and you need that database set up and cleaned between tests. Flakiness creeps in here: shared state between tests, leftover rows, ordering assumptions. Still very manageable - far steadier than E2E - but no longer "free."

**A real example.** Saving a cart and reading it back through a real test database:

```console
$ npm run test:integration -- cart-repository

  CartRepository (against test database)
    ✓ saves a cart and loads it back with the same items (38 ms)
    ✓ updates the total when an item is added (29 ms)

  2 passing (1.2 s)
```

*What just happened:* These tests ran your real repository code against a real (test) database - saving a cart, then loading it to confirm the items and total survived the round-trip intact. Notice the timing: tens of milliseconds per test instead of one, and over a second of total wall-clock once you count starting and resetting the database. That extra cost buys the one thing units can't give you: proof that *your code and your database actually agree.*

⚠️ **Gotcha - leftover state is the #1 source of flaky integration tests.** If one test saves a cart and the next test doesn't start from a clean slate, the second can pass or fail depending on what ran before it. The fix is to reset the data between tests (a transaction rolled back, or a truncate) so every test starts from the same known state. A test whose result depends on run order isn't testing your code - it's testing your luck.

## End-to-end - the whole system, as a user

**What it actually is.** An E2E test drives your **entire running system the way a real user would** - through the actual UI in a real browser, or through the public API - with everything real behind it: real frontend, real backend, real database, real network hops between them.

**What it catches.** That the whole journey works, all the way through. Not "does the cart math work" or "does the database round-trip," but "**can a person actually add an item and see the total update on the page.**" It's the only level that exercises the real wiring between frontend and backend, the routing, the rendering - the parts no narrower test ever touches.

**What it costs.** The most, on both axes. Speed: it launches the app, drives a browser, and waits on real network and real rendering - seconds per test, not milliseconds. Flakiness: this is where flaky tests are *born.* A page that's a half-second slow to load, an animation that hasn't finished, a network blip - any of these can fail an E2E test while your code is perfectly fine. That's the tax for testing everything at once: everything that can wobble, does.

**A real example.** Driving the browser through the add-to-cart flow:

```console
$ npx playwright test add-to-cart

Running 1 test using 1 worker

  ✓  add-to-cart.spec.ts:4 › cart total updates when an item is added (4.7s)

  1 passed (6.1s)
```

*What just happened:* The test opened a real browser, loaded the running app, clicked "Add to cart" on a product, and asserted that the total shown *on the page* changed to the expected amount. One test, nearly five seconds - versus twelve milliseconds for three unit tests. But it proved the thing none of the others could: a user clicking that button gets the right result on their screen, with every real piece in the chain doing its job.

## The three side by side

One honest table, since the whole point is the trade-off:

| | **Unit** | **Integration** | **End-to-end** |
|---|---|---|---|
| Runs | one piece, alone | a few real pieces (e.g. code + DB) | the whole system, via UI/API |
| Catches | logic bugs in that piece | broken seams between pieces | the user's journey actually works |
| Speed | sub-millisecond | tens of ms and up | seconds |
| Flakiness | near zero | low–moderate (state, ordering) | highest (timing, network, rendering) |
| When it fails | pin: this piece | a region: these pieces + their link | a wide region: anywhere in the chain |

## Recap

1. **Unit** runs one piece in isolation - catches logic bugs, costs almost nothing, but is blind to how pieces fit together.
2. **Integration** runs a few real pieces together (classically code + a real database) - catches broken seams, costs more and risks state-leak flakiness.
3. **End-to-end** runs the whole system as a user - catches "the journey actually works," costs the most in both speed and flakiness.
4. Each level catches exactly what the level below it can't see - which is why you want all three, in different amounts.

That "different amounts" is the last piece. Next: how to get the mix right, and the anti-pattern that gets it exactly backwards.

---

[← Phase 1: The Testing Pyramid](01-the-testing-pyramid.md) · [Guide overview](_guide.md) · [Phase 3: Getting the Mix Right →](03-getting-the-mix-right.md)
