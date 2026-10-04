---
title: "Reading Logs and Rescuing a Desktop That Will Not Start"
guide: "when-omarchy-breaks"
phase: 3
summary: "Where Omarchy and Linux write down what went wrong (the journal, the update log, the debug report), how to log in as text when the desktop will not start, and how to fix a config file you broke."
tags: [omarchy, logs, journalctl, tty, hyprland, troubleshooting, recovery]
difficulty: advanced
synonyms: ["omarchy desktop will not start", "omarchy black screen after login", "how to read journalctl on omarchy", "omarchy update log", "omarchy initramfs generation may have failed", "omarchy ctrl alt f2 tty", "omarchy broke my bindings.lua", "omarchy update not enough disk space", "omarchy locked out faillock"]
updated: 2026-10-04
---

# Reading Logs and Rescuing a Desktop That Will Not Start

A rollback fixes a bad update. It does not fix the config you edited last night, a disk that filled up mid-update, or a problem you want to understand before you try again. For those you need two skills: reading what the machine wrote down, and getting a login when the graphical desktop will not appear.

## Logs are the machine's diary

Almost everything on a modern Linux system writes its complaints to one place, the **journal**, and you read it with `journalctl`. It is noisy on purpose: it records everything and leaves the sorting to you. These are the views worth knowing.

| What you want | Command |
|---|---|
| Warnings and worse from this boot | `journalctl -b -p 4..1` |
| The last 100 lines the Omarchy shell logged | `journalctl -t omarchy-shell -n 100 --no-pager` |
| The shell's log, live as you reproduce the problem | `journalctl -t omarchy-shell -f` |
| Kernel messages (hardware and drivers) | `sudo dmesg` |
| All of the above in one report | `omarchy debug --print --no-sudo` |

What the flags mean: `-b` is "this boot only", `-p 4..1` is a priority range from warning up to alert (so it hides the chatter), `-t` filters by the tag a program logs under, `-n 100` is the last 100 lines, `-f` follows new lines as they arrive, and `--no-pager` prints straight to the screen instead of opening a scrolling viewer.

The `omarchy-shell` tag is useful because the desktop shell (the bar, menus, panels, lock screen) is one long-running program. If a bar or panel will not draw, that tag is where it says why.

> 💡 **Key point.** Do not read a log top to bottom. Find the time you did the thing that broke, and read the first warning or error near it. Many warnings appear on every healthy boot, so a line that is new, repeated, or that appears right before the failure is the one that matters.

## The update log and the warning not to ignore

`omarchy update` records a transcript of everything it printed in `/tmp/omarchy-update.log`. After an update, Omarchy can scan it for known failures:

```bash
omarchy update analyze logs
```

The one check it runs today looks for a failed **initramfs** build and prints this warning:

```text
Error: Initramfs generation may have failed. Review logs before restart.
```

An initramfs is the small image your kernel loads at the very start of a boot, before your real filesystem is available. On an encrypted machine it holds what is needed to unlock and mount the disk. If the build failed and you reboot, the next boot can fail before the desktop, or even the login, appears.

⚠️ **Gotcha.** If you see that warning, **do not reboot**. Read `/tmp/omarchy-update.log`, copy it somewhere safe (`/tmp` is a temporary folder), and ask for help with it (see [Phase 4](04-hardware-gremlins-getting-help-and-reinstalling.md)). If you reboot anyway and it will not start, you still have the snapshot Omarchy took before the update, reachable from the boot menu.

Two other update failures are common:

- **Not enough free space.** Omarchy checks free space on `/` before it asks you to confirm, and stops if there is less than 10 GiB. Make room first, for example with _Remove > Package_ or `omarchy update pkg prune` (which prunes superseded versions from the pacman package cache). A bypass exists (`OMARCHY_UPDATE_FORCE=1`), but a disk that fills up halfway through an update is exactly the failure you are avoiding, so use it only if you know you have room.
- **An update that stopped partway.** Migrations run after the packages. `omarchy migrate --pending` lists any that have not finished, and `omarchy migrate` runs them.

## When the desktop will not start

Work out how far the boot got, because that tells you where to look.

| What you see | Meaning | Go to |
|---|---|---|
| No boot menu, firmware screen only | Below Omarchy | Your firmware boot menu; see Direct Boot in [Phase 2](02-snapshots-and-rolling-back.md) |
| Boot menu, then the machine fails to start | The system layer | Roll back from the boot menu |
| Decryption prompt, login, then a black screen or no desktop | Your session or your config | A text login, below |

### A text login

A **TTY** is a plain text console: no windows, no mouse, only a login prompt. Your desktop is one program that runs on top of it, so when the desktop fails, the text console usually still works. The manual uses `Ctrl + Alt + F2` to reach one:

1. Press `Ctrl + Alt + F2`.
2. Log in with your username and password.
3. Look at the evidence:

```bash
journalctl -b -p 4..1 | less
omarchy debug --print --no-sudo | less
```

(`less` is a viewer: arrow keys scroll, `q` quits.) If you are new to this kind of prompt, [The Terminal & Shell, Explained](/guides/the-terminal-and-shell) covers the basics.

### Fixing a config you broke

Your Hyprland config is Lua, and `~/.config/hypr/hyprland.lua` loads your files in a fixed order: the Omarchy defaults first, then `monitors`, `input`, `bindings`, `looknfeel`, and `autostart`. So the suspect is almost always the file you edited last. Your files load after the defaults, so a mistake in one of them can override a working default.

1. **Put your backup back.** If you followed the habit below, copy it over the broken file.
2. **Or edit the file and undo your last change.** Use any terminal editor you have; Neovim (`nvim`) ships with Omarchy. Comment out the lines you added by starting each with `--`, which is a Lua comment, then save with `:wq`.
3. **Restart the session.** In a text login, `reboot` is enough.

If you are still in a working desktop, `omarchy refresh config hypr/bindings.lua` copies the shipped file over yours and keeps a backup of yours beside it. `omarchy refresh hyprland` does that for all the Hyprland Lua files, and _Update > Config > Hyprland_ is the menu route. The refresh command reads the `OMARCHY_PATH` variable, which a bare text login may not have set, so do not count on it there. Your own backup or the edit above is the reliable path there.

The habit that makes all of this cheap, before you edit any config:

```console
$ cp ~/.config/hypr/bindings.lua ~/.config/hypr/bindings.lua.bak
```

*What just happened:* you made a copy next to the original. If the edit goes wrong, the fix is copying it back, with no searching and no guessing.

### Locked out of your own login

If you typed your password wrong too many times and are locked out, the manual's advice is to press `Ctrl + Alt + F2` for a text login, sign in as root, and run:

```bash
faillock --reset --user [your-username]
```

That clears the lockout counter. One caveat: Omarchy's 4.0.1 release notes list removing a "sudo lockout reset command" among security fixes, and we could not confirm that the manual's steps work unchanged on 4.0.4. If they do not, ask in `#omarchy-help` rather than guessing.

## Your turn: read the evidence

Check your reading skills:

```exercise
[
  {
    "type": "predict",
    "task": "Type the journalctl command that shows only warnings and worse from the current boot, using the priority range 4..1.",
    "accept": ["/^journalctl\\s+(-b\\s+-p\\s*4(\\.\\.1)?|-p\\s*4(\\.\\.1)?\\s+-b)\\s*$/i"],
    "hint": "Two flags: one for 'this boot only', one for the priority range."
  }
]
```

```quiz
[
  {
    "q": "The update ends with: Initramfs generation may have failed. Review logs before restart. What do you do?",
    "choices": [
      "Reboot right away, it is probably fine",
      "Do not reboot yet, read /tmp/omarchy-update.log and get help",
      "Run omarchy reinstall"
    ],
    "answer": 1,
    "explain": "The initramfs is needed early in the next boot. Review before restarting, and remember the pre-update snapshot is your net if you do reboot into trouble.",
    "why": [
      "A failed initramfs can stop the next boot before the desktop or login appears.",
      null,
      "A reinstall resets your configs and does not address a failed boot image."
    ]
  },
  {
    "q": "Which command follows the Omarchy shell's log live while you reproduce a problem?",
    "choices": [
      "journalctl -t omarchy-shell -f",
      "journalctl -b -p 4..1",
      "omarchy update analyze logs"
    ],
    "answer": 0,
    "explain": "-t filters by the omarchy-shell tag and -f follows new lines as they arrive."
  },
  {
    "q": "The desktop is black after you edited monitors.lua. You press Ctrl + Alt + F2 and log in. What is a reliable fix?",
    "choices": [
      "Roll back the last snapshot",
      "Restore your backup of monitors.lua or comment out your change, then reboot",
      "Edit the files in /usr/share/omarchy"
    ],
    "answer": 1,
    "explain": "monitors.lua is in your home folder, so a rollback will not touch it. Never edit /usr/share/omarchy, which belongs to Omarchy and is overwritten on update."
  }
]
```

## Recap

1. The journal is the diary: `journalctl -b -p 4..1` for warnings this boot, `journalctl -t omarchy-shell` for the shell.
2. `omarchy update analyze logs` reads `/tmp/omarchy-update.log`. On an initramfs warning, do not reboot.
3. Updates stop under 10 GiB free on `/`. Make room instead of forcing it.
4. When the desktop will not start, `Ctrl + Alt + F2` gives you a text login and the same logs.
5. A broken config is fixed by restoring your backup or undoing your last change, since your files load after the defaults.
6. Back up a config file before editing it.

Next up, [Hardware Gremlins, Getting Help, and Reinstalling](04-hardware-gremlins-getting-help-and-reinstalling.md): the problems that are not your fault, and the last resort.
