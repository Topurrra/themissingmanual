---
title: "Cypress and Selenium"
guide: cypress-and-selenium
phase: 2
summary: "Two more ways to test in a browser: Cypress's developer-friendly in-browser runner, and Selenium/WebDriver, the long-standing cross-language standard."
tags: [cypress, selenium, webdriver, e2e, browser-testing, qa, automation]
difficulty: intermediate
synonyms: ["cypress vs selenium", "selenium webdriver tutorial", "cypress e2e testing", "browser automation tools", "webdriver grid", "cypress vs playwright"]
updated: 2026-06-30
---

# Writing and Running Tests

Phase 1 gave you the why. Now the day-to-day. You'll spend most of your time doing four things: finding elements, acting on them, waiting for the app to catch up, and asserting that something is true. Each tool has a distinct rhythm for those four, and once you feel the rhythm, both tools become predictable.

We'll walk the same little flow in each — open a page, search, check a result — and point out where the experience genuinely diverges.

## Getting each one running

Cypress installs as a single npm dev dependency and brings its own bundled browser plus a runner. There's no separate driver to manage.

```bash
npm install --save-dev cypress
npx cypress open      # opens the interactive runner with time-travel UI
npx cypress run       # headless, for CI — prints results to the terminal
```

*What just happened:* one install gave you the test framework, the assertion library, and a browser, all wired together. `open` is for writing and debugging; `run` is what your CI uses.

Selenium needs two pieces: a client library in your language and the browser's driver. Modern Selenium can fetch the matching driver for you (Selenium Manager), which removes the old headache of version-matching `chromedriver` to your Chrome by hand.

```bash
pip install selenium          # the Python client binding
# No manual chromedriver download — Selenium Manager resolves it on first run.
python my_test.py             # runs as a plain program; pair with pytest for structure
```

*What just happened:* Selenium isn't a test runner — it's a browser-control library. You bring your own test framework (pytest, JUnit, NUnit) to organize and report. That's more assembly, and also more freedom.

## Finding elements: the shared vocabulary

Both tools locate elements with familiar selectors — CSS selectors most of the time, occasionally XPath or by-text. The mental difference is what you get *back*.

Selenium returns an **element object right now**. If the element isn't there yet, you get an error unless you've set up waiting (next section).

```python
from selenium.webdriver.common.by import By

el = driver.find_element(By.CSS_SELECTOR, "input[name=q]")   # found now, or raises
el.send_keys("hello")
```

*What just happened:* `find_element` resolved immediately to a concrete handle. There's no retry baked in — the lookup is a single attempt at that instant.

Cypress returns a **chainable subject that retries**. `cy.get` doesn't hand you an element so much as a promise-like queue that keeps re-querying until the element shows up.

```javascript
cy.get('input[name=q]').type('hello')   // re-queries until the input exists, then types
```

*What just happened:* you never held a stale handle. Cypress kept asking the DOM for `input[name=q]` until it appeared, then typed into it. This is the ergonomic gap you'll feel most.

> A durable habit across both tools: select by a dedicated test attribute like `data-test="search-input"`, not by CSS classes or text that designers change weekly. Selectors tied to styling are the quiet source of half your future breakage.

## Waiting: the part that separates calm tests from flaky ones

This is where the architecture from phase 1 shows up most. In Cypress, waiting is mostly automatic and you rarely write it. In Selenium, **you must wait deliberately**, and the single biggest mistake new Selenium users make is reaching for a fixed sleep.

Here is the wrong way and the right way, side by side:

```python
import time
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By

# WRONG — a fixed sleep is either too short (flaky) or too long (slow)
time.sleep(5)
driver.find_element(By.CSS_SELECTOR, "button[type=submit]").click()

# RIGHT — an explicit wait polls until the condition is true, then proceeds
wait = WebDriverWait(driver, timeout=10)
btn = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button[type=submit]")))
btn.click()
```

*What just happened:* the sleep gambles on a guess and loses both ways. The explicit wait polls the page repeatedly for up to ten seconds and continues the instant the button is clickable — fast when the app is fast, patient when it's slow. If your Selenium suite is flaky, this pattern fixes most of it. The [flaky-tests](/guides/flaky-tests) guide goes deeper on why fixed sleeps are a trap.

Selenium also offers an **implicit wait** (a global default applied to every `find_element`), but mixing implicit and explicit waits causes confusing timeouts. Pick explicit waits and stick with them.

Cypress, by contrast, handles this for you because it's inside the browser:

```javascript
cy.get('button[type=submit]').click()    // already waits for existence + actionability
cy.contains('Results for hello')          // retries the assertion until it passes or times out
```

*What just happened:* both lines retry internally. You wrote zero wait code and got the polling behavior Selenium made you spell out. Avoid `cy.wait(5000)` for the same reason you avoid `time.sleep` — it's the one anti-pattern Cypress can't save you from.

## Asserting: same idea, different ergonomics

Selenium hands the value back to your test framework, and you assert with that framework's tools.

```python
assert "Results for hello" in driver.page_source
title = driver.title
assert title == "Example Domain"
```

*What just happened:* Selenium gave you raw values; pytest's `assert` did the checking. The assertion runs once, against whatever the page held at that instant — which is why the *wait* before it matters so much.

Cypress folds assertions into the same retrying chain, so the assertion and the waiting are one motion.

```javascript
cy.get('[data-test="result"]').should('contain.text', 'Results for hello')
cy.title().should('eq', 'Example Domain')
```

*What just happened:* `should` doesn't check once — it retries the whole `get` + assertion until it passes or the timeout fires. The wait and the check are the same operation, which is the core reason Cypress assertions feel less brittle.

## A full Cypress test, end to end

```javascript
describe('product search', () => {
  beforeEach(() => {
    cy.visit('/search')
  })

  it('shows matching products', () => {
    cy.get('[data-test="search-input"]').type('keyboard')
    cy.get('[data-test="search-button"]').click()
    cy.get('[data-test="result-card"]').should('have.length.at.least', 1)
    cy.contains('[data-test="result-card"]', 'keyboard')
  })
})
```

*What just happened:* `beforeEach` reset state before the test, then the body searched and asserted. Every command auto-waited, so there isn't a single explicit timing line — that's a representative, readable Cypress test.

## The same flow in Selenium with pytest

```python
import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

@pytest.fixture
def driver():
    d = webdriver.Chrome()
    yield d
    d.quit()                                  # teardown — the separate process must be closed

def test_shows_matching_products(driver):
    driver.get("http://localhost:3000/search")
    wait = WebDriverWait(driver, 10)
    driver.find_element(By.CSS_SELECTOR, '[data-test="search-input"]').send_keys("keyboard")
    driver.find_element(By.CSS_SELECTOR, '[data-test="search-button"]').click()
    cards = wait.until(EC.presence_of_all_elements_located(
        (By.CSS_SELECTOR, '[data-test="result-card"]')))
    assert len(cards) >= 1
    assert "keyboard" in cards[0].text.lower()
```

*What just happened:* the `driver` fixture owns startup and the all-important `quit`. The test reads almost like the Cypress one, but you supplied the framework (pytest), the explicit wait, and the cleanup yourself. More wiring, and in exchange you could swap `pytest` for Java + JUnit and run the identical idea in another language.

## In the wild

Real suites layer two habits on top of these basics. First, the **Page Object pattern**: wrap each page's selectors and actions in a class (`SearchPage.search("keyboard")`) so a redesign changes one file, not fifty tests. Both tools use it; Selenium teams especially live by it. Second, **stub the network for speed and determinism** — Cypress does this natively with `cy.intercept`, while Selenium leans on a proxy or backend test mode. A test that hits the real backend is a test that fails when the backend has a bad day.

```quiz
[
  {
    "q": "Why is `time.sleep(5)` an anti-pattern in Selenium tests?",
    "choices": [
      "Selenium forbids importing the time module",
      "A fixed sleep is either too short (flaky) or too long (slow); an explicit wait polls and proceeds as soon as the condition is met",
      "It only works in Python, not Java",
      "Sleeps disable the WebDriver protocol"
    ],
    "answer": 1,
    "explain": "Fixed sleeps guess at timing and lose both ways. WebDriverWait polls until the condition holds, so it's fast when the app is fast and patient when it's slow."
  },
  {
    "q": "What is the practical difference between Selenium's find_element and Cypress's cy.get?",
    "choices": [
      "find_element resolves once immediately (or errors); cy.get returns a chainable subject that retries until the element appears",
      "They are identical in behavior",
      "cy.get only works with XPath",
      "find_element automatically waits but cy.get does not"
    ],
    "answer": 0,
    "explain": "find_element is a single attempt at that instant. cy.get keeps re-querying the DOM until the element exists or the timeout fires — that's Cypress's built-in waiting."
  },
  {
    "q": "Why must a Selenium test call driver.quit() (often in a fixture teardown)?",
    "choices": [
      "To save the test report to disk",
      "Because the browser runs as a separate process that won't clean itself up",
      "It resets CSS selectors for the next test",
      "It is required by the assert statement"
    ],
    "answer": 1,
    "explain": "Selenium drives a browser in a separate process. Without quit, those browser processes leak and pile up across a run."
  }
]
```

[← Phase 1: Two Tools, Two Architectures](01-two-tools-two-architectures.md) | [Overview](_guide.md) | [Phase 3: Limits, Flake, and Choosing →](03-limits-flake-and-choosing.md)
