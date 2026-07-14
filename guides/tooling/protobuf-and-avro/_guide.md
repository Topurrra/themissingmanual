---
title: "Protobuf and Avro"
guide: protobuf-and-avro
phase: 0
summary: "Binary serialization with a schema: Protocol Buffers and Avro make data small and fast across services, and force you to think about schema evolution."
tags: [protobuf, avro, serialization, grpc, kafka, schema-evolution]
category: tooling
group: "Secrets & Supply Chain"
order: 54
difficulty: intermediate
synonyms: [protobuf vs avro, protocol buffers tutorial, avro schema, .proto file, schema evolution, binary serialization, grpc serialization, kafka avro]
updated: 2026-06-30
---

# Protobuf and Avro

You have been shipping JSON between services for years and it works fine, until the day the payloads get huge, the parsing gets slow, or someone renames a field in a producer and a dozen consumers fall over with no warning. JSON is plain and readable, but it carries its field names in every single message and trusts everyone to agree on the shape by hand. Protobuf and Avro fix both problems: a real schema, a compact binary wire format, and rules for changing that schema without breaking the world. This guide gives you the mental model so the two stop blurring together, then the everyday mechanics, then the part nobody warns you about: evolution.

## How to read this

Read the phases in order the first time. Phase 1 is the why, and skipping it is how people end up cargo-culting `.proto` files they do not understand. Phase 2 is the hands-on core you will reach for daily. Phase 3 is the production reality, schema evolution and the traps, and it is the reason these tools exist at all, so do not stop early.

## The phases

1. [The mental model: schema-first binary data](01-why-schemas-beat-json.md) - why a schema plus binary beats schema-less JSON, and how Protobuf and Avro split the problem.
2. [Using them day to day](02-using-protobuf-and-avro.md) - writing a `.proto` and an Avro schema, generating code, and reading the wire.
3. [Schema evolution and the gotchas](03-schema-evolution-and-gotchas.md) - forward and backward compatibility, the field-number rules, and where it bites in production.

[Phase 1: The mental model: schema-first binary data](01-why-schemas-beat-json.md) →
