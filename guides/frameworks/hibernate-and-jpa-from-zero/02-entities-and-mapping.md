---
title: "Entities & Basic Mapping"
guide: "hibernate-and-jpa-from-zero"
phase: 2
summary: "How a plain Java class becomes a database table: @Entity, @Id and key generation, @Column and @Table mapping, how Java types map to SQL, and letting Hibernate generate the schema."
tags: [hibernate, jpa, entity, id, generatedvalue, column, table, mapping]
difficulty: beginner
synonyms: ["jpa entity annotation", "jpa @Id @GeneratedValue", "hibernate column mapping", "jpa @Table @Column", "jpa primary key generation strategy", "hibernate entity to table", "jpa basic types mapping"]
updated: 2026-07-10
---

# Entities & Basic Mapping

In Phase 1 you saw the big idea: an ORM lets you work with Java objects and quietly keeps a database
table in sync underneath. This phase is where that promise gets concrete. We take an ordinary Java
class — a `Book` — and teach Hibernate to treat it as a row in a table, and see how a class becomes a
table, a field becomes a column, and how to nudge any of that when the defaults aren't what you want.

The mental model to hold the whole time: **the entity class is the map between two worlds.** On one
side, Java objects in memory. On the other, rows in a SQL table. Everything in this phase is you
drawing that map — and Hibernate following it in both directions.

We're keeping it deliberately small here. Our domain across this guide is `Author`, `Book`, and
`Review`, but relationships between them don't arrive until [Phase 5](05-mapping-relationships.md). For
now, `Book` stands alone — just its own data, mapped to its own table.

## `@Entity` — marking a class as a table

📝 **`@Entity`** — an annotation you put on a class to tell JPA "instances of this class correspond to
rows in a database table." That single annotation is what flips a normal class into something Hibernate
will load, save, and track.

Here's our `Book`, stripped to the bone:

```java
import jakarta.persistence.Entity;
import jakarta.persistence.Id;

@Entity
public class Book {

    @Id
    private Long id;

    private String title;
    private String isbn;
    private int publishedYear;

    // JPA needs this no-arg constructor
    public Book() {
    }

    public Book(String title, String isbn, int publishedYear) {
        this.title = title;
        this.isbn = isbn;
        this.publishedYear = publishedYear;
    }

    // getters and setters omitted for brevity
}
```

*What just happened:* `@Entity` told JPA that `Book` is mapped to a table. By default the table is named
after the class — `Book` → a table called `book` (or `Book`, depending on the database). Each field
becomes a column, also by name: `title`, `isbn`, `publishedYear`. We haven't written a line of SQL, yet
Hibernate now knows enough to read and write `Book` rows.

⚠️ **Entities are mutable classes, not records.** It's tempting to reach for a Java `record` here — it's
concise and immutable, perfect for a data holder. But JPA can't use records as entities. It needs a
**no-arg constructor** and a **non-final class with non-final fields**, and a record gives you none of
those. The reason is mechanical: Hibernate constructs a *blank* `Book` with `new Book()` and then fills
the fields in one by one as it reads a row — it can't do that if the only constructor demands all the
values up front. It also sometimes wraps your entity in a **proxy** (a generated subclass used for lazy
loading, which you'll meet in [Phase 6](06-fetching-and-n-plus-1.md)), and you can't subclass a final
class. So entities stay plain, mutable classes with a no-arg constructor. That's not Hibernate being
old-fashioned; it's the price of the magic.

> 💡 You can keep the no-arg constructor `protected` rather than `public` if you'd rather callers didn't
> use it directly — Hibernate only needs to be able to reach it via reflection, and `protected` is
> enough.

## `@Id` and key generation

Every row in a relational table needs a way to be uniquely identified — its **primary key**. JPA
mirrors that exactly: every entity needs a field marked `@Id`.

📝 **`@Id`** — marks the field that is the entity's primary key. It's the identity of the object in the
database; Hibernate uses it to know whether two rows are "the same record."

In the example above we marked `id` with `@Id` but left it to us to assign. That works, but it's a
chore — you'd have to invent a unique number every time you create a `Book`. The usual move is to let
the database (or Hibernate) generate the key for you:

```java
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Book {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String isbn;
    private int publishedYear;

    // constructors, getters, setters...
}
```

*What just happened:* `@GeneratedValue` says "don't make me supply the id — generate it." The `strategy`
chooses *how*. With `IDENTITY`, you leave `id` null when you create a new `Book`; the database fills it
in on insert (using an auto-increment column), and Hibernate reads the generated value back out
afterward.

The strategy you pick changes the actual SQL Hibernate sends, so it's worth knowing the three you'll
meet:

- **`IDENTITY`** — the database owns the counter (an auto-increment / `IDENTITY` column). The id only
  exists *after* the `INSERT` runs, because the database assigns it. Simple and common (MySQL,
  PostgreSQL `SERIAL`), but it has a subtle cost: Hibernate can't batch inserts well, because it must
  run each insert immediately to learn the new id.
- **`SEQUENCE`** — the database has a separate **sequence** object whose only job is handing out
  numbers. Hibernate asks the sequence for the next id *before* inserting, so it knows the id up front
  and can batch inserts together. This is the preferred strategy on databases that support sequences
  (PostgreSQL, Oracle).
- **`AUTO`** — "you decide, Hibernate." It picks a strategy based on the database. Convenient, but
  you're handing the choice to a default you can't see, so once you care about performance, name the
  strategy explicitly.

💡 If you're on PostgreSQL or Oracle and have any volume of inserts, prefer `SEQUENCE` — the ability to
batch is a real performance win. On MySQL, `IDENTITY` is the natural fit. When in doubt early on, `AUTO`
is fine; just don't be surprised later when the generated SQL looks different than a teammate's on
another database.

## Column and table mapping

So far we've leaned entirely on defaults: class name → table name, field name → column name. Most of the
time that's exactly what you want. When it isn't, two annotations let you take over.

📝 **`@Column`** customizes how a single field maps to its column — the name, whether it can be null, its
length, whether it must be unique. **`@Table`** customizes the table the whole entity maps to — most
often just its name.

Here's `Book` with the mapping spelled out:

```java
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "books")
public class Book {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(name = "isbn_13", length = 13, unique = true)
    private String isbn;

    @Column(name = "published_year", nullable = false)
    private int publishedYear;

    // constructors, getters, setters...
}
```

*What just happened:* we renamed the table to `books` with `@Table`. We told Hibernate `title` can't be
null and caps at 200 characters. We mapped the `isbn` field to a column actually called `isbn_13`, made
it 13 characters, and marked it `unique` so no two books can share an ISBN. And `publishedYear` (Java's
camelCase) now lands in a column named `published_year` (SQL's usual snake_case). The Java names and the
SQL names no longer have to match — the annotations are the translation layer.

Those annotations aren't just runtime hints; they describe a real table. If you let Hibernate generate
the schema (next section), this is the DDL it would produce from the class above:

```sql
CREATE TABLE books (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    title         VARCHAR(200) NOT NULL,
    isbn_13       VARCHAR(13),
    published_year INTEGER     NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (isbn_13)
);
```

*What just happened:* read it side by side with the entity and the mapping clicks into place.
`@Id @GeneratedValue(IDENTITY)` became the `BIGINT ... AUTO_INCREMENT` primary key. `nullable = false`
became `NOT NULL`. `length = 200` became `VARCHAR(200)`. The `@Column(name = ...)` values became the
real column names, and `unique = true` became a `UNIQUE` constraint. The entity class and this table are
two views of the same thing.

## Basic type mapping

You may have noticed we never told Hibernate that `title` is text and `publishedYear` is a number — it
just knew. That's because JPA has built-in rules for mapping common Java types to SQL types. The ones
you'll use constantly:

| Java type | SQL type (typical) |
|-----------|--------------------|
| `String` | `VARCHAR` |
| `int` / `Integer` | `INTEGER` |
| `long` / `Long` | `BIGINT` |
| `boolean` / `Boolean` | `BOOLEAN` (or a 0/1 column) |
| `double` / `BigDecimal` | `DOUBLE` / `NUMERIC` |
| `LocalDate` | `DATE` |
| `LocalDateTime` | `TIMESTAMP` |

For these, you write the field and Hibernate handles the rest. Two cases need a small hint from you:

**Enums** map either as a number or as text, and you choose with `@Enumerated`:

```java
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;

public enum Format { HARDCOVER, PAPERBACK, EBOOK }

@Enumerated(EnumType.STRING)   // store the name "PAPERBACK", not the position 1
private Format format;
```

*What just happened:* `@Enumerated(EnumType.STRING)` tells Hibernate to store the enum's *name* as text
in the column. The alternative, `EnumType.ORDINAL`, stores the enum's *position* (0, 1, 2…) as a number.
⚠️ Strongly prefer `STRING`. With `ORDINAL`, reordering your enum constants or inserting a new one in the
middle silently changes what every existing row means — a `1` that meant `PAPERBACK` yesterday might
mean something else tomorrow. `STRING` survives reordering because the name, not the position, is what's
stored.

**Skipping a field** entirely uses `@Transient`:

```java
import jakarta.persistence.Transient;

@Transient
private int cachedWordCount;   // computed in memory, never stored
```

*What just happened:* `@Transient` tells JPA "this field is not part of the mapping — don't give it a
column, don't load it, don't save it." Use it for values you compute on the fly or hold temporarily but
never want persisted. (Don't confuse it with Java's own `transient` keyword, which is about
serialization — `@Transient` is the JPA annotation, and that's the one Hibernate reads.)

## Schema generation with `hibernate.hbm2ddl.auto`

You've now seen entities turn into DDL twice. Hibernate can do that for you automatically — read your
entities at startup and create or update the matching tables.

📝 **`hibernate.hbm2ddl.auto`** — a configuration setting that controls whether (and how) Hibernate
generates database schema from your entities when the app starts. The values you'll see:

- **`create`** — drop all the mapped tables and recreate them from scratch on every startup. Clean slate
  each run. Everything in those tables is erased.
- **`create-drop`** — like `create`, and also drop them again when the app shuts down. Handy for tests.
- **`update`** — compare your entities to the existing tables and apply additive changes (e.g. add a new
  column for a new field). It never deletes or alters existing columns, so it drifts over time.
- **`validate`** — change nothing; just check that the tables match your entities and fail fast at
  startup if they don't. Great as a safety net.
- **`none`** — do nothing. You manage the schema yourself.

You set it in `persistence.xml` or your Spring config, for example:

```console
hibernate.hbm2ddl.auto = update
```

*What just happened:* with `update`, you can add a `pageCount` field to `Book`, restart, and Hibernate
adds the matching column for you — no hand-written `ALTER TABLE`. During development that feedback loop
is wonderful: change the class, restart, the schema follows.

💡 For local development and quick experiments, `create` or `update` is genuinely great — it removes
schema busywork while you're still shaping your model.

⚠️ **Never use `create` or `update` in production.** `create` would erase your real data on every
deploy. `update` is safer but still untrustworthy: it silently ignores column type changes, can't rename
or drop anything, and gives you no record of what changed — so your schema slowly drifts in ways nobody
reviewed. In production you control schema changes deliberately, with **migrations** (versioned,
reviewed SQL scripts via tools like Flyway or Liquibase). We cover that properly in
[Phase 10](10-where-to-go-next.md). A common, sane setup is `validate` in production: Hibernate changes
nothing but refuses to start if the live schema and your entities have drifted apart.

The throughline of this whole phase: **the entity class is the single source of truth for the mapping.**
Whether Hibernate generates the table for you or you write the migration by hand, the annotations on
your `Book` define what a `Book` *is* in both worlds. Get the entity right and everything downstream —
queries, saves, the generated SQL — follows from it.

## Recap

1. **`@Entity`** marks a class as mapped to a table; by default the class name becomes the table name
   and each field becomes a column of the same name.
2. JPA entities must be **mutable, non-final classes with a no-arg constructor** — not records —
   because Hibernate constructs blank instances and may wrap them in proxies.
3. **`@Id`** marks the primary key, and **`@GeneratedValue`** generates it for you: `IDENTITY` (database
   auto-increment, id known after insert), `SEQUENCE` (sequence object, id known before insert, allows
   batching), or `AUTO` (Hibernate decides).
4. **`@Column`** customizes a field's column (`name`, `nullable`, `length`, `unique`) and **`@Table`**
   renames the table — together they're the translation layer between Java names and SQL names.
5. Common Java types map to SQL automatically (`String`→`VARCHAR`, `int`→`INTEGER`, `LocalDate`→`DATE`);
   use **`@Enumerated(EnumType.STRING)`** for enums and **`@Transient`** to skip a field.
6. **`hibernate.hbm2ddl.auto`** can generate the schema (`create`, `update`, `validate`, `none`) — great
   in dev, but never `create`/`update` in production; use migrations there. The entity is the single
   source of truth for the mapping.

## Quick check

Test yourself on the ideas most likely to trip you up in real mapping code:

```quiz
[
  {
    "q": "Why can't you use a Java `record` as a JPA entity?",
    "choices": [
      "Records are too new for Hibernate to recognize",
      "JPA needs a no-arg constructor and a non-final, mutable class so it can build a blank instance and possibly proxy it — records provide none of those",
      "Records can't have an @Id field",
      "Records map to multiple tables, which Hibernate forbids"
    ],
    "answer": 1,
    "explain": "Hibernate constructs an empty object with `new Book()` and fills fields in as it reads a row, and it may wrap the entity in a generated subclass (a proxy). A record has no no-arg constructor and is effectively final/immutable, so neither is possible."
  },
  {
    "q": "Your @Id uses `@GeneratedValue(strategy = GenerationType.IDENTITY)`. When does the id value exist?",
    "choices": [
      "Before the INSERT — Hibernate asks a sequence object for it first",
      "After the INSERT — the database assigns it via an auto-increment column and Hibernate reads it back",
      "As soon as you call `new Book(...)`",
      "Only after you commit the transaction"
    ],
    "answer": 1,
    "explain": "With IDENTITY, the database owns the counter via an auto-increment column, so the id only exists once the row is inserted. That's also why IDENTITY can't batch inserts well — each insert must run immediately to learn its id. SEQUENCE, by contrast, gets the id before inserting."
  },
  {
    "q": "Which `hibernate.hbm2ddl.auto` setting is the safe choice for production?",
    "choices": [
      "`create` — guarantees a clean, correct schema every deploy",
      "`update` — applies just the changes you need automatically",
      "`validate` — changes nothing but fails startup if the live schema and your entities have drifted apart",
      "`none` is the only acceptable value; any other risks data loss"
    ],
    "answer": 2,
    "explain": "`create` erases data every deploy and `update` silently ignores type changes and drifts. `validate` makes no changes and just checks the schema matches your entities, failing fast if not — a good safety net while you manage real changes with versioned migrations."
  }
]
```

---

[← Phase 1: What an ORM Is & Why Hibernate Exists](01-what-an-orm-is.md) · [Guide overview](_guide.md) · [Phase 3: The EntityManager & Persistence Context →](03-entitymanager-and-persistence-context.md)