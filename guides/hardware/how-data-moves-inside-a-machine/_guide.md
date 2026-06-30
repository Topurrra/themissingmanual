---
title: "How Data Moves Inside a Machine"
guide: "how-data-moves-inside-a-machine"
phase: 0
summary: "The roads and traffic signals inside your computer: what a bus is, how the CPU reads and writes RAM by address, how it reaches out to devices, and how interrupts let a device get the CPU's attention the instant something happens."
tags: [hardware, bus, memory-address, io, dma, interrupts, mental-model]
category: hardware
order: 4
difficulty: intermediate
synonyms: ["how does data move inside a computer", "what is a bus in a computer", "what is a memory address", "what is dma", "what is an interrupt", "memory-mapped io vs ports", "polling vs interrupts", "how does the cpu talk to devices"]
updated: 2026-06-19
---

# How Data Moves Inside a Machine

You know the parts by now - CPU, RAM, disk, keyboard, screen. But a list of parts isn't a machine. The
machine is what happens *between* them: the wiring that carries bytes from one chip to another, the
numbering scheme that lets the CPU say exactly *where* it wants data, and the signals that let a device
tap the CPU on the shoulder and say "I'm ready." This guide is about that in-between - the roads and the
traffic signals.

If you've ever wondered how a keypress gets from the keyboard into your program *instantly*, or why
copying a big file doesn't pin your CPU at 100%, the answers all live here.

> ⏭️ New to the hardware picture? Skim [How a Computer Works](/guides/how-a-computer-works) and
> [CPU, RAM, and Storage](/guides/cpu-ram-and-storage) first, then come back - this guide assumes you
> know what those parts are and zooms into how they *talk*.

## How to read this
- **Want the core idea fast?** Read [Phase 1: Buses & Addresses](01-buses-and-addresses.md) - it's the
  foundation the other two phases build on.
- **Want it to finally make sense?** Read in order. Each phase adds one layer: the wiring, then reaching
  devices over that wiring, then how devices signal back.

## The phases
1. **[Buses & Addresses](01-buses-and-addresses.md)** - what a bus *actually is* (shared wiring), how
   every byte of RAM has a number, and how the CPU reads and writes memory over the memory bus.
2. **[How the CPU Talks to Devices (I/O)](02-how-the-cpu-talks-to-devices.md)** - reaching past RAM to
   disks, keyboards, and network cards; memory-mapped I/O vs ports; and DMA, the trick that lets a device
   move data without bothering the CPU for every byte.
3. **[Interrupts - Getting the CPU's Attention](03-interrupts.md)** - how a device says "I have data
   ready" without the CPU constantly checking, why that's the difference between polling and interrupts,
   and why it's what makes a computer feel responsive.

> This guide stays at the "how it works" level. Cache hierarchies, bus protocols like PCIe by the wire,
> and how the OS wires up interrupt handlers are deeper topics for follow-up guides - we'll point you
> toward [What an Operating System Is](/guides/what-an-operating-system-is) where the software side picks
> up.

---

[Phase 1: Buses & Addresses →](01-buses-and-addresses.md)
