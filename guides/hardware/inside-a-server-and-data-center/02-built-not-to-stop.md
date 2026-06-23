---
title: "Built Not to Stop — Redundancy & Reliability"
guide: "inside-a-server-and-data-center"
phase: 2
summary: "The reliability mindset in hardware: one principle — eliminate the single point of failure — expressed through RAID (combining disks for redundancy and/or speed), hot-swap drives and power supplies you can replace without powering down, and pairing every critical part. Plus the rule that has saved careers: RAID is not a backup."
tags: [hardware, reliability, redundancy, raid, hot-swap, single-point-of-failure, mirroring, parity, backup]
difficulty: advanced
synonyms: ["what is RAID", "RAID 1 vs RAID 5", "is RAID a backup", "what is a hot swap drive", "single point of failure hardware", "how do servers stay up", "what is disk mirroring", "what is parity RAID", "why does my server have many disks", "RAID is not a backup"]
updated: 2026-06-19
---

# Built Not to Stop — Redundancy & Reliability

A laptop dying is an annoyance. You lose your afternoon, maybe some unsaved work, and you grumble. A server
dying is a different category of event: it can take down a website, a payment system, or a database that
thousands of people depend on, all at once, possibly at 3am. So servers are engineered around a goal your
laptop never had to care about — **staying up even while individual parts fail** — because over a long
enough time, parts *will* fail. Not "might." Will.

The entire reliability mindset reduces to one sentence, and if you only remember one thing from this guide,
make it this:

> 💡 **Key point.** Find every part whose failure would stop the machine, and make sure there's no *single*
> one of them. That part — the one with no backup — is called a **single point of failure**, and the whole
> game is eliminating them.

📝 **Terminology.** A **single point of failure** (SPOF) is any component whose failure, on its own, takes
the whole system down. One power supply is a SPOF. One disk holding the only copy of your data is a SPOF.
One network cable, one switch, one machine — each can be a SPOF until you add a second.

We already met the first example in [Phase 1](01-a-server-vs-your-laptop.md): two power supplies, so the
failure of one doesn't matter. Now let's apply the same idea to the part most likely to fail of all — the
disks.

## RAID: many disks pretending to be one (better) disk

Of all the parts in a server, **storage fails the most**. Spinning hard drives have moving parts that wear
out; even solid-state drives wear over time. And a disk is where your *data* lives — the one thing you
truly can't afford to lose. So servers almost never trust a single disk. They use **RAID**.

**What it actually is.** **RAID** — **Redundant Array of Independent Disks** — is a technique for combining
several physical disks so the system treats them as **one logical drive**, arranged to give you some
combination of two things: **redundancy** (survive a disk dying) and **speed** (use several disks at once).
Different *RAID levels* strike different balances between those two.

📝 **Terminology.** **RAID** = Redundant Array of Independent Disks. An **array** is the group of physical
disks combined together. A **RAID level** (a number like 0, 1, 5, 10) names *how* they're combined — what
trade you're making between capacity, speed, and how many disks can die before you lose data.

**The core idea, before the numbers.** You have several disks. You can use the extra disks three ways:
spread one stream of data across all of them so reads and writes go faster (no safety), keep a *second copy*
of everything so a dead disk costs you nothing (safety, at the price of capacity), or store clever extra
information that lets you *reconstruct* a dead disk's contents from the survivors (most of the capacity, plus
safety). Those three ideas are the whole of RAID; the numbered levels are just recipes that mix them.

Here are the levels you'll actually run into:

### RAID 0 — striping (speed, zero safety)

Data is **striped** — split into chunks spread across all the disks — so reads and writes hit several disks
at once and go faster. There's no redundancy at all.

```text
   RAID 0 (striping)        write a file → split across both disks
   ┌────────┐ ┌────────┐
   │ Disk 1 │ │ Disk 2 │    Disk 1: chunk A, C, E …
   │ A C E  │ │ B D F  │    Disk 2: chunk B, D, F …
   └────────┘ └────────┘
   faster, BUT: lose either disk and the WHOLE array is gone
```

⚠️ **Gotcha.** RAID 0 makes you *more* likely to lose everything, not less — with two disks you now have
*two* things that can kill the array instead of one. It's named "RAID" but it has zero redundancy. Use it
only for data you can afford to lose entirely (scratch space, caches you can rebuild).

### RAID 1 — mirroring (a live second copy)

Every byte is written to **two disks at once**. They're identical mirrors. If one dies, the other has a
complete copy and the machine keeps running off it without missing a beat.

```text
   RAID 1 (mirroring)       write a file → written to BOTH disks
   ┌────────┐ ┌────────┐
   │ Disk 1 │ │ Disk 2 │    Disk 1: A B C D E F
   │ A B C  │ │ A B C  │    Disk 2: A B C D E F   (identical)
   └────────┘ └────────┘
   one disk can die; the other carries on. Cost: you pay for 2 disks,
   you get the capacity of 1.
```

The trade is capacity: two disks give you the storage of one. Simple, robust, and common for the disks that
hold the operating system itself.

### RAID 5 — striping with parity (most capacity, survives one failure)

Data is striped across the disks like RAID 0, but one disk's worth of space is spent on **parity** — extra
information computed from the data that lets the array **rebuild** whatever was on any single failed disk.
Lose one disk, and the array reconstructs its contents from the parity plus the survivors.

📝 **Terminology.** **Parity** is redundant information derived from your data (think of a running checksum)
such that if any one piece goes missing, the missing piece can be recomputed from the rest. It's how RAID 5
survives a disk death without keeping a full second copy of everything.

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

The appeal is efficiency: with four disks you keep three disks' worth of capacity *and* survive any single
failure. The catch is that while a failed disk is being rebuilt onto a replacement, the array is running
*without* its safety net — a second failure during that window loses everything. (This is why larger,
critical arrays often use schemes that tolerate *two* simultaneous failures.)

### RAID 10 — mirror, then stripe (speed and safety, at a price)

Combine the two good ideas: mirror disks in pairs (RAID 1), then stripe across the pairs (RAID 0). You get
the speed of striping *and* the resilience of mirroring. The price is capacity — like mirroring, you pay for
twice the disks. It's a common choice for databases, where both speed and safety matter and you're willing
to pay for disks.

Here's the whole picture in one honest comparison:

```text
   LEVEL    GIVES YOU              SURVIVES        CAPACITY (of N disks)
   ──────   ─────────────────      ───────────     ─────────────────────
   RAID 0   speed                  nothing         all of it
   RAID 1   a live mirror          1 disk dies     half (one copy)
   RAID 5   capacity + safety      1 disk dies     all but one disk
   RAID 10  speed + safety         1 per mirror    half (mirrored)
```

**Why this saves you later.** When someone says "the array is degraded" or "we're rebuilding onto the
replacement disk," you'll know a disk has died and the system is running on its redundancy — alive, but
temporarily exposed, and in a hurry to get its safety net back. And "we run RAID 10 on the database box"
will read as a deliberate trade — paying double for disks to buy both speed and resilience — rather than a
magic incantation.

## RAID is not a backup

This deserves its own section, in bold, because misunderstanding it has cost people their data and their
jobs.

> ⚠️ **Gotcha — RAID is not a backup.** RAID protects you from **hardware failure** — a disk physically
> dying. It does **nothing** to protect you from the other ways data disappears.

Think about what RAID actually does: it keeps your data available when a *disk* fails. But your data is far
more likely to be destroyed by something RAID faithfully, instantly replicates to every disk in the array:

- **You delete the wrong files.** `rm -rf` on the wrong directory is written to the mirror just as fast as
  to the original. Both copies, gone, in the same instant.
- **An application corrupts the data.** A bad migration, a buggy write — RAID dutifully stores the
  corruption on every disk.
- **Ransomware encrypts everything.** RAID encrypts it redundantly. Now you have a beautifully resilient
  array of encrypted garbage.
- **The whole machine is lost** — fire, flood, theft, a failed RAID controller scrambling the array. The
  redundancy was all inside one box, and the box is gone.

A **backup** is a *separate copy, in a separate place, that isn't changed when the live data changes* —
ideally with older versions you can roll back to. RAID and backups solve different problems and you need
both. RAID keeps you running through a dead disk; backups bring you back from a deletion, a corruption, or a
disaster.

🪖 **War story.** The classic, painful version goes: a team runs a healthy RAID array for years, sees disks
fail and get replaced without data loss, and quietly concludes "RAID means our data is safe — we don't need
backups." Then someone runs a destructive command, or a bug corrupts the database, and they discover that
the thing protecting them this whole time only ever protected them from *one* of the dozen ways to lose
data. The redundancy worked perfectly. It was just never the thing they actually needed that day.

## Hot-swap: replacing parts without turning the machine off

Redundancy buys you survival when a part fails. But you still have to *replace* the failed part — and if
replacing it meant powering the server down, you'd be trading one outage for another. So critical server
parts are **hot-swappable**.

**What it actually is.** **Hot-swap** means a component can be physically removed and replaced **while the
machine is running and serving traffic** — no shutdown, no reboot. The disks and the power supplies we've
discussed are the usual hot-swap parts.

**What it does in real life.** Picture a server in RAID where one disk has died. The array is degraded but
still serving requests off its redundancy. A technician walks up, pulls the dead drive out of the front of
the running machine (server drives sit in **carriers** — little trays — that slide out by hand), slides a
fresh one into the empty slot, and the array begins rebuilding onto it automatically. The server never
stopped. Users never noticed. Same story with the redundant PSUs: pull the failed one, slide a new one in,
the machine keeps humming on the surviving supply the whole time.

```text
   front of a running server
   ┌────┬────┬────┬────┬────┬────┐
   │ ▣  │ ▣  │ ✗  │ ▣  │ ▣  │ ▣  │   ← ✗ failed drive, in a slide-out carrier
   └────┴────┴────┴────┴────┴────┘
                 │
                 └─ pull it out, slide a new one in — machine never powers down,
                    RAID rebuilds onto the replacement automatically
```

**Why this is the point.** Redundancy and hot-swap are two halves of one strategy. Redundancy means a single
failure doesn't stop the machine *right now*; hot-swap means *fixing* that failure also doesn't stop the
machine. Together they let a server fail a part, keep running, get repaired, and return to full health —
all without a second of downtime. That's what "built not to stop" actually means in metal.

**Why this saves you later.** When you read "drive replaced, array rebuilding, no downtime" in an incident
note, you'll see the whole choreography: a part failed, redundancy carried the load, someone hot-swapped the
replacement, and the array healed itself — exactly as designed, with the service never going dark.

## Recap

1. The reliability mindset is one principle: **find and eliminate the single point of failure** — any one
   part whose death stops the whole machine.
2. **RAID** combines several disks into one logical drive for **redundancy and/or speed**. Core levels:
   **0** = striping (fast, no safety), **1** = mirroring (a live second copy), **5** = striping + **parity**
   (most capacity, survives one disk), **10** = mirrored *and* striped (speed + safety, double the disks).
3. **RAID is not a backup.** It protects against a *disk* dying — not against deletion, corruption,
   ransomware, or losing the whole box. You need separate, off-box backups too.
4. **Hot-swap** lets you replace a failed disk or power supply **while the machine keeps running**, so
   repairing a fault causes no downtime either.
5. Redundancy (survive a failure) plus hot-swap (fix it live) is how a server is **built not to stop**.

Next, we zoom all the way out — from one resilient machine to the building full of them — and finally make
"the cloud" mean something concrete.

---

[← Phase 1: A Server vs Your Laptop](01-a-server-vs-your-laptop.md) · [Phase 3: The Data Center & "The Cloud" →](03-the-data-center-and-the-cloud.md)
