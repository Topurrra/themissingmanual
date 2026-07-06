---
title: "The Themes Underneath the Tool Names"
guide: "what-tooling-even-is"
phase: 2
summary: "The 54 tools in this category cluster into about a dozen real-world problems - migrations, builds, messaging, CI/CD, containers, infra as code, cloud, observability, testing, code quality, auth, and secrets. Find your theme, skip the rest."
tags: [tooling, devops, overview, map, beginner]
difficulty: beginner
synonyms:
  - map of devops tools
  - categories of developer tools
  - what problem does this tool solve
  - types of tooling
updated: 2026-07-06
---

# The Themes Underneath the Tool Names

Fifty-four names stop being 54 things to learn once you see they cluster into about a dozen real problems. Each tool below exists to solve one of these - find the theme that matches what your job needs, then read one guide, not fifty-four.

**Database migrations** - keeping schema changes versioned and applied in the same order everywhere, instead of hand-run SQL nobody can reconstruct. [`/guides/flyway-database-migrations`](/guides/flyway-database-migrations) is the reference example; every other migration tool (Liquibase, Alembic, Prisma Migrate) solves the identical problem in a different language's idiom.

**Build & package managers** - compiling code and resolving dependencies without version conflicts blowing up the build. Every language ecosystem has its own (npm for JavaScript, Maven/Gradle for Java, pip/Poetry for Python) - you need exactly one, whichever matches your stack.

**Messaging & caching** - moving data between services asynchronously, or holding hot data in memory instead of hitting a database every time. [`/guides/kafka-from-zero`](/guides/kafka-from-zero) covers the durable-log style of messaging; a cache like Redis solves a different problem (speed) with a different shape (key-value, often ephemeral).

**CI/CD** - running tests and shipping code automatically on every push, instead of a person manually deploying from their laptop. [`/guides/gitlab-ci-cd`](/guides/gitlab-ci-cd) is one concrete pipeline tool among several (Jenkins, CircleCI) that all answer the same question: what happens the moment you push?

**Containers & orchestration** - packaging an app with everything it needs to run, then scheduling many of those packages across machines. [`/guides/kubectl-day-to-day`](/guides/kubectl-day-to-day) is the daily-driver skill for a Kubernetes cluster someone else already stood up.

**Infrastructure as code** - describing servers, networks, and cloud resources as files instead of clicking through a console, so the setup is reviewable and repeatable. Terraform and Pulumi are the two dominant answers to this same problem.

**Cloud platforms** - the actual hosting providers (AWS, GCP, Azure) and their core building blocks: compute, storage, networking. [`/guides/aws-core-services`](/guides/aws-core-services) is a concrete on-ramp; most jobs use exactly one cloud provider, so you only need the one your employer picked.

**Observability** - knowing what your running system is actually doing: traces, metrics, and logs when something breaks at 2am. [`/guides/opentelemetry-from-zero`](/guides/opentelemetry-from-zero) covers the vendor-neutral instrumentation layer that feeds whichever dashboard your company uses on top.

**Testing tools** - automatically checking that code works, from unit tests to full browser simulations. [`/guides/pytest-from-zero`](/guides/pytest-from-zero) is the Python example; every language has an equivalent, and the underlying idea - write the check once, run it forever - is identical.

**Code quality** - catching style issues and bugs before a human reviewer has to. [`/guides/eslint-and-prettier`](/guides/eslint-and-prettier) auto-formats and lints JavaScript; most languages have a matching pair of tools doing the same two jobs.

**Auth & identity** - proving who a user or service is, and what they're allowed to do. [`/guides/oauth2-and-oidc`](/guides/oauth2-and-oidc) covers the protocol-level standard; [`/guides/jwt-in-depth`](/guides/jwt-in-depth) covers the token format that often carries the result.

**API & search** - defining how services talk to each other and making large datasets findable. This includes API schema tools (OpenAPI/Swagger) and search engines like Elasticsearch that index text for fast lookup.

**Secrets & supply chain** - keeping credentials out of source code and knowing what's actually inside the third-party packages you depend on. HashiCorp Vault and dependency-scanning tools both live here, solving "don't leak this" and "don't trust this blindly" respectively.

## Using this map

Match your actual task to a theme, then open exactly one guide from that theme. If your job is "add a column to the users table safely," that's the migrations theme - you don't need to know what's in the observability theme to do that task. The other eleven themes stay closed until a task actually needs them.

Some tools straddle two themes on purpose - a tool like Sentry does error tracking (observability) but also feeds into incident response (a workflow theme, not a tool theme). Don't force every tool into exactly one box; the themes are a map for navigation, not a strict taxonomy.

```quiz
[
  {
    "q": "What's the fastest way to find the right guide for a task, using this map?",
    "choices": ["Read all 54 guides in order", "Match your task to one of the ~12 themes, then read one guide from it", "Pick whichever tool has the most tutorials online"],
    "answer": 1
  },
  {
    "q": "Kafka and Redis are both in 'Messaging & caching' - why aren't they interchangeable?",
    "choices": ["They are interchangeable, pick either", "They solve different problems - durable event logs vs. fast in-memory lookups - despite sharing a theme", "Redis is just an older version of Kafka"],
    "answer": 1
  },
  {
    "q": "If your task is 'set up automatic tests to run on every push,' which theme covers it?",
    "choices": ["Infrastructure as code", "CI/CD", "Secrets & supply chain"],
    "answer": 1
  }
]
```

---

[← Phase 1: Why There Are 50+ Tools](01-why-there-are-50-plus-tools.md) · [Guide overview](_guide.md) · [Phase 3: How to Learn a New Tool Fast →](03-how-to-learn-a-new-tool-fast.md)
