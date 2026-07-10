---
title: "Querying: JPQL, Criteria & Native SQL"
guide: "hibernate-and-jpa-from-zero"
phase: 7
summary: "How JPA gives you three layers of querying — JPQL for everyday object queries, the Criteria API for dynamic ones, and native SQL as the escape hatch — plus parameters, joins, and DTO projections."
tags: [hibernate, jpa, jpql, criteria-api, native-query, projections, parameters, querying]
difficulty: intermediate
synonyms: ["jpql tutorial", "jpa criteria api", "hibernate native sql query", "jpa query parameters", "jpa projection dto query", "jpql vs sql", "hibernate typed query"]
updated: 2026-07-10
---

# Querying: JPQL, Criteria & Native SQL

Up to now you've mostly found things by their id — `em.find(Book.class, 1L)`. That's fine when you already know exactly which row you want. But real applications ask open-ended questions: "all books by this author," "the five most-reviewed titles," "every book missing an ISBN." For those you need to *query*, and JPA hands you three tools for the job.

The mental model to carry through this whole phase: **JPA queries are layered, and you reach down a layer only when the one above can't reach.** JPQL covers the vast majority of what you'll write. The Criteria API exists for queries you have to *build* in code, piece by piece. Native SQL is the trapdoor for when you need something only your specific database can do. Same data, same entities — three levels of control, each more powerful and more verbose than the last.

We'll use the `Author`, `Book`, `Review` domain from [Phase 5](05-mapping-relationships.md): an author writes many books, a book collects many reviews.

## JPQL — query objects, not tables

📝 **JPQL** (Java Persistence Query Language) looks almost exactly like SQL, but with one profound difference: **it operates on your entities and their fields, not on tables and columns.** You write `Book`, not `books`. You write `b.author.name`, walking the object reference, not `JOIN author ON ...`. Hibernate reads your JPQL, looks at your entity mappings, and translates it into the real SQL for your database.

Here's "every book written by a given author":

```java
String jpql = "select b from Book b where b.author.name = :name";
List<Book> books = em.createQuery(jpql, Book.class)
                     .setParameter("name", "Ursula K. Le Guin")
                     .getResultList();
```

*What just happened:* `select b from Book b` says "give me `Book` entities, calling each one `b`." The `where b.author.name = :name` walks from a book *through its `author` reference* to the author's `name` field — no explicit join written, even though one is clearly needed. `createQuery(jpql, Book.class)` returns the books as fully-formed `Book` objects, ready to use.

Notice what you did *not* write: no table names, no `author_id`, no join condition. You described the question in terms of your objects, and Hibernate turned it into this:

```sql
select b.id, b.title, b.isbn_13, b.published_year, b.author_id
from book b
join author a on b.author_id = a.id
where a.name = ?
```

*What just happened:* Hibernate inferred the join from `b.author.name`. It knew, from your `@ManyToOne` mapping, that reaching `author.name` requires joining `book` to `author` on the foreign key — so it generated the `JOIN` for you. This is the whole point of JPQL: you think in objects, Hibernate writes the SQL.

💡 If you've never written raw SQL joins, the companion guide [SQL Joins, Finally Explained](/guides/sql-joins-explained) shows what Hibernate is doing under the hood here. JPQL hides the join, but the join is still happening — and understanding it is what lets you predict the SQL your queries generate (and why the next phase's N+1 problem bites).

## Parameters — and why you must use them

You saw `:name` above. That's a **named parameter** — a placeholder you fill in with `setParameter`. It is not a convenience. It is the single most important security habit in this entire guide.

⚠️ **Never, ever build a query by gluing user input into the string.** This looks innocent and is a gaping security hole:

```java
// DANGER — never do this
String userInput = request.getParameter("name");
String jpql = "select b from Book b where b.author.name = '" + userInput + "'";
List<Book> books = em.createQuery(jpql, Book.class).getResultList();
```

*What just happened:* you concatenated raw user input straight into the query text. If someone submits `' or '1'='1`, your `where` clause becomes always-true and leaks every book. Worse inputs can read or destroy data. This is **SQL injection**, and it's been at the top of the security-flaw lists for two decades. The string-building *is* the vulnerability.

The fix is parameters — and it's also less code:

```java
String jpql = "select b from Book b where b.author.name = :name";
TypedQuery<Book> query = em.createQuery(jpql, Book.class);
query.setParameter("name", userInput);
List<Book> books = query.getResultList();
```

*What just happened:* `:name` is a typed placeholder. `setParameter("name", userInput)` hands the value to Hibernate *separately* from the query text, so the database treats it strictly as data — never as part of the query structure. Even the `' or '1'='1` string is just searched for literally and finds nothing. Parameters aren't only safer; they also let the database reuse a query plan across calls.

💡 The `TypedQuery<Book>` is worth calling out. By passing `Book.class` you get a `TypedQuery<Book>`, so `getResultList()` returns `List<Book>` with no casting — the compiler checks the type for you. The untyped `createQuery(jpql)` hands back a raw `Query` and `List` of `Object`, which you then have to cast by hand. Prefer the typed form everywhere.

## Joins and projections — fetching only what you need

JPQL joins across relationships when you need to filter or select through them. And often you *don't* want whole entities back — you want a few fields. Pulling the full `Book` (and triggering loads of its reviews, its author) just to show a title and an author name is wasteful.

📝 A **projection** is a query that selects specific values instead of entire entities. The cleanest form maps those values straight into a small read-only object — a **DTO** (Data Transfer Object):

```java
public class BookSummary {
    private final String title;
    private final String authorName;

    public BookSummary(String title, String authorName) {
        this.title = title;
        this.authorName = authorName;
    }
    // getters
}
```

```java
String jpql = """
    select new com.example.BookSummary(b.title, b.author.name)
    from Book b
    join b.author a
    order by b.title""";
List<BookSummary> summaries = em.createQuery(jpql, BookSummary.class)
                                .getResultList();
```

*What just happened:* `select new com.example.BookSummary(...)` is JPQL's **constructor expression** — for each matching row, Hibernate calls that constructor with the two selected values and hands you a `BookSummary`. `join b.author a` joins through the `author` reference explicitly (here it reads clearly and lets you alias `a`). You get back exactly the two fields you asked for, in lightweight objects.

The generated SQL selects only those columns:

```sql
select b.title, a.name
from book b
join author a on b.author_id = a.id
order by b.title
```

*What just happened:* two columns, one join, nothing else. Compare that to loading full `Book` entities — every column, plus whatever lazy collections you might accidentally trip later. 💡 Projections are a real, measurable performance win for read-heavy screens: list views, dashboards, search results. When you only need a handful of fields to *display* something, project into a DTO instead of loading managed entities you'll never modify. (Loading full entities you don't need is closely tied to the N+1 problem in [Phase 6](06-fetching-and-n-plus-1.md).)

## The Criteria API — queries you build in code

JPQL is a string, and a string is great until the query is *dynamic*. Picture a search screen with optional filters: maybe an author name, maybe a minimum review count, maybe a published-year range — any combination, depending on what the user filled in. Building that JPQL by hand means concatenating fragments and tracking commas and `and`s, which drags you right back toward the injection-prone string-gluing you just learned to avoid.

📝 The **Criteria API** lets you build a query *programmatically* — as Java objects, method call by method call — instead of as a string. Because it's code, you can add a `where` clause inside an `if`, type-safely, with no string surgery.

```java
CriteriaBuilder cb = em.getCriteriaBuilder();
CriteriaQuery<Book> cq = cb.createQuery(Book.class);
Root<Book> book = cq.from(Book.class);

List<Predicate> filters = new ArrayList<>();
if (authorName != null) {
    filters.add(cb.equal(book.get("author").get("name"), authorName));
}
if (minYear != null) {
    filters.add(cb.greaterThanOrEqualTo(book.get("publishedYear"), minYear));
}

cq.select(book).where(cb.and(filters.toArray(new Predicate[0])));
List<Book> books = em.createQuery(cq).getResultList();
```

*What just happened:* `Root<Book> book` is the Criteria stand-in for `from Book b` — the thing you build expressions off. Each optional filter becomes a `Predicate` (a `where` condition) only if its input is present, collected into a list. `cb.and(...)` combines whatever predicates you gathered, and `cq.where(...)` applies them. Add an `if`, get a clause — no fragile string assembly, and user values still flow through as bound parameters automatically, so it stays injection-safe.

⚠️ **The Criteria API is verbose, and that verbosity is a real cost.** The same query as a one-line JPQL string is far easier to read and review. So use Criteria for what it's *good* at — queries genuinely assembled at runtime from optional pieces. For a fixed query whose shape never changes, JPQL reads better, and you should prefer it. Reaching for Criteria everywhere out of habit makes a codebase harder, not safer.

## Native SQL — the escape hatch

JPQL is deliberately portable: it speaks "entities," and Hibernate translates to whatever database you're on. But that portability means JPQL can only express what's common across databases. Sooner or later you'll need something it cannot say — a window function, a vendor-specific function, a hand-tuned query the optimizer needs.

📝 For that, there's **native SQL** via `createNativeQuery` — you write the real SQL, Hibernate runs it as-is, and can still map the results back onto entities or projections.

```java
String sql = """
    select * from book
    where id in (
        select book_id from review
        group by book_id
        having count(*) >= :minReviews
    )""";
List<Book> popular = em.createNativeQuery(sql, Book.class)
                       .setParameter("minReviews", 10)
                       .getResultList();
```

*What just happened:* this is genuine SQL against the `book` and `review` tables — table names, not entity names. Passing `Book.class` tells Hibernate to map each returned row into a managed `Book` entity, so even though you dropped to raw SQL, you get back the same objects JPQL would have given you. Parameters still work (`:minReviews`), so it stays injection-safe down here too. When you need a database feature JPQL doesn't expose, this is how you reach it without abandoning JPA.

💡 Step back and look at the three layers together:

- **JPQL** for the overwhelming majority of queries — object-oriented, portable, concise.
- **Criteria API** when the query must be *built* dynamically from optional parts.
- **Native SQL** when you need something only the database can express.

That layering is the real lesson of this phase. A good ORM gives you a comfortable high-level language for everyday work but **never traps you away from the real SQL underneath**. You're never stuck — you just move down a layer, trading portability for power, exactly as far as the problem demands.

## Recap

1. **JPQL operates on entities, not tables** — `select b from Book b where b.author.name = :name` walks object references, and Hibernate translates it into SQL (inferring the join) for your database.
2. **Always use parameters** (`:name` + `setParameter`); never concatenate user input into a query string — that's the SQL injection hole. **`TypedQuery<Book>`** also gives you compile-time type safety and no casting.
3. **Projections** select specific fields, often into a **DTO** via JPQL's `select new ...` constructor expression — a real performance win when you only need a few fields to display, instead of loading full entities.
4. **The Criteria API** builds queries programmatically in type-safe Java, ideal for **dynamic queries** assembled from optional filters — but it's verbose, so prefer JPQL for fixed queries.
5. **Native SQL** (`createNativeQuery`) is the escape hatch for database-specific features JPQL can't express, still mapping results to entities or projections and still using parameters.
6. The layering — **JPQL → Criteria → native SQL** — means a good ORM never traps you away from real SQL; you drop down a level only when the level above can't reach.

## Quick check

Lock in when to use which layer, and the one habit that keeps your queries safe:

```quiz
[
  {
    "q": "What is the key difference between JPQL and SQL?",
    "choices": [
      "JPQL operates on entities and their fields (Book, b.author.name); SQL operates on tables and columns",
      "JPQL is faster because it skips the database",
      "JPQL can only query by primary key, unlike SQL",
      "There is no difference; JPQL is just an alias for SQL"
    ],
    "answer": 0,
    "explain": "JPQL looks like SQL but works against your object model — entities and fields, walking references like b.author.name. Hibernate translates it (including inferring joins) into real SQL for your specific database."
  },
  {
    "q": "Why must you use `setParameter(\"name\", value)` instead of concatenating the value into the query string?",
    "choices": [
      "Concatenation opens a SQL injection hole; parameters send the value as data the database never treats as query structure",
      "Concatenation is slower to type",
      "setParameter is the only way to query strings at all",
      "Parameters are required only for numbers, not text"
    ],
    "answer": 0,
    "explain": "Gluing user input into the query text lets a crafted value like `' or '1'='1` change the query's meaning — classic SQL injection. Parameters pass the value separately, so it's always treated as data, never as part of the query."
  },
  {
    "q": "You have a search screen with several optional filters that combine in any way the user chooses. Which querying tool fits best?",
    "choices": [
      "The Criteria API — it builds the query programmatically from whichever filters are present",
      "Native SQL — only raw SQL can handle optional filters",
      "A single fixed JPQL string with all filters always applied",
      "em.find by id, called once per filter"
    ],
    "answer": 0,
    "explain": "Dynamic queries assembled from optional parts are exactly what the Criteria API is for: add a Predicate inside an if, type-safely, with no fragile string-building. For fixed-shape queries, JPQL still reads better."
  }
]
```

---

[← Phase 6: Lazy vs Eager Fetching & the N+1 Problem](06-fetching-and-n-plus-1.md) · [Guide overview](_guide.md) · [Phase 8: Inheritance & Embeddables →](08-inheritance-and-embeddables.md)