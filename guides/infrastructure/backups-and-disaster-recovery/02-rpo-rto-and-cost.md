---
title: "RPO, RTO, and the Cost Dial"
guide: "backups-and-disaster-recovery"
phase: 2
summary: "How much data you can lose and how long you can be down, and how those two numbers set your backup budget."
tags: [backups, disaster-recovery, infrastructure, rpo, rto, ransomware, resilience]
difficulty: intermediate
synonyms: ["how to back up a server", "what is the 3-2-1 backup rule", "rpo vs rto", "difference between backup and disaster recovery", "how often should i back up", "ransomware backup strategy", "how to test a backup restore", "offsite backup"]
updated: 2026-06-30
---

# RPO, RTO, and the Cost Dial

"How often should we back up?" feels like a technical question with a technical answer. It isn't. It's a
*business* question wearing a technical hat, and you can't answer it sensibly until you know two things:
how much recent data the business can afford to lose, and how long it can afford to be down. Those two
numbers have names, and once you have them, every other decision — schedule, storage, spend — falls out
almost automatically.

This is the phase where backups stop being a checkbox and start being a deliberate trade. The dial you're
turning is cost.

## The two numbers: RPO and RTO

**RPO — Recovery Point Objective** — is how much data you're willing to lose, measured in *time*. It
answers: "when we recover, how far back is our most recent good copy?" An RPO of one hour means: in the
worst case, you lose up to the last hour of changes. RPO is set by your **backup frequency** — you can't
recover to a point you never captured.

**RTO — Recovery Time Objective** — is how long you're willing to be down, measured from "disaster
strikes" to "service is back." An RTO of four hours means: from the fire alarm to customers logging in
again, you've promised four hours. RTO is set by how fast your **recovery process** runs.

```text
        disaster
           │
   ...─────●───────────────────────●─────►  time
        ▲  │                       ▲
     last  │                    service
     good  │◄──── RTO ─────────► back up
     backup│   (downtime you accept)
        │
        │◄ RPO ►│  (data you accept losing:
                   the gap from last backup to disaster)
```

*What just happened:* RPO looks *backward* from the disaster — how much recent work vanished. RTO looks
*forward* from the disaster — how long the lights stay off. They're independent: you can lose only five
minutes of data (tiny RPO) but still take two days to get running (huge RTO), or vice versa. People mix
them up constantly; the fix is to remember RP**O** = recovery *point* (a moment in the past), RT**O** =
recovery *time* (a duration of downtime).

## How the numbers drive cost

Here's the part nobody tells you up front: **smaller numbers cost exponentially more.** Each one has its
own cost curve.

Tightening **RPO** means backing up more often. Going from nightly to hourly is cheap-ish. Going from
hourly to "near-zero" means continuous replication or streaming the database's write-ahead log to a
standby — a permanent second system, always running, always costing money.

Tightening **RTO** means recovering faster. Restoring from a cold backup might take hours of copying and
rebuilding. Getting RTO to minutes means a warm or hot standby already running and ready to take over —
again, a second system you pay for around the clock.

```text
RPO target     typical mechanism                  relative cost
-----------    --------------------------------   -------------
24 hours       nightly dump to object storage     $
1 hour         hourly snapshots                    $$
minutes        continuous WAL / log shipping       $$$
near-zero      synchronous replication             $$$$

RTO target     typical mechanism                  relative cost
-----------    --------------------------------   -------------
1 day          restore from cold backup            $
hours          scripted rebuild + restore          $$
minutes        warm standby, ready to promote      $$$
seconds        hot standby / active-active         $$$$
```

*What just happened:* both dials run from "cheap and slow" to "expensive and instant," and the bottom of
each table is a permanently-running duplicate of your system. That's why you don't set these numbers by
asking engineers "how good can we make it" — the answer is always "infinitely good, for infinite money."
You set them by asking the business "what does an hour of downtime, or an hour of lost data, actually cost
us?" and buying down to where the cost of protection meets the cost of the loss.

## Different data deserves different numbers

A common mistake is picking one RPO/RTO for everything. Your customer database and your cache of
thumbnail images do not deserve the same protection. The database is irreplaceable; the thumbnails
regenerate from the originals. Paying for near-zero RPO on regenerable data is lighting money on fire.

```text
data                 RPO          RTO          why
-------------------  -----------  -----------  ------------------------------
orders / payments    minutes      minutes      losing it = losing money + trust
user accounts        ~1 hour      hours        important, changes slower
app logs             ~1 day       days         useful, not load-bearing
rendered thumbnails  "who cares"  on rebuild   regenerated from source images
```

*What just happened:* you tier your data and spend the tight (expensive) numbers only where loss actually
hurts. This single move — refusing to protect everything at the highest tier — is what keeps a backup
budget sane.

> A tempting shortcut: "we'll figure out RTO during the incident." You won't. During an incident you'll
> be improvising under pressure, and improvised recovery is slow recovery. The number is a promise you
> make *now* so you can build (and rehearse) the process that keeps it — which is exactly where Phase 3
> goes.

## For builders

If you've deployed something to a VPS (see [/guides/deploying-to-a-vps](/guides/deploying-to-a-vps)),
write your RPO and RTO down in plain words *before* you size any backup tooling: "We can lose at most one
hour of data. We need to be back within four hours." Now the schedule and the storage choice aren't
guesses — hourly backups satisfy the RPO, and a tested rebuild script that runs in well under four hours
satisfies the RTO. The numbers turn a vague worry into a spec you can actually verify.

```quiz
[
  {
    "q": "Your RPO is 1 hour. What does that promise?",
    "choices": [
      "You'll be back online within 1 hour of a disaster",
      "You back up exactly once per hour, no more",
      "In the worst case you lose at most the last hour of data changes",
      "Recovery takes no longer than 1 hour"
    ],
    "answer": 2,
    "explain": "RPO = Recovery Point Objective = how much data you can lose, measured in time. A 1-hour RPO means your most recent good copy is never more than an hour behind. Downtime is RTO, a different number."
  },
  {
    "q": "Why do tighter RPO and RTO targets cost so much more?",
    "choices": [
      "Cloud providers charge premium rates for small numbers",
      "Near-zero data loss and near-instant recovery require a second system running all the time",
      "Faster backups need faster internet, which is rare",
      "Smaller numbers require more engineers to watch the dashboards"
    ],
    "answer": 1,
    "explain": "The bottom of both cost curves is a permanently-running duplicate — continuous replication for RPO, a hot standby for RTO — that you pay for around the clock."
  },
  {
    "q": "Which is the sound way to handle backups for regenerable data like rendered thumbnails?",
    "choices": [
      "Give it the same tight RPO/RTO as the orders database",
      "Don't back it up at the highest tier — it regenerates from source, so a loose RPO is fine",
      "Never back up anything that can be regenerated",
      "Back it up more often than the database since there's more of it"
    ],
    "answer": 1,
    "explain": "Tier your data. Spend the expensive, tight numbers only where loss actually hurts. Paying for near-zero RPO on data you can regenerate is wasted money."
  }
]
```

[← Phase 1](01-backup-vs-disaster-recovery.md) | [Overview](_guide.md) | [Phase 3: The Untested Backup, and Ransomware →](03-testing-and-ransomware.md)
