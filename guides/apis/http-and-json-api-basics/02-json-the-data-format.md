---
title: "JSON, the Data Format"
guide: "http-and-json-api-basics"
phase: 2
summary: "JSON is structured data written as text: objects, arrays, strings, numbers, booleans, and null. It won because it's human-readable and language-neutral. Here's how to read and write it."
tags: [json, data-format, objects, arrays, parsing, apis]
difficulty: beginner
synonyms: ["what is json", "json explained for beginners", "how to read json", "json objects and arrays", "why do apis use json", "json data types"]
updated: 2026-07-10
---

# JSON, the Data Format

In Phase 1, the response body held a line like `{"id":42,"name":"Ada Lovelace"}`. That's **JSON** — the
format almost every web API uses to write down the data it sends and receives. If HTTP is the envelope,
JSON is the letter written inside it.

The good news: JSON is small. There are only a handful of building blocks, and once you've seen them you
can read any JSON document, however large. By the end of this phase you'll look at a blob of JSON and see
structure, not soup.

## What JSON actually is

JSON (it stands for **JavaScript Object Notation**) is a way to write structured data as plain text.
"Structured" means it has shape — values nested inside other values — and "text" means it's just
characters you can read, type, and email. A program turns that text into data it can work with, and turns
its data back into that text to send. Nothing about it is secret or binary.

Here is a complete JSON document with every building block in it. Read it top to bottom — it's meant to be
readable:

```json
{
  "id": 42,
  "name": "Ada Lovelace",
  "active": true,
  "nickname": null,
  "roles": ["admin", "author"],
  "profile": {
    "city": "London",
    "followers": 1024
  }
}
```

You just read a full record about a user, and probably understood it without being told how — that
readability is the entire point of JSON. Now let's name the pieces.

## The building blocks

JSON is made of exactly these value types — that's the whole language:

| In the example above        | What it is | Looks like                          |
|-----------------------------|------------|-------------------------------------|
| `{ ... }`                   | **object** | a set of `"key": value` pairs in `{}` |
| `["admin", "author"]`       | **array**  | an ordered list in `[]`             |
| `"Ada Lovelace"`            | **string** | text in double quotes               |
| `42`, `1024`                | **number** | a plain number (no quotes)          |
| `true`                      | **boolean**| `true` or `false`                   |
| `null`                      | **null**   | "no value here on purpose"          |

📝 **Terminology.** An **object** is a collection of named fields — `"name": "Ada"` is a field whose
**key** is `"name"` and whose **value** is `"Ada"`. An **array** is an ordered list where position
matters, not names. Objects answer "what are this thing's properties?"; arrays answer "how many, and in
what order?"

The power comes from nesting: a value can itself be an object or array, so structures grow as deep as the
data needs. In the example, `profile` is a value that happens to be a whole object, and `roles` is a value
that happens to be an array. That's how JSON describes anything from a single number to an entire catalog.

## The mental map: JSON ↔ objects in your code

When your program receives JSON, it doesn't keep it as text — it **parses** it into the data structures
your language already has. The mapping is direct and predictable, which is exactly why JSON is comfortable
to work with:

```text
        JSON                       In your code (typical names)
   ┌──────────────┐
   │  object {}   │  ──────►   dict / map / object / hash
   │  array  []   │  ──────►   list / array
   │  string ""   │  ──────►   string
   │  number      │  ──────►   number / int / float
   │  true/false  │  ──────►   boolean
   │  null        │  ──────►   null / None / nil
   └──────────────┘
```

That table is the whole reason JSON feels natural in every language. A JSON object becomes a dictionary
(Python), an object (JavaScript), a map (Go) — whatever your language calls "named fields." Once the data
is parsed, you reach into it the normal way: ask the object for its `"name"` field, ask the array for its
first item. JSON is the *text on the wire*; in your code it's just ordinary data again.

📝 **Terminology.** Turning JSON text into in-memory data is **parsing** (or *deserializing*). Going the
other way — turning your data into JSON text to send — is **serializing**. Every language has a built-in
tool for both; you rarely do it by hand.

## Why JSON won

Before JSON, data on the web was often sent as **XML** — a tag-based format (`<name>Ada</name>`) that's
powerful but heavy and noisy to read and write. JSON made a different trade:

- **Human-readable.** You can open a JSON response and understand it with no tools — which makes debugging
  an API far less painful.
- **Language-neutral.** Despite the "JavaScript" in the name, JSON has no ties to any one language. Every
  major language reads and writes it, so two systems written in different languages can exchange data
  cleanly.
- **Small and simple.** Only six value types and a tiny grammar. Less to type, less to send, less to get
  wrong.

The trade-off it accepts: JSON has no built-in comments, no date type (dates travel as strings), and no
schema of its own. For most web APIs that's a price worth paying for how easy it is to read — which is why
it became the default.

## The punctuation gotchas

JSON's rules are strict and unforgiving, and two mistakes account for most "why won't this parse?"
moments. Name them now so they never cost you an hour later.

⚠️ **Gotcha — keys and strings must use double quotes.** Single quotes are not valid JSON, and keys are
*never* unquoted. This trips up everyone coming from JavaScript, where both are fine:

```text
   ✗ { name: 'Ada' }      ← single quotes, unquoted key — NOT valid JSON
   ✓ { "name": "Ada" }    ← double quotes on both the key and the string — valid
```

⚠️ **Gotcha — no trailing comma.** A comma *separates* items, so there must be nothing after the last one.
A leftover comma before a closing `}` or `]` is the single most common JSON error:

```text
   ✗ { "a": 1, "b": 2, }  ← trailing comma after the last pair — NOT valid JSON
   ✓ { "a": 1, "b": 2 }   ← no comma after the last pair — valid
```

If a parser ever rejects your JSON, check these two first — it's usually a stray comma or the wrong kind of
quote, not anything deep.

💡 **Key point.** JSON is structured text built from six value types, it maps cleanly onto the data
structures in any language, and it's strict about quotes and commas. That's everything you need to read the
data half of an API call. Now let's combine it with the HTTP half and make real calls.

## Recap

1. **JSON** is structured data written as plain, readable text.
2. The building blocks are **object** `{}`, **array** `[]`, **string**, **number**, **boolean**, and
   **null** — that's the whole language.
3. Values **nest**: an object or array can hold other objects and arrays, so JSON describes anything.
4. Your code **parses** JSON into normal data (objects → dicts/maps, arrays → lists) and **serializes**
   data back into JSON to send.
5. It won for being **human-readable, language-neutral, and simple.**
6. Two rules bite everyone: **double quotes only** (keys included) and **no trailing comma.**

---

[← Phase 1: HTTP, the Transport](01-http-the-transport.md) · [Guide overview](_guide.md) · [Phase 3: A Real API Call →](03-a-real-api-call.md)

## Try it yourself

Paste or edit JSON — it validates live, and you can format or minify it:

```playground-json
```

## Practice

```exercise
[
  {
    "type": "json",
    "task": "Type a JSON object with a \"name\" key of \"Ada\" and a \"roles\" array containing \"admin\" and \"author\", in that order.",
    "expected": { "name": "Ada", "roles": ["admin", "author"] },
    "hint": "Double quotes on every key and string value - JSON doesn't allow single quotes."
  }
]
```
