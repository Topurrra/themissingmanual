---
title: "Backup vs Disaster Recovery"
guide: "backups-and-disaster-recovery"
phase: 1
summary: "The two different problems hiding under one word, and the 3-2-1 rule that makes a backup trustworthy."
tags: [backups, disaster-recovery, infrastructure, rpo, rto, ransomware, resilience]
difficulty: intermediate
synonyms: ["how to back up a server", "what is the 3-2-1 backup rule", "rpo vs rto", "difference between backup and disaster recovery", "how often should i back up", "ransomware backup strategy", "how to test a backup restore", "offsite backup"]
updated: 2026-07-10
---

# Backup vs Disaster Recovery

Picture two bad mornings. In the first, a teammate runs a query against the wrong database and deletes a
table of customer orders. The servers are fine, the app is up, but a chunk of *data* is gone. In the
second, the data center your VPS lives in catches fire. Nothing is corrupt — it's *unreachable*,
and your whole service is dark.

Those are two different problems, and the word "backup" only solves the first one cleanly — which is why
"we have backups" never quite answers "are we safe?"

## The two problems, kept separate

A **backup** answers: *can I get my data back?* It's a copy of your bytes — the database, the user
uploads, the config — stored somewhere you can pull from later. Backups are about **data loss**.

**Disaster recovery (DR)** answers a bigger question: *can I get my whole service running again?* That
includes the data, but also the servers, the network, the DNS, the certificates, the deploy process —
everything between "I have my bytes" and "customers can log in." DR is about **downtime**.

```text
BACKUP                         DISASTER RECOVERY
--------------------           ----------------------------------
"I have my data back."         "Customers can use the service again."
copy of the bytes              data + servers + network + DNS + deploy
fixes: deletion, corruption    fixes: fire, region outage, ransomware
the input to recovery          the whole play, start to finish
```

*What just happened:* a backup is one ingredient; disaster recovery is the finished meal. You can have a
perfect backup and still be down for three days because nobody knew how to rebuild the server it
restores onto. Holding these apart is the whole mental model — most "our backups failed us" stories are
actually "we had backups but no recovery plan."

## Why a single copy is not a backup

Here's the trap that catches people: they copy the database to a second folder on the *same machine* and
call it a backup. Then the machine dies, and both copies die together. A copy that shares a fate with the
original isn't protecting you — it's using more disk.

A real backup has to survive the thing that kills the original. That means a *separate failure domain*:
different disk, different machine, different building. The question to ask of any copy is blunt: **what
single event takes out both this copy and the thing it's backing up?** If you can name one, it's not a
backup yet.

> The first rule of backups: a backup you've never restored from is a *hope*, not a backup. We'll come
> back to this hard in Phase 3 — it's the single most expensive mistake in this whole topic.

## The 3-2-1 rule

The industry boiled "separate failure domain" down to a rule you can recite from memory. It's old, it
predates the cloud, and it still holds:

```text
3  copies of your data        (the live one + two backups)
2  different media / systems   (so one storage failure can't kill both copies)
1  copy kept offsite           (so one building can't kill everything)
```

*What just happened:* each number kills a different disaster. **Three copies** means one corrupt copy
doesn't leave you at zero. **Two media** means a single storage technology failing (a bad disk batch, a
filesystem bug, one cloud bucket misconfigured) can't take all your copies at once. **One offsite** means
a fire, flood, or region-wide outage in one location doesn't end you. Miss any one number and you've left
a specific disaster un-handled.

A concrete, modest version for a small project:

```text
copy 1:  the live database on your VPS         (the original)
copy 2:  nightly dump to a cloud object store   (different system, offsite)
copy 3:  weekly pull of that dump to your laptop or a home NAS (different media)
```

*What just happened:* that's 3-2-1 without buying anything exotic. Three copies, more than one kind of
storage, and at least one copy that isn't in the same building as your server. A side project can hit
this; there's no excuse rooted in scale.

## For builders

If you're running anything on your own box — see [/guides/what-a-server-is](/guides/what-a-server-is) and
[/guides/deploying-to-a-vps](/guides/deploying-to-a-vps) — the cheapest correct first move is a nightly
database dump shipped to object storage. That single step takes you from "one copy that dies with the
server" to genuinely offsite. It's not the whole 3-2-1, but it's the rung that matters most, and it's a
cron job and a bucket away.

```bash
# nightly: dump the DB and push it offsite (sketch, not production-hardened)
pg_dump mydb | gzip > /tmp/mydb-$(date +%F).sql.gz
# then upload /tmp/mydb-*.sql.gz to an offsite bucket and rotate old ones
```

*What just happened:* this is the second copy in the 3-2-1 list — a point-in-time snapshot living
somewhere your server can't take down with it. Note what it does *not* do: prove it restores. That proof
is Phase 3.

```quiz
[
  {
    "q": "What's the core difference between a backup and disaster recovery?",
    "choices": [
      "Backups are for databases; DR is for files",
      "A backup gets your data back; DR gets your whole service running again",
      "DR is just a backup stored in the cloud",
      "They're two words for the same thing"
    ],
    "answer": 1,
    "explain": "A backup is a copy of your bytes (fixes data loss). DR is the full play to restore the running service — data plus servers, network, DNS, and deploy (fixes downtime)."
  },
  {
    "q": "You copy your database to a second folder on the same server. Why isn't that a backup?",
    "choices": [
      "It uses too much disk space",
      "Folders can't hold database files",
      "It shares a failure domain — one dead machine kills both copies",
      "Backups must always be encrypted"
    ],
    "answer": 2,
    "explain": "A real backup has to survive the event that destroys the original. A copy on the same machine dies with it, so it protects against nothing structural."
  },
  {
    "q": "In the 3-2-1 rule, what does the '1' stand for?",
    "choices": [
      "One copy kept offsite",
      "One backup per day",
      "One person responsible for backups",
      "One cloud provider only"
    ],
    "answer": 0,
    "explain": "3 copies, 2 different media/systems, and 1 copy kept offsite — so a single building, fire, or region outage can't take out everything at once."
  }
]
```

[← Overview](_guide.md) | [Phase 2: RPO, RTO, and the Cost Dial →](02-rpo-rto-and-cost.md)
