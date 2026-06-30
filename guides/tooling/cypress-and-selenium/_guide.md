---
title: "Cypress and Selenium"
guide: cypress-and-selenium
phase: 0
summary: "Two more ways to test in a browser: Cypress's developer-friendly in-browser runner, and Selenium/WebDriver, the long-standing cross-language standard."
tags: [cypress, selenium, webdriver, e2e, browser-testing, qa, automation]
category: tooling
group: "Testing Tools"
order: 39
difficulty: intermediate
synonyms: ["cypress vs selenium", "selenium webdriver tutorial", "cypress e2e testing", "browser automation tools", "webdriver grid", "cypress vs playwright"]
updated: 2026-06-30
---

# Cypress and Selenium

You need to test a real app in a real browser, and somebody told you to "use Cypress" or "set up Selenium" without telling you what either of them actually is or why they're different. One runs inside the browser and gives you a gorgeous time-travel debugger. The other has been the cross-language industry standard since before most of your dependencies existed. They solve the same problem from opposite ends, and picking wrong means months of fighting your tools.

This guide gives you the mental model for both, shows you what writing and running tests actually feels like, and tells you honestly where each one breaks so you can choose without regret.

## How to read this

Read the phases in order the first time. Phase 1 builds the two mental models side by side so the rest makes sense. Phase 2 is the hands-on core: what real tests look like in each tool. Phase 3 is the reality check: limits, flake, scaling, and how both compare to Playwright. If you already know one tool, skim phase 1 and slow down on phase 3.

## The phases

1. [Two Tools, Two Architectures](01-two-tools-two-architectures.md) - the mental model: in-browser runner vs. the W3C standard.
2. [Writing and Running Tests](02-writing-and-running-tests.md) - what real Cypress and Selenium tests look like day to day.
3. [Limits, Flake, and Choosing](03-limits-flake-and-choosing.md) - where each breaks, how to scale, and how they stack up against Playwright.

[Phase 1: Two Tools, Two Architectures](01-two-tools-two-architectures.md) →
