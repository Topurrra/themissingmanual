---
title: "Lazy vs Eager Fetching & the N+1 Problem"
guide: "hibernate-and-jpa-from-zero"
phase: 6
summary: "How Hibernate decides when to load related data, why lazy loading throws LazyInitializationException, how the N+1 problem quietly turns one query into hundreds, and how JOIN FETCH, entity graphs, and batch fetching fix it."
tags: [hibernate, jpa, fetching, lazy-loading, eager-loading, n-plus-one, join-fetch, entity-graph]
difficulty: advanced
synonyms: ["hibernate n+1 problem", "jpa lazy vs eager fetching", "hibernate fetchtype lazy eager", "jpa join fetch", "hibernate entity graph", "LazyInitializationException", "hibernate fix n+1 queries"]
updated: 2026-06-22
---

# Lazy vs Eager Fetching & the N+1 Problem

You mapped the relationships in Phase 5: an `Author` has many `Book`s, a `Book` has many `Review`s. The
foreign keys are in place, the object graph navigates cleanly. So here's the question nobody asks until it's
too late: when you load one `Author`, **does Hibernate also load their books? Their books' reviews? The whole
tree?**

The answer to that question is the difference between an app that returns in 8 milliseconds and one that
returns in 8 seconds. This is the single most important performance lesson in the entire guide, and almost
every "Hibernate is slow" complaint on the internet traces back to getting it wrong without noticing. So
slow down here. We're going to make it visceral — you're going to *see* the flood of queries — because once
you've watched it happen, you'll never write a blind loop over a collection again.

## The mental model: a switch with two settings

📝 Every association in JPA has a **fetch strategy** — a setting that answers "when do you load this?" There
are exactly two settings:

- **EAGER** — load this association *immediately*, in the same breath as the parent. Load an `Author`, and
  their `Book`s come along for the ride whether you asked for them or not.
- **LAZY** — *don't* load it yet. Hibernate puts a stand-in object in the field — a **proxy** — and only runs
  the real query the moment you actually touch the data (call `getBooks()` and read it).

Think of it like ordering at a restaurant. EAGER is the waiter bringing the appetizer, main, dessert, and
coffee all at once before you've decided what you want. LAZY is bringing each course only when you ask for
it. Both can be wrong: EAGER hauls food you'll never eat; LAZY makes a separate trip to the kitchen for
every single item.

Here's the part that bites everyone, so commit it to memory. The **JPA defaults are not uniform**:

| Annotation | Default fetch |
|------------|---------------|
| `@ManyToOne` | **EAGER** |
| `@OneToOne` | **EAGER** |
| `@OneToMany` | LAZY |
| `@ManyToMany` | LAZY |

📝 The pattern: the *to-one* sides are eager by default, the *to-many* collections are lazy. This split is a
trap. Your `Book.author` (`@ManyToOne`) is silently eager — load 50 books and you may quietly load their
authors too, even on pages that never show the author.

⚠️ **Recommendation: make everything LAZY, then fetch what you need explicitly.** Eager-by-default is the
gift that keeps on taking — it loads data you didn't ask for, on code paths you forgot about, and you only
find out when production slows down. Turn the to-one defaults off:

```java
@Entity
public class Book {

    @ManyToOne(fetch = FetchType.LAZY)        // override the EAGER default
    @JoinColumn(name = "author_id")
    private Author author;

    @OneToMany(mappedBy = "book", fetch = FetchType.LAZY)   // already lazy, stated for clarity
    private List<Review> reviews = new ArrayList<>();
}
```

*What just happened:* we forced `Book.author` to LAZY, overriding JPA's eager default for `@ManyToOne`. Now
loading a `Book` loads exactly the `book` row — no surprise `SELECT` for the author tagging along. The
reviews were already lazy, but writing it out makes the intent obvious to the next person (and to you, six
months from now). The rule of thumb that will save you: **lazy everywhere, fetch deliberately.**

### A lazy collection is a proxy, not your data

When a collection is lazy, the field doesn't hold your `Book`s. It holds a Hibernate stand-in:

```java
EntityManager em = emf.createEntityManager();
Author author = em.find(Author.class, 1L);

System.out.println(author.getBooks().getClass().getName());
// org.hibernate.collection.spi.PersistentBag   ← not ArrayList!

author.getBooks().size();   // touching it NOW triggers the SELECT
```
```sql
select a.id, a.name from author a where a.id = 1
-- ...later, the moment you call size():
select b.id, b.title, b.author_id from book b where b.author_id = 1
```

*What just happened:* `find` ran *one* query for the author. The `books` field came back as a Hibernate
`PersistentBag` — a proxy that knows how to load the books but hasn't yet. Nothing hit the `book` table until
`size()` forced it. That second query is the proxy "waking up." Lazy isn't *if* you pay for the books — it's
*when*. And that timing is exactly what causes the next two problems.

## `LazyInitializationException`: the classic crash

📝 A lazy proxy can only wake up while its **persistence context is still open**. Remember from
[Phase 3](03-entitymanager-and-persistence-context.md): when the `EntityManager` closes, every entity it
loaded becomes **detached** — nobody's watching it, and there's no open context to run a query through. So if
you touch a lazy association *after* the context closed, the proxy has no way to load its data, and Hibernate
throws.

This is the most famous beginner crash in all of Hibernate. The shape is always the same — load in one
layer, touch in another:

```java
// --- service / repository layer: context opens and CLOSES here ---
public Author loadAuthor(Long id) {
    EntityManager em = emf.createEntityManager();
    Author author = em.find(Author.class, id);   // books NOT fetched (lazy)
    em.close();                                    // ← context closed; author is now DETACHED
    return author;
}

// --- controller / view layer: context is long gone ---
Author author = loadAuthor(1L);
for (Book book : author.getBooks()) {   // 💥 touching the lazy proxy now...
    System.out.println(book.getTitle());
}
```
```console
org.hibernate.LazyInitializationException: failed to lazily initialize a
collection of role: com.example.Author.books: could not initialize proxy - no Session
```

*What just happened:* `loadAuthor` opened a context, loaded the author *without* the books, then closed the
context — detaching the author. Back in the controller, `author.getBooks()` asks the lazy proxy to load, but
its context is gone. No open session, no query, no data — exception. 💡 The fix isn't "make it eager" (that
just trades this crash for the N+1 you're about to meet). The real fix is to **fetch the books while the
context is still open**, which is the whole rest of this phase. Tie this back to Phase 3's rule: *a detached
entity can't lazy-load.* This is that rule biting.

## The N+1 problem: the main event

This is the one. The performance killer that ships to production looking completely innocent. Watch closely.

You load all your authors — one clean query — and then loop over them to print each author's book count. The
collection is lazy, so each `getBooks()` call wakes up its proxy:

```java
List<Author> authors = em.createQuery("select a from Author a", Author.class)
                         .getResultList();           // query #1: load the authors

for (Author author : authors) {
    System.out.println(author.getName() + ": " + author.getBooks().size());
    //                                            ↑ each iteration triggers ANOTHER query
}
```

Looks harmless. It is a disaster. Here is the SQL Hibernate actually emits with, say, 100 authors:

```sql
select a.id, a.name from author a;                              -- the "1": one query for all authors

select b.id, b.title, b.author_id from book b where b.author_id = 1;    -- the "N" begins...
select b.id, b.title, b.author_id from book b where b.author_id = 2;
select b.id, b.title, b.author_id from book b where b.author_id = 3;
select b.id, b.title, b.author_id from book b where b.author_id = 4;
-- ... one more SELECT for every single author ...
select b.id, b.title, b.author_id from book b where b.author_id = 99;
select b.id, b.title, b.author_id from book b where b.author_id = 100;
```

*What just happened:* **1 query to load the authors, then N more — one per author — to load each one's
books.** That's `1 + N` queries. 100 authors = **101 queries**. A thousand authors = 1001. Every one is a
separate round trip to the database: network hop, parse, plan, execute, return. Individually they're fast;
multiplied by N they're a stampede. This is the **N+1 problem**, and it is the number-one reason ORMs get
blamed for being slow.

⚠️ The cruelty of N+1 is that it's *invisible in the code*. The Java reads like a normal loop. It works
perfectly with 3 authors in your test database. Then it meets 5,000 authors in production and falls over —
and nobody changed a line. The query count grows with your data, not with your code, so it sails through
code review and load-tests-you-didn't-run. You have to *watch the SQL* to even know it's there. Which is
exactly why the discipline at the end of this phase matters.

## Fixing it: load the tree in one query

The cure for N+1 is to tell Hibernate up front: *I'm going to need the books, so fetch them together.* You
have three tools.

### 1. `JOIN FETCH` — the workhorse

In JPQL, `join fetch` says "join to this association and load it into the result, in the same query":

```java
List<Author> authors = em.createQuery(
        "select distinct a from Author a join fetch a.books", Author.class)
        .getResultList();

for (Author author : authors) {
    System.out.println(author.getName() + ": " + author.getBooks().size());
    // no extra queries — the books are already loaded
}
```
```sql
select distinct a.id, a.name, b.id, b.title, b.author_id
from author a
join book b on b.author_id = a.id;
```

*What just happened:* **one query** now does the whole job. `join fetch a.books` told Hibernate to join
`author` to `book` and hydrate the `books` collection right there in the result set. The loop runs without
emitting a single extra `SELECT` — the books arrived with their authors. 101 queries collapsed to 1. The
`distinct` keyword de-duplicates authors in the Java result (a join repeats the author row once per book);
it's almost always what you want with a `join fetch` on a collection.

⚠️ **Two `JOIN FETCH` caveats that bite hard.** First: **`JOIN FETCH` a collection + pagination don't mix.**
If you add `setMaxResults`/`setFirstResult` to a query that fetches a collection, Hibernate can't apply the
limit in SQL (the join multiplied your rows), so it pulls *everything* into memory and paginates there —
quietly defeating the point and risking an OOM on a large table. Second: **you can't `JOIN FETCH` two
collections at once** (e.g. an author's books *and* each book's reviews in one query) — that's a cartesian
product, and Hibernate throws `MultipleBagFetchException`. Fetch one collection per query, or use batch
fetching (below) for the second.

### 2. `@EntityGraph` — the declarative alternative

If you'd rather not write JPQL — say you're using Spring Data repositories — an **entity graph** declares
which associations to fetch eagerly *for this one call*, without touching the entity's default mapping:

```java
@EntityGraph(attributePaths = "books")
List<Author> findAll();    // Spring Data: this findAll fetches books in one query
```

*What just happened:* `@EntityGraph(attributePaths = "books")` tells Hibernate "for this query, treat `books`
as eager — load it with the author." It produces the same single join query as `JOIN FETCH`, but you express
*what to load* declaratively instead of hand-writing the join. Same fix, different syntax — reach for
whichever fits your codebase. The key idea is identical: **the fetch decision belongs to the use-case, not
the mapping.**

### 3. Batch fetching — collapse N into a few

Sometimes you genuinely can't fetch up front — the books load lazily deep in some other code. Batch fetching
softens the blow: instead of one query *per* author, Hibernate loads the lazy collections in **batches**
using an `IN` clause.

```java
@Entity
public class Author {

    @OneToMany(mappedBy = "author")
    @BatchSize(size = 25)       // load up to 25 authors' books per query
    private List<Book> books = new ArrayList<>();
}
```
```sql
-- instead of 100 separate SELECTs, with batch size 25 you get 4:
select b.id, b.title, b.author_id from book b where b.author_id in (1,2,3, ... ,25);
select b.id, b.title, b.author_id from book b where b.author_id in (26,27, ... ,50);
select b.id, b.title, b.author_id from book b where b.author_id in (51,52, ... ,75);
select b.id, b.title, b.author_id from book b where b.author_id in (76,77, ... ,100);
```

*What just happened:* `@BatchSize(size = 25)` told Hibernate "when you have to wake up these lazy
collections, grab 25 at a time." The N+1's 100 follow-up queries became `ceil(100/25) = 4`. You can set this
globally with `hibernate.default_batch_fetch_size` instead of annotating each collection. 💡 Batch fetching
is the safety net for the lazy loads you can't restructure away — it won't beat a single `JOIN FETCH`, but
turning 101 queries into 5 is a massive win for one config line.

## The discipline: watch the SQL count

💡 Here's the throughline, and the habit that separates people who fight Hibernate from people who command
it: **default to lazy, fetch what each use-case needs explicitly, and always watch the number of queries you
emit.** N+1 doesn't announce itself. The only way to catch it is to *see* the SQL.

So make the SQL visible while you develop:

- Turn on `hibernate.show_sql=true` (and `format_sql=true`) and actually look at the console for a given
  page or endpoint. If one user action emits dozens of near-identical `SELECT`s, you've found an N+1.
- Better, add a **query counter** to your tests — a tool like Hibernate's `Statistics` or a library like
  datasource-proxy that asserts "this endpoint runs at most 3 queries." That turns N+1 from a thing you
  notice in prod into a test that fails in CI.

📝 The honest summary of this entire phase: **the #1 reason people say "Hibernate is slow" is really "N+1
that nobody noticed."** Hibernate isn't slow; a loop that secretly runs 500 queries is slow, and the ORM
just made it easy to write without seeing it. Counting your queries is how you stay on the fast side of that
line. (When a query you *did* write deliberately is the slow one, that's a different skill — measuring and
reading query plans — covered in [Why Is My Query Slow?](/guides/why-is-my-query-slow).)

## Recap

1. Every association has a **fetch strategy**: **EAGER** (load with the parent) or **LAZY** (load a proxy
   now, run the real query only when you touch it). JPA defaults: `@ManyToOne`/`@OneToOne` **EAGER**,
   `@OneToMany`/`@ManyToMany` LAZY.
2. ⚠️ Prefer **LAZY everywhere** and fetch explicitly per use-case — eager-by-default loads data you didn't
   ask for on code paths you forgot about.
3. **`LazyInitializationException`** happens when you touch a lazy association after the persistence context
   closed (the entity is detached). Fix it by fetching while the context is open — not by going eager.
4. The **N+1 problem**: load N parents in 1 query, then trigger 1 query per parent to load each one's lazy
   collection = `1 + N` queries. 100 authors → 101 queries. It's invisible in code and scales with your
   data, not your logic.
5. **Fixes:** `JOIN FETCH` (load the tree in one query), `@EntityGraph` (the declarative version), and
   `@BatchSize` / `hibernate.default_batch_fetch_size` (collapse N into a few `IN` queries). Mind the
   pagination and `MultipleBagFetchException` caveats with `JOIN FETCH`.
6. 💡 The discipline: **watch your query count.** Turn on `show_sql`, add a query counter to tests. Most
   "Hibernate is slow" is really an unnoticed N+1.

## Quick check

Lock in the one idea that wrecks more Hibernate apps than any other:

```quiz
[
  {
    "q": "You load 50 Authors with `select a from Author a`, then loop over them calling `author.getBooks().size()` on each (books is a LAZY @OneToMany). How many SQL queries does Hibernate run?",
    "choices": [
      "51 — one to load the authors, then one more per author to load each one's books (the N+1 problem)",
      "1 — Hibernate loads everything in a single query",
      "2 — one for authors, one for all books",
      "50 — one per author"
    ],
    "answer": 0,
    "explain": "This is the textbook N+1: 1 query for the authors, then N=50 lazy loads (one per author when you touch getBooks()) = 51 total. The loop looks innocent but each iteration wakes up a lazy proxy with its own SELECT."
  },
  {
    "q": "Your service loads an Author with `find` and closes the EntityManager, then a controller loops over `author.getBooks()` and crashes with LazyInitializationException. What's the correct fix?",
    "choices": [
      "Fetch the books while the context is still open (e.g. JOIN FETCH or an entity graph)",
      "Change the @OneToMany to FetchType.EAGER",
      "Catch the exception and ignore it",
      "Call em.close() later, in the controller"
    ],
    "answer": 0,
    "explain": "The crash happens because the author is detached (context closed) and a lazy proxy can't load with no open session. The right fix is to fetch the books deliberately while the context is open — via JOIN FETCH or @EntityGraph. Going EAGER 'fixes' the crash but reintroduces N+1 elsewhere and loads books even when you don't need them."
  },
  {
    "q": "Which statement about `JOIN FETCH` on a collection is a real caveat to watch out for?",
    "choices": [
      "Combining it with pagination (setMaxResults) forces Hibernate to paginate in memory, defeating the limit",
      "It always runs slower than lazy loading",
      "It can only be used with @ManyToOne, never collections",
      "It permanently changes the entity's default fetch type"
    ],
    "answer": 0,
    "explain": "JOIN FETCH on a collection plus setMaxResults can't apply the limit in SQL (the join multiplied the rows), so Hibernate loads everything and paginates in memory — slow and memory-risky. Separately, you can't JOIN FETCH two collections at once (MultipleBagFetchException). JOIN FETCH affects only the one query, not the mapping's default."
  }
]
```

---

[← Phase 5: Mapping Relationships](05-mapping-relationships.md) · [Guide overview](_guide.md) · [Phase 7: Querying: JPQL, Criteria & Native SQL →](07-querying-jpql-criteria.md)
