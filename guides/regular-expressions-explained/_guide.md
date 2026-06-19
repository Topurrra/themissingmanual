---
title: "Regular Expressions, Explained"
guide: "regular-expressions-explained"
phase: 0
summary: "A regex is a pattern that describes the shape of text — not code you run, but text you describe. Learn the mental model, the small toolkit you'll use 90% of the time, and how to avoid the classic traps."
tags: [regex, regular-expressions, pattern-matching, text, beginner-friendly]
category: programming-concepts
order: 4
difficulty: beginner
synonyms: ["what is a regex", "how do regular expressions work", "regex for beginners", "understand regular expressions", "learn regex", "regex explained simply"]
updated: 2026-06-19
---

# Regular Expressions, Explained

You've seen them: a wall of slashes, backslashes, and dollar signs like `^\d{4}-\d{2}-\d{2}$` —
and your stomach sank a little. Regular expressions have a reputation for being write-only magic
that only wizards understand. That reputation is undeserved. A regex is one small idea wearing a
scary costume, and once you see the idea, the costume stops working on you.

This guide makes regex readable instead of terrifying. We'll start with what a regex *actually is*
(a pattern that describes a *shape* of text), learn the handful of pieces you'll reach for almost
every time, and then meet the real-world traps — greedy matching, escaping, and regex that turns
into gibberish — so they don't bite you.

## How to read this

- **Just need to recognize the pieces?** Skim [Phase 2: The Core Toolkit](02-the-core-toolkit.md) —
  it's a tour of every symbol you'll actually use, each with a tiny example.
- **Want it to finally make sense?** Read in order. Each phase builds on the last, and the whole
  thing rests on the one idea in Phase 1.

## The phases

1. **[What a Regex Actually Is](01-what-a-regex-actually-is.md)** — the mental model: you're
   describing the *shape* of text, not writing code. With a tiny first example you can see match
   and not-match against.
2. **[The Core Toolkit](02-the-core-toolkit.md)** — the pieces you'll use 90% of the time:
   literals, character classes, quantifiers, anchors, and groups — built up to matching something
   real, and an honest word on why "the perfect email regex" is a trap.
3. **[Using Regex for Real (and the Gotchas)](03-using-regex-for-real.md)** — where you meet regex
   (editors, `grep`, code), and the classic traps: greedy vs lazy matching, escaping special
   characters, and regex becoming unreadable — with the cure for each.

> Deeper material — lookahead/lookbehind, backreferences, the differences between regex flavors
> (PCRE vs JavaScript vs POSIX), and catastrophic backtracking — is deliberately left for a
> follow-up guide. You can do an enormous amount of real work with only what's here.

Related reading: [Programming From Zero](/guides/programming-from-zero) for the basics underneath
this, and [The Terminal and Shell](/guides/the-terminal-and-shell) for using regex with tools like
`grep`.
