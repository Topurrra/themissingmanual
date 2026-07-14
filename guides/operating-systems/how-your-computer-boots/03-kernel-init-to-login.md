---
title: "Kernel init to login screen"
guide: how-your-computer-boots
phase: 3
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

# Kernel init to login screen

The bootloader jumped to the kernel's entry point and stepped out of the picture. What runs now is fundamentally different from everything before it. Firmware and the bootloader were both temporary - programs whose entire purpose was to get something else running, then disappear. The kernel doesn't disappear. It's going to run continuously, in the background, for the entire time the machine is on, quietly managing every piece of hardware and every process that ever runs.

## The kernel takes over hardware

The kernel's first moments are spent setting up its own view of the machine, independent of whatever firmware had already done:

```text
1. Initialize CPU-level features: interrupt handling, memory management (paging)
2. Detect and initialize devices via drivers: disk controllers, network cards, GPU
3. Set up virtual memory, so every process gets its own private address space
4. Start the scheduler, the part that decides which process runs on the CPU next
```

*What just happened:* the kernel isn't reusing firmware's hardware setup - it re-initializes things its own way, with its own drivers, because it needs far more sophisticated control than firmware ever provided. Firmware only needed to read a few files off a disk; the kernel needs to manage that disk, the network, the GPU, and every process that will ever touch them, for hours or days at a stretch.

## Mounting the root filesystem

Somewhere early in this sequence, the kernel needs to find and mount the **root filesystem** - the `/` on Linux, or the `C:\` on Windows - the filesystem holding the rest of the operating system: system libraries, configuration, every program you'll ever run. Until this mount happens, the kernel is running with nothing but what the bootloader handed it in memory (recall the initramfs from Phase 2, on Linux systems that need one).

```text
kernel finds root filesystem (e.g. on /dev/sda2) -> mounts it at /
kernel switches from temporary initramfs to the real, permanent filesystem
```

*What just happened:* this is the moment the "real" operating system installation, sitting on disk, becomes reachable. Before this, the kernel was working from a minimal, temporary environment; after this, every file the OS ships with is available.

## Handing off to init

With hardware managed and the root filesystem mounted, the kernel does something it's done at every boot since Unix in the 1970s: it starts exactly one process, by convention given process ID 1. That process is called **init**.

On most modern Linux distributions, init is **systemd**. Its job is to bring the rest of userspace to life in the right order: start system services (networking, logging, the display manager), mount any remaining filesystems, and eventually launch whatever presents a login prompt - a text login on a server, or a graphical login manager on a desktop.

```text
kernel starts PID 1 (systemd)
  -> systemd starts targets/services in dependency order
     -> networking, logging, disk services...
     -> display manager (e.g. GDM, SDDM) -> graphical login screen
```

*What just happened:* the kernel deliberately does the absolute minimum here - start one process - and then delegates all the complexity of "what services does a running system need" to that process. This is a deliberate architectural boundary: the kernel manages hardware and processes; init and everything it starts manages *policy* about what a running system should look like.

Windows draws the same boundary with different names. After its kernel (`ntoskrnl.exe`) initializes, it starts the **Session Manager Subsystem** (`smss.exe`), which sets up the environment and hands off to `winlogon.exe` and the services subsystem - eventually presenting the sign-in screen. Same shape as the Linux path: kernel does hardware and process management, then delegates to a small set of processes responsible for getting a user-facing session running.

> Every stage in this whole boot sequence follows the same rule: do the minimum needed to get the next stage running, then step aside. Firmware doesn't run an OS. The bootloader doesn't manage hardware. The kernel doesn't decide which services your desktop needs. Each layer trusts the next one to know its own job.

## Reaching the login screen

Once the display manager (or, on a server, a plain text login prompt) is running, you finally see something asking for a username and password. That single visible screen is the end product of firmware initializing hardware, a bootloader finding and loading a kernel, and that kernel bootstrapping an entire running system underneath it - all of it invisible by design, all of it happening in the handful of seconds after you pressed the power button.

Watch it animated: [how a computer boots](/explainers/Boot.dc.html)

```quiz
[
  {
    "q": "What is the firmware's job in the boot sequence?",
    "choices": [
      "Run the operating system directly",
      "Initialize hardware, run POST, and find something bootable to hand control to",
      "Manage every process for the life of the session",
      "Mount the root filesystem"
    ],
    "answer": 1,
    "explain": "Firmware (BIOS/UEFI) wakes up hardware, self-tests it, and locates a bootloader - then gets out of the way."
  },
  {
    "q": "What does a dual-boot menu actually represent?",
    "choices": [
      "A feature built into the firmware itself",
      "A list of kernels compiled together into one file",
      "Entries the bootloader was configured with, each pointing at a specific OS's kernel",
      "A choice the CPU makes based on which disk is faster"
    ],
    "answer": 2,
    "explain": "The bootloader (like GRUB) reads a configuration file listing known OS entries - it isn't discovering them fresh at every boot."
  },
  {
    "q": "After the kernel initializes hardware and mounts the root filesystem, what does it do next?",
    "choices": [
      "Directly draws the login screen itself",
      "Hands control back to the bootloader",
      "Starts a single init process (like systemd), which brings up the rest of the system",
      "Re-runs POST to double-check hardware"
    ],
    "answer": 2,
    "explain": "The kernel deliberately does the minimum: start PID 1. That init process handles starting services and eventually the login screen."
  }
]
```

[← Phase 2: The bootloader's job](02-the-bootloader.md) | [Overview](_guide.md)
