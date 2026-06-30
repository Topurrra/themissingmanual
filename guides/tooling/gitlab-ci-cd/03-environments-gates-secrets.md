---
title: "GitLab CI/CD, From Zero"
guide: gitlab-ci-cd
phase: 3
summary: "Pipelines defined in .gitlab-ci.yml: stages, jobs, and runners that build, test, and deploy on every push — with artifacts, caching, and environments."
tags: [gitlab, ci, cd, pipelines, devops, automation]
difficulty: intermediate
synonyms: ["gitlab ci", "gitlab pipelines", ".gitlab-ci.yml", "gitlab runner", "gitlab cd", "ci cd gitlab", "gitlab stages jobs"]
updated: 2026-06-30
---

# Phase 3: Production Reality — Environments, Gates, and Secrets

You can now write a pipeline that builds, tests, and deploys. The moment it touches real servers, three new questions appear, and they're the ones that decide whether your pipeline is trustworthy. Where did this deploy go, and what's running there right now? Who gets to push the button that ships to production? And how do you give your deploy job a database password without writing it into a file the whole company can read? This phase answers all three, then walks through the failures that actually page people at 2am.

## Environments: naming where you deploy

An **environment** is GitLab's record of a deploy target — `staging`, `production`, a per-branch review app. It's not infrastructure; it's a label plus a history. When a job declares `environment:`, GitLab tracks every deploy to that target: which commit, when, by whom, and a one-click way to see what's live and to roll back.

```yaml
deploy-staging:
  stage: deploy
  script:
    - ./deploy.sh staging
  environment:
    name: staging
    url: https://staging.example.com
  rules:
    - if: '$CI_COMMIT_BRANCH == "main"'
```

*What just happened:* this job deploys to `staging` and tells GitLab the live URL. In the **Deployments → Environments** view you now get a `staging` entry showing the current commit, a link straight to the running site, and a deployment history. The `url` becomes a clickable button — small thing, but it turns "is the deploy actually up?" from a Slack question into one click.

## Manual gates: the button you have to press

Deploying to staging on every `main` push is fine. Deploying to *production* automatically is how teams ship a Friday-night outage. The fix is a **manual job**: it appears in the pipeline but waits, doing nothing, until a human clicks play.

```yaml
deploy-production:
  stage: deploy
  script:
    - ./deploy.sh production
  environment:
    name: production
    url: https://example.com
  rules:
    - if: '$CI_COMMIT_BRANCH == "main"'
      when: manual
```

*What just happened:* on a `main` pipeline, `deploy-production` shows up as a play button instead of running. The pipeline can finish "successfully" with this job still pending — the deploy happens only when someone clicks it. That click is recorded against the production environment, so you have an audit trail of who shipped what.

> A manual job is a *gate*, not a guarantee of safety. Anyone with the right project role can press it. For real protection on production, combine the manual gate with **protected branches** and **protected environments** in GitLab's project settings, which restrict who may run that deploy. The YAML expresses intent; the settings enforce it.

You can make the gate block the pipeline if you'd rather force a decision, by adding `allow_failure: false` — then the pipeline stays "blocked" until someone acts, instead of going green with the deploy still waiting.

## Secrets: CI/CD variables

Your deploy job needs credentials — an API token, a database URL, an SSH key. These must never live in `.gitlab-ci.yml`, because that file is in the repo and visible to everyone with read access. Instead you store them as **CI/CD variables** in the project (or group) settings, and GitLab injects them into the job's environment at runtime.

```yaml
deploy-production:
  stage: deploy
  script:
    - echo "Deploying with token..."
    - curl -H "Authorization: Bearer $DEPLOY_TOKEN" https://api.example.com/release
  environment:
    name: production
```

*What just happened:* `$DEPLOY_TOKEN` isn't defined anywhere in the file. It's set in **Settings → CI/CD → Variables**, and the runner injects it as an environment variable when the job runs. The repo stays clean; the secret stays out of version control.

When you add a CI/CD variable, two checkboxes matter:

- **Masked** — GitLab replaces the value with `[masked]` in job logs, so an accidental `echo` doesn't leak it. Turn this on for every secret. (The value must meet GitLab's masking rules — long enough, no problematic characters — or masking silently won't apply.)
- **Protected** — the variable is exposed only to jobs running on protected branches or tags. This stops a feature branch from reading your production credentials. Turn it on for anything production-grade.

```console
$ echo "Token is $DEPLOY_TOKEN"
Token is [masked]
```

*What just happened:* even though the script echoed the variable, masking replaced it in the log. Masking is a safety net, not permission to print secrets — but it saves you the day someone forgets.

## When it breaks: the failures that page you

Real pipelines fail in a handful of recognizable ways. Knowing the shape saves you from staring at a red dot in confusion.

**The job is stuck pending forever.** No runner matches it. Either there are no runners available, or the job has a `tags:` value no runner advertises. Check the job — GitLab tells you "This job is stuck because there are no active runners." Fix the tag or the runner, don't blame the YAML.

**The deploy "passed" but nothing changed.** Classic masked-failure: a command in the middle of the script failed but a later command returned 0, so the job went green. By default the shell stops on the first failing command, but pipes and subshells can swallow errors. Make failures loud:

```yaml
deploy:
  stage: deploy
  script:
    - set -euo pipefail
    - ./build.sh | tee build.log
    - ./deploy.sh production
```

*What just happened:* `set -euo pipefail` makes the shell exit on any failed command (`-e`), treat unset variables as errors (`-u`), and — crucially — fail if any command in a pipe fails (`pipefail`), not only the last one. Without it, `./build.sh | tee build.log` would report success as long as `tee` succeeded, hiding a broken build.

**A secret is empty in the job.** Nearly always the variable is **protected** and the job is running on a non-protected branch, so GitLab refused to inject it. Either protect the branch or, for non-production targets, drop the protected flag. The log won't say "permission denied" — the variable is blank, so guard against it:

```yaml
deploy:
  stage: deploy
  script:
    - test -n "$DEPLOY_TOKEN" || { echo "DEPLOY_TOKEN is empty — check protected branch settings"; exit 1; }
    - ./deploy.sh production
```

*What just happened:* the job fails fast with a clear message instead of making a credential-less API call that fails confusingly downstream. A two-line guard like this turns a 20-minute head-scratch into an instant diagnosis.

**For builders:** the muscle to build here is reading the job log first and the YAML second. CI failures feel mysterious because the pipeline is "out there," but the log is a complete, honest transcript of exactly what ran. If you came from GitHub Actions, the concepts map closely — same build/test/deploy shape, different file format and vocabulary; see [/guides/your-first-pipeline-github-actions](/guides/your-first-pipeline-github-actions) for the comparison.

```quiz
[
  {
    "q": "How do you make a production deploy require a human to click before it runs?",
    "choices": [
      "Put it in its own stage",
      "Add when: manual to the job's rule (or as a top-level key)",
      "Mark its artifacts as protected",
      "Set expire_in: never"
    ],
    "answer": 1,
    "explain": "when: manual turns the job into a play button that waits for someone to trigger it, giving you a deliberate gate before production."
  },
  {
    "q": "Where should a production database password live so it's not in the repo?",
    "choices": [
      "Hardcoded in .gitlab-ci.yml under a comment",
      "In a CI/CD variable in project settings, marked masked and protected",
      "In an artifact that expires quickly",
      "In the cache, keyed on the branch"
    ],
    "answer": 1,
    "explain": "CI/CD variables keep secrets out of version control; masked hides them in logs and protected restricts them to protected branches."
  },
  {
    "q": "A deploy job shows green but the site didn't change. What's the most likely cause and a good guard?",
    "choices": [
      "The runner was too fast; add a sleep",
      "A mid-script command failed silently; add set -euo pipefail so failures stop the job",
      "The artifact expired; set expire_in longer",
      "The environment URL was wrong; remove it"
    ],
    "answer": 1,
    "explain": "Errors inside pipes or subshells can be swallowed so the job exits 0. set -euo pipefail makes any failed command fail the job loudly."
  }
]
```

[← Phase 2: The Everyday Core](02-artifacts-cache-rules.md) | [Overview](_guide.md)
