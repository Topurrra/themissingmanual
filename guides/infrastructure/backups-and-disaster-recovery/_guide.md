---
title: "Backups and Disaster Recovery"
guide: "backups-and-disaster-recovery"
phase: 0
summary: "The 3-2-1 rule, RPO and RTO, and the one practice that matters most: actually testing the restore before the disaster forces you to."
tags: [backups, disaster-recovery, infrastructure, rpo, rto, ransomware, resilience]
category: infrastructure
order: 10
difficulty: intermediate
synonyms: ["how to back up a server", "what is the 3-2-1 backup rule", "rpo vs rto", "difference between backup and disaster recovery", "how often should i back up", "ransomware backup strategy", "how to test a backup restore", "offsite backup"]
updated: 2026-06-30
---

# Backups and Disaster Recovery

Everyone agrees backups matter, right up until the morning a drive dies, a `DROP TABLE` runs against
prod instead of staging, or ransomware encrypts every file you own and leaves a note. That's the moment
you discover what your backups are actually worth — and for an uncomfortable number of teams, the answer
is "nothing," because the job had been silently failing for months, or the backup itself got encrypted too.

This guide is here so that morning is survivable. You'll get the mental model that keeps the two halves
of this problem straight — getting your *data* back versus getting your *service* back — plus the
handful of rules and numbers the whole field runs on, and the one habit (testing the restore) that
separates teams who recover in an hour from teams who never recover at all.

## How to read this

- **Want the gist fast?** Read [Phase 1](01-backup-vs-disaster-recovery.md). It installs the one
  distinction everything else hangs on, then the 3-2-1 rule in a sentence.
- **Want it to actually stick?** Read in order. Each phase builds: what these words mean, the numbers
  that drive every decision and its cost, then what happens when it all goes wrong on purpose and on a
  bad day.

## The phases

1. **[Backup vs Disaster Recovery](01-backup-vs-disaster-recovery.md)** — the two different problems
   hiding under one word, and the 3-2-1 rule that makes a backup trustworthy.
2. **[RPO, RTO, and the Cost Dial](02-rpo-rto-and-cost.md)** — how much data you can lose and how long
   you can be down, and how those two numbers set your budget.
3. **[The Untested Backup, and Ransomware](03-testing-and-ransomware.md)** — why the restore drill is
   the only proof that counts, and the offline, immutable copy that survives an attacker.

[Phase 1: Backup vs Disaster Recovery](01-backup-vs-disaster-recovery.md) →
