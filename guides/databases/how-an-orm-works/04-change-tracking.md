---
title: "Change Tracking & Dirty Checking"
guide: "how-an-orm-works"
phase: 4
summary: "How an ORM knows what to UPDATE without you calling save - snapshots and dirty checking, proxies and notifications, and the detached-object trap that bites every web app."
tags: [orm, database, change-tracking, dirty-checking, flush]
difficulty: advanced
synonyms: ["orm change tracking", "dirty checking", "orm snapshot", "orm how it knows what changed", "orm flush update", "orm detached entity"]
updated: 2026-07-10
---

# Change Tracking & Dirty Checking

[Phase 3](03-identity-map-and-unit-of-work.md) introduced the **unit of work**: the session batches up
everything that happened during a transaction and flushes it as one coordinated set of writes at commit.
That raises the question we waved past - *how does the unit of work know what to write?* You loaded a
hundred objects, poked at three of them, and called `commit`. The session has to figure out that exactly
those three rows need an UPDATE, and which columns. That detective work is **change tracking**, and the
specific trick most ORMs use is **dirty checking**.

> 📝 The mental model: **change tracking is how the unit of work knows what to write.** You don't tell the
> ORM "this object changed" - you mutate the object, and the session *notices*. There is no explicit `save`
> call on a loaded-and-modified object. That's the whole magic, and once you see how it works, the magic
> stops being scary and becomes predictable.

## You mutate; the session figures out the SQL

Here's the move that confuses people the first time they see it. You load an object, change a field, commit.
No `update`, no `save`, nothing that screams "write to the database."

```text
user = session.find(User, 5)     # SELECT ... WHERE id = 5
user.email = "new@example.com"   # just a plain field assignment
session.commit()                 # an UPDATE appears, all by itself
                                 # → UPDATE users SET email = ? WHERE id = 5
```

*What just happened:* You never asked for an UPDATE. The session was *tracking* `user` from the moment
`find` returned it (it lives in the identity map from Phase 3). At commit, the session looked at every
object it was tracking, decided `user` had changed, and generated the SQL. This is exactly the behavior
you get in **Hibernate**, **SQLAlchemy**, and **EF Core** out of the box - assignment is enough. Nobody is
being clever in your code; the cleverness is in the session.

## The two ways an ORM notices

There are two main mechanisms ORMs use to know an object changed. Most popular ORMs use the first.

### 1. Snapshot / dirty checking

When the session loads an object, it quietly keeps a **snapshot** - a copy of the object's original column
values as they came out of the database. The live object is what your code mutates; the snapshot is frozen.
At flush time, the session walks every tracked object and **compares current values to the snapshot field by
field**. Any field that differs makes the object "dirty," and the ORM emits an UPDATE touching *only the
changed columns*.

```text
# at load: session stores  snapshot = { email: "old@x.com", name: "Sam", age: 30 }
user.email = "new@x.com"
# at flush: compare live object to snapshot
#   email: "new@x.com" != "old@x.com"   → dirty
#   name:  "Sam"       == "Sam"          → unchanged
#   age:   30          == 30             → unchanged
# result → UPDATE users SET email = ? WHERE id = 5     (only email)
```

*What just happened:* The session didn't watch you type - it held the "before" picture and diffed it
against the "after" picture at flush. Because only `email` differed, the UPDATE sets only `email`, not the
whole row. This snapshot-and-diff approach is **Hibernate's** and **EF Core's** default change tracking,
and how **SQLAlchemy** tracks attribute changes too.

### 2. Proxies / explicit notification

Snapshotting has a cost (more on that below), so some setups instead **record changes as they happen**. The
ORM wraps your object in a **proxy**, or asks your class to fire a notification on every property set (the
`INotifyPropertyChanged` pattern in the .NET world). Now there's no need to diff against a snapshot at flush
 - the tracker already has a list of exactly which fields were touched.

```text
# proxy-wrapped object: every setter is intercepted
user.email = "new@x.com"   # proxy records: "email was changed"
# at flush: no diff needed - the change list already says email is dirty
# result → UPDATE users SET email = ? WHERE id = 5
```

*What just happened:* Instead of comparing before/after at the end, the object reported each change the
instant it occurred. EF Core can run in this mode with change-tracking proxies, and Hibernate offers
bytecode-enhanced tracking for the same reason. The payoff is no snapshot to store and no full scan at
flush; the cost is your entities have to cooperate - be proxyable or implement the notification interface.

## Inserts, updates, and deletes - all decided at flush

Change tracking isn't only about edits. The session classifies *every* tracked object into one of a few
states and computes the minimal set of statements when it flushes:

```text
new_user = User(name="Kai")
session.add(new_user)          # tracked as NEW        → will INSERT

user.email = "new@x.com"       # tracked, value changed → will UPDATE

session.delete(old_user)       # marked removed        → will DELETE

session.commit()
# the unit of work emits, in dependency order:
#   INSERT INTO users ...
#   UPDATE users SET email = ? WHERE id = 5
#   DELETE FROM users WHERE id = 9
```

*What just happened:* Three different intentions - add, mutate, remove - became three SQL statements, and
the session worked out which is which. A freshly constructed object you `add`/`persist` becomes an INSERT;
one you mutated becomes an UPDATE; one you `delete` becomes a DELETE. Untouched tracked objects produce no
SQL at all - this is the unit of work from Phase 3 doing its job, fed by the change tracker.

## ⚠️ The detached-object trap

Now the part that bites real applications. Everything above assumes the object is **tracked by the current
session**. An object the session *isn't* tracking has no snapshot and no proxy hookup, so mutating it does
**nothing** at commit - the session never looks at it, never diffs it, never writes it.

This is the single most common ORM surprise in web apps, because web apps constantly build objects the
session has never seen:

```text
# A typical web handler:
data = request.json                       # { "id": 5, "email": "new@x.com" }
user = User(id=5, email=data["email"])    # brand-new object, NOT from this session
session.commit()                          # ...nothing happens. No UPDATE. No error.
```

*What just happened:* You constructed `user` yourself from an HTTP payload. The session has no snapshot
for it and isn't tracking it - to the session, this object does not exist. Commit writes nothing, and you
get the maddening "I clearly changed it and the database didn't update" bug. The same happens to an object
loaded in a *different* session, or one that's already closed: once it's outside a live session's
tracking, it's **detached**, and edits to it are invisible.

The fix is to hand the object back to a session so it starts tracking again - **re-attach or merge** it:

```text
user = User(id=5, email="new@x.com")   # detached, untracked
managed = session.merge(user)          # session now tracks a managed copy
session.commit()                       # → UPDATE users SET email = ? WHERE id = 5
```

*What just happened:* `merge` (its name in Hibernate and SQLAlchemy; EF Core uses `Update` and `Attach`)
brings the object's values into a session-tracked entity, loading the existing row if needed so it has a
snapshot to diff against. Now there's something to track, so the change gets written. The rule to burn in:
**a mutation only counts if a live session is tracking the object.** When you build objects outside the
session - request payloads, cross-session caches, serialized data - re-attach them first. This trap is
identical in spirit across **Hibernate**, **SQLAlchemy**, **EF Core**, and friends; only the method names
differ.

## 💡 Tracking isn't free - and you can turn it off

Dirty checking buys a lot of convenience, but it has a real cost: the session has to *hold a snapshot for
every loaded object* and *scan all of them at every flush* to find what changed. Load 10,000 rows to
render a report, and you've paid for 10,000 snapshots and a 10,000-object diff - for data you never
intend to write back.

That's why every serious ORM gives you a **no-tracking mode** for read-only work:

```text
# read-only: don't snapshot, don't track, don't diff
report_rows = session.query(User).no_tracking().all()   # EF Core: AsNoTracking()
# faster, leaner - but these objects are detached:
report_rows[0].email = "x"   # ⚠️ has no effect on commit (nothing is tracking them)
```

*What just happened:* You told the ORM "I'm only reading," so it skipped the snapshot and the change
scan - cheaper memory, faster flush. **EF Core** spells this `AsNoTracking()`; **Hibernate** has read-only
and stateless sessions; **SQLAlchemy** lets you bypass the identity-map/tracking path for similar reasons.
The trade-off is the detached-object trap on purpose: reach for no-tracking only when you genuinely don't
plan to save these objects.

## Recap

- **Change tracking is how the unit of work knows what to write.** You mutate a loaded object and the session
  generates the UPDATE - there is no explicit `save` on a tracked, modified object.
- Two mechanisms: **snapshot/dirty checking** (keep the original values, diff at flush, UPDATE only changed
  columns - Hibernate's and EF Core's default) and **proxy/notification** tracking (record each change as it
  happens, no diff needed).
- At flush, the session classifies tracked objects: **new → INSERT, changed → UPDATE, removed → DELETE**, and
  emits the minimal set of statements.
- ⚠️ **Detached objects aren't tracked.** Mutating an object the current session never loaded (e.g. built
  from a request payload or a closed session) does nothing on commit - you must `merge`/`Update`/`Attach` it
  first. This is the #1 real-world ORM surprise.
- 💡 Tracking costs memory and flush time. Use **no-tracking** mode (`AsNoTracking`, read-only/stateless
  sessions) for read-only queries - accepting that those objects become detached.

## Quick check

```quiz
[
  {
    "q": "In an ORM with default dirty checking, what makes a loaded object get an UPDATE at commit?",
    "choices": ["Calling session.save(object) explicitly", "Mutating one of its fields - the session diffs it against its snapshot", "Adding it with session.add()", "Nothing; loaded objects are never updated"],
    "answer": 1,
    "explain": "The session keeps a snapshot of the loaded values and compares it at flush. A differing field marks the object dirty, so an UPDATE for the changed columns is generated - no explicit save needed."
  },
  {
    "q": "You build a User from an HTTP request payload, set its email, and call commit(). No UPDATE happens. Why?",
    "choices": ["The email value was invalid", "The object is detached - the session isn't tracking it, so it has no snapshot to diff and is ignored", "Commit only runs INSERTs, never UPDATEs", "The identity map blocked the write"],
    "answer": 1,
    "explain": "An object the current session never loaded is detached: no snapshot, no tracking. Mutating it does nothing on commit. You must merge/Update/Attach it so the session tracks it."
  },
  {
    "q": "Why might you use a no-tracking mode (e.g. EF Core's AsNoTracking) for a read-only report query?",
    "choices": ["It makes UPDATEs faster", "It skips snapshotting and the flush-time diff, saving memory and time for data you won't write back", "It automatically attaches objects to the session", "It enables lazy loading"],
    "answer": 1,
    "explain": "Tracking costs a snapshot per object plus a scan at every flush. For read-only data you never intend to save, no-tracking skips all of that. The trade-off: those objects are detached and won't be written."
  }
]
```

---

[← Phase 3: The Identity Map & Unit of Work](03-identity-map-and-unit-of-work.md) · [Guide overview](_guide.md) · [Phase 5: Lazy Loading & the N+1 Trap →](05-lazy-loading-and-n-plus-1.md)
