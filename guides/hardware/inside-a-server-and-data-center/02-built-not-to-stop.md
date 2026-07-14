---
title: "Built Not to Stop - Redundancy & Reliability"
guide: "inside-a-server-and-data-center"
phase: 2
summary: "The reliability mindset in hardware: one principle - eliminate the single point of failure - expressed through RAID (combining disks for redundancy and/or speed), hot-swap drives and power supplies you can replace without powering down, and pairing every critical part. Plus the rule that has saved careers: RAID is not a backup."
tags: [hardware, reliability, redundancy, raid, hot-swap, single-point-of-failure, mirroring, parity, backup]
difficulty: advanced
synonyms: ["what is RAID", "RAID 1 vs RAID 5", "is RAID a backup", "what is a hot swap drive", "single point of failure hardware", "how do servers stay up", "what is disk mirroring", "what is parity RAID", "why does my server have many disks", "RAID is not a backup"]
updated: 2026-06-19
---

# Built Not to Stop - Redundancy & Reliability

A laptop dying costs you an afternoon. A server dying can take down a website, a payment system, or a
database thousands of people depend on - possibly at 3am. So servers are engineered around a goal your
laptop never had: **staying up even while individual parts fail**. Because over a long enough time, parts
*will* fail. Not "might." Will.

The entire reliability mindset reduces to one sentence:

> 💡 **Key point.** Find every part whose failure would stop the machine, and make sure there's no *single*
> one of them. That part - the one with no backup - is called a **single point of failure**, and the whole
> game is eliminating them.

📝 **Terminology.** A **single point of failure** (SPOF) is any component whose failure, on its own, takes
the whole system down. One power supply, one disk holding the only copy of your data, one network cable,
one switch, one machine - each is a SPOF until you add a second.

[Phase 1](01-a-server-vs-your-laptop.md) gave the first example: two power supplies. Now the same idea for
the part most likely to fail of all - the disks.

## RAID: many disks pretending to be one (better) disk

Of all the parts in a server, **storage fails the most**: spinning drives have moving parts that wear
out; even SSDs wear over time. And a disk holds your *data* - the one thing you truly can't afford to
lose. So servers almost never trust a single disk: they use **RAID**.

**RAID** - **Redundant Array of Independent Disks** - combines several physical disks so the system treats
them as **one logical drive**, arranged for some combination of **redundancy** (survive a disk dying) and
**speed** (use several disks at once). Different *RAID levels* strike different balances.

📝 **Terminology.** An **array** is the group of physical disks combined together. A **RAID level** (0, 1,
5, 10) names *how* they're combined - the trade between capacity, speed, and how many disks can die before
you lose data.

The numbered levels are just recipes mixing three ideas: spread data across disks for speed, keep a full
second copy for safety, or store reconstruction information that gives most of the capacity plus safety.

### RAID 0 - striping (speed, zero safety)

Data is **striped** - split into chunks spread across all the disks - so reads and writes hit several
disks at once. No redundancy at all.

```text
   RAID 0 (striping)        write a file → split across both disks
   ┌────────┐ ┌────────┐
   │ Disk 1 │ │ Disk 2 │    Disk 1: chunk A, C, E …
   │ A C E  │ │ B D F  │    Disk 2: chunk B, D, F …
   └────────┘ └────────┘
   faster, BUT: lose either disk and the WHOLE array is gone
```

⚠️ **Gotcha.** RAID 0 makes you *more* likely to lose everything - two disks means *two* things that can
kill the array instead of one. It's named "RAID" but has zero redundancy. Use it only for data you can
afford to lose entirely (scratch space, caches you can rebuild).

### RAID 1 - mirroring (a live second copy)

Every byte is written to **two disks at once** - identical mirrors. If one dies, the other has a complete
copy and the machine keeps running without missing a beat.

```text
   RAID 1 (mirroring)       write a file → written to BOTH disks
   ┌────────┐ ┌────────┐
   │ Disk 1 │ │ Disk 2 │    Disk 1: A B C D E F
   │ A B C  │ │ A B C  │    Disk 2: A B C D E F   (identical)
   └────────┘ └────────┘
   one disk can die; the other carries on. Cost: you pay for 2 disks,
   you get the capacity of 1.
```

Simple, robust, and common for the disks holding the operating system itself.

### RAID 5 - striping with parity (most capacity, survives one failure)

Data is striped like RAID 0, but one disk's worth of space goes to **parity** - extra information computed
from the data that lets the array **rebuild** whatever was on any single failed disk from the survivors.

📝 **Terminology.** **Parity** is redundant information derived from your data (think of a running
checksum) such that if any one piece goes missing, it can be recomputed from the rest.

```text
   RAID 5 (striping + parity), e.g. 4 disks
   ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
   │ data │ │ data │ │ data │ │parity│   parity is spread across all
   │ data │ │ data │ │parity│ │ data │   disks, not stuck on one.
   │ data │ │parity│ │ data │ │ data │
   └──────┘ └──────┘ └──────┘ └──────┘
   ANY one disk can die; its contents are rebuilt from the others.
   Capacity: you lose one disk's worth to parity; the rest is usable.
```

The appeal is efficiency: four disks keep three disks' worth of capacity *and* survive any single failure.
The catch: while a failed disk rebuilds onto a replacement, the array runs *without* its safety net - a
second failure in that window loses everything. (That's why larger, critical arrays often use schemes
tolerating *two* simultaneous failures.)

### RAID 10 - mirror, then stripe (speed and safety, at a price)

Mirror disks in pairs (RAID 1), then stripe across the pairs (RAID 0): the speed of striping *and* the
resilience of mirroring, at mirroring's price - twice the disks. A common choice for databases, where both
speed and safety matter.

The whole picture in one clear comparison:

```text
   LEVEL    GIVES YOU              SURVIVES        CAPACITY (of N disks)
   ──────   ─────────────────      ───────────     ─────────────────────
   RAID 0   speed                  nothing         all of it
   RAID 1   a live mirror          1 disk dies     half (one copy)
   RAID 5   capacity + safety      1 disk dies     all but one disk
   RAID 10  speed + safety         1 per mirror    half (mirrored)
```

Now "the array is degraded" or "we're rebuilding onto the replacement disk" reads correctly: a disk died,
the system is running on its redundancy - alive, but temporarily exposed, in a hurry to get its safety net
back. And "we run RAID 10 on the database box" is a deliberate trade, not a magic incantation.

## RAID is not a backup

This deserves its own section, in bold, because misunderstanding it has cost people their data and their
jobs.

> ⚠️ **Gotcha - RAID is not a backup.** RAID protects you from **hardware failure** - a disk physically
> dying. It does **nothing** to protect you from the other ways data disappears.

Your data is far more likely to be destroyed by something RAID faithfully, instantly replicates to every
disk in the array:

- **You delete the wrong files.** `rm -rf` on the wrong directory hits the mirror as fast as the original.
  Both copies, gone, in the same instant.
- **An application corrupts the data.** A bad migration, a buggy write - RAID dutifully stores the
  corruption on every disk.
- **Ransomware encrypts everything.** RAID encrypts it redundantly - a beautifully resilient array of
  encrypted garbage.
- **The whole machine is lost** - fire, flood, theft, a failed RAID controller scrambling the array. The
  redundancy was all inside one box, and the box is gone.

A **backup** is a *separate copy, in a separate place, that isn't changed when the live data changes* -
ideally with older versions to roll back to. You need both: RAID keeps you running through a dead disk;
backups bring you back from a deletion, a corruption, or a disaster.

🪖 **War story.** The classic version: a team runs a healthy RAID array for years, watches disks fail and
get replaced without data loss, and quietly concludes "RAID means our data is safe - no backups needed."
Then someone runs a destructive command, or a bug corrupts the database, and they discover the redundancy
only ever protected them from *one* of the dozen ways to lose data. It worked perfectly. It was just
never the thing they needed that day.

## Hot-swap: replacing parts without turning the machine off

Redundancy buys survival when a part fails - but you still have to *replace* it, and if that meant
powering down, you'd trade one outage for another. So critical server parts are **hot-swappable**:
removable and replaceable **while the machine is running and serving traffic** - usually the disks and
the power supplies.

Picture a RAID server with one dead disk, degraded but serving off its redundancy. A technician pulls the
dead drive from the front of the running machine (drives sit in **carriers** - trays that slide out by
hand), slides a fresh one in, and the array rebuilds automatically. The server never stopped; users never
noticed. Same with PSUs: pull the failed one, slide in a new one, the machine hums on the survivor.

```text
   front of a running server
   ┌────┬────┬────┬────┬────┬────┐
   │ ▣  │ ▣  │ ✗  │ ▣  │ ▣  │ ▣  │   ← ✗ failed drive, in a slide-out carrier
   └────┴────┴────┴────┴────┴────┘
                 │
                 └─ pull it out, slide a new one in - machine never powers down,
                    RAID rebuilds onto the replacement automatically
```

Redundancy and hot-swap are two halves of one strategy: a failure doesn't stop the machine, and *fixing*
it doesn't either - fail a part, keep running, get repaired, return to full health, zero downtime. That's
"built not to stop" in metal, and why "drive replaced, array rebuilding, no downtime" in an incident note
is the design working exactly as intended.

## Recap

1. The reliability mindset is one principle: **find and eliminate the single point of failure** - any one
   part whose death stops the whole machine.
2. **RAID** combines several disks into one logical drive for **redundancy and/or speed**. Core levels:
   **0** = striping (fast, no safety), **1** = mirroring (a live second copy), **5** = striping + **parity**
   (most capacity, survives one disk), **10** = mirrored *and* striped (speed + safety, double the disks).
3. **RAID is not a backup.** It protects against a *disk* dying - not deletion, corruption, ransomware, or
   losing the whole box. You need separate, off-box backups too.
4. **Hot-swap** lets you replace a failed disk or power supply **while the machine keeps running**, so
   repairing a fault causes no downtime either.
5. Redundancy (survive a failure) plus hot-swap (fix it live) is how a server is **built not to stop**.

Next, we zoom all the way out - from one resilient machine to the building full of them - and finally make
"the cloud" mean something concrete.

---

[← Phase 1: A Server vs Your Laptop](01-a-server-vs-your-laptop.md) · [Phase 3: The Data Center & "The Cloud" →](03-the-data-center-and-the-cloud.md)
