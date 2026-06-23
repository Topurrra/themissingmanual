---
title: "The Contract Is Forever"
guide: "designing-apis-that-last"
phase: 1
summary: "The moment a client depends on your API, a breaking change breaks them silently in production; this phase defines what counts as breaking (removing or renaming fields, changing types or meaning) versus a safe additive change, and the mindset that follows."
tags: [apis, breaking-changes, api-contract, backward-compatibility, additive-changes]
difficulty: advanced
synonyms: ["what is a breaking change", "what counts as a breaking api change", "is adding a field a breaking change", "safe additive api change", "why renaming a json field breaks clients", "api as a contract"]
updated: 2026-06-19
---

# The Contract Is Forever

You changed one field. On your machine, in the test suite, in the staging app — everything's green. You
ship it. And somewhere out there, a payment integration you've never heard of, written by a team you've
never met, stops working at 3am their time. They didn't change anything. *You* did. But it's their pager
that's going off.

This is the part of API work nobody warns you about. When you write a normal function, the only code
that can break is code you can see and re-run. An API is the opposite: the code that depends on it lives
on *other people's* machines, was written against the shape your API had *the day they integrated*, and
you cannot test it, see it, or fix it. The promise you made when you shipped is the promise they're
still holding you to.

So before any versioning machinery, you need one skill above all others: looking at a proposed change
and knowing, cold, whether it will break someone. That's what this phase is for.

## The breaking-vs-safe cheat-card

> **About to change a response, a request, or a status code? Find it here first.** If it's in the left
> column, you cannot do it in place — you need a new version (Phase 2).

| The change | Breaking? | Why |
|---|---|---|
| Remove a field from a response | 💥 **Breaking** | A client reading it now gets nothing (§ "Removing") |
| Rename a field (`user_name` → `username`) | 💥 **Breaking** | It's a remove + an add; the old name vanishes (§ "Renaming") |
| Change a field's type (`"42"` → `42`) | 💥 **Breaking** | Client's parser/validator chokes on the new type (§ "Changing types") |
| Change what a field *means* (same name, new semantics) | 💥 **Breaking** | The worst kind — nothing errors, behavior just goes wrong (§ "Changing meaning") |
| Add a new optional field to a response | ✅ Safe | Old clients ignore what they don't read (§ "The one safe move") |
| Add a new endpoint | ✅ Safe | Nobody depends on it yet |
| Add a new **optional** request parameter | ✅ Safe | Omitting it keeps the old behavior |
| Make a previously-required request field optional | ✅ Safe | Every existing request still validates |
| Make an optional request field **required** | 💥 **Breaking** | Existing requests that omit it now fail |
| Add a new value to an enum the client must handle | ⚠️ **Often breaking** | Clients with strict `switch`/validation reject the unknown value (§ "The enum trap") |

The rest of this phase explains the *why* under each row, because once the reasoning clicks you'll be
able to judge changes that aren't on any list.

## What "the contract" actually is

**What it actually is.** Your API's contract isn't a document — it's the *observable behavior your
clients have come to rely on*. Every field name, every type, every status code, every error shape,
every default: if a client can see it and build on it, it's part of the promise, whether you wrote it
down or not.

**Why people get this wrong.** The intuitive model is "the contract is whatever I documented." But
clients don't integrate against your docs — they integrate against what your API *actually returned the
day they tested*. If your docs say a field is "a string" and you've always returned a number, clients
coded for the number. The real behavior is the real contract. (This is also why undocumented fields are
dangerous: people find them, depend on them, and now you can't change them either.)

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
keeps working unchanged against the *new* version. "Breaking" is just the opposite: it forces clients to
change their code to keep working. The whole game of this guide is staying backward compatible for as
long as you possibly can.

## Removing a field — the obvious break

**What it does in real life.** A client somewhere reads `response.total_price`. You decide the field is
redundant and delete it. Now their code reads `undefined` (or throws a `KeyError`, or renders `$NaN` on
a checkout page), and they have no warning until it happens live.

**A real example.**
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
*What just happened:* Nothing errored on *your* side — the API returns a perfectly valid response. But
every client that read `total_price` (to do math, to reconcile totals, to feed another system) now gets
nothing where a number used to be. The break is silent on your end and loud on theirs.

⚠️ **Gotcha.** "Nobody uses that field" is a guess, not a fact, unless you have request-level telemetry
that proves it — and even then, a client that calls the endpoint rarely (a monthly billing job) may not
show up in a week of logs. Treat removal as breaking by default.

## Renaming a field — a remove plus an add

A rename feels gentler than a removal — you're not *losing* the data, you're just calling it a better
name. But to a client, a rename is a removal of the old name and an addition of a new one. They were
reading the old name. The old name is gone.

```console
$ # Before:
{ "user_name": "ada", "id": 7 }

$ # After "just renaming for consistency":
{ "username": "ada", "id": 7 }
```
*What just happened:* You think you improved the naming. The client reading `user_name` now reads
`undefined`, and the new `username` field is invisible to them because their code never asked for it.
You broke a client *and* the data they need is sitting right there under a different key, which makes the
bug extra confusing to debug from their side.

## Changing a field's type — the parser break

**What it does in real life.** Same field name, different type. You decide an ID should be a real integer
instead of a string, or a money amount should be a decimal string instead of an integer of cents. Every
client that parses or validates that field was built for the old type.

```console
$ # Before — id is a string:
{ "id": "1138", "amount": 4200 }

$ # After — id is now a number, amount is now a decimal string:
{ "id": 1138, "amount": "42.00" }
```
*What just happened:* A statically-typed client (Go, Rust, Java, anything with a schema) that declared
`id: String` now fails to deserialize the whole response — one field's type flipped and the entire
parse blows up. A client doing `amount * quantity` now does string-times-number and gets garbage or a
crash. The field name never changed, so this one slips through reviews that only diff key names.

💡 **Key point.** Type changes are sneaky because the *shape* (the set of keys) looks identical in a
diff. Reviewers scanning for added/removed keys miss them entirely. When you change a value's type, you
are changing the contract just as surely as if you'd renamed the field.

## Changing a field's meaning — the worst kind

**What it actually is.** The field keeps its name *and* its type, but you change what it represents. The
classic: a `price` field that used to be dollars and is now cents. Or a `status` of `"active"` that used
to mean "subscribed" and now means "account exists." Or a timestamp that was local time and is now UTC.

**Why this is the most dangerous of all.** Every other breaking change at least *fails loudly*
somewhere — a missing field, a parse error. A meaning change passes every type check and every schema
validation. The data flows through perfectly. It's just *wrong*.

```console
$ # Before — price is in whole dollars:
{ "id": 1138, "price": 42 }

$ # After — you switched the whole system to cents, price is now 4200:
{ "id": 1138, "price": 4200 }
```
*What just happened:* The response is structurally identical — a number called `price`, exactly as
before. No client errors. No alert fires. A reporting dashboard now shows every order at 100× its real
value; a fraud rule that flags orders over `1000` now flags everything. The break is invisible until
someone notices the numbers are insane, and by then it's been wrong for days.

🪖 **War story.** A team changed a `quantity` field from "number of items" to "number of *cases* (12
items each)" to match a warehouse system. Same name, same integer type. The API tests were green for
weeks. The first sign of trouble was a customer receiving twelve times what they ordered — the meaning
change had quietly multiplied real shipments. Nothing in the *contract's shape* had changed; only its
truth had.

## The one safe move: additive changes

Here's the asymmetry that the entire next phase is built on. **Adding is (almost always) safe; removing,
renaming, and redefining are not.**

**Why adding works.** A well-behaved client reads the fields it knows about and ignores the rest. So a
*new, optional* field in a response is invisible to old clients and available to new ones.

```console
$ # Old client integrated against this:
{ "id": 1138, "status": "shipped" }

$ # You add a new field. Old client still works; new clients can use it:
{ "id": 1138, "status": "shipped", "estimated_delivery": "2026-06-25" }
```
*What just happened:* The old client keeps reading `id` and `status` exactly as before and never notices
`estimated_delivery` exists. The new field is pure upside — value for clients who want it, zero cost to
clients who don't. *This is the lever you'll pull instead of breaking changes whenever you possibly can.*

⚠️ **The enum trap.** "Additive" has one famous exception. Adding a new *value* to an existing field —
a new `status` like `"refunded"`, a new `type` like `"gift_card"` — is safe only if clients are built to
shrug at values they don't recognize. Many aren't: a strict `switch` with no default, or a schema that
lists allowed values, will *reject* the unknown one. So "add a new enum value" sits in the gray zone:
safe for tolerant clients, breaking for strict ones. Design clients to tolerate unknown values, and
document that new values may appear — see Phase 3's "sensible defaults."

## The mindset shift

Put the pieces together and the rule of thumb falls out on its own:

- **You can add. You can't take away or redefine.** Once a field, type, or meaning is public, it's
  effectively frozen for the life of that version.
- **"Silent" is the default failure mode.** Most breaking changes don't error on your side. They
  succeed on your side and fail on theirs, which is exactly why they slip through.
- **Default to "breaking" when unsure.** If you can't *prove* a change is backward compatible, treat it
  as if it isn't, and reach for the tools in Phase 2.

This isn't caution for its own sake. It's the direct consequence of the one fact that defines API work:
the people who depend on you can't see your changes coming and can't fix the breakage themselves. Hold
the promise, and they trust you with more. Break it silently, and they start pinning to old versions,
wrapping your API in defensive code, or leaving.

## Recap

1. Your **contract** is every observable behavior clients rely on — fields, types, status codes,
   meanings — documented or not.
2. **Removing, renaming, and type-changing** a field are all breaking: the client built against the old
   shape, and the old shape is gone.
3. **Changing a field's meaning** is the most dangerous break of all — it passes every check and just
   produces wrong results.
4. **Adding an optional field or endpoint is the one reliably safe move**; old clients ignore what they
   don't read.
5. **Adding an enum value is a gray-zone change** — safe for tolerant clients, breaking for strict ones.
6. The mindset: **you can add but not take away**, and most breaks are **silent on your side**, so
   default to "breaking" when in doubt.

---

[← Guide overview](_guide.md) · [Phase 2: Versioning Strategies →](02-versioning-strategies.md)
