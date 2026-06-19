---
title: "The Problem gRPC Solves"
guide: "grpc-explained"
phase: 1
summary: "Internal services that call each other thousands of times need both speed and a strict typed contract; gRPC answers with contract-first design (Protocol Buffers) and compact binary messages over HTTP/2."
tags: [grpc, protobuf, http2, microservices, rpc, contract]
difficulty: intermediate
synonyms: ["why use grpc", "what problem does grpc solve", "grpc vs rest performance", "what is a typed contract", "contract first api", "service to service communication"]
updated: 2026-06-19
---

# The Problem gRPC Solves

Picture the inside of a modern backend. It's rarely one program anymore — it's a dozen small services. The
checkout service calls the inventory service to confirm stock. Inventory calls the pricing service. Pricing
calls the currency service. A single user clicking "buy" can fan out into hundreds of calls *between your
own services*, all happening in milliseconds, all on your own network.

That inside-the-datacenter traffic has different pressures than the API your mobile app talks to. And those
pressures are exactly what gRPC was built for. Before any `.proto` syntax, let's name the two problems
honestly — because once you feel them, gRPC stops looking weird and starts looking like an obvious answer.

## The first problem: REST is comfortable, but it isn't cheap

For a public API, REST over JSON is a great default. It's readable, debuggable in a browser, and everybody
knows it. But look at what happens on *every single call* when one of your services talks to another using
JSON over HTTP/1.1:

```text
   pricing service                              currency service
        │                                              │
        │  open a fresh TCP connection                 │
        │ ───────────────────────────────────────────▶│
        │  send: { "amount": 1299, "from": "USD",      │
        │          "to": "EUR" }   ← text, parsed      │
        │ ───────────────────────────────────────────▶│
        │                          read JSON as text,  │
        │                          turn "1299" into    │
        │                          a number again ...  │
        │◀─────────────────────────────────────────── │
        │  { "amount": 1187, "currency": "EUR" }       │
        │  close connection                            │
        ▼                                              ▼
```

*What just happened:* The number `1299` was turned into the text `"1299"`, shipped as characters, then
parsed back into a number on the other side. The field names `"amount"`, `"from"`, `"to"` rode along as
text on every request. And on HTTP/1.1, each call often pays to set up and tear down a connection. None of
this hurts much once. Multiply it by hundreds of thousands of internal calls per second and the waste — CPU
spent serializing text, bytes spent on repeated field names, time spent on connection overhead — becomes
real money and real latency.

📝 **Terminology — serialize / deserialize.** *Serializing* is turning an in-memory object (a struct, a
class instance) into a stream of bytes you can send over the network. *Deserializing* is rebuilding the
object from those bytes on the other end. JSON serialization produces human-readable text; that readability
is precisely what costs you size and parsing time.

## The second problem: JSON has no enforced contract

Here's the one that bites teams hardest, and it has nothing to do with speed.

When the pricing service calls the currency service over JSON, *nothing checks that the two agree on the
shape of the data.* The currency team renames `amount` to `amountInCents`. Their tests pass. They deploy.
Now every call from pricing silently reads `amount` as missing — `undefined`, `null`, or zero depending on
the language — and you find out from a customer, not a compiler.

```text
   what pricing SENDS          what currency now EXPECTS
   ┌──────────────────┐        ┌──────────────────────┐
   │ amount:  1299     │  ✗     │ amountInCents: ?      │   ← nobody warned anyone
   │ from:   "USD"     │        │ from:          "USD"  │
   │ to:     "EUR"     │        │ to:            "EUR"  │
   └──────────────────┘        └──────────────────────┘
```

*What just happened:* Two services disagree about the data's shape and neither one knew at build time. With
plain JSON, the "contract" between services lives in a wiki page, a Slack thread, or someone's memory — not
in anything a machine enforces. ⚠️ **This is the quiet killer of microservice systems:** integration bugs
that only surface in production because nothing forced both sides to agree first.

## The mental model: define the functions once, both sides agree

gRPC's whole idea is to attack both problems with one move. You write down the *contract* — the available
functions and the exact shape of their inputs and outputs — in a single file that both services share.

That's the line to hold onto:

💡 **Key point.** gRPC is **contract-first**. You define the service's functions and message shapes once, in
a `.proto` file, and *both* the caller and the callee generate their code from that same file. The contract
isn't a wiki page — it's the source of truth that both sides are physically built from.

Once that contract exists, two good things fall out of it for free:

- **Speed.** Because both sides already know the exact shape of every message, the data can travel as a
  compact **binary** format (Protocol Buffers) instead of text. No field names on the wire, no parsing text
  into numbers — the layout is known in advance. And gRPC runs over **HTTP/2**, which reuses one connection
  for many calls instead of opening a new one each time.
- **Safety.** Calling a remote service feels like calling a normal function in your own code:
  `currency.Convert(request)`. If you pass the wrong type, your compiler complains *before* you ship,
  because the function signature was generated from the shared contract.

📝 **Terminology — RPC.** The "RPC" in gRPC stands for **Remote Procedure Call**: the idea of calling a
function that happens to run on another machine, as if it were local. REST makes you think in *resources and
verbs* (`GET /users/42`). RPC makes you think in *functions* (`GetUser(id: 42)`). gRPC is Google's modern
take on that old idea — the "g" is just Google's prefix, not "good" or "great."

Here's the same currency call, but as gRPC frames it. Don't worry about the syntax yet — Phase 2 walks
through it. Notice only the *feeling*:

```text
   pricing service                              currency service
        │                                              │
        │  convert(amount=1299, from=USD, to=EUR)      │
        │  ─ a function call ─────────────────────────▶│   one shared, persistent
        │     sent as compact binary over HTTP/2       │   HTTP/2 connection
        │◀─────────────────────────────────────────── │
        │  Money(amount=1187, currency=EUR)            │
        ▼                                              ▼
```

*What just happened:* From the developer's chair, pricing called a function and got a typed result back. No
hand-written JSON, no guessing the field names. Underneath, gRPC serialized the call to binary, sent it over
a connection that stays open for the next call too, and the strong types on both ends came from the one
contract file they share.

## Why this saves you later

The next time a teammate renames a field on a service you depend on, you won't learn about it from an angry
customer. You'll learn about it when you pull the updated contract and your build breaks — which is exactly
when you *want* to learn about it. And the next time someone asks why the internal call graph is suddenly
half the latency it was on JSON, you'll know: smaller payloads, no repeated text parsing, one reused
connection.

That's the trade gRPC offers. You'll see in Phase 3 that it asks for something real in return — but first,
let's open up the machinery and see how the contract actually becomes running code.

## Recap

1. **Internal service-to-service traffic** is high-volume and latency-sensitive in a way public APIs often
   aren't — the waste in text serialization and per-call connection setup adds up fast.
2. **Plain JSON has no enforced contract** — two services can silently disagree on data shape and you only
   find out in production.
3. **gRPC is contract-first:** define functions and message shapes once in a `.proto` file; both caller and
   callee are built from it.
4. **Speed** comes from compact binary Protocol Buffers over a reused **HTTP/2** connection; **safety** comes
   from calling remote services like typed local functions.
5. **RPC** means "call a function that runs elsewhere" — you think in functions, not resources and verbs.

---

[← Guide overview](_guide.md) · [Phase 2: How gRPC Works →](02-how-grpc-works.md)
