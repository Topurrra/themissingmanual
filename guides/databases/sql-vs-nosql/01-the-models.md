---
title: "The Relational Model & What 'NoSQL' Even Means"
guide: "sql-vs-nosql"
phase: 1
summary: "Relational means tables linked by relationships and queried with SQL; NoSQL is an umbrella over four different families — document, key-value, wide-column, and graph — each shaped for a different access pattern."
tags: [databases, relational, sql, nosql, document-database, key-value, wide-column, graph]
difficulty: intermediate
synonyms: ["what is a relational database", "what does nosql mean", "types of nosql databases", "document vs key-value vs graph database", "what is mongodb redis cassandra neo4j"]
updated: 2026-06-19
---

# The Relational Model & What "NoSQL" Even Means

Before you can compare two things fairly, you have to know what each one actually *is* — not
the marketing slogan, the real shape. The reason the SQL-vs-NoSQL argument goes in circles is
that one side names a single, well-defined model and the other side names *everything that
isn't that model*. Those aren't symmetric. Once you see why, the whole debate gets calmer.

This phase installs two mental models: what "relational" really means, and why "NoSQL" is a
category, not a product.

## The relational model — tables that know about each other

**What it actually is.** A relational database stores data in **tables**: rows and columns,
like a spreadsheet with rules. Each table holds one kind of thing (users, orders, products),
and tables are connected by shared values called **keys**. The "relational" part isn't about
the tables being related to *each other* casually — it's a specific math-backed model where a
table is a set of rows and you combine tables by matching keys.

> 📝 **Relation.** In this model, "relation" is the formal word for a table. So "relational
> database" literally means "a database built out of tables." The everyday relationships you
> care about (an order *belongs to* a user) are expressed by storing the user's key inside the
> order row.

**What it does in real life.** You describe your data once as a **schema** — the tables, their
columns, and the types those columns hold — and the database enforces it. Then you ask
questions in **SQL** (Structured Query Language), a declarative language where you say *what*
you want and the engine figures out *how* to get it.

```console
$ psql shop
shop=# SELECT u.name, o.total
shop-#   FROM users u
shop-#   JOIN orders o ON o.user_id = u.id
shop-#   WHERE o.total > 100;
    name     | total
-------------+--------
 Ada Lovelace| 149.00
 Alan Turing | 220.00
(2 rows)
```

*What just happened:* You asked one question that reached across two tables — "give me the name
and order total for every order over 100, with each order matched to the user who placed it."
The `JOIN ... ON o.user_id = u.id` is the relational model doing its core trick: stitching
rows from separate tables together by matching keys, on the fly, at query time. You stored
users and orders separately (no duplication), and the database recombined them when you asked.

> 📝 **Join.** Combining rows from two or more tables by matching a shared value. It's how
> relational databases answer "show me X *together with* its related Y" without storing Y
> inside X.

**Why this is the shape it is.** The relational model was a deliberate design choice: store
each fact in exactly one place, enforce its structure, and let a flexible query language
recombine facts however a future question demands. The payoff is **integrity** (the data can't
easily contradict itself) and **flexibility of questions** (you don't have to predict every
query in advance). The cost is that you commit to a schema and that joins do real work — both
things Phase 2 looks at honestly.

PostgreSQL, MySQL, SQLite, SQL Server, and Oracle are all relational databases. They differ in
features and scale, but they share this model.

## "NoSQL" — an umbrella, not a database

**What it actually is.** "NoSQL" is the worst-named idea in databases. It doesn't mean "no
SQL" (several NoSQL stores even support SQL-like queries). It started as "non-relational" and
is best read as **"not the relational model."** That's a definition by *absence* — which is
why it covers wildly different tools that have little in common with each other beyond "we
don't do tables-and-joins the relational way."

> ⚠️ **The trap to avoid.** Treating "NoSQL" as a single thing you can compare to SQL is like
> comparing "cars" to "non-cars" — where "non-cars" includes bicycles, boats, and helicopters.
> The useful comparison is always to a *specific* NoSQL family, for a *specific* job.

**The four families, and what each is shaped for.** Almost every NoSQL store falls into one of
four families. Here's the honest one-line version of each — what it is, and the problem it was
built to be good at.

```text
  FAMILY        STORES DATA AS              SHAPED FOR                 TYPICAL TOOL
  ----------    ------------------------    -----------------------    ------------
  Document      self-contained JSON-ish     flexible records you       MongoDB
                documents (a whole object   fetch and update as a
                per record)                 unit

  Key-value     a key → a blob, like a      blazing lookups by key;    Redis
                giant hash map              caching, sessions, counters

  Wide-column   rows grouped by key,        huge write volume across   Cassandra
                spread across many machines many machines, known
                                            query patterns

  Graph         nodes + edges (things and   relationships you traverse Neo4j
                the connections between them) deeply (friends-of-
                                            friends, recommendations)
```

Let's give each a sentence of real shape, because the differences matter more than the label.

**Document (e.g. MongoDB).** A record is a whole document — think a JSON object — and you store
related data *inside* it rather than splitting it across tables. One read gives you the entire
thing.

```console
$ mongosh
> db.users.findOne({ name: "Ada Lovelace" })
{
  _id: ObjectId("64f1a2..."),
  name: "Ada Lovelace",
  email: "ada@example.com",
  addresses: [
    { label: "home", city: "London" },
    { label: "work", city: "London" }
  ]
}
```

*What just happened:* You fetched one user and got their addresses in the same read — because
the addresses live *inside* the user document, not in a separate `addresses` table you'd have
to join. That's the document family's whole pitch: the shape you read is the shape you store,
so common reads are a single lookup. The cost (Phase 2) is that the same address data isn't
sitting in one canonical place the way a relational design would keep it.

**Key-value (e.g. Redis).** The simplest model: a key points to a value, like a dictionary.
You don't query *inside* the value; you get and set by key. It's built to be extremely fast at
exactly that.

```console
$ redis-cli
127.0.0.1:6379> SET session:abc123 "user=42; expires=3600"
OK
127.0.0.1:6379> GET session:abc123
"user=42; expires=3600"
```

*What just happened:* You stored and retrieved a value by its key, with no schema and no query
planning. There's no "find all sessions where..." — that's not what this shape is for. In
exchange for giving up rich queries, you get lookups that are about as fast as a database gets.
This is why key-value stores are the go-to for caches, sessions, and counters.

**Wide-column (e.g. Cassandra).** Data is grouped by a key and physically spread across many
machines, so you can absorb enormous write volume and grow by adding servers. The catch is
that you design your tables *around the queries you'll run* — you decide the access patterns up
front, and ad-hoc questions are awkward.

**Graph (e.g. Neo4j).** Data is nodes (things) and edges (the connections between them), and
the database is built to walk those connections fast. "Friends of friends who like jazz" is a
short, natural traversal here — the same question is a pile of expensive joins in a relational
store. If your *core* problem is relationships several hops deep, this shape earns its keep.

**Why these exist.** Each family is a deliberate trade: it gives up some of the relational
model's generality to be excellent at one access pattern. Document trades canonical-single-copy
for read-it-as-one-unit. Key-value trades querying for raw speed. Wide-column trades ad-hoc
flexibility for write scale. Graph trades table generality for deep-relationship traversal.
None of them is "SQL but better" — each is "different, on purpose."

## Recap

1. **Relational** = data in tables, connected by keys, with an enforced schema, queried with
   **SQL**, where **joins** recombine separate tables at query time. Built for integrity and
   flexible questions.
2. **NoSQL** is an umbrella meaning "not the relational model" — defined by absence, so it
   covers very different tools.
3. The four families: **document** (whole-object records, MongoDB), **key-value** (fast
   lookups by key, Redis), **wide-column** (write scale across machines, Cassandra), **graph**
   (deep relationship traversal, Neo4j).
4. Each family trades some of relational's generality to be excellent at one access pattern.

Now that you know the shapes, we can compare them fairly — which is the next phase.

---

[← Guide overview](_guide.md) · [Phase 2: The Honest Trade-offs →](02-the-trade-offs.md)
