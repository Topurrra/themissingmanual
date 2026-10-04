---
title: "Snapshots and Rolling Back"
guide: "when-omarchy-breaks"
phase: 2
summary: "How Omarchy 4 takes a snapshot before every update, how to boot into one from the Limine menu and restore it, what a rollback leaves untouched, and why rolling back first is the right move after a bad update."
tags: [omarchy, snapshots, rollback, snapper, limine, updates, recovery]
difficulty: intermediate
synonyms: ["how to roll back omarchy update", "omarchy snapshot restore", "omarchy-snapshot create", "omarchy limine boot menu snapshot", "undo omarchy update", "omarchy bootable snapshot notification", "omarchy direct boot snapshots", "does omarchy snapshot back up my home folder"]
updated: 2026-10-04
---

# Snapshots and Rolling Back

You ran the update, restarted, and the desktop you knew is gone. The instinct is to investigate: what changed, which package, which log. Resist it for a few minutes. Omarchy made you a save point before the update started, and going back to it is faster than understanding the damage.

## What a snapshot is

A snapshot is a frozen record of how your system files looked at one moment, like a save point in a game. You can keep playing from the present, or load the save and be exactly where you were. Omarchy makes them with snapper, a snapshot tool, and its snapper policy targets a btrfs root filesystem, a kind that makes snapshots cheap because it records the state without copying everything.

Omarchy's own snapper policy is deliberately small:

- It snapshots the root of the system (`/`), nothing else.
- It keeps the **5 most recent** and discards older ones.
- It takes no timed snapshots, only the ones triggered by an update or by you.

That last point matters. Your safety net is five save points, not a rolling history. After five updates, the snapshot from before the oldest one is gone.

## When Omarchy takes them

Every `omarchy update` follows the same sequence, and the snapshot is taken before anything changes:

```mermaid
flowchart LR
  A["Confirm"] --> B["Snapshot"]
  B --> C["Packages"]
  C --> D["Migrations"]
  D --> E["Restart checks"]
```

*What just happened:* after you confirm, Omarchy snapshots first, then updates packages, then runs migrations (small scripts that bring your setup in line with the new release), then asks about any restarts. If it fails anywhere after the second box, the save point already exists.

This is also why Omarchy blocks a bare `sudo pacman -Syu`. The guard stops the upgrade and points you to `omarchy update`, because a direct upgrade skips the snapshot and the migrations. The manual's wording is that you "miss the snapshot, migrations, and configuration updates."

Before a change you are nervous about, such as editing a lot of config or trying a risky package, make your own:

```console
$ omarchy snapshot create
Create system snapshot
Snapshots can be selected during boot.
```

*What just happened:* those two lines are what the command prints. It asked snapper for a new snapshot and then trimmed the list back to five.

If snapper has nothing configured, the command refuses loudly instead of pretending:

```console
$ omarchy snapshot create
No Snapper configs found, so no snapshot was created.
```

⚠️ **Gotcha.** That message is the one to take seriously. Silence from a snapshot command would look like success, so Omarchy prints it on purpose. If you ever see it, you have no save point, and the next update is not recoverable this way.

## Rolling back from the boot menu

Snapshots work only on installs using the **Limine** bootloader, which has been the default since Omarchy 2.0. They do not work on GRUB or systemd-boot. The boot menu is titled "Omarchy Bootloader".

The steps, from the manual:

1. **Restart** the machine and open the boot menu.
2. **Pick a snapshot** by its date. The Omarchy version at the time of the snapshot shows in the bottom-left corner, so you can tell the pre-update one from an older one.
3. **Boot into it.** A notification appears telling you that you are in a bootable snapshot.
4. **Restore.** Click the notification to start the restoration, or run `omarchy snapshot restore` in a terminal. That command runs `limine-snapper-restore` for you.

The boot menu is the whole point. It lives before your desktop, so it works even when the desktop will not start at all.

**If you boot straight to the decryption screen.** Omarchy has a _Setup > Direct Boot_ option that skips the menu. With it on, you must choose Limine from your firmware's boot menu (the BIOS or UEFI boot picker) to reach your snapshots. Running _Setup > Direct Boot_ again removes the shortcut. It refuses to run on American Megatrends and Apple firmware.

> 💡 **Key point.** If you never touch the boot menu, you will not know how to reach it on the day you need it. Restart once on a calm afternoon and look at it.

## What a rollback does not touch

A restore brings back your **root filesystem**, but **not your `/home`**. The manual says what follows from that:

- It is a fix for a broken system update. It is not a way to recover files you deleted.
- Your `~/.config` stays as it is. If the older package version expects an older config format and your files were already migrated to a new one, you have to sort that out by hand.

So a rollback is safe for your documents. It is also exactly why a bad config edit survives a rollback, as [Phase 1](01-the-cheat-card-and-the-repair-ladder.md) showed. Rolling back puts you on the old version. The update that caused the trouble is a problem for another day, so ask in `#omarchy-help` before you update again.

## Your turn: the update that broke the desktop

You ran _Update > Omarchy_ twenty minutes ago and restarted. The desktop comes up with a bare wallpaper and no bar. You can open a terminal with `Super + Return`. You are presenting at 10:00, and it is 9:20. Every move costs real minutes.

```scenario
{
  "title": "9:20 - the bar is gone after the update",
  "brief": "You updated Omarchy twenty minutes ago and rebooted. The wallpaper is there but the bar is missing and Super + Space does nothing. Super + Return still opens a terminal. You present at 10:00 and every move you make costs minutes.",
  "prompt": "What do you do first?",
  "clock": { "unit": "min", "running": "burned", "resolved": "to a working desktop" },
  "resolvedHeading": "You are back. Here is how that went.",
  "actions": [
    { "id": "restart-shell", "label": "Run omarchy restart shell", "cost": 2,
      "reveals": "$ omarchy restart shell\n(the wallpaper flickers, the bar does not return)",
      "note": "A cheap and sensible first try, and it rules out a one-off crash. Here it changes nothing." },
    { "id": "journal", "label": "Read the warnings with journalctl -b -p 4..1", "cost": 8,
      "reveals": "$ journalctl -b -p 4..1\n(hundreds of warning lines, most of them harmless noise on any boot)",
      "note": "Reading logs is how you learn why. It is the right move for a normal bug and an expensive one when a save point is already sitting there." },
    { "id": "update-log", "label": "Read /tmp/omarchy-update.log", "cost": 5,
      "reveals": "$ omarchy update analyze logs\n(no failure conditions reported)",
      "note": "No known failure pattern. Useful to know, and it still does not give you a working desktop." },
    { "id": "pacman", "label": "Run sudo pacman -Syu to pull the newest fixes", "cost": 4,
      "reveals": "The Omarchy guard aborts the transaction and points you to omarchy update.",
      "note": "Reasonable if you know Arch. Omarchy blocks it on purpose, because a direct upgrade skips the snapshot and the migrations." },
    { "id": "help", "label": "Run omarchy debug and upload the log, then wait for answers in #omarchy-help", "cost": 12,
      "reveals": "You post the log link and the question. People help, and it takes a while.",
      "note": "Asking is good practice and you will do it in Phase 4. It is slow when a faster fix is available, so roll back first and ask afterwards." },
    { "id": "reinstall", "label": "Run omarchy reinstall", "cost": 15,
      "reveals": "This will reinstall all default Omarchy packages and reset default configs.\nWarning: user config changes will be overwritten.",
      "note": "It would probably work, and it overwrites your config changes to fix a problem a rollback could undo without touching them." },
    { "id": "rollback", "label": "Restart, pick the snapshot from before the update in the boot menu, then restore it", "cost": 6, "resolves": true,
      "note": "Back on the old version, home folder untouched. You still do not know what broke, and you did not need to." }
  ],
  "debrief": {
    "ideal": 6,
    "text": "After an update, the move that ends the problem is the one you can make before you understand it. Roll back, present, and investigate on your own time.",
    "notes": [
      { "when": "if-taken", "action": "journal",
        "text": "You read the logs before rolling back. That instinct is correct for most bugs. When a snapshot exists, understanding can wait until the deadline is safe." },
      { "when": "if-taken", "action": "reinstall",
        "text": "You reached for the largest rung when a smaller one covered it. Reinstalling resets your configs, which a rollback would have left alone." },
      { "when": "if-not-taken", "action": "restart-shell",
        "text": "Restarting the shell is worth two minutes first, because a one-off crash is the cheapest explanation." }
    ]
  }
}
```

Check yourself before moving on:

```quiz
[
  {
    "q": "You want a save point before editing a lot of config. What do you run?",
    "choices": ["omarchy snapshot create", "omarchy update -y", "omarchy reinstall"],
    "answer": 0,
    "explain": "omarchy snapshot create asks snapper for a snapshot of the system root. Updates make one automatically, but this makes one on demand.",
    "why": [
      null,
      "That runs a full update, which changes the system rather than saving it.",
      "That resets your configs to defaults, so it is the opposite of a save point."
    ]
  },
  {
    "q": "After you restore a snapshot, what is true of your home folder?",
    "choices": [
      "It is rewound to the same moment as the system",
      "It is left exactly as it was, including ~/.config",
      "It is wiped and recreated from defaults"
    ],
    "answer": 1,
    "explain": "A restore reverts the root filesystem but not /home. That is why it fixes a bad update and cannot recover deleted personal files."
  },
  {
    "q": "Your machine boots straight to the decryption screen and skips the menu. How do you reach a snapshot?",
    "choices": [
      "You cannot, snapshots are gone",
      "Choose Limine from the firmware's boot menu first",
      "Reinstall Omarchy"
    ],
    "answer": 1,
    "explain": "With Direct Boot on, the firmware goes straight to Omarchy. Pick Limine in the BIOS or UEFI boot menu to get the snapshot list, or run Setup > Direct Boot again to remove the shortcut."
  }
]
```

## Recap

1. Omarchy snapshots the system root before every update, keeps the 5 most recent, and takes no timed snapshots.
2. `omarchy snapshot create` makes your own, and "No Snapper configs found" means you have no save point.
3. To roll back: restart, pick the snapshot in the Limine menu, boot it, then restore from the notification or with `omarchy snapshot restore`.
4. A restore rewinds the system root only. `/home` and `~/.config` are left as they are.
5. After a bad update, roll back first and investigate later.

Next up, [Reading Logs and Rescuing a Desktop That Will Not Start](03-reading-logs-and-rescuing-a-dead-desktop.md): when the problem is yours, or the rollback is not enough.
