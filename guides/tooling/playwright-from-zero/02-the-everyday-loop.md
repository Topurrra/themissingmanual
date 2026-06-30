---
title: "The everyday loop: write, run, debug"
guide: playwright-from-zero
phase: 2
summary: "Reliable browser end-to-end tests: auto-waiting locators that kill flakiness, cross-browser runs, tracing, and codegen to record a test by clicking."
tags: [playwright, e2e, testing, browser, automation, flaky-tests]
difficulty: intermediate
synonyms: ["playwright tutorial", "playwright vs selenium", "end to end testing", "browser automation testing", "playwright auto waiting", "playwright trace viewer", "playwright codegen"]
updated: 2026-06-30
---

# The everyday loop: write, run, debug

Phase 1 gave you the mental model. Now we live in the tool. The daily rhythm with Playwright is short: pick good locators, assert with web-first assertions, run a focused subset while you work, and when something breaks, open the trace instead of staring at a stack trace. Let's walk each piece.

## Picking locators that don't rot

A test is only as durable as the way it finds elements. Reach for locators in roughly this order, most resilient first:

```js
// Best: by accessible role + name (what the user perceives)
page.getByRole('button', { name: 'Save' });
page.getByRole('link', { name: 'Settings' });

// Great for forms: by associated label or placeholder
page.getByLabel('Email');
page.getByPlaceholder('Search products');

// User-visible text
page.getByText('Welcome back');

// Explicit test hook when nothing semantic fits
page.getByTestId('cart-total'); // matches data-testid="cart-total"
```

*What just happened:* each call returned a locator keyed to something stable - a role, a label, visible text, or an explicit test id. None of them depend on CSS classes or DOM nesting, so a restyle or a wrapper `<div>` won't break them.

> Avoid `page.locator('.btn-primary')` and deep CSS/XPath chains when you can. They're glued to your markup's current shape and snap the moment a developer refactors the HTML. `getByTestId` is the escape hatch when nothing semantic fits - add a `data-testid` attribute rather than reaching for a class.

When a locator could match several elements, narrow it instead of guessing an index:

```js
// Scope inside a region, then find within it
const row = page.getByRole('row', { name: 'Widget Pro' });
await row.getByRole('button', { name: 'Delete' }).click();
```

*What just happened:* chaining `row.getByRole(...)` searched only inside that one table row, so "Delete" resolved unambiguously even though the page has many Delete buttons.

## Web-first assertions: the other half of auto-waiting

You met auto-waiting on *actions*. Assertions get it too. The `expect()` calls that take a locator are **web-first** - they retry until the condition holds or the timeout hits. This is the difference between checking a value once (and racing the UI) and checking it patiently.

```js
// Retries automatically until visible - or fails with a clear timeout
await expect(page.getByText('Order confirmed')).toBeVisible();

// Other common web-first assertions
await expect(page.getByRole('button', { name: 'Save' })).toBeEnabled();
await expect(page.getByLabel('Email')).toHaveValue('ada@example.com');
await expect(page).toHaveURL(/\/dashboard/);
await expect(page.getByTestId('cart-total')).toHaveText('$42.00');
```

*What just happened:* each `await expect(locator)...` polled the page until the assertion passed. No `sleep` before checking the confirmation message - the assertion itself does the waiting.

The trap to avoid: don't pull a value out and assert on the plain value, because that snapshots a single moment.

```js
// Fragile: reads once, races the UI
const text = await page.getByTestId('cart-total').textContent();
expect(text).toBe('$42.00'); // may run before the total updates

// Solid: web-first, retries until the total settles
await expect(page.getByTestId('cart-total')).toHaveText('$42.00');
```

*What just happened:* the first version grabbed the text immediately and compared once - flaky if the total updates a beat later. The second keeps re-checking until the text matches or it times out.

## Codegen: record a test by clicking

You don't have to write the first draft by hand. `codegen` opens a browser, watches what you do, and emits the matching Playwright code with sensible locators already chosen.

```bash
npx playwright codegen https://example.com
```

*What just happened:* a browser window and an inspector opened side by side. As you clicked and typed, the inspector filled with real test code - `getByRole`, `getByLabel`, and the actions you performed - which you copy into a spec and clean up.

Treat codegen output as a **starting point**, not the final test. It captures the actions; you still add the assertions that say what *should* be true, and you trim any noise.

## Running tests while you work

You rarely run the whole suite during development. Run a slice:

```bash
# Everything
npx playwright test

# One file
npx playwright test tests/login.spec.ts

# By title substring
npx playwright test -g "log in"

# Watch it happen in a real browser window
npx playwright test --headed

# One browser only (faster feedback loop)
npx playwright test --project=chromium

# The interactive UI mode - the nicest way to develop
npx playwright test --ui
```

*What just happened:* each flag narrowed or changed how the run executes. `--ui` is the standout: it opens a panel where you pick tests, watch them step through, and inspect each action - the tightest write-run-debug loop Playwright offers.

By default tests run **headless** (no visible window) and in **parallel**, which is why a suite finishes fast. `--headed` and a single `--project` slow things down on purpose so you can see what's going on.

## The trace viewer: time-travel debugging

This is the feature that pays for itself the first time a test fails on CI and you can't reproduce it locally. A **trace** is a recorded bundle of everything that happened during a run - a DOM snapshot before and after every action, console logs, network requests, and screenshots. Open it and you scrub through the run like a video, clicking any step to see the page exactly as it was.

Turn it on in `playwright.config.ts`:

```js
// playwright.config.ts
export default defineConfig({
  use: {
    // Record a trace only when a test retried and still needs diagnosing
    trace: 'on-first-retry',
  },
});
```

*What just happened:* Playwright now captures a trace whenever a test fails and gets retried, so you get a recording of real failures without bloating every green run with trace files.

Then open whatever it captured:

```bash
# After a failing run, open the report (traces are linked from it)
npx playwright show-report

# Or open a specific trace file directly
npx playwright show-trace trace.zip
```

*What just happened:* `show-trace` launched the viewer with a timeline of every action. Clicking a step shows the before/after DOM snapshot, the locator that was used, network activity, and console output at that exact moment - so "why did this fail on CI?" becomes a thing you can watch instead of guess.

**In the wild:** the common workflow is `trace: 'on-first-retry'` in CI plus the HTML report uploaded as a build artifact. A test goes red, you download the report, open the trace, and within a minute you see the spinner that was still covering the button - no re-running CI ten times.

```quiz
[
  {
    "q": "Which locator strategy is the most resilient to a CSS restyle?",
    "choices": [
      "page.locator('.btn-primary')",
      "page.getByRole('button', { name: 'Save' })",
      "An XPath like //div[3]/button",
      "page.locator('#app > div > button:nth-child(2)')"
    ],
    "answer": 1,
    "explain": "Role + accessible name targets what the user perceives, not the markup's current classes or nesting, so styling changes don't break it."
  },
  {
    "q": "Why prefer `await expect(locator).toHaveText('$42.00')` over reading textContent and comparing?",
    "choices": [
      "It is shorter to type",
      "It only works in headed mode",
      "It is web-first and retries until the text matches or times out, avoiding a race with the UI",
      "It captures a screenshot automatically"
    ],
    "answer": 2,
    "explain": "Web-first assertions poll until the condition holds, so they don't snapshot a single moment before the UI has updated."
  },
  {
    "q": "What does the trace viewer give you that a stack trace does not?",
    "choices": [
      "A faster test run",
      "A scrubbable recording with before/after DOM snapshots, network, and console for each action",
      "Automatic fixing of the failing test",
      "A way to run tests in the cloud"
    ],
    "answer": 1,
    "explain": "A trace records the full run so you can step through every action and see the page exactly as it was at the moment of failure."
  }
]
```

[← Phase 1](01-the-mental-model.md) | [Overview](_guide.md) | [Phase 3: Production reality →](03-production-reality.md)
