---
title: "When it breaks: flaky tests, slow builds, and managed-CI tradeoffs"
guide: circleci-from-zero
phase: 3
summary: "Cloud-native CI/CD with config.yml: jobs, workflows, executors, and orbs — fast parallel pipelines without running your own server."
tags: [circleci, ci, cd, pipelines, devops, yaml]
difficulty: intermediate
synonyms: ["circleci tutorial", "circleci config.yml", "circleci workflows", "circleci orbs", "circleci vs github actions", "how does circleci work"]
updated: 2026-06-30
---

# When it breaks: flaky tests, slow builds, and managed-CI tradeoffs

A pipeline that works on day one will eventually go red for reasons that have nothing to do with your code. Tests that pass locally fail in CI. The build that took two minutes now takes twelve. And one morning your whole team is blocked because someone else's infrastructure is having a bad day. This phase is about those moments — speeding pipelines up, debugging the weird ones, and being honest about what you give up by not running your own CI.

## Parallelism and test splitting: the real speed lever

Caching shaves the install. The test run itself is usually the long pole, and the fix is to run it across several machines at once. Set `parallelism` and CircleCI spins up that many copies of the job, then you tell it to split the test files between them.

```yaml
jobs:
  test:
    docker:
      - image: cimg/node:20.11
    parallelism: 4
    steps:
      - checkout
      - run: npm ci
      - run: |
          TESTS=$(circleci tests glob "test/**/*.test.js" | circleci tests split --split-by=timings)
          npx jest $TESTS
```

*What just happened:* `parallelism: 4` launches four identical containers for this one job. `circleci tests glob` lists all the test files; `circleci tests split` hands each container a different slice. With `--split-by=timings`, CircleCI uses timing data from past runs to balance the slices so each machine finishes at roughly the same moment, instead of one container getting all the slow tests. Four machines, roughly a quarter of the wall-clock time.

The catch: `--split-by=timings` needs timing data to balance well, and it gets that from `store_test_results`. If you never store results, the first runs split blindly by filename.

```yaml
      - run: npx jest --reporters=jest-junit
      - store_test_results:
          path: ./test-results
```

*What just happened:* `store_test_results` uploads JUnit-format XML so CircleCI learns how long each test took. Next run, the timings-based split is accurate, and as a bonus the UI shows you which specific tests failed instead of a wall of console output.

## Debugging the "passes locally, fails in CI" classic

This is the most common CircleCI frustration, and it's almost never CircleCI's fault. The CI machine is a clean, fresh environment — which means it's exposing something your laptop was hiding.

The usual culprits, in order of how often they're the answer:

- **An uncommitted file.** CI only has what's in git. If a config file, fixture, or env file is gitignored and your tests need it, CI won't have it.
- **A dependency you installed globally on your laptop** months ago and forgot. CI installs only what's in your lockfile.
- **Test-order dependence.** Tests that share state pass locally in one order and fail when parallelism splits them across machines in a different order.
- **An environment variable** set in your shell but not in CircleCI's project settings.

When reading is not enough, **SSH into the build**. CircleCI lets you re-run a failed job with SSH access and poke at the actual machine where it failed.

```text
# In the CircleCI UI: "Rerun job with SSH", then:
ssh -p <port> <user>@<ip>
cd project
npm test          # reproduce it on the exact machine that failed
ls -la            # is that file actually here?
env | grep API    # is the variable actually set?
```

*What just happened:* you're now on the real CI container, in the real working directory, with the real environment. This turns "it fails in CI and I can't see why" into ordinary local debugging. Reproducing the failure by hand here beats a dozen speculative commit-and-push rounds every time.

> Secrets like API keys never belong in `config.yml` — that file is in your repo for the world to read. Set them as environment variables in the CircleCI project settings (or a context for sharing across projects). They're injected at runtime and masked in logs.

## Contexts: secrets shared across projects

A single project's env vars live in its settings. When several projects need the same secret — a shared deploy key, a registry token — a **context** holds it once and grants jobs access.

```yaml
workflows:
  deploy:
    jobs:
      - deploy:
          context: production-secrets
          filters:
            branches:
              only: main
```

*What just happened:* the `deploy` job gains every environment variable stored in the `production-secrets` context. You can restrict which teams or branches may use a context in the org settings, which is how you keep production credentials out of reach of every random branch build.

## The managed-CI tradeoff: what you're really buying

CircleCI is somebody else's infrastructure. That's the whole pitch and the whole cost, so be clear-eyed about both sides.

What you get: no build servers to patch, fresh clean machines on every run, instant scale-out across dozens of parallel containers, and pre-built executors for languages and macOS you'd struggle to maintain yourself. For most teams this is an obvious win — running a reliable Jenkins fleet is a real job nobody enjoys.

What you give up:

- **Cost scales with minutes.** Heavy parallelism is fast but burns credits. The lever that speeds you up is the same lever that grows the bill, so tune `parallelism` to a real need, not a vibe.
- **You don't control the outage.** When CircleCI has an incident, your whole team's merges stop and you can only wait. Self-hosted means you own that risk instead of outsourcing it.
- **Data leaves your network.** Your source and secrets run on their machines. For some regulated environments that alone forces self-hosted runners.
- **The config is theirs.** You write CircleCI YAML, not a portable standard. Moving to another CI later is a rewrite, not a copy.

CircleCI's answer to the network and control concerns is **self-hosted runners** — your own machines doing the execution while CircleCI still orchestrates. That's the hybrid middle: you keep the nice workflow UI and orbs, but sensitive jobs run on hardware you control. It's more to operate than pure cloud, less than a full Jenkins.

```mermaid
graph LR
  A[Pure cloud CircleCI] -->|more control, more ops| B[Self-hosted runners]
  B -->|full control, full ops| C[Run your own Jenkins]
```

*What just happened:* the same axis runs through every CI choice — convenience on one end, control on the other. CircleCI's cloud sits at the convenient end, self-hosted runners in the middle, rolling your own at the far end. Pick by what your situation actually demands, not by what sounds impressive.

In the wild: most teams over-provision parallelism and under-invest in test speed, then wonder why the CI bill climbed. Faster tests beat more machines almost every time — four parallel containers running a slow, flaky suite is paying four times to be frustrated. Fix the suite first, then split it.

For the bigger picture of where CircleCI fits among other tools, [What CI/CD does](/guides/what-cicd-does) is the map; this guide was the territory for one specific city on it.

```quiz
[
  {
    "q": "What makes '--split-by=timings' balance test slices well across parallel machines?",
    "choices": [
      "It reads the file sizes",
      "It uses timing data from store_test_results in past runs",
      "It runs every test twice to measure",
      "It splits alphabetically"
    ],
    "answer": 1,
    "explain": "Timings-based splitting relies on JUnit results uploaded via store_test_results. Without that data the split falls back to balancing by filename."
  },
  {
    "q": "Where should an API key used by a deploy job live?",
    "choices": [
      "Plain text in config.yml",
      "In a comment in the repo README",
      "As an env var in CircleCI project settings or a context",
      "Hardcoded into the test files"
    ],
    "answer": 2,
    "explain": "config.yml is in your repo for anyone to read. Secrets go in project settings or a context, injected at runtime and masked in logs."
  },
  {
    "q": "Which is a genuine tradeoff of managed cloud CI versus self-hosting?",
    "choices": [
      "You must patch the build servers yourself",
      "When the provider has an outage, your merges stop and you can only wait",
      "You cannot run tests in parallel",
      "You have to maintain your own macOS hardware"
    ],
    "answer": 1,
    "explain": "With managed CI you outsource the infrastructure but also the outage risk: an incident on their side blocks your team. Self-hosting trades that for ops you own."
  }
]
```

[← Phase 2: Writing a real config](02-writing-a-real-config.md) | [Overview](_guide.md)
