---
title: "How gRPC Works"
guide: "grpc-explained"
phase: 2
summary: "The .proto file defines services and messages; a code generator turns it into client and server stubs in many languages; messages travel as compact binary; and gRPC offers four call types - unary plus three streaming modes."
tags: [grpc, protobuf, proto, code-generation, streaming, stubs, http2]
difficulty: intermediate
synonyms: ["what is a proto file", "grpc code generation", "grpc stubs", "grpc streaming types", "unary vs streaming grpc", "protobuf binary serialization", "how grpc client server works"]
updated: 2026-07-10
---

# How gRPC Works

Phase 1 gave you the mental model: define the functions once, both sides agree. There are really only four
moving parts to how that becomes real, and once you've seen each one, the whole thing stops feeling like a
black box:

1. The **`.proto` file** - the shared contract.
2. **Code generation** - turning that contract into real code in your language.
3. **Binary serialization** - how messages actually travel.
4. The **four call types** - including the streaming modes that REST can't easily do.

## 1. The `.proto` file - the contract you write

This is the file both services share. It declares two things: the **messages** (the shapes of your data)
and the **service** (the functions you can call). Here's a small but complete one, annotated:

```protobuf
syntax = "proto3";              // which version of the proto language

package currency;              // a namespace, so names don't collide

// A "message" is the shape of a piece of data - like a struct.
message ConvertRequest {
  int64  amount = 1;           // an amount in minor units (e.g. cents)
  string from   = 2;           // ISO currency code, e.g. "USD"
  string to     = 3;           // ISO currency code, e.g. "EUR"
}

message Money {
  int64  amount   = 1;
  string currency = 2;
}

// A "service" is a set of callable functions (RPCs).
service Converter {
  rpc Convert(ConvertRequest) returns (Money);
}
```

You declared a data shape (`ConvertRequest`), a result shape (`Money`), and one function (`Convert`) that
takes the first and returns the second. That's the entire contract - any service with this file knows
exactly how to call `Convert` and what it gets back.

📝 **Terminology - those `= 1`, `= 2`, `= 3` numbers are field tags, not default values.** Each field gets a
small, permanent number. On the wire, Protocol Buffers identifies a field by *that number*, not by its name.
This is the secret behind two important properties:

- **Field names never travel.** The binary message says "field 1 is `1299`," not "amount is 1299." That's a
  big part of why the payload is so much smaller than JSON.
- **You rename fields freely.** Because identity is the number, renaming `amount` to `amountInCents` in the
  `.proto` doesn't break the wire format at all - old and new code still agree on field `1`.

⚠️ **Gotcha - never reuse or renumber a field tag.** The numbers are the contract. If you delete field `2`
and later add a different field as `2`, old clients will read the new data into the old slot and get
garbage. The rule is: add new fields with new numbers, and never recycle an old one. (proto3 even lets you
mark a number `reserved` so nobody reuses it by accident.)

## 2. Code generation - the contract becomes real code

You don't hand-write the networking code. You run the `.proto` file through the Protocol Buffer compiler,
`protoc` (usually via your build system or a gRPC plugin), and it generates source code in your language:

```console
$ protoc --go_out=. --go-grpc_out=. currency.proto
$ ls
currency.proto  currency.pb.go  currency_grpc.pb.go
```

From one `currency.proto`, the compiler wrote two files of Go code. `currency.pb.go` holds the message
types (`ConvertRequest`, `Money`) as real Go structs; `currency_grpc.pb.go` holds the **stubs** - the client
and server scaffolding for the `Convert` function. The exact filenames and flags differ per language
(`--python_out`, `--java_out`, and so on), but the idea is identical everywhere.

📝 **Terminology - a "stub" is generated glue code.** On the **client** side, the stub is an object with a
`Convert(...)` method that *looks* like a normal local function but actually packages your request into
binary, sends it over HTTP/2, waits for the reply, and hands you back a typed `Money`. On the **server**
side, the generated code is the opposite half: it receives the bytes, rebuilds the request object, and calls
the `Convert` function *you* wrote to do the real work.

This is the payoff of contract-first: because both stubs come from the same `.proto`, and you can generate
them in *different languages from the same file*, a Go service and a Python service can call each other
with full type safety on both ends - no hand-written serialization, no drift.

The client side in practice (Go, trimmed to the essentials):

```go
// client is the generated stub, already connected over HTTP/2.
resp, err := client.Convert(ctx, &currency.ConvertRequest{
    Amount: 1299,
    From:   "USD",
    To:     "EUR",
})
if err != nil {
    log.Fatalf("convert failed: %v", err)
}
fmt.Println(resp.Amount, resp.Currency) // 1187 EUR
```

You called `client.Convert(...)` as if `Convert` lived in your own program. Under the hood, the stub
serialized your request to binary, sent it over the open HTTP/2 connection to the currency service, and
deserialized the reply into a `Money` you can read with `resp.Amount` - the remote call hidden behind an
ordinary-looking function call, the "Remote Procedure Call" idea made real.

## 3. Binary serialization - what actually goes over the wire

When the stub serializes that request, it does *not* produce text. There's no `{ "amount": 1299 }`. It
produces a compact binary stream that, conceptually, looks like this:

```text
   JSON (text, ~46 bytes)        Protobuf (binary, far fewer bytes)
   ─────────────────────         ──────────────────────────────────
   {"amount":1299,               [field 1, varint] 1299
    "from":"USD",                [field 2, string] USD
    "to":"EUR"}                  [field 3, string] EUR
        ▲                                ▲
   field names + quotes +          no field names - just the tag
   braces all shipped as text      number, type hint, and value
```

Protocol Buffers writes each field as its *number* (the `= 1` tag), a hint of its type, and the raw value - 
nothing else. The field names and JSON punctuation aren't there at all, so the result is meaningfully
smaller and faster to read: the receiver already knows from the contract what field `1` means and doesn't
parse any text. (Exact byte counts depend on the values; the point is "fewer bytes, no text parsing," not a
fixed ratio.)

The real cost of this - which we'll face squarely in Phase 3 - is that you can't read that binary stream
with your eyes the way you can read JSON.

## 4. The four call types

REST gives you one basic shape: send a request, get a response. gRPC keeps that shape but adds three
**streaming** modes, because it runs over HTTP/2, which can keep a channel open and send many messages over
it in either direction.

📝 **Terminology - a "stream" here means a sequence of messages over one call.** Instead of one request and
one response, one side (or both) can send a series of messages over the same open call, over time.

```text
  1. Unary          client ── req ──▶ server          one request,
                    client ◀── res ── server          one response.  (like REST)

  2. Server stream  client ── req ──▶ server          one request,
                    client ◀── res ── server          many responses
                    client ◀── res ── server          trickling back over time.
                    client ◀── res ── server

  3. Client stream  client ── req ──▶ server          many requests
                    client ── req ──▶ server          sent up, then ...
                    client ── req ──▶ server
                    client ◀── res ── server          one response at the end.

  4. Bidirectional  client ── req ──▶ server          both sides send
                    client ◀── res ── server          freely, independently,
                    client ── req ──▶ server          over one open call.
                    client ◀── res ── server
```

What each is *for*, in plain terms:

- **Unary** - the everyday one. Convert a currency, fetch a user, place an order. If you're new to gRPC,
  almost everything you write will be unary, and it behaves just like the request/response you already know.
- **Server streaming** - the server has a lot to send back and you'd rather get it as it's ready than wait
  for all of it. Think "stream me search results as they're found" or "send me live price updates."
- **Client streaming** - you have a lot to send up and want one summary back. Think "here are 10,000 metrics
  rows; reply with the count you stored."
- **Bidirectional streaming** - both sides talk at once over one connection. Think live chat, or a
  back-and-forth where the server reacts to what the client sends while still receiving more.

You declare which kind you want right in the `.proto`, with the `stream` keyword:

```protobuf
service PriceFeed {
  rpc GetQuote(Symbol) returns (Quote);              // unary
  rpc WatchPrice(Symbol) returns (stream Quote);     // server streaming
}
```

`WatchPrice` returns `stream Quote` instead of a single `Quote`, so the generated client stub gives you
something you read from in a loop as new quotes arrive, rather than a single value. The contract itself
records that this call streams, so both sides generate the right shape of code for it.

💡 **Key point.** The streaming modes aren't an exotic add-on; they fall naturally out of building on
HTTP/2. But you don't have to use them. Reach for streaming when the data genuinely arrives over time;
otherwise plain unary is the right, boring default.

## Recap

1. The **`.proto` file** declares **messages** (data shapes) and a **service** (callable functions) - the
   shared contract.
2. **Field tag numbers** (`= 1`, `= 2`) are the real identity of each field on the wire - never reuse them;
   renaming a field is safe because names don't travel.
3. **`protoc` generates code** - message types plus client/server **stubs** - in many languages from the one
   file, so different-language services interoperate safely.
4. The client stub makes a remote call **look like a local function**; messages travel as compact **binary**,
   not text.
5. There are **four call types**: unary (the default), server streaming, client streaming, and bidirectional
 - declared with the `stream` keyword in the contract.

You now know what gRPC is and how it works. The last and most important question is the real one: when is
all this worth it, and when is it the wrong tool?

---

[← Phase 1: The Problem gRPC Solves](01-the-problem-grpc-solves.md) · [Guide overview](_guide.md) · [Phase 3: The Real Trade-offs →](03-the-honest-trade-offs.md)
