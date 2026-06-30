---
title: "Protobuf and Avro"
guide: protobuf-and-avro
phase: 1
summary: "Binary serialization with a schema: Protocol Buffers and Avro make data small and fast across services, and force you to think about schema evolution."
tags: [protobuf, avro, serialization, grpc, kafka, schema-evolution]
difficulty: intermediate
synonyms: [protobuf vs avro, protocol buffers tutorial, avro schema, .proto file, schema evolution, binary serialization, grpc serialization, kafka avro]
updated: 2026-06-30
---

# The mental model: schema-first binary data

Here is the thing JSON never tells you: every message you send carries its own field names, as plain text, every single time. Send a million records and you send the string `"customer_id"` a million times. That is fine when a human is reading a config file. It is a tax when machines are talking to machines at volume.

So picture the actual cost. Here is one record on the wire as JSON:

```json
{"customer_id": 4291, "is_active": true, "balance_cents": 19900}
```

*What just happened:* that is 61 bytes, and roughly 40 of them are field names and punctuation, not data. The receiver also has to parse text, guess that `4291` is a number and not a string, and trust that the sender used exactly the keys it expected. Nobody enforced any of that.

## What a schema actually buys you

A schema is a contract written down in one place: these are the fields, these are their types, this is their order. Both sides agree on it ahead of time. Once they do, two things become possible that JSON cannot do.

First, the wire format gets tiny. If both sides already know field 1 is `customer_id` and it is an integer, the message does not need to say `"customer_id"` at all. It can say "field 1, value 4291" using a couple of bytes. The names live in the schema, not in every message.

Second, the data gets typed and checked. The schema says `balance_cents` is a 64-bit integer, so the generated code gives you an actual integer, not a string you have to coerce and pray over. A producer that tries to put a name where a number goes fails at build time, not at 3am in a consumer's logs.

> The trade is real and worth naming. JSON you can read with your eyes in any text editor. A Protobuf or Avro payload is opaque bytes; you need the schema to decode it. You are trading human readability for size, speed, and a contract. For machine-to-machine traffic at scale, that trade is usually worth it. For a config file a person edits, it is not.

## Protobuf and Avro split the problem differently

Both are schema-first binary formats, and people lump them together, but they answer one key question in opposite ways: **where does the schema live when the data is decoded?**

**Protocol Buffers (Protobuf)**, from Google, is *code-generation first*. You write a `.proto` file, run a compiler (`protoc`), and it generates classes in your language. The schema is baked into the compiled code on both sides. The wire format uses small integer *field numbers* instead of names, which is why it is compact and fast. Protobuf is the serialization backbone of gRPC, so if you are doing service-to-service RPC, this is the one you will meet. For the RPC side of that story, see [/guides/grpc-explained](/guides/grpc-explained).

**Avro**, from the Hadoop world, is *schema-travels-with-data first*. The schema is a JSON document, and the classic Avro file format writes the full schema once into the header of the file, then packs thousands of records after it with no per-record overhead. Because the reader can read the schema out of the file, it does not need generated code at all, it can decode dynamically. This is why Avro dominates the data and streaming world: Hadoop, Spark, and especially Kafka, where huge volumes of records share one schema.

```text
Protobuf:  schema (.proto) --compile--> code on both sides
           wire = field numbers + values   (names never sent)

Avro:      schema (JSON) lives WITH the data (file header / registry)
           wire = values in schema order    (names never sent)
```

*What just happened:* both drop field names from the wire, but Protobuf assumes both sides already hold compiled code, while Avro assumes the reader can get the schema from the data or a registry. That single difference drives almost everything else, including how each handles change.

## The real reason they matter: change is coming

Small and fast is the headline, but it is not why teams adopt these tools and stay. The deeper reason is **schema evolution**. Your data shape will change, you will add a field, drop one, rename something, and in a distributed system you cannot redeploy every producer and consumer at the same instant. For a while, old code and new code run side by side, reading each other's messages.

JSON gives you nothing here. There is no schema, so there is no notion of "is this change safe?" You find out in production. Protobuf and Avro both have explicit rules, and tooling to check them, for whether a change is *backward compatible* (new code reads old data) and *forward compatible* (old code reads new data). That is the actual superpower, and it gets its own phase, because it is where most of the real-world pain and most of the real-world value live.

## In the wild

If you have ever called a gRPC service, you have used Protobuf without writing a line of it, the framing was Protobuf under the hood. If you have ever consumed a Kafka topic backed by a Schema Registry, you have used Avro the same way. Most engineers meet these formats as a dependency of something bigger before they ever write a schema by hand.

```quiz
[
  {
    "q": "What is the main thing a schema lets the wire format drop, making it compact?",
    "choices": ["Numeric values", "Field names", "The message length", "Timestamps"],
    "answer": 1,
    "explain": "Both sides know the fields from the schema, so the bytes carry values keyed by small field numbers or position, not repeated field-name strings."
  },
  {
    "q": "What best describes the core difference between Protobuf and Avro?",
    "choices": ["Protobuf is binary, Avro is text", "Protobuf generates code from a .proto; Avro often ships the schema with the data and can decode dynamically", "Avro is faster on every workload", "Protobuf has no schema"],
    "answer": 1,
    "explain": "Protobuf is code-generation-first with compiled schemas on both sides; Avro carries its schema with the data (file header or registry), so it can decode without generated code."
  },
  {
    "q": "Beyond small size and speed, what is the deeper reason teams adopt these formats?",
    "choices": ["They are human-readable", "They need no schema", "Schema evolution: explicit rules for changing data shape without breaking running producers and consumers", "They replace databases"],
    "answer": 2,
    "explain": "In a distributed system you cannot redeploy everything at once; Protobuf and Avro define forward/backward compatibility rules so old and new code interoperate during rollout."
  }
]
```

[← Overview](_guide.md) | [Phase 2: Using them day to day →](02-using-protobuf-and-avro.md)
