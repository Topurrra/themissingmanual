---
title: "The Contract Is Forever"
guide: "designing-apis-that-last"
phase: 1
summary: "The moment a client depends on your API, a breaking change breaks them silently in production; this phase defines what counts as breaking (removing or renaming fields, changing types or meaning) versus a safe additive change, and the mindset that follows."
tags: [apis, breaking-changes, api-contract, backward-compatibility, additive-changes]
difficulty: advanced
synonyms: ["what is a breaking change", "what counts as a breaking api change", "is adding a field a breaking change", "safe additive api change", "why renaming a json field breaks clients", "api as a contract"]
updated: 2026-07-10
---

# The Contract Is Forever

You changed one field. Tests green, staging fine, you ship it. Somewhere out there, a payment
integration you've never heard of, written by a team you've never met, stops working at 3am their
time. They didn't change anything. *You* did. But it's their pager going off.

When you write a normal function, only code you can see and re-run can break. An API is the
opposite: the code that depends on it lives on *other people's* machines, written against the shape
your API had the day they integrated - and you can't test it, see it, or fix it. So the one skill
that matters above all others: looking at a proposed change and knowing, cold, whether it will break
someone. That's this phase.

## The breaking-vs-safe cheat-card

> **About to change a response, a request, or a status code? Find it here first.** If it's in the left
> column, you cannot do it in place - you need a new version (Phase 2).

| The change | Breaking? | Why |
|---|---|---|
| Remove a field from a response | 💥 **Breaking** | A client reading it now gets nothing (§ "Removing") |
| Rename a field (`user_name` → `username`) | 💥 **Breaking** | It's a remove + an add; the old name vanishes (§ "Renaming") |
| Change a field's type (`"42"` → `42`) | 💥 **Breaking** | Client's parser/validator chokes on the new type (§ "Changing types") |
| Change what a field *means* (same name, new semantics) | 💥 **Breaking** | The worst kind - nothing errors, behavior just goes wrong (§ "Changing meaning") |
| Add a new optional field to a response | ✅ Safe | Old clients ignore what they don't read (§ "The one safe move") |
| Add a new endpoint | ✅ Safe | Nobody depends on it yet |
| Add a new **optional** request parameter | ✅ Safe | Omitting it keeps the old behavior |
| Make a previously-required request field optional | ✅ Safe | Every existing request still validates |
| Make an optional request field **required** | 💥 **Breaking** | Existing requests that omit it now fail |
| Add a new value to an enum the client must handle | ⚠️ **Often breaking** | Clients with strict `switch`/validation reject the unknown value (§ "The enum trap") |

The rest of this phase is the *why* under each row - once it clicks, you can judge changes that
aren't on any list.

## What "the contract" actually is

Your API's contract isn't a document - it's the *observable behavior clients have come to rely on*.
Every field name, type, status code, error shape, default: if a client can see it and build on it,
it's part of the promise, whether you wrote it down or not.

Clients don't integrate against your docs; they integrate against what your API *actually returned*
the day they tested. If your docs say a field is "a string" and you've always returned a number,
clients coded for the number. This is also why undocumented fields are dangerous - people find them,
depend on them, and now you can't change those either.

```text
   What you think the contract is        What it really is
   ─────────────────────────────        ─────────────────────────────
        ┌───────────────┐                ┌───────────────┐
        │   your docs    │                │  every byte a  │
        │  (what you      │                │  client has    │
        │   meant)        │      vs.      │  ever seen and │
        └───────────────┘                │  depended on   │
                                          └───────────────┘
                                          ← this is what breaks them
```

📝 **Terminology.** A change is **backward compatible** if a client written against the *old* version
keeps working unchanged against the *new* one. "Breaking" is the opposite. The whole game of this
guide is staying backward compatible as long as possible.

## Removing a field - the obvious break

A client somewhere reads `response.total_price`. You decide it's redundant and delete it. Their code
now reads `undefined` (or throws, or renders `$NaN` on a checkout page), with no warning until it
happens live.

```console
$ # Old response your client integrated against:
$ curl https://api.example.com/orders/1138
{
  "id": 1138,
  "status": "shipped",
  "total_price": 4200,
  "total_price_display": "$42.00"
}

$ # You "cleaned up" and removed total_price. New response:
$ curl https://api.example.com/orders/1138
{
  "id": 1138,
  "status": "shipped",
  "total_price_display": "$42.00"
}
```
Nothing errors on your side - the response is perfectly valid JSON. But every client that read
`total_price` now gets nothing where a number used to be. The break is silent on your end, loud on
theirs.

⚠️ **Gotcha.** "Nobody uses that field" is a guess unless you have request-level telemetry proving it
 - and even then, a client that calls the endpoint rarely (a monthly billing job) may not show up in a
week of logs. Treat removal as breaking by default.

## Renaming a field - a remove plus an add

A rename feels gentler than removal - you're not *losing* data, just calling it a better name. But to
a client, it's a removal of the old name and an addition of a new one they never asked for.

```console
$ # Before:
{ "user_name": "ada", "id": 7 }

$ # After "just renaming for consistency":
{ "username": "ada", "id": 7 }
```
The client reading `user_name` now reads `undefined`; `username` is invisible to them because their
code never asked for it. You broke a client *and* left the data sitting right there under a
different key - which makes the bug extra confusing to debug from their side.

## Changing a field's type - the parser break

Same field name, different type: an ID goes from string to real integer, or a money amount from
integer cents to a decimal string. Every client that parsed or validated the old type breaks.

```console
$ # Before - id is a string:
{ "id": "1138", "amount": 4200 }

$ # After - id is now a number, amount is now a decimal string:
{ "id": 1138, "amount": "42.00" }
```
A statically-typed client (Go, Rust, Java) that declared `id: String` now fails to deserialize the
*whole* response - one field's type flipped and the entire parse blows up. A client doing `amount *
quantity` now does string-times-number and gets garbage.

💡 **Key point.** Type changes are sneaky because the *shape* (the set of keys) looks identical in a
diff. Reviewers scanning for added/removed keys miss them. A value's type is part of the contract too.

## Changing a field's meaning - the worst kind

The field keeps its name *and* type, but you change what it represents: `price` used to be dollars,
now it's cents. A `status` of `"active"` used to mean "subscribed," now means "account exists."

Every other breaking change at least *fails loudly* somewhere - a missing field, a parse error. A
meaning change passes every type check and schema validation. The data flows through perfectly. It's
just wrong.

```console
$ # Before - price is in whole dollars:
{ "id": 1138, "price": 42 }

$ # After - you switched the whole system to cents, price is now 4200:
{ "id": 1138, "price": 4200 }
```
The response is structurally identical - a number called `price`, exactly as before. No error, no
alert. A reporting dashboard now shows every order at 100× its real value; a fraud rule that flags
orders over `1000` now flags everything. The break is invisible until someone notices the numbers are
insane, and it's been wrong for days by then.

## The one safe move: additive changes

Here's the asymmetry the entire next phase is built on. **Adding is (almost always) safe; removing,
renaming, and redefining are not.** A well-behaved client reads the fields it knows and ignores the
rest, so a *new, optional* field is invisible to old clients and available to new ones.

```console
$ # Old client integrated against this:
{ "id": 1138, "status": "shipped" }

$ # You add a new field. Old client still works; new clients can use it:
{ "id": 1138, "status": "shipped", "estimated_delivery": "2026-06-25" }
```
The old client keeps reading `id` and `status` exactly as before and never notices
`estimated_delivery` exists. Pure upside for clients who want it, zero cost for clients who don't - 
*the lever you'll pull instead of breaking changes whenever you possibly can.*

⚠️ **The enum trap.** "Additive" has one exception. Adding a new *value* to an existing field - a new
`status` like `"refunded"`, a new `type` like `"gift_card"` - is safe only if clients shrug at values
they don't recognize. Many aren't: a strict `switch` with no default, or a schema listing allowed
values, will *reject* the unknown one. Design clients to tolerate unknown values, and document that
new values may appear - see Phase 3's "sensible defaults."

## The mindset shift

- **You can add. You can't take away or redefine.** Once a field, type, or meaning is public, it's
  effectively frozen for the life of that version.
- **"Silent" is the default failure mode.** Most breaking changes don't error on your side - they
  succeed on your side and fail on theirs, which is exactly why they slip through.
- **Default to "breaking" when unsure.** If you can't *prove* a change is backward compatible, treat
  it as if it isn't, and reach for the tools in Phase 2.

The people who depend on you can't see your changes coming and can't fix the breakage themselves.
Hold the promise, and they trust you with more. Break it silently, and they start pinning to old
versions, wrapping your API in defensive code, or leaving.

## Recap

1. Your **contract** is every observable behavior clients rely on - fields, types, status codes,
   meanings - documented or not.
2. **Removing, renaming, and type-changing** a field are all breaking: the client built against the
   old shape, and the old shape is gone.
3. **Changing a field's meaning** is the most dangerous break - it passes every check and just
   produces wrong results.
4. **Adding an optional field or endpoint** is the one reliably safe move; old clients ignore what
   they don't read.
5. **Adding an enum value is a gray-zone change** - safe for tolerant clients, breaking for strict ones.
6. The mindset: **you can add but not take away**, and most breaks are **silent on your side**, so
   default to "breaking" when in doubt.

---

[← Guide overview](_guide.md) · [Phase 2: Versioning Strategies →](02-versioning-strategies.md)
