---
title: "SonarQube, From Zero"
guide: sonarqube-from-zero
phase: 0
summary: "The enterprise code-quality gate: static analysis for bugs, vulnerabilities, and code smells, with coverage and a quality gate that can block a merge."
tags: [sonarqube, static-analysis, code-quality, quality-gate, code-coverage, technical-debt, ci]
category: tooling
group: "Code Quality"
order: 44
difficulty: intermediate
synonyms: ["sonarqube", "sonar scanner", "sonarcloud", "code quality gate", "static code analysis", "code smells", "technical debt", "sonar quality gate", "clean as you code"]
updated: 2026-06-30
---

# SonarQube, From Zero

Someone added SonarQube to your pipeline, and now a PR you were proud of is glowing red with words like "code smell" and "security hotspot" and a debt estimate in days. It feels like a robot reviewer that nitpicks while ignoring your actual logic. The relief here is understanding what it really measures, why a *quality gate* exists, and how to make it help instead of nag.

## How to read this

Read in order. Phase 1 builds the mental model: SonarQube is a static analyzer plus a pass/fail gate, and the gate is the part that actually changes your day. Phase 2 is the everyday loop: running a scan, reading the report, and the "clean as you code" idea that keeps it sane on old projects. Phase 3 is where it bites: flaky coverage, false positives, hotspots versus vulnerabilities, and the gate fights that waste afternoons.

## The phases

1. [Phase 1: What SonarQube actually is](01-what-it-is.md) - the analyzer, the five issue types, and the gate.
2. [Phase 2: Scanning and the quality gate](02-scanning-and-the-gate.md) - run a scan, read it, gate new code not old.
3. [Phase 3: Where it nags and how to tame it](03-where-it-nags.md) - false positives, coverage, hotspots, gate fights.

[Phase 1: What SonarQube actually is](01-what-it-is.md) →
