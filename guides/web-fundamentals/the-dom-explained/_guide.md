---
title: "The DOM Explained"
guide: "the-dom-explained"
phase: 0
summary: "The DOM is the live, in-memory tree the browser builds from your HTML - and the thing JavaScript actually touches. Learn how it differs from the HTML source, how to select and change elements, and how events bubble."
tags: [dom, javascript, web-fundamentals, intermediate, events]
category: web-fundamentals
order: 5
difficulty: intermediate
synonyms: ["what is the dom", "how does the dom work", "dom vs html", "javascript dom manipulation", "event bubbling explained", "event delegation javascript"]
updated: 2026-07-06
---

# The DOM Explained

Open any page, right-click, choose "Inspect," and you're looking at the DOM - not the HTML file the
server sent, but a live tree of objects the browser built from it. JavaScript doesn't touch your HTML
source. It touches this tree. Change the tree, and the page changes, instantly, with no re-download and
no server involved.

This guide assumes you know basic JavaScript syntax - variables, functions, conditionals. If that's
still new, start with [JavaScript From Zero](/guides/javascript-from-zero) and come back. Here, the
focus is narrower: what the DOM is, how to select and modify elements in it, and how events travel
through it.

## The phases

1. **[The DOM Is Not the HTML](01-the-dom-is-not-the-html.md)** - the browser parses HTML into a tree of
   objects; that tree, not the original text, is what JavaScript sees. View Source vs. the Elements panel,
   and what happens when JavaScript changes the tree.
2. **[Selecting and Modifying Elements](02-selecting-and-modifying-elements.md)** - `querySelector` and
   `querySelectorAll`, `classList`, `textContent` vs. `innerHTML` (and the XSS risk of the latter), reading
   and writing inline styles.
3. **[Events: Listening, Bubbling, and Delegation](03-events-listening-bubbling-and-delegation.md)** -
   `addEventListener`, the event object, bubbling, and event delegation - one listener handling clicks for
   an entire list instead of one per item.

By the end, you'll read a page's real structure in devtools instead of guessing from the source, and
you'll know why professional codebases attach far fewer event listeners than you'd expect.
