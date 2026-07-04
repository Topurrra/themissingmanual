---
title: "Power to POST to firmware"
guide: how-your-computer-boots
phase: 1
summary: "What actually happens between pressing the power button and reaching a login screen — firmware, bootloader, and kernel handing off control in sequence."
tags: [operating-systems, boot, firmware, bios, uefi, bootloader, kernel]
difficulty: beginner
synonyms:
  - how does a computer boot
  - what happens when you turn on a computer
  - what does bios do
  - what does uefi do
  - how does the bootloader work
  - what happens between power button and login screen
updated: 2026-07-04
---

# Power to POST to firmware

The instant you press the power button, there is no operating system anywhere in the picture. No Windows, no Linux, no macOS — nothing has loaded yet, because nothing *can* load yet. RAM is empty. The CPU has no idea what program to run. The only thing that exists at this moment is a small chip on the motherboard holding a program that never goes away: the **firmware**.

That firmware is what you know as **BIOS** (Basic Input/Output System) on older machines, or **UEFI** (Unified Extensible Firmware Interface) on nearly everything made in the last decade or so. Same job, different generation of tooling. It's the first code the CPU ever executes, and its entire purpose is to get the machine into a state where an operating system *could* run — it doesn't run one itself.

## The first job: wake up the hardware

The moment the CPU gets power, it jumps to a fixed memory address that's wired to point at the firmware chip, not at RAM — RAM is empty and untested at this point, so nothing useful could live there yet. The firmware's first task is basic and unglamorous: figure out what hardware actually exists.

```text
1. CPU powers on, jumps to the firmware's entry point (not RAM — RAM is untested)
2. Firmware initializes the memory controller so RAM becomes usable
3. Firmware enumerates hardware: keyboard, storage controllers, GPU, USB
```

*What just happened:* before this point, the machine doesn't even know it has a keyboard or a hard drive attached. The firmware has to probe the hardware and initialize each piece enough that it responds — this is the literal meaning of "booting," pulling yourself up by your own bootstraps with nothing to stand on yet.

## POST: the self-test you never see unless something's wrong

Once hardware is minimally awake, the firmware runs the **Power-On Self-Test**, or **POST**. This is a quick health check: is RAM responding correctly, is a GPU present, are the storage controllers alive. You mostly never see this happen because it takes a fraction of a second on healthy hardware — the manufacturer's logo you glimpse on screen *is* POST finishing successfully.

You only notice POST when it fails. A stick of RAM seated wrong produces a series of beeps from the motherboard speaker instead of a boot — that's POST refusing to continue because a basic component didn't respond. No operating system, no error message on screen even, because the video output itself might not be confirmed working yet. Beep codes are POST's only language when the screen can't be trusted.

> POST isn't optional ceremony. It's the firmware refusing to hand control to a bootloader until it has some confidence the CPU, memory, and basic I/O actually work.

## Finding something to boot

With hardware confirmed alive, the firmware needs one more thing: a device to boot *from*. This is where BIOS and UEFI genuinely differ in mechanism, though not in intent.

**BIOS** walks a configured list of devices — hard drive, USB, network — in order, and for each one reads the very first sector of the disk (512 bytes, called the **Master Boot Record** or MBR). If that sector ends with a specific two-byte signature, BIOS treats it as bootable and hands control to whatever code lives there.

**UEFI** works differently: it reads a proper partition table (**GPT**, GUID Partition Table) and looks for a dedicated **EFI System Partition** — a small FAT-formatted partition containing `.efi` files, actual recognizable programs rather than a raw 512-byte blob. This is more structured, supports larger disks, and is part of why UEFI machines generally boot faster than old BIOS ones.

```text
BIOS + MBR:   read disk's first 512 bytes -> check for boot signature -> jump to it
UEFI + GPT:   read EFI System Partition -> find a .efi bootloader file -> execute it
```

*What just happened:* both approaches solve the identical problem — "where do I find the next program to run?" — but UEFI's answer is a filesystem with named files, while BIOS's answer is "whatever raw bytes happen to sit in a fixed disk location." That difference is why UEFI eventually replaced BIOS as the industry standard, though many people still say "BIOS" out of habit even when their machine runs UEFI.

## Secure boot, briefly

Modern UEFI firmware supports **secure boot**: before executing that `.efi` bootloader file, the firmware checks its cryptographic signature against keys it trusts. If the signature doesn't match — because the bootloader was tampered with, or it's an unsigned OS installer — firmware refuses to run it. It's a small trust check that closes a real attack window: malware that infects the boot chain before an OS (and its antivirus) ever loads. This guide won't go deeper into it, but it's worth knowing the check exists at exactly this handoff point.

Once firmware finds a valid boot target, its job is essentially done. It hands the CPU over to that code and steps out of the picture — which is exactly where the bootloader picks up.

[← Overview](_guide.md) | [Phase 2: The bootloader's job →](02-the-bootloader.md)
