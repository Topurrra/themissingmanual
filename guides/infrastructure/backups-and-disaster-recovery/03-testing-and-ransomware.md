---
title: "The Untested Backup, and Ransomware"
guide: "backups-and-disaster-recovery"
phase: 3
summary: "Why the restore drill is the only proof that counts, and the offline, immutable copy that survives an attacker."
tags: [backups, disaster-recovery, infrastructure, rpo, rto, ransomware, resilience]
difficulty: intermediate
synonyms: ["how to back up a server", "what is the 3-2-1 backup rule", "rpo vs rto", "difference between backup and disaster recovery", "how often should i back up", "ransomware backup strategy", "how to test a backup restore", "offsite backup"]
updated: 2026-07-10
---

# The Untested Backup, and Ransomware

You've got the model, the rule, and the numbers. Now the two ways teams with all of that *still* lose
everything — both avoidable. The first is quiet and self-inflicted: a backup that was never tested and
turns out not to work. The second is loud and adversarial: ransomware that reaches for your backups on
purpose. This phase turns a backup *plan* into something that actually saves you.

## The untested backup is the classic trap

Here is the most expensive sentence in this entire topic: **a backup you have never restored from is not
a backup — it's a hope.**

It feels paranoid until you've lived it. Backup jobs fail silently all the time: a path changed, a
credential expired, a disk filled, a config typo meant the job dumped an empty file every night for six
months. The job kept reporting "success" because it ran without crashing — it wasn't backing up
anything. Nobody noticed, because nobody ever tried to *use* the output. The dashboard was green the
entire time.

```text
What the dashboard shows:   backup job: ✅ SUCCESS (ran every night)
What's actually in the file: 0 rows. Empty dump. Six months of nothing.
When you find out:          during the disaster, when you go to restore.
```

*What just happened:* "the job ran" and "the backup works" are different claims, and only one of them
gets checked by default. The gap between them is where companies die. A successful run proves the script
executed; it proves nothing about whether the bytes it produced can rebuild your system.

## The only proof: the restore drill

There is exactly one way to know a backup works: **restore from it and check the result.** Not read the
logs. Not confirm the file exists and has a plausible size. Actually pull the backup into a clean
environment, bring the data up, and verify it's real.

```bash
# the restore drill, in spirit:
# 1. take last night's backup (the real artifact you'd use in a disaster)
# 2. restore it into a fresh, isolated environment
createdb restore_test
gunzip -c mydb-2026-06-29.sql.gz | psql restore_test

# 3. verify it's actually your data, not an empty shell
psql restore_test -c "SELECT count(*) FROM orders;"   # expect a real, sane number
psql restore_test -c "SELECT max(created_at) FROM orders;"  # expect ~last night
```

*What just happened:* you proved the backup is restorable *and* recent, in a sandbox, on a calm Tuesday —
not at 3am during a real outage. The row count catches the empty-dump failure; the latest timestamp
catches a stale or wrong-source backup. Do this on a schedule (a quarterly drill at minimum, automated if
you can), and treat a failed drill as a real incident, because it is one — you've discovered you were
unprotected.

A restore drill also quietly validates your **RTO**: time the drill. If "promise: back in 4 hours" but
the drill takes 9, your RTO is fiction and now you know — while it's cheap to fix.

> Schrödinger's backup: the condition of any backup is unknown until you attempt a restore. Don't leave
> the box closed.

## Ransomware changes the threat model

Classic backups assume *accidents* — a dead disk, a fat-fingered delete. Ransomware is different: it's an
**intelligent adversary** who *wants* your recovery to fail. Modern ransomware doesn't immediately
encrypt and announce itself. It often sits quietly, finds your backups, and encrypts or deletes *those
first* — because a victim who can restore doesn't pay the ransom.

This breaks an assumption hiding inside ordinary 3-2-1. If your "offsite" backup is a cloud bucket your
production server can write to and delete from, then anyone — or any malware — with your server's
credentials can wipe that backup too. Reachable and deletable means *destroyable*. Same failure domain,
a logical one instead of a physical one.

## Immutable and offline: the copy they can't reach

The defense is a copy the attacker *cannot* alter or delete, even with full control of your servers. Two
forms, often combined:

```text
IMMUTABLE  — write-once, read-many. The storage itself refuses deletion or
             overwrite until a retention period expires. (Object-lock /
             "WORM" on cloud object storage.) Even with your keys, an
             attacker can't erase what's locked.

OFFLINE    — physically disconnected. Tapes in a vault, or a drive that's
             unplugged between backup runs. An air gap is unhackable over the
             network because there's no network to it.
```

*What just happened:* both close the loophole. Immutability means even a fully compromised account can't
delete the locked copy until its retention window passes; offline (the "air gap") means there's no live
path to the copy at all. This is the modern upgrade to the "1" in 3-2-1: not enough that the offsite copy
is *elsewhere* — at least one copy must be *unreachable* by a live, compromised system.

A practical small-team version: keep your normal offsite backups, *and* enable object-lock on the bucket
(or pull periodic copies to a drive you disconnect) so there's always one copy that today's compromised
credentials cannot touch.

## For builders

If you run your own infrastructure (see [/guides/what-a-server-is](/guides/what-a-server-is)), bake two
non-negotiables into the plan from day one. One: a recurring restore drill, with a row-count-and-timestamp
check, treated as an incident when it fails. Two: at least one immutable or offline copy, so a stolen
credential or a ransomware run can't take your recovery down with your production. Everything earlier in
this guide is preparation; these two are what make it *real* when the bad morning comes — and it does
come.

```quiz
[
  {
    "q": "Why is a backup job that reports 'success' every night still not proof you're protected?",
    "choices": [
      "Success messages are often delayed by an hour",
      "'The job ran' only proves the script executed, not that the bytes can rebuild your system",
      "Nightly is too infrequent to count as a real backup",
      "Success only counts if the job runs on a weekend"
    ],
    "answer": 1,
    "explain": "Jobs fail silently — an expired credential or config typo can dump an empty file while still 'succeeding.' Only an actual restore proves the output is usable."
  },
  {
    "q": "What is the only reliable way to know a backup actually works?",
    "choices": [
      "Confirm the backup file exists and has a plausible size",
      "Read the backup job logs for errors",
      "Restore it into a clean environment and verify the data is real and recent",
      "Check that the job has run successfully 30 days in a row"
    ],
    "answer": 2,
    "explain": "The restore drill is the only proof: pull the real artifact into a sandbox, bring the data up, and check it (e.g. row counts and the latest timestamp). It also validates your RTO if you time it."
  },
  {
    "q": "Why can ordinary 3-2-1 backups still fall to ransomware?",
    "choices": [
      "Ransomware encrypts faster than backups can run",
      "If your offsite copy is reachable and deletable by your server, compromised credentials can wipe it too",
      "3-2-1 was never designed for cloud storage",
      "Ransomware only targets databases, which 3-2-1 ignores"
    ],
    "answer": 1,
    "explain": "An attacker with your server's credentials can destroy any backup that server can write to or delete. The fix is an immutable (object-locked) or offline (air-gapped) copy they can't reach."
  }
]
```

[← Phase 2](02-rpo-rto-and-cost.md) | [Overview](_guide.md)
