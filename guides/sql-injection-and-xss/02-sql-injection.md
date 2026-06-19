---
title: "SQL Injection"
guide: "sql-injection-and-xss"
phase: 2
summary: "A query built by gluing strings together lets user input rewrite what the query does — reading, changing, or destroying data. The real fix is parameterized queries: hand the database the SQL and the values on separate channels so input is always treated as a value, never as SQL."
tags: [security, sql-injection, parameterized-queries, prepared-statements, orm, databases]
difficulty: intermediate
synonyms: ["how does sql injection work", "how to prevent sql injection", "what is a parameterized query", "what is a prepared statement", "why not concatenate sql strings", "does an orm prevent sql injection", "sql injection example"]
updated: 2026-06-19
---

# SQL Injection

Here is the first interpreter from Phase 1: your database. It speaks SQL, and SQL is *code* — `SELECT`,
`WHERE`, `DROP` are all instructions it executes. SQL injection is what happens when user input you meant as
a *value* in a query gets read as more of that code.

If you read Phase 1, you already know the cause (gluing user input into a string) and the cure (keep data as
data). This phase makes both concrete: we'll watch a normal query quietly turn into a different query, see
what that hands an attacker, then build the query the right way so it can never happen.

> ⏭️ Shaky on what a `SELECT ... WHERE` query is or how `WHERE` filters rows? A quick read of
> [Querying Basics: SELECT & WHERE](/guides/querying-basics-select-where) will make this phase land harder.

## How a query loses control of its own meaning

Picture a login form. The app takes the username someone typed and looks them up. The tempting,
everywhere-you-look way to write that is to build the SQL string by concatenation:

```text
   query = "SELECT * FROM users WHERE username = '" + input + "'"
            └──────────── your code ───────────────┘  └input┘ └┘
                                                       glued straight in
```

Type the username `alice` and you get exactly the query you intended:

```sql
SELECT * FROM users WHERE username = 'alice'
```

*What just happened:* The database sees `'alice'` as a single text value sitting inside the quotes, compares
it against the `username` column, and returns Alice's row. Working as designed — because Alice's input
behaved like the plain data you assumed it was.

Now watch what a probing attacker types instead of a username. They include a single quote — the exact
character that *ends a text value in SQL*:

```sql
SELECT * FROM users WHERE username = '' OR '1'='1'
```

*What just happened:* The leading `'` closed your `username` string early. Everything the attacker typed
after it — `OR '1'='1'` — landed *outside* the quotes, so the database read it as **more SQL**, not as part
of the value. And `'1'='1'` is always true, so the `WHERE` now matches *every* row. The query you wrote to
fetch one user just returned the whole table. The boundary between your code and their data was only in your
head; the database never saw it.

⚠️ **Gotcha — the danger isn't the quote character, it's that input reached the parser as code.** It's
tempting to conclude "so I'll just strip out quotes." Don't. That's a blocklist, and blocklists lose: numeric
contexts need no quote at all, different databases have different escape and comment syntax, and attackers
have decades of tricks for smuggling the same meaning past a filter. The hole isn't one bad character — it's
that the value got parsed as SQL at all. Close *that*, and you stop playing whack-a-mole forever.

## What this actually costs you

That "always true" trick is the gentle illustration — enough to *see* the bug. In the wild, once input can
extend a query, the same mechanism lets an attacker:

- **Read data they should never see** — dump other users' rows, password hashes, private records.
- **Change data** — flip their own account to admin, alter balances, rewrite records.
- **Destroy data** — and yes, depending on how the app connects, run a statement that deletes a table.

This is consistently rated among the most damaging web vulnerabilities precisely because the payoff is your
*entire database*. SQL injection sits inside the **Injection** category of [The OWASP Top 10](/guides/owasp-top-10),
the industry's standard list of the risks worth defending first.

🪖 **War story — "Exploits of a Mom."** There's a famous xkcd comic (#327) where a mother names her son
`Robert'); DROP TABLE Students;--`. A school's system glues that name straight into a SQL statement, the `'`
and `)` close the intended command, the `DROP TABLE` runs, and the student records are gone. It's a joke, but
it's a *real* bug — and the punchline is the lesson: the name was data, the system let it become code.

## The fix: parameterized queries (a separate channel for values)

Here's the cure, and it's the Phase 1 sentence made literal. Instead of building one string that mixes your
SQL with their value, you hand the database **two separate things**:

1. The SQL, with a **placeholder** where the value goes (often `?` or `$1` or `:name`).
2. The actual value, passed alongside — separately.

The database compiles the SQL *first*, with the placeholder standing in for "a value goes here." The query's
structure is now locked. *Then* you give it the value, and it slots that value into the placeholder as
**pure data** — it never re-parses it as SQL. There is no string for the attacker's quote to break out of,
because your code and their value were never glued into the same string.

📝 **Terminology — parameterized query / prepared statement.** Mostly used interchangeably. A *prepared
statement* is SQL sent to the database with placeholders so it can plan the query once; a *parameterized
query* is any query where you pass values through placeholders instead of concatenating them in. The thing
that matters for security is the same: **SQL and values travel on separate channels.**

```text
   CONCATENATION (the hole)              PARAMETERIZED (the fix)

   ┌──────────────────────────┐         ┌────────────────────────┐
   │ SQL + value  → one string│         │ SQL with ?  ───────────┼──► DB compiles
   └────────────┬─────────────┘         └────────────────────────┘    structure first
                ▼                        ┌────────────────────────┐
        DB parses the whole              │ value ─────────────────┼──► slotted in
        string as SQL — value            └────────────────────────┘    as pure data,
        can redraw the query                                           never parsed as SQL
```

Here's the same login lookup, done right. (This example is Python with the standard `sqlite3` library; every
mainstream language and database driver has the identical pattern — only the placeholder character changes.)

```console
>>> username = "' OR '1'='1"          # the exact attack from before
>>> cur.execute(
...     "SELECT * FROM users WHERE username = ?",   # placeholder, not concatenation
...     (username,)                                 # value passed separately
... )
>>> cur.fetchall()
[]
```

*What just happened:* The driver sent the SQL (`... WHERE username = ?`) and the value (`' OR '1'='1`) on
separate channels. The database looked for a user whose username is *literally the string* `' OR '1'='1` —
quotes, spaces, and all. No such user exists, so it returned nothing. The attack didn't get blocked or
sanitized; it *never had a chance to be code*. That's the difference between fighting bad input and
making it irrelevant.

⚠️ **Gotcha — placeholders are for values, not for structure.** Parameters fill in *values* (a username, an
id, a price). You cannot parameterize a table name, a column name, or the `ASC`/`DESC` in an `ORDER BY` —
those are part of the query's structure, which the database compiles before the values arrive. If you must
let users influence structure (say, which column to sort by), never concatenate their raw text in. Instead,
map their choice against an **allowlist** of values you control: if the input isn't one of your known-good
column names, reject it. That keeps you choosing from a fixed menu rather than trusting free text.

## ORMs and query builders help — but know what they're doing

You may not write raw SQL at all. An **ORM** (Object-Relational Mapper, like SQLAlchemy, Django's ORM,
Prisma, ActiveRecord) or a query builder lets you express queries in your language, and *underneath* it
parameterizes for you. That's genuinely good news: idiomatic ORM code is parameterized by default, so the
common path is safe without you thinking about it.

The catch is the escape hatch. Every ORM has a "drop down to raw SQL" feature for the queries it can't
express — and the moment you use it, you are back to writing SQL by hand, and back on the hook for
parameterizing it. If you build that raw string by concatenation, the ORM's protection does nothing for you.

```text
   ORM normal query        →  parameterized for you   ✅ safe
   ORM raw-SQL escape hatch →  YOUR responsibility     ⚠️ parameterize it yourself
```

💡 **Key point.** The rule has no exceptions worth remembering: **never assemble SQL by concatenating user
input.** Use parameterized queries everywhere — directly, or via an ORM that does it for you — and treat the
raw-SQL escape hatch as the one place you must consciously parameterize by hand.

## Why this saves you later

Once parameterized queries are *how you write queries*, SQL injection stops being a thing you defend
against case by case and becomes a thing that can't occur on your normal path. You're not auditing every
input for dangerous characters; you removed the channel through which input could ever be SQL. That's the
whole point of "keep data as data" — the safe way is also the easy, default way, so doing it right takes no
extra vigilance.

## Recap

1. SQL injection happens when **user input glued into a query string** is read as SQL, letting it change what
   the query *does*.
2. The classic tell is a value that **closes a quote** and adds clauses like `OR '1'='1'` — but the real
   problem is that input reached the parser as code at all, so **don't rely on filtering characters.**
3. The damage is your whole database: data **read, changed, or destroyed**. It's the core of the OWASP
   **Injection** risk.
4. **The fix is parameterized queries / prepared statements:** send the SQL (with placeholders) and the
   values on **separate channels**, so values are always treated as data, never SQL.
5. **ORMs parameterize for you** on the normal path — but the **raw-SQL escape hatch is your responsibility**.
   Never build SQL by concatenation. Placeholders are for *values*; gate structural choices with an
   **allowlist**.

Same model, second interpreter: now let's hand untrusted input to a *browser* and watch the identical bug
wear its other costume.

---

[← Phase 1: The One Bug Underneath Both](01-the-one-bug-underneath-both.md) · [Guide overview](_guide.md) · [Phase 3: Cross-Site Scripting (XSS) →](03-cross-site-scripting.md)
