---
title: "When It Breaks"
guide: "database-backups-and-restores"
phase: 3
summary: "The cautionary tale of the backup job that wrote empty files for months, the 3-2-1 rule, and how to automate, verify, and drill the restore so it works the day you need it."
tags: [databases, backups, restore, 3-2-1-rule, restore-drill, disaster-recovery, verification]
difficulty: intermediate
synonyms: ["backup job wrote empty files", "3-2-1 backup rule explained", "how to test a database restore", "restore drill", "verify backups automatically", "silent backup failure", "backup checksum verification"]
updated: 2026-07-10
---

# When It Breaks

You know what a backup is *for* (the restore) and the three ways to take one. This phase is about the
part that decides whether any of it saves you: the unglamorous discipline of making sure the restore
actually works on the day it counts. The most dangerous backup isn't the one that's missing — it's the
one that's there, green, and quietly useless. Here's the story that haunts everyone who's lived it.

## The cautionary tale: the backup job that wrote empty files

A team set up a nightly `pg_dump`. It ran. The job exited cleanly, the monitoring stayed green, the file
landed in storage. Every morning, for months, a backup file appeared. Everyone slept fine.

Then they needed it. And when they opened the backups, every file was a few kilobytes — empty. A
credential had changed early on; the dump connected, failed to read the data, wrote a near-empty file,
and *still exited zero* because the wrapper script only checked "did a file get created," not "is there a
database inside it." Months of green checkmarks, and not one usable backup among them.

```console
$ ls -lh /backups/ | tail -3
-rw-r--r--  1 db  db   2.1K  Jun 28 02:00 shop_2026-06-28.dump
-rw-r--r--  1 db  db   2.1K  Jun 29 02:00 shop_2026-06-29.dump
-rw-r--r--  1 db  db   2.1K  Jun 30 02:00 shop_2026-06-30.dump
```
*What just happened:* Every nightly file is 2.1K — for a database that should dump to tens of megabytes.
The job "succeeded" every night and produced nothing. This is the signature failure of backups: not a
loud error, but a *silent* one that the success light never noticed. The lesson isn't "check the file
size." It's deeper: **a backup is only verified by restoring it.** Nothing short of that would have
caught this.

## The 3-2-1 rule: don't keep your eggs near the fire

Even a perfect backup is worthless if it burns in the same fire as the database. The **3-2-1 rule** is the
old, boring, undefeated answer to "where do I keep these?":

- **3** copies of your data (the live database counts as one).
- on **2** different kinds of media or storage (not all on the same disk/array).
- with **1** copy off-site (a different region, a different provider, somewhere a single disaster can't
  reach both it and production).

```text
  [ live DB ]  ──▶  [ backup on different storage ]  ──▶  [ off-site copy ]
     copy 1               copy 2 (2nd medium)               copy 3 (1 off-site)
   ┕━━━━━━━━━━━━━━ one regional outage / ransomware must not take all three ━━━━━━━━━━━━━━┙
```
*What just happened:* The rule spreads your copies so that no single event — a failed disk, a deleted
bucket, a region outage, a ransomware run that encrypts everything it can reach — can destroy every copy
at once. The off-site one is the clause people skip and regret: a backup sitting in the same account or
region as production shares its fate.

⚠️ **Gotcha — a backup the attacker can also delete isn't off-site enough.** Ransomware and compromised
credentials often reach the backups precisely because they're in the same account with the same access.
The strongest off-site copy is one that production's credentials *cannot* delete or overwrite — separate
account, write-once/immutable storage, or a separate retention lock. Off-site means "out of the blast
radius," not "another folder."

## Automate, verify, drill — the three habits that make it real

Three habits turn a pile of files into an actual recovery capability, and they build on each other.

**1. Automate the backup.** A backup that depends on someone remembering to run it will be skipped the
week it matters. Schedule it, and alert on the job *not running* — silence should be loud.

**2. Verify automatically — and prove there's a database in the file.** Don't trust the exit code (the
empty-files team did). At minimum, check the backup is plausibly sized and structurally valid. Far
better: do a real automated restore into a throwaway database and run a sanity query.

```console
# Nightly verify: restore last night's dump into a scratch DB and sanity-check it
$ createdb verify_scratch
$ pg_restore --dbname=verify_scratch /backups/shop_2026-06-30.dump
$ psql verify_scratch -tAc "SELECT count(*) FROM orders;"
41902
$ dropdb verify_scratch
```
*What just happened:* The verifier didn't inspect the file — it *restored* it and asked the rebuilt
database a question. A non-zero, sensible order count proves the backup contains a real, queryable
database. The empty-files disaster cannot survive this check: a 2.1K file would fail the restore or
return zero rows, and the alert fires while it's still a Tuesday, not a catastrophe.

**3. Drill the full restore — like a fire drill.** Verification proves the *file* is good. A drill proves
the *whole procedure* is good: that a human can find the right backup, run the restore end to end, and
get the app working — within your RTO. Schedule it (quarterly is a common cadence), do it under realistic
conditions, and *time it*.

```text
RESTORE DRILL  (run it before you need it)
  1. Pick a target moment.       → e.g. "restore to 16:59:30 yesterday"
  2. Provision a clean target.   → fresh instance, NOT production
  3. Restore base + replay WAL.  → follow the written runbook, step by step
  4. Bring the app up against it.→ does it actually work end to end?
  5. Run sanity queries.         → row counts, recent records present?
  6. Record the wall-clock time. → did you beat your RTO?  if not, fix it now
```
*What just happened:* The drill converts every Phase-1 assumption into an observed fact: the backup
restores, the runbook is correct, a human can execute it, and the whole thing fits inside the RTO you
promised. Each drill also surfaces the gaps — a missing step, a permission you lacked, a restore that's
slower than your RTO — while they're cheap to fix instead of discovering them mid-incident.

💡 **Key point.** Automate, verify, drill map straight onto the failures they prevent: automation stops
the *missing* backup, verification stops the *empty/corrupt* backup, and the drill stops the *unrestorable
or too-slow* backup. Skip any one and you've left a hole exactly where disasters walk in.

## The restore-day checklist

When it's real and the pressure is on, don't improvise — run the procedure you rehearsed:

1. **Stop the bleeding.** Pause whatever is corrupting or deleting data (the runaway job, the bad deploy)
   so the damage doesn't grow while you work.
2. **Decide the target moment.** With PITR, identify the instant *before* the damage. Without it,
   identify the last good full backup.
3. **Restore to a *new* target, not over production.** Never restore on top of the damaged database —
   you may need it for forensics, and a failed restore mustn't destroy your last evidence.
4. **Verify before cutting over.** Run sanity queries against the restored copy. Confirm the data you
   expect is present and the damage is gone.
5. **Cut over, then write it down.** Point the app at the restored database, then record what happened
   and what the drill should change next time.

## For builders

Put the restore time on a dashboard, not the backup time. The metric that predicts whether you survive an
incident is "how long did our last *restore drill* take, and did it beat RTO" — not "did last night's
backup succeed." Tracking the restore makes the team invest in the half that actually saves them, and it
kills the empty-files class of failure, because you can't fake a drill that has to produce a working
database at the end.

## Recap

1. The deadliest backup is **silently useless** — green, present, and empty. Only an actual restore would
   have caught the empty-files job; a success exit code proves nothing.
2. The **3-2-1 rule**: 3 copies, on 2 kinds of storage, with 1 truly off-site (out of the blast radius,
   ideally where production's own credentials can't delete it).
3. **Automate** (stop the missing backup), **verify** by restoring into a scratch DB (stop the empty/corrupt
   backup), and **drill** the full restore against your RTO (stop the unrestorable or too-slow backup).
4. On restore day, **stop the bleeding, pick the target moment, restore to a fresh target, verify, then
   cut over** — run the rehearsed procedure, never improvise.

```quiz
[
  {
    "q": "The 'backup job that wrote empty files' ran green for months. What single practice would have caught it earliest?",
    "choices": [
      "Adding more storage",
      "Automatically restoring each backup into a throwaway database and running a sanity query",
      "Backing up more frequently",
      "Switching from logical to physical backups"
    ],
    "answer": 1,
    "explain": "A backup is only verified by restoring it. An automated restore + sanity query would have failed (or returned zero rows) the first night the files were empty."
  },
  {
    "q": "Which copy best satisfies the '1' in the 3-2-1 rule?",
    "choices": [
      "A second backup file in the same storage bucket as production",
      "A copy in a separate account/region that production's credentials cannot delete or overwrite",
      "A copy on the same disk, compressed",
      "A copy kept only in the database's own WAL"
    ],
    "answer": 1,
    "explain": "Off-site means out of the blast radius. A copy that a regional outage, account compromise, or ransomware run can also reach shares production's fate."
  },
  {
    "q": "Verification proves the backup file is restorable. What does a full restore drill additionally prove?",
    "choices": [
      "That the backup file is smaller",
      "That the whole procedure works — a human can restore end to end, the app comes up, and it all fits within RTO",
      "That the database engine is up to date",
      "Nothing beyond what verification proves"
    ],
    "answer": 1,
    "explain": "A drill tests the entire procedure under realistic conditions and times it against RTO, surfacing runbook gaps and slow restores while they're cheap to fix."
  }
]
```

---

[← Phase 2: The Three Kinds of Backup](02-the-three-kinds-of-backup.md) · [Guide overview](_guide.md)
