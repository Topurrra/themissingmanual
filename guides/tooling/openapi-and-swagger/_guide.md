---
title: "OpenAPI and Swagger"
guide: openapi-and-swagger
phase: 0
summary: "Describe your REST API once in OpenAPI, and get interactive docs, client SDKs, request validation, and contract tests for free — the API as a spec."
tags: [openapi, swagger, rest, api, documentation, tooling]
category: tooling
group: "API & Search"
order: 49
difficulty: intermediate
synonyms: ["what is openapi", "swagger vs openapi", "openapi spec", "swagger ui", "generate api docs from openapi", "design first api", "openapi codegen"]
updated: 2026-06-30
---

# OpenAPI and Swagger

You've written a REST API. Now someone wants docs, and someone else wants a client library, and a third person keeps calling your endpoint with the wrong field names. You could write all that by hand, three times, and watch it drift out of date the moment you ship the next endpoint. Or you could describe the API once, in a file, and let machines do the rest. That file is an OpenAPI document, and this guide is about treating it as the single source of truth instead of an afterthought.

## How to read this

Read in order. Phase 1 builds the mental model: what OpenAPI actually is, why "Swagger" and "OpenAPI" are two names for overlapping things, and why a machine-readable contract changes how you work. Phase 2 is the everyday core: writing a spec by hand, generating docs and clients, and choosing between design-first and code-first. Phase 3 is production reality: validation, mocking, contract tests, versioning, and the gotchas that bite teams who treat the spec as decoration.

## The phases

1. [Phase 1: The Contract, Not the Docs](01-the-contract-not-the-docs.md) — what OpenAPI is and why a machine-readable spec exists.
2. [Phase 2: Writing and Generating From the Spec](02-writing-and-generating.md) — author a spec, render docs, generate clients, pick a workflow.
3. [Phase 3: The Spec at Work in Production](03-the-spec-in-production.md) — validation, mocking, contract tests, versioning, and the traps.

[Phase 1: The Contract, Not the Docs](01-the-contract-not-the-docs.md) →
