---
title: "Hibernate & JPA From Zero"
guide: "hibernate-and-jpa-from-zero"
phase: 0
summary: "Learn the ORM that sits under most Java backends: what an ORM really is, JPA vs Hibernate, entities and mapping, the EntityManager and persistence context, transactions and dirty checking, relationships, lazy-vs-eager fetching and the N+1 trap, JPQL and the Criteria API, inheritance, and caching. The magic Spring Data JPA hides, made plain."
tags: [hibernate, jpa, orm, java, persistence, entitymanager, jpql, n-plus-one, framework]
category: frameworks
order: 3
group: "Java"
difficulty: intermediate
synonyms: ["learn hibernate", "learn jpa", "hibernate jpa tutorial", "what is an orm", "jpa vs hibernate", "hibernate entitymanager persistence context", "hibernate n+1 problem", "jpql criteria api", "hibernate relationships onetomany", "spring data jpa under the hood"]
updated: 2026-06-22
---

# Hibernate & JPA From Zero

Almost every Java backend that talks to a relational database is, somewhere underneath, running
Hibernate. If you came from [Spring Boot](/guides/spring-boot-from-zero), you met it without meeting it:
Spring Data JPA's "declare an interface and queries appear" magic is Hibernate doing the work two layers
down. This guide pulls that layer into the light. Learning it directly is doubly worth it — it's a
hugely employable skill on its own *and* it turns Spring Data JPA from magic into something you can
reason about and debug.

We go mental-model-first the whole way. An ORM feels like magic until you understand the two ideas that
run it — the **persistence context** and **dirty checking** — and then the whole thing becomes
predictable. By the end you'll map objects to tables, navigate relationships without triggering a
thousand queries, write real JPQL, and know exactly what SQL Hibernate sends and why.

> 📝 This assumes you know **Java** (classes, generics, annotations, collections) and the basics of
> **relational databases** (tables, rows, keys, joins). If either is shaky, do
> [Java From Zero](/guides/java-from-zero) and [What a Database Is](/guides/what-a-database-is) first.
> New to frameworks generally? [What a Framework Even Is](/guides/what-a-framework-even-is) sets the stage.

## How to read this

Read in order — it builds one example domain (authors, books, reviews) and adds a layer each phase.
Crucially, **keep `show_sql` on** as you go: the whole skill is connecting the Java you write to the SQL
Hibernate emits. Phases carry difficulty badges.

## The phases

**Part 1 — The core model (🟢 Basic → 🟡)**
1. **[What an ORM Is & Why Hibernate Exists](01-what-an-orm-is.md)** 🟢 — the object/relational mismatch, JPA (the spec) vs Hibernate (the implementation).
2. **[Entities & Basic Mapping](02-entities-and-mapping.md)** 🟢 — `@Entity`, `@Id`, generated keys, columns, and the table they imply.
3. **[The EntityManager & Persistence Context](03-entitymanager-and-persistence-context.md)** 🟡 — the heart of it all: managed objects, the identity map, and the four entity states.
4. **[Transactions & the Unit of Work](04-transactions-and-unit-of-work.md)** 🟡 — commit/rollback, flushing, and **dirty checking** (why changing a field updates the row with no `save` call).

**Part 2 — Relationships & queries (🔴 Advanced → 🟡)**
5. **[Mapping Relationships](05-mapping-relationships.md)** 🔴 — `@ManyToOne`/`@OneToMany`/`@ManyToMany`, owning vs inverse side, join columns.
6. **[Lazy vs Eager Fetching & the N+1 Problem](06-fetching-and-n-plus-1.md)** 🔴 — the single most important ORM performance lesson, and how to fix it.
7. **[Querying: JPQL, Criteria & Native SQL](07-querying-jpql-criteria.md)** 🟡 — query objects not tables, parameters, projections, and the escape hatch to raw SQL.
8. **[Inheritance & Embeddables](08-inheritance-and-embeddables.md)** 🟡 — mapping class hierarchies and value objects.

**Part 3 — Making it fast & real (🔴 Advanced → 🟢)**
9. **[Caching & Performance](09-caching-and-performance.md)** 🔴 — first- vs second-level cache, batching, and reading the SQL Hibernate emits.
10. **[Hibernate in the Real World & Where to Go Next](10-where-to-go-next.md)** 🟢 — JPA inside Spring, schema migrations, when to drop to SQL, and what to build.

> The payoff: after this, [Spring Boot's persistence phase](/guides/spring-boot-from-zero) stops being
> magic — you'll see exactly what Spring Data JPA generates and how to make it fast.

---

[Phase 1: What an ORM Is & Why Hibernate Exists →](01-what-an-orm-is.md)
