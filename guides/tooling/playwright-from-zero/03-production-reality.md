---
title: "Playwright, From Zero"
guide: playwright-from-zero
phase: 3
summary: "Reliable browser end-to-end tests: auto-waiting locators that kill flakiness, cross-browser runs, tracing, and codegen to record a test by clicking."
tags: [playwright, e2e, testing, browser, automation, flaky-tests]
difficulty: intermediate
synonyms: ["playwright tutorial", "playwright vs selenium", "end to end testing", "browser automation testing", "playwright auto waiting", "playwright trace viewer", "playwright codegen"]
updated: 2026-06-30
---

# Production reality: the things that bite

A handful of passing tests on your laptop is one thing. A suite that runs on every pull request, stays fast, and doesn't cry wolf is another. This phase is the gap between the two: how to skip logging in on every test, how parallelism really works, how to stop depending on a flaky backend, and the traps that catch almost everyone once.

## Don't log in a hundred times — reuse auth state

If every test starts by filling the login form, your suite is slow and the login flow is tested a hundred redundant times. The fix: log in once, save the browser's storage (cookies and localStorage) to a file, and load it into every test. Playwright calls this **storage state**.

```js
// auth.setup.ts — runs once before the tests that need a logged-in user
import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  await page.goto('https://example.com/login');
  await page.getByLabel('Email').fill('ada@example.com');
  await page.getByLabel('Password').fill('correct-horse');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

  // Persist cookies + localStorage to disk
  await page.context().storageState({ path: authFile });
});
```

*What just happened:* a setup test logged in like a normal user, then wrote the resulting cookies and localStorage to `user.json`. Every test that loads this file starts already authenticated — the login form runs once, not once per test.

Wire it up in the config so real tests depend on it and inherit the saved state:

```js
// playwright.config.ts
export default defineConfig({
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: 'playwright/.auth/user.json' },
      dependencies: ['setup'],
    },
  ],
});
```

*What just happened:* the `chromium` project depends on `setup`, so Playwright runs the login once first, then runs every chromium test with the saved storage state already loaded. (Add `playwright/.auth/` to `.gitignore` — those files hold session credentials.)

## Fixtures: the `page` you've been getting for free

Every test so far destructured `{ page }`. That `page` is a **fixture** — a piece of test environment Playwright builds for you, fresh per test, and tears down afterward. Built-in fixtures include `page`, `context` (an isolated browser session), and `browser`. The point of per-test fixtures is **isolation**: each test gets a clean context with no leftover cookies or state from the last one, which is a huge source of cross-test flakiness eliminated by default.

You can define your own to remove repeated setup:

```js
// Provide an already-on-the-dashboard page to any test that asks for it
import { test as base } from '@playwright/test';

export const test = base.extend({
  dashboardPage: async ({ page }, use) => {
    await page.goto('/dashboard');     // setup
    await use(page);                   // hand it to the test
    // any teardown would go here, after use()
  },
});
```

*What just happened:* `dashboardPage` is a custom fixture. A test that asks for `{ dashboardPage }` receives a page already navigated to the dashboard, and the setup lives in one place instead of being copy-pasted into every test.

## Parallelism and isolation

By default Playwright runs test **files** in parallel across multiple worker processes, and each test gets its own isolated browser context. Fast, but it has consequences you need to respect:

- **Tests must not depend on each other or on order.** A worker may run any file at any time. Shared state between tests is a bug waiting to surface.
- **Watch for shared backend data.** If two parallel tests both create a user named `test@example.com`, they collide. Generate unique data per test (a timestamp or random suffix) or scope to per-worker data.

You control the degree of parallelism when you need to:

```bash
# Limit workers (e.g. a resource-constrained CI box)
npx playwright test --workers=2

# Force fully serial for one stubborn file (last resort)
# test.describe.configure({ mode: 'serial' }) inside the file
```

*What just happened:* `--workers=2` capped parallelism for the whole run. `mode: 'serial'` is the in-file escape hatch when tests genuinely must share order — use it sparingly, because serial mode also means one failure skips the rest of that group.

## Stop depending on a flaky backend: mock the network

E2E tests that hit a real API inherit that API's flakiness and slowness. When you're testing the *front end's* behavior — does it render this data, does it handle this error — intercept the request and return a fixed response. This makes the test fast, deterministic, and able to exercise error states you can't easily trigger for real.

```js
test('shows empty state when no orders', async ({ page }) => {
  // Intercept the API call and return controlled data
  await page.route('**/api/orders', async (route) => {
    await route.fulfill({ json: [] });
  });

  await page.goto('/orders');
  await expect(page.getByText('No orders yet')).toBeVisible();
});
```

*What just happened:* `page.route(...)` caught the request to `/api/orders` and answered with an empty array — no real backend involved. The test then asserted the empty-state message, deterministically, every run.

> Mock for front-end behavior tests; keep a few unmocked, full-stack "smoke" tests that hit the real system end to end. The mocked tests give you speed and coverage of edge cases; the smoke tests prove the pieces actually connect. You want both, not one or the other.

## Cross-browser, for real

Phase 1 promised cross-browser. Here's the cost-benefit. Add the engines as projects:

```js
// playwright.config.ts
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit',   use: { ...devices['Desktop Safari'] } },
],
```

*What just happened:* every test now runs three times, once per engine, catching the Safari-only and Firefox-only bugs that Chromium-only suites miss. The tradeoff is roughly triple the runtime — many teams run all three on the main branch and a single engine on routine pull requests.

## CI and the classic traps

Running in CI is a config detail and a few hard-won lessons:

```bash
# In CI: install browsers with their OS dependencies
npx playwright install --with-deps

# Run; CI mode enables retries/reporters per your config
npx playwright test
```

*What just happened:* `--with-deps` installed the system libraries the browsers need on a bare CI image — the single most common reason a suite that works locally explodes on first CI run.

The traps that catch nearly everyone at least once:

- **Real waits sneaking back in.** `await page.waitForTimeout(2000)` is the new `sleep` — it's in the API for rare cases, but if it's in normal tests you've reintroduced flakiness. Use web-first assertions instead. See /guides/flaky-tests for the full pattern.
- **Asserting on a value instead of a locator.** Re-read phase 2's `toHaveText` vs `textContent` example; this is the number-one source of "passes locally, fails in CI."
- **Order-dependent tests.** They pass serially on your machine and fail under parallel workers. Make each test self-contained.
- **Committing auth/storage-state files.** They contain live session tokens. Gitignore them and regenerate in CI.
- **Strict-mode violations.** If a locator matches more than one element, Playwright errors on purpose rather than silently picking the first. That error is a feature — narrow the locator (scope it, or use an accessible name) instead of suppressing it.

**For builders:** a healthy suite is mostly mocked behavior tests for speed, a thin layer of real-backend smoke tests for confidence, `trace: 'on-first-retry'` so failures are diagnosable, and storage-state auth so it stays fast. Get those four right and your E2E tests become something the team trusts instead of mutes.

```quiz
[
  {
    "q": "Why save and reuse storage state across tests?",
    "choices": [
      "To run tests in parallel",
      "To log in once and start every test already authenticated, instead of running the login flow in every test",
      "To record a trace of the login",
      "To mock the network"
    ],
    "answer": 1,
    "explain": "Storage state persists cookies and localStorage so tests load an authenticated session rather than re-running the slow login each time."
  },
  {
    "q": "What is the main risk introduced by running tests in parallel?",
    "choices": [
      "Tests run too slowly",
      "Traces stop being recorded",
      "Tests that depend on order or share backend data collide because workers run files in any order",
      "Locators stop auto-waiting"
    ],
    "answer": 2,
    "explain": "Parallel workers run files in arbitrary order, so order-dependent or shared-state tests break. Each test must be self-contained."
  },
  {
    "q": "When does `page.route(...)` to mock an API make the most sense?",
    "choices": [
      "For every test, to avoid ever touching the backend",
      "When testing front-end behavior deterministically, including error states, while keeping a few real-backend smoke tests",
      "Only in CI, never locally",
      "Only to speed up the login flow"
    ],
    "answer": 1,
    "explain": "Mock to make front-end behavior tests fast and deterministic and to exercise hard-to-trigger states, but keep some unmocked smoke tests that prove the real system connects."
  }
]
```

[← Phase 2](02-the-everyday-loop.md) | [Overview](_guide.md)
