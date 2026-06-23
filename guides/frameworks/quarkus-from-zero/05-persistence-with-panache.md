---
title: "Persistence: Hibernate with Panache"
guide: "quarkus-from-zero"
phase: 5
summary: "Panache is a thin Quarkus layer over Hibernate ORM that strips the boilerplate. Learn active-record and repository patterns, simplified queries, transactions, and zero-config Dev Services databases."
tags: [quarkus, panache, hibernate, jpa, active-record, repository, persistence, dev-services]
difficulty: intermediate
synonyms: ["quarkus panache tutorial", "hibernate orm panache", "quarkus active record pattern", "panache repository pattern", "quarkus database crud", "panacheentity", "quarkus hibernate jpa"]
updated: 2026-06-22
---

# Persistence: Hibernate with Panache

In Phase 4 you wired up beans with ArC and built out the `Product` domain. Those beans were holding data
in memory, which is fine until the JVM restarts and everything evaporates. This phase is where `Product`
finally gets a database to live in. And here's the good news up front: you already know most of how this
works, even if you don't think you do.

## The mental model: Panache is Hibernate wearing comfortable shoes

📝 Let's clear up the single most important thing before we touch any code. **Panache is not a new ORM.**
Underneath, it *is* Hibernate ORM — the exact same engine, entities, persistence context, transactions,
and dirty checking covered in the
[Hibernate & JPA guide](/guides/hibernate-and-jpa-from-zero). Panache is a thin Quarkus layer that sits
on top and deletes the repetitive parts: the hand-written getters and setters, the boilerplate DAO
methods, the `EntityManager` plumbing you'd otherwise type a hundred times.

That has a liberating consequence and a sobering one, and you need both:

- **Liberating:** every bit of JPA knowledge you have still applies. The
  [persistence context is still a per-transaction workbench](/guides/hibernate-and-jpa-from-zero), entities
  are still transient/managed/detached/removed, and Hibernate still syncs on commit, not the instant you
  touch a field.
- **Sobering:** every JPA *trap* still applies too. The N+1 problem doesn't disappear because the code got
  shorter. Panache hides the boilerplate, not the database.

> 💡 **Key point.** Read Panache as "Hibernate with less typing," never as "Hibernate but the rules
> changed." When something behaves surprisingly, the answer is almost always in the JPA guide, not the
> Panache docs.

## Active Record: the entity does the work

📝 Panache gives you two patterns. The first is the **active-record pattern**, and it's the one most
Quarkus tutorials show. The idea: your entity extends `PanacheEntity`, and the data-access methods live
*on the entity itself* as static methods. `Product.listAll()`. `Product.findById(id)`. You ask the class
about its own table.

Two things make this work, and both surprise people coming from classic JPA:

1. **Public fields.** You declare fields as `public`, with no getters or setters. Panache rewrites the
   bytecode at build time to generate proper accessors, so the rest of your code (and frameworks) still
   see a real JavaBean — you just don't type it.
2. **A free id.** `PanacheEntity` provides the `Long id` primary key for you, auto-generated. You don't
   declare `@Id` at all.

Here's `Product` as an active-record entity:

```java
package org.acme.catalog;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Entity;
import java.math.BigDecimal;

@Entity
public class Product extends PanacheEntity {
    public String name;          // public field — Panache generates the accessor
    public BigDecimal price;     // 'id' comes free from PanacheEntity
}
```
*What just happened:* `@Entity` is the same JPA annotation as always — this maps to a `product` table.
By extending `PanacheEntity`, `Product` inherits a generated `Long id` plus a pile of static finder
methods (`listAll`, `findById`, `find`, `count`, `deleteAll`, …) and instance methods (`persist`,
`delete`). The `public` fields look wrong if you're used to encapsulation, but the build step turns them
into private fields with accessors — this is pure ceremony removal, not a different data model.

Now CRUD, with the database calls living right on the type:

```java
// CREATE — must run inside a transaction (more on that below)
Product p = new Product();
p.name = "Mechanical Keyboard";
p.price = new BigDecimal("89.90");
p.persist();                              // INSERT scheduled on the persistence context

// READ
Product found = Product.findById(1L);     // SELECT by primary key
List<Product> all = Product.listAll();    // SELECT * from product

// UPDATE — no save() call needed
found.price = new BigDecimal("79.90");    // dirty checking writes this at commit

// DELETE
found.delete();                           // DELETE scheduled
```
*What just happened:* `new Product()` is a transient object Hibernate has never heard of; `p.persist()`
makes it managed and schedules the `INSERT`. The update has *no save call at all* — because `found` is a
managed entity, Hibernate's dirty checking notices the changed `price` and emits the `UPDATE` on commit.
That "I changed a field and it saved itself" behavior is the persistence context doing its job, exactly
as in the [Hibernate guide](/guides/hibernate-and-jpa-from-zero) — Panache changed the syntax, not the
mechanism.

## Repository: the same power, a separate class

📝 Not everyone wants data-access methods bolted onto the entity. Maybe you can't extend a base class
(your entity already extends something, or it's a record-like value object), or you prefer keeping
persistence logic out of the domain object. For that, Panache offers the **repository pattern**.

You keep the entity plain — a normal JPA `@Entity` with private fields and `@Id` if you like — and put a
separate `ProductRepository` next to it that implements `PanacheRepository<Product>`. The repository is a
CDI bean, so you inject it wherever you need it (this is the `@Inject` from Phase 4 doing the wiring).

```java
package org.acme.catalog;

import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class ProductRepository implements PanacheRepository<Product> {
    // Empty body — listAll(), findById(), persist(), delete()... are all inherited.
    // Add custom finders here as you need them.
}
```
*What just happened:* `PanacheRepository<Product>` hands the repository the *same* method set the
active-record entity got — `listAll()`, `findById()`, `persist()`, `count()` — but as instance methods on
the repository instead of statics on the entity. `@ApplicationScoped` makes it a singleton CDI bean (same
scope you met in Phase 4), so one instance is shared app-wide.

Using it from a service:

```java
@ApplicationScoped
public class CatalogService {
    @Inject
    ProductRepository products;            // ArC injects the repository bean

    public Product priceCheck(Long id) {
        return products.findById(id);      // call methods on the repo, not the entity
    }
}
```
*What just happened:* `@Inject` asks ArC for the `ProductRepository`, and you call `findById` on that
injected instance. The entity stays a dumb data holder. Functionally this does the identical SQL the
active-record version did — the difference is purely *where the methods live* and how you reach them.

> 💡 Active-record reads cleaner and is faster to write — great for straightforward CRUD. Repository keeps
> persistence out of the entity, which is easier to mock in unit tests and separates concerns more
> strictly. Neither is "correct." Pick one per project and stay consistent; mixing both in one codebase
> just confuses the next reader. Your call.

## Queries and transactions

📝 You rarely fetch by id alone. Panache gives a **simplified query syntax** where you write only the
fragment after the `where`, and it fills in the rest:

```java
// Panache shorthand — "name = ?1"
List<Product> hits = Product.list("name", "Mechanical Keyboard");

// Sorted, with named-ish positional params
List<Product> cheap = Product.list("price < ?1 order by price", new BigDecimal("50"));

// Paging
List<Product> page = Product.find("order by name")
                            .page(Page.of(0, 20))   // first page, 20 per page
                            .list();
```
```sql
select p.id, p.name, p.price from product p where p.name = 'Mechanical Keyboard'
```
*What just happened:* `Product.list("name", value)` expanded to the full JPQL `from Product where name =
?1` and ran the `SELECT` shown. The shorthand is *just* JPQL with the boilerplate prefix omitted — when
you need a full query you can still write the whole thing, and the generated SQL is identical to what
plain Hibernate would produce. Nothing magic, only shorter.

Writes need a transaction. As in the Hibernate guide, the method that *modifies* data must be
transactional — in Quarkus you annotate it with `@Transactional`:

```java
@ApplicationScoped
public class CatalogService {

    @Transactional                          // opens a tx; commits on clean return, rolls back on exception
    public Product create(String name, BigDecimal price) {
        Product p = new Product();
        p.name = name;
        p.price = price;
        p.persist();
        return p;                            // INSERT flushed at method exit, when the tx commits
    }
}
```
*What just happened:* `@Transactional` wraps the method in a database transaction. `persist()` schedules
the `INSERT` on the persistence context, but the SQL actually flushes when the method returns and the
transaction commits — the same commit-time sync from the
[Hibernate guide](/guides/hibernate-and-jpa-from-zero). If the method threw, the transaction would roll
back and no row would be written. Read methods don't strictly need it, but a transactional read still
gets you a consistent persistence context for the duration.

> ⚠️ The N+1 trap is alive and well. If `Product` had a lazy `@OneToMany` reviews collection and you did
> `Product.listAll()` then looped touching `product.reviews` on each, Panache would happily fire one
> `SELECT` for the list plus one *per product* for the reviews — the classic N+1. Panache's tidy syntax
> hides nothing here: the fix is the same `join fetch` (or an entity graph) from the Hibernate guide.
> **Watch the generated SQL**, don't trust the short Java. If a list endpoint feels slow, see
> [Why is my query slow?](/guides/why-is-my-query-slow) — and turn on SQL logging so you can actually
> count the queries.

## Dev Services: a database that appears out of nowhere

💡 Remember Phase 2's promise that Quarkus dev mode "just works" with zero config? Here's the payoff for
persistence. Add the JDBC driver and Panache extensions to your build:

```console
quarkus extension add jdbc-postgresql hibernate-orm-panache
```

Now run `quarkus dev` with **no datasource configured at all**, and Quarkus notices you have a Postgres
driver but no connection URL — so it spins up a throwaway PostgreSQL container (via Testcontainers),
points your app at it, and tears it down when you stop. This is **Dev Services**, and it's why a fresh
Quarkus project can talk to a real database before you've written a single line of config.

For production, of course, you point at a real database. That's a few lines in
`src/main/resources/application.properties`:

```properties
# Production datasource — Dev Services backs off when these are set
quarkus.datasource.db-kind=postgresql
quarkus.datasource.username=catalog
quarkus.datasource.password=${DB_PASSWORD}
quarkus.datasource.jdbc.url=jdbc:postgresql://db.internal:5432/catalog
```
*What just happened:* once a real `jdbc.url` is present, Quarkus uses it and Dev Services stays out of the
way — Dev Services only kicks in when the connection config is *missing*. The `${DB_PASSWORD}` pulls from
an environment variable, which is the config-injection topic of Phase 6. So you get a frictionless local
loop *and* a normal production connection, with the same code.

> ⚠️ One thing must change between dev and prod: schema generation. In dev you'll often see
> `quarkus.hibernate-orm.database.generation=drop-and-create`, which lets Hibernate build the tables from
> your entities on startup. That is a **development convenience only**. In production, never let Hibernate
> own your schema — use real migrations (Flyway, which has a Quarkus extension). This is the exact same
> warning from the [Hibernate guide](/guides/hibernate-and-jpa-from-zero): auto-generation is great for
> iterating, catastrophic for a database with data you care about.

## Recap

1. 📝 **Panache is Hibernate ORM with less boilerplate** — same engine, same persistence context, same
   entity states. Your JPA knowledge (and JPA's traps) carry over unchanged.
2. **Active-record pattern:** `Product extends PanacheEntity`, public fields (accessors generated at build
   time), a free `id`, and static methods on the entity — `Product.findById(id)`, `product.persist()`.
3. **Repository pattern:** keep the entity plain and put a `ProductRepository implements
   PanacheRepository<Product>` next to it, injected as a CDI bean. Same methods, separate class — better
   for testability and separation. Pick one pattern per project.
4. **Queries** use a shorthand (`Product.list("name", name)`, paging, sorting) that's plain JPQL
   underneath; **writes** need `@Transactional`, and the SQL flushes at commit, not at `persist`.
5. ⚠️ **N+1 still bites** — Panache hides boilerplate, not the database. Watch the generated SQL and use
   `join fetch` when looping over lazy relationships.
6. 💡 **Dev Services** auto-starts a throwaway Postgres in dev (zero config); production uses a real
   datasource in `application.properties`. Schema auto-generation is dev-only — use Flyway migrations in
   prod.

## Quick check

The three ideas worth keeping:

```quiz
[
  {
    "q": "You write `Product.findById(1L)` and `product.persist()`, with public fields and no `@Id` on the entity. Which Panache pattern is this, and where does the `id` come from?",
    "choices": [
      "Active-record — the entity extends PanacheEntity, which provides the generated Long id and the static/instance data methods",
      "Repository — findById only exists on a PanacheRepository",
      "Plain JPA — Panache isn't involved when you call findById",
      "It won't compile, because an @Entity must declare its own @Id"
    ],
    "answer": 0,
    "explain": "Calling static finders on the entity and using public fields with a free id is the active-record pattern: Product extends PanacheEntity, which supplies the auto-generated Long id and the finder/persist methods. The repository pattern would put findById on an injected PanacheRepository instead."
  },
  {
    "q": "Inside a `@Transactional` method you load a managed Product and set `product.price` to a new value, but never call any save/update method. What happens at commit?",
    "choices": [
      "Hibernate's dirty checking detects the changed field and emits an UPDATE — Panache uses the same persistence context as plain JPA",
      "Nothing — without an explicit update() call the change is lost",
      "It throws, because you must call persist() again to save changes",
      "The change is saved immediately when you set the field, before commit"
    ],
    "answer": 0,
    "explain": "Panache is Hibernate underneath. A managed entity is tracked by the persistence context, so dirty checking notices the changed price and flushes an UPDATE when the transaction commits — no save call required."
  },
  {
    "q": "You `Product.listAll()` and then loop over each product touching a lazy `reviews` collection, and the endpoint is slow. What's the most likely cause?",
    "choices": [
      "The N+1 problem — one SELECT for the list plus one per product for its reviews; Panache doesn't prevent it, so use join fetch and watch the SQL",
      "Dev Services is using a slow throwaway container; it goes away in production",
      "Panache is missing an index, which it should have generated automatically",
      "listAll() is deprecated and you should use find() with paging to fix performance"
    ],
    "answer": 0,
    "explain": "This is the classic N+1: the list query plus one lazy-load query per product. Panache's short syntax hides the boilerplate but not the database behavior, so the same JPA fix applies — fetch the relationship eagerly with join fetch (or an entity graph) and verify by counting the generated queries."
  }
]
```

---

[← Phase 4: CDI in Quarkus (ArC)](04-cdi-with-arc.md) · [Guide overview](_guide.md) · [Phase 6: Configuration →](06-configuration.md)
