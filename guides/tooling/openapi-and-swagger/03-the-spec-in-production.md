---
title: "The Spec at Work in Production"
guide: openapi-and-swagger
phase: 3
summary: "Describe your REST API once in OpenAPI, and get interactive docs, client SDKs, request validation, and contract tests for free — the API as a spec."
tags: [openapi, swagger, rest, api, documentation, tooling]
difficulty: intermediate
synonyms: ["what is openapi", "swagger vs openapi", "openapi spec", "swagger ui", "generate api docs from openapi", "design first api", "openapi codegen"]
updated: 2026-06-30
---

# The Spec at Work in Production

A spec that only renders docs is a brochure. A spec doing real work *enforces* the contract: it rejects bad requests, stands in for the API before the API exists, and fails the build the day the live API stops matching its promise. This is also where teams get burned — usually by trusting a spec that quietly drifted out of sync with reality. Let's wire it up properly and name the traps.

## Validation: reject bad requests at the door

Your spec already says `url` is required and `id` is an integer. A validation middleware reads that and enforces it *before* the request reaches your handler — so your business logic never has to re-check what the contract already guarantees.

```text
POST /bookmarks   { "title": "no url here" }

→ 400 Bad Request
{
  "errors": [
    { "path": "/url", "message": "must have required property 'url'" }
  ]
}
```

*What just happened:* the request never reached your code. The middleware compared the body against the spec's schema, saw `url` missing, and returned a 400 with a precise reason. You wrote the rule once (in the spec) and it's enforced automatically. The same idea runs in reverse — *response* validation in tests catches the day your handler starts returning a shape the spec doesn't promise.

> Validation is only as honest as the spec. If the spec is generated code-first from the same handlers it's "validating," it can't catch a mismatch — the handler and the rule have the same author. Design-first specs (written independently) make validation a genuine second opinion.

## Mocking: an API before the API exists

Because the spec describes every response shape, a mock server can serve fake-but-valid responses straight from the file — no backend required. Frontend builds against the mock on Monday; backend delivers the real thing on Friday; nothing blocks. Tools like Prism do this:

```bash
prism mock openapi.yaml
# [GET] /bookmarks/1  →  200  { "id": 1, "url": "https://example.com" }
```

*What just happened:* Prism read the spec and started a server that answers every documented endpoint with example data matching the declared schema. The frontend team now has a working API to call before a single handler exists. The contract became a stand-in for the product.

## Contract tests: catch the drift

This is the one that saves you at 3am. Code changes. Specs are forgotten. Six months in, the live API returns `created_at` but the spec still says `createdAt`, and every generated client is subtly wrong. A contract test runs the *real* API against the spec and fails when they disagree.

```bash
schemathesis run --url http://localhost:3000 openapi.yaml
# generates requests from the spec, checks every response against it
# FAILED: GET /bookmarks/1 — response has 'created_at', spec declares 'createdAt'
```

*What just happened:* Schemathesis read the spec, generated real requests for every endpoint, hit the running API, and compared each response against the promised schema. It found the drift a human review would have missed. Wire this into CI and the build goes red the moment code and contract part ways — the spec stays honest because a machine checks it on every push.

```text
  spec ──┐
         ├─→ contract test ─→ ✅ match  → merge
  API  ──┘                  └─→ ❌ drift → fail CI
```

*What just happened:* the test sits between the spec and the live API and refuses to let them diverge silently. That feedback loop is the difference between a spec that documents your API and a spec that *governs* it.

## Versioning the contract

Your API will change. The question is whether the change breaks the people depending on it. Two moves keep you out of trouble:

- **Bump `info.version` on every meaningful change**, and treat it like any other versioned artifact (semantic versioning works well — major for breaking changes, minor for additive ones).
- **Additive changes are safe; removals and renames are breaking.** Adding an optional field or a new endpoint won't hurt existing clients. Removing a field, renaming one, or making an optional field required *will*. The spec makes these visible in a diff, which is exactly why keeping it in version control matters.

When you must break the contract, the common pattern is a new path prefix (`/v2/bookmarks`) so old and new live side by side while consumers migrate. The deeper reasoning on evolving a contract without breaking callers lives in [the guide on APIs built to last](/guides/designing-apis-that-last); here the point is narrow — your OpenAPI file is the artifact you diff to *see* a breaking change coming.

## The gotchas that actually bite

A short list of what goes wrong, drawn from real pain:

- **The spec drifts and nobody notices.** The number one failure. Without a contract test, a stale spec is worse than no spec — it lies with authority. Automate the check or assume it's wrong.
- **"Try it out" leaks into production.** Swagger UI's live request button is a gift in dev and a footgun in prod if your docs page is public and unauthenticated. Gate it.
- **Over-trusting code-first generation.** Generated specs reflect what the code *does*, including bugs and accidents. They're a description, not a design — review them, don't assume they're correct because a tool produced them.
- **Examples that go stale.** Hand-written `example` values in the spec aren't validated against the schema by default. A bad example misleads every reader. Some linters catch this; turn them on.
- **Treating the spec as write-once.** A spec maintained only at creation rots like any other doc. The whole value proposition collapses the moment it stops matching reality. The tools in this phase exist precisely to keep that from happening.

## In the wild

The teams that get real value from OpenAPI aren't the ones with the prettiest Swagger UI — they're the ones who wired the spec into CI. Validation middleware in the app, a mock server for the frontend, and a contract test in the pipeline. At that point the spec isn't documentation anymore; it's an enforced agreement, and the docs are a free side effect. That's the whole promise of "the API as a spec" actually delivered: write it once, and let machines hold everyone (including future you) to it. For the bigger picture of what makes a [REST API worth describing this carefully](/guides/rest-apis-explained), that guide is the companion to this one.

```quiz
[
  {
    "q": "What does a contract test (e.g. Schemathesis) verify?",
    "choices": [
      "That the spec file is valid YAML",
      "That the running API's real responses still match what the spec promises",
      "That Swagger UI renders without errors",
      "That the generated client compiles"
    ],
    "answer": 1,
    "explain": "Contract tests run the live API against the spec and fail when responses drift from the declared schemas."
  },
  {
    "q": "Which change to an API is safe for existing clients?",
    "choices": [
      "Renaming a response field",
      "Removing an endpoint",
      "Adding a new optional field",
      "Making a previously optional field required"
    ],
    "answer": 2,
    "explain": "Additive changes (new optional fields, new endpoints) don't break callers. Removals, renames, and new requirements do."
  },
  {
    "q": "Why is a mock server generated from the spec useful?",
    "choices": [
      "It replaces the need for a real backend permanently",
      "It serves fake-but-valid responses so consumers can build before the real API exists",
      "It compresses the spec file",
      "It encrypts API traffic"
    ],
    "answer": 1,
    "explain": "A mock serves schema-valid responses straight from the spec, letting frontend and consumers work in parallel with backend."
  }
]
```

[← Phase 2: Writing and Generating From the Spec](02-writing-and-generating.md) · [Overview](_guide.md)
