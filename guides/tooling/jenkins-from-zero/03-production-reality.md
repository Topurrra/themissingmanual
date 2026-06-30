---
title: "Production reality: plugins, credentials, and the tradeoffs"
guide: jenkins-from-zero
phase: 3
summary: "The CI server that still runs much of enterprise: the Jenkinsfile pipeline-as-code, stages and steps, agents, and the plugin ecosystem for better and worse."
tags: [jenkins, ci, cd, pipeline, jenkinsfile, automation, devops]
difficulty: intermediate
synonyms: ["jenkins tutorial", "jenkinsfile", "declarative pipeline", "jenkins pipeline", "jenkins stages steps", "jenkins agent", "jenkins plugins", "jenkins credentials", "ci server jenkins"]
updated: 2026-06-30
---

# Production reality: plugins, credentials, and the tradeoffs

You can read and write a `Jenkinsfile` now. This phase is about everything the happy path doesn't show you: where the power comes from, where the pain comes from, how to handle secrets without leaking them, and the honest answer to "should we even be on Jenkins."

## Plugins: the superpower and the curse

Almost nothing in Jenkins is built in. The ability to talk to Git, to Docker, to Slack, to a cloud provider, to publish a coverage report, every one of those is a **plugin**. There are thousands. This is genuinely why Jenkins can do anything: if a tool exists, someone wrote a Jenkins plugin for it.

It is also the single largest source of Jenkins pain, for reasons worth naming plainly:

- **Plugins are third-party code with full reach into your server.** A plugin can read every credential and run on your controller. The blast radius of a bad one is the whole instance.
- **They have their own versions and their own bugs.** A core upgrade can break a plugin; a plugin upgrade can break a build. There is no single vendor who owns the whole stack working together.
- **They rot.** The maintainer moves on, the plugin stops getting updates, and one day a security advisory lands on something you can't easily replace.
- **They pile up.** Every "let me install this to try it" leaves a plugin behind. Inherited servers commonly carry dozens nobody can account for.

```text
Manage Jenkins → Plugins → Installed

  ✓ Git plugin                    5.x      (in use)
  ✓ Pipeline                      core     (in use)
  ✓ Docker Pipeline               (in use)
  ⚠ Some Old Reporter             no update in years
  ⚠ Mystery Integration          nobody remembers installing this
```

*What just happened:* this is the screen where reality lives. The discipline that keeps a Jenkins server healthy is boring and constant: install only what a pipeline actually needs, keep what you have updated, and uninstall what nothing uses. Treat the plugin list like a dependency file, because that is exactly what it is.

> A practical habit: before installing a plugin, ask whether a plain `sh` step calling a CLI would do the same job. A shell call to `curl` or the `aws` CLI is often more transparent and more maintainable than a plugin that wraps the same thing behind a UI.

## Credentials: never paste a secret in the Jenkinsfile

Your pipeline needs secrets, a registry password, a deploy key, an API token. The `Jenkinsfile` is in Git, readable by everyone with repo access, so a secret in there is a secret published to your whole team and its history forever.

Jenkins solves this with its **Credentials** store. You add a secret once, through the UI (or configuration-as-code), under `Manage Jenkins → Credentials`. Each gets an ID. Your pipeline references the ID, never the value.

```groovy
pipeline {
    agent any
    environment {
        // Pulls the secret named 'registry-token' from the credential store.
        // The Jenkinsfile holds only the ID, never the value.
        REGISTRY_TOKEN = credentials('registry-token')
    }
    stages {
        stage('Push') {
            steps {
                sh 'docker login -u ci --password-stdin <<< "$REGISTRY_TOKEN"'
            }
        }
    }
}
```

*What just happened:* `credentials('registry-token')` looked up the stored secret by ID and bound its value to `REGISTRY_TOKEN` only for the duration of the build. The actual secret never appears in your repo. Jenkins also **masks** it in the build log, so if it accidentally gets echoed, it shows as `****` instead of the real value. For credentials scoped to a single block, the `withCredentials` step does the same thing with a tighter lifetime.

A blunt rule that has saved many incidents: if you ever see a real password, token, or key typed directly into a `Jenkinsfile` or an `environment` value, treat it as a leak. Move it to the credential store and rotate it.

## The honest tradeoffs: why teams love it and hate it

You will form an opinion about Jenkins. Here is a fair one to start from.

**Why teams keep it:**

- **You own it.** It runs on your hardware, your network, your rules. For regulated industries where code cannot leave the building, this is not a preference, it's a requirement.
- **It does everything.** Between plugins and raw `sh` steps, there is no build, deploy, or automation task it can't be bent to.
- **No usage bill.** A cloud CI service charges per build minute. A Jenkins box you already run has no per-minute meter; your cost is the machine and the maintenance.

**Why teams curse it:**

- **Somebody has to run it.** Patching, upgrades, agent management, plugin hygiene, backups, that's a real, ongoing job. Cloud CI hands that work to the vendor.
- **The maintenance burden is exactly the cost the "no bill" point hides.** You pay in engineer-hours instead of dollars.
- **The plugin fragility above is constant**, and the UI and defaults show their age.

Where it fits today, honestly: if you're a small team or a greenfield project with code that's allowed in the cloud, a hosted CI like GitHub Actions (see [/guides/your-first-pipeline-github-actions](/guides/your-first-pipeline-github-actions)) will cost you far less pain to start. Jenkins earns its place when you need self-hosting, when you're already deep in it, or when you need something no SaaS offers. It is not the exciting choice, and it is not going away, because the ground it owns, the enterprise that must self-host, isn't going anywhere either.

## What to do when you inherit one

A short, practical playbook, because this is the most likely way you'll meet Jenkins:

1. **Find the Jenkinsfiles.** Read them. They are the actual source of truth for what builds. Verify with: a stage view in the UI maps directly to the `stage` blocks you read.
2. **Audit the plugins.** `Manage Jenkins → Plugins`. Note anything unmaintained or unrecognized. Verify with: cross-reference each against what your pipelines actually call.
3. **Check credentials hygiene.** Confirm secrets live in the credential store, not pasted into Jenkinsfiles. Verify with: grep your repos for anything that looks like a key in a Jenkinsfile.
4. **Confirm there's a backup.** The controller's configuration is the crown jewels. Verify with: locate where `JENKINS_HOME` is backed up, and when it last ran.

For builders: the long-term move once you understand an inherited instance is to push everything *toward* code, Jenkinsfiles in repos, and configuration-as-code for the controller itself, so the server becomes reproducible instead of a hand-tuned pet nobody dares touch.

```quiz
[
  {
    "q": "What is the biggest risk created by Jenkins's plugin ecosystem?",
    "choices": ["Plugins make builds slower", "Plugins are third-party code with full server reach, can rot, and conflict across versions", "Plugins cost money per install", "Plugins can only be installed on agents"],
    "answer": 1,
    "explain": "Plugins are powerful because they integrate everything, but each is third-party code that can read credentials, break on upgrades, lose its maintainer, and accumulate unmanaged. Treat the plugin list like a dependency file."
  },
  {
    "q": "How should a secret like a registry token be handled in a pipeline?",
    "choices": ["Paste it into the environment block as plain text", "Hardcode it in a stage's sh step", "Store it in the Jenkins credential store and reference it by ID with `credentials()`", "Commit it to the repo in a separate file"],
    "answer": 2,
    "explain": "The Jenkinsfile lives in Git, so any secret in it is published. The credential store holds the value; the pipeline references only the ID, and Jenkins masks the value in logs."
  },
  {
    "q": "When does Jenkins most clearly earn its place over a hosted CI like GitHub Actions today?",
    "choices": ["For brand-new small projects with cloud-friendly code", "When you need self-hosting, are already deep in it, or need something no SaaS offers", "When you want zero maintenance work", "When you want the most modern UI"],
    "answer": 1,
    "explain": "Hosted CI is usually less painful to start for greenfield, cloud-allowed projects. Jenkins's strength is self-hosting and total flexibility - exactly what regulated, self-hosted, or already-invested teams need."
  }
]
```

[← Phase 2: The Jenkinsfile](02-the-jenkinsfile.md) | [Overview](_guide.md)
