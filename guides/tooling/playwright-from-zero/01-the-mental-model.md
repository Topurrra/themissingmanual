---
title: "The mental model: a browser you can boss around"
guide: playwright-from-zero
phase: 1
summary: "Reliable browser end-to-end tests: auto-waiting locators that kill flakiness, cross-browser runs, tracing, and codegen to record a test by clicking."
tags: [playwright, e2e, testing, browser, automation, flaky-tests]
difficulty: intermediate
synonyms: ["playwright tutorial", "playwright vs selenium", "end to end testing", "browser automation testing", "playwright auto waiting", "playwright trace viewer", "playwright codegen"]
updated: 2026-06-30
---

# The mental model: a browser you can boss around

Here's the situation you're probably in. Your app works when you click through it by hand. But you want a machine to click through it too — log in, add an item to the cart, check the total — so you find out the moment a deploy breaks the checkout flow. That's an **end-to-end (E2E) test**: it drives a real browser the way a real user would, and asserts that the right things happened.

Playwright is a library and test runner for exactly that. You write code that says "go to this URL, fill this box, click that button, and the page should now show 'Order confirmed'." Playwright opens an actual browser, performs those actions, and checks the result.

## What Playwright actually is

Strip away the marketing and Playwright is three things bolted together:

- A **driver** that controls real browser engines — Chromium (Chrome/Edge), Firefox, and WebKit (Safari) — over a fast, low-level protocol.
- A **test runner** (`@playwright/test`) that finds your test files, runs them in parallel, retries failures if you ask it to, and produces reports.
- A pile of **debugging tooling** — codegen, the inspector, and the trace viewer — that makes a broken test cheap to diagnose instead of a mystery.

You install it with one command, and it downloads the browser binaries it controls so you're not depending on whatever Chrome happens to be on the machine.

```bash
# In an existing project
npm init playwright@latest

# It scaffolds a config, an example test, and downloads browsers
# Then run the example suite:
npx playwright test
```

*What just happened:* the init command created `playwright.config.ts`, a `tests/` folder with a sample spec, and pulled down pinned Chromium, Firefox, and WebKit builds. `npx playwright test` ran every spec it found against those browsers.

## Why auto-waiting is the entire point

This is the part that matters, so slow down here.

The classic E2E nightmare is **flakiness**: a test that passes and fails without the code changing. The root cause is almost always timing. The page hasn't finished loading, a button isn't clickable yet because a spinner is on top of it, an element exists in the DOM but is still `display: none`. Older tools made you guess how long to wait. You'd write `sleep(2000)` and pray. Too short and it's flaky; too long and your suite crawls.

Playwright's answer is the **locator**, and locators **auto-wait**. A locator isn't the element — it's a *recipe* for finding the element, evaluated fresh every time you act on it. Before Playwright clicks, it automatically waits for the element to be present, visible, stable (not animating), enabled, and actually able to receive the click. Only then does it click. If those conditions aren't met within the timeout, you get a clear error instead of a silent misclick.

```js
// A locator: a description, not a snapshot
const submit = page.getByRole('button', { name: 'Submit' });

// click() auto-waits: present + visible + stable + enabled + not obscured
await submit.click();
```

*What just happened:* `getByRole(...)` built a locator but touched nothing yet. `click()` ran the actionability checks, waited until the button was genuinely clickable, then clicked — no `sleep`, no manual wait, no flake from "the spinner was still up."

> The mental shift: you stop telling the browser *when* to act and start telling it *what must be true* before it acts. Playwright fills in the waiting. Most flakiness you've ever fought disappears at this layer.

For the bigger picture of where E2E sits next to unit and integration tests, see /guides/unit-integration-e2e. For the deeper anatomy of why tests flake and how to fight it, /guides/flaky-tests goes further than we will here.

## Why it largely displaced Selenium for new projects

Selenium pioneered browser automation and still runs huge suites in production. But for *new* projects, teams keep reaching for Playwright, and the reasons are concrete, not fashion:

- **Auto-waiting is built in.** With Selenium you assemble explicit waits yourself; getting them right everywhere is the hard part. Playwright bakes the right waits into every action.
- **One install, pinned browsers.** No separate driver binaries to version-match against your browser.
- **First-class tooling.** Codegen records a test by watching you click; the trace viewer lets you scrub through a failed run frame by frame. We'll use both in phase 2.
- **Cross-browser from day one.** The same test runs on Chromium, Firefox, and WebKit by flipping a config option.

None of this means Selenium is wrong. It means Playwright removed the most painful day-to-day friction, and that's why greenfield suites tend to start here.

## A whole test, start to finish

Here's a complete, realistic test so the shape is concrete before phase 2 zooms in.

```js
import { test, expect } from '@playwright/test';

test('user can log in', async ({ page }) => {
  await page.goto('https://example.com/login');
  await page.getByLabel('Email').fill('ada@example.com');
  await page.getByLabel('Password').fill('correct-horse');
  await page.getByRole('button', { name: 'Log in' }).click();

  // web-first assertion: retries until true or times out
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});
```

*What just happened:* the test got a fresh `page` (an isolated browser tab), navigated, filled two fields by their labels, clicked Log in, then asserted the Dashboard heading appears. Every step auto-waited, so there's not a single `sleep` and nothing to make it flaky.

**For builders:** notice the test reads like a sentence describing user behavior. That's deliberate — locators like `getByRole` and `getByLabel` target what the user sees and what assistive tech announces, not brittle CSS classes that change every time someone touches the styling.

```quiz
[
  {
    "q": "What is a Playwright locator?",
    "choices": [
      "A snapshot of an element captured the moment you create it",
      "A reusable recipe for finding an element, re-evaluated each time you act on it",
      "A CSS selector that must be unique on the page",
      "A screenshot used for visual comparison"
    ],
    "answer": 1,
    "explain": "A locator describes how to find an element and is resolved fresh on each action, which is what makes auto-waiting possible."
  },
  {
    "q": "Why does auto-waiting reduce flakiness?",
    "choices": [
      "It runs tests more slowly so the page has time to settle",
      "It disables animations globally",
      "Before acting, it waits for the element to be present, visible, stable, and actionable instead of you guessing a fixed delay",
      "It retries the entire test file three times"
    ],
    "answer": 2,
    "explain": "Auto-waiting replaces fixed sleeps with condition checks, removing the timing guesswork that causes most flaky failures."
  },
  {
    "q": "What does `npm init playwright@latest` set up?",
    "choices": [
      "Only a config file, no browsers",
      "A config, a sample test, and pinned browser binaries it downloads",
      "A connection to your system's installed Chrome only",
      "A cloud account for running tests remotely"
    ],
    "answer": 1,
    "explain": "The init command scaffolds config and a sample spec and downloads its own pinned Chromium, Firefox, and WebKit builds."
  }
]
```

[← Overview](_guide.md) | [Phase 2: The everyday loop →](02-the-everyday-loop.md)
