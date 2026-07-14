---
title: "Production reality: snapshots, flakiness, and Jest vs Vitest"
guide: jest-and-vitest
phase: 3
summary: "JavaScript and TypeScript testing: Jest's batteries-included matchers, mocks, and snapshots - and Vitest, the faster, Vite-native drop-in with the same API."
tags: [jest, vitest, testing, javascript, typescript, mocks, snapshots]
difficulty: intermediate
synonyms: ["jest vs vitest", "how to test javascript", "jest mocks", "vitest setup", "snapshot testing", "jest fake timers", "testing async code js"]
updated: 2026-06-30
---

# Production reality: snapshots, flakiness, and Jest vs Vitest

You can write tests. Now comes the part nobody warns you about: tests that lie, tests that pass on Tuesday and fail on Wednesday, and a snapshot folder no human has read in months. This phase is the gotchas - the failure modes that erode trust in a test suite - plus the decision you came here for: Jest or Vitest.

## Snapshots: the sharpest double-edged tool

A snapshot test serializes a value to a `.snap` file the first time it runs, then on every later run compares the new output against the stored file. It's seductive for component output and large objects because you write almost nothing.

```js
it("renders the invoice summary", () => {
  const html = renderInvoice({ total: 42, currency: "USD" });
  expect(html).toMatchSnapshot();   // first run: saves it. later: compares.
});
```

*What just happened:* the first run wrote the rendered HTML into a `__snapshots__/*.snap` file and passed. Every later run compares against that file and fails if the output changed. You asserted nothing specific - you asserted "the output is the same as last time." That's powerful and dangerous in equal measure.

Here's the abuse pattern. Output changes (often legitimately), the test fails, and a tired developer runs the update command without reading the diff:

```bash
npx vitest run -u        # -u / --updateSnapshot: overwrite all snapshots
npx jest -u              # same flag in Jest
```

*What just happened:* every failing snapshot was overwritten with the current output, failures and all. If a bug changed the output, you've enshrined the bug as the new "correct" answer. This is how snapshot suites rot into meaningless green.

> **Snapshot rules that keep them trustworthy.** Keep snapshots small and reviewable - a giant blob nobody reads catches nothing. Treat a snapshot diff in code review like any other code change; read it. Prefer an explicit matcher (`toBe`, `toEqual`, `toContain`) whenever you can name what you expect - `expect(total).toBe(42)` tells a reader the intent; a snapshot doesn't. Use snapshots for output that's tedious to assert by hand, not as a substitute for thinking.

## Flakiness: the trust killer

A flaky test passes and fails without the code changing. One flaky test trains your team to ignore red, and an ignored suite is worthless. The usual causes are all about hidden state and timing:

```text
Common flake sources and the fix:
  real timers / sleeps        → fake timers (Phase 2)
  shared state between tests   → reset in beforeEach / afterEach
  test order dependence        → tests must pass in any order, in isolation
  unmocked network or clock    → mock the boundary
  un-awaited promises          → await everything async
```

*What just happened:* every line is a leak of state or time across the boundary of a single test. The cure is isolation - each test sets up what it needs and cleans up after itself, so order and timing can't matter. Both runners give you the hook to enforce it:

```js
import { afterEach, vi } from "vitest"; // Jest: import from @jest/globals

afterEach(() => {
  vi.restoreAllMocks();   // undo spies/mocks
  vi.useRealTimers();     // undo fake timers
});
```

*What just happened:* after every test, mocks and fake timers are reset so the next test starts clean. Without this, a mock set in one test silently changes behavior in the next, and you get a failure that only appears when tests run in a certain order - the worst kind to debug. Both tools also have a config flag (`restoreMocks`/`clearMocks`) that does this automatically; turning it on is a cheap insurance policy.

## Coverage: a flashlight, not a scoreboard

Both runners produce coverage reports - which lines ran during the tests.

```bash
npx vitest run --coverage
npx jest --coverage
# prints a table: % Stmts | % Branch | % Funcs | % Lines  per file
```

*What just happened:* the report shows which code your tests exercised. Use it as a flashlight to find *untested* areas - a file at 10% is telling you something. Do not turn it into a target: 100% coverage proves every line *ran*, not that any behavior is *correct*. A test with no assertions can hit 100% and verify nothing. Chase meaningful tests; let coverage point you at the gaps.

## Jest vs Vitest: the actual decision

You've seen across every phase that the APIs are nearly the same. So the choice is about your build, not your test syntax.

```text
Pick Vitest when:
  - your app already uses Vite (React/Vue/Svelte via Vite, SvelteKit, etc.)
  - you write native ESM and TypeScript and want it to work with no fuss
  - test startup/watch speed matters (it shares Vite's transform pipeline)

Pick Jest when:
  - you're on a build that isn't Vite (Create React App legacy, Next.js
    defaults, plain Node, React Native / Metro)
  - you inherit a large existing Jest suite - no reason to migrate
  - you need a specific Jest-ecosystem plugin without a Vitest equivalent
```

*What just happened:* the rule of thumb is "match your bundler." Vitest reuses your Vite config and transforms, so a Vite project gets fast, ESM-native, TypeScript-aware testing with almost no setup. Jest is the mature default everywhere else, with the largest ecosystem and the most Stack Overflow answers. Vitest was deliberately built API-compatible with Jest, which is why migrating is often mostly a find-and-replace of `jest.` to `vi.` - and why learning one taught you both.

In the wild: a team on plain Node or an older React stack stays on Jest because it works and the suite is large; a new Vite or SvelteKit app reaches for Vitest because it inherits the existing build config and the watch loop is noticeably snappier. Neither is "better" in the abstract - the right one is the one that matches the toolchain you already have. For how these unit tests fit a broader strategy, revisit [Unit, Integration, and E2E](/guides/unit-integration-e2e).

```quiz
[
  {
    "q": "Why is blindly running the snapshot update flag (-u) dangerous?",
    "choices": ["It deletes test files", "It overwrites snapshots with current output, enshrining any bug as correct", "It disables coverage", "It only works in Jest"],
    "answer": 1,
    "explain": "-u overwrites stored snapshots with whatever the code produces now; an un-reviewed bug becomes the new baseline."
  },
  {
    "q": "Which is the strongest single defense against test order-dependence and flakiness?",
    "choices": ["Higher coverage", "Resetting mocks and timers in afterEach so each test is isolated", "More snapshots", "Running tests slower"],
    "answer": 1,
    "explain": "Cleaning up mocks/timers after each test prevents state leaking across tests, which is what makes order matter."
  },
  {
    "q": "Your app is built with Vite. Which runner fits best, and why?",
    "choices": ["Jest, because it's older", "Vitest, because it reuses your Vite config and transform pipeline", "Either is identical in setup", "Jest, because Vitest can't do TypeScript"],
    "answer": 1,
    "explain": "Vitest shares Vite's config and transforms, giving fast, ESM- and TS-native testing with minimal setup on a Vite project."
  }
]
```

[← Phase 2](02-matchers-mocks-async.md) | [Overview](_guide.md)
