---
title: "The Identity Map & Unit of Work"
guide: "how-an-orm-works"
phase: 3
summary: "Inside the ORM session: how it keeps one in-memory object per row (the identity map) and batches every change into a single all-or-nothing commit (the unit of work)."
tags: [orm, database, identity-map, unit-of-work, session]
difficulty: advanced
synonyms: ["identity map", "unit of work", "orm session", "orm same object per row", "orm batch changes", "orm flush commit"]
updated: 2026-07-10
---

# The Identity Map & Unit of Work

Here's a thing that trips people up the first time they really look at ORM code: you load some objects, change a few fields, call `commit()` - and somehow the right SQL comes out, in the right order, all at once. No `UPDATE` written by you. No `INSERT` in the middle. Where did it come from?

The answer is the **session** - the workspace every ORM gives you for one chunk of business work. Hibernate calls it a `Session`, SQLAlchemy calls it a `Session`, EF Core calls it a `DbContext`, GORM hands you a `*gorm.DB`. Different names, same thing: a short-lived scratchpad, usually living for one web request, that holds your objects while you work.

> 📝 **Mental model:** the session is a workspace with two superpowers. First, an **identity map** - at most one in-memory object per database row, so you never end up holding two diverging copies of the same thing. Second, a **unit of work** - it watches everything you touch and writes it all out together in one commit. Hold those two ideas and the "magic" stops being magic.

This is the phase where the previous two click into place. You learned to [map objects to tables](02-mapping-objects-to-tables.md); now you'll see what the session does with those mapped objects while you work.

## Superpower one: the identity map

The rule is simple to state and surprisingly load-bearing: **within one session, each database row is represented by exactly one object in memory.** Load row id=5, then load it again - you get the *same instance* back, not a copy.

```text
session = open_session()

a = session.find(User, 5)
b = session.find(User, 5)

assert a is b   # TRUE - same object, not just equal values
```

*What just happened:* the first `find` hit the database, built a `User` object for row 5, and recorded it in the session's identity map keyed by `(User, 5)`. The second `find` looked in that map first, found row 5 already there, and handed back the *exact same object* - `a` and `b` aren't two equal users, they're one user with two names pointing at it.

That buys you two real things:

- **Consistency.** Because there's only one object for row 5, there's no way to end up with two copies that disagree. If you change `a.email`, then read `b.email`, you see the new value - they're the same object. Without an identity map, you could load the same row in two places, edit one, and silently lose track of which copy is "true."
- **A first-level cache.** The second `find` skipped the database entirely. Inside one session, repeated lookups of the same row are free. (This is *first-level* cache, scoped to the session - not a shared application-wide cache.)

> ⚠️ **The identity map does NOT cross sessions.** It's one-object-per-row *within a single session*, full stop. Open two sessions and ask each for row 5, and you get **two different objects** - one in each session's map. They can drift apart; changing one doesn't touch the other. If you've ever been surprised that "the same row" came back as unrelated objects, this is why: you crossed a session boundary.

## Superpower two: the unit of work

The identity map answers "which object is this row?" The **unit of work** answers "what did I change, and how do I save it?"

While you work inside a session, it quietly keeps a to-do list. Every object you create, every object you modify, every object you delete gets tracked. You don't write SQL as you go. You mutate objects. Then, at the boundary - when you `commit()` (or `flush()`) - the session takes its whole to-do list and writes it out **together**: the right statements, in a dependency-safe order, batched, inside **one database transaction**.

```text
session = open_session()

alice = session.find(User, 5)
bob   = session.find(User, 9)

alice.email   = "alice@new.example"   # tracked: UPDATE pending
bob.is_active = false                 # tracked: UPDATE pending
session.add(User(name="Carol"))       # tracked: INSERT pending

session.commit()
# --- only now does SQL run, all inside ONE transaction: ---
#   BEGIN
#   UPDATE users SET email='alice@new.example' WHERE id=5
#   UPDATE users SET is_active=false          WHERE id=9
#   INSERT INTO users (name) VALUES ('Carol')
#   COMMIT
```

*What just happened:* none of the three lines that changed data touched the database when you wrote them - they updated in-memory objects and added entries to the session's to-do list. The single `commit()` opened a transaction, emitted all three statements at once, and closed it. Because it's one transaction, it's **all-or-nothing**: if the `INSERT` fails, the two `UPDATE`s roll back too - nobody is left half-saved. (That guarantee is exactly atomicity from [Transactions & ACID](/guides/transactions-and-acid) - the unit of work leans directly on it.) Batching also lets the ORM order statements so foreign-key dependencies are satisfied - parent before child - instead of you hand-sequencing every write.

> 💡 **This is the answer to the opening puzzle.** ORM code reads as "load objects, mutate them, commit" with no SQL in the middle *because the session is accumulating a to-do list and running it at the boundary.* The gap between your edits and the SQL isn't missing code - it's the unit of work doing its job. Once you see the session as "collect changes now, flush them at commit," the control flow stops feeling like sleight of hand.

## ⚠️ Don't let the session live too long

Both superpowers depend on the session being **short-lived** - scoped to one unit of work, typically one web request. A session that hangs around is a slow-motion bug:

- **It leaks memory.** The identity map holds onto every object you've loaded. A session that lives for hours, loading thousands of rows, keeps thousands of objects pinned in memory - they can't be collected because the session still references them.
- **It goes stale.** The identity map keeps handing you the *cached* version of row 5 from whenever you first loaded it. If another process updated that row meanwhile, your long-lived session never notices - it's serving old data from its own map.

The discipline is the same across every ORM: **open a session, do one unit of business work, commit, dispose.** One per request is the standard shape. Resist keeping a single global session "to save the overhead" - you'll trade a tiny startup cost for memory leaks and stale reads that are miserable to debug.

## Recap

- The **session** (Hibernate `Session`, SQLAlchemy `Session`, EF Core `DbContext`, GORM's `*gorm.DB`) is a short-lived workspace for one unit of business work, usually one request.
- The **identity map** keeps at most one in-memory object per row within a session: loading the same row twice returns the *same instance*, giving you consistency (no diverging copies) and a first-level cache (the second load can skip the DB).
- ⚠️ Identity is **per session** - two different sessions each get their own object for the same row, and those objects can drift apart.
- The **unit of work** tracks every new, changed, and deleted object, then writes them all out together - batched, ordered, inside one transaction - when you commit or flush.
- That's why ORM code has "no SQL in the middle": the session collects changes and flushes them at the boundary, leaning on transactional atomicity ([Transactions & ACID](/guides/transactions-and-acid)) for all-or-nothing.
- ⚠️ Keep sessions short - one per unit of work. Long-lived sessions leak memory (the identity map pins objects) and serve stale data.

## Quick check

```quiz
[
  {
    "q": "Inside one session, you call session.find(User, 5) twice into variables a and b. What is true?",
    "choices": ["a and b are equal copies but different objects", "a is b - the same object instance", "the second call always re-queries the database", "b is null because 5 is already loaded"],
    "answer": 1,
    "explain": "The identity map keeps one object per row per session, so the second find returns the very same instance and can skip the database."
  },
  {
    "q": "You change two loaded objects and add a new one, then call commit(). When does the SQL run?",
    "choices": ["Each line runs its own SQL immediately as you write it", "All of it runs together in one transaction at commit", "Nothing runs until you call flush() separately", "The UPDATEs run immediately, the INSERT waits for commit"],
    "answer": 1,
    "explain": "The unit of work tracks the changes in memory and writes them out together, batched and in one transaction, at commit - that's why there's no SQL in the middle."
  },
  {
    "q": "Two separate sessions each load row id=5. What's the relationship between the two objects?",
    "choices": ["They are the same object - identity is global", "They are two different objects that can drift apart", "The second session's load fails because row 5 is locked", "They share one cache so changing one changes the other"],
    "answer": 1,
    "explain": "The identity map is per session. Across different sessions there is no shared identity, so each session has its own object for row 5 and they can diverge."
  }
]
```

---

[← Phase 2: Mapping Objects to Tables](02-mapping-objects-to-tables.md) · [Guide overview](_guide.md) · [Phase 4: Change Tracking & Dirty Checking →](04-change-tracking.md)
