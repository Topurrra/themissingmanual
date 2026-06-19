---
title: "How the CPU Talks to Devices (I/O)"
guide: "how-data-moves-inside-a-machine"
phase: 2
summary: "The CPU reaches devices the same way it reaches RAM — over buses — using memory-mapped I/O or port I/O; and DMA lets a device move data to and from RAM on its own, so the CPU isn't tied up copying every byte."
tags: [hardware, io, memory-mapped-io, ports, dma, devices, performance]
difficulty: intermediate
synonyms: ["how does the cpu talk to devices", "what is io", "memory-mapped io vs ports", "what is dma", "direct memory access", "why is dma faster", "how does a disk move data to ram"]
updated: 2026-06-19
---

# How the CPU Talks to Devices (I/O)

In Phase 1 the only thing on the far end of the bus was RAM. But your machine is full of other things the
CPU needs to talk to: the disk, the keyboard, the network card, the GPU. The good news is you already
have the mental model. Talking to a device works *a lot* like talking to memory — it's the same idea of
addresses and a bus, pointed at hardware instead of RAM. The interesting part is the last section of this
phase, where a device learns to move data *by itself*. Let's get there.

## I/O: reaching past RAM

**What it actually is.** **I/O** — input/output — is the CPU exchanging data with anything that isn't its
own registers or RAM. Input is data coming *in* (a keypress, a packet arriving, bytes read from disk);
output is data going *out* (pixels to the screen, bytes written to disk, a packet sent).

📝 **Terminology.** *I/O* (input/output) = moving data between the CPU and a device. *Device* = any piece
of hardware that isn't the CPU or main memory — disk, keyboard, network card, GPU, USB stick.

**How a device looks to the CPU.** A device isn't a blob of storage like RAM; it's a thing with controls.
A disk controller has a spot you write "read sectors 100–200" into, a spot you read the status from
("busy" / "done" / "error"), and a spot the data flows through. These spots are called the device's
**registers**, and the CPU's whole conversation with a device is reading and writing those registers.

The question is: *how* does the CPU address them? There are two classic answers, and every machine uses
one or both.

## Two ways to address a device

### Memory-mapped I/O

**What it actually is.** The system reserves a chunk of the address space and wires it to a device
instead of to RAM. The device's registers get **real memory addresses**. So the CPU talks to the device
using the *exact same* read/write-an-address mechanism from Phase 1 — it just happens that address 0xFE00
leads to the network card instead of to a memory slot.

```text
   one address space, carved up:

   0x0000 ┌──────────────────────────┐
          │   RAM                     │   normal memory slots
          │                           │
   0xFE00 ├──────────────────────────┤
          │   network card registers  │   ← a write here goes to the DEVICE,
          │   disk controller regs    │     not to a memory chip
   0xFFFF └──────────────────────────┘
```

**Why this is elegant.** The CPU needs *no special instructions* for devices. "Write this value to that
address" already exists; reuse it. The downside: those addresses are spent — they can't also be RAM —
which is one reason a 32-bit machine with 4 GB installed sometimes can't use all 4 GB. Some of the
address range is claimed by devices.

### Port I/O

**What it actually is.** The other approach gives devices their own separate numbering — **ports** — that
live *outside* the memory address space, reached with dedicated CPU instructions (on x86, literally `in`
and `out`). Port 0x60 is the keyboard controller; the CPU runs an `in` from port 0x60 to read the latest
key.

📝 **Terminology.** *Port* (in this hardware sense) = a device's address in a separate I/O address space,
accessed with special I/O instructions rather than normal memory reads and writes. (This is *not* the
same thing as a network port like 443 — same word, different world.)

**The honest comparison.** Neither is "better"; they're a design trade-off:

```text
   ┌──────────────────┬─────────────────────────────┬──────────────────────────────┐
   │                  │  Memory-mapped I/O           │  Port I/O                    │
   ├──────────────────┼─────────────────────────────┼──────────────────────────────┤
   │  Addressing      │  shares the memory address   │  separate I/O address space   │
   │                  │  space with RAM              │                               │
   │  CPU support     │  none extra — normal load/   │  needs special instructions   │
   │                  │  store instructions          │  (e.g. in / out)              │
   │  Cost            │  uses up memory addresses    │  keeps memory space free, but  │
   │                  │                              │  adds a separate mechanism    │
   └──────────────────┴─────────────────────────────┴──────────────────────────────┘
```

Modern systems lean heavily on memory-mapped I/O because reusing the memory mechanism is simpler and
scales to big, fast devices. Port I/O survives mostly for older/simpler peripherals.

## DMA: letting the device do the carrying

Now the payoff. Suppose you're reading a one-megabyte file off the disk into RAM. With everything we've
covered so far, the CPU would have to do it the slow way:

```text
   the CPU doing it by hand ("programmed I/O"):

   read byte from disk register  →  write byte to RAM  →  repeat
   read byte from disk register  →  write byte to RAM  →  repeat
   ... one million times, with the CPU busy the entire time ...
```

That works, but it's a catastrophe for performance: the CPU — the most valuable, fastest thing in the
machine — is stuck shoveling bytes one at a time, doing nothing else. While it shovels, your music can't
decode and your UI can't redraw.

**What DMA actually is.** **DMA — Direct Memory Access** — is a small dedicated helper (a *DMA
controller*, often built into the device itself) that can read and write RAM *over the bus on its own*,
without routing every byte through the CPU. The CPU sets up the job once, then steps away.

📝 **Terminology.** *DMA* (Direct Memory Access) = a device moving data to or from RAM directly, using a
DMA controller, instead of the CPU copying each byte. "Direct" means *direct to memory, around the CPU*.

**What it does in real life.** The conversation becomes a delegation:

```mermaid
sequenceDiagram
    participant CPU
    participant DMA as DMA controller
    participant RAM
    CPU->>DMA: read 1 MB from disk into RAM at Y
    Note over CPU: goes off and does other work
    loop block by block, no CPU involved
        DMA->>RAM: move the megabyte itself
    end
    DMA-->>CPU: done (an interrupt; Phase 3)
```

*What just happened:* the CPU spent a tiny moment describing the transfer, then handed the grunt work to
the DMA controller and went back to real work. The megabyte still travels over the bus — but the *CPU*
isn't the one carrying each byte. One setup, one "done" at the end, instead of a million round trips.

⚠️ **Gotcha.** DMA and the CPU share the same bus (Phase 1: only one transfer at a time). While DMA is
hauling a big block, the CPU may have to wait its turn for the bus — so DMA isn't "free," it just frees
the CPU from *doing the copy*. The win is overwhelming anyway, because the CPU gets to run real work
during almost all of the transfer instead of being pinned to byte-shoveling.

**Why this saves you later.** This is the reason a big file copy, a video stream, or a busy network
connection doesn't peg one CPU core at 100%. Disks, network cards, GPUs, and sound cards all use DMA so
the CPU stays free for actual computation. When you see throughput stay high while CPU usage stays modest,
you're watching DMA do its job. And when someone says a driver "sets up a DMA buffer," now you know
exactly what they mean: it's handing the device an address range in RAM and saying "fill this yourself."

## Recap

1. **I/O** is the CPU exchanging data with devices, and to the CPU a device looks like a set of
   **registers** it reads and writes.
2. Those registers are reached either by **memory-mapped I/O** (they get real memory addresses, reused
   from the Phase 1 mechanism) or by **port I/O** (a separate I/O address space with special
   instructions) — a trade-off, not a winner.
3. **DMA** lets a device move data to and from RAM by itself. The CPU sets up the transfer once and walks
   away, which is why moving lots of data doesn't tie up the processor.

But notice step 4 above — when the DMA controller finishes, it has to *tell* the CPU. How does a device
get the CPU's attention without the CPU constantly stopping to check? That's the last piece: interrupts.

---

[← Phase 1: Buses & Addresses](01-buses-and-addresses.md) · [Guide overview](_guide.md) · [Phase 3: Interrupts →](03-interrupts.md)
