---
title: "SonarQube, From Zero"
guide: sonarqube-from-zero
phase: 2
summary: "The enterprise code-quality gate: static analysis for bugs, vulnerabilities, and code smells, with coverage and a quality gate that can block a merge."
tags: [sonarqube, static-analysis, code-quality, quality-gate, code-coverage, technical-debt, ci]
difficulty: intermediate
synonyms: ["sonarqube", "sonar scanner", "sonarcloud", "code quality gate", "static code analysis", "code smells", "technical debt", "sonar quality gate", "clean as you code"]
updated: 2026-06-30
---

# Scanning and the quality gate

Now the everyday loop: you change some code, a scan runs, you read the result, and either the gate is green or you fix the one thing that's red. Most days you never touch the SonarQube server itself — the scanner runs in CI and posts a verdict. But knowing how to run it locally and read it by hand is what makes the CI result legible instead of mysterious.

## Running a scan

The thing that actually analyzes your code is the **scanner**. It collects your source, computes findings, and uploads them to the server, which stores history and evaluates the gate. There's a generic CLI scanner, and language-native ones (the Maven and Gradle plugins for JVM projects, `dotnet sonarscanner` for .NET). They all do the same job.

A project carries a small config file, `sonar-project.properties`, at its root:

```text
# sonar-project.properties
sonar.projectKey=acme-checkout
sonar.projectName=Acme Checkout
sonar.sources=src
sonar.tests=test
sonar.javascript.lcov.reportPaths=coverage/lcov.info
```

*What just happened:* you told the scanner what to call this project (`projectKey` is its unique id on the server), where the real code lives versus the tests, and where to find the coverage report. SonarQube does not measure coverage itself — it reads a report your test runner already produced.

To run it, you point the scanner at a server and authenticate with a token:

```bash
export SONAR_TOKEN=squ_xxxxxxxxxxxxxxxxxxxx
sonar-scanner \
  -Dsonar.host.url=https://sonar.acme.internal \
  -Dsonar.token=$SONAR_TOKEN
```

```console
INFO: Scanner configuration file: sonar-project.properties
INFO: Analyzing on SonarQube server 10.x
INFO: 412 files indexed
INFO: Sensor JavaScript/TypeScript analysis
INFO: Importing coverage from coverage/lcov.info
INFO: Analysis report uploaded
INFO: ANALYSIS SUCCESSFUL, you can find the results at:
INFO:   https://sonar.acme.internal/dashboard?id=acme-checkout
INFO: QUALITY GATE STATUS: FAILED - View details on the link above
```

*What just happened:* the scanner indexed your files, imported the coverage report, uploaded everything, and the server replied with the gate verdict. "ANALYSIS SUCCESSFUL" only means the scan ran — the line that matters is "QUALITY GATE STATUS." Successful scan, failed gate is the normal state when there's work to do.

> Never hardcode `sonar.token` in the properties file or commit it. It's a credential. Pass it as an environment variable in CI, the same way you'd treat any secret.

## Reading the result without panicking

A failed gate names exactly which condition failed. Open the PR link and you'll see a short summary, not the whole dashboard:

```text
Quality Gate: FAILED
  ✗ Coverage on New Code: 61.0% (required ≥ 80.0%)
  ✓ New Bugs: 0
  ✓ New Vulnerabilities: 0
  ✓ New Security Hotspots Reviewed: 100%
  ✓ Duplicated Lines on New Code: 1.2% (required ≤ 3.0%)
```

*What just happened:* one condition failed — new code coverage. The fix is scoped and obvious: the lines you added or changed aren't tested enough, so add tests for them. You are not on the hook for the project's overall coverage, only the new code. That scoping is the single most important idea in this guide.

## Clean as you code

Here's the idea that makes SonarQube livable on a real, old, large codebase. Picture inheriting a project with 40% coverage and ten thousand existing code smells. If the gate judged the *whole* project, it would be red forever and you'd never dig out. So Sonar's default gate judges **new code** — code added or changed since a baseline (typically the previous release, or for a PR, the lines that differ from the target branch).

This is called **clean as you code**. The legacy heap is frozen as-is; the gate only asks that *what you touch* meets the bar. Write tested, clean new code and the project's overall numbers improve on their own, file by file, as old code gets revisited. No big-bang cleanup project, no blocking the team on debt nobody scheduled.

```text
   Whole project              New code (last 30 days)
   coverage:    41%           coverage:    84%   ← the gate looks here
   smells:      9,812         smells:      3
   bugs:        140           bugs:        0
```

*What just happened:* the project's lifetime numbers are grim, but the gate only evaluates the right-hand column. You can ship today by keeping your slice clean, and the left column drifts in the right direction over time. This is why a healthy team can run a strict gate on a messy codebase without anyone rage-quitting.

## Wiring it into CI

In practice the scan runs on every PR. A typical pipeline step runs your tests (to produce the coverage report), then the scanner, then waits for the gate:

```yaml
# CI step (shape is the same on any CI system)
- run: npm test -- --coverage          # produces coverage/lcov.info
- run: sonar-scanner -Dsonar.token=$SONAR_TOKEN
- run: sonar-scanner -Dsonar.qualitygate.wait=true   # block until gate returns
```

*What just happened:* tests run first so coverage exists, the scanner uploads, and `qualitygate.wait=true` makes the step block until the server finishes evaluating — so the CI step's pass/fail mirrors the gate. Without `wait`, the scanner returns immediately and your pipeline goes green before the gate has even decided.

For the bigger picture of where this step sits in a pipeline, see [/guides/what-cicd-does](/guides/what-cicd-does).

```quiz
[
  {
    "q": "On a default 'clean as you code' gate, what does the gate evaluate for a pull request?",
    "choices": ["The entire project's coverage and issues", "Only the new or changed code", "Only files in the src directory", "Nothing until the next release"],
    "answer": 1,
    "explain": "The default gate judges new code — the lines added or changed since the baseline — so a messy legacy project isn't held against your PR."
  },
  {
    "q": "Where does SonarQube get a project's code coverage number?",
    "choices": ["It runs the tests itself and measures them", "It estimates it from the number of test files", "It reads a coverage report your test runner produced", "It infers it from code complexity"],
    "answer": 2,
    "explain": "Sonar imports a coverage report (like lcov.info) generated by your own test run. If you don't produce and point at that report, coverage shows as 0%."
  },
  {
    "q": "In CI, why add 'sonar.qualitygate.wait=true'?",
    "choices": ["To run the scan faster", "To make the CI step block until the gate verdict is returned", "To skip the gate entirely", "To upload coverage twice"],
    "answer": 1,
    "explain": "Without wait, the scanner returns before the server finishes evaluating, so CI could pass while the gate later fails. wait makes the step reflect the real verdict."
  }
]
```

[← Phase 1: What SonarQube actually is](01-what-it-is.md) | [Overview](_guide.md) | [Phase 3: Where it nags and how to tame it →](03-where-it-nags.md)
