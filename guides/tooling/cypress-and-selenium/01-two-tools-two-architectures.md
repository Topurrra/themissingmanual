---
title: "Cypress and Selenium"
guide: cypress-and-selenium
phase: 1
summary: "Two more ways to test in a browser: Cypress's developer-friendly in-browser runner, and Selenium/WebDriver, the long-standing cross-language standard."
tags: [cypress, selenium, webdriver, e2e, browser-testing, qa, automation]
difficulty: intermediate
synonyms: ["cypress vs selenium", "selenium webdriver tutorial", "cypress e2e testing", "browser automation tools", "webdriver grid", "cypress vs playwright"]
updated: 2026-06-30
---

# Two Tools, Two Architectures

Here's the situation you're probably in. You've got a web app. You want a test that opens a real page, clicks a button, fills a form, and checks that the right thing appears on screen. That's end-to-end testing, and if the words *unit*, *integration*, and *end-to-end* still feel fuzzy, the [unit-integration-e2e](/guides/unit-integration-e2e) guide draws the boundaries. This guide is about two specific tools for the *e2e* end of that spectrum: Cypress and Selenium.

People talk about them as if they're interchangeable. They're not. They're built on fundamentally different ideas about *where the test code lives relative to the browser*, and almost every difference in how they feel, what they can do, and where they fall apart traces back to that one architectural choice. Get this mental model right and the rest of the guide is detail.

## The one question that explains everything

When your test says "click the Submit button," something has to reach into the browser and make that click happen. The question is: **where does the code doing the reaching actually run?**

- **Cypress runs your test code *inside* the browser**, in the same run loop as your app. The test and the app share a process. When you ask Cypress to click something, it's not sending a command across a wire — it's already in the room.
- **Selenium runs your test code *outside* the browser**, as a separate program that sends commands to the browser over a network protocol. Your test is in one process; the browser is in another; a standardized protocol carries instructions between them.

That's it. That's the fork in the road. Hold onto it.

```text
  CYPRESS                          SELENIUM / WEBDRIVER
  ┌─────────────────────┐         ┌──────────┐   protocol   ┌──────────┐
  │  Browser            │         │ Your test│ ───────────► │ Browser  │
  │  ┌────────┐ ┌─────┐ │         │ (any     │   (HTTP/     │ (driver  │
  │  │ Your   │ │ App │ │         │  language)│    JSON)     │  inside) │
  │  │ test   │ │     │ │         └──────────┘ ◄─────────── └──────────┘
  │  └────────┘ └─────┘ │
  └─────────────────────┘
```

*What just happened:* the left box is one process — test and app together. The right side is two processes talking over a wire. Every tradeoff below grows out of this picture.

## What Selenium actually is (and why it's everywhere)

Selenium is old, and that's a compliment. It predates almost every modern testing tool, and over the years its remote-control protocol became **WebDriver** — a formal W3C standard. That word *standard* is the whole point.

Because WebDriver is a published spec, the browser vendors themselves ship the piece that obeys it. Chrome has `chromedriver`, Firefox has `geckodriver`, Edge has `msedgedriver`, Safari has one built in. Your Selenium test sends standard WebDriver commands; the browser's own driver carries them out. Nobody at the Selenium project has to reverse-engineer Chrome — Google maintains the Chrome side, Mozilla maintains the Firefox side.

Two big consequences fall out of being a cross-process standard:

- **Every language.** Since the test only speaks a protocol, the client library can be written in anything. Selenium has official bindings for Java, Python, JavaScript, C#, Ruby, and more. A Java shop writes Selenium in Java; a Python shop in Python. Same protocol underneath.
- **Every real browser, including remote ones.** The browser doesn't have to be on your machine. Point your test at a remote WebDriver endpoint and you're driving a browser somewhere else — which is exactly how **Selenium Grid** (more on that in phase 3) lets you run hundreds of tests across many browsers and machines at once.

```python
from selenium import webdriver
from selenium.webdriver.common.by import By

driver = webdriver.Chrome()              # launches a real Chrome via chromedriver
driver.get("https://example.com")
driver.find_element(By.NAME, "q").send_keys("hello")
driver.find_element(By.CSS_SELECTOR, "button[type=submit]").click()
print(driver.title)
driver.quit()                            # always quit — it's a separate process
```

*What just happened:* this Python program is not the browser. It launched a real Chrome, then sent it a sequence of WebDriver commands — navigate, find, type, click — and read the page title back across the protocol. The `driver.quit()` matters because the browser is a separate process that won't clean up after itself.

## What Cypress actually is (and why developers fall for it)

Cypress took the opposite bet. Instead of standing outside and shouting commands, it loads your app in a browser and **injects your test code into that same browser**. The test executes alongside your application, sharing the same JavaScript run loop and DOM.

Living inside the browser buys Cypress a set of conveniences that are genuinely hard to get from the outside:

- **Automatic waiting.** Cypress knows when the app is mid-render because it's right there. Commands retry until the thing you asked for exists or a timeout hits, so you rarely write explicit waits. This alone kills a huge category of timing flake (see the [flaky-tests](/guides/flaky-tests) guide).
- **Time-travel debugging.** The Cypress runner UI shows every command as a step, and you can hover over each one to see a *snapshot* of the DOM at that exact moment. Test failed on step 7? Hover step 6 and see what the page looked like before it broke.
- **Direct access to the app's internals.** Because it shares the process, Cypress can stub network calls, reach into app state, and assert on things an outside tool can't easily touch.

```javascript
describe('search', () => {
  it('finds a result', () => {
    cy.visit('https://example.com')
    cy.get('input[name=q]').type('hello')   // auto-waits for the input to exist
    cy.get('button[type=submit]').click()
    cy.contains('Results for hello')         // auto-retries until it appears or times out
  })
})
```

*What just happened:* no driver, no `quit`, no explicit waits. The `cy.*` commands queue up and run inside the browser; each one retries on its own until the DOM cooperates. That ergonomic difference is the whole reason developers reach for Cypress.

> The Cypress experience is so smooth that teams adopt it before checking whether its architecture fits their app. Phase 3 is where that bill comes due — same-origin limits and the single-tab model are direct costs of living inside the browser. The convenience and the constraints are the *same coin*.

## For builders: the tradeoff in one sentence

Cypress trades architectural reach for developer experience; Selenium trades developer experience for architectural reach. Cypress is a delight to write and debug but boxed in by the browser it lives in. Selenium can drive anything in any language but makes you assemble more of the machine yourself and manage the flake that comes with talking over a wire. Neither is "better" — they're optimized for different worlds, and phase 2 shows you what each world feels like to actually work in.

```quiz
[
  {
    "q": "What is the single architectural difference that explains most other differences between Cypress and Selenium?",
    "choices": [
      "Cypress is newer than Selenium",
      "Cypress runs test code inside the browser; Selenium runs it outside and sends commands over a protocol",
      "Cypress only supports JavaScript while Selenium supports CSS",
      "Selenium has a nicer debugging UI"
    ],
    "answer": 1,
    "explain": "Cypress shares the browser process with the app; Selenium is a separate process speaking the WebDriver protocol. Nearly every other difference follows from this."
  },
  {
    "q": "Why can Selenium tests be written in Java, Python, C#, Ruby, and more?",
    "choices": [
      "Selenium ships a compiler for each language",
      "The browser translates the test at runtime",
      "WebDriver is a standard protocol, so the client library can be written in any language",
      "Selenium converts everything to JavaScript first"
    ],
    "answer": 2,
    "explain": "Because the test only needs to speak the WebDriver protocol, the client binding can be implemented in any language. The browser's own driver obeys the standard."
  },
  {
    "q": "Where does Cypress's automatic waiting come from?",
    "choices": [
      "It guesses fixed sleep durations between commands",
      "It runs inside the browser and can retry commands until the DOM is ready",
      "It polls a remote server for readiness",
      "The W3C spec mandates it"
    ],
    "answer": 1,
    "explain": "Living in the same process as the app, Cypress sees render state directly and retries each command until it succeeds or times out — no manual sleeps."
  }
]
```

[← Overview](_guide.md) | [Phase 2: Writing and Running Tests →](02-writing-and-running-tests.md)
