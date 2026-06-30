---
title: "The Twelve-Factor App"
guide: the-twelve-factor-app
phase: 1
summary: "The canonical checklist for an app that is actually shippable and scalable: config in the environment, stateless processes, logs as streams, and more."
tags: [architecture, twelve-factor, deployment, config, cloud-native, devops]
difficulty: intermediate
synonyms: ["12 factor app", "twelve factor methodology", "12factor", "config in environment", "stateless processes", "cloud native checklist", "heroku twelve factor"]
updated: 2026-06-30
---

# One codebase, clean dependencies, config outside the code

Picture the most stressful deploy you have lived through. Odds are it traces back to one of three things: nobody was sure which version of the code was running, the new server was missing some library that lived only on the old one, or a password was hard-coded and now it's wrong in the new place. The first three factors exist to make those three confusions impossible. Get them right and a deploy becomes boring, which is the highest praise infrastructure can earn.

The Twelve-Factor App came out of Heroku, written by people who watched thousands of apps get deployed and noticed the same wounds over and over. It is not a framework you install. It is a set of agreements about how an app relates to its code, its dependencies, and its environment. This phase covers the foundation: the three factors that make a deploy repeatable.

## Factor I — One codebase, many deploys

The terrible day this prevents: two developers each have "the code," they have drifted apart, and nobody can say which one is actually live. Or worse, production is running something that exists in no repository at all because someone SSH'd in and edited a file.

The rule is one-to-one between a codebase and an app, tracked in version control. From that single codebase you produce many **deploys** — staging, production, your laptop, a colleague's review environment. They all run the same code at different versions.

```text
ONE codebase (git repo)
        │
        ├──► deploy: production      (running commit a1b2c3)
        ├──► deploy: staging         (running commit a1b2c3)
        └──► deploy: dev / laptop    (running commit f9e8d7 + edits)
```

*What just happened:* there is exactly one source of truth, and "which version is live" is always answerable — it's a commit hash, not a guess.

If you find yourself copying shared code between two repos, that shared code wants to be a library (a dependency), not a copy-paste. Multiple apps sharing one codebase is a violation too; that's not an app, it's a distributed monolith waiting to surprise you.

## Factor II — Explicitly declare your dependencies

The terrible day: the app runs on your machine, you deploy it, and it crashes because the server doesn't have ImageMagick, or Python 3.12, or that one library you `pip install`-ed by hand eight months ago and forgot about. Your machine has accumulated invisible dependencies. A fresh server has not.

The rule is to declare **every** dependency, exactly, in a manifest the app carries with it — and to isolate so nothing leaks in from the surrounding system.

```bash
# A new teammate clones the repo and runs ONE command.
# Everything the app needs is installed into an isolated environment.

npm ci                 # Node: installs the exact versions from package-lock.json
pip install -r requirements.txt   # Python
bundle install         # Ruby
go mod download        # Go
```

*What just happened:* the manifest plus a lock file pins exact versions, so the install is reproducible. The new teammate's machine now matches yours without anyone reciting setup steps from memory.

The test for whether you've gotten this right: a brand-new developer, or a fresh container, can go from clone to running with one or two documented commands and nothing else. If the real instructions include "oh, you also need to install X globally first," that X is an undeclared dependency. Declare it or vendor it.

> Lock files are not optional clutter. `package-lock.json`, `Pipfile.lock`, `Cargo.lock`, `go.sum` — these pin the *transitive* tree, the dependencies of your dependencies. Without them, "explicitly declared" still drifts.

## Factor III — Store config in the environment

This is the factor people violate most and pay for most. The terrible day: a password, an API key, or a database URL is committed to the repo. Now it's in git history forever, visible to everyone with read access, and rotating it means a code change and a deploy. Or the gentler-but-still-bad version: production and staging differ only in config, but that config is baked into the code, so you maintain three nearly-identical config files and inevitably edit the wrong one.

**Config is everything that varies between deploys.** Database URLs, credentials, the hostname of a backing service, feature flags per environment. It is *not* your routing table or your internal constants — those are the same everywhere, so they belong in the code.

The rule: keep config in **environment variables**, read at runtime, never committed.

```python
# Bad — config baked into the code. Rotating this key means a commit + deploy,
# and the secret is now in git history forever.
DATABASE_URL = "postgres://admin:hunter2@prod-db:5432/app"

# Good — read from the environment. Same code in every deploy;
# only the environment differs.
import os
DATABASE_URL = os.environ["DATABASE_URL"]
```

*What just happened:* the exact same compiled/built artifact now runs in dev, staging, and production. The only thing that changes is the set of environment variables each deploy is handed. Rotating a secret is a config change, not a code change.

A clean litmus test from the original methodology: could you open-source your codebase *right now*, this second, without leaking any credentials? If the answer is no, your config is in the wrong place.

The reason environment variables specifically — rather than a `config.yaml` you forgot to commit, or a "secrets" file — is that they're language-agnostic, OS-standard, and granular per deploy. There's no config file that someone accidentally checks in, no clever framework convention to learn. Every platform on earth knows how to set an env var.

For builders: this is the single highest-leverage factor for a small team. If you do nothing else from this guide, move your secrets out of the code and into the environment. The deeper how-to — `.env` files in dev, secret managers in prod, the precedence rules — lives in /guides/env-vars-and-config.

```quiz
[
  {
    "q": "Under Factor I, what is the correct relationship between a codebase and an app?",
    "choices": ["One codebase can power many apps", "One app has exactly one codebase, with many deploys from it", "Each deploy gets its own codebase", "Apps should share a codebase to reduce duplication"],
    "answer": 1,
    "explain": "One codebase tracked in version control, with many deploys (prod, staging, dev) running it at various versions."
  },
  {
    "q": "What is the litmus test for Factor III (config in the environment)?",
    "choices": ["Does the app start in under one second?", "Could you open-source the codebase right now without leaking any credentials?", "Are all dependencies pinned to exact versions?", "Does staging use a smaller database than production?"],
    "answer": 1,
    "explain": "If open-sourcing the repo would leak secrets, your config (credentials) is wrongly stored inside the code."
  },
  {
    "q": "Why does Factor II insist on a lock file, not only a dependency manifest?",
    "choices": ["Lock files make installs faster", "They pin transitive dependencies to exact versions so installs are reproducible", "They are required by version control", "They encrypt the dependency list"],
    "answer": 1,
    "explain": "A manifest lists what you asked for; the lock file pins the entire transitive tree to exact versions, so every install matches."
  }
]
```

[← Overview](_guide.md) | [Phase 2: Stateless processes, port binding, and scaling out →](02-processes-and-scale.md)
