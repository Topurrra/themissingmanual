---
title: "HDD - Spinning Rust"
guide: "storage-hdd-ssd-nvme"
phase: 1
summary: "A hard disk drive stores data on spinning metal platters that a tiny arm physically flies across; that mechanical movement is why random access is slow (seek time plus rotational latency) while sequential reads stay reasonable - and why HDDs are still the cheapest way to store a lot of data."
tags: [storage, hdd, hard-disk, platter, seek-time, rotational-latency, sequential-access]
difficulty: intermediate
synonyms: ["how does a hard disk drive work", "why is a hard drive slow at random access", "what is seek time", "what is rotational latency", "are hard drives still worth buying", "what is a platter in a hard drive"]
updated: 2026-06-19
---

# HDD - Spinning Rust

Before we can explain why an SSD feels like magic, you have to feel the thing it replaced. So picture the
oldest, most stubborn storage technology still in wide use: the **hard disk drive**, or HDD. Engineers
affectionately call it "spinning rust," and once you see inside one, the nickname is perfect.

The whole reason an HDD behaves the way it does - fine for some tasks, painfully slow for others - comes down
to one fact: *it has moving parts*. Data lives on a physical surface, and to read any piece of it, the drive
has to physically move to where that piece is. Hold that idea and everything else follows.

## What's actually inside

**What it actually is.** An HDD is a stack of rigid, spinning metal disks - called **platters** - coated in
a magnetic material. Data is stored as microscopic magnetized spots on the surface. Floating a hair's width
above each platter is a **read/write head** on the end of a swinging arm. The platters spin continuously at
high speed; the arm swings in and out to position the head over the right part of the surface.

📝 **Terminology.** A **platter** is one of the spinning disks. A **track** is one of the concentric rings
of data on a platter (like the grooves on a record, except they're separate circles, not a spiral). A
**sector** is a small slice of a track - the smallest chunk the drive reads or writes at once. To find your
data, the drive needs the right *track* (move the arm) and the right *sector* (wait for it to spin around).

```text
        side view                          top view (one platter)
   ┌──────────────────┐
   │  ════ platter ═══ │ ← spins             ╭───────────────╮
   │  ──── head ────── │   continuously      │   ╭───────╮   │  ← outer track
   │  ════ platter ═══ │                     │   │ ╭───╮ │   │
   │  ──── head ────── │                     │   │ │ · │ │   │  ← your data is one
   └────────┬─────────┘                      │   │ ╰───╯ │   │     sector on one track
            │                                │   ╰───────╯   │
       ┌────┴────┐                           ╰───────┬───────╯
       │ arm     │ ← swings in/out                   │
       │ pivots  │   to pick a track          arm pivots from the edge to
       └─────────┘                            reach any track on the platter
```

**Why people get this wrong.** Plenty of people picture a drive as a uniform "box of bytes" where every
byte is equally far away - the way RAM actually behaves. An HDD is the opposite. *Where* your data sits on
the platter changes how long it takes to reach. Two files of the same size can take wildly different times to
read depending on whether the drive can grab them in one smooth sweep or has to hop all over the surface.

## Why random access is slow

This is the heart of it. When you ask an HDD for a piece of data that isn't where the head currently sits,
two physical things have to happen, and you wait for both:

1. **Seek time** - the arm has to swing the head to the correct track. This is mechanical movement, and it's
   slow in computer terms.
2. **Rotational latency** - even once the head is over the right track, it has to *wait* for the platter to
   spin around until the sector it wants passes underneath. On average you wait for half a rotation.

📝 **Terminology.** **Random access** means jumping to scattered, unrelated locations - read a bit here, a
bit way over there, a bit back near the start. **Sequential access** means reading a long stretch that's all
laid out in a row. An HDD is far happier with the second.

```text
   Reading 100 scattered little files (RANDOM):

   seek → wait for spin → read · · · seek → wait for spin → read · · · (×100)
   └──────────── you pay the mechanical cost every single time ────────────┘

   Reading one big 4 GB video file (SEQUENTIAL):

   seek → wait for spin → read ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
   └─ pay the cost ONCE, then the head just rides the track as it streams ─┘
```

**What it does in real life.** Booting an operating system, or launching a program, means reading hundreds
or thousands of small files scattered across the disk - the worst possible workload for an HDD, because it
pays that seek-and-wait tax over and over. Copying one enormous file, by contrast, is mostly sequential, so
an HDD handles it far better. This is exactly why a machine that boots from an HDD can take an
agonizingly long time to become usable, yet the same machine copies a big movie at a perfectly tolerable
speed.

⚠️ **Gotcha - "defragmenting" only ever made sense because of this physics.** On an HDD, if a file's pieces
get scattered across distant tracks (fragmented), reading it turns into lots of little random seeks.
Defragmenting rearranges the pieces to sit next to each other so the read becomes sequential again. That's
why it could genuinely speed up an old machine. On an SSD it does nothing useful and you should never run it
- there's no head to move, so "scattered" costs nothing. (More on why in the next phase.)

## So what is an HDD still good for?

It would be easy to write the HDD off as obsolete, but that's not honest. The thing it does better than
anything else is store a *lot* of data for very little money.

**Where it wins.** Per gigabyte, HDDs are the cheapest storage you can buy, by a wide margin, and they come
in very large capacities. For data you write once and read rarely and sequentially - backups, archives, a
media library, security-camera footage, the "bulk" tier of a NAS - the HDD's slow random access barely
matters, and its low cost per gigabyte matters a lot.

🪖 **War story.** A team I knew put their database on big, cheap HDDs to save money, then couldn't understand
why the app crawled under load. A database does the *most* random thing imaginable - tiny reads and writes to
scattered records, constantly. It was the worst possible match. Moving the database to flash (next phase)
fixed it overnight, while the HDDs went on doing what they're good at: holding the nightly backups.

**The honest summary.** An HDD is a record player for your data. Smooth and fine when it can ride one groove;
slow and clunky when it has to keep lifting the needle and hunting for a new spot. Cheap, roomy, and
mechanical - perfect for cold bulk storage, painful for anything that boots, launches, or does lots of small
scattered reads.

## Recap

1. An **HDD** stores data as magnetic spots on **spinning platters**, read by a **head** on a swinging arm -
   it has moving parts, and that's the whole story.
2. Reaching scattered data costs **seek time** (move the arm) plus **rotational latency** (wait for the spin)
   - so **random access is slow**.
3. **Sequential** reads pay that cost once and then stream, so big-file copies are fine.
4. HDDs are still the **cheapest** way to store **lots** of data - great for backups and archives, bad for
   anything that does many small scattered reads (like booting, or a database).

Now let's remove the moving parts entirely and watch what happens to that random-access tax.

---

[← Guide overview](_guide.md) · [Phase 2: SSD - Flash, No Moving Parts →](02-ssd-flash-no-moving-parts.md)
