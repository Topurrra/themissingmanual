---
title: "The bootloader's job"
guide: how-your-computer-boots
phase: 2
summary: "What actually happens between pressing the power button and reaching a login screen - firmware, bootloader, and kernel handing off control in sequence."
tags: [operating-systems, boot, firmware, bios, uefi, bootloader, kernel]
difficulty: beginner
synonyms:
  - how does a computer boot
  - what happens when you turn on a computer
  - what does bios do
  - what does uefi do
  - how does the bootloader work
  - what happens between power button and login screen
updated: 2026-07-11
---

# The bootloader's job

Firmware handed off control to a small program sitting on disk, and that program has exactly one job: find the operating system's **kernel** - the core piece of the OS that manages hardware, memory, and processes - load it into memory, and jump to it. That small program is the **bootloader**. On Linux machines it's usually **GRUB** (GRand Unified Bootloader); on Windows it's the **Windows Boot Manager**. Different names, same responsibility.

The bootloader is not the operating system, and it doesn't manage hardware or run programs. It's a loader, full stop - a program whose entire purpose is to get a bigger program into memory correctly and then get out of the way.

## Why you need a separate stage at all

Why doesn't firmware load the kernel directly, skipping the bootloader entirely? Two practical reasons. First, firmware is deliberately minimal and generic - it doesn't know how to parse a modern kernel image, decompress it, or set up the specific memory layout that kernel expects. Second, a bootloader can offer *choices*, and firmware can't reasonably do that job.

That second reason is where dual-boot menus come from.

## What a dual-boot menu is

If you've ever seen a menu at startup asking "Windows or Ubuntu?" - that's the bootloader, not firmware, presenting a list. GRUB, for instance, reads a configuration file listing every operating system it knows how to load, each entry pointing at a specific kernel file (and any parameters that kernel needs) on a specific partition.

```text
GRUB menu entries (conceptually):
  "Ubuntu"          -> /boot/vmlinuz-6.8.0  on partition 2
  "Windows Boot Mgr"-> bootmgfw.efi         on the EFI System Partition
```

*What just happened:* the bootloader isn't magically aware of every OS on your disk - it was configured (usually automatically, during OS installation) with an explicit list of entries. Install a second OS after the first, and its installer typically rewrites that configuration to add itself as a new menu entry, sometimes politely, sometimes overwriting the other bootloader entirely, which is the classic dual-boot horror story.

Pick an entry - or let the default one auto-select after a timeout, which is what happens the other 99% of the time you boot - and the bootloader moves on to loading that OS.

## Finding and loading the kernel

Once an entry is chosen, the bootloader has real work to do:

```text
1. Locate the kernel image file on disk (e.g. vmlinuz-6.8.0, or Windows' ntoskrnl.exe path)
2. Read it into memory at the address the kernel expects
3. Load an initial filesystem image if the kernel needs one (initramfs / initrd, on Linux)
4. Pass boot parameters (which disk is root, kernel flags, etc.)
5. Jump execution to the kernel's entry point
```

*What just happened:* step 3 deserves a second look. On Linux, the bootloader often loads a small temporary filesystem called an **initramfs** into memory alongside the kernel. Why? Because the kernel might need drivers to even *see* the real disk - imagine the root filesystem lives on a RAID array or an encrypted volume; the kernel needs some code loaded first to understand how to read that. The initramfs is a minimal, temporary environment that carries just enough drivers and tools to mount the real root filesystem, at which point it's discarded. Windows solves a similar problem differently, but the underlying need - "the kernel can't read its own home yet" - is the same.

> The bootloader's only real skill is finding a specific file on disk and getting it into memory intact. Everything else - dual-boot menus, parameters, fallback options - exists to make that one lookup configurable.

## The handoff

Once the kernel image sits in memory and the bootloader jumps to its entry point, the bootloader's job is complete. It doesn't stick around, doesn't run alongside the kernel, doesn't get called again until the next reboot. Control passes entirely and permanently (until next boot) to the kernel, which is a different kind of program - one built to manage hardware directly rather than find and load a single file.

That handoff is where Phase 3 begins.

[← Phase 1: Power to POST to firmware](01-power-to-post.md) | [Phase 3: Kernel init to login screen →](03-kernel-init-to-login.md)
