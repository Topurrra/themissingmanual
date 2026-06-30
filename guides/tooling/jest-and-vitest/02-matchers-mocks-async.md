---
title: "Jest and Vitest"
guide: jest-and-vitest
phase: 2
summary: "JavaScript and TypeScript testing: Jest's batteries-included matchers, mocks, and snapshots — and Vitest, the faster, Vite-native drop-in with the same API."
tags: [jest, vitest, testing, javascript, typescript, mocks, snapshots]
difficulty: intermediate
synonyms: ["jest vs vitest", "how to test javascript", "jest mocks", "vitest setup", "snapshot testing", "jest fake timers", "testing async code js"]
updated: 2026-06-30
---

# The daily core: matchers, mocks, async, timers

This is the phase you'll live in. Once tests are running, ninety percent of your time is spent on four skills: picking the right matcher, faking a dependency, testing code that's asynchronous, and controlling time. Get fluent here and you can test almost anything. The good news from Phase 1 holds: the API is nearly identical in Jest and Vitest, so what you learn here works in both.

## Matchers: say what you mean

A matcher is the assertion. The skill is choosing the one that says exactly what you mean, because the matcher decides how good the failure message is.

```js
expect(add(2, 3)).toBe(5);              // strict ===, for primitives
expect({ a: 1 }).toEqual({ a: 1 });     // deep equality, for objects/arrays
expect([1, 2, 3]).toContain(2);          // membership
expect(user.name).toBeDefined();         // not undefined
expect(isReady).toBe(true);              // exact boolean
expect(() => parse("")).toThrow();       // the function throws
expect("hello world").toMatch(/world/);  // string matches regex
```

*What just happened:* the big trap is `toBe` versus `toEqual`. `toBe` uses `===`, which for objects means "the same reference in memory." Two objects with identical contents are *not* `===`, so `expect({a:1}).toBe({a:1})` fails. Use `toEqual` to compare contents. Reach for `toBe` only with primitives (numbers, strings, booleans) or when you genuinely mean "the exact same object."

When a matcher fails, the runner prints a diff of expected vs received. That diff is your debugging tool, so picking the precise matcher (`toContain` instead of asserting on `arr.indexOf(x) !== -1`) is what makes failures readable instead of cryptic.

## Mocks: replacing the parts you don't want to run

Your function calls a database, an HTTP API, or a clock. You don't want the test to actually hit the network — that's slow, flaky, and not what you're testing. A **mock** is a stand-in: a fake function you control, that records how it was called.

```js
import { vi } from "vitest"; // Jest: use `jest` instead of `vi`, same methods

const onSave = vi.fn();          // a fake function
onSave("draft");
onSave("final");

expect(onSave).toHaveBeenCalledTimes(2);
expect(onSave).toHaveBeenCalledWith("final");   // checks any call
expect(onSave).toHaveBeenLastCalledWith("final"); // checks the last one
```

*What just happened:* `vi.fn()` (Jest: `jest.fn()`) creates a function that does nothing but remember every call. You pass it where a real callback would go, run your code, then assert on *how it was called*. This is how you test "did my code notify the listener with the right argument?" without caring what the listener does.

You can also make a mock return a value or resolve a promise:

```js
const fetchUser = vi.fn();
fetchUser.mockResolvedValue({ id: 1, name: "Ada" });

const user = await fetchUser(1);
expect(user.name).toBe("Ada");
expect(fetchUser).toHaveBeenCalledWith(1);
```

*What just happened:* `mockResolvedValue` makes the fake return a resolved promise, so `await` gets your canned object. Now you can test code that depends on `fetchUser` without a real server. To replace a whole imported module, use `vi.mock("./api.js", ...)` (Jest: `jest.mock`) — same idea, applied to every export of a module.

> **Mock the boundary, not the logic.** Mock the things you don't own or don't want to run: the network, the filesystem, the clock, third-party SDKs. Don't mock the function you're actually testing — if you mock everything, the test passes even when the real code is broken. A test full of mocks is often a test that proves nothing.

## Async: await the result, or the test lies

The single most common testing bug: forgetting that the code is asynchronous. If you don't `await`, the test function returns before the assertion runs, and the runner calls it green.

```js
it("loads the user", async () => {
  const user = await loadUser(1);     // MUST await
  expect(user.name).toBe("Ada");
});

it("rejects on missing user", async () => {
  await expect(loadUser(999)).rejects.toThrow("not found");
});
```

*What just happened:* mark the test `async` and `await` the promise so the assertion runs before the test ends. For promises that should *fail*, use `await expect(promise).rejects.toThrow(...)` — and keep the `await`, or the rejection escapes and the test passes wrongly. The matching `.resolves` checks a fulfilled promise's value. The rule is simple: if there's a promise anywhere in the test, there must be an `await`.

## Timers: stop waiting for real time

Code that uses `setTimeout`, `setInterval`, or debounce should not make your test sleep for real seconds. **Fake timers** let you fast-forward the clock instantly.

```js
import { vi, it, expect } from "vitest"; // Jest: jest.useFakeTimers(), etc.

it("calls back after the delay", () => {
  vi.useFakeTimers();
  const cb = vi.fn();

  setTimeout(cb, 1000);
  expect(cb).not.toHaveBeenCalled();   // time hasn't moved

  vi.advanceTimersByTime(1000);         // jump forward 1s, instantly
  expect(cb).toHaveBeenCalledOnce();

  vi.useRealTimers();                   // restore for other tests
});
```

*What just happened:* `useFakeTimers()` swaps the real `setTimeout` for a controllable fake. The callback hasn't fired yet because no time has "passed." `advanceTimersByTime(1000)` simulates one second passing and runs anything scheduled in that window — with no actual waiting. Always call `useRealTimers()` afterward (or in an `afterEach`) so fake time doesn't leak into the next test. The Jest API is the same with `jest.` in front: `jest.useFakeTimers()`, `jest.advanceTimersByTime(...)`.

For builders: combine fake timers with a mock callback to test debouncing — fire the function five times, advance the clock, assert the callback ran *once*. That's a test that would take real seconds and be flaky if you used real timers.

```quiz
[
  {
    "q": "You compare two objects with identical contents using toBe. What happens?",
    "choices": ["Passes — contents match", "Fails — toBe uses === (reference equality)", "Throws a syntax error", "Passes only for empty objects"],
    "answer": 1,
    "explain": "toBe is reference equality (===); two distinct objects are never ===. Use toEqual for deep content comparison."
  },
  {
    "q": "Your async test forgets to await the promise. What's the likely result?",
    "choices": ["The test errors immediately", "The test passes even when the assertion would fail", "The runner retries it", "The promise is awaited automatically"],
    "answer": 1,
    "explain": "Without await, the test function returns before the assertion runs, so the runner reports a false green."
  },
  {
    "q": "Why use fake timers instead of letting setTimeout run for real?",
    "choices": ["Real timers are not supported in tests", "To advance time instantly and avoid slow, flaky waits", "Fake timers improve code coverage", "They mock the network too"],
    "answer": 1,
    "explain": "Fake timers let you advanceTimersByTime to fast-forward instantly, so timer-based code tests fast and deterministically."
  }
]
```

[← Phase 1](01-the-test-runner-model.md) | [Overview](_guide.md) | [Phase 3: Production reality →](03-snapshots-flakiness-choosing.md)
