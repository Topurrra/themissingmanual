---
title: "Browser Storage and Cookies"
guide: "browser-storage-and-cookies"
phase: 0
summary: "How browsers remember things between page loads: cookies and their security attributes, localStorage/sessionStorage/IndexedDB, and which one to reach for depending on what you're storing."
tags: [cookies, localstorage, sessionstorage, indexeddb, web-fundamentals, intermediate]
category: web-fundamentals
order: 10
difficulty: intermediate
synonyms: ["cookies vs localstorage", "how do cookies work", "when to use indexeddb", "httponly secure samesite explained", "where to store auth token in browser"]
updated: 2026-07-06
---

# Browser Storage and Cookies

Every time a site remembers you're logged in, remembers your dark mode setting, or keeps a shopping
cart alive across tabs, it's using one of a handful of browser storage mechanisms. Pick the wrong one
and you leak an auth token to a malicious script, or lose a user's cart the moment they close a tab.

This guide covers the four tools browsers give you to persist data: cookies, `localStorage`,
`sessionStorage`, and IndexedDB. Each has a different lifetime, size limit, and threat model. The
skill isn't memorizing APIs - it's knowing which one fits a given piece of data.

## What you'll learn

1. **Cookies: What They Are and Why They Got Complicated** - the `name=value` string that rides along
   on every matching request, and the attributes (`HttpOnly`, `Secure`, `SameSite`) that keep that
   automatic behavior from becoming a liability.
2. **localStorage, sessionStorage, and IndexedDB** - the three client-side storage APIs, their limits,
   and when localStorage's simplicity stops being enough.
3. **Choosing the Right Storage for the Job** - a decision guide mapping real data (auth tokens, UI
   preferences, offline datasets) to the right mechanism, worked through end to end.

## Who this is for

You've worked through the DOM and forms guides and you're comfortable with JavaScript reading and
writing values. This guide assumes that baseline and builds the storage layer on top of it.

Ready? Start with [Phase 1: Cookies](01-cookies-explained.md).
