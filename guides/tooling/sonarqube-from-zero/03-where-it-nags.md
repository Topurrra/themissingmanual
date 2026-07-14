---
title: "Where it nags and how to tame it"
guide: sonarqube-from-zero
phase: 3
summary: "The enterprise code-quality gate: static analysis for bugs, vulnerabilities, and code smells, with coverage and a quality gate that can block a merge."
tags: [sonarqube, static-analysis, code-quality, quality-gate, code-coverage, technical-debt, ci]
difficulty: intermediate
synonyms: ["sonarqube", "sonar scanner", "sonarcloud", "code quality gate", "static code analysis", "code smells", "technical debt", "sonar quality gate", "clean as you code"]
updated: 2026-06-30
---

# Where it nags and how to tame it

You now know the model and the loop. This is the part where SonarQube and your afternoon disagree: a finding you're sure is wrong, a coverage number that won't move, a "security hotspot" that demands a meeting, and a gate that blocks a merge you needed an hour ago. None of it is mysterious once you know the moves.

## False positives, and the right way to dismiss

The analyzer reasons about shapes, not behavior, so it sometimes flags code that's correct in context. The wrong reaction is to disable the rule globally - that blinds the whole team to a useful check because one case annoyed you. The right reaction is to resolve the *single issue* with a reason.

In the SonarQube UI you can mark an issue **Won't Fix** or **False Positive**, with a comment. That's the record of a human decision, and it sticks across future scans. As a last resort there's inline suppression in code:

```text
// In Java, the standard suppression:
@SuppressWarnings("java:S2589")   // rule key; condition is always-true by design here

# In a properties/exclusion file, exclude a path from a rule:
sonar.issue.ignore.multicriteria=e1
sonar.issue.ignore.multicriteria.e1.ruleKey=java:S2589
sonar.issue.ignore.multicriteria.e1.resourceKey=**/LegacyAdapter.java
```

*What just happened:* the first form silences one rule on one spot in code; the second excludes a rule from a file via config. Both are scalpels. Reach for "False Positive" in the UI first - it keeps the reasoning attached to the issue where reviewers can see it, rather than buried in a config file.

> Resist the urge to fix the gate by lowering the bar. Editing the quality gate to demand 50% coverage instead of 80% makes the red turn green and quietly makes the codebase worse for everyone. If a threshold is genuinely wrong, change it in the open with the team, not in a panic on your branch.

## Coverage that won't move

The most common gate failure is coverage on new code, and the most common cause isn't untested code - it's a missing or misconfigured report. If Sonar shows 0% coverage on code you definitely tested, the scanner didn't find your report.

```console
INFO: Sensor JavaScript/TypeScript Coverage
WARN: No coverage report can be found with sonar.javascript.lcov.reportPaths='coverage/lcov.info'
INFO: 0.0% coverage on new code
```

*What just happened:* the path in your config didn't match where tests actually wrote the report, so Sonar imported nothing and reported zero. The fix is almost always the path or the order of steps - tests must run *before* the scanner so the report exists when the scanner looks. Genuinely untested new code is the second cause; the missing report is the first one to rule out.

Note a quirk: SonarQube only counts coverage for lines it also analyzed. Generated files, vendored code, or paths you excluded won't show coverage, which can drag the new-code percentage in surprising ways. Keep your `sonar.sources` and exclusions aligned with what you actually want measured.

## Hotspots are not vulnerabilities

This distinction trips up almost everyone. A **vulnerability** is Sonar saying "this is a security bug, fix it." A **security hotspot** is Sonar saying "this is security-sensitive code that a human must look at and judge." Using a random number generator is a hotspot - fine for a shuffle, dangerous for a token. Sonar can't tell which from the code alone, so it asks you.

The gate condition is usually "Security Hotspots Reviewed = 100%." That does not mean fix them all - it means *review* them all. You open each hotspot, read the explanation, and mark it **Safe** (this use is fine), **Fixed** (you changed it), or **Acknowledged**. Reviewing a hotspot and marking it Safe is a legitimate, expected outcome.

```text
Security Hotspot: Make sure using this pseudorandom number generator is safe here.
  Location: src/util/shuffle.ts:14   Math.random()
  Review options:  [ Safe ]  [ Fixed ]  [ Acknowledged ]
  → marked Safe: "Used only to shuffle a display list, not for security."
```

*What just happened:* you reviewed the hotspot, decided this use is harmless, and recorded why. That satisfies the "100% reviewed" gate condition without changing a line of code - which is exactly how hotspots are meant to clear. For the broader picture of supply-chain and dependency risk that hotspots only scratch, see [/guides/supply-chain-security](/guides/supply-chain-security).

## When the gate blocks a merge you need

Sometimes the gate is right and you still need to ship - a hotfix at 2am, a coverage gap you'll close next sprint. Resist these temptations: do not delete the Sonar check from CI, do not push a config that turns the gate off, do not lower thresholds on the sly. Each one quietly removes the safety net for everyone after you.

The clear moves: fix the real finding if you can; mark a false positive as such with a reason; or, if your team allows it, use the documented override (an admin can manually pass a gate, or an emergency-merge path can require a second approver). The principle is that bypassing a gate should be *visible and accountable*, never a silent edit. A gate that everyone quietly works around is worse than no gate, because it lies about being a safety net.

In the wild: mature teams treat the gate like a flaky test that's usually right. When it fails, the first question is "is this finding real?" - and most of the time the cheapest path to green is to fix the small real thing Sonar caught, not to argue with it.

```quiz
[
  {
    "q": "Sonar flags correct code as a 'code smell'. What's the best response?",
    "choices": ["Disable the rule for the whole project", "Mark that single issue as False Positive with a comment", "Delete the SonarQube check from CI", "Lower the gate threshold so it passes"],
    "answer": 1,
    "explain": "Resolve the single issue as a false positive with a reason. Disabling the rule globally blinds the whole team because one case annoyed you."
  },
  {
    "q": "What does a security hotspot require to satisfy the gate?",
    "choices": ["Every hotspot must be code-fixed", "Every hotspot must be reviewed (and may be marked Safe)", "Hotspots are ignored by the gate", "A penetration test must pass"],
    "answer": 1,
    "explain": "Hotspots are security-sensitive code needing human judgment. The gate asks that they all be reviewed - marking one Safe with a reason is a valid outcome."
  },
  {
    "q": "Sonar reports 0% coverage on code you definitely tested. What's the most likely cause?",
    "choices": ["Your tests are wrong", "The coverage report path is wrong or tests ran after the scanner", "SonarQube doesn't support your language", "The gate is misconfigured"],
    "answer": 1,
    "explain": "Sonar imports a report it didn't generate. A 0% reading usually means the path didn't match, or the scanner ran before tests produced the report."
  }
]
```

[← Phase 2: Scanning and the quality gate](02-scanning-and-the-gate.md) | [Overview](_guide.md)
