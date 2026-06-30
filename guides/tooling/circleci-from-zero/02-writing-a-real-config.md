---
title: "CircleCI, From Zero"
guide: circleci-from-zero
phase: 2
summary: "Cloud-native CI/CD with config.yml: jobs, workflows, executors, and orbs — fast parallel pipelines without running your own server."
tags: [circleci, ci, cd, pipelines, devops, yaml]
difficulty: intermediate
synonyms: ["circleci tutorial", "circleci config.yml", "circleci workflows", "circleci orbs", "circleci vs github actions", "how does circleci work"]
updated: 2026-06-30
---

# Writing a real config: caching, orbs, and fan-out

The four-noun config from phase 1 works, but it's slow and verbose. Every run reinstalls every dependency from scratch, and you're hand-writing steps that thousands of teams have already written. This phase is the everyday craft: making the pipeline fast with caching, making it short with orbs, and gating a deploy behind a human.

## Caching: stop reinstalling the world every run

Each job gets a clean machine, which means `node_modules` is empty every single time. On a real project that's minutes of `npm ci` you pay on every push. Caching saves a directory at the end of one run and restores it at the start of the next.

```yaml
jobs:
  test:
    docker:
      - image: cimg/node:20.11
    steps:
      - checkout
      - restore_cache:
          keys:
            - deps-v1-{{ checksum "package-lock.json" }}
            - deps-v1-
      - run: npm ci
      - save_cache:
          key: deps-v1-{{ checksum "package-lock.json" }}
          paths:
            - node_modules
      - run: npm test
```

*What just happened:* `restore_cache` looks for a saved cache whose key starts with one of the listed prefixes, newest match wins. The key embeds `checksum "package-lock.json"`, so when your lockfile is unchanged the exact cache is restored and `npm ci` finishes in seconds. When the lockfile changes the checksum changes, the exact key misses, the fallback `deps-v1-` restores the most recent old cache (a warm start), and `save_cache` writes a fresh one under the new key.

Two things bite people here. **Cache keys are immutable** — once a key is written, CircleCI never overwrites it. That's why the checksum is in the key: a new lockfile means a new key. And the `deps-v1-` prefix is a manual version: bump it to `deps-v2-` when you want to throw the whole cache away.

> Caching is an optimization, never a source of truth. Your build must still pass with an empty cache, because that's exactly what happens on a fresh branch or after a key bump. If a green build depends on a warm cache, you have a bug, not a cache.

## Orbs: reusable config packages

An **orb** is a shareable bundle of jobs, commands, and executors that someone already wrote and tested. Instead of hand-coding the Node setup-and-cache dance above, you pull in the official Node orb and call its commands.

```yaml
version: 2.1
orbs:
  node: circleci/node@5.2.0
jobs:
  test:
    docker:
      - image: cimg/node:20.11
    steps:
      - checkout
      - node/install-packages       # handles install + caching for you
      - run: npm test
```

*What just happened:* the `orbs` block imports `circleci/node` at version `5.2.0`. That gives us `node/install-packages`, a single command that does the restore-cache, install, and save-cache sequence we wrote by hand above. The config got shorter and harder to get wrong, because the caching logic is maintained by the orb's authors instead of by you.

Orbs are named `namespace/name@version`. Pin the version (don't float to "latest") so a pipeline that's green today doesn't break tomorrow when the orb publishes a change. There are orbs for AWS, Slack notifications, Docker, browser tools, and most things you'd otherwise script — but each one is third-party code running in your pipeline, so prefer the `circleci/` official orbs and read what an unfamiliar orb does before trusting it with credentials.

## Approval gates: putting a human in the loop

Continuous deployment is great until "every merge ships to production" gives someone a heart attack. CircleCI lets you pause a workflow and wait for a person to click a button.

```yaml
workflows:
  build-test-deploy:
    jobs:
      - test
      - build:
          requires:
            - test
      - hold-for-approval:
          type: approval
          requires:
            - build
      - deploy:
          requires:
            - hold-for-approval
```

*What just happened:* `hold-for-approval` has `type: approval`, which is a special job that runs no commands — it pauses the workflow and shows a button in the CircleCI UI. Nothing downstream of it runs until someone with access clicks approve. Because `deploy` requires `hold-for-approval`, your code is built and tested automatically, then waits for a human green light before it ships. That's the standard pattern for "automate everything up to production, then ask."

## Filters: run jobs only on the right branches

You rarely want to deploy from every branch. **Filters** restrict when a job runs based on the branch or tag.

```yaml
workflows:
  build-test-deploy:
    jobs:
      - test
      - deploy:
          requires:
            - test
          filters:
            branches:
              only: main
```

*What just happened:* `test` runs on every branch and every pull request. `deploy` carries a filter saying `branches: only: main`, so it's skipped entirely on feature branches and only fires when the commit is on `main`. This is how one config serves both "check my PR" and "ship the merge" without two separate pipelines.

## Putting it together

A real, readable config for a Node service ends up looking like this — orb for the boring parts, a clear workflow, a filtered deploy:

```yaml
version: 2.1
orbs:
  node: circleci/node@5.2.0
jobs:
  test:
    docker:
      - image: cimg/node:20.11
    steps:
      - checkout
      - node/install-packages
      - run: npm test
  deploy:
    docker:
      - image: cimg/node:20.11
    steps:
      - checkout
      - node/install-packages
      - run: npm run deploy
workflows:
  ci:
    jobs:
      - test
      - deploy:
          requires:
            - test
          filters:
            branches:
              only: main
```

*What just happened:* every push runs `test`. Only a push to `main` that passes `test` runs `deploy`. The caching is handled by the orb, the dependency graph is one `requires`, and the whole thing fits on a screen. That's the target shape — boring, short, and obvious.

For builders: keep the config as flat as you can. When you feel the urge to add a fifth job or a clever conditional, ask whether an orb already solves it. The best CircleCI configs are the ones a teammate can read in thirty seconds.

```quiz
[
  {
    "q": "Why is checksum \"package-lock.json\" put inside the cache key?",
    "choices": [
      "To make the key shorter",
      "So a changed lockfile produces a new key and avoids restoring a stale cache",
      "To encrypt the cache contents",
      "It is required syntax with no effect"
    ],
    "answer": 1,
    "explain": "Cache keys are immutable. Embedding the lockfile checksum means any dependency change yields a new key, so you never restore node_modules that no longer matches the lockfile."
  },
  {
    "q": "What does a job with 'type: approval' do?",
    "choices": [
      "Runs your deploy commands automatically",
      "Retries the previous job until it passes",
      "Pauses the workflow until a person clicks approve in the UI",
      "Sends an email and continues"
    ],
    "answer": 2,
    "explain": "An approval job runs no commands; it halts the workflow and waits for a human to approve before downstream jobs run."
  },
  {
    "q": "What is the safest way to reference an orb in your config?",
    "choices": [
      "Use @latest so you always get fixes",
      "Pin a specific version like circleci/node@5.2.0",
      "Copy the orb's source into your config",
      "Reference it without a version"
    ],
    "answer": 1,
    "explain": "Pin the version so a green pipeline stays green. Floating to latest lets an upstream change break your build without any commit of yours."
  }
]
```

[← Phase 1: The four nouns](01-the-four-nouns.md) | [Overview](_guide.md) | [Phase 3: When it breaks →](03-when-it-breaks.md)
