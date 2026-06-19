---
title: "Versions & Artifacts"
guide: "build-and-release-basics"
phase: 2
summary: "Give each release a version number so people can talk about it, freeze the artifact so it never changes after it's built, and store it in a registry so the exact same build can be fetched anywhere."
tags: [versioning, semantic-versioning, artifacts, immutable, artifact-registry, release]
difficulty: beginner
synonyms: ["what is semantic versioning", "what do version numbers mean", "what is an immutable artifact", "build once deploy everywhere", "what is an artifact registry", "what is a docker registry"]
updated: 2026-06-19
---

# Versions & Artifacts

You've got an artifact — a trustworthy, runnable thing your build produced. Now real life shows up. Someone reports "the bug in the version from last Tuesday." Someone asks "are we running the same build on the two servers?" Someone needs to roll back to "the one before the broken one." Every one of those sentences needs the artifact to have a *name* you can point at, and a guarantee that the named thing never quietly changes underneath you.

That's what this phase is about: numbering releases so humans can talk about them, and freezing artifacts so the words still mean something tomorrow.

## Versioning: a name everyone can agree on

**What it actually is.** A version is a label you stamp on a release so that a specific build has a name. Instead of "the build from the deploy that Priya did, you know, the afternoon one," everyone can say "**1.4.0**" and mean the exact same thing.

**The common convention: semantic versioning.** The most widespread scheme is **semantic versioning** (often written *semver*): three numbers separated by dots, like `2.5.1`. Each number carries a meaning:

```text
        2  .  5  .  1
        │     │     │
        │     │     └── PATCH  → backward-compatible bug fixes only
        │     └──────── MINOR  → new features, nothing existing breaks
        └────────────── MAJOR  → a breaking change; users may need to adapt
```

The promise is simple and humane: the version number tells you *how scared to be* about upgrading. A jump from `2.5.1` to `2.5.2` is a safe bug fix. `2.5.1` to `2.6.0` adds something new but won't break what you had. `2.5.1` to `3.0.0` is a warning: something changed in a way that might break you, so read the notes before you upgrade. (The full rules live at [semver.org](https://semver.org).)

📝 **Terminology.** *Backward-compatible* means existing users keep working without changing anything. A *breaking change* is the opposite: the new version drops or changes something people relied on, so they have to adjust. The whole point of the MAJOR number is to make breaking changes loud instead of surprising.

**Why this saves you later.** When you can say "we're on `1.4.0`, the bug appeared in `1.5.0`, roll us back to `1.4.0`," an outage becomes a calm, precise conversation instead of a scramble. Version numbers turn "some build, somewhere" into something you can reason about under pressure.

## Immutable artifacts: build once, never change it

**What it actually is.** An artifact is **immutable** when, once it's built and labeled, it never changes — not one byte. Version `1.4.0` is `1.4.0` forever. If you need a fix, you build a *new* artifact with a *new* version (`1.4.1`); you never reach back and edit `1.4.0` in place.

📝 **Terminology.** *Immutable* just means "cannot be changed after it's created." An immutable artifact is a frozen photograph of one build, not a document people keep editing.

**Why people get this wrong.** It's tempting to treat the deployed thing as something you tweak: SSH into the server, edit a file, "just patch it live." The moment you do, the running thing no longer matches *any* version you have a name for. Now "we're running `1.4.0`" is a lie, and nobody can reproduce, test, or roll back what's actually live. The version label has come unstuck from reality.

**The rule that fixes it: build once, deploy the same thing everywhere.** You build the artifact a *single* time, freeze it, and then move that *identical* frozen artifact wherever it needs to go. You do not rebuild it for testing and then rebuild it again for production — that would produce two different artifacts that you only *hope* are the same.

```text
   ❌ Rebuild per destination          ✅ Build once, deploy the same artifact

   source → build → test server        source → build → 1.4.0 (frozen)
   source → build → prod server                          │   │
        (two builds = two              deploy ───────────┘   │
         different artifacts,          the SAME 1.4.0 ───────┘
         only HOPED to match)          to test AND to prod
```

⚠️ **The gotcha.** "We rebuild for production" sounds responsible, but it quietly breaks the chain of trust. The artifact you *tested* and the artifact you *shipped* came out of two separate build runs — a dependency could have updated, a tool could differ, the clock could have ticked past something. You tested one thing and shipped another. The whole reason Phase 1 insisted on reproducible builds is so you *don't have to* rebuild: you build the trustworthy artifact once and carry that exact one forward.

**Why this saves you later.** Immutability is what makes a rollback real. If `1.5.0` is broken, you can redeploy the untouched `1.4.0` artifact and *know* it's exactly what worked before, because nothing was allowed to change it. "Build once, deploy everywhere" is the single rule that makes the rest of releasing trustworthy — and it's the setup for Phase 3.

## Artifact registries: where built things live

**What it actually is.** Once you've built and frozen an artifact, it needs a home — somewhere central that every machine can fetch the exact same copy from. That home is an **artifact registry**: a storage system for built artifacts, organized by name and version.

**What it does in real life.** You build an artifact, push it to the registry under a name and version, and from then on any server, teammate, or automated system can pull *that specific version* back down. The registry is the source of truth for "what does `1.4.0` actually consist of."

You've almost certainly used one already. A **container registry** like Docker Hub stores container images:

```console
$ docker build -t myapp:1.4.0 .

$ docker push myapp:1.4.0
The push refers to repository [docker.io/yourname/myapp]
9f2a1c7e: Pushed
1.4.0: digest: sha256:3b1e... size: 1574
```

*What just happened:* `docker build` produced an image artifact and labeled it `myapp:1.4.0`. `docker push` uploaded that exact image to the registry. From now on, anyone (or any server) can run `docker pull myapp:1.4.0` and receive the *identical* image — note the `digest: sha256:...`, a fingerprint of the exact bytes, so there's no doubt two machines got the same thing. The registry is how "the same artifact everywhere" stops being a wish and becomes a fact.

📝 **Terminology.** A *registry* stores built artifacts (Docker Hub for container images, npm for JS packages, a Maven repository for Java, and so on). It is *not* the same as a *Git repository*, which stores your *source code*. Source lives in Git; the built artifacts live in a registry. Keeping those two straight clears up a lot of early confusion.

**Why this saves you later.** When the artifact lives in a registry under a fixed version, "deploy `1.4.0` to that new server" is a download, not a rebuild. The registry is the bridge between "we built it once" and "it now runs identically in five places" — which is exactly the trip we take in the next phase.

## Recap

1. **Version your releases** so a specific build has a name everyone shares. **Semantic versioning** (`MAJOR.MINOR.PATCH`) encodes how risky an upgrade is.
2. **Artifacts are immutable:** once built and labeled, they never change. A fix means a new version, never an edit to the old one.
3. **Build once, deploy the same artifact everywhere** — rebuilding per destination silently breaks the link between what you tested and what you shipped.
4. **An artifact registry** is where frozen artifacts live, so any machine can pull the exact same version on demand.

You now have a named, frozen artifact sitting in a registry. The last question is the one that bites everyone: how do you move that one artifact through dev, staging, and production — and why does it sometimes work in one and break in the next?

---

[← Phase 1: What "Building" Actually Produces](01-what-building-produces.md) · [Guide overview](_guide.md) · [Phase 3: Environments & Promotion →](03-environments-and-promotion.md)
