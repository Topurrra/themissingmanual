---
title: "Dual Boot and Special Installs"
guide: "installing-omarchy"
phase: 3
summary: "Install Omarchy next to Windows with a free-space install, set up an Intel Mac as an Omarchy-only machine, and handle the special cases: installing for another owner, unattended installs, and the community 'Omarchy on...' options."
tags: [omarchy, dual-boot, windows, bitlocker, limine, intel-mac, unattended-install]
difficulty: intermediate
synonyms: ["omarchy dual boot windows", "how to dual boot omarchy and windows", "omarchy bitlocker", "limine-scan", "install omarchy on intel macbook", "omarchy free space install", "install omarchy for someone else", "omarchy on virtualbox", "omarchy unattended install"]
updated: 2026-10-04
---

# Dual Boot and Special Installs

Maybe you want to keep Windows as a safety net, or you are setting up an old Mac, or the computer is for someone else. Each case changes one or two steps of the normal install. This phase covers what to change and what to watch for.

## Dual boot with Windows

A **dual boot** means two operating systems share one drive, and you pick one at startup. Omarchy supports this by installing into a single partition in unallocated space. It still encrypts that partition by default, so it is no weaker than a full-disk install. All it needs is free space on the disk.

> ⚠️ **Gotcha.** Back up before you touch partitions (Phase 1). Resizing partitions normally goes fine, but any disk operation carries some risk, and the backup is what makes that risk acceptable.

### Step 1: turn off BitLocker

The free-space install is not compatible with BitLocker, because BitLocker encrypts the whole drive rather than one partition. If the installer reports that BitLocker is enabled, boot into Windows and go to **Settings -> Privacy & Security -> Device encryption**, then toggle it off. Decrypting the drive can take a while, so start it well before you need it.

### Step 2: make free space

In Windows:

1. Type `disk management` in the Start menu and choose **Create and format hard disk partitions**.
2. Find the partition to shrink (normally your main Windows drive), right-click it, and choose **Shrink Volume**.
3. Enter how much to shrink it by. That amount becomes the size of your Omarchy install, boot partition included. The manual's example uses 50 GB; choose a size with room for your own files and apps.

When you finish, you should see a block labeled "Unallocated". That is where Omarchy will go. Do not format it.

### Step 3: install in the free space

Run the installer as in Phase 2. After you select the disk, you get the option **Free space install**. Choose it, and the rest of the disk is left alone. You can still choose an unencrypted install here as on a full-disk install, but the manual does not recommend it.

### Step 4: add Windows to the boot menu

After the install, **Limine** is your bootloader. It lists Omarchy, and you can add your other installs to it. Run this in a terminal and follow the prompts:

```bash
limine-scan
```

Choose Windows Boot Manager when it appears. From then on, startup shows both Omarchy and Windows.

*What just happened:* `limine-scan` looked for other operating systems on your machine and, once you approved them, wrote them into Limine's configuration.

## Intel Macs: Omarchy only

The manual says Omarchy has built-in support for **Intel Macs** and none directly for M-series Macs. On an Intel Mac, Omarchy must be the **only** operating system: the install wipes the drive and macOS stops booting. You can bring macOS back later with Internet Recovery.

You must first disable Apple's Secure Boot so the stick and the installed OS can boot:

1. Turn off the Mac.
2. Turn it on and immediately hold `Command + R` until the loading screen appears.
3. Choose your user and enter your password if asked.
4. In the recovery screen, choose **Utilities > Startup Security Utility** from the menu bar.
5. Authenticate with your password.
6. Choose **No Security** for Secure Boot.
7. Choose **Allow booting from external or removable media**.

Then boot the stick: insert it, restart while holding `Option`, and choose the orange EFI Boot device. Proceed with the normal install from Phase 2.

The installer detects Mac hardware and applies fixes automatically, including Broadcom Wi-Fi drivers and firmware, the SPI keyboard driver on the models that need it, and an NVMe suspend fix. Two model families need a note:

- **T1 Touch Bar MacBook Pros (late 2016):** the Touch Bar does not work and neither does sound.
- **T2 models (2017 to 2020):** the installer sets up a patched kernel, T2 audio, Apple's Broadcom Wi-Fi and Bluetooth firmware, and fan control.

The manual says community members work on these limits, and points to the `#omarchy-on-other` channel on the Omarchy Discord for current fixes. For the full model lists, see the [Mac support page](https://omarchy.org/manual/mac-support/).

## Installing for another owner

If you are setting up a machine for a family member, a new employee, or a buyer, do not answer their personal questions for them. Press `Ctrl + C` on the very first installer screen (the keyboard selection) and Omarchy offers to prepare the machine for another owner. The system installs right away, but the keyboard layout, username, and password are asked at first boot instead. The drive stays encrypted, and the password the new owner picks becomes the encryption password.

A machine you have already used can also be handed over without reinstalling, using _Setup > Reset Computer_. It asks you to type `reset`, wipes every user account and everything in `/home`, and brings back the first-boot setup. It only works on installs done from the Omarchy ISO. On an unencrypted drive it deletes data but is not a secure erase, so for sensitive data do a fresh install.

## Unattended installs

The ISO can install with no keyboard and no wizard if it finds a second drive labeled `cidata` holding configuration files such as `user_configuration.json` and `user_credentials.json`. This is for treating Omarchy as a base image for virtual machines and fleets. The details are in the manual's [unattended installs](https://omarchy.org/manual/unattended-installs/) chapter.

## "Omarchy on..." other setups

The manual's "Omarchy on..." chapter lists setups beyond a normal PC. Most are user-written guides, so expect rougher edges:

- **Apple M1 and M2:** through Asahi Alarm, with some effort, using a community guide.
- **Virtual machines:** Parallels, VirtualBox (performance probably not great, per the manual), and VMware Workstation on Windows 11.
- **Steam Deck:** it runs Arch, so there is a community setup script.
- **NixOS:** a community port of the essence of the setup, which may lag behind current Omarchy.

Anything else goes to the `#omarchy-on-other` channel on the [community Discord](https://omarchy.org/discord).

Check yourself before moving on:

```quiz
[
  {
    "q": "The installer says BitLocker is enabled during a dual boot attempt. What do you do?",
    "choices": ["Ignore it and continue", "Boot Windows, turn off Device encryption, and wait for the drive to decrypt", "Reinstall Windows"],
    "answer": 1,
    "explain": "The free-space install is not compatible with BitLocker, which encrypts the whole drive. Turn it off in Settings -> Privacy & Security -> Device encryption, then retry.",
    "why": ["The free-space install cannot proceed with BitLocker enabled.", null, "Reinstalling Windows is unnecessary. Turning BitLocker off is enough."]
  },
  {
    "q": "After a dual boot install, how do you get Windows to appear in the boot menu?",
    "choices": ["Run limine-scan and follow the prompts", "Reinstall Omarchy", "It appears automatically with no action"],
    "answer": 0,
    "explain": "Limine is the bootloader after the install, and limine-scan adds other installs, such as Windows Boot Manager, to its menu."
  },
  {
    "q": "What must be true for an Intel Mac install?",
    "choices": ["Omarchy has to be the only OS, because the install wipes the drive", "It can dual boot with macOS", "It requires Apple silicon"],
    "answer": 0,
    "explain": "The manual says Omarchy only supports being the only OS on an Intel Mac for now. M-series Macs are not directly supported."
  }
]
```

## Recap

1. Dual boot uses a free-space install. Turn off BitLocker, shrink the Windows volume to create free space, choose **Free space install**, then run `limine-scan`.
2. On an Intel Mac, Omarchy is the only OS. Disable Apple's Secure Boot in Recovery, then boot the stick with `Option`. M-series Macs are not directly supported.
3. For another owner, press `Ctrl + C` on the first screen. For an unattended install, supply a `cidata` drive.
4. VM, Steam Deck, and NixOS routes exist but are community guides.

Next up, [Your First Boot Checklist](04-your-first-boot-checklist.md): what to do in your first ten minutes on the new desktop.
