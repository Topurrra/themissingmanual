---
title: "SSD - Flash, No Moving Parts"
guide: "storage-hdd-ssd-nvme"
phase: 2
summary: "A solid-state drive stores data in flash memory cells with no moving parts, so reaching scattered data costs almost nothing and random access becomes dramatically faster than an HDD; the trade-offs are higher cost per gigabyte and cells that wear out with writes, which wear-leveling spreads out - and this is why an SSD makes an old computer feel new."
tags: [storage, ssd, flash, nand, wear-leveling, random-access, trim]
difficulty: intermediate
synonyms: ["how does an ssd work", "what is flash memory", "why is an ssd faster than a hard drive", "do ssds wear out", "what is wear leveling", "why does an ssd make my computer faster", "what is nand flash"]
updated: 2026-06-19
---

# SSD - Flash, No Moving Parts

In the last phase, every slow thing about an HDD traced back to one cause: it has to physically move to your
data. So here's the obvious question an engineer eventually asks - *what if we got rid of the moving parts
entirely?* That question is the **solid-state drive**, or SSD. "Solid-state" literally means "no moving
mechanical parts," and removing that arm and that spinning platter changes everything about how the drive
behaves.

## What's actually inside

**What it actually is.** An SSD stores data in **flash memory** - silicon chips full of microscopic cells,
each holding an electrical charge that represents your bits. There's no platter, no head, no arm. Reading a
piece of data means *electronically addressing* the cell that holds it. Writing means changing the charge in
a cell. Nothing physically travels anywhere.

📝 **Terminology.** The flash inside almost every SSD is called **NAND flash** (NAND is the type of logic gate
the cells are built from - you don't need the electronics, just the name). A small onboard computer called the
**controller** manages the chips: it decides where data goes, tracks where everything is, and handles the
housekeeping we'll get to below.

```text
   HDD (Phase 1)                        SSD (this phase)

   ┌──────────────────┐                 ┌──────────────────────────┐
   │  ════ platter ═══ │ spins           │ [chip][chip][chip][chip] │ ← NAND flash
   │  ──── head ────── │ + moves         │ [chip][chip][chip][chip] │   (no motion)
   └──────────────────┘                 │      ┌────────────┐      │
   reach data = move arm,               │      │ controller │      │ ← finds any cell
   wait for spin (slow)                 │      └────────────┘      │   electronically
                                        └──────────────────────────┘
```

## Why random access stops hurting

Here's the payoff. On an HDD, scattered data was expensive because the head had to travel to it. On an SSD,
*there is no travel.* Reaching cell #5 and reaching cell #5,000,000 take essentially the same tiny amount of
time, because the controller addresses them electronically rather than steering an arm to them.

This is the single most important fact about SSDs: **the seek time and rotational latency from Phase 1 are
gone.** That whole category of cost doesn't exist when nothing moves.

```text
   Reading 100 scattered little files:

   HDD:  seek+spin+read · seek+spin+read · seek+spin+read · …  (slow, every time)
   SSD:  read·read·read·read·read·read·read·read·read·read·…   (no seek, no spin)
```

**What it does in real life.** Remember that booting and launching apps means thousands of small scattered
reads - the workload that made an HDD crawl. That's precisely the workload an SSD demolishes. Random access is
dramatically faster on flash than on a spinning disk - not a little faster, but in a different class entirely.
Sequential reads are faster too, but it's the random-access difference you actually *feel* day to day.

💡 **Key point - this is why an old machine "feels new" with an SSD.** When people swap an HDD for an SSD in an
aging laptop, they describe it as the single biggest speedup they've ever felt - boot, login, opening apps,
switching between them, all snappy. Nothing else changed: same CPU, same RAM. What changed is that every
operation that was secretly waiting on a moving arm now isn't. The computer was rarely slow at *thinking*;
it was slow at *fetching*.

## The trade-offs (the honest part)

An SSD isn't strictly better than an HDD on every axis, and pretending otherwise would set you up for a
surprise. There are two real costs.

**1. Cost per gigabyte.** Flash is more expensive per gigabyte than spinning platters. The gap has narrowed
a lot over the years, but for the same money you can still buy substantially more HDD capacity than SSD
capacity. This is why the practical sweet spot is often *both*: a small fast SSD for the OS and apps, a large
cheap HDD for bulk files.

**2. Flash cells wear out.** This one surprises people, so let's be precise: a flash cell can only be
rewritten a limited number of times before it stops holding a charge reliably. Reading doesn't wear it;
*writing* does. Left naïve, a drive that kept rewriting the same cells (say, a frequently-updated file) would
kill those cells while the rest of the drive sat untouched.

📝 **Terminology.** **Wear-leveling** is how the controller solves this. Instead of repeatedly writing to the
same physical cells, it spreads writes evenly across *all* the cells, so they age together rather than a few
dying early. You never see this happening - the controller quietly remaps where data physically lives behind
the scenes.

```text
   Without wear-leveling:            With wear-leveling:
   ████░░░░░░░░░░░░░░░░               ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    ↑ same cells hammered             writes spread across all cells,
      to death, rest unused           so the whole drive ages evenly
```

⚠️ **Gotcha - don't defragment or "optimize" an SSD.** From Phase 1: defragmenting exists to make an HDD's
head travel less. An SSD has no head, so defragmenting buys you nothing - and worse, it's a giant pile of
*writes*, which is the one thing that actually wears flash. Modern operating systems know this and won't
defrag an SSD; they run a different maintenance command instead (often called **TRIM**), which tells the
drive which blocks are no longer in use so it can keep write performance high. Let the OS handle it; don't run
old HDD-era "optimizers."

**How worried should you actually be about wear?** For normal desktop and laptop use, honestly: not very. With
wear-leveling spreading the load, a typical SSD will comfortably outlast the useful life of the computer it's
in under everyday workloads. Wear becomes a genuine planning concern mainly in write-heavy server scenarios
(busy databases, logging, video capture), where drives are chosen specifically for high write endurance. For
the laptop on your desk, it's good to *understand* the mechanism, but it's not something to lose sleep over.

## Recap

1. An **SSD** stores data in **flash (NAND) cells** with **no moving parts** - a **controller** addresses any
   cell electronically.
2. Because nothing moves, **seek time and rotational latency are gone**, so **random access is dramatically
   faster** than an HDD - that's the speedup you feel when booting and launching apps.
3. Trade-off one: flash costs **more per gigabyte**, so SSD + HDD together is often the smart split.
4. Trade-off two: cells **wear out with writes**, but **wear-leveling** spreads writes so the drive ages
   evenly - rarely a worry for everyday use. Don't defragment an SSD; let the OS run **TRIM**.

There's one more twist, and it's the one almost nobody tells you: even with all this flash speed, your SSD can
still be held back - not by the flash, but by the *cable it plugs into*. That's the next phase.

Watch it animated: [SSD vs. HDD](/explainers/SSDvsHDD.dc.html)

---

[← Phase 1: HDD - Spinning Rust](01-hdd-spinning-rust.md) · [Guide overview](_guide.md) · [Phase 3: NVMe vs SATA →](03-nvme-vs-sata.md)
