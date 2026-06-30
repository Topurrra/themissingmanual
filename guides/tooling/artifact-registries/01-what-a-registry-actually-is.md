---
title: "Artifact Registries: Docker Hub, Nexus, Artifactory"
guide: artifact-registries
phase: 1
summary: "Where your builds live: container and package registries that store, version, and serve your artifacts — with the proxying and access control teams rely on."
tags: [registries, docker, nexus, artifactory, ghcr, artifacts, packages, supply-chain, proxying]
difficulty: intermediate
synonyms: ["what is a docker registry", "docker hub vs ghcr", "nexus vs artifactory", "private npm registry", "proxy public registry", "docker tag immutability", "container registry retention", "vulnerability scanning images", "latest tag overwrite", "self-hosted package registry"]
updated: 2026-06-30
---

# What a Registry Actually Is

Think about what a build produces. You run a `docker build` and get an image. You run `mvn package` and get a jar. You run `npm publish` and you've got a tarball. These are **artifacts** — the compiled, packaged, ready-to-ship outputs of your work. They are not source code; source lives in Git. Artifacts are what source *becomes*, and they need a different kind of home, because they are large, binary, versioned, and pulled by machines you'll never log into.

That home is an **artifact registry**: a server that stores artifacts, organizes them by name and version, and serves them over HTTP to anyone (or any pipeline) with permission to pull. Git is for the recipe; the registry is for the cake.

## Two flavors, one idea

You'll meet registries in two shapes, and it helps to see they're the same idea wearing different clothes:

- **Container registries** store OCI images. Docker Hub is the public default; **GHCR** (GitHub Container Registry, `ghcr.io`) lives next to your repos; every cloud has one (ECR, GCR/Artifact Registry, ACR).
- **Package/multi-format registries** store language packages — npm, Maven, PyPI, NuGet, Go modules, and often container images too. **Nexus** (Sonatype) and **Artifactory** (JFrog) are the two big self-hosted, multi-format players. One server, many package types.

```text
  your build  ─push─▶   REGISTRY   ─pull─▶  CI / teammates / production
   (image,              (stores +
    jar, npm)            versions +
                         serves)
```

*What just happened:* the registry sits in the middle of everything that produces and everything that consumes artifacts. That central position is exactly why getting it right matters — a flaky or untrustworthy registry breaks builds and deploys everywhere downstream at once.

## The part that governs everything: tags vs digests

Here is the single most important idea in the whole guide, and the source of most registry pain when it's misunderstood.

When you push a container image, the registry stores the actual bytes under a **digest** — a content hash that looks like `sha256:9b2a...`. The digest *is* the content. Change one byte of the image and you get a completely different digest. A digest is permanent and immutable: `sha256:9b2a...` will forever mean exactly those bytes, or it won't exist at all.

A **tag** — like `1.4.0` or `latest` — is a separate, human-friendly *label* that points at a digest. And a tag is a pointer that can be moved.

```console
$ docker pull nginx:1.27.0
1.27.0: Pulling from library/nginx
Digest: sha256:67682bda769fae1ccf5183192b8daf37b64cae99c6c3302650f6f8bf5f0f95df
Status: Downloaded newer image for nginx:1.27.0
```

*What just happened:* you asked for the tag `1.27.0`, and the registry resolved it to a digest and handed you those exact bytes. The tag was the address; the digest was the content. To pin truly immutable, you can pull by digest directly — `docker pull nginx@sha256:67682b...` — and you will get those bytes no matter what anyone does to the tag later.

> The mental model that saves you: a **digest is a fact** (this content, forever). A **tag is an opinion** (right now, I think `1.27.0` means this). Opinions can change. Facts cannot.

## Why immutability is the whole game

Once you internalize "tag is a movable pointer, digest is fixed content," the rest of registry behavior stops surprising you.

Most version tags *should* behave as if immutable: once `myapp:1.4.0` is built and pushed, it should mean that exact build forever, so that the image your CI tested is byte-for-byte the image production runs. If someone can re-push a different image to `1.4.0`, you've lost the thread that connects "what we tested" to "what we shipped."

The famous exception is `latest`. It is a tag like any other, with zero special meaning to the registry — it's a conventional name people move to point at "the most recent build." That convenience is also a footgun, which we'll dissect in phase 3.

```console
# Two ways to reference the same image:
$ docker pull myapp:1.4.0                    # by tag — convenient, movable
$ docker pull myapp@sha256:9b2a3c...         # by digest — pinned, immutable
```

*What just happened:* the first line trusts that the `1.4.0` pointer still aims where you expect. The second line bypasses tags entirely and demands specific content. Production deploys that care about reproducibility increasingly pin by digest for exactly this reason.

## Why not keep artifacts in Git or a file share?

People try. Here's why it falls apart, so you understand what a registry is actually buying you:

- **Versioning that machines understand.** A registry exposes a standard API (the OCI distribution spec for images, ecosystem-specific protocols for npm/Maven/PyPI) so `docker pull`, `npm install`, and `mvn` all work against it without custom glue.
- **Deduplication by content.** Images are built in layers; packages share dependencies. A registry stores each unique layer/blob once and references it from many artifacts, so ten images sharing a base layer don't cost ten copies.
- **Access control and provenance.** Who can push? Who can pull? When was this published, and by whom? A registry answers these; a shared folder does not.

A Git repo is built for diffable text and small files with full history. A 900 MB image with binary layers is everything Git is bad at.

## For builders

If you're standing up infrastructure, your first registry decision is usually "public-hosted vs self-hosted." Docker Hub and GHCR are managed and zero-ops for images. Nexus and Artifactory are servers you run, earning their keep when you need one place for *many* package formats, fine-grained access control, and the proxying and retention features we'll cover later. There's no universally right answer — there's the one that fits your team's formats, scale, and tolerance for running infrastructure.

```quiz
[
  {
    "q": "In a container registry, what is the relationship between a tag and a digest?",
    "choices": [
      "A tag and a digest are two names for the exact same immutable thing",
      "A digest is a content hash that permanently identifies specific bytes; a tag is a movable label that points at a digest",
      "A tag is the content hash; a digest is the human-friendly label",
      "Digests are only used by Nexus, not Docker Hub"
    ],
    "answer": 1,
    "explain": "The digest is the content (a permanent hash of the bytes). The tag is a separate pointer that can be moved to point at a different digest."
  },
  {
    "q": "Why store images and packages in a registry instead of a Git repo or shared folder?",
    "choices": [
      "Registries are always cheaper than Git",
      "Git cannot store any binary files at all",
      "Registries speak standard pull APIs, deduplicate by content (shared layers/blobs), and enforce access control and provenance",
      "Registries automatically rewrite your source code"
    ],
    "answer": 2,
    "explain": "Registries are purpose-built for versioned binary artifacts: a standard pull API, content-addressed dedup, and access control — all things Git and file shares handle poorly."
  },
  {
    "q": "What does pulling by digest (image@sha256:...) guarantee that pulling by tag does not?",
    "choices": [
      "A faster download",
      "You get exactly those bytes regardless of whether anyone later moves the tag",
      "The image is automatically scanned for vulnerabilities",
      "The registry deletes all other tags"
    ],
    "answer": 1,
    "explain": "A digest is content-addressed and immutable, so it always resolves to the same bytes. A tag is a movable pointer that someone could repoint."
  }
]
```

[← Overview](_guide.md) | [Phase 2: Pushing, Pulling, and Private Packages](02-pushing-pulling-private-packages.md) →
