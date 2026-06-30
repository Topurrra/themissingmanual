---
title: "Using them day to day"
guide: protobuf-and-avro
phase: 2
summary: "Binary serialization with a schema: Protocol Buffers and Avro make data small and fast across services, and force you to think about schema evolution."
tags: [protobuf, avro, serialization, grpc, kafka, schema-evolution]
difficulty: intermediate
synonyms: [protobuf vs avro, protocol buffers tutorial, avro schema, .proto file, schema evolution, binary serialization, grpc serialization, kafka avro]
updated: 2026-06-30
---

# Using them day to day

The mental model lands fastest when you write the schemas yourself. So let us do that, the same little `Customer` record in both formats, generate code, and look at what actually goes on the wire. The workflows feel different, and the difference tells you a lot about each tool's personality.

## Protobuf: write the schema, compile it, use the classes

A Protobuf schema is a `.proto` file. Here is a small one.

```proto
syntax = "proto3";

package billing;

message Customer {
  int64  id           = 1;
  string name         = 2;
  bool   is_active    = 3;
  int64  balance_cents = 4;
}
```

*What just happened:* you declared a message type and, crucially, gave every field a *number* (`= 1`, `= 2`, …). Those numbers, not the names, are what travel on the wire. The names are for humans and generated code. Hold on to this fact: in Phase 3 those field numbers turn out to be the load-bearing part of the whole compatibility story.

Now compile it. The `protoc` compiler reads the `.proto` and emits code for your target language.

```bash
# generate Python classes into the ./gen directory
protoc --python_out=gen customer.proto

# or Go
protoc --go_out=gen customer.proto
```

*What just happened:* `protoc` produced a generated module (for Python, `customer_pb2.py`) holding a real `Customer` class with typed fields, plus serialize and parse methods. You do not hand-write parsing code; you use the generated class.

Then you use it like any object, and serialize to bytes when you need to send.

```python
from gen import customer_pb2

c = customer_pb2.Customer(id=4291, name="Mara", is_active=True, balance_cents=19900)

data = c.SerializeToString()   # -> compact binary bytes
print(len(data))               # far smaller than the JSON equivalent

# on the other side, with the same generated class:
c2 = customer_pb2.Customer()
c2.ParseFromString(data)
print(c2.name)                 # "Mara"
```

*What just happened:* the sender turned a typed object into a few dozen bytes, and the receiver turned those bytes back into a typed object, both using code generated from the same `.proto`. Neither side ever sent or parsed the string `"name"`. This is the Protobuf loop you will live in: edit `.proto`, run `protoc`, use the classes.

> Field names are absent from the wire, so renaming `name` to `full_name` in the `.proto` and recompiling both sides changes nothing on the wire, because field 2 is still field 2. That is a feature for compatibility and a footgun if you misread it. More on that next phase.

## Avro: a JSON schema, and the data carries it

An Avro schema is itself a JSON document. The same record looks like this.

```json
{
  "type": "record",
  "name": "Customer",
  "namespace": "billing",
  "fields": [
    {"name": "id",            "type": "long"},
    {"name": "name",          "type": "string"},
    {"name": "is_active",     "type": "boolean"},
    {"name": "balance_cents", "type": "long"}
  ]
}
```

*What just happened:* you described the same four fields, but notice there are no field numbers. Avro identifies fields by *name and position in the schema*, not by an integer tag. That is a different identity model from Protobuf, and it changes the evolution rules you will meet in Phase 3.

Avro's signature move is the *object container file*: it writes the full schema once into the file header, then packs records after it. Because the schema is right there in the file, a reader needs no generated code, it reads the schema, then decodes the records.

```python
import fastavro, io

schema = fastavro.parse_schema({
    "type": "record", "name": "Customer", "namespace": "billing",
    "fields": [
        {"name": "id", "type": "long"},
        {"name": "name", "type": "string"},
        {"name": "is_active", "type": "boolean"},
        {"name": "balance_cents", "type": "long"},
    ],
})

records = [{"id": 4291, "name": "Mara", "is_active": True, "balance_cents": 19900}]

buf = io.BytesIO()
fastavro.writer(buf, schema, records)     # header carries the schema, then the rows

buf.seek(0)
for rec in fastavro.reader(buf):          # reader pulls the schema out of the header
    print(rec["name"])                    # "Mara"
```

*What just happened:* the writer stamped the schema into the file header, then wrote the records with no per-row field names. The reader recovered the schema from the header and decoded the rows, no generated `Customer` class required. This is exactly why Avro fits batch and streaming systems: write the schema once, stream a billion rows behind it.

## The Kafka twist: a Schema Registry, not a file header

In streaming, you are not writing one big file; you are sending many small messages to a topic. Stamping the whole schema into every Kafka message would undo the savings. So the ecosystem uses a **Schema Registry**: a small service that stores schemas and hands each one an integer ID.

```text
Producer:  register schema -> get id 7
           message on wire = [magic byte][id=7][Avro-encoded value]

Consumer:  read id 7 from the message
           fetch schema #7 from the registry (and cache it)
           decode the value
```

*What just happened:* each Kafka message carries a tiny schema ID instead of the whole schema, and consumers look the ID up once and cache it. You get Avro's "schema travels with data" guarantee without paying for the schema in every message. This registry pattern is the standard way Avro and Kafka work together, and the registry is also where compatibility gets enforced, which is the heart of the next phase.

## For builders

Pick by where the data is going. Talking RPC between services? Reach for Protobuf, because gRPC expects it and the codegen workflow fits request/response shapes, see [/guides/grpc-explained](/guides/grpc-explained). Moving events or analytics records through Kafka or a data lake? Reach for Avro, because the registry workflow and dynamic decoding fit high-volume streams. Plenty of shops run both, each in its lane. And if you are still mapping how services talk at all, [/guides/what-an-api-is](/guides/what-an-api-is) is the ground floor under this.

```quiz
[
  {
    "q": "In a .proto file, what do the numbers like `= 1` and `= 2` after each field represent?",
    "choices": ["Default values", "The field's position on screen", "Field tags that identify the field on the wire instead of its name", "The maximum value the field can hold"],
    "answer": 2,
    "explain": "Protobuf sends those integer field numbers, not field names. The names exist only in the schema and generated code."
  },
  {
    "q": "How does the classic Avro object container file let a reader decode without generated code?",
    "choices": ["It includes the field names in every record", "It writes the full schema into the file header, so the reader reads the schema then the records", "It calls protoc at read time", "It stores data as JSON text"],
    "answer": 1,
    "explain": "Avro stamps the schema once into the file header; the reader recovers it from there and decodes the records dynamically."
  },
  {
    "q": "Why do Kafka + Avro setups use a Schema Registry instead of putting the schema in every message?",
    "choices": ["Kafka cannot store binary data", "Embedding the full schema in each small message would erase the size savings; a registry lets each message carry a tiny schema ID instead", "Avro requires JSON over the wire", "Registries make messages human-readable"],
    "answer": 1,
    "explain": "Each message carries a small integer schema ID; consumers fetch and cache the schema once from the registry, keeping messages compact."
  }
]
```

[← Phase 1: The mental model](01-why-schemas-beat-json.md) | [Overview](_guide.md) | [Phase 3: Schema evolution and the gotchas →](03-schema-evolution-and-gotchas.md)
