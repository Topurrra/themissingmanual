---
title: "What's Worth Testing (Straight Talk)"
guide: "why-test-at-all"
phase: 3
summary: "Test the logic that matters, the bug you just fixed, and the tricky edge cases - don't chase 100% coverage of trivial code, and watch out for brittle tests and tests that test nothing."
tags: [testing, code-coverage, edge-cases, regression-test, brittle-tests]
difficulty: beginner
synonyms: ["what should i test", "do i need 100% test coverage", "is code coverage worth it", "what is a brittle test", "what is worth testing", "should i test everything"]
updated: 2026-07-10
---

# What's Worth Testing (Straight Talk)

If Phase 1 sold you on the net and Phase 2 showed you it's not magic, there's a real risk you swing too far
the other way and try to test *everything*. That feels responsible. It isn't. Tests cost time to write and,
more importantly, time to *maintain* forever. The real skill isn't "write lots of tests"; it's knowing
which tests pay for themselves and which ones quietly drain you - the cost/benefit conversation a good
senior would actually have with you.

## The cheat-card: test it or skip it?

When you're staring at a piece of code wondering "should this have a test?", run it through this:

| The code is...                                  | Worth a test? | Why                                                        |
|-------------------------------------------------|---------------|------------------------------------------------------------|
| Real logic (calculations, rules, parsing)       | **Yes**       | This is where bugs live and where they cost real money.    |
| A bug you just fixed                            | **Yes**       | Lock it shut so it can never come back.                    |
| A tricky edge case (empty, zero, negative, max) | **Yes**       | The exact spots everyone forgets - so they break in prod.  |
| A trivial getter / one-line passthrough         | Usually no    | Nothing to get wrong; the test just adds maintenance.      |
| Code that only forwards to a library you trust  | Usually no    | You'd be testing the library, not your code.               |
| Throwaway / experimental code                   | No            | It'll be gone next week.                                   |

The pattern: **test where mistakes are both likely and expensive.** Skip where a mistake is nearly impossible
or harmless.

## Test the logic that actually matters

**What it actually is.** "Logic that matters" is any code where the *answer can be wrong* in a way that hurts -
money, data, access, anything a user would feel. A discount calculation. A permission check. A function that
decides whether an order can ship. These are the load-bearing walls of your program.

**Why people get the priority wrong.** Beginners often test the easy stuff (a getter that returns a name)
because it's easy, and skip the scary stuff (the tax calculation with five branches) because it's hard. That's
exactly backwards - the easy code is easy *because* there's nothing to get wrong. Put your testing effort
where the thinking is, not where the typing is fast.

**Why this saves you later.** A wrong name in a getter is an annoyance. A wrong number in a billing
calculation is a refund, an angry email, maybe a finance audit. Your tests should stand guard over the code
that can ruin your week, not the code that can't.

## Test the bug you just fixed (every time)

This is the single highest-value habit in this whole guide, so it gets its own section.

**What it does in real life.** When you find and fix a bug, you write a test that *fails on the broken code and
passes on the fix*. That test now stands guard over that exact mistake forever.

📝 **Terminology.** This is called a *regression test* - a test written specifically to make sure a bug you
already fixed can never quietly come back (a "regression," from Phase 1). It's the most cost-effective test you
can write, because you've already done the hard part: you *know* exactly what was wrong.

```console
$ npm test

  ✓ does not double-charge when the cart is empty   ← the bug we fixed in March
```

*What just happened:* months after fixing an empty-cart double-charge bug, this little test is still on duty.
The day a teammate refactors the cart and accidentally reintroduces the exact same bug, this test goes red
and catches it before a customer gets charged twice. You paid for that protection once and it keeps working
for free.

💡 **Key point.** Never fix a bug without leaving a test behind. A bug fix without a regression test is a bug
you've agreed to fix *again* later.

## Test the tricky edges, not the happy path twice

The "happy path" - normal inputs, everything fine - is worth one test. But bugs cluster at the *edges*: the
inputs people forget exist.

```javascript
// The happy path is one test. The edges are where the bugs hide:
test("splits a $90 bill 3 ways", () => {
  expect(splitBill(90, 3)).toBe(30);
});

test("handles 0 people without crashing", () => {     // edge: divide by zero?
  expect(() => splitBill(90, 0)).toThrow();
});

test("rounds when it doesn't divide evenly", () => {  // edge: $100 / 3?
  expect(splitBill(100, 3)).toBe(33.33);
});
```

*What just happened:* one test covers the normal case, and two more cover the cases that actually bite - zero
people (a classic divide-by-zero crash) and money that doesn't divide cleanly (a rounding bug waiting to
happen). Ten more tests with different happy-path numbers would add maintenance without finding new bugs.
The edges are where the value is: empty, zero, negative, the maximum, the unexpected type.

## Two ways tests turn into a liability

Tests aren't free, and badly-chosen ones actively hurt. Two failure modes to recognize:

⚠️ **Tests that test nothing.** A test that can't fail when the behavior breaks is worse than no test - it gives
you false confidence (a net with a hole in it). The classic is asserting something that's true no matter what:

```javascript
// This test will pass even if priceFor is completely broken.
test("priceFor returns a number", () => {
  const result = priceFor(100, true);
  expect(typeof result).toBe("number");   // true even if the math is wrong!
});
```

*What just happened:* this looks like a test and shows up green, but `priceFor` could return `80`, `0`, or
`-9999` and it would still pass - they're all numbers. It guards nothing. (Compare it to the Phase 2 test
that asserted `toBe(90)`, which actually pins down the behavior.) Always ask: *what wrong behavior would make
this test go red?* If the answer is "nothing," delete it.

⚠️ **Brittle tests.** A *brittle* test breaks every time you touch unrelated code, even when nothing's
actually wrong. Usually it's checking *how* the code did something instead of *what* it produced - exact log
wording, internal call order, private details. The cost shows up later: every refactor turns the suite red
for no real reason, you start ignoring failures, and a net you ignore isn't a net. Test the *result a user
cares about*, not the private path the code took to get there.

📝 **Terminology.** *Code coverage* is the percentage of your code lines that get run while the tests execute.
It's a useful hint about what's *un*tested, but it's a terrible *goal*. 100% coverage can be all the
"tests that test nothing" above - every line runs, nothing is actually checked. High coverage of meaningless
tests is a green dashboard sitting on top of an unprotected codebase.

⚠️ **Don't chase 100%.** Coverage measures how much code ran, not how much is *protected*. Chasing the last
few percent usually means writing pointless or brittle tests for trivial code - paying maintenance forever to
make a number go up. Aim to cover the **logic that matters, the bugs you've fixed, and the edges.** That's the
coverage that actually catches things.

## Recap

1. **Test where mistakes are likely and expensive:** real logic, the bug you just fixed, the tricky edges.
2. **Skip the trivial:** getters, one-line passthroughs, code that just forwards to a trusted library.
3. **Always leave a regression test** behind a bug fix - it's the cheapest, highest-value test you'll write.
4. **Edges over repetition:** one happy-path test, then the zeros, empties, negatives, and odd inputs.
5. Beware **tests that test nothing** (can't fail) and **brittle tests** (fail for no real reason) - both
   erode trust in the net.
6. **Coverage is a hint, not a goal.** 100% of meaningless tests protects nothing.

That's the full mental model: *why* tests matter (the net), *what* a test is (call the code, check the
answer), and *what's* worth testing (the logic, the bugs, the edges). You now understand testing well enough
that writing one will feel obvious instead of mysterious.

When you're ready to actually sit down and write your first one start to finish, go to
[Your First Unit Test](/guides/your-first-unit-test). And when you want the map of the different *kinds* of
tests - unit, integration, end-to-end - and when to reach for each, read
[Unit, Integration, and E2E](/guides/unit-integration-e2e).

---

[← Guide overview](_guide.md) · [Phase 2: What a Test Actually Is](02-what-a-test-actually-is.md)
