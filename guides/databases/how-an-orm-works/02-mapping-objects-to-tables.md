---
title: "Mapping Objects to Tables"
guide: "how-an-orm-works"
phase: 2
summary: "The first job every ORM does: a set of correspondence rules turning classes into tables, fields into columns, references into foreign keys, and collections into one-to-many — by convention plus configuration."
tags: [orm, database, mapping, foreign-keys, inheritance]
difficulty: intermediate
synonyms: ["orm mapping", "class to table", "object reference foreign key", "orm relationships mapping", "orm inheritance mapping", "orm column mapping"]
updated: 2026-06-23
---

# Mapping Objects to Tables

In [Phase 1](01-what-an-orm-is.md) we named the four jobs an ORM does. This phase is about the first and most foundational one: **mapping**. Before an ORM can track your changes or build a query, it has to know one thing — *which object goes with which row*. Everything else is built on top of that answer.

Here's the mental model to hold the whole way through: **mapping is a small set of correspondence rules.** It's not magic, and it's not a lot of rules. The ORM looks at your classes and your schema and lines them up, piece by piece, following the same handful of correspondences every single time. Once you've internalized those rules, you can predict what *any* ORM will do with *any* class — and, equally usefully, you can predict the SQL it'll generate.

## The correspondence rules

Five rules cover almost everything you'll meet:

- a **class ↔ a table** — `User` lines up with the `users` table.
- a **field / property ↔ a column** — `user.email` lines up with the `email` column.
- a **primary key field ↔ the PK column** — usually an `id` field maps to the `id` primary key.
- an **object reference ↔ a foreign key** — `order.customer` (a pointer to another object) lines up with `orders.customer_id` (a foreign key column).
- a **collection ↔ a one-to-many** — `customer.orders` (a list of objects) lines up with many rows in `orders` that share the same `customer_id`. And the special case: a **many-to-many ↔ a join table**.

The first three are the "shape of one thing" rules. The last two are the interesting ones, because that's where the [object-relational mismatch](01-what-an-orm-is.md) really bites: your code holds a *reference* (a direct pointer from one object to another), but the database has no pointers — it has foreign keys, which are columns holding the *value* of some other row's primary key. The ORM's job is to fake the pointer using the key.

## Seeing the rules on real classes

Let's make it concrete. Say you have a `Customer` that owns a list of `Order` objects, and each `Order` points back to its `Customer`. Here's the mapping the ORM applies, in pseudocode:

```text
class Customer:                       table customers:
    id                       ↔            id           (PK)
    name                     ↔            name
    orders  -> [Order]       ↔            (no column — lives in orders)

class Order:                          table orders:
    id                       ↔            id           (PK)
    total                    ↔            total
    customer -> Customer     ↔            customer_id  (FK -> customers.id)
```

*What just happened:* The scalar fields (`name`, `total`) became plain columns. The `Order.customer` reference became the `customer_id` foreign key — that's the one column that actually stores the relationship. And `Customer.orders` has *no column at all* — it's the *reverse view* of that same foreign key. When you ask for `customer.orders`, the ORM runs `SELECT * FROM orders WHERE customer_id = ?`. One relationship, one foreign key, seen from two directions.

Many-to-many is the case where neither side can hold the key — a student takes many courses, a course has many students. There's nowhere to put a single `course_id` on `students`. So the ORM introduces a third table:

```text
class Student:        class Course:           join table enrollments:
    courses  ──────────── students    ↔          student_id  (FK -> students.id)
                                                  course_id   (FK -> courses.id)
```

*What just happened:* The `enrollments` join table holds one row per (student, course) pairing. `student.courses` and `course.students` are *both* reverse views into that table — the ORM reads it from whichever side you asked. You typically never write a class for `enrollments`; the ORM manages it for you behind the collection. (If the relationship needs its own data — say, an enrollment *date* — most ORMs make you promote it to a real class. That's covered in [Relationships & Keys](/guides/relationships-and-keys).)

> 💡 If a relationship ever confuses you, find the foreign key. The FK is the source of truth; the object reference and the collection are two convenient views of it. "Which table has the `_id` column?" answers "who owns this relationship?"

## Convention, then configuration

You might be wondering: how does the ORM *know* that `Customer` maps to `customers` and `Order.customer` maps to `customer_id`? Two layers, and this is true of every ORM:

1. **Convention** — sensible defaults inferred from your names and types. Class `Customer` → table `customers` (pluralized, lowercased). Field `email` → column `email`. A reference named `customer` → foreign key `customer_id`. You write nothing; the defaults carry you a long way.
2. **Configuration** — explicit overrides for when the defaults don't fit. Your legacy table is named `tbl_cust`, or the column is `email_address`, or the key isn't `id`. You annotate the mapping to correct it.

The *idea* is identical across the ecosystem; only the syntax differs:

- **Hibernate / JPA** (Java) — annotations on the class: `@Entity`, `@Table(name=...)`, `@Column`, `@ManyToOne`, `@JoinColumn`.
- **SQLAlchemy** (Python) — declarative models: a class subclasses a base, columns are class attributes, relationships use `relationship()`.
- **GORM** (Go) — struct tags: `gorm:"column:email_address"` right on the struct field.
- **EF Core** (C#) — conventions plus the **Fluent API** (`modelBuilder.Entity<...>().Property(...)`) or data attributes.

> 💡 Reach for configuration only to *correct* a convention the ORM got wrong — not to restate one it already got right. Re-declaring `@Column(name = "email")` on a field already named `email` is noise. The less you configure, the more readable the mapping, and the easier it is to see where you've genuinely deviated from the defaults.

## The sharpest edge: inheritance

Here's where the mismatch cuts deepest. Your classes can *inherit* — `SavingsAccount` and `CheckingAccount` both extend `Account`. SQL has no concept of inheritance at all. A table is a flat list of columns; there's no "this table extends that one." So the ORM has to *choose a strategy* to flatten a class hierarchy into tables, and each choice is a real tradeoff:

- **Single-table** — one table for the whole hierarchy, with a **discriminator column** (e.g. `account_type`) saying which subclass each row is. Columns that only belong to a subclass are nullable for the other rows. Fast queries (no joins), but a wider table full of nulls — and you can't make subclass-specific columns `NOT NULL` at the database level.
- **Joined / table-per-subclass** — a base table (`accounts`) plus one table per subclass (`savings_accounts`, `checking_accounts`), linked by sharing the primary key. Clean and fully normalized, but loading a subclass means a **join** between the base and subclass tables on every read.
- **Table-per-class** — each concrete class gets its own standalone table with *all* its columns (inherited ones copied in). No joins for a single type, but querying "all accounts regardless of type" forces a `UNION` across every table.

The tradeoff in one line: **single-table buys query speed with nullable clutter; joined buys normalization with extra joins; table-per-class buys per-type simplicity with painful cross-type queries.** Most teams reach for single-table unless the hierarchy is wide or the nulls become genuinely misleading. You don't need to master these now — know that the ORM is making this choice on your behalf, and that the strategy you pick shows up directly in the SQL you'll later debug.

## Mapping runs both directions

One last piece of the model, and it's an important one:

> 📝 Mapping is **bidirectional**. On *load*, the ORM goes **row → object**: it reads a row and pours the column values into a fresh object's fields — this is called **hydration**. On *save*, it runs the reverse: **object → row**, reading your object's fields and writing them out as `INSERT` or `UPDATE` column values.

The same correspondence rules drive both directions — that's the point of having rules instead of hand-written code. Hydration is also where foreign keys get turned *back* into references: when the ORM hydrates an `Order` and sees `customer_id = 42`, it knows that `order.customer` should resolve to the `Customer` with id 42 (whether it fetches that customer now or later is the *loading* job, coming in a later phase).

This load/save round-trip is why the relationship modeling you do in [Relationships & Keys](/guides/relationships-and-keys) matters so much: the ORM can only hydrate references and collections correctly if the foreign keys it's reading are sound. Get the keys right in the schema, and the mapping rules do the rest — in both directions, every time.

## Recap

- **Mapping is a small, fixed set of correspondence rules** — learn them once and you can predict any ORM's behavior and its SQL.
- The core five: **class ↔ table**, **field ↔ column**, **PK field ↔ PK column**, **object reference ↔ foreign key**, **collection ↔ one-to-many** (with **many-to-many ↔ a join table**).
- An object **reference** and a **collection** are two views of the *same* foreign key; the FK is the source of truth for who owns a relationship.
- ORMs map by **convention** (defaults from names/types) plus **configuration** (annotations / declarative models / struct tags / Fluent API) — configure only to override what the convention got wrong.
- **Inheritance** has no SQL equivalent, so the ORM picks a strategy — **single-table**, **joined**, or **table-per-class** — each trading query speed against normalization.
- Mapping is **bidirectional**: **hydration** turns rows into objects on load; the reverse turns objects into rows on save.

## Quick check

```quiz
[
  {
    "q": "Your code has `order.customer` (a reference to a Customer object). What does the ORM map that to in the database?",
    "choices": ["A new column on the customers table", "A foreign key column like customer_id on the orders table", "A separate join table linking the two", "Nothing — references aren't stored"],
    "answer": 1,
    "explain": "An object reference maps to a foreign key. order.customer corresponds to orders.customer_id, a column holding the referenced customer's primary key."
  },
  {
    "q": "Your table is named `tbl_cust` instead of the default `customers`. How do you tell the ORM?",
    "choices": ["You can't — you must rename the table", "Through configuration (an annotation, tag, or fluent mapping) that overrides the convention", "By renaming your class to TblCust", "The ORM auto-detects any table name"],
    "answer": 1,
    "explain": "Convention gives defaults; configuration overrides them. You'd add an annotation/tag/fluent rule to point the class at tbl_cust."
  },
  {
    "q": "What is 'hydration' in an ORM?",
    "choices": ["Writing an object's fields out as an UPDATE", "Building a SQL query from an object", "Reading a database row and filling an object's fields with its column values", "Caching a query result for reuse"],
    "answer": 2,
    "explain": "Hydration is the row → object direction of mapping: on load, the ORM pours column values into a fresh object's fields."
  }
]
```

[← Phase 1: What an ORM Is (the Mismatch)](01-what-an-orm-is.md) · [Guide overview](_guide.md) · [Phase 3: The Identity Map & Unit of Work →](03-identity-map-and-unit-of-work.md)
