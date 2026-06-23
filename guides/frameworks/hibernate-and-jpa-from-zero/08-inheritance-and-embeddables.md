---
title: "Inheritance & Embeddables"
guide: "hibernate-and-jpa-from-zero"
phase: 8
summary: "How to map a Java class hierarchy onto tables (SINGLE_TABLE, JOINED, TABLE_PER_CLASS) and how embeddables fold a value object's fields into the owning table — plus when to reach for each."
tags: [hibernate, jpa, inheritance, single-table, joined, embeddable, value-object, elementcollection]
difficulty: intermediate
synonyms: ["jpa inheritance strategies", "jpa single table vs joined", "hibernate @Inheritance", "jpa @Embeddable @Embedded", "jpa value object mapping", "jpa @ElementCollection", "hibernate table per class"]
updated: 2026-06-22
---

# Inheritance & Embeddables

In Phase 6 of [Java from zero](/guides/java-from-zero) you learned how Java classes share behavior:
`extends`, overriding, polymorphism. Java leans on inheritance happily. Relational databases, on the
other hand, have never heard of it. A table is a flat grid of rows and columns — there is no "this table
is a kind of that table." So the moment your `Book` and `Magazine` both want to live under a common
`Publication` parent in Java, you hit a wall: how does a hierarchy of *classes* become a layout of
*tables*?

The mental model to hold the whole time: **JPA can't change the database, so it offers you a few
different ways to flatten a class tree into tables — and each one trades query speed against
normalization.** There's no single right answer. The strategy you pick changes the actual tables
Hibernate creates and the SQL it runs, so the choice is about *how you'll query*, not about taste.

And inheritance isn't the only "compound" shape you'll want. Sometimes you have a clump of fields —
street, city, zip — that belong together but don't deserve their own table or their own identity. That's
what **embeddables** are for, and they're the tool you'll actually reach for far more often than
inheritance. We'll get there at the end, because it's the most important idea in this phase.

## The challenge: a hierarchy that has to land somewhere

Let's set up a small, honest "is-a" hierarchy. A library holds **publications**. A `Book` is a
publication, and so is a `Magazine`. They share a title and a year, but each has its own extra field:

```java
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Inheritance;
import jakarta.persistence.InheritanceType;

@Entity
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
public abstract class Publication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private int year;

    // constructors, getters, setters...
}
```
```java
@Entity
public class Book extends Publication {
    private String isbn;          // only Books have this
    // ...
}

@Entity
public class Magazine extends Publication {
    private int issueNumber;      // only Magazines have this
    // ...
}
```

*What just happened:* `Publication` is marked `@Entity` *and* `@Inheritance`, which tells JPA "this is the
root of a mapped hierarchy — expect subclasses." Both `Book` and `Magazine` are entities that `extend` it,
so they inherit the `id`, `title`, and `year` mapping for free, exactly like ordinary Java inheritance.
The one new knob is `@Inheritance(strategy = ...)`. That single attribute decides how all of this lands in
the database — and that's the whole topic of this phase.

📝 **`@Inheritance`** — the annotation on the root entity that selects a mapping strategy for the whole
hierarchy. There are three: `SINGLE_TABLE` (the default), `JOINED`, and `TABLE_PER_CLASS`. You set it once,
on the parent.

## `SINGLE_TABLE` — one table for the whole family

📝 **`SINGLE_TABLE`** — every class in the hierarchy shares **one** table. The columns are the *union* of
all fields from the parent and every subclass, plus one extra **discriminator column** whose value records
which subclass each row actually is.

This is the default, and it's the default for a reason: it's the fastest. Here's the table Hibernate
generates for our `Publication` hierarchy:

```sql
CREATE TABLE publication (
    dtype         VARCHAR(31)  NOT NULL,   -- the discriminator
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    title         VARCHAR(255),
    year          INTEGER,
    isbn          VARCHAR(255),            -- only used by Book rows
    issue_number  INTEGER,                 -- only used by Magazine rows
    PRIMARY KEY (id)
);
```

*What just happened:* one table, `publication`, holds *everything*. The `dtype` column ("discriminator
type") gets the value `Book` or `Magazine` so Hibernate knows which class to rebuild when it reads a row. A
`Book` row fills in `isbn` and leaves `issue_number` null; a `Magazine` row does the reverse. Loading any
publication is a single-row read with no joins — which is why queries against this layout fly.

⚠️ **The tradeoff: nullable columns.** Look at that table again. A `Book` row *cannot* fill in
`issue_number`, and a `Magazine` row *cannot* fill in `isbn` — those columns sit null for half the rows.
And here's the sharp edge: **a subclass field can never be `NOT NULL`** in a single table, because the
*other* subclass's rows have nothing to put there. So `SINGLE_TABLE` quietly costs you database-level "this
field is required" constraints on anything specific to a subclass. The more subclasses you add, the wider
and sparser the table gets.

💡 Reach for `SINGLE_TABLE` (or just accept the default) when read performance matters, the subclasses
don't differ by much, and you don't need hard `NOT NULL` constraints on subclass-only fields. For a great
many hierarchies, that's the right call.

## `JOINED` — a table per class, stitched by key

📝 **`JOINED`** — the parent gets a table for the *shared* fields, and **each subclass gets its own table**
for *its* extra fields. The subclass tables share the parent's primary key, and Hibernate `JOIN`s them back
together when it loads a row.

```java
@Entity
@Inheritance(strategy = InheritanceType.JOINED)
public abstract class Publication {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String title;
    private int year;
}
```

That produces three clean tables instead of one wide one:

```sql
CREATE TABLE publication (
    id     BIGINT       NOT NULL AUTO_INCREMENT,
    title  VARCHAR(255),
    year   INTEGER,
    PRIMARY KEY (id)
);

CREATE TABLE book (
    id    BIGINT       NOT NULL,           -- same id as the parent row
    isbn  VARCHAR(255) NOT NULL,           -- now this CAN be NOT NULL
    PRIMARY KEY (id),
    FOREIGN KEY (id) REFERENCES publication (id)
);

CREATE TABLE magazine (
    id            BIGINT  NOT NULL,
    issue_number  INTEGER NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (id) REFERENCES publication (id)
);
```

*What just happened:* the shared `title`/`year` live once in `publication`, and each subclass's extra field
lives in its own slim table keyed by the *same* `id`. A `Book` is really two rows that share an id — one in
`publication`, one in `book` — joined on read. Notice `isbn` and `issue_number` are now `NOT NULL`: because
each subclass owns its table, a required field can actually be required. No wasted nulls, fully normalized.

The cost is right there in the name: **reading a `Book` means a join** (`publication` ⋈ `book`), and a
polymorphic query like "all publications" joins to *every* subclass table. More tables, more joins, slower
reads than `SINGLE_TABLE`.

💡 Prefer `JOINED` when the data model matters more than raw speed: subclasses have many distinct fields,
you want real `NOT NULL` constraints and a clean normalized schema, and the join cost is acceptable. It's
the database purist's choice.

## `TABLE_PER_CLASS` — a full table per concrete class

📝 **`TABLE_PER_CLASS`** — each *concrete* class gets a complete, standalone table holding both inherited
and own fields, with no shared parent table; a query across the hierarchy becomes a `UNION` of all those
tables, which is the downside that makes it the least-used of the three.

## Embeddables — folding a value object into the table

Now the idea you'll use constantly. Step away from inheritance entirely.

📝 **Embeddable** — a value object with *no identity of its own*. It's a small class whose fields become
**columns of the owning entity's table** — not a separate row, not a separate table. You mark the class
`@Embeddable` and the field that holds one `@Embedded`. Think `Address`, `Money`, `Dimensions`: things that
are *part of* an entity, not entities in their own right.

Here's an `Address` value object embedded into an `Author`:

```java
import jakarta.persistence.Embeddable;

@Embeddable
public class Address {
    private String street;
    private String city;
    private String zip;

    // constructors, getters, setters...
}
```
```java
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;

@Entity
public class Author {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Embedded
    private Address address;      // not a separate table — its fields land here

    // constructors, getters, setters...
}
```

*What just happened:* `Address` is `@Embeddable`, so it has no `@Id` and no table of its own. When `Author`
holds one via `@Embedded`, Hibernate *inlines* the address's three fields straight into the `author` table:

```sql
CREATE TABLE author (
    id      BIGINT       NOT NULL AUTO_INCREMENT,
    name    VARCHAR(255),
    street  VARCHAR(255),         -- from Address
    city    VARCHAR(255),         -- from Address
    zip     VARCHAR(255),         -- from Address
    PRIMARY KEY (id)
);
```

One table, one row per author, with the address columns sitting right alongside `name`. In Java you get a
tidy `author.getAddress().getCity()`; in SQL it's all flat. You got the grouping *for free* — no join, no
extra table.

**Contrast with `@Entity`.** An entity *has identity* (an `@Id`), lives in its own table, and can be
referenced and shared. An embeddable has *none* of that: it's owned wholly by its parent row, lives and
dies with it, and two authors with the "same" address have two separate copies of those column values. If you
ever need to ask "give me that address by id" or share one address across rows, you've outgrown an
embeddable and want a real entity with a relationship (Phase 5).

💡 **`@ElementCollection` for a *collection* of values.** When you want many simple values or many
embeddables attached to one entity — say, a set of an author's `phoneNumbers`, or a list of `Address`es —
mark the field `@ElementCollection`. Hibernate puts them in a small **side table** keyed back to the owner,
without making them full entities. It's the embeddable idea, one-to-many.

Two pieces of honest guidance to take away:

- 💡 **Reach for embeddables to group related fields** without spinning up a separate table. They keep your
  Java model expressive (`Money`, `Address`, `Dimensions`) while the database stays flat and fast.
- 💡 **Choose the inheritance strategy by your query patterns:** `SINGLE_TABLE` when you read a lot and want
  speed, `JOINED` when normalization and real constraints matter more than join cost.

⚠️ **Inheritance is over-used — prefer composition and embeddables.** Just as in plain Java (Phase 6), the
classic mistake is building a class hierarchy where you didn't need one. Mapped inheritance adds real
complexity to every query and migration. Only model an `@Inheritance` hierarchy when there's a genuine,
stable **"is-a"** relationship you'll actually query polymorphically. The rest of the time, group fields
with an embeddable or model a relationship between entities — those are almost always the simpler, sturdier
choice.

## Recap

1. Relational tables have no inheritance, so **`@Inheritance`** on the root entity picks how a Java class
   hierarchy is flattened into tables — the choice drives the SQL, so decide by query patterns.
2. **`SINGLE_TABLE`** (the default) puts the whole hierarchy in one table with a discriminator column;
   fastest to read, but subclass-only fields must be nullable, so you lose `NOT NULL` on them.
3. **`JOINED`** gives the parent and each subclass its own table joined by shared primary key — normalized,
   allows real `NOT NULL` constraints, but every read costs a join.
4. **`TABLE_PER_CLASS`** gives each concrete class a full standalone table; polymorphic queries become a
   `UNION`, which is why it's the least-used strategy.
5. An **`@Embeddable`** is a value object with no identity whose fields become **columns of the owning
   entity's table** (`@Embedded`) — contrast with `@Entity`, which has its own id and table.
   `@ElementCollection` stores a collection of such values in a side table.
6. ⚠️ Inheritance is often over-used; prefer **composition/embeddables** unless a real "is-a" hierarchy
   exists.

## Quick check

Test yourself on the distinctions most likely to bite you in real mapping code:

```quiz
[
  {
    "q": "With `InheritanceType.SINGLE_TABLE`, why can't a field that only exists on a subclass be `NOT NULL` in the database?",
    "choices": [
      "Because the whole hierarchy shares one table, so rows of other subclasses have nothing to put in that column and would violate NOT NULL",
      "Because Hibernate forbids NOT NULL on any inherited field",
      "Because the discriminator column already enforces nullability for you",
      "Because SINGLE_TABLE stores subclass fields in a separate side table"
    ],
    "answer": 0,
    "explain": "SINGLE_TABLE merges every class into one table whose columns are the union of all fields. A subclass-only column is irrelevant to other subclasses' rows, which leave it null — so it cannot be NOT NULL. That lost constraint is the main tradeoff for the strategy's read speed."
  },
  {
    "q": "What is the key cost of `InheritanceType.JOINED` compared to `SINGLE_TABLE`?",
    "choices": [
      "It can't generate a schema automatically",
      "Reading an entity requires joining the parent table to the subclass table(s), so reads are slower",
      "It erases the discriminator so you can't tell subclasses apart",
      "It forces every subclass field to be nullable"
    ],
    "answer": 1,
    "explain": "JOINED stores shared fields in the parent table and each subclass's fields in its own table keyed by the same id, so loading a row means a join (and polymorphic queries join across all subclass tables). You gain normalization and real NOT NULL constraints; you pay in join cost on reads."
  },
  {
    "q": "How does an `@Embeddable` value object like `Address` differ from a separate `@Entity`?",
    "choices": [
      "An embeddable gets its own table and primary key; an entity does not",
      "They're identical — @Embeddable is just an alias for @Entity",
      "An embeddable has no identity of its own and its fields become columns of the owning entity's table; an entity has an @Id and its own table",
      "An embeddable can be shared across many rows by reference, but an entity cannot"
    ],
    "answer": 2,
    "explain": "An embeddable is a value object with no @Id and no table of its own — its fields are inlined as columns into the owner's table. An entity has identity (an @Id), lives in its own table, and can be referenced and shared. Reach for an embeddable to group related fields without a separate table."
  }
]
```

---

[← Phase 7: Querying: JPQL, Criteria & Native SQL](07-querying-jpql-criteria.md) · [Guide overview](_guide.md) · [Phase 9: Caching & Performance →](09-caching-and-performance.md)