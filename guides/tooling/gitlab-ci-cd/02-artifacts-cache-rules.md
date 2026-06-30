---
title: "GitLab CI/CD, From Zero"
guide: gitlab-ci-cd
phase: 2
summary: "Pipelines defined in .gitlab-ci.yml: stages, jobs, and runners that build, test, and deploy on every push — with artifacts, caching, and environments."
tags: [gitlab, ci, cd, pipelines, devops, automation]
difficulty: intermediate
synonyms: ["gitlab ci", "gitlab pipelines", ".gitlab-ci.yml", "gitlab runner", "gitlab cd", "ci cd gitlab", "gitlab stages jobs"]
updated: 2026-06-30
---

# Phase 2: The Everyday Core — Artifacts, Cache, and Rules

Phase 1 left you with a clean mental model and one nagging problem: jobs are isolated. Your `build` job compiled the app into a `dist/` folder, and then your `deploy` job started in a fresh container with no `dist/` in sight. Your tests reinstall every dependency from scratch and take four minutes when they could take forty seconds. And your deploy job runs on every single branch, including the doc-typo fix on someone's feature branch. This phase fixes all three. These three keywords — `artifacts`, `cache`, and `rules` — are the difference between a toy pipeline and one you'd actually ship behind.

## Artifacts: passing files forward

An **artifact** is a file (or folder) a job produces that you want to keep and hand to later jobs. You declare what to save; GitLab uploads it when the job finishes and downloads it into the right place for any later job that needs it.

```yaml
build-app:
  stage: build
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 week

deploy-app:
  stage: deploy
  script:
    - ./deploy.sh dist/
```

*What just happened:* `build-app` declared `dist/` as an artifact. When it finishes, GitLab uploads that folder. `deploy-app` runs in a later stage, and because it's downstream, GitLab automatically downloads `dist/` into its workspace before the script runs — so `./deploy.sh dist/` finds real files. `expire_in: 1 week` tells GitLab to delete the stored copy after a week so storage doesn't grow forever.

By default, artifacts flow to *all* later jobs. Artifacts are also how you publish things humans want: a built binary, a coverage report, a `.zip` you download from the pipeline page. There's one specially-handled flavor — test reports:

```yaml
run-tests:
  stage: test
  script:
    - npm test -- --reporters=jest-junit
  artifacts:
    when: always
    reports:
      junit: junit.xml
```

*What just happened:* `reports: junit` tells GitLab "this artifact is a test report — parse it and show pass/fail counts in the merge request." `when: always` uploads the report even when the job fails (the default is `on_success`), which matters here because a *failing* test run is exactly when you want to see the report.

## Cache: making jobs fast

Artifacts move *outputs forward* between stages. **Cache** is different: it stores files you want to *reuse across pipeline runs* to avoid redoing slow work — almost always your dependency folder. The mental split that keeps people sane:

- **Artifact** = "I built this, the next job needs it." Tied to one pipeline. Correctness.
- **Cache** = "Downloading this again is slow, reuse last time's copy if you can." Spans pipelines. Speed, best-effort.

```yaml
run-tests:
  stage: test
  cache:
    key:
      files:
        - package-lock.json
    paths:
      - node_modules/
  script:
    - npm ci
    - npm test
```

*What just happened:* the runner restores `node_modules/` from the cache before the script, keyed on the contents of `package-lock.json`. If the lockfile hasn't changed, you get the same cache and `npm ci` is fast. When `package-lock.json` changes, the `key` changes, so you get a fresh cache and rebuild dependencies — exactly the behavior you want.

> Never put correctness on cache. Cache can be empty (first run), stale, or evicted at any time — treat it as a maybe. If your `deploy` job *needs* the `dist/` from `build`, that's an artifact, not a cache. A common painful bug is a deploy that "works on my machine and sometimes in CI" because it secretly depended on a warm cache.

## Rules: deciding when a job runs

By default, every job runs in every pipeline. That's rarely what you want — you don't deploy to production from a feature branch, and you might skip the slow integration suite on draft merge requests. The `rules` keyword controls when a job is created.

```yaml
deploy-prod:
  stage: deploy
  script:
    - ./deploy.sh production
  rules:
    - if: '$CI_COMMIT_BRANCH == "main"'
```

*What just happened:* `deploy-prod` is only added to the pipeline when the commit is on the `main` branch. On any other branch the job simply doesn't exist — no gray dot, no skipped step. `$CI_COMMIT_BRANCH` is one of the built-in variables GitLab injects into every pipeline.

You can combine conditions and change the job's behavior per rule:

```yaml
integration-tests:
  stage: test
  script:
    - ./run-integration.sh
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
    - if: '$CI_COMMIT_BRANCH == "main"'
    - when: never
```

*What just happened:* this job runs in two situations — when the pipeline comes from a merge request, or when the commit lands on `main`. The final `when: never` is the catch-all: any other case falls through and the job is skipped. Rules are evaluated top to bottom, and the first match wins.

You may still see older pipelines using `only:` and `except:` instead of `rules:`:

```yaml
legacy-deploy:
  stage: deploy
  script:
    - ./deploy.sh staging
  only:
    - main
```

*What just happened:* `only: [main]` is the older syntax for "run this only on the main branch." It still works, but `rules` is the current, more expressive replacement — `only`/`except` can't express "run on MRs *and* main but nothing else" cleanly. Read `only`/`except` fluently; reach for `rules` when you write new jobs.

## Putting it together

Here's a small but realistic pipeline using all three ideas at once:

```yaml
stages:
  - build
  - test
  - deploy

build:
  stage: build
  script:
    - npm ci
    - npm run build
  artifacts:
    paths: [dist/]

test:
  stage: test
  cache:
    key:
      files: [package-lock.json]
    paths: [node_modules/]
  script:
    - npm ci
    - npm test

deploy:
  stage: deploy
  script:
    - ./deploy.sh dist/
  rules:
    - if: '$CI_COMMIT_BRANCH == "main"'
```

*What just happened:* `build` produces `dist/` as an artifact that flows to `deploy`; `test` caches `node_modules/` so it's fast on repeat runs; `deploy` only runs on `main` and consumes the artifact. Every branch gets a build and tests; only `main` gets a deploy. That's the everyday shape of a working pipeline.

**In the wild:** the single most common pipeline speedup is caching the dependency folder with a lockfile-based key, and the single most common pipeline *bug* is depending on a cache for correctness. Get those two right and you've avoided most of the pain teams hit in their first month.

```quiz
[
  {
    "q": "Your deploy job needs the dist/ folder that the build job produced. What should you use?",
    "choices": [
      "cache, keyed on the branch name",
      "artifacts in the build job, which flow to the deploy job",
      "Nothing — files automatically persist between jobs",
      "A shared cache with when: always"
    ],
    "answer": 1,
    "explain": "Artifacts pass a job's outputs forward within a pipeline and are about correctness. Cache is best-effort speed and can be empty, so it must never carry required files."
  },
  {
    "q": "What is the safest way to key a cache for node_modules?",
    "choices": [
      "On the branch name, so each branch gets its own cache",
      "On the contents of package-lock.json, so it refreshes when dependencies change",
      "On the commit SHA, so it's unique every push",
      "On a fixed string, so it never changes"
    ],
    "answer": 1,
    "explain": "Keying on the lockfile reuses the cache while dependencies are unchanged and rebuilds it only when they actually change — the right trade between speed and freshness."
  },
  {
    "q": "How do you make a job run only on the main branch?",
    "choices": [
      "Put it in a stage named main",
      "Add rules with if: '$CI_COMMIT_BRANCH == \"main\"'",
      "Give it a runner tag called main",
      "Set artifacts: paths: [main]"
    ],
    "answer": 1,
    "explain": "rules with a condition on $CI_COMMIT_BRANCH decides when the job is created. On other branches the job simply won't be part of the pipeline."
  }
]
```

[← Phase 1: The Mental Model](01-the-mental-model.md) | [Overview](_guide.md) | [Phase 3: Production Reality — Environments, Gates, and Secrets →](03-environments-gates-secrets.md)
