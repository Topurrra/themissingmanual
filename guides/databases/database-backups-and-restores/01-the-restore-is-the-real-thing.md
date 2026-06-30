---
title: "The Restore Is the Real Thing"
guide: "database-backups-and-restores"
phase: 1
summary: "A backup exists only to be restored, so the restore is the thing you actually measure and test. RPO and RTO in plain terms, and why 'we have backups' carries no information."
tags: [databases, backups, restore, rpo, rto, disaster-recovery]
difficulty: intermediate
synonyms: ["what is a backup for", "why test a restore", "what is rpo", "what is rto", "recovery point objective vs recovery time objective", "we have backups but cant restore", "backup vs restore difference"]
updated: 2026-06-30
---

# The Restore Is the Real Thing

Picture the moment this guide is really about. Someone ran `DELETE FROM orders` without a `WHERE`
clause, or a migration dropped the wrong table, or a disk gave up. The room goes quiet. Then comes the
sentence everyone says and nobody has verified: *"It's fine, we have backups."*

Here's the uncomfortable truth that the rest of this guide builds on. Nobody has ever needed a backup.
What people need is a *restore* — the data, back in the database, with the application working again. The
backup is the raw material. And raw material you've never actually used is an assumption, not a
capability.

## The asymmetry nobody plans for

Backups and restores feel like two sides of one coin. They are not. They get wildly unequal attention,
and that imbalance is the root of most backup disasters.

- **The backup runs constantly.** It's a cron job, a managed snapshot schedule, a checkbox in a console.
  It runs every night for years, silently, and produces a green checkmark.
- **The restore runs almost never.** It runs in the worst hour of someone's career, under pressure, often
  for the first time, often by someone who didn't write the backup.

So the thing you've practiced thousands of times is the half that doesn't save you. The thing that
actually saves you, you've practiced zero times. That's the trap. A green "backup succeeded" light tells
you a *file got written*. It tells you nothing about whether that file can become a working database
again.

💡 **Reframe.** Stop thinking "do we have backups?" Start thinking "when did we last *restore* one, and
how long did it take?" The first question has a comforting answer that means nothing. The second has an
honest answer that's worth everything.

## "We have backups" is a sentence with no information

When someone says "we have backups," ask three questions and watch the confidence drain:

```text
Q: When was the last backup taken?
A: ...last night? I think the job runs nightly.

Q: Have you ever restored one into a clean database?
A: ...not the production one, no.

Q: How long would a full restore take — minutes, hours, a day?
A: ...not sure. We've never timed it.
```
*What just happened:* Three plain questions exposed that "we have backups" was three separate untested
assumptions wearing one confident coat: that the job runs, that the output is usable, and that recovery
fits inside the time the business can survive being down. None of those is verified by the backup
succeeding. Each one is only verified by an actual restore.

This is why the entire discipline reframes around the restore. The backup is a *means*. The restore is
the *goal*. You measure, budget, and test the goal — not the means.

## RPO and RTO: the two numbers that define "good enough"

Before you can say a restore is acceptable, you need to define *acceptable*. Two numbers do that, and
they're refreshingly concrete once you strip the jargon.

📝 **Terminology.**
- **RPO — Recovery Point Objective.** How much *data* can you afford to lose, measured in time. "We can
  lose at most 5 minutes of data" is an RPO of 5 minutes. It answers: *how far back does the restore
  rewind us?*
- **RTO — Recovery Time Objective.** How much *time* the recovery itself can take. "We must be back up
  within 1 hour" is an RTO of 1 hour. It answers: *how long are we down while we restore?*

A simple way to feel the difference: RPO is the gap *before* the disaster (data between your last good
backup and the moment things broke). RTO is the gap *after* (the wall-clock time to get running again).

```text
        last good backup            disaster              back online
  ───────────●───────────────────────●────────────────────────●────────►  time
              └──── RPO: data lost ───┘
                                       └──── RTO: downtime ─────┘
```
*What just happened:* The timeline makes the two numbers physical. The stretch *before* the disaster is
data you'll lose — shrink it with more frequent backups (or a continuous log, which Phase 2 covers). The
stretch *after* is downtime — shrink it with a faster, rehearsed restore. They're different problems with
different fixes, and conflating them is how teams over-invest in one while the other quietly fails them.

The point of naming these numbers is that they turn a vague fear into an engineering target. "Don't lose
data" is unachievable and untestable. "RPO 5 minutes, RTO 1 hour" is something you can design for and,
crucially, *measure against in a drill*.

⚠️ **Gotcha — your RPO is set by your backup frequency, not your hopes.** If you back up once a night and
the disaster strikes at 5pm, you've lost a full day of data, full stop. Your real RPO is "up to 24
hours," no matter what the slide deck says. Want a smaller RPO? You need more frequent backups or a
continuous mechanism — there's no other lever.

## For builders

When you size a backup strategy, write the RPO and RTO down *first*, as a business decision, before you
pick any tooling. They're not technical preferences — they're answers to "how much data can the company
lose?" and "how long can it be down?", which only the business can answer. A storefront that loses an
hour of orders has a real problem; an internal analytics warehouse rebuilt from source data nightly
might happily tolerate an RPO of a day. The tooling in Phase 2 is chosen *to hit those numbers* — pick
the numbers first, or you'll buy machinery for a target you never defined.

## Recap

1. Nobody needs a backup; everyone needs a **restore**. The backup is raw material — the restore is the
   capability that saves you.
2. Backups run constantly and restores run almost never, so the half that actually rescues you is the
   half you've never practiced. That asymmetry is the core danger.
3. **"We have backups"** is three untested assumptions in a trench coat: the job ran, the output is
   usable, and recovery fits the time you have.
4. **RPO** = how much data you can lose (the gap before the disaster). **RTO** = how long recovery can
   take (the gap after). Name both as targets before choosing any tool.

```quiz
[
  {
    "q": "Why does this guide insist the restore — not the backup — is the thing you actually test?",
    "choices": [
      "Restores are cheaper to run than backups",
      "A successful backup only proves a file was written, not that the data can be brought back into a working database",
      "Backups are always reliable, so only restores can fail",
      "Testing backups is impossible"
    ],
    "answer": 1,
    "explain": "A green backup light means a file got written. Whether that file can become a working database again is only proven by an actual restore."
  },
  {
    "q": "Your team backs up once every 24 hours. A disaster hits 23 hours after the last backup. What is your real RPO in this event?",
    "choices": [
      "5 minutes",
      "1 hour",
      "Up to 24 hours of data lost",
      "Zero, because you have backups"
    ],
    "answer": 2,
    "explain": "RPO is set by backup frequency. Once-a-night backups mean you can lose up to a full day of data, regardless of intentions."
  },
  {
    "q": "Which pair correctly describes RPO and RTO?",
    "choices": [
      "RPO = how long recovery takes; RTO = how much data is lost",
      "RPO = how much data can be lost; RTO = how long recovery can take",
      "Both measure downtime in different units",
      "RPO is for physical backups, RTO is for logical backups"
    ],
    "answer": 1,
    "explain": "RPO (Recovery Point Objective) is the data-loss budget before the disaster; RTO (Recovery Time Objective) is the downtime budget after it."
  }
]
```

---

[← Guide overview](_guide.md) · [Phase 2: The Three Kinds of Backup →](02-the-three-kinds-of-backup.md)
