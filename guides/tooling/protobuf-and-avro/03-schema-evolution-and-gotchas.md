---
title: "Schema evolution and the gotchas"
guide: protobuf-and-avro
phase: 3
summary: "Binary serialization with a schema: Protocol Buffers and Avro make data small and fast across services, and force you to think about schema evolution."
tags: [protobuf, avro, serialization, grpc, kafka, schema-evolution]
difficulty: intermediate
synonyms: [protobuf vs avro, protocol buffers tutorial, avro schema, .proto file, schema evolution, binary serialization, grpc serialization, kafka avro]
updated: 2026-06-30
---

# Schema evolution and the gotchas

This is the phase that earns the whole guide. Small and fast got your attention; schema evolution is what keeps a distributed system from melting down every time someone adds a field. In production, producers and consumers do not upgrade in lockstep. For minutes or days, new code and old code run side by side, reading each other's bytes. The schema's job is to make that overlap safe, and to tell you, before you ship, when a change is not.

## Two words you have to keep straight

Everything here is one of two questions. Say them out loud when you review a change:

- **Backward compatible:** can **new** code read **old** data? You upgraded the reader first; it must still understand messages written by the old writer.
- **Forward compatible:** can **old** code read **new** data? You upgraded the writer first; the not-yet-upgraded reader must not choke on the new messages.

```text
                 reads old data        reads new data
new reader   ->   BACKWARD                 (n/a)
old reader   ->     (n/a)                FORWARD
```

*What just happened:* the direction is named after the data, not the code. "Backward compatible" means the new thing reaches *back* to old data. Full compatibility means a change is both, which is what you usually want for an independently deployed system.

## Protobuf: the rules live in the field numbers

Remember those field numbers from the `.proto`. They are the identity of each field, and the evolution rules fall right out of that.

```proto
message Customer {
  int64  id            = 1;
  string name          = 2;
  bool   is_active      = 3;
  int64  balance_cents = 4;
  string email          = 5;   // newly added field
}
```

*What just happened:* you added `email` with a **new, never-before-used number 5**. An old reader that does not know field 5 sees those bytes, does not recognize the tag, and skips them, so old code reads new data fine (forward compatible). A new reader handed old data finds field 5 absent and uses the default (empty string), so new code reads old data fine (backward compatible). Adding an optional field with a fresh number is safe in both directions.

The rules that keep Protobuf safe, and the ones that wreck it:

- **Never reuse or change a field number.** The number is the identity. If you delete field 4 and later add a different field as number 4, old data's `balance_cents` bytes get read as the new field, silent corruption. Use `reserved 4;` to fence off retired numbers so nobody reuses them.
- **Renaming a field is free on the wire.** `name` to `full_name` keeps number 2, so the bytes are identical. Only your source code changes.
- **Do not change a field's type incompatibly.** Swapping `int64` to `string` on the same number reinterprets the bytes and breaks readers. Some numeric widenings are compatible; arbitrary type swaps are not.

```proto
message Customer {
  reserved 4;              // balance_cents retired; never reuse this number
  reserved "balance_cents";
  int64  id   = 1;
  string name = 2;
}
```

*What just happened:* `reserved` tells the compiler to reject any future field that tries to claim number 4 or the old name. It is a tombstone, and it is the difference between a safe deletion and a time bomb.

## Avro: the rules live in defaults and the reader/writer schema pair

Avro has no field numbers. It matches fields by **name**, and it does something Protobuf does not: at decode time it uses **two** schemas, the *writer's* schema (what made the data) and the *reader's* schema (what your code wants). Avro resolves the difference between them. That pairing is the core of Avro evolution.

- **To add a field, give it a `default`.** When old data (writer's schema lacks the field) is read by new code (reader's schema has it), Avro fills in the default. No default, and reading old data fails.
- **To remove a field, the field you drop must have had a default** so that new data (missing it) can still be read by old code expecting it.
- **Renaming uses `aliases`.** Because Avro matches on name, a raw rename looks like "old field gone, new field added." An `alias` tells the reader the new name also answers to the old one.

```json
{
  "type": "record", "name": "Customer",
  "fields": [
    {"name": "id",        "type": "long"},
    {"name": "name",      "type": "string"},
    {"name": "is_active", "type": "boolean"},
    {"name": "email",     "type": "string", "default": ""}
  ]
}
```

*What just happened:* `email` carries `"default": ""`. A reader on this schema decoding older data that has no `email` substitutes the default instead of failing. That single `default` is what makes the add backward compatible. In Avro, defaults are not a convenience, they are the evolution mechanism.

## The Schema Registry enforces this for you

You do not have to remember all of that by hand under deadline. A Schema Registry (the Kafka pattern from Phase 2) checks every new schema version against a configured **compatibility mode** before it accepts it.

```text
BACKWARD (the common default): new schema can read data written by the previous schema
FORWARD:  previous schema can read data written by the new schema
FULL:     both directions
NONE:     no checks (you are on your own)
```

*What just happened:* register an incompatible schema under `BACKWARD` mode and the registry **rejects it at registration**, before a single bad message is produced. The compatibility rule becomes a gate in your pipeline, not a postmortem. Set the mode to match how you deploy: upgrade consumers first, lean `BACKWARD`; upgrade producers first, lean `FORWARD`; want freedom in either order, use `FULL`.

## Gotchas that bite real teams

> **Reusing a Protobuf field number is the classic disaster.** It does not error. Old bytes get reinterpreted as the new field and you ship corrupted reads that pass every type check. Always `reserved` deleted numbers, and treat the number space as append-only forever.

A few more that show up in incident reviews:

- **proto3 and the meaning of "missing."** In plain proto3 scalar fields, a field set to its default (`0`, `""`, `false`) is indistinguishable on the wire from a field never set. If "absent" must differ from "zero," model it explicitly (for example with an `optional` field or a wrapper) rather than assuming you can tell them apart.
- **Required fields are a trap.** proto2 had `required`, and it made evolution nearly impossible, you can never safely remove a required field. proto3 dropped it on purpose. Resist any urge to simulate hard-required fields at the schema layer; enforce required-ness in application logic.
- **Compatibility is transitive, or it should be.** Checking each new version only against the immediately previous one lets data drift across many hops. If you keep long histories of data around, use the registry's *transitive* modes so a new schema is checked against all prior versions, not only the last.
- **The schema and the data must not drift apart.** Lose the `.proto` that compiled a producer, or fail to register an Avro schema, and you have opaque bytes nobody can decode. Version schemas in source control; treat the registry as production infrastructure, with backups.

## In the wild

The teams who stay calm during rollouts are the ones who made compatibility a build-time gate: schemas in source control, a registry in `FULL` or `BACKWARD` mode, CI that fails the pipeline when a `.proto` or Avro change would break a live consumer. The format is not what saves you, the discipline of checking evolution before you ship is. Protobuf and Avro give you a place to enforce it.

```quiz
[
  {
    "q": "A change is described as 'backward compatible.' What does that guarantee?",
    "choices": ["Old code can read new data", "New code can read old data", "The wire format shrinks", "Field names are preserved"],
    "answer": 1,
    "explain": "Backward compatibility means the new reader reaches back to data written by the old writer: new code reads old data."
  },
  {
    "q": "In Protobuf, why is reusing a deleted field number so dangerous?",
    "choices": ["It throws a compile error every time", "Old data's bytes for that number get silently reinterpreted as the new field, corrupting reads with no error", "It doubles the message size", "It deletes the registry"],
    "answer": 1,
    "explain": "The number is the field's identity on the wire. Reusing it makes old bytes decode as the new field silently. Mark deleted numbers `reserved`."
  },
  {
    "q": "In Avro, what makes adding a new field backward compatible so readers can decode older data that lacks it?",
    "choices": ["Assigning it a field number", "Giving the field a `default` value", "Marking it `required`", "Putting it first in the record"],
    "answer": 1,
    "explain": "Avro matches by name and resolves reader vs writer schemas; a `default` lets the reader fill in the value when older data omits the field."
  }
]
```

[← Phase 2: Using them day to day](02-using-protobuf-and-avro.md) | [Overview](_guide.md)
