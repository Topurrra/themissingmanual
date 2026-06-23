---
title: "Transactions & the Unit of Work"
guide: "hibernate-and-jpa-from-zero"
phase: 4
summary: "Why changing a field updates the row with no save call: transactions scope the persistence context, dirty checking diffs your managed objects, and flush sends the SQL — commit makes it stick."
tags: [hibernate, jpa, transactions, dirty-checking, flush, unit-of-work, commit, rollback]
difficulty: intermediate
synonyms: ["jpa transactions explained", "hibernate dirty checking", "hibernate flush commit", "jpa unit of work", "hibernate automatic update no save", "hibernate transaction rollback", "jpa flush modes"]
updated: 2026-06-22
---

# Transactions & the Unit of Work

In [Phase 3](03-entitymanager-and-persistence-context.md) you met the persistence context — the in-memory workspace where the `EntityManager` keeps your managed entities, the identity map that guarantees one object per row, and the four states an entity can live in. That phase answered "where do my objects live while Hibernate is looking after them?" This phase answers the question everyone asks next, usually in a panic: *"I changed a field and never called `save` — why did the database update?"*

Before any code, here's the whole phase in one sentence — paste it on your monitor:

> **You work inside a transaction; Hibernate watches the managed objects in the persistence context, and at the right moment it figures out the SQL and sends it as one batch.**

Everything below is that sentence unpacked. The "magic" save isn't magic — it's the persistence context from Phase 3 doing exactly the job it was built for. Once you see the mechanism, Hibernate stops surprising you and starts being predictable, which is the entire point of learning it directly.

Keep `show_sql` on, as the guide overview insists — this phase is *all* about connecting the Java you write to the SQL Hibernate emits, and you can only see the timing if Hibernate prints it.

## Everything happens in a transaction

📝 **A transaction** is a bracket around a group of database changes that either all happen or none do. You met the full story in [Transactions & ACID](/guides/transactions-and-acid) — atomicity, consistency, isolation, durability. JPA leans on that idea completely: essentially all your persistence work runs *inside* a transaction, and the persistence context itself is scoped to one. Open a transaction, do your work, commit. If anything goes wrong, roll back and it's as if none of it happened.

The raw JPA shape is three calls bracketing your work:

```java
EntityManager em = emf.createEntityManager();
EntityTransaction tx = em.getTransaction();
try {
    tx.begin();                          // open the bracket

    Author author = new Author("Ursula K. Le Guin");
    em.persist(author);                  // now managed

    tx.commit();                         // close it — changes become permanent
} catch (RuntimeException e) {
    if (tx.isActive()) tx.rollback();    // something broke — undo everything
    throw e;
} finally {
    em.close();
}
```
*What just happened:* `tx.begin()` opened a database transaction and the persistence context that rides along with it. We created an `Author` and called `persist`, which made it *managed* (Phase 3's term) — but note, no `INSERT` has run yet. `tx.commit()` is the moment Hibernate flushes the pending work to the database and the transaction makes it durable. The `try/catch/finally` is the same disciplined shape you saw in [Java's try-with-resources phase](/guides/java-from-zero) — on any failure we roll back so we never leave a half-finished change behind, and we always `close()` the `EntityManager`.

💡 You will rarely type those three lines in real life. In a Spring application you annotate a method with `@Transactional` and Spring writes the `begin`/`commit`/`rollback` for you — opening the transaction before your method runs, committing if it returns normally, rolling back if it throws. That's the same machinery you see above, hidden one layer down. We show the raw version so that when Spring's annotation does something surprising, you know exactly what it's doing on your behalf.

## The unit of work

Here's the mental shift that makes Hibernate click. A naive ORM might send one SQL statement every time you touch an object: set a field, fire an `UPDATE`; add to a list, fire an `INSERT`. Hibernate deliberately does *not* work that way.

📝 **The unit of work** is Hibernate's core operating model: across one transaction it *collects* all your intended changes in the persistence context and writes them to the database as a single coordinated batch at the right moment — not one statement per method call. You don't issue SQL. You change managed objects in memory — set a title, add a review, delete a book — and Hibernate works out the minimal set of `INSERT`, `UPDATE`, and `DELETE` statements needed to make the database match what you did, then sends them together.

This is why "I never called `save`" is the wrong question. You're not telling Hibernate *which statement* to run; you're telling it *what the world should look like*, and it reverse-engineers the SQL. Two consequences fall straight out of this and define the rest of the phase: Hibernate must somehow *detect* what you changed (dirty checking), and it must pick a *moment* to send the SQL (flush).

## Dirty checking — the "magic" save

This is the one that trips up every newcomer, so let's hit it head-on.

📝 **Dirty checking** is Hibernate noticing, all by itself, that a managed entity's fields have changed since you loaded it — and issuing an `UPDATE` to match, *with no `save`, `merge`, or `persist` call from you*. A "dirty" object is one whose current state differs from what was loaded.

Watch it happen. We load a `Book`, change one field, and commit:

```java
tx.begin();

Book book = em.find(Book.class, 1L);   // SELECT runs; book is now managed
book.setTitle("A Wizard of Earthsea (Revised)");   // just a setter — no em call

tx.commit();   // <-- an UPDATE appears here, out of nowhere
```
```sql
select b.id, b.title, b.author_id from book b where b.id=?
update book set title=?, author_id=? where id=?
```
*What just happened:* `em.find` ran the `SELECT` and handed back a *managed* `Book`. We called an ordinary Java setter — no `EntityManager` method anywhere near it. Yet at `tx.commit()` Hibernate emitted an `UPDATE`. It noticed the title differed from what it had loaded and synced the database to match. There is genuinely no `save` call because there is no `save` method in JPA's vocabulary at all — managed objects update themselves. (`em.persist` is for brand-new entities; `em.merge` is for *detached* ones, which we'll get to.)

So *why* does this work? Here's the mechanism, and it's pleasingly mundane. 💡 When Hibernate loads an entity into the persistence context, it keeps a private **snapshot** of every field value at load time. At flush, it walks each managed entity and compares the current field values against that snapshot, field by field. Any entity whose values drifted is dirty, and Hibernate generates an `UPDATE` for exactly the changed columns (or all of them, depending on configuration). No change, no snapshot mismatch, no SQL:

```java
tx.begin();

Book book = em.find(Book.class, 1L);   // loaded; snapshot taken
String title = book.getTitle();        // only reading — no field changed

tx.commit();   // no UPDATE — nothing differs from the snapshot
```
```sql
select b.id, b.title, b.author_id from book b where b.id=?
```
*What just happened:* Same `find`, same managed entity, but this time we only *read* a field. At commit the snapshot still matches the live object, so dirty checking finds nothing dirty and emits no `UPDATE`. This is the flip side of the magic: Hibernate won't write what didn't change, so an accidental no-op transaction costs you only the `SELECT`. The snapshot is the persistence context (Phase 3) earning its keep — the identity map gives you one object per row, and the snapshot beside it is how Hibernate knows when that object has drifted from the database.

⚠️ One trap that follows directly: dirty checking only works on **managed** entities. A `Book` you `new`ed up yourself but never loaded or `persist`ed is *transient* — Hibernate has no snapshot of it and no idea it exists, so changing its fields does nothing. The magic is a property of the persistence context, not of the object.

## Flush — sending the SQL vs making it permanent

We've said "at commit, the SQL appears." The precise term for that send is **flush**, and pulling it apart from **commit** clears up a whole category of confusion.

📝 **Flush** is the act of synchronizing the persistence context's pending changes *to the database* — translating your in-memory dirty objects into the actual `INSERT`/`UPDATE`/`DELETE` statements and sending them over the connection. Crucially, flush happens *inside* the transaction; the statements are now visible to your own session but not yet permanent.

⚠️ **Flush is not commit.** This is the distinction to nail:

- **Flush** sends the SQL within the current transaction. The database has executed your statements, but they're still inside the open transaction and can still be rolled back.
- **Commit** ends the transaction and makes everything durable and visible to *other* sessions. (Commit always flushes first — you can't commit changes you haven't sent.)

Think of flush as "push my changes to the database's working memory" and commit as "and now make them official."

You almost never call `flush()` yourself, because Hibernate flushes automatically at two moments: **at commit** (so nothing is lost), and **before a query runs** (so your query sees your own pending changes). That second one is the order-of-operations gotcha worth seeing:

```java
tx.begin();

Book book = em.find(Book.class, 1L);
book.setTitle("New Title");        // dirty in memory; no SQL sent yet

// This query forces a flush FIRST, so it doesn't read stale data
List<Book> hits = em.createQuery(
        "select b from Book b where b.title = 'New Title'", Book.class)
    .getResultList();

tx.commit();
```
```sql
select b.id, b.title, b.author_id from book b where b.id=?
update book set title=?, author_id=? where id=?     -- auto-flush before the query
select b.id, b.title, b.author_id from book b where b.title='New Title'
```
*What just happened:* We made the `Book` dirty in memory, then ran a JPQL query searching for the *new* title. Hibernate knows the query hits the `book` table and that you have a pending change to a `book`, so it auto-flushed the `UPDATE` *before* running the `SELECT` — otherwise the query would have read the old title from the database and missed your own change. The order in the SQL log tells the story: the `UPDATE` jumps ahead of the query. This is Hibernate keeping its promise that your queries see a consistent picture including your uncommitted work.

💡 You *can* force a flush early with `em.flush()` — useful when you need a database-generated ID immediately, or want a constraint violation to surface now rather than at commit. But reach for it rarely; trust the automatic flush points unless you have a concrete reason not to.

## Rollback, detachment, and the rule that saves you

The other half of "all or nothing" is rollback. If anything throws and you call `tx.rollback()`, the transaction unwinds: every `INSERT`, `UPDATE`, and `DELETE` it sent is undone, and the database is exactly as it was before `begin()`. The flushed SQL never becomes permanent — that's the whole power of flush-before-commit. Nothing you did inside that transaction survives.

But there's a subtler consequence, and it's the source of a classic bug. When the transaction ends and the `EntityManager` closes, every entity that was managed becomes **detached** (Phase 3's fourth state). A detached entity is a perfectly normal Java object holding data — but Hibernate is no longer watching it. There's no snapshot, no persistence context, no dirty checking. It's just a POJO now.

⚠️ Here's the bug everyone writes once. You load an entity, the transaction closes, and *then* you change a field, expecting the database to update because "dirty checking does that." It doesn't — the entity is detached, and your setter mutates an object Hibernate has forgotten:

```java
Book book;

tx.begin();
book = em.find(Book.class, 1L);   // managed
tx.commit();                      // transaction ends -> book is now DETACHED
em.close();

book.setTitle("This change goes nowhere");   // mutating a detached object
// No transaction, no persistence context, no dirty checking. The DB never hears about it.
```
*What just happened:* The `find` and the load happened inside the transaction, but the moment we committed and closed, `book` detached. The setter ran fine — it's just Java — but there was no managed context to notice the change and no transaction to flush it into. The title in the database is untouched. To actually persist a change to a detached entity you'd have to re-attach it (`em.merge(book)` inside a fresh transaction), which is a different, heavier operation than the effortless dirty checking you get on managed objects.

💡 The rule that prevents this entire class of bug, and the one habit to carry out of this phase: **load, modify, and commit all inside one transaction.** Open the transaction, `find` the entity (now managed), change its fields, commit — and let dirty checking do the rest while the object is still being watched. Spring's `@Transactional` makes this natural by wrapping a whole service method in one transaction, so your load and your mutations stay safely on the managed side of the line.

## Recap

1. **Everything runs in a transaction** — `begin`/`commit`/`rollback` bracket your work, and the persistence context is scoped to it. Spring's `@Transactional` writes those calls for you; ACID is the foundation underneath ([Transactions & ACID](/guides/transactions-and-acid)).
2. **Hibernate works as a unit of work** — you change managed objects in memory describing what the world should look like; Hibernate figures out the minimal `INSERT`/`UPDATE`/`DELETE` batch and sends it at the right moment, not one statement per call.
3. **Dirty checking is the "magic" save** — change a field on a *managed* entity and Hibernate emits an `UPDATE` at flush with no `save`/`merge`/`persist`, because it snapshots loaded state and diffs against it. JPA has no `save` method; managed objects update themselves.
4. **Flush ≠ commit** — flush sends the SQL *within* the transaction (auto-fired at commit and before queries); commit makes it permanent and visible to others. Use `em.flush()` only when you need IDs or errors early.
5. **Rollback undoes everything; closing detaches** — after the transaction/context ends, entities are detached and no longer dirty-checked. Mutating a detached object silently does nothing.
6. **The rule:** load → modify → commit, all inside one transaction, so your changes happen while the entity is still managed.

With the persistence context, the unit of work, and dirty checking in hand, you understand the engine room. Next we start connecting entities to each other — and that's where the SQL gets genuinely interesting.

## Quick check

Make sure the one idea that defines this phase stuck — why a field change becomes an `UPDATE` with no `save` call:

```quiz
[
  {
    "q": "You load a Book with em.find inside a transaction, call book.setTitle(\"New\"), and commit — never calling save, merge, or persist. What happens?",
    "choices": [
      "Hibernate detects the changed field via dirty checking and issues an UPDATE at commit",
      "Nothing — without a save call the change stays only in memory",
      "It throws an exception because you must call persist to write changes",
      "The change is written immediately when setTitle runs, before commit"
    ],
    "answer": 0,
    "explain": "The Book is managed, so Hibernate kept a snapshot at load time. At flush (which commit triggers) it diffs the live object against the snapshot, sees the title changed, and emits an UPDATE. There's no save method in JPA — managed entities update themselves."
  },
  {
    "q": "What's the difference between a flush and a commit?",
    "choices": [
      "Flush sends the pending SQL within the transaction; commit ends the transaction and makes the changes permanent",
      "They're the same thing — flush is just an older name for commit",
      "Flush makes changes permanent; commit only sends them to the database's cache",
      "Flush rolls back changes, while commit saves them"
    ],
    "answer": 0,
    "explain": "Flush translates your dirty in-memory objects into SQL and sends it inside the open transaction (it can still be rolled back). Commit ends the transaction, making everything durable and visible to other sessions. Commit always flushes first, but a flush alone is not permanent."
  },
  {
    "q": "After tx.commit() and em.close(), you call book.setTitle(\"Changed\"). Why doesn't the database update?",
    "choices": [
      "Once the transaction and EntityManager close, the entity is detached — no persistence context is watching it, so dirty checking doesn't apply",
      "The setter silently failed because the object is now read-only",
      "It does update — dirty checking works on any entity at any time",
      "Hibernate batches the change and applies it on the next find call"
    ],
    "answer": 0,
    "explain": "Closing the transaction/EntityManager detaches the entity. A detached entity is an ordinary Java object with no snapshot and no managing context, so the setter just mutates memory. The rule that avoids this: load, modify, and commit all inside one transaction."
  }
]
```

---

[← Phase 3: The EntityManager & Persistence Context](03-entitymanager-and-persistence-context.md) · [Guide overview](_guide.md) · [Phase 5: Mapping Relationships →](05-mapping-relationships.md)
