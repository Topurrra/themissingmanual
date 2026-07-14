---
title: "Database Backups and Restores"
guide: "database-backups-and-restores"
phase: 0
summary: "A backup you have never restored is a hope, not a backup. Logical versus physical dumps, point-in-time recovery, and testing the restore."
tags: [databases, backups, restore, disaster-recovery, point-in-time-recovery, rpo, rto]
category: databases
order: 13
difficulty: intermediate
synonyms: ["how to back up a database", "logical vs physical backup", "point in time recovery postgres", "what is rpo and rto", "3-2-1 backup rule", "pg_dump vs snapshot", "how to test a database restore", "my backup job wrote empty files", "database disaster recovery"]
updated: 2026-07-10
---

# Database Backups and Restores

Everyone backs up their database. Almost nobody restores it - until the morning a bad `DELETE`, a
dropped table, or a dead disk forces the question, and the plain answer is *we think we have backups*.
That gap between "we have backups" and "we have proven we can get the data back" is where companies
quietly die. A backup you have never restored is not a safety net; it is a hope you wrote to disk.

This guide closes that gap: the mental model that the *restore* is the real product and the backup is
only its raw material, the three ways data actually gets backed up and when each fits, and the failures
that turn a backup strategy into a false sense of security - so next time it matters, you're running a
rehearsed procedure instead of improvising in front of an audience.

## How to read this

- **In an incident right now and need the data back?** Jump to
  [Phase 3: When It Breaks](03-when-it-breaks.md) for the restore-day checklist and the failure modes
  to rule out fast.
- **Want backups to stop being a black box?** Read in order. Phase 1 reframes what a backup is *for*,
  Phase 2 covers the three backup types and point-in-time recovery, Phase 3 covers testing, drills, and
  the ways it all goes wrong.

## The phases

1. **[The Restore Is the Real Thing](01-the-restore-is-the-real-thing.md)** - the mental model: a
   backup exists only to be restored, so the restore is the thing you measure and test. RPO and RTO in
   plain terms, and why "we have backups" is a sentence with no information in it.
2. **[The Three Kinds of Backup](02-the-three-kinds-of-backup.md)** - logical dumps versus physical
   snapshots versus the write-ahead log, what each gives you, and how the WAL unlocks point-in-time
   recovery so you can rewind to the second before the bad command.
3. **[When It Breaks](03-when-it-breaks.md)** - the cautionary tale of the backup job that wrote empty
   files for months, the 3-2-1 rule, and how to automate, verify, and *drill* the restore so it works
   the day you need it.

**Related:** [What a Database Is](/guides/what-a-database-is) ·
[Transactions and ACID](/guides/transactions-and-acid)

[Phase 1: The Restore Is the Real Thing](01-the-restore-is-the-real-thing.md) →
