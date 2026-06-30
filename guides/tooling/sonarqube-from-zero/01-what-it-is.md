---
title: "What SonarQube actually is"
guide: sonarqube-from-zero
phase: 1
summary: "The enterprise code-quality gate: static analysis for bugs, vulnerabilities, and code smells, with coverage and a quality gate that can block a merge."
tags: [sonarqube, static-analysis, code-quality, quality-gate, code-coverage, technical-debt, ci]
difficulty: intermediate
synonyms: ["sonarqube", "sonar scanner", "sonarcloud", "code quality gate", "static code analysis", "code smells", "technical debt", "sonar quality gate", "clean as you code"]
updated: 2026-06-30
---

# What SonarQube actually is

You open a pull request, the checks spin, and one of them is "SonarQube" with a red X. You click in and there's a dashboard: bugs, vulnerabilities, code smells, a coverage percentage, a duplication percentage, and a number labeled *technical debt* measured in days. Nobody told you what most of those mean. Before you fight any of it, here's the mental model.

SonarQube is two things bolted together. First, a **static analyzer**: it reads your source code without running it and flags patterns that tend to cause trouble. Second, a **quality gate**: a set of pass/fail conditions that turn all those findings into a single green check or red X on your PR. The analyzer is the opinion; the gate is the consequence. Most of the friction you feel comes from the gate, so keep the two separate in your head.

## Static analysis, plainly

Static analysis means reading code as text and structure, never executing it. The analyzer parses your files into a syntax tree, walks that tree, and matches it against a library of **rules**. A rule is a small pattern with a verdict, like "a `catch` block that swallows the exception and does nothing" or "a method with cyclomatic complexity over 15."

Because it never runs your code, it can scan a whole repository fast and find issues that only show up on rare paths. The flip side: it reasons about *shapes* of code, not actual behavior, so it both misses real bugs and flags things that are fine in context. Hold that thought - it explains most of phase 3.

```text
your source files
      │
      ▼
  parse into syntax tree
      │
      ▼
  match against rule set (the "quality profile")
      │
      ▼
  issues: bug | vulnerability | code smell | hotspot
      │
      ▼
  quality gate decides: pass or fail
```

*What just happened:* the analyzer turns text into a tree, runs rules over it, produces a list of issues, and the gate boils that list down to one verdict. Everything else is detail hanging off this pipeline.

## The five things it reports

SonarQube sorts findings into a handful of buckets. Knowing which bucket a finding lands in tells you how seriously to take it.

- **Bugs** - code that is likely wrong: a possible null dereference, an `if` whose two branches are identical, a resource never closed. These are correctness problems.
- **Vulnerabilities** - code that is likely a security hole: SQL built by string concatenation, a hardcoded credential, weak crypto. Treat these as real until proven otherwise.
- **Security hotspots** - code that *might* be a security risk but needs a human to judge. Not the same as a vulnerability (more on that distinction in phase 3).
- **Code smells** - maintainability problems: a 300-line method, a confusing name, dead code, a `TODO` left in. They don't break anything today; they make tomorrow harder.
- **Coverage and duplication** - not issues but measurements. Coverage is the percent of lines exercised by your tests (SonarQube reads this from a report your test runner produces). Duplication is the percent of lines that are copy-pasted blocks.

Each issue also carries a **severity** (from low up to blocker) and an estimated **remediation effort** in minutes. Add all those minutes up across the project and you get the **technical debt** number - the dashboard's headline "X days" is the analyzer's guess at how long fixing every smell would take. It's a rough signal, not a deadline.

> The single most useful habit: read an issue's *type* and *severity* before reacting. A blocker bug and a minor code smell both show up as findings, but only one should hold up your day.

## The quality profile and the gate

Two pieces of config decide what you see. The **quality profile** is which rules are switched on for a language - Sonar ships a sensible default (named "Sonar way") and your team may have its own. The **quality gate** is the set of pass/fail conditions evaluated after analysis, like "coverage on new code must be at least 80%" or "zero new blocker issues."

The gate is what gives Sonar teeth. Without a gate, the dashboard is a wall of advice you can ignore. With a gate wired into CI, a failing gate can mark your PR check red and, if the branch is protected, block the merge. That is the whole reason SonarQube feels like a wall instead of a linter.

```text
Gate: "Sonar way" (default, on new code)
  ✓ New bugs ............... = 0
  ✓ New vulnerabilities .... = 0
  ✗ New code coverage ...... ≥ 80%   (yours: 64%)  ← this one fails
  ✓ New duplicated lines ... ≤ 3%
Result: FAILED
```

*What just happened:* four conditions, three pass, one fails - and a single failing condition fails the whole gate. The red X on your PR almost always traces to one specific unmet condition, so the first move is always to find which one.

For builders: SonarQube and SonarCloud are the same engine in different clothes - SonarQube is the server you (or your platform team) host, SonarCloud is the hosted version. The scanner, rules, and gate concepts are identical, so everything in this guide applies to both.

```quiz
[
  {
    "q": "What does 'static analysis' mean in SonarQube?",
    "choices": ["It runs your tests and measures speed", "It reads your code as text and structure without executing it", "It analyzes production traffic in real time", "It only checks code formatting"],
    "answer": 1,
    "explain": "Static analysis parses source into a tree and matches rules against it, never running the code - which is why it's fast but also why it can produce false positives."
  },
  {
    "q": "Which finding type means 'likely a real correctness problem'?",
    "choices": ["Code smell", "Bug", "Coverage", "Duplication"],
    "answer": 1,
    "explain": "Bugs are likely-wrong code. Code smells are maintainability issues that don't break anything today; coverage and duplication are measurements, not issues."
  },
  {
    "q": "What turns SonarQube's list of findings into a single pass/fail check on a PR?",
    "choices": ["The quality profile", "The quality gate", "The technical-debt number", "The severity label"],
    "answer": 1,
    "explain": "The quality gate is the set of pass/fail conditions evaluated after analysis. The profile only decides which rules run; the gate decides the verdict."
  }
]
```

[← Overview](_guide.md) | [Phase 2: Scanning and the quality gate →](02-scanning-and-the-gate.md)
