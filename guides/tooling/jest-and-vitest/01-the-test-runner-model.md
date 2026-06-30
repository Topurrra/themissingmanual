---
title: "The model: what a test runner does"
guide: jest-and-vitest
phase: 1
summary: "JavaScript and TypeScript testing: Jest's batteries-included matchers, mocks, and snapshots - and Vitest, the faster, Vite-native drop-in with the same API."
tags: [jest, vitest, testing, javascript, typescript, mocks, snapshots]
difficulty: intermediate
synonyms: ["jest vs vitest", "how to test javascript", "jest mocks", "vitest setup", "snapshot testing", "jest fake timers", "testing async code js"]
updated: 2026-06-30
---

# The model: what a test runner does

Here's the reality most tutorials skip. A test is not magic. It's a function that runs your code and then checks whether the result is what you expected. If the check fails, the function throws. That's the whole idea. Everything else - `describe`, `it`, mocks, snapshots - is sugar on top of "run code, throw if wrong."

A **test runner** is the program that finds those functions, runs them, catches the throws, and prints a report. Jest and Vitest are both test runners. They give you four things you'd otherwise build yourself: a way to *find* test files, a way to *group and name* tests, a library of *assertions* (matchers), and tooling for the hard parts (mocks, timers, coverage). Once you see them as "the same four jobs," the two tools stop being two things to learn.

## Why these tools exist at all

You could test without a runner. Write a script, call your function, and `throw new Error()` if the answer is wrong:

```js
import { add } from "./math.js";

if (add(2, 3) !== 5) {
  throw new Error(`add(2,3) was ${add(2, 3)}, expected 5`);
}
console.log("ok");
```

*What just happened:* this is a real test. It runs `add`, checks the result, and crashes loudly if it's wrong. But it stops at the first failure, gives no nice output, and you'd hand-roll grouping and mocks. A runner does all of that for you and keeps going after a failure so you see every problem at once.

That's the trade. You adopt a runner not because your code can't be tested without one, but because the runner turns "a pile of throwing scripts" into a report you can actually read, run in CI, and trust.

## The shape of every test

Both tools use the same vocabulary, borrowed from a style called BDD. You'll see it everywhere:

```js
import { describe, it, expect } from "vitest"; // or "@jest/globals"
import { add } from "./math.js";

describe("add", () => {
  it("sums two numbers", () => {
    expect(add(2, 3)).toBe(5);
  });

  it("handles negatives", () => {
    expect(add(-1, -1)).toBe(-2);
  });
});
```

*What just happened:* `describe` groups related tests under a label. `it` (its alias `test` is identical) declares one test with a sentence describing the behavior. `expect(...)` wraps the value you got, and `.toBe(...)` is the matcher that throws if it doesn't match. Read the `it` line as a sentence: "add sums two numbers." If that sentence is true after the test runs, it passes.

The naming matters more than it looks. A good `it` description tells a future reader *what the code is supposed to do*, so a failing test reads like a bug report: "add sums two numbers - FAILED." Write the sentence first, then make it true.

> **Jest vs Vitest, line one.** The only difference in the block above is the import: `vitest` vs `@jest/globals`. Jest also injects `describe`/`it`/`expect` as globals by default, so you often see no import at all. Vitest can do the same with `globals: true` in its config. The test bodies are otherwise identical - that sameness is the whole reason this guide covers both at once.

## Where the runner looks

A runner needs to know which files are tests. Both default to filename patterns: anything matching `*.test.js`, `*.spec.js` (and their `.ts`/`.jsx`/`.tsx` cousins), or files inside a `__tests__` folder.

```text
src/
  math.js
  math.test.js        ← found: matches *.test.js
  utils/
    format.ts
    format.spec.ts     ← found: matches *.spec.ts
  __tests__/
    routing.test.ts    ← found: inside __tests__
```

*What just happened:* you didn't register these files anywhere. You named them by convention and the runner discovered them. Co-locating `math.test.js` next to `math.js` is the common style - the test sits next to the thing it tests, so it's quick to find and stays in sync.

## Running it

You invoke the runner from an npm script. Both tools watch for changes during development and run once in CI.

```bash
# package.json scripts: { "test": "vitest" }  or  { "test": "jest" }
npm test              # Vitest watches by default; Jest runs once
npx vitest run        # run once and exit (what CI uses)
npx vitest            # interactive watch mode
npx jest --watch      # Jest's watch mode (opt-in)
```

*What just happened:* one command finds every test file, runs every `it`, and prints pass/fail counts plus the file and line of any failure. In watch mode the runner re-runs only the tests affected by the file you saved, which is why a tight test loop feels instant. Note the defaults differ: Vitest watches unless you say `run`; Jest runs once unless you say `--watch`.

For builders: keep `"test": "vitest"` (or `jest`) as your dev script and add `"test:ci": "vitest run --coverage"` for the pipeline. Same tool, two intentions - fast feedback locally, a clean one-shot run with coverage in CI. For where unit tests sit relative to integration and end-to-end tests, see [Unit, Integration, and E2E](/guides/unit-integration-e2e).

```quiz
[
  {
    "q": "At its core, what makes a test 'fail'?",
    "choices": ["The runner returns false", "An assertion throws an error", "console.log prints 'fail'", "The file is renamed"],
    "answer": 1,
    "explain": "A matcher like toBe throws when the value doesn't match; the runner catches that throw and marks the test failed."
  },
  {
    "q": "How does Jest or Vitest know which files are tests?",
    "choices": ["You list them in a manifest", "By filename patterns like *.test.js and __tests__ folders", "Any file that imports expect", "It runs every file in src/"],
    "answer": 1,
    "explain": "Both discover tests by convention: *.test/*.spec filenames and __tests__ directories, no manual registration."
  },
  {
    "q": "What is the relationship between describe and it?",
    "choices": ["describe runs code, it asserts", "describe groups and labels related tests, it declares one test", "it must come before describe", "They are interchangeable aliases"],
    "answer": 1,
    "explain": "describe is a labeled group of tests; each it (or test) is a single named behavior with its own assertions."
  }
]
```

[← Overview](_guide.md) | [Phase 2: The daily core →](02-matchers-mocks-async.md)
