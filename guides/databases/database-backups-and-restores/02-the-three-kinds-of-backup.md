---
title: "The Three Kinds of Backup"
guide: "database-backups-and-restores"
phase: 2
summary: "Logical dumps versus physical snapshots versus the write-ahead log, what each one gives you, and how the WAL unlocks point-in-time recovery to the second before the bad command."
tags: [databases, backups, logical-backup, physical-backup, wal, point-in-time-recovery, pg_dump]
difficulty: intermediate
synonyms: ["logical vs physical backup", "pg_dump vs snapshot", "what is a write ahead log backup", "point in time recovery how it works", "how does pitr work", "sql dump vs file copy", "continuous archiving wal"]
updated: 2026-07-10
---

# The Three Kinds of Backup

Phase 1 set two targets: RPO (how much data you can lose) and RTO (how long recovery can take). Now we
pick the machinery that hits them. There are three fundamentally different ways to capture a database's
state, trading off speed, portability, and how little data you lose. Know the three, and you stop
cargo-culting a `pg_dump` cron job and start choosing the right tool for your RPO.

We'll use Postgres-flavored commands because they're concrete and widely known, but the *categories* are
universal - MySQL, SQL Server, and the rest all have a logical export, a physical copy, and a transaction
log.

## Kind 1: the logical dump - a recipe to rebuild the database

A **logical backup** doesn't copy the database's files. It reads the data out and writes down the
*instructions* to recreate it: the `CREATE TABLE` statements and the `INSERT`s (or a compact equivalent)
that would rebuild everything from an empty database.

```console
$ pg_dump --format=custom --file=shop_2026-06-30.dump shopdb
$ ls -lh shop_2026-06-30.dump
-rw-r--r--  1 you  staff   84M  Jun 30 02:00 shop_2026-06-30.dump
```
*What just happened:* `pg_dump` connected to `shopdb` and produced a single self-contained file
describing how to rebuild it. That file is portable - you can restore it into a different Postgres
version, a differently-sized machine, or a fresh empty database, and you can even restore one table out
of it. It's a recipe, not a photograph.

You restore a logical dump by *replaying the recipe* into a target database:

```console
$ createdb shopdb_restored
$ pg_restore --dbname=shopdb_restored shop_2026-06-30.dump
$ psql shopdb_restored -c "SELECT count(*) FROM orders;"
 count
-------
 41902
(1 row)
```
*What just happened:* `pg_restore` rebuilt the schema and re-inserted every row into a brand-new
database, and the row count confirms the data arrived. This is a genuine, observed restore - the only
thing Phase 1 said actually proves anything. Logical dumps are the most portable and easiest to
spot-check, which is why they're the friendliest for *testing*.

The cost: logical dumps are slow to take and slow to restore on large databases, because rebuilding from
`INSERT`s is far more work than copying files. A terabyte database can take hours to dump and longer to
restore - which can blow your RTO.

## Kind 2: the physical backup - a photograph of the files

A **physical backup** copies the actual data files the database lives in (or takes a storage-level
snapshot of the disk). It's a photograph of the bytes on disk at a moment in time, not a recipe.

```console
# Conceptually: a consistent copy of the data directory / a disk snapshot
$ pg_basebackup --pgdata=/backups/base-2026-06-30 --format=tar --gzip
```
*What just happened:* Instead of reading rows and writing `INSERT`s, this copied the database's files
wholesale into a backup directory. Restoring is correspondingly fast - put the files back and start the
engine, no row-by-row rebuild. Big databases recover dramatically faster this way, which is how you hit a
tight RTO at scale. Cloud "snapshot" backups (RDS snapshots, disk snapshots) are this category.

The trade-off is the mirror image of logical dumps. Physical backups are *fast* but *rigid*: they're tied
to the same database engine version and often the same platform, and you generally restore the *whole*
thing - you can't cherry-pick one table out of a raw file copy. Photograph, not recipe.

| | Logical dump | Physical backup |
|---|---|---|
| What it stores | Instructions to rebuild (`CREATE`/`INSERT`) | A copy of the data files |
| Portable across versions? | Yes | No (version/platform-locked) |
| Restore one table? | Yes | No (all-or-nothing) |
| Speed on big data | Slow | Fast |
| Best for | Small/medium DBs, migrations, spot-checks | Large DBs, tight RTO |

## Kind 3: the write-ahead log - the stream that fills the gap

Here's the limitation both of the above share: each is a *point in time*. Whether you dump nightly or
snapshot nightly, a disaster at 5pm still loses everything since the last capture. That's your RPO ceiling
from Phase 1, and neither full-backup type can break through it alone.

The fix is a mechanism most databases already have for durability: the **write-ahead log** (WAL). Before
the database changes any data, it first appends a record of the change to a sequential log. (If you've read
[Transactions and ACID](/guides/transactions-and-acid), this is the same log that makes "durable" mean
durable - the change is safe on disk the instant the log entry is written.) It's a continuous recording of
*every change*, in order.

Keep (archive) the WAL continuously and you have not just nightly snapshots but the complete ordered
stream of everything that happened *between* them.

```text
  full backup        WAL stream (every change, continuously archived)
       ●─────▶ w w w w w w w w w w w w w w w w w w w w ─────▶  now
    (Sun 02:00)        each w = one logged change
```
*What just happened:* The full backup gives you a starting point; the archived WAL gives you every change
since. Together they don't represent one moment - they represent *every* moment from the backup forward.
That's what shrinks RPO from "since last night" toward "the last few seconds."

## Point-in-time recovery: rewinding to the second before the mistake

Combine a physical base backup with the archived WAL and you unlock a technique that feels like a time
machine: **point-in-time recovery (PITR)**. Restore the base backup, then *replay the WAL up to a chosen
instant* - and stop.

```console
# Restore the base backup, then tell the engine: replay WAL, but stop just before the disaster
$ recovery_target_time = '2026-06-30 16:59:30'   # the bad DELETE ran at 17:00:00
```
*What just happened:* The engine restored the base files, then replayed every logged change in order up
to 16:59:30 and stopped - half a minute before someone ran `DELETE FROM orders` with no `WHERE`. The
table comes back exactly as it was the moment before the mistake. You didn't lose a day of orders, just
thirty seconds, and you chose where to stop. That's the payoff of the WAL: recovery to a *moment*, not
just last night's snapshot.

💡 **Key point.** The three kinds aren't competitors - the strong setups *combine* them. A common shape:
periodic physical base backups for fast bulk recovery, continuous WAL archiving for a tiny RPO and PITR,
and occasional logical dumps for portability and easy spot-checking. You pick the mix that hits the RPO
and RTO you wrote down in Phase 1.

## For builders

If your RPO is "minutes," a nightly dump alone will never get you there - no amount of polishing the dump
job changes that it's a once-a-day snapshot. The lever that breaks the once-a-day ceiling is continuous
WAL archiving, the only mechanism that captures the gaps *between* full backups. When someone asks for
near-zero data loss, the answer isn't "back up more often" - it's "archive the log continuously and set
up PITR." Match the mechanism to the number; don't run the backup tool harder.

## Recap

1. A **logical dump** is a recipe (`CREATE`/`INSERT`) to rebuild the database - portable, table-granular,
   easy to spot-check, but slow on large data.
2. A **physical backup** is a photograph of the data files - fast to restore at scale, but locked to the
   engine version/platform and usually all-or-nothing.
3. The **write-ahead log** is the continuous, ordered record of every change. Archiving it captures
   everything *between* full backups, which is what shrinks your RPO.
4. **Point-in-time recovery** = base backup + replayed WAL, stopped at a chosen instant - recovery to the
   second before the mistake. Strong setups combine all three kinds to hit their RPO/RTO.

```quiz
[
  {
    "q": "You need to restore a single accidentally-dropped table from a 2-terabyte database, into a different Postgres version for inspection. Which backup type fits best?",
    "choices": [
      "A physical backup, because it restores fast",
      "A logical dump, because it's portable across versions and lets you restore one table",
      "The write-ahead log alone",
      "None - single-table restores are impossible"
    ],
    "answer": 1,
    "explain": "Logical dumps are portable across versions and table-granular. Physical backups are version-locked and usually all-or-nothing."
  },
  {
    "q": "What does archiving the write-ahead log give you that nightly full backups alone cannot?",
    "choices": [
      "Faster nightly backups",
      "A continuous record of every change between backups, shrinking RPO toward seconds",
      "Smaller backup files",
      "Automatic restore testing"
    ],
    "answer": 1,
    "explain": "The WAL is the ordered stream of every change. Archiving it captures the gaps between full backups, which is what lets RPO drop from 'since last night' to seconds."
  },
  {
    "q": "Point-in-time recovery (PITR) works by...",
    "choices": [
      "Taking a backup every second",
      "Restoring a base backup, then replaying the archived WAL and stopping at a chosen instant",
      "Keeping the database in read-only mode",
      "Copying the data files twice for redundancy"
    ],
    "answer": 1,
    "explain": "PITR combines a base backup with the archived WAL: restore the base, replay logged changes in order, and stop at the target time - e.g. just before a bad command."
  }
]
```

---

[← Phase 1: The Restore Is the Real Thing](01-the-restore-is-the-real-thing.md) · [Guide overview](_guide.md) · [Phase 3: When It Breaks →](03-when-it-breaks.md)
