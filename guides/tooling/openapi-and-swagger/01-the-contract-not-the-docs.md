---
title: "The Contract, Not the Docs"
guide: openapi-and-swagger
phase: 1
summary: "Describe your REST API once in OpenAPI, and get interactive docs, client SDKs, request validation, and contract tests for free — the API as a spec."
tags: [openapi, swagger, rest, api, documentation, tooling]
difficulty: intermediate
synonyms: ["what is openapi", "swagger vs openapi", "openapi spec", "swagger ui", "generate api docs from openapi", "design first api", "openapi codegen"]
updated: 2026-06-30
---

# The Contract, Not the Docs

Here's the situation you probably know. You have a REST API. It works. But the people who *use* it can't see inside your head. They don't know that `POST /users` wants `email` and not `emailAddress`, that `age` must be a positive integer, or that a 404 comes back as `{ "error": "..." }` and not `{ "message": "..." }`. So you write docs. In a wiki, maybe. And the docs are right on Tuesday and wrong on Thursday, because you shipped a new field and forgot to update the wiki, and now someone is debugging against a lie.

OpenAPI exists to kill that gap. Instead of describing your API in prose that humans read and machines ignore, you describe it in a structured file that *machines* read first. That file is the contract.

## What OpenAPI actually is

OpenAPI is a specification format — a standard shape for a document that describes a REST API. The document is plain YAML or JSON. It lists every endpoint, every method, every parameter, the shape of every request body, the shape of every response, and the meaning of every status code. Nothing executes. It's a description, not a program.

That's the whole trick: it's *machine-readable*. Because the format is standardized, any tool that understands OpenAPI can read your file and do something useful with it — render docs, generate a client, validate a request — without knowing anything else about your project.

Here's the smallest version that's still real:

```yaml
openapi: 3.1.0
info:
  title: Bookmarks API
  version: 1.0.0
paths:
  /bookmarks/{id}:
    get:
      summary: Fetch one bookmark
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        '200':
          description: The bookmark
          content:
            application/json:
              schema:
                type: object
                properties:
                  id: { type: integer }
                  url: { type: string }
        '404':
          description: No bookmark with that id
```

*What just happened:* in about 25 lines you've stated a complete fact — "there's a `GET /bookmarks/{id}`, it takes an integer `id` in the path, and it returns either a 200 with `{ id, url }` or a 404." A human can read it, but more importantly a tool can *parse* it. The `{id}` in the path and the `parameters` block aren't decoration; they're the formal declaration that this endpoint is parameterized.

## So what is "Swagger," then?

This trips up everyone, so let's settle it plainly.

"Swagger" was the original name. It started as a spec format *and* a set of tools. In 2015 the spec itself was donated to a foundation and renamed **OpenAPI** — that's the standard, the thing your file conforms to. The name "Swagger" stayed on the *tooling* built around it.

So the rule of thumb:

- **OpenAPI** = the specification (the format your file is written in). Versions look like 3.0, 3.1.
- **Swagger** = a family of tools that work with OpenAPI files — Swagger UI (renders docs), Swagger Editor (writes specs), Swagger Codegen (generates code).

When someone says "the Swagger file," they almost always mean the OpenAPI document. When they say "let me check the Swagger," they usually mean Swagger UI — the interactive docs page. The terms blur in conversation; the distinction that matters is *spec vs. tool*.

> The version number on the first line (`openapi: 3.1.0`) is the spec version your document follows, not your API's version. Your API's version goes under `info.version`. Mixing these up is a classic first-day confusion.

## Why a machine-readable contract changes everything

Once the description is something a machine can read, the same file feeds a whole toolchain. You write it once; many tools consume it:

```text
                       ┌─→ Swagger UI  (interactive docs)
                       ├─→ codegen     (client SDKs, server stubs)
  openapi.yaml ────────┼─→ validator   (reject bad requests)
  (single source)      ├─→ mock server (fake responses before code exists)
                       └─→ contract test (does the real API still match?)
```

*What just happened:* one file fans out into five different jobs that teams otherwise do by hand. The docs can't drift from the client SDK, because both are generated from the same source. That's the payoff — not "nice docs," but *one source of truth* that everything else derives from.

This is the mental shift. Without OpenAPI, the truth about your API lives in the code, and everything else (docs, clients, test fixtures) is a hand-maintained copy that rots. With OpenAPI, the truth lives in the spec, and the copies are generated. Copies you regenerate can't lie.

## The contract is a promise to two audiences

A good OpenAPI document serves humans and machines at once, and it's worth holding both in mind:

- **Humans** read it (usually rendered as docs) to learn how to call your API: what to send, what comes back, what the errors mean.
- **Machines** read it to *do work*: generate a typed client so a frontend never guesses a field name, reject a malformed request before it reaches your handler, or fail a CI build when the live API stops matching the promise.

If you've read [the broader story of how to design APIs that don't rot](/guides/designing-apis-that-last), this is the concrete artifact that lets you *enforce* a stable contract instead of merely hoping for one.

## For builders

You don't need to adopt the whole toolchain to get value. The cheapest possible win is this: write the spec, point Swagger UI at it, and now you have docs that live next to your code in version control. Every other tool — codegen, validation, mocking — is something you bolt on later when the pain shows up. Start with the file. The file is the asset.

```quiz
[
  {
    "q": "What is the relationship between OpenAPI and Swagger?",
    "choices": [
      "They are competing, incompatible spec formats",
      "OpenAPI is the specification; Swagger is the family of tools built around it",
      "Swagger is the new name and OpenAPI is deprecated",
      "OpenAPI is for REST and Swagger is for GraphQL"
    ],
    "answer": 1,
    "explain": "The spec was renamed OpenAPI in 2015; the Swagger name stayed on tools like Swagger UI and Swagger Codegen."
  },
  {
    "q": "What does the first line `openapi: 3.1.0` declare?",
    "choices": [
      "The version of your API",
      "The version of the OpenAPI specification the document conforms to",
      "The minimum client library version required",
      "The HTTP version the API uses"
    ],
    "answer": 1,
    "explain": "That field is the spec version. Your API's own version lives under info.version."
  },
  {
    "q": "Why is a machine-readable contract more valuable than hand-written docs?",
    "choices": [
      "It is shorter to write",
      "It renders in a prettier font",
      "Many tools can generate docs, clients, validators, and tests from one source, so they cannot drift apart",
      "It removes the need to write any code"
    ],
    "answer": 2,
    "explain": "One source of truth fans out to docs, SDKs, validation, and tests — generated copies cannot lie about the API."
  }
]
```

[← Overview](_guide.md) · [Phase 2: Writing and Generating From the Spec →](02-writing-and-generating.md)
