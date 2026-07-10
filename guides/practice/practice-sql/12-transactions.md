---
title: "Transactions: all or nothing"
guide: practice-sql
phase: 12
summary: "Wrap two related UPDATEs in BEGIN and COMMIT so a balance transfer happens atomically, not as two independent writes."
tags: [sql, transaction, begin, commit, atomicity]
difficulty: advanced
synonyms:
  - sql transaction example
  - begin commit sql
  - atomic sql update
  - money transfer sql transaction
updated: 2026-07-10
---

# Transactions: all or nothing

Moving money between two accounts is never really one change - it's two:
subtract from one balance, add to the other. Run them as two separate,
independent statements and there's a gap between them where anything can go
wrong: a crash, a dropped connection, an error in your application code. If
the process dies after the first `UPDATE` but before the second, you've either
deleted money or duplicated it.

A transaction closes that gap. `BEGIN` opens a bundle of changes; `COMMIT`
makes every change in the bundle permanent at once. Nothing outside the
bundle - including a mid-transfer crash - can see it half-done. Either both
updates land, or neither does.

There's an `accounts` table: `id`, `name`, `balance`. Two rows - one with 100,
one with 50.

**Your task:** move 30 from account 1 to account 2 atomically, using
`BEGIN`/`COMMIT` around both updates, then select all accounts (ordered by
`id`) so there's something to check.

**You'll practice:**

- Wrapping multiple statements in `BEGIN` ... `COMMIT`
- Seeing that only the final `SELECT` gets graded, so the transfer has to
  actually run first

```lesson
{
  "language": "sql",
  "setup": "CREATE TABLE accounts (id INTEGER PRIMARY KEY, name TEXT, balance INTEGER);\nINSERT INTO accounts (id, name, balance) VALUES\n  (1, 'Alice', 100),\n  (2, 'Bob', 50);",
  "starterCode": "-- Move 30 from account 1 to account 2, atomically, then show both accounts.\nSELECT * FROM accounts;",
  "solution": "BEGIN TRANSACTION;\nUPDATE accounts SET balance = balance - 30 WHERE id = 1;\nUPDATE accounts SET balance = balance + 30 WHERE id = 2;\nCOMMIT;\nSELECT * FROM accounts ORDER BY id;",
  "hints": ["BEGIN TRANSACTION opens the bundle; COMMIT makes every change inside it permanent at once.", "Two UPDATEs - one subtracting 30 from account 1, one adding 30 to account 2 - go between BEGIN and COMMIT.", "Finish with SELECT * FROM accounts ORDER BY id - that's the query that actually gets checked."]
}
```
