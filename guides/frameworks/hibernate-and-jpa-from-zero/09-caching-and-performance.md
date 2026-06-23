---
title: "Caching & Performance"
guide: "hibernate-and-jpa-from-zero"
phase: 9
summary: "How Hibernate's two caches work, how to batch writes instead of dribbling out one INSERT at a time, why reading the emitted SQL is the real skill, and when to step around the ORM entirely."
tags: [hibernate, jpa, caching, first-level-cache, second-level-cache, performance, batching, query-cache]
difficulty: advanced
synonyms: ["hibernate caching explained", "hibernate first vs second level cache", "hibernate second level cache setup", "hibernate query cache", "hibernate batch insert", "hibernate performance tuning", "jpa performance best practices"]
updated: 2026-06-22
---

# Caching & Performance

Here's the thing nobody tells you when you pick up an ORM: it will happily make your app slow, and it
will do it quietly. Not with errors — with extra round-trips. A page that should fire two queries fires
two hundred, and everything still *works*, so nothing screams. Performance with Hibernate isn't about
clever tricks. It's about one habit — looking at the SQL it actually emits — plus a couple of levers
(caching, batching) and the wisdom to know when to put the ORM down.

The mental model for this whole phase: **Hibernate trades round-trips for memory, and it trades
convenience for control.** Caching keeps data in memory so you skip round-trips. Batching bundles
round-trips so you make fewer of them. And the convenience that hides SQL from you is exactly what you
have to switch off when speed matters. Hold those three ideas and the rest is detail.

## First-level cache — you already have it, and it's free

📝 You met this in [the persistence context phase](03-entitymanager-and-persistence-context.md), but it
belongs here too, because it's the cheapest performance win you'll ever get: the **persistence context
itself is a cache**. Within one transaction, asking for the same entity by id twice runs **one** query.
The second lookup comes straight from the workbench in memory.

```java
EntityManager em = emf.createEntityManager();

Author first  = em.find(Author.class, 1L);   // hits the database
Author second = em.find(Author.class, 1L);   // same id, same context

System.out.println(first == second);          // identity, not equality
```
```sql
select a.id, a.name from author a where a.id = 1
```
```console
true
```
*What just happened:* Two `find` calls, **one** `SELECT`. The first ran the query and parked the
`Author` on the workbench; the second found it already there and handed back the *same instance*. This is
the **first-level cache**, and it's always on, scoped to a single transaction, and impossible to turn
off. Its whole reach is one persistence context — open a new `EntityManager` and the next `find` hits the
database again.

> 💡 **Key point.** The first-level cache is free and automatic, but its lifespan is one transaction.
> Don't reach for anything fancier until you've confirmed you actually need cross-transaction caching —
> most apps don't.

## Second-level cache — optional, shared, and dangerous if you're careless

📝 The **second-level cache (L2)** is a separate, *opt-in* cache that lives **across** transactions and
sessions, shared by the whole application (and configured per entity type). Where the first-level cache
forgets everything at `commit`, the L2 cache holds onto entity data so the *next* transaction's `find`
can skip the database entirely.

Hibernate doesn't store the cache itself — it delegates to a provider you plug in: **EhCache**,
**Caffeine**, **Hazelcast**, **Infinispan**. You enable it, point Hibernate at a provider, and mark which
entities are cacheable:

```java
@Entity
@Cacheable
@org.hibernate.annotations.Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
public class Author {
    @Id @GeneratedValue
    private Long id;
    private String name;
    // ...
}
```
```sql
-- First transaction, first request ever:
select a.id, a.name from author a where a.id = 1
-- Second transaction, brand-new EntityManager, same id:
-- (no SQL — served from the second-level cache)
```
*What just happened:* `@Cacheable` opts `Author` into the L2 cache; the `@Cache` annotation tells
Hibernate the concurrency strategy (`READ_WRITE` is the safe default for data that changes occasionally).
The first time *anyone* loads author `1`, Hibernate runs the `SELECT` and stashes the row's data in the
shared cache. A later transaction — a different `EntityManager`, a different web request — asks for the
same id and gets it with **no query at all**. That's the payoff: read-mostly reference data served from
memory across the whole app.

⚠️ Now the catch, and it's a big one. **Cache invalidation is one of the genuinely hard problems in
computing**, and the second-level cache hands it to you. The moment data lives in two places — the
database and the cache — they can disagree:

- **Staleness.** If a row changes *outside* Hibernate (a raw SQL update, another service, a DBA fixing
  data by hand), the cache doesn't know. It keeps serving the old value until it expires.
- **Clustering.** Run several app instances and each has its own cache. Instance A updates an author;
  instance B's cache still holds the old one until they're wired to talk to each other (distributed
  caches like Hazelcast/Infinispan exist for exactly this, and they add real complexity).
- **Volatile data.** Caching a row that changes every few seconds buys you almost nothing and risks
  serving stale data constantly. The cost of invalidation swamps the benefit.

> ⚠️ **The rule.** Cache **read-mostly reference data** — country lists, product categories, config that
> changes daily not hourly. Never cache volatile, frequently-written data. And before you enable L2 at
> all, prove with the SQL count (below) that repeated reads are actually your bottleneck. A cache you
> didn't need is just a stale-data bug waiting to happen.

### The query cache — a sharper edge still

📝 There's a cousin: the **query cache**, which caches the *result of a query* (specifically, the list of
entity ids a query returned) rather than entities by primary key. It only helps if you run the *exact
same query with the exact same parameters* repeatedly. ⚠️ It's notoriously finicky: it needs the L2 cache
turned on to be useful, it gets invalidated whenever *any* row of *any* touched table changes (so a
frequently-written table makes it nearly worthless), and a naive setup can end up *slower* than no cache
at all. Treat it as a specialist tool for a measured, repeated, read-only query — not a default.

## Batching writes — stop dribbling out one INSERT at a time

⚠️ Here's a slow path you'll write without noticing. Loop over a thousand new `Review` objects, `persist`
each one, commit:

```java
em.getTransaction().begin();
for (int i = 0; i < 1000; i++) {
    Review r = new Review("Review #" + i, 5, book);
    em.persist(r);
}
em.getTransaction().commit();
```
```sql
insert into review (book_id, rating, text, id) values (1, 5, 'Review #0', 1)
insert into review (book_id, rating, text, id) values (1, 5, 'Review #1', 2)
insert into review (book_id, rating, text, id) values (1, 5, 'Review #2', 3)
-- ... 997 more, one statement per round-trip ...
```
*What just happened:* a thousand separate `INSERT` statements, each its own network round-trip to the
database. The compute is trivial; the *latency* is the killer — a millisecond per round-trip is a full
second of nothing but waiting. The database could swallow these in one gulp, but Hibernate is sending
them one spoonful at a time.

The fix is **JDBC batching**: tell Hibernate to bundle statements and send them in groups. One config
property turns it on:

```java
// persistence.xml / application.properties
hibernate.jdbc.batch_size = 50
// helps the batch stay tight when inserts/updates interleave:
hibernate.order_inserts = true
hibernate.order_updates = true
```

⚠️ But there's a second half nobody mentions: the **persistence context keeps growing**. Every `persist`
adds an entity to the workbench, and Hibernate tracks all of them for dirty checking. Insert a million
rows in one context and you'll run the JVM out of memory long before you finish. So in big loops you
**flush and clear** periodically:

```java
em.getTransaction().begin();
for (int i = 0; i < 1000; i++) {
    Review r = new Review("Review #" + i, 5, book);
    em.persist(r);
    if (i % 50 == 0) {     // every batch_size rows
        em.flush();        // push this batch's INSERTs to the DB
        em.clear();        // empty the workbench so memory stays flat
    }
}
em.getTransaction().commit();
```
```sql
-- batched: roughly 1000 / 50 = 20 round-trips instead of 1000
insert into review (book_id, rating, text, id) values (1, 5, 'Review #0', 1), (1, 5, 'Review #1', 2), ... (50 rows)
insert into review (book_id, rating, text, id) values (1, 5, 'Review #50', 51), ... (50 more)
-- ... ~18 more batches ...
```
*What just happened:* with `batch_size = 50`, Hibernate accumulates 50 inserts and ships them as one
round-trip — turning ~1000 trips into ~20. The `flush()` sends the pending batch and the `clear()` empties
the persistence context so it doesn't balloon. One caution worth planting: this works cleanly with a
manually-assigned or sequence id; the old `GenerationType.IDENTITY` strategy forces Hibernate to insert
rows one at a time to read back each auto-increment id, which **silently disables batching** — another
reason to prefer sequence-based ids for bulk work.

## Reading the SQL is the real skill

💡 This is the throughline of the entire guide, so let it land: an ORM's job is to hide SQL, and your job
is to **un-hide it when it matters**. Every performance problem in this phase — N+1, accidental eager
loads, missing indexes, un-batched writes — is invisible until you look at the queries Hibernate emits.
Once you *can* see them, the problems become obvious. So make them visible.

```java
// the blunt instrument — log every statement (dev only):
hibernate.show_sql = true
hibernate.format_sql = true

// the better instrument — counts, not noise:
hibernate.generate_statistics = true
```
```console
Session Metrics {
    1247 jdbc statements executed   <-- this number is the whole game
}
```
*What just happened:* `show_sql` dumps every statement to the log — fine for eyeballing a single request,
useless once volume is high. The real tool is **statistics**: it tells you *how many* statements one
operation fired. That single count is your performance dashboard. Render a page, glance at the count: 3
queries? Healthy. 300? You just found your N+1 — entities loaded one-by-one, each triggering its own
`SELECT`, exactly the trap covered in the fetching phase. The count doesn't lie and it doesn't theorize.

> 💡 **Make this a habit, not a fire drill.** Watch the query count during normal development, not only
> when something's already on fire. An N+1 caught the day you write the loop is a one-line `JOIN FETCH`;
> the same N+1 found in production three months later is an incident.

When the count is high and the *why* isn't obvious, that's where deeper diagnosis comes in — reading
query plans, checking indexes, profiling the slow statement itself. Those skills live in their own
guides: [Why Is My Query Slow?](/guides/why-is-my-query-slow) for hunting down the expensive query and
the missing index behind it, and [Profiling 101](/guides/profiling-101) for measuring where time
actually goes instead of guessing.

## When the ORM is the wrong tool

⚠️ Hibernate is built for one thing brilliantly: loading objects, letting you change them, and saving
them back — the object-graph, domain-logic, CRUD world. There are jobs where forcing that shape on the
problem makes it slower *and* uglier. Recognize them and step around the ORM on purpose.

**Bulk updates and deletes.** You need to mark every review older than a year as archived. The ORM-shaped
instinct — load them all, set a flag on each, save — drags thousands of rows into memory and dirty-checks
every one. Don't. Issue a single bulk statement:

```java
// load-then-save loop: thousands of SELECTs + UPDATEs, huge memory footprint
// DON'T do this for bulk changes.

// JPQL bulk update — one statement, runs in the database, touches no workbench:
int updated = em.createQuery(
        "update Review r set r.archived = true where r.createdAt < :cutoff")
    .setParameter("cutoff", oneYearAgo)
    .executeUpdate();
```
```sql
update review set archived = true where created_at < '2025-06-22'
```
*What just happened:* the JPQL `update`/`delete` runs **directly in the database** as one statement — no
entities loaded, no dirty checking, no memory bloat. The one trade-off to know: bulk operations bypass
the persistence context, so any entities already on your workbench won't reflect the change. Run bulk ops
in their own transaction (or `clear()` afterward) and you're fine.

**Heavy reporting and analytics.** "Total revenue per author per quarter" is not an object-graph problem;
it's aggregation. Mapping it through entities is wasteful. Drop to a **projection** (select only the
columns you need into a DTO) or raw SQL:

```java
List<AuthorSales> rows = em.createQuery(
        "select new com.example.AuthorSales(a.name, sum(b.price)) " +
        "from Author a join a.books b group by a.name", AuthorSales.class)
    .getResultList();
```
*What just happened:* instead of loading full `Author` and `Book` entities only to add up a number, the
query selects exactly two values straight into a lightweight DTO. The database does the grouping; you
move a handful of columns instead of whole object graphs. For genuinely complex reports, plain native SQL
through `createNativeQuery` is often the clearest, fastest choice — and that's not a failure of the ORM,
it's using the right tool.

💡 The honest framing: use Hibernate for the **95%** — CRUD, domain logic, the everyday loading and
saving of objects, where its convenience is a genuine gift. Drop to SQL for the **5%** — bulk operations,
analytics, the rare white-hot path — where that convenience costs more than it's worth. Don't fight the
ORM, and don't worship it. Know which 5% you're in, and step around it without guilt.

## Recap

1. The **first-level cache** is the persistence context: free, always on, one transaction wide. Same id
   twice → one query. It's your cheapest win and you already have it.
2. The **second-level cache** is optional, shared across transactions, backed by a provider
   (EhCache/Caffeine/Hazelcast), and opted into per entity with `@Cacheable`. Great for **read-mostly
   reference data**.
3. ⚠️ L2's price is **invalidation**: stale data on out-of-band writes, divergence across clustered
   instances, and near-zero value on volatile rows. Never cache frequently-written data; prove the need
   with SQL counts first. The **query cache** is sharper still — a specialist tool, not a default.
4. **Batch writes** with `hibernate.jdbc.batch_size`, and **flush + clear** periodically in big loops so
   the persistence context doesn't run you out of memory. (`IDENTITY` ids silently disable batching.)
5. 💡 **Reading the emitted SQL is the real skill.** Turn on `generate_statistics`, watch the query
   count, and N+1, accidental eager loads, and missing indexes stop hiding. Make it a daily habit, not a
   fire drill.
6. ⚠️ Step around the ORM for the 5% it's wrong for: **bulk `update`/`delete` JPQL**, **projections/raw
   SQL for reporting**, and very hot paths. Use Hibernate for the 95% it's brilliant at.

## Quick check

Three ideas that decide whether your Hibernate app is fast or quietly slow:

```quiz
[
  {
    "q": "You enable the second-level cache on an Author entity that's read constantly but updated by a nightly batch job running raw SQL outside Hibernate. What's the main risk?",
    "choices": [
      "Stale data — Hibernate doesn't see the out-of-band SQL update, so the cache keeps serving the old author until it expires",
      "Nothing — the second-level cache automatically detects all database changes",
      "The first-level cache will conflict with the second-level cache and throw an exception",
      "Reads will become slower because every read now checks two caches"
    ],
    "answer": 0,
    "explain": "The L2 cache only knows about changes made through Hibernate. A raw SQL update (another job, a DBA, another service) bypasses it, so the cache holds stale data until it expires. Read-mostly data changed out-of-band is exactly where invalidation bites."
  },
  {
    "q": "You're inserting 100,000 Review rows in a loop, persisting each. You set hibernate.jdbc.batch_size=50 but the loop still runs out of memory. What did you forget?",
    "choices": [
      "To flush() and clear() the persistence context periodically — every persisted entity stays on the workbench for dirty checking, so the context grows without bound",
      "To set batch_size higher; 50 is too small to matter",
      "To wrap the loop in a transaction",
      "To enable the second-level cache, which would hold the entities instead"
    ],
    "answer": 0,
    "explain": "batch_size controls how many statements are bundled per round-trip, but every persisted entity still lives in the persistence context. Without periodic flush() + clear(), the context keeps growing and exhausts memory. Both halves are needed for bulk inserts."
  },
  {
    "q": "A page that should be fast is slow. You turn on hibernate.generate_statistics and see one request fired 312 JDBC statements. What's the most likely cause and the right next move?",
    "choices": [
      "An N+1 problem — a collection or association is being loaded one row at a time; fix it with a JOIN FETCH or entity graph, found by reading the query count",
      "The database is missing RAM; restart it",
      "Hibernate is broken; switch to raw JDBC for the whole app",
      "The second-level cache is too small; increase its size"
    ],
    "answer": 0,
    "explain": "Hundreds of statements for one logical operation is the classic N+1 signature: entities loaded individually, each firing its own SELECT. The statistics count is what makes it visible, and the fix is to fetch the association in one query (JOIN FETCH / entity graph)."
  }
]
```

---

[← Phase 8: Inheritance & Embeddables](08-inheritance-and-embeddables.md) · [Guide overview](_guide.md) · [Phase 10: Hibernate in the Real World & Where to Go Next →](10-where-to-go-next.md)
