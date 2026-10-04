---
title: "Installing and Updating Software on Omarchy"
guide: "installing-and-updating-software-on-omarchy"
phase: 0
summary: "Learn how software reaches an Omarchy machine through pacman, the Omarchy repository, the AUR, web apps, and TUIs, how omarchy update keeps a rolling release safe with snapshots, and how to judge an AUR package by reading its PKGBUILD."
tags: [omarchy, pacman, aur, yay, packages, updates, snapshots, rolling-release, pkgbuild, arch-linux]
category: omarchy
order: 6
difficulty: intermediate
synonyms: ["how to install software on omarchy", "omarchy pacman vs aur", "how to update omarchy", "omarchy update command", "is the aur safe", "how to read a pkgbuild", "omarchy remove a package", "omarchy web app install", "why does omarchy block pacman -Syu", "omarchy install yay package", "omarchy rolling release update broke my system"]
updated: 2026-10-04
---

# Installing and Updating Software on Omarchy

There is no Downloads folder full of installers here, no app store window, and no `apt`. Omarchy is built on Arch Linux, so software arrives as packages managed by `pacman`, with Omarchy's menu and command wrapped around it. The first week usually brings two worries: "where do I get my apps" and "what if an update breaks everything".

This guide answers both. You will learn where each kind of software comes from and how much to trust it, how to install and remove without leaving clutter, how `omarchy update` takes a snapshot before changing anything, and how to read an AUR recipe before you run it.

Checked against Omarchy 4.0.4.

## Prerequisite

You should be comfortable opening the Omarchy menu and running a command in a terminal. [Omarchy Menus, Panels, and the CLI](/guides/omarchy-menus-panels-and-cli) covers both. If a few Linux words feel unfamiliar, [Linux From Zero](/guides/linux-from-zero) fills the gaps, and [The Filesystem Explained](/guides/the-filesystem-explained) explains why the system and your home folder are treated differently.

## How to read this

- **Installing something right now?** Jump to Phase 2.
- **Nervous about the first update?** Read Phase 3 before you press the update badge.
- **About to type `yay` or pick Install > AUR?** Read Phase 4 first. It takes ten minutes and changes what you click.
- **Want it to make sense?** Read in order.

## The phases

1. **[Where Software Comes From](01-where-software-comes-from.md)** - packages, repositories, the AUR, web apps, and what each source means for trust.
2. **[Installing, Removing, and Wrapping Apps](02-installing-removing-and-wrapping-apps.md)** - the Install and Remove menus, the `omarchy pkg` commands, web apps, and TUIs.
3. **[Updating a Rolling Release Safely](03-updating-a-rolling-release-safely.md)** - what `omarchy update` does in order, why raw `pacman -Syu` is blocked, channels, and rolling back with a snapshot.
4. **[The AUR, Risk, and Reading a PKGBUILD](04-the-aur-risk-and-reading-a-pkgbuild.md)** - what anyone-can-upload means, the red flags in a build recipe, and how to keep AUR packages on a short leash.

## Where this guide stops

Language toolchains, Docker, and shell setup are in [The Omarchy Terminal Workflow](/guides/the-omarchy-terminal-workflow). Plugins for the Omarchy shell are a different kind of add-on, covered in [Omarchy Plugins and the Marketplace](/guides/omarchy-plugins-and-the-marketplace). A system that will not boot after an update is covered in [When Omarchy Breaks](/guides/when-omarchy-breaks).
