---
title: "The Doubles, Clearly Defined"
guide: "mocking-and-test-doubles"
phase: 2
summary: "The five kinds of test double - dummy, stub, fake, spy, and mock - what each is for, with a small example, and why people call all of them 'mocks.'"
tags: [testing, test-doubles, stub, fake, spy, mock, dummy]
difficulty: intermediate
synonyms: ["difference between stub and mock", "what is a stub", "what is a fake in testing", "what is a spy in testing", "dummy vs stub vs fake vs mock", "test double types explained"]
updated: 2026-07-10
---

# The Doubles, Clearly Defined

If you've ever been confused about the difference between a "mock" and a "stub," it's not you. The words get
used loosely everywhere - most people say "mock" for *any* test double, and most mocking libraries are named
for just one member of a larger family. Let's clear it up once, with plain definitions and a small example
of each.

The classic naming comes from Gerard Meszaros's book *xUnit Test Patterns*, now the shared vocabulary most
teams use (source: <https://martinfowler.com/bliki/TestDouble.html>, Martin Fowler's summary). There are five
members. The single most useful way to keep them straight is to sort them by **what they do**:

```text
   does nothing ──────────────────────────────────► does a lot
                                                     + checks you back

   dummy        stub          fake         spy        mock
   ─────        ────          ────         ───        ────
   just fills   returns       a real-ish   records    a stub that
   a slot       canned        working      how it     ALSO asserts
   (never       answers       lite version was called  it was called
   used)                      (in-memory)              correctly
```

The first three (**dummy, stub, fake**) only care about *providing input* to the code under test. The last
two (**spy, mock**) also care about *verifying output* - the calls your code made. That input/output split
is the real dividing line, and it matters more than the names. Hold onto it.

## Dummy - fills a slot, never gets used

**What it actually is.** The emptiest possible double. A dummy is an object you pass only because the
signature *requires* something there - but the code path under test never actually calls it. It exists to
satisfy the compiler or the function signature, nothing more.

**What it's for.** Getting past a required parameter that's irrelevant to *this particular* test.

**A small example.**
```javascript
// createOrder needs a `logger`, but the "rejects empty cart" path
// never logs anything - so any object will do.
const dummyLogger = {};

expect(() => createOrder([], dummyLogger)).toThrow("Cart is empty");
```
*What just happened:* We handed `createOrder` an empty object as its logger purely to fill the argument
slot. The empty-cart check throws before any logging happens, so the dummy is never touched. If the code
*did* call `dummyLogger.info(...)`, this would blow up - fair, since it would mean we picked the wrong kind
of double for this test.

⚠️ **Gotcha - `null` is a trap dummy.** Passing `null` as a dummy works *only* if you're certain the value
is never used. The moment a refactor makes the code touch it, you get a confusing null-reference crash
instead of a clear test failure. Many people pass an explicit empty object or a typed placeholder so the
intent ("this is deliberately unused") is visible.

## Stub - canned answers on demand

**What it actually is.** A double that returns **predetermined answers** to the calls your code makes. It's
the workhorse. A stub has no logic of its own; you tell it "when asked X, reply Y," and it does.

**What it's for.** *Feeding* your code a specific situation so you can test how it reacts. This is how you
test the hard-to-reach paths from Phase 1: a stub can return an empty result, a giant result, or throw an
error, on command.

**A small example.**
```javascript
// We want to test: "what does our code do when the user has no orders?"
// Stub the repository to return an empty list, every time.
const orderRepoStub = {
  findByUser: async () => [],
};

const summary = await buildDashboard("user_42", orderRepoStub);

expect(summary.message).toBe("You have no orders yet.");
```
*What just happened:* The stub's `findByUser` ignores its argument and always returns `[]`, forcing the
"no orders" situation deterministically without needing a real user who genuinely has none. We're testing
*our* dashboard logic's reaction to empty data - the stub just supplies it.

The same trick forces error paths:
```javascript
const flakyApiStub = {
  fetchRates: async () => { throw new Error("503 Service Unavailable"); },
};
// Now we can test that buildDashboard falls back gracefully when rates are down.
```
*What just happened:* A real API won't fail on demand, but a stub throws reliably - so we can finally test
the fallback code that only runs when things go wrong.

💡 **Key point.** A stub is about **inputs to your code**. You never assert anything *on the stub itself* -
you assert on what your code *did* with the canned answer. If you find yourself checking "was the stub
called?", you've crossed into spy/mock territory (below).

## Fake - a real, working, lightweight version

**What it actually is.** A fake has a **genuine working implementation** - just a simpler, lighter one than
production. The textbook example is an **in-memory database**: it really stores and retrieves data, with
real logic, but it lives in a hash map instead of a server, so it's fast and disposable.

**What it's for.** When the dependency has enough behavior that canned answers get unwieldy - when your code
writes *and then reads back*, or relies on the dependency actually behaving correctly across several calls.

**A small example.**
```javascript
// A fake user repository: a real, working store backed by a Map.
function makeFakeUserRepo() {
  const users = new Map();
  return {
    save: async (user) => { users.set(user.id, user); },
    findById: async (id) => users.get(id) ?? null,
  };
}

const repo = makeFakeUserRepo();
await registerUser({ id: "u1", name: "Ada" }, repo);

// It behaves like the real thing: what we saved, we can read back.
expect(await repo.findById("u1")).toEqual({ id: "u1", name: "Ada" });
```
*What just happened:* Unlike a stub, which would return a hard-coded answer regardless of what you saved,
the fake genuinely remembers state - `save` then `findById` works the way a real repository works. That
makes it ideal for testing flows that span several operations, without standing up a real database.

📝 **Terminology - stub vs fake, the one-line version.** A **stub** returns whatever you told it to,
ignoring reality. A **fake** actually *works* - it has logic and (often) state. Reach for a fake when a stub
would need so many canned answers that it stops being simpler than the real behavior.

## Spy - records how it was called

**What it actually is.** A spy is a double that **remembers how it was used** - which methods got called,
with what arguments, how many times - and lets you inspect that *after* the fact. It can wrap canned answers
like a stub *and* keep a logbook.

**What it's for.** Verifying a side effect you can't see in the return value. The classic case: "did we
actually send the welcome email?" The function's return value won't tell you; the only evidence is *that the
email sender was called*.

**A small example.**
```javascript
// A spy email sender: it records every call instead of sending.
const sentEmails = [];
const emailSpy = {
  send: (to, subject) => { sentEmails.push({ to, subject }); },
};

await registerUser({ id: "u1", email: "ada@example.com" }, repo, emailSpy);

// Now we inspect the logbook AFTER running our code.
expect(sentEmails).toHaveLength(1);
expect(sentEmails[0].to).toBe("ada@example.com");
```
*What just happened:* `registerUser` doesn't return anything about email, so we couldn't assert on the
return value. Instead the spy quietly recorded that `send` was called once, with Ada's address, and we
checked that record afterward. The spy answers "*was this interaction triggered?*"

## Mock - a stub that also demands to be called correctly

**What it actually is.** A mock is the strictest member: it's a stub (canned answers) **plus built-in
expectations about how it will be called**, set up *before* you run the code. If your code doesn't call it
exactly as the mock was told to expect - wrong arguments, wrong number of times, wrong order - the **mock
itself fails the test**.

**What it's for.** When the *interaction* is the behavior you care about - when "we must call the payment
gateway exactly once, with this amount" is itself the thing the code is supposed to guarantee.

**A small example** (using a Jest-style mock):
```javascript
const gateway = { charge: jest.fn().mockResolvedValue({ id: "ch_1" }) };

await checkout(cart, gateway);

// The assertion IS about the interaction with the double.
expect(gateway.charge).toHaveBeenCalledTimes(1);
expect(gateway.charge).toHaveBeenCalledWith("tok_visa", 4999);
```
*What just happened:* `jest.fn()` created a double that both returns a canned `{ id: "ch_1" }` *and* records
its calls. We then asserted on the double directly: it must have been called once, with that exact token
and amount. The test's whole point is the interaction - charge the right card, the right amount, exactly
once (never double-charge).

### Spy vs mock - the subtle one

People mix these up constantly, so here's the plain distinction:

| | Spy | Mock |
|---|---|---|
| When expectations are set | **After** the code runs - you inspect the record | **Before** the code runs - you pre-declare what must happen |
| Who fails the test | Your explicit `expect(...)` afterward | The mock itself, if the call doesn't match |
| Feel | "Let me check what happened" | "This *must* happen, or fail" |

In day-to-day practice, with libraries like Jest or Sinon, the same object (`jest.fn()`, a Sinon spy) plays
both roles - you choose spy-style or mock-style by *how you assert*. Don't lose sleep over the boundary; the
useful thing is knowing whether you're loosely observing (spy) or strictly demanding (mock).

## "But everyone just says 'mock'"

They do, and that's okay. In casual speech, "mock the database" almost always means "put in *some* double" -
usually a stub or a fake, despite the word. The precise vocabulary matters in two moments: choosing a tool
("do I need a stub here, or a fake?" is a real design question), and reading a code review comment ("this
is too mock-heavy" is specifically about asserting on interactions, the subject of the next phase). Speak
loosely if you like, but *think* precisely.

## Recap

1. **Dummy** - fills a required slot; never actually used.
2. **Stub** - returns canned answers; feeds your code a situation. You assert on *your code*, not the stub.
3. **Fake** - a real, working, lightweight implementation (in-memory DB); has genuine logic and state.
4. **Spy** - records how it was called so you can inspect the interaction *afterward*.
5. **Mock** - a stub that *also* pre-declares how it must be called, and fails the test itself if you don't.
6. The real dividing line: dummy/stub/fake provide **inputs**; spy/mock verify **interactions**. "Mock" is
   used loosely for all of them - think precisely even when you speak loosely.

You now have the whole family named. The last phase is the judgment that separates tests that protect you
from tests that lie to you.

---

[← Phase 1: Why Fake Anything?](01-why-fake-anything.md) · [Guide overview](_guide.md) · [Phase 3: When Mocking Helps vs Hurts →](03-when-mocking-helps-vs-hurts.md)
