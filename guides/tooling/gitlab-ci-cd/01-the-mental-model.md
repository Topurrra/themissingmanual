---
title: "Phase 1: The Mental Model — One File, A Pipeline, A Machine"
guide: gitlab-ci-cd
phase: 1
summary: "Pipelines defined in .gitlab-ci.yml: stages, jobs, and runners that build, test, and deploy on every push — with artifacts, caching, and environments."
tags: [gitlab, ci, cd, pipelines, devops, automation]
difficulty: intermediate
synonyms: ["gitlab ci", "gitlab pipelines", ".gitlab-ci.yml", "gitlab runner", "gitlab cd", "ci cd gitlab", "gitlab stages jobs"]
updated: 2026-06-30
---

# Phase 1: The Mental Model — One File, A Pipeline, A Machine

Here's the reality you're starting from: you push a commit, GitLab shows a little pipeline icon next to it, and a bunch of dots turn green (or one turns red and blocks your merge). It feels like magic happening on a server you've never logged into. It isn't magic. There are exactly three moving parts, and once you can name them, every pipeline you'll ever read becomes legible.

## The whole system in three words

GitLab CI/CD runs on three ideas:

- **A job** is a list of shell commands plus the context they run in. "Install dependencies and run the tests" is a job. A job either passes (exit code 0) or fails (anything else).
- **A stage** is a named group of jobs that run *together, in parallel*. The classic stages are `build`, `test`, `deploy`. All the jobs in `test` run at the same time; the pipeline doesn't move to `deploy` until every `test` job has passed.
- **A runner** is the actual machine (or container) that picks up a job and executes its commands. GitLab the website doesn't run your code — it hands the job to a runner, the runner runs it and reports back.

Put those together and you get a **pipeline**: stages run in order, jobs inside a stage run in parallel, runners do the work.

```text
push commit
   │
   ▼
┌─────────┐   ┌──────────────────────┐   ┌─────────┐
│  build  │ → │  test (3 in parallel)│ → │ deploy  │
└─────────┘   └──────────────────────┘   └─────────┘
  stage 1            stage 2               stage 3
```

*What just happened:* the commit triggered a pipeline with three stages. `build` runs first and must pass before `test` starts; the three test jobs run at once; only if all of them pass does `deploy` get its turn.

If you want the broader "why does any of this exist" framing — why teams automate build/test/deploy at all — see [/guides/what-cicd-does](/guides/what-cicd-does). This guide assumes you're sold on the idea and want to drive GitLab's version of it.

## The one file that controls everything

Everything lives in a file named `.gitlab-ci.yml` at the root of your repository. GitLab reads it on every push. There is no separate dashboard where the "real" config hides — the file *is* the config, it's version-controlled with your code, and changing the pipeline means editing this file and committing it.

A minimal-but-real pipeline looks like this:

```yaml
stages:
  - build
  - test

build-app:
  stage: build
  image: node:20
  script:
    - npm ci
    - npm run build

run-tests:
  stage: test
  image: node:20
  script:
    - npm ci
    - npm test
```

*What just happened:* you declared two stages and two jobs. `build-app` belongs to the `build` stage, `run-tests` belongs to `test`. Each job names a Docker `image` (the environment it runs in) and a `script` (the commands the runner executes). On a push, the runner spins up a `node:20` container, runs the `build-app` commands, then — only if that passed — spins up a fresh container for `run-tests`.

The two names you see at the top level (`build-app`, `run-tests`) are job names — you choose them, and they show up as the dots in the pipeline view. The reserved keywords (`stages`, `stage`, `image`, `script`) are GitLab's vocabulary; the job names are yours.

> A job always starts from a clean checkout in a fresh container. Nothing carries over from a previous job unless you explicitly tell it to — that "explicitly tell it to" is what artifacts and cache are for, and that's Phase 2. For now, hold the idea that jobs are isolated by default.

## What a runner actually is

The word "runner" trips people up because it's invisible. A runner is a small agent program installed on some machine — a cloud VM, a beefy server in a closet, GitLab's own shared fleet. It connects to your GitLab instance and says "I'm available." When a pipeline has a job ready, GitLab assigns it to a runner, which clones your repo, runs the `script`, captures the output and exit code, and reports back.

On GitLab.com you usually get **shared runners** for free (with a quota of minutes), so things work out of the box. In a company you'll often see **specific runners** the team installed — maybe to get more memory, a GPU, or access to an internal network. You rarely manage runners yourself early on; you need to know that the green dots cost real compute on a real machine somewhere.

```yaml
deploy-staging:
  stage: deploy
  tags:
    - linux-large
  script:
    - ./deploy.sh staging
```

*What just happened:* the `tags` key tells GitLab "only a runner that advertises the `linux-large` tag may take this job." Tags are how you route a heavy job to a beefy machine or a deploy job to a runner that has the right network access. No matching runner means the job sits pending — a classic "why is my pipeline stuck" cause.

## Reading a pipeline result

When a pipeline runs you'll see each job as a dot: green = passed, red = failed, gray = didn't run, blue/spinning = running, orange clock = pending (waiting for a runner). Click any job to see its full console log — every command and its output, exactly as the runner saw it. That log is your single source of truth when something breaks. Don't guess at why a job failed; open the log and read the last few lines.

```console
$ npm test
> jest

FAIL  src/auth.test.js
  ✕ rejects an expired token (12 ms)

Tests: 1 failed, 41 passed, 42 total
ERROR: Job failed: exit code 1
```

*What just happened:* the test job ran `npm test`, one test failed, `jest` exited with code 1, and GitLab marked the job (and the pipeline) red. The fix isn't in GitLab — it's in your code. CI didn't break; it did its job and told you the truth.

**For builders:** the fastest way to learn this file is to add a throwaway job that runs `echo` and `env`, push it, and read the log. You'll see the working directory, the branch name, the commit SHA, and dozens of `CI_*` variables GitLab injects automatically — the same variables you'll lean on in Phase 2 and Phase 3.

```quiz
[
  {
    "q": "In a pipeline with stages build, test, deploy, when do the jobs in the test stage run?",
    "choices": [
      "One at a time, in the order they appear in the file",
      "All at once, but only after every build-stage job has passed",
      "Before the build stage, to fail fast",
      "Only if you click a button to start them"
    ],
    "answer": 1,
    "explain": "Stages run in order; jobs within a stage run in parallel. The test stage starts only once all build jobs pass."
  },
  {
    "q": "What actually executes the commands in a job's script?",
    "choices": [
      "The GitLab web server itself",
      "Your local machine when you push",
      "A runner — an agent on some machine that picks up the job",
      "The .gitlab-ci.yml file"
    ],
    "answer": 2,
    "explain": "GitLab assigns the job to a runner, which clones the repo, runs the script, and reports the result back."
  },
  {
    "q": "Where does the pipeline configuration live?",
    "choices": [
      "In a hidden settings dashboard on GitLab.com",
      "In a file named .gitlab-ci.yml at the repo root, version-controlled with the code",
      "In a database only admins can edit",
      "In each runner's local config"
    ],
    "answer": 1,
    "explain": "The .gitlab-ci.yml file at the repository root is the config. It's committed with your code, so pipeline changes are reviewable like any other change."
  }
]
```

[← Overview](_guide.md) | [Phase 2: The Everyday Core — Artifacts, Cache, and Rules →](02-artifacts-cache-rules.md)
