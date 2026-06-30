---
title: "Pushing, Pulling, and Private Packages"
guide: artifact-registries
phase: 2
summary: "Where your builds live: container and package registries that store, version, and serve your artifacts — with the proxying and access control teams rely on."
tags: [registries, docker, nexus, artifactory, ghcr, artifacts, packages, supply-chain, proxying]
difficulty: intermediate
synonyms: ["what is a docker registry", "docker hub vs ghcr", "nexus vs artifactory", "private npm registry", "proxy public registry", "docker tag immutability", "container registry retention", "vulnerability scanning images", "latest tag overwrite", "self-hosted package registry"]
updated: 2026-06-30
---

# Pushing, Pulling, and Private Packages

You have the mental model. Now the muscle memory: the four moves you'll repeat thousands of times — **log in, tag, push, pull** — and how the same rhythm carries from container images to private npm and Maven packages. The commands differ per tool, but the shape is identical, and once you see the shape you stop memorizing and start understanding.

## The full name of an image tells you where it lives

Before you push anything, understand how a registry decides *where* an image goes. The full reference is structured:

```text
ghcr.io/acme/checkout-api:1.4.0
└──┬──┘ └─┬─┘ └────┬─────┘ └─┬─┘
registry  namespace  name    tag
 host    (org/user) (repo)
```

*What just happened:* the leading hostname is what routes the push. No hostname means Docker Hub by default — `nginx` is really `docker.io/library/nginx`, and `acme/checkout` is `docker.io/acme/checkout`. The moment you put `ghcr.io/...` or `nexus.internal:8082/...` in front, you're aiming at a different registry. Most "why did this push to the wrong place" confusion is a missing or wrong hostname.

## Container images: log in, tag, push, pull

Here's the complete loop against GHCR. The pattern is the same for Docker Hub, ECR, or a self-hosted Nexus — only the hostname and how you authenticate change.

```console
# 1. Authenticate (a Personal Access Token piped to stdin, never on the CLI)
$ echo "$GHCR_TOKEN" | docker login ghcr.io -u my-username --password-stdin
Login Succeeded

# 2. Tag your locally-built image with the full destination reference
$ docker tag checkout-api:dev ghcr.io/acme/checkout-api:1.4.0

# 3. Push it
$ docker push ghcr.io/acme/checkout-api:1.4.0
The push refers to repository [ghcr.io/acme/checkout-api]
5f70bf18a086: Pushed
1.4.0: digest: sha256:9b2a3c... size: 1779

# 4. Anywhere with pull access:
$ docker pull ghcr.io/acme/checkout-api:1.4.0
```

*What just happened:* `docker login` cached a credential for that host. `docker tag` gave your local image a name pointing at GHCR (tagging is local and free — it merely adds a label). `docker push` uploaded the layers and registered the `1.4.0` tag against the resulting digest. Note the `--password-stdin` form: passing a token as a CLI argument leaks it into your shell history and the process list, so always pipe it in.

> Push only the layers the registry doesn't already have. If a base layer is already there from an earlier push, you'll see `Layer already exists` instead of an upload — that's the content-addressed dedup from phase 1 saving you bandwidth.

## Tag the same image more than once

A single image (one digest) can wear several tags at once. This is how teams point both a precise version and a moving label at the same build:

```console
$ docker tag checkout-api:dev ghcr.io/acme/checkout-api:1.4.0
$ docker tag checkout-api:dev ghcr.io/acme/checkout-api:1.4
$ docker tag checkout-api:dev ghcr.io/acme/checkout-api:latest
$ docker push --all-tags ghcr.io/acme/checkout-api
```

*What just happened:* one set of bytes now answers to `1.4.0`, `1.4`, and `latest`. Pulling any of the three gives the identical digest *today*. The danger — which phase 3 unpacks — is that `1.4` and `latest` are designed to move to a *newer* build later, while `1.4.0` is the one you promise never moves.

## Private packages: one registry for npm, Maven, PyPI

This is where Nexus and Artifactory earn their place. Instead of publishing internal libraries to the public npm or Maven Central, you publish them to *your* registry, and your tooling pulls from there. The publishing protocol is each ecosystem's native one — you don't learn a new tool, you point the tool you already use at a new URL.

**npm** — point the client at your registry and authenticate via `.npmrc`:

```text
# .npmrc — scope @acme to the private registry, leave everything else public
@acme:registry=https://nexus.internal/repository/npm-private/
//nexus.internal/repository/npm-private/:_authToken=${NPM_TOKEN}
```

```console
$ npm publish               # publishes @acme/* to nexus-private
$ npm install @acme/ui-kit  # resolves @acme/* from nexus, the rest from public npm
```

*What just happened:* the scoped line says "anything named `@acme/...` comes from our private registry"; unscoped packages still flow from the public default. One registry serves your private code without you forking the entire npm ecosystem. The `_authToken` references an env var so the secret stays out of the committed file.

**Maven** — declare the repository and credentials, then deploy:

```xml
<!-- pom.xml -->
<distributionManagement>
  <repository>
    <id>acme-releases</id>
    <url>https://nexus.internal/repository/maven-releases/</url>
  </repository>
</distributionManagement>
```

```console
$ mvn deploy    # uploads the jar + pom to maven-releases
```

*What just happened:* `mvn deploy` pushed your built jar and its metadata to the Nexus `maven-releases` repo. Credentials live in `~/.m2/settings.xml` keyed by the `<id>`, so the secret stays out of the project's `pom.xml`. A teammate who lists your Nexus as a repository now resolves your internal jar exactly like a public one.

## Authentication, in one breath

Every registry, regardless of format, gates push and pull behind credentials. The mechanism varies but the principle is constant: **machines authenticate with tokens, not passwords.**

```console
# Docker Hub / GHCR / Nexus / Artifactory all follow this shape:
$ echo "$TOKEN" | docker login <registry-host> -u <user> --password-stdin

# Cloud registries often mint a short-lived token from your existing identity:
$ aws ecr get-login-password | docker login --password-stdin <acct>.dkr.ecr.<region>.amazonaws.com
```

*What just happened:* the first form is a static token you create in the registry's UI. The second is better where available — the cloud CLI exchanges your already-authenticated identity for a short-lived token, so there's no long-lived secret sitting in a CI variable waiting to leak. Prefer short-lived, scoped tokens over personal passwords everywhere you can.

## In the wild

A typical mid-size team runs one Nexus or Artifactory as the single front door: private npm under `@company`, internal Maven jars, Python wheels, *and* container images, all behind the same SSO and token policy. Developers point npm/Maven/pip/Docker at it once in their config and forget it exists — which is exactly the goal. The registry becomes invisible plumbing, and invisible plumbing is plumbing that works.

```quiz
[
  {
    "q": "In the reference ghcr.io/acme/checkout-api:1.4.0, which part decides which registry server the push goes to?",
    "choices": [
      "checkout-api (the repo name)",
      "ghcr.io (the leading hostname)",
      "1.4.0 (the tag)",
      "acme (the namespace)"
    ],
    "answer": 1,
    "explain": "The leading hostname routes the push. No hostname defaults to Docker Hub (docker.io); ghcr.io or a Nexus host aims elsewhere."
  },
  {
    "q": "Why pipe a token via --password-stdin instead of passing it as a CLI argument to docker login?",
    "choices": [
      "It makes the login faster",
      "CLI arguments leak the token into shell history and the process list; stdin keeps it out",
      "Docker only accepts tokens via stdin",
      "It compresses the token"
    ],
    "answer": 1,
    "explain": "A token passed as an argument shows up in shell history and process listings. Piping it to stdin avoids that exposure."
  },
  {
    "q": "What does the .npmrc line `@acme:registry=https://nexus.internal/...` accomplish?",
    "choices": [
      "It moves the entire public npm registry to Nexus",
      "It routes only @acme-scoped packages to the private registry, leaving unscoped packages on public npm",
      "It deletes public packages from your cache",
      "It disables authentication for @acme packages"
    ],
    "answer": 1,
    "explain": "Scoped config routes @acme/* to the private registry while everything else still resolves from the public default — one registry for your private code, no forking npm."
  }
]
```

[← Phase 1: What a Registry Actually Is](01-what-a-registry-actually-is.md) | [Overview](_guide.md) | [Phase 3: Proxying, Retention, Scanning, and the Tag Trap](03-proxying-retention-scanning-gotchas.md) →
