---
title: "Scaling the Stateful Bits"
guide: "designing-for-scale"
phase: 3
summary: "Statelessness lets you clone your app servers freely — but some things can't be cloned: sessions (move them to a shared store like Redis), the database (the usual bottleneck), and load you can shed with caching. Scaling is mostly the art of pushing state out to the edges so the middle can be cloned."
tags: [scaling, session-store, redis, database, caching, stateful, shared-state, architecture]
difficulty: advanced
synonyms: ["where to store session state", "shared session store redis", "how to scale the database", "caching to reduce load", "what is stateful in a scaled system", "externalize session state"]
updated: 2026-06-19
---

# Scaling the Stateful Bits

By now you have the comfortable part of the picture: a load balancer in front of a pool of identical, stateless app servers you can add and remove at will. That works because those servers remember *nothing*. But a real application clearly *does* remember things — who you're logged in as, what's in your cart, every row of data it has ever stored. So where did all that state go?

It didn't disappear. It moved. The whole trick of Phase 1 was to take state *out* of the app servers — but it has to live *somewhere*, and that somewhere is the subject of this phase. These are the bits you can't clone freely, the parts that resist horizontal scaling, the places where the hard problems concentrate. Good scaling architecture isn't about making everything stateless; it's about being deliberate about *where the unavoidable state lives* and shrinking how much of it there is.

## The shape of the problem

Here's the mental model for the whole phase. You've pushed state off the app servers — now it sits in a small number of shared places that *all* the app servers talk to:

```text
                    ┌───────────────────┐
        users ────▶ │   load balancer   │
                    └───────────────────┘
                      │      │      │
                 ┌────┘      │      └────┐
                 ▼           ▼           ▼
            ┌─────────┐ ┌─────────┐ ┌─────────┐
            │ app srv │ │ app srv │ │ app srv │   STATELESS — clone freely
            └─────────┘ └─────────┘ └─────────┘
                 │           │           │
                 └─────┬─────┴─────┬─────┘
                       ▼           ▼
                ┌────────────┐ ┌────────────┐
                │  SESSION   │ │  DATABASE  │   STATEFUL — the hard parts,
                │   STORE    │ │            │   shared by every app server
                │  (Redis)   │ │            │
                └────────────┘ └────────────┘
                       ▲
                ┌────────────┐
                │   CACHE    │   sheds load off the database
                └────────────┘
```

The app servers in the middle are easy — clone them all day. The shared stores at the bottom are where scaling gets real. Let's take them one at a time.

## Sessions: move them to a shared store

This is the direct fix for the bug that's haunted the last two phases — the in-memory session that breaks the moment you add a second server, and that sticky sessions only papered over.

**What it actually is.** Instead of keeping a user's session in whichever app server happened to handle their login, you keep it in a single **shared session store** that every app server can read and write. The classic choice is **Redis** — an in-memory data store that's extremely fast and lives on its own, separate from your app servers.

📝 **Terminology.** *Redis* is an in-memory key-value store (think: a giant, very fast hash map that lives on the network) commonly used for sessions, caching, and other small fast-access data. *Session store* just means "the shared place sessions live"; Redis is the usual one, but a database table works too.

**What it does in real life.** When a user logs in, their session is written to Redis under a key (often carried in a cookie). On their next request — whichever app server it lands on — that server reads the session straight out of Redis. Now it genuinely doesn't matter which server handles the request: they all look in the same place.

**A real example — any server, same session.** Here's a session being written once and read back from a different app server, both talking to the same Redis:

```console
# app-server-A handles the login and writes the session to shared Redis
$ redis-cli SET session:ada42 '{"user":"ada","cart":["sku-7","sku-9"]}'
OK

# later, app-server-C handles ada's next request and reads it right back
$ redis-cli GET session:ada42
"{\"user\":\"ada\",\"cart\":[\"sku-7\",\"sku-9\"]}"
```

*What just happened:* Server A wrote the session to Redis, not to its own memory. When server C later needed it, it read the exact same value out of the shared store — cart and all. Neither server kept anything locally, so the load balancer is free to send Ada wherever it likes. This is the clean fix that makes sticky sessions unnecessary: the state moved off the servers and into one place they all share.

**Why this saves you later.** The random-logout bug is gone *by construction* — there's no local session to miss, so there's nothing to be inconsistent about. You can add servers, remove servers, deploy, and reboot, and no user notices, because no user's state was ever tied to a particular box. You've turned the session from a thing pinned to a server into a thing pinned to a shared store everyone can reach.

⚠️ **Gotcha — you just moved the single point of failure, you didn't delete it.** Your app servers are now happily disposable, but if that one Redis goes down, *every* session is gone and *every* server is stuck at once. Externalizing state concentrates the risk into the store. That's a fair trade — one well-run, dedicated session store is far easier to make reliable than state smeared across a dozen app servers — but it does mean the session store now needs its *own* redundancy (a replica, failover) to not become the thing that takes you down. Keeping that store alive when machines die is the heart of [Designing for Failure](/guides/designing-for-failure).

## The database: the usual bottleneck

Here's the uncomfortable truth of scaling: you can clone app servers until you're blue in the face, and pretty soon they'll all be waiting on the *same database*. The database is where the real, permanent state lives — every user, every order, every row — and it's almost always the part that can't be casually cloned, because all those copies would have to agree with each other. It is, far more often than not, the actual bottleneck the whole system runs into.

**Why it's the hard part.** App servers are interchangeable because they hold nothing. The database is the opposite: it holds *everything*, and it has to be *correct*. You can't just run five databases the way you run five app servers, because then a row written to one wouldn't exist on the others. Making a database take more load means special, careful techniques — making read-only copies, or splitting the data across machines — each with real trade-offs around consistency and complexity.

**What to reach for, in order.** The good news is the cheap fixes come first, and most applications never need the dramatic ones:

- **Optimize before you scale.** A slow database is usually a missing index or a bad query, not a hardware shortage — fixing the query is free and often a bigger win than any new machine.
- **Scale up the database** before you scale it out. A bigger single database is vastly simpler than several coordinating ones, and one beefy box carries most applications a long way.
- **Then scale out** — read replicas for read-heavy load, sharding for write-heavy load — only when you genuinely must.

This guide isn't going to re-teach all of that, because it has a proper home. The full treatment — scale up vs out for databases, replication, sharding, read-heavy vs write-heavy, and the order to try things in — is [Scaling a Database](/guides/scaling-a-database). The thing to carry from *here* is just the architectural fact: **the database is the state you can't clone, so it's where scaling gets genuinely hard, and it's usually the wall you hit first.**

## Caching: shed load instead of adding capacity

Before you take on the hard work of scaling the database, there's a move that often removes the need: stop asking the database the same questions over and over.

**What it actually is.** A **cache** is a fast, temporary store (Redis again, or an in-memory layer) that holds the answers to expensive or frequently-repeated queries, so your app servers can get them without touching the database at all. The common pattern is *cache-aside*: check the cache first; on a miss, query the database and stash the result for next time.

**What it does in real life.** If your homepage runs the same "top 10 articles" query for every visitor, you're asking the database the identical question thousands of times for an answer that changes maybe once an hour. A cache turns thousands of database hits into one — plus thousands of cheap cache reads. Crucially, caching doesn't *add capacity*, it *removes load*: every request the cache answers is a request the database never sees. For read-heavy systems that's frequently the highest-leverage change available, and far less work than scaling the database itself.

⚠️ **Gotcha — caching trades freshness for speed, on purpose.** A cached answer can be stale until it expires or you invalidate it. That's the deal you're signing, and the genuinely hard part isn't filling the cache — it's deciding when to throw entries away so users don't see old data. Like the session store, a cache is also more shared state with its own failure modes. The full mechanics — patterns, invalidation strategies, what to cache and what never to — live in [Caching, Explained](/guides/caching-explained). The role it plays in *this* story is simple: caching lets you shed load off the stateful bottleneck, often buying you out of a harder scaling project entirely.

## The big picture: push state to the edges

Step back and look at what every move in this guide had in common. Statelessness (Phase 1) was about getting state *out* of the app servers. The load balancer (Phase 2) only worked *because* the servers held no state. And this phase has been about taking the state that's left — sessions, the database, the cache — and giving each piece a deliberate, shared home, then shrinking how much load actually reaches it.

💡 **Key point — the one idea to keep.** Scaling is mostly the art of **pushing state to the edges so the middle can be cloned.** The stateless middle — your app servers — is the easy, infinitely-cloneable part. The stateful edges — sessions, database, cache — are the hard parts, so you make them as few and as small as you can, give each one a single shared home, and protect that home. Almost every scaling decision is some version of this same move: *less state in the cloneable layer, and careful treatment of the state you can't avoid.*

There's a question this guide deliberately hasn't answered, though. We've talked the whole way through about servers getting *busy* — more load, more traffic. We've leaned on the load balancer quietly pulling a dead backend, and we've noted that the session store and database become single points of failure once you centralize state. But "busy" and "dead" are different problems. Designing so the system survives a machine *failing* — not just a machine being *overwhelmed* — is its own discipline: redundancy, failover, what happens when the database you just centralized everything onto falls over at 3am. That's the natural next step, and it's [Designing for Failure](/guides/designing-for-failure).

## Recap

1. State doesn't vanish when you make app servers stateless — it **moves to a few shared stores** that every server talks to.
2. **Sessions** go in a shared store (commonly Redis) so any server can serve any user — the real fix that makes sticky sessions unnecessary.
3. The **database** is the state you can't clone, so it's the hard part and usually the first wall you hit. Optimize, then scale up, then scale out — full details in [Scaling a Database](/guides/scaling-a-database).
4. **Caching** sheds load off that bottleneck by not asking the same question twice — often buying you out of a harder scaling project. Details in [Caching, Explained](/guides/caching-explained).
5. Externalizing state **concentrates the single point of failure** into those shared stores, which then need their own redundancy — the subject of [Designing for Failure](/guides/designing-for-failure).
6. The whole game: **push state to the edges so the middle can be cloned.**

---

[← Phase 2: Load Balancing](02-load-balancing.md) · [Guide overview →](_guide.md)
