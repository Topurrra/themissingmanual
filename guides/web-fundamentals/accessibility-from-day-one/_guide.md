---
title: "Accessibility From Day One"
guide: "accessibility-from-day-one"
phase: 0
summary: "Accessibility isn't a checklist bolted on at the end - it's a byproduct of using HTML correctly. Learn why it matters, how ARIA and focus management fill the gaps semantic HTML leaves, and how to test with a real screen reader."
tags: [accessibility, a11y, aria, wcag, web-fundamentals, intermediate]
category: web-fundamentals
order: 9
difficulty: intermediate
synonyms: ["how to make a website accessible", "what is wcag", "aria for beginners", "web accessibility basics", "screen reader testing"]
updated: 2026-07-06
---

# Accessibility From Day One

A blind developer uses a screen reader to shop online every week. A warehouse worker with a repetitive
strain injury navigates his team's internal tools by keyboard because a mouse hurts. Someone with low
vision has the browser zoomed to 200%. None of them are edge cases - they're a normal slice of your
user base, and most of what they need comes free from writing HTML the way it was designed to be
written.

This guide assumes you already know HTML, CSS, and forms from
[HTML From Zero](/guides/html-from-zero), [CSS Without Tears](/guides/css-without-tears), and
[Forms That Work](/guides/forms-that-work). It builds on that foundation instead of re-explaining it.

## The phases

1. **[Why Accessibility Isn't Optional](01-why-accessibility-isnt-optional.md)** - who actually needs
   this, the four WCAG pillars in plain language, and why semantic HTML already does most of the work.
2. **[ARIA, Focus Management, and Keyboard Navigation](02-aria-focus-management-and-keyboard-navigation.md)**
   - the first rule of ARIA, `tabindex`, visible focus styles, and trapping focus in a modal.
3. **[Testing with a Screen Reader and Automated Tools](03-testing-with-a-screen-reader-and-automated-tools.md)**
   - turning on VoiceOver or NVDA and tabbing through a real page, plus what Lighthouse and axe can and
   can't catch.

By the end, you'll know which HTML choices buy accessibility automatically, when ARIA is the right tool
versus a crutch for bad markup, and how to verify a page actually works for someone who isn't using a
mouse or a monitor the way you are.
