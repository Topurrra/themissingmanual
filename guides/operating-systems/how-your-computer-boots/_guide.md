---
title: "How Your Computer Boots"
guide: how-your-computer-boots
phase: 0
summary: "What actually happens between pressing the power button and reaching a login screen - firmware, bootloader, and kernel handing off control in sequence."
tags: [operating-systems, boot, firmware, bios, uefi, bootloader, kernel]
category: operating-systems
order: 10
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

# How Your Computer Boots

You press the power button. A few seconds later - sometimes a minute, if it's an old machine having a bad day - you're looking at a login screen or a desktop. In between, a surprising amount of handoff happens: firmware waking up the hardware, a small program finding and loading a much bigger program, and that bigger program taking over the entire machine. Each stage exists because the one before it *has to stop trusting itself* and hand control to something that knows more.

This guide walks that chain in order - each link only makes sense once you know what came before it.

## How to read this

Read it start to finish; the phases build on each other. Phase 1 covers the moment power arrives: firmware waking the hardware and finding something bootable. Phase 2 is the bootloader's one job - finding and loading a kernel. Phase 3 is the kernel taking over the machine and handing off to whatever puts a shell or desktop in front of you. The examples cover both the BIOS/GRUB world and the UEFI/Windows Boot Manager world, because the stages are the same shape either way.

## The phases

1. [Power to POST to firmware](01-power-to-post.md) - what BIOS/UEFI actually does before anything else can run.
2. [The bootloader's job](02-the-bootloader.md) - finding and loading the kernel, and what a dual-boot menu really is.
3. [Kernel init to login screen](03-kernel-init-to-login.md) - the kernel taking over hardware and handing off to init/systemd or Windows' session manager.

[Phase 1: Power to POST to firmware](01-power-to-post.md) →
