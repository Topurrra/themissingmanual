---
title: "OpenAPI and Swagger"
guide: openapi-and-swagger
phase: 2
summary: "Describe your REST API once in OpenAPI, and get interactive docs, client SDKs, request validation, and contract tests for free — the API as a spec."
tags: [openapi, swagger, rest, api, documentation, tooling]
difficulty: intermediate
synonyms: ["what is openapi", "swagger vs openapi", "openapi spec", "swagger ui", "generate api docs from openapi", "design first api", "openapi codegen"]
updated: 2026-06-30
---

# Writing and Generating From the Spec

Now you actually write one. The good news: you already saw the shape in phase 1, and it doesn't get much scarier than that. The work is mostly learning a handful of keys and one organizing trick (`components`) that keeps the file from turning into a swamp. Then we point tools at it and watch the spec earn its keep.

## The anatomy of a real document

Every OpenAPI document has the same skeleton. Three top-level sections do almost all the work:

```yaml
openapi: 3.1.0

info:                          # who/what this API is
  title: Bookmarks API
  version: 1.0.0

paths:                         # every endpoint lives here
  /bookmarks:
    get: { ... }
    post: { ... }

components:                    # reusable pieces, referenced by $ref
  schemas:
    Bookmark: { ... }
```

*What just happened:* `info` is metadata, `paths` is the list of endpoints (the bulk of the file), and `components` is your toolbox of reusable definitions. That third section is the one that keeps you sane — instead of redefining the shape of a bookmark in five places, you define it once and point at it.

## Reuse with components and $ref

Repeating yourself in a spec is how it rots: you change one copy, forget the other four, and now the contract contradicts itself. The fix is `components` plus `$ref` (a reference — "look over there for the definition").

```yaml
paths:
  /bookmarks:
    post:
      summary: Create a bookmark
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/NewBookmark'   # reuse
      responses:
        '201':
          description: Created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Bookmark'    # reuse

components:
  schemas:
    NewBookmark:
      type: object
      required: [url]
      properties:
        url: { type: string, format: uri }
        title: { type: string }
    Bookmark:
      allOf:
        - $ref: '#/components/schemas/NewBookmark'
        - type: object
          properties:
            id: { type: integer }
```

*What just happened:* `$ref: '#/components/schemas/Bookmark'` means "insert the `Bookmark` schema defined below." Define a shape once, reference it everywhere. The `allOf` on `Bookmark` says "everything in `NewBookmark`, plus an `id`" — so the create-shape and the stored-shape share a definition and can't drift apart. Change `url` to required in one spot and every endpoint that references it updates at once.

> `required` is its own list at the object level, not a flag on each property. `required: [url]` means `url` must be present; `title` is optional. This is the single most common thing newcomers get wrong.

## Render it: Swagger UI

A spec you can't see is hard to trust. Swagger UI turns the file into an interactive page — every endpoint expandable, every schema documented, and a "Try it out" button that fires real requests from the browser. The fastest way to look at a spec is the official Docker image:

```bash
docker run -p 8080:8080 \
  -e SWAGGER_JSON=/spec/openapi.yaml \
  -v "$(pwd)":/spec \
  swaggerapi/swagger-ui
```

*What just happened:* you mounted your current directory into the container and told Swagger UI to load `openapi.yaml` from it. Open `http://localhost:8080` and the YAML you wrote is now browsable docs. No build step, no framework — the file is the input, the docs are the output. Most API frameworks also ship a plugin that serves Swagger UI directly from your running app at a path like `/docs`.

## Generate a client (or a server)

This is where the contract pays for itself. Point a codegen tool at the spec and it writes a typed client library — so the people calling your API never hand-type a URL or guess a field name again. The widely used open-source generator is `openapi-generator`:

```bash
openapi-generator-cli generate \
  -i openapi.yaml \
  -g typescript-fetch \
  -o ./generated-client
```

*What just happened:* `-i` is the input spec, `-g` is the target generator (`typescript-fetch` here; there are generators for Python, Go, Java, C#, and dozens more), and `-o` is where the code lands. Out comes a client where `createBookmark({ url })` is a real typed function — misspell a field and your compiler complains before you ever run it.

The same tool runs the other direction with a server generator: feed it the spec and it scaffolds route handlers, request models, and the wiring, leaving you to fill in the business logic. The contract decides the shape; you write only the part that's actually yours.

## Design-first vs. code-first

There are two ways the spec and the code relate, and which one you pick shapes your whole workflow.

**Design-first:** you write the OpenAPI document *before* the implementation. The spec is the plan. You can review it, mock it, and hand it to frontend and backend teams who then build against the agreed contract in parallel.

**Code-first:** you write the code first, decorate your handlers with annotations, and a library *generates* the spec from the running app. The code is the source; the spec is a byproduct.

```text
  DESIGN-FIRST                         CODE-FIRST
  write spec ─→ review ─→ build      write code ─→ annotate ─→ generate spec
  spec is the source of truth        code is the source of truth
```

*What just happened:* the arrow direction is the whole difference. Design-first front-loads agreement (great for teams building against each other, or public APIs that need a stable contract). Code-first front-loads shipping (great for a solo backend where the code already exists and you want docs without maintaining a separate file). Neither is wrong; they optimize for different pain.

A blunt rule that holds up: if multiple teams or external consumers depend on the contract, lean design-first — agreeing on the shape before anyone writes code is cheaper than renegotiating after. If it's your own service and your own client, code-first gets you docs with almost no extra effort. The [principles behind a contract worth stabilizing](/guides/designing-apis-that-last) apply either way; OpenAPI is the tool, not the discipline.

## In the wild

Most mature backend frameworks lean code-first by default — you annotate handlers and get a spec and Swagger UI for free at `/docs`. That's the gentle on-ramp. Teams that outgrow it (because the generated spec is awkward to review, or because frontend needs the contract before backend has built it) graduate to design-first, where the spec lives in version control as a reviewed, first-class file. You can start code-first and migrate; many do.

```quiz
[
  {
    "q": "What does `$ref: '#/components/schemas/Bookmark'` do?",
    "choices": [
      "Sends an HTTP request to fetch a bookmark",
      "Inserts the reusable schema named Bookmark defined under components",
      "Imports a schema from an external file on disk",
      "Marks the Bookmark field as required"
    ],
    "answer": 1,
    "explain": "$ref points at a definition elsewhere in the document, letting you define a shape once and reuse it."
  },
  {
    "q": "In design-first, what is the source of truth?",
    "choices": [
      "The running server code, with the spec generated from it",
      "The Swagger UI page",
      "The hand-written OpenAPI spec, written before the implementation",
      "The generated client SDK"
    ],
    "answer": 2,
    "explain": "Design-first means you author the spec first and build code against it; the spec is the plan and the source of truth."
  },
  {
    "q": "How do you express that a request field must always be present?",
    "choices": [
      "Add `required: true` next to the property",
      "List the property name in the object's `required` array",
      "Put the property under `components`",
      "Wrap the property in `allOf`"
    ],
    "answer": 1,
    "explain": "In OpenAPI, `required` is a list at the object level naming which properties must be present — not a per-property flag."
  }
]
```

[← Phase 1: The Contract, Not the Docs](01-the-contract-not-the-docs.md) · [Overview](_guide.md) · [Phase 3: The Spec at Work in Production →](03-the-spec-in-production.md)
