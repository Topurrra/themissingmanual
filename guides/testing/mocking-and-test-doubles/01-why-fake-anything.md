---
title: "Why Fake Anything?"
guide: "mocking-and-test-doubles"
phase: 1
summary: "Your code talks to slow, unreliable, and expensive things; to test your own logic in isolation you replace those dependencies with stand-ins - the stunt-double mental model."
tags: [testing, test-doubles, dependencies, unit-tests, isolation]
difficulty: intermediate
synonyms: ["why use mocks in tests", "how to test code that calls an API", "test code without a database", "what problem do test doubles solve", "isolate unit under test"]
updated: 2026-07-10
---

# Why Fake Anything?

Here's a function that looks completely reasonable until you try to test it:

```javascript
async function chargeCustomer(customerId, amount) {
  const customer = await db.findCustomer(customerId);
  if (!customer) throw new Error("No such customer");
  if (amount <= 0) throw new Error("Amount must be positive");

  const result = await stripe.charge(customer.cardToken, amount);
  await db.recordPayment(customerId, amount, result.id);
  return result.id;
}
```

The logic *you* wrote is small and worth testing: reject missing customers, reject non-positive amounts,
record the payment after a successful charge. But to run a single test of that logic, the function drags in
a live database (`db`) and a real payment provider (`stripe`). To test "does it reject a negative amount?"
you'd need a working Stripe account and a real customer in a real database. That's the problem test doubles
exist to solve.

## The dependency is not the thing you're testing

**What's actually going on.** Your function has two kinds of parts:

- The **logic you own** - the `if` checks, the order of operations, what you do with the result. This is
  what the test should be about.
- The **dependencies it calls** - the database, the payment API, the file system, the clock. These belong
  to someone else (a library, a service, the operating system). They're already tested by their authors.
  You're not trying to test *them*; you're trying to test how *your* code uses them.

A test double lets you swap out that second category so only the first category is under the microscope.

```text
   Without doubles                      With doubles
   ──────────────                       ────────────
   ┌──────────────┐                     ┌──────────────┐
   │ your function│                     │ your function│   ← the only thing
   └──────┬───────┘                     └──────┬───────┘     under test
          │ calls                              │ calls
          ▼                                    ▼
   ┌──────────────┐                     ┌──────────────┐
   │ REAL Stripe  │  slow, costs money  │ FAKE Stripe  │   ← a stand-in you
   │ REAL database│  needs a server     │ FAKE database│     control completely
   └──────────────┘                     └──────────────┘
```

📝 **Terminology - "the system under test" (SUT).** The bit of code a given test is actually checking.
Everything else the test touches is scaffolding. Test doubles are scaffolding: they exist so the SUT can
run, not because we care what they do.

## The four reasons a real dependency hurts in a test

You don't fake things for fun - faking adds its own cost (the double can drift from reality, which is the
whole subject of [Phase 3](03-when-mocking-helps-vs-hurts.md)). You fake a dependency when keeping it real
would make the test one of these:

| The dependency is… | Why it ruins the test | Example |
|---|---|---|
| **Slow** | A test suite that takes minutes stops getting run | A real HTTP call, a full database round-trip |
| **Unreliable / nondeterministic** | The test passes Monday, fails Tuesday, for no code reason | A third-party API that's down; `new Date()`; a random number |
| **Expensive or irreversible** | The test has real-world side effects you can't take back | Charging a card, sending an email, deleting a row in prod |
| **Hard to set up** | You can't easily force the exact situation you want to test | Making the network *fail* on demand to test your retry logic |

That last row is the one people forget. Doubles aren't only about avoiding the real thing - they're often
the *only* practical way to test the unhappy paths. You can't reliably make a real API time out, but a
double can be told to throw a timeout every single time, on command.

⚠️ **Gotcha - the clock is a dependency too.** Code that calls `new Date()`, `time.Now()`, or
`System.currentTimeMillis()` directly is silently depending on *when the test runs*. A test like "this
coupon is expired" will pass today and fail after the expiry date - a bug that travels into the future.
Time is one of the most common things worth faking, and one of the easiest to overlook because it doesn't
look like a dependency.

## The stunt-double mental model

This is where the name comes from, and it's the picture worth keeping.

In a film, the lead actor does the close-up dialogue - the part the movie is actually about. But when the
scene calls for jumping off a building, a **stunt double** stands in, doing the dangerous part safely so the
actor (and the production budget) stay intact.

A **test double** is exactly that for your code:

- The **real dependency** is the dangerous, expensive, or unavailable performer.
- The **double** is a stand-in that looks enough like it (same shape, same method names) for *this* test.
- Your code under test never knows the difference - it calls `stripe.charge(...)` the same way regardless.

The reason this works at all is that your code talks to the dependency through some **interface** - a set
of method names and shapes, like "an object with a `charge(token, amount)` method that returns a promise
of `{ id }`." As long as the double honors that shape, your code is satisfied. The double doesn't have to
*be* Stripe; it only has to *look like* Stripe from where your function is standing.

```text
        ┌─────────────────────┐
        │   your function     │
        └──────────┬──────────┘
                   │ "I need something with a
                   │  .charge(token, amount) method"
                   ▼
            ┌──────────────┐
            │  interface   │   ← the shape your code depends on
            └──────┬───────┘
          ┌────────┴────────┐
          ▼                 ▼
   ┌────────────┐    ┌────────────┐
   │ REAL Stripe│    │   DOUBLE   │   ← either one satisfies the shape;
   └────────────┘    └────────────┘     in a test you plug in the double
```

💡 **Key point.** Faking is only possible because your code depends on a *shape*, not a *specific object*.
This is why "depend on interfaces, pass dependencies in" (rather than reaching out and grabbing a global
`stripe` from inside the function) makes code testable - it gives you the seam to slide a double into.
Hard-to-test code is usually code with no seam.

## So what *is* a double, concretely?

It's just an object (or function) you create in the test that stands in for the real one. The simplest
possible version is hand-written - no library involved:

```javascript
// A hand-rolled stand-in for the database, created inside the test.
const fakeDb = {
  findCustomer: async (id) => ({ id, cardToken: "tok_test" }),
  recordPayment: async () => {},
};

// A hand-rolled stand-in for Stripe.
const fakeStripe = {
  charge: async () => ({ id: "ch_123" }),
};

// Now we can test our logic with no network and no real database.
const id = await chargeCustomer("cust_1", 50, { db: fakeDb, stripe: fakeStripe });
```

*What just happened:* We built two plain objects with the same method names the real dependencies have, and
passed them into the function. `chargeCustomer` calls `db.findCustomer(...)` and `stripe.charge(...)` exactly
as before, but those calls now hit our stand-ins, which return instantly and cost nothing. The test can run
on a plane with no Wi-Fi.

Mocking *libraries* exist to make this less tedious - generating these stand-ins, recording how they were
called, asserting on it. But there is nothing magic underneath: **a double is a stand-in object that honors
the shape your code expects.** Everything in the next phase varies only *how much* the stand-in does.

## Recap

1. Your test should be about **the logic you own**, not the dependencies it calls - those belong to someone
   else and are already tested.
2. You replace a real dependency with a **double** when keeping it real would make the test slow,
   unreliable, expensive/irreversible, or impossible to set up (especially the unhappy paths).
3. The **clock and randomness are dependencies too**, even though they don't look like it.
4. Faking works because your code depends on a **shape (an interface)**, not a specific object - a double
   just honors that shape. Code with no seam to inject a double is the hard-to-test code.

Now that you know *why* we fake, the next phase names the family - "a double that returns canned answers"
and "a double that asserts it was called correctly" are different tools, even though people call them all
"mocks."

---

[← Guide overview](_guide.md) · [Phase 2: The Doubles, Defined Honestly →](02-the-doubles-defined-honestly.md)
