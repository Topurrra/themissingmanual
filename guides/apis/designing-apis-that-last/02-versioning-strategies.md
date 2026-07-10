---
title: "Versioning Strategies"
guide: "designing-apis-that-last"
phase: 2
summary: "How to evolve an API without breaking clients: prefer additive changes, and when you must break, version (URL /v2/ vs header), run versions in parallel, and deprecate on a clear timeline with real communication — with the honest trade-offs of each approach."
tags: [apis, versioning, url-versioning, header-versioning, deprecation, parallel-versions, sunset]
difficulty: advanced
synonyms: ["url versioning vs header versioning", "how to version a rest api", "how to deprecate an api endpoint", "running two api versions at once", "api sunset timeline", "how to communicate api breaking changes", "v1 v2 api"]
updated: 2026-07-10
---

# Versioning Strategies

Phase 1 left an uncomfortable truth: you can add to an API forever, but the day you genuinely *must*
remove or redefine something, there's no in-place way to do it without breaking people. This phase is
that day — the techniques that let an API change shape over years while clients built against its
older shapes keep working.

The order here is also the order of preference: **stretch as far as you can with additive changes,
and only reach for a new version when you've truly run out of additive room.** A version bump is the
most expensive tool in the box — two code paths for you, a migration for clients. Used well, it's a
clean break. Used reflexively, it's a treadmill.

## First, exhaust the additive option

Before any versioning, ask: *can I get what I want by adding instead of changing?* Surprisingly
often, yes — and it sidesteps the entire cost of a version.

- **Want to rename `user_name` to `username`?** Don't. Add `username` alongside it, populate both,
  point new clients at the new one, and let the old field live on (deprecate it later — nobody breaks
  today).
- **Want to change a field's type?** Add a *new* field with the new type (`amount_decimal` next to
  `amount`) rather than mutating the existing one.
- **Want to change behavior?** Gate it behind a new *optional* request parameter that defaults to the
  old behavior. Old clients omit it and get exactly what they got yesterday.

```console
$ # Old clients omit the new param → old behavior, unchanged:
$ curl "https://api.example.com/orders?include=items"

$ # New clients opt in → new behavior:
$ curl "https://api.example.com/orders?include=items&group_by=warehouse"
```
Genuinely new behavior, no version, no migration, no parallel maintenance — the new capability is
opt-in, and the default is "behave like before."

💡 **Key point.** Most "we need v2" instincts dissolve once you ask "what's the additive version of
this?" Versioning is for when the *shape itself* must change in a way no addition can express — a
wholesale restructuring, a removal you can no longer defer, a meaning shift you can't dual-write around.

## When you must break: versioning

Sometimes additive genuinely can't get you there: the resource needs a fundamentally different shape,
an old field has become actively harmful, or the model underneath changed so much that bolting on
fields would make the API incoherent. That's when you version — via **URL versioning** or **header
versioning**, and they make a real trade-off.

```text
                      URL versioning                 Header versioning
                      /v2/orders                      Accept: application/vnd.example.v2+json
   ───────────────  ─────────────────────────────   ─────────────────────────────────────
   Visibility        Obvious — it's in the URL        Hidden — lives in a header
   Try in a browser  Yes, just paste the URL          No, you must set a header
   Routing/caching   Easy: route & cache by path      Harder: must vary by header
   Granularity       Whole API (or whole path) jumps  Can version finely, per request
   "RESTful purist"  Disliked (URL = the resource,    Preferred (one resource, many
   view             not its version)                  representations)
   Who uses it       Stripe-style date headers aside, very common; widely understood
```
*Neither is "correct."* URL versioning optimizes for **obviousness and operational simplicity**;
header versioning optimizes for **purity and fine-grained control**. Most teams land on URL
versioning — but pick for your audience, not the argument.

### URL versioning — `/v2/`

The version is a path segment: `/v1/orders`, `/v2/orders`. A new major version is a new set of paths.

```console
$ curl https://api.example.com/v1/orders/1138
{ "id": 1138, "price": 42 }          # v1: price in dollars (the old, frozen contract)

$ curl https://api.example.com/v2/orders/1138
{ "id": 1138, "price_cents": 4200 }  # v2: the redesigned shape
```
`/v1/` keeps serving the exact old contract forever; `/v2/` is free to be a clean, redesigned shape.
The version is impossible to miss — it's in every request, log line, bug report. The cost: "the
orders resource" now lives at two URLs (REST purists dislike this), and a client moving to v2 has to
change every URL it calls.

### Header versioning — `Accept:` (or a custom header)

The URL stays `/orders` forever; the client states its version in a request header — commonly a
versioned media type in `Accept`, or a custom header.

```console
$ curl https://api.example.com/orders/1138 \
    -H "Accept: application/vnd.example.v1+json"
{ "id": 1138, "price": 42 }

$ curl https://api.example.com/orders/1138 \
    -H "Accept: application/vnd.example.v2+json"
{ "id": 1138, "price_cents": 4200 }
```
Same URL, two representations, selected by header — one canonical address, and a client can move to
v2 by changing a header rather than rewriting every path. The costs: you can't reproduce a v2
response by pasting a URL into a browser, your caches and routers must be configured to **vary by
that header** (a classic source of "why am I getting the wrong version" bugs), and the version is
easy to forget because it's not in the URL you read every day.

⚠️ **Gotcha — don't version per tiny change.** Whichever scheme you pick, a version should mark a
*deliberate, breaking redesign* — not every little change. Cut a new version per field tweak and
clients face an endless migration treadmill while you maintain a graveyard of code paths. Keep making
additive changes *within* a version; reserve the bump for breaks you couldn't avoid.

## Run the old and new in parallel

A version bump is only humane if the old version keeps working while clients migrate — the whole
point of v2 is that v1 *doesn't disappear the moment v2 ships*.

```text
   time ──────────────────────────────────────────────────────►

   v1  ████████████████████████░░░░░░░░░░░  (live, then deprecated, then off)
                       v2  ███████████████████████████████████  (live)
                       ▲                  ▲                    ▲
                   v2 ships          deprecation         v1 sunset
                                     announced            (turned off)
                       └─── migration window ────────────┘
```
For a real stretch of time, both versions serve traffic. Clients migrate on *their* schedule inside
the window, not yours; v1 only goes dark after a clearly communicated sunset. Skip the overlap — flip
v1 off the day v2 lands — and "versioned" just becomes a breaking change with extra steps.

That overlap is the honest cost of versioning: two code paths, two sets of tests, two things that can
break, for as long as the window lasts. It's exactly why you exhaust additive changes first.

## Deprecate on a clear timeline, with real communication

"Deprecated" doesn't mean "deleted." It means **"still works, but is going away on a date we're
telling you now."** A deprecation clients learn about via a `404` is not a deprecation — it's an
outage you scheduled and didn't mention.

📝 **Terminology.** **Deprecate** = officially mark as going-away, while keeping it working. **Sunset**
= the date it actually stops working. The gap between them is the migration window.

A respectful deprecation does three things:

1. **Announce it where clients will see it** — changelog, email to registered developers, dashboard
   banner. Not buried in a doc nobody re-reads.
2. **Signal it in the API itself**, so clients who never read your email find out in their logs. The
   HTTP `Deprecation` and `Sunset` response headers exist for exactly this.
3. **Give a real, generous timeline** — proportional to how widely the thing is used. Days for an
   obscure beta endpoint; many months for a core resource thousands depend on.

```console
$ curl -i https://api.example.com/v1/orders/1138
HTTP/1.1 200 OK
Deprecation: true
Sunset: Sat, 31 Oct 2026 23:59:59 GMT
Link: <https://api.example.com/docs/v2-migration>; rel="deprecation"
{ "id": 1138, "price": 42 }
```
v1 still returns a perfectly good `200` — nobody's broken today. But every response now carries
machine-readable proof that this version is on the clock: `Sunset` gives the exact cutoff date, `Link`
points at the migration guide. (`Deprecation` and `Sunset` are defined in IETF RFC 9745 and RFC 8594.)

⚠️ **Gotcha — the silent majority.** Some clients never read your changelog, email, or headers. Before
you flip the switch on sunset day, look at your traffic — who's still calling v1? Reach out to the
heavy holdouts directly if you can. Turning off a version that's still serving real traffic, on
schedule but without a final check, is how a planned deprecation becomes someone's incident.

## Putting the strategy together

1. **Can I do it additively?** (New optional field, new endpoint, new opt-in parameter.) → Do that.
   No version, no migration. This is the answer most of the time.
2. **Must the shape itself break?** → Cut a new version (URL `/v2/` for obviousness, header for
   purity), and **run it in parallel** with the old one.
3. **Ready to retire the old version?** → **Deprecate first** — announce it, signal it in response
   headers, give a generous timeline, check who's still on it — *then* sunset.

Every step keeps the Phase 1 promise: clients depend on you and can't fix breakage themselves, so you
change in ways they can absorb on their own schedule. Phase 3 turns the lens forward — designing the
API so you land in step 1 far more often than step 2.

## Recap

1. **Exhaust additive changes first** — new fields, new endpoints, opt-in parameters — before reaching
   for a version. It's the cheapest evolution and avoids a migration entirely.
2. When the shape *must* break, **version**: **URL `/v2/`** trades RESTful purity for obviousness and
   easy routing/caching; **header versioning** trades convenience for a clean single-resource URL and
   finer control.
3. **Run old and new in parallel** through a real migration window — versioning without overlap is
   just a breaking change in disguise.
4. **Deprecate before you sunset**: announce it, signal it with `Deprecation`/`Sunset` response
   headers, and give a timeline proportional to usage.
5. Before flipping a version off, **check who's still calling it** — the silent majority never reads
   your announcements.

Watch it animated: [API versioning](/explainers/APIVersioning.dc.html)

---

[← Guide overview](_guide.md) · [Phase 3: Designing for Longevity →](03-designing-for-longevity.md)
