---
title: "The One Bug Underneath Both: Mixing Data with Code"
guide: "sql-injection-and-xss"
phase: 1
summary: "SQL injection and XSS are the same bug: user input gets handed to a machine that reads it as instructions instead of as plain data. The cure for both is to keep a clean line between data and code."
tags: [security, injection, sql-injection, xss, mental-model, data-vs-code]
difficulty: intermediate
synonyms: ["why are sql injection and xss similar", "what causes injection vulnerabilities", "difference between data and code in security", "what is an injection attack", "keep data as data"]
updated: 2026-07-10
---

# The One Bug Underneath Both: Mixing Data with Code

Security guides usually hand you SQL injection and XSS as two separate chores: memorize this fix for the
database, memorize that fix for the web page, move on. That's why they never stick - they look unrelated, so
they feel like two more spells to keep straight.

They're not unrelated. They are the *same* bug. Once you see the shared cause, you'll be able to *predict*
both fixes instead of recalling them, and you'll start spotting the same shape in places this guide never
even mentions.

## The one idea: data should never be able to become code

Every program constantly juggles two different kinds of strings:

- **Code** - instructions the machine *executes*. SQL statements. HTML and JavaScript a browser runs.
- **Data** - values the program just *handles*. A username someone typed. A search term. A comment.

When you write a program, *you* write the code. Your users supply the data. That line - your instructions
vs. their values - is supposed to be a wall.

**An injection bug is a hole in that wall.** It happens when a value the user supplied gets fed to some
interpreter - a database, a browser - in a way that lets the value *escape* its role as data and get read as
*code* instead. The user stops being someone who fills in a blank and becomes someone who can rewrite your
program's instructions.

```text
  THE WALL THAT SHOULD HOLD                THE HOLE (injection)

  ┌─────────────┐                          ┌─────────────┐
  │  your code  │  ← you write this        │  your code  │
  ├─────────────┤                          ├─────────────┤
  │ user input  │  ← stays "just a value"  │ user input  │ ─┐ input crosses the
  └─────────────┘                          └─────────────┘  │ line and is read
        the interpreter sees a clear              the interpreter can't tell  │ as CODE
        boundary: code here, data there          where code ends and the     │
                                                 user's value begins  ◄──────┘
```

📝 **Terminology - "interpreter."** Anything that takes a string and acts on its meaning: a SQL database
reading a query, a web browser reading HTML, a shell running a command. Injection is always "untrusted input
reaching an interpreter as code." Different interpreter, different name - same bug.

## Why this keeps happening: the convenient, dangerous shortcut

Both holes are born the same way - by building a piece of code by **gluing strings together**, with user
input glued right in the middle:

```text
   "fixed instructions"  +  user_input  +  "more instructions"
   └──── your code ────┘    └─ their ─┘    └─── your code ───┘
                            └ value, but the interpreter only
                              sees one long string ──────────┘
```

When you concatenate like this, the boundary between *your* instructions and *their* value exists only in
your head. By the time the interpreter receives the string, that boundary is gone - it's just one run of
characters. If the user's value contains characters that *mean something* to the interpreter (a quote that
ends a SQL string, a `<` that starts an HTML tag), those characters do their job, and the value reshapes the
code around it.

That's the whole disease. SQL injection is this shortcut feeding a database. XSS is this shortcut feeding a
browser.

## The two costumes

The same bug, told twice:

| | SQL injection | Cross-Site Scripting (XSS) |
|---|---|---|
| The interpreter | Your database | A visitor's web browser |
| Code it confuses input for | SQL commands | HTML / JavaScript |
| What goes wrong | Input changes what the query *does* | Input becomes script the page *runs* |
| Who gets hurt | Your data (read, changed, deleted) | Your users (their session, their browser) |
| The shape of the fix | Send code and data on *separate channels* | *Encode* input so it can't be read as markup |

Two interpreters, two costumes - but look at the bottom row. Each fix is the same instinct applied to a
different interpreter: **stop letting the user's value be read as code.** For the database, you do that by
handing it the query and the values *separately*, so it never even tries to parse the value as SQL. For the
browser, you do it by *encoding* the value so the characters that mean "this is markup" arrive as harmless
text instead.

💡 **Key point - the one sentence to carry into both phases.** *Keep data as data.* You are never trying to
guess and block "bad input." You're making it structurally impossible for input to be treated as code in the
first place. Blocklists ("strip out the word `DROP`", "remove `<script>`") fail because attackers have
endless ways to write the same thing; keeping data on its own channel can't be tricked, because the
interpreter is never invited to parse the value as code at all.

⚠️ **Gotcha - "I'll just validate the input and I'm safe."** Input validation (rejecting an email that has
no `@`, capping a length) is good hygiene and worth doing. But it is *not* the fix for injection, and leaning
on it as the fix is how people get burned. Validation asks "does this look reasonable?" - a question with no
reliable answer for free-text fields like names, comments, or search terms, where `O'Brien` and `<3` are
perfectly legitimate. The real fixes in Phases 2 and 3 don't depend on predicting bad input; they keep the
data/code boundary intact no matter what the input contains.

## Why this saves you later

Hold this one model and the rest of the guide reads like consequences, not commandments: Phase 2's
"parameterize your queries" and Phase 3's "encode on output" are the same instinct, aimed at two different
interpreters. And the next time you wire *any* input into *any* interpreter - a shell command, an LDAP
filter, a file path - you'll feel the same alarm: keep data as data.

## Recap

1. Programs juggle **code** (instructions a machine runs) and **data** (values it just handles). The line
   between them is a wall.
2. **Injection is a hole in that wall** - user input reaching an interpreter in a way that lets it be read as
   *code* instead of *data*.
3. The usual cause is **building code by gluing strings together** with user input in the middle, which
   erases the boundary before the interpreter ever sees it.
4. SQL injection and XSS are the *same* bug aimed at two interpreters: the **database** and the **browser**.
5. The cure for both is one sentence: **keep data as data** - make it structurally impossible for input to
   become code, rather than trying to guess and filter "bad" input.

Now let's take the first interpreter - the database - and watch the wall come down, then build it back up
properly.

---

[← Guide overview](_guide.md) · [Phase 2: SQL Injection →](02-sql-injection.md)
