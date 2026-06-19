---
title: "SQL Injection & XSS, Explained"
guide: "sql-injection-and-xss"
phase: 0
summary: "The two classic injection holes share one root cause — user input getting treated as code — and one cure: keep data as data. Learn the mental model, then how to close SQL injection with parameterized queries and XSS with context-aware output encoding."
tags: [security, sql-injection, xss, injection, parameterized-queries, output-encoding, web-security]
category: security
difficulty: intermediate
order: 6
synonyms: ["what is sql injection", "how to prevent sql injection", "what is xss", "how to prevent cross-site scripting", "parameterized queries vs string concatenation", "why is string concatenation in sql dangerous", "how does injection work"]
updated: 2026-06-19
---

# SQL Injection & XSS, Explained

You've heard both names a hundred times — they sit near the top of every security checklist — and you've
probably nodded along without ever being shown what's *actually* going wrong underneath. That's the gap
this guide closes. The reassuring part: SQL injection and Cross-Site Scripting are not two unrelated
monsters. They're the *same* bug wearing two costumes, and once you see the shared cause, both fixes stop
feeling like memorized rules and start feeling obvious.

The one idea: an injection bug happens when something you *meant* as plain data — a username, a comment, a
search term — gets handed to a machine that reads it as **instructions** instead. A database that reads your
input as SQL. A browser that reads your input as HTML and JavaScript. The cure, in both cases, is the same
sentence: **keep data as data, so it can never be mistaken for code.**

We'll explain each hole the way you'd want a careful teammate to explain it — enough of the mechanism to
truly understand it, and then the real, production-grade fix. This is defensive throughout: we show the
minimum needed to *see* the problem so you can *close* it.

## How to read this

- **Want to actually understand why these bugs exist?** Read in order. Phase 1 installs the one mental model
  both holes share; Phases 2 and 3 each take one hole and close it for good.
- **Already know the theory and just need the fix?** Jump to [Phase 2: SQL Injection](02-sql-injection.md)
  for parameterized queries, or [Phase 3: Cross-Site Scripting (XSS)](03-cross-site-scripting.md) for
  output encoding and CSP.

## The phases

1. **[The One Bug Underneath Both: Mixing Data with Code](01-the-one-bug-underneath-both.md)** — the unifying
   mental model. Injection is what happens when input is read as code; the fix is always "keep data as data."
2. **[SQL Injection](02-sql-injection.md)** — how a string-built query lets input rewrite the query's
   meaning, what an attacker gets, and the real fix: parameterized queries / prepared statements.
3. **[Cross-Site Scripting (XSS)](03-cross-site-scripting.md)** — how untrusted input rendered into a page
   runs as script in other people's browsers, the damage it does, and the real fix: context-aware output
   encoding, auto-escaping templates, and a Content-Security-Policy.

> This guide is the focused, two-holes-one-model deep dive. The broader catalog of web vulnerabilities —
> broken access control, misconfiguration, vulnerable dependencies, and the rest — lives in
> [The OWASP Top 10](/guides/owasp-top-10). If you want to brush up on what a `SELECT ... WHERE` query
> even is before Phase 2, see [Querying Basics: SELECT & WHERE](/guides/querying-basics-select-where).
