---
title: "When Omarchy Breaks"
guide: "when-omarchy-breaks"
phase: 0
summary: "A calm repair kit for Omarchy: a symptom-to-fix cheat card, rolling back with system snapshots, reading logs, rescuing a desktop that will not start, fixing Wi-Fi, sound, sleep and display problems, getting help well, and reinstalling without losing your files."
tags: [omarchy, troubleshooting, recovery, snapshots, rollback, logs, reinstall, arch-linux]
category: omarchy
order: 12
difficulty: advanced
synonyms: ["omarchy broke after update", "how to roll back omarchy update", "omarchy snapshot restore", "omarchy black screen after update", "omarchy desktop will not start", "omarchy wifi not working", "omarchy reinstall without losing data", "how to get help with omarchy", "omarchy debug log", "omarchy troubleshooting"]
updated: 2026-10-04
---

# When Omarchy Breaks

Sooner or later you will press `Super + Space` and nothing will happen, or an update will finish and the screen will look wrong, or the Wi-Fi will vanish five minutes before a call. On a desktop where everything is a file you can edit, that moment feels worse than it is: you have more power than before, so it seems you also have more ways to have ruined it. You have not. Omarchy takes a safety snapshot before every update, keeps your own files separate from its files, and ships commands made for exactly this.

This guide gives you the order of operations: the smallest fix first, the big hammer last, and a clear idea of what each one touches. Checked against Omarchy 4.0.4.

## Prerequisite

You should be comfortable opening a terminal and running a command. If that is still new, read [The Terminal & Shell, Explained](/guides/the-terminal-and-shell) first. It also helps to know what happens between pressing the power button and seeing your desktop, which [How Your Computer Boots](/guides/how-your-computer-boots) covers. This guide is the last in the Omarchy category and leans on the sibling guides, especially [Making Omarchy Comfortable](/guides/making-omarchy-comfortable) (where your config files live) and [Installing and Updating Software on Omarchy](/guides/installing-and-updating-software-on-omarchy) (how updates work).

## How to read this

- **Something is broken right now?** Open [the cheat card](01-the-cheat-card-and-the-repair-ladder.md) and find your symptom. If an update caused it, go straight to [rolling back](02-snapshots-and-rolling-back.md).
- **Calm and want to be ready?** Read in order, then make a snapshot and a config backup before your next risky change. Ten minutes now is worth an evening later.

## The phases

1. **[The Cheat Card and the Repair Ladder](01-the-cheat-card-and-the-repair-ladder.md)** - symptom to fix at a glance, and the five rungs from "restart one thing" to "reinstall".
2. **[Snapshots and Rolling Back](02-snapshots-and-rolling-back.md)** - how Omarchy 4 snapshots, how to roll back from the boot menu, and what a rollback does not touch.
3. **[Reading Logs and Rescuing a Desktop That Will Not Start](03-reading-logs-and-rescuing-a-dead-desktop.md)** - journalctl, the update log, a text-mode login, and fixing a config you broke.
4. **[Hardware Gremlins, Getting Help, and Reinstalling](04-hardware-gremlins-getting-help-and-reinstalling.md)** - Wi-Fi, sound, sleep, displays, asking for help in a way that gets answers, and reinstalling without losing data.

> Not covered here: installing Omarchy from scratch is in [Installing Omarchy](/guides/installing-omarchy), and plugins start at [Omarchy Plugins and the Marketplace](/guides/omarchy-plugins-and-the-marketplace).
