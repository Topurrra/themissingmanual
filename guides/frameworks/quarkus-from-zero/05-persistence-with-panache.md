---
title: "Persistence: Hibernate with Panache"
guide: "quarkus-from-zero"
phase: 5
summary: "Panache is a thin Quarkus layer over Hibernate ORM that strips the boilerplate. Learn active-record and repository patterns, simplified queries, transactions, and zero-config Dev Services databases."
tags: [quarkus, panache, hibernate, jpa, active-record, repository, persistence, dev-services]
difficulty: intermediate
synonyms: ["quarkus panache tutorial", "hibernate orm panache", "quarkus active record pattern", "panache repository pattern", "quarkus database crud", "panacheentity", "quarkus hibernate jpa"]
updated: 2026-07-10
---

# Persistence: Hibernate with Panache

Phase 4 wired up beans with ArC, holding `Product` data in memory - fine until the JVM restarts and everything evaporates. This phase gives `Product` a real database. Good news: you already know most of how this works.

## The mental model: Panache is Hibernate wearing comfortable shoes

📝 **Panache is not a new ORM.** Underneath, it *is* Hibernate ORM - the same engine, entities, persistence context, transactions, and dirty checking from the [Hibernate & JPA guide](/guides/hibernate-and-jpa-from-zero). Panache is a thin layer that deletes the repetitive parts: hand-written getters/setters, boilerplate DAO methods, `EntityManager` plumbing.

- **Liberating:** every bit of JPA knowledge still applies - entities are still transient/managed/detached/removed, and Hibernate still syncs on commit.
- **Sobering:** every JPA *trap* still applies too. The N+1 problem doesn't disappear because the code got shorter.

> 💡 Read Panache as "Hibernate with less typing," never "Hibernate but the rules changed." When something surprises you, check the JPA guide, not the Panache docs.

## Active Record: the entity does the work

📝 The **active-record pattern**: your entity extends `PanacheEntity`, and data-access methods live *on the entity itself* as static methods - `Product.listAll()`, `Product.findById(id)`.

Two things surprise people coming from classic JPA:

1. **Public fields.** Declared `public`, no getters/setters - Panache rewrites the bytecode at build time to generate real accessors.
2. **A free id.** `PanacheEntity` provides an auto-generated `Long id`; you don't declare `@Id`.

```java
package org.acme.catalog;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Entity;
import java.math.BigDecimal;

@Entity
public class Product extends PanacheEntity {
    public String name;          // public field - Panache generates the accessor
    public BigDecimal price;     // 'id' comes free from PanacheEntity
}
```
*What just happened:* `@Entity` is the same JPA annotation as always. Extending `PanacheEntity` adds the generated `id` plus static finders (`listAll`, `findById`, `find`, `count`, `deleteAll`) and instance methods (`persist`, `delete`). The `public` fields are pure ceremony removal, not a different data model.

```java
// CREATE - must run inside a transaction (more below)
Product p = new Product();
p.name = "Mechanical Keyboard";
p.price = new BigDecimal("89.90");
p.persist();                              // INSERT scheduled on the persistence context

// READ
Product found = Product.findById(1L);     // SELECT by primary key
List<Product> all = Product.listAll();    // SELECT * from product

// UPDATE - no save() call needed
found.price = new BigDecimal("79.90");    // dirty checking writes this at commit

// DELETE
found.delete();                           // DELETE scheduled
```
*What just happened:* `p.persist()` makes the transient object managed and schedules the `INSERT`. The update has **no save call** - because `found` is managed, Hibernate's dirty checking notices the changed `price` and emits `UPDATE` on commit, exactly as in plain Hibernate.

## Repository: the same power, a separate class

📝 If you can't extend a base class, or prefer keeping persistence out of the domain object, use the **repository pattern**: keep the entity plain (private fields, `@Id`) and put a separate `ProductRepository` implementing `PanacheRepository<Product>` next to it, injected as a CDI bean.

```java
package org.acme.catalog;

import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class ProductRepository implements PanacheRepository<Product> {
    // Empty body - listAll(), findById(), persist(), delete()... are all inherited.
    // Add custom finders here as you need them.
}
```
*What just happened:* `PanacheRepository<Product>` gives the repository the same method set the active-record entity got, but as instance methods.

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
*What just happened:* functionally identical SQL to the active-record version - the difference is purely *where the methods live*.

> 💡 Active-record reads cleaner and is faster for straightforward CRUD. Repository is easier to mock in unit tests and separates concerns more strictly. Pick one per project and stay consistent.

## Queries and transactions

📝 Panache gives a **simplified query syntax** - write only the fragment after `where`:

```java
// Panache shorthand - "name = ?1"
List<Product> hits = Product.list("name", "Mechanical Keyboard");

// Sorted, with positional params
List<Product> cheap = Product.list("price < ?1 order by price", new BigDecimal("50"));

// Paging
List<Product> page = Product.find("order by name")
                            .page(Page.of(0, 20))   // first page, 20 per page
                            .list();
```
```sql
select p.id, p.name, p.price from product p where p.name = 'Mechanical Keyboard'
```
*What just happened:* `Product.list("name", value)` expands to the full JPQL `from Product where name = ?1`. It's just JPQL with the boilerplate omitted - the generated SQL is identical to plain Hibernate.

Writes need a transaction:

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
*What just happened:* `@Transactional` wraps the method in a database transaction. `persist()` schedules the `INSERT`, but the SQL flushes when the transaction commits - if the method threw, it would roll back with nothing written.

> ⚠️ The N+1 trap is alive and well. `Product.listAll()` then looping over a lazy `reviews` collection fires one `SELECT` for the list plus one *per product*. Panache's tidy syntax hides nothing here - the fix is the same `join fetch` from the Hibernate guide. **Watch the generated SQL.** See [Why is my query slow?](/guides/why-is-my-query-slow).

## Dev Services: a database that appears out of nowhere

💡 Add the JDBC driver and Panache extensions:

```console
quarkus extension add jdbc-postgresql hibernate-orm-panache
```

Run `quarkus dev` with **no datasource configured**, and Quarkus notices you have a Postgres driver but no connection URL, so it spins up a throwaway PostgreSQL container and tears it down when you stop. This is **Dev Services** - a fresh project can talk to a real database before you've written a line of config.

For production, a few lines in `application.properties`:

```properties
# Production datasource - Dev Services backs off when these are set
quarkus.datasource.db-kind=postgresql
quarkus.datasource.username=catalog
quarkus.datasource.password=${DB_PASSWORD}
quarkus.datasource.jdbc.url=jdbc:postgresql://db.internal:5432/catalog
```
*What just happened:* once a real `jdbc.url` is present, Dev Services stays out of the way. `${DB_PASSWORD}` pulls from an environment variable (Phase 6). Same code, frictionless local loop *and* normal production connection.

> ⚠️ One thing must change between dev and prod: schema generation. Dev often uses `quarkus.hibernate-orm.database.generation=drop-and-create`, letting Hibernate build tables from your entities. That's a **development convenience only** - in production, never let Hibernate own your schema. Use real migrations (Flyway has a Quarkus extension).

## Recap

1. 📝 **Panache is Hibernate ORM with less boilerplate** - same engine, same persistence context, same
   entity states. Your JPA knowledge (and JPA's traps) carry over unchanged.
2. **Active-record pattern:** `Product extends PanacheEntity`, public fields (accessors generated at build
   time), a free `id`, and static methods on the entity - `Product.findById(id)`, `product.persist()`.
3. **Repository pattern:** keep the entity plain and put a `ProductRepository implements
   PanacheRepository<Product>` next to it, injected as a CDI bean. Same methods, separate class - better
   for testability and separation. Pick one pattern per project.
4. **Queries** use a shorthand (`Product.list("name", name)`, paging, sorting) that's plain JPQL
   underneath; **writes** need `@Transactional`, and the SQL flushes at commit, not at `persist`.
5. ⚠️ **N+1 still bites** - Panache hides boilerplate, not the database. Watch the generated SQL and use
   `join fetch` when looping over lazy relationships.
6. 💡 **Dev Services** auto-starts a throwaway Postgres in dev (zero config); production uses a real
   datasource in `application.properties`. Schema auto-generation is dev-only - use Flyway migrations in
   prod.

## Quick check

The three ideas worth keeping:

```quiz
[
  {
    "q": "You write `Product.findById(1L)` and `product.persist()`, with public fields and no `@Id` on the entity. Which Panache pattern is this, and where does the `id` come from?",
    "choices": [
      "Active-record - the entity extends PanacheEntity, which provides the generated Long id and the static/instance data methods",
      "Repository - findById only exists on a PanacheRepository",
      "Plain JPA - Panache isn't involved when you call findById",
      "It won't compile, because an @Entity must declare its own @Id"
    ],
    "answer": 0,
    "explain": "Calling static finders on the entity and using public fields with a free id is the active-record pattern: Product extends PanacheEntity, which supplies the auto-generated Long id and the finder/persist methods. The repository pattern would put findById on an injected PanacheRepository instead."
  },
  {
    "q": "Inside a `@Transactional` method you load a managed Product and set `product.price` to a new value, but never call any save/update method. What happens at commit?",
    "choices": [
      "Hibernate's dirty checking detects the changed field and emits an UPDATE - Panache uses the same persistence context as plain JPA",
      "Nothing - without an explicit update() call the change is lost",
      "It throws, because you must call persist() again to save changes",
      "The change is saved immediately when you set the field, before commit"
    ],
    "answer": 0,
    "explain": "Panache is Hibernate underneath. A managed entity is tracked by the persistence context, so dirty checking notices the changed price and flushes an UPDATE when the transaction commits - no save call required."
  },
  {
    "q": "You `Product.listAll()` and then loop over each product touching a lazy `reviews` collection, and the endpoint is slow. What's the most likely cause?",
    "choices": [
      "The N+1 problem - one SELECT for the list plus one per product for its reviews; Panache doesn't prevent it, so use join fetch and watch the SQL",
      "Dev Services is using a slow throwaway container; it goes away in production",
      "Panache is missing an index, which it should have generated automatically",
      "listAll() is deprecated and you should use find() with paging to fix performance"
    ],
    "answer": 0,
    "explain": "This is the classic N+1: the list query plus one lazy-load query per product. Panache's short syntax hides the boilerplate but not the database behavior, so the same JPA fix applies - fetch the relationship eagerly with join fetch (or an entity graph) and verify by counting the generated queries."
  }
]
```

---

[← Phase 4: CDI in Quarkus (ArC)](04-cdi-with-arc.md) · [Guide overview](_guide.md) · [Phase 6: Configuration →](06-configuration.md)
