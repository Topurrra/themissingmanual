---
title: "Hardware Gremlins, Getting Help, and Reinstalling"
guide: "when-omarchy-breaks"
phase: 4
summary: "Restart the one piece that broke (Wi-Fi, Bluetooth, audio, trackpad), handle sleep, display, GPU and Caps Lock surprises, write a help request that gets answers using omarchy debug, and reinstall in stages without losing your files."
tags: [omarchy, hardware, wifi, audio, displays, sleep, getting-help, reinstall, backup]
difficulty: advanced
synonyms: ["omarchy wifi not working", "omarchy bluetooth stopped working", "omarchy no sound", "omarchy trackpad not working after suspend", "omarchy laptop screen black after unplugging monitor", "omarchy caps lock not working", "omarchy hybrid gpu", "how to ask for help omarchy", "omarchy debug upload log", "omarchy reinstall without losing data"]
updated: 2026-10-04
---

# Hardware Gremlins, Getting Help, and Reinstalling

Some failures are not your edit and not an update: a headset that will not reconnect, a trackpad that died after suspend, a display at the wrong size. They feel like the machine betraying you, but most clear up with a restart of one small piece. When they do not, the way you ask for help decides how fast you get it. And if everything else fails, you can reinstall in stages without losing your files, provided you backed them up first.

## Restart the piece before you reboot

A reboot restarts everything and hides which part failed. Omarchy has a restart for each piece that commonly misbehaves. The menu route is _Update > Hardware_, and each has a command:

| Symptom | Menu | Command |
|---|---|---|
| Wi-Fi gone | _Update > Hardware > Wi-Fi_ | `omarchy restart wifi` |
| Bluetooth headset will not reconnect | _Update > Hardware > Bluetooth_ | `omarchy restart bluetooth` |
| Sound vanished (for example after unplugging a monitor) | _Update > Hardware > Audio_ | `omarchy restart audio` |
| Trackpad dead after a suspend | _Update > Hardware > Trackpad_ | `omarchy restart trackpad` |
| Bar or panels broken | _Update > Process > Shell_ | `omarchy restart shell` |

The manual says reloading one of these "clears up the majority" of "it worked five minutes ago" situations. If a restart works, you also learned something: that piece needs attention, not the whole machine.

## The usual suspects

**Wi-Fi.** Networking is NetworkManager, driven by the panel on `Super + Ctrl + W`. `nmtui` gives the same controls in the terminal. If a router shares one name across 2.4GHz, 5GHz, and 6GHz and your laptop clings to the slow one, `omarchy network band` shows the band and `omarchy network band 5` pins it (`auto` unpins). If the clock itself has drifted, _Update > Time_ restarts time synchronization.

**Sound.** External speakers that stay silent are usually not selected as the output. Open the Audio panel (`Super + Ctrl + A`) and pick them. If a laptop's built-in speakers sound off, some machines get an automatic tuning: `omarchy audio tuning status` tells you whether one is active and `omarchy audio tuning off` removes it.

**Sleep.** Suspend and hibernate appear under _System_ (`Super + Escape`). If either misbehaves on your machine, `omarchy toggle suspend` shows or hides the suspend entry, so you can test whether it works consistently and hide it if not. Hibernation is set up with `omarchy hibernation setup`, which creates a swap area the size of your RAM on the boot drive (so you need that much free space) and requires the Limine bootloader. `omarchy hibernation remove` takes it out again.

**Displays.** Omarchy assumes a high-density display. On a 1080p or 1440p monitor, apps look oversized until you set the scale in `~/.config/hypr/monitors.lua` (opened by _Setup > Monitors_):

```lua
local omarchy_gdk_scale = 1
local omarchy_monitor_scale = 1
```

Apps already open keep the old value, so close the oversized ones (or all windows with `Ctrl + Alt + Delete`) and reopen them. `Super + /` and `Super + Alt + /` step the scale up and down, and `omarchy display text size 14` changes only the text size. For a laptop whose screen stays dark after you unplug an external monitor, `Super + Ctrl + Delete` toggles the laptop display, and `omarchy hw recover internal monitor` clears the internal-monitor-disable toggle when no external display is connected.

**GPU.** On laptops with two GPUs, _Trigger > Hardware > Hybrid GPU_ switches between dedicated and integrated mode (through `supergfxd`). `omarchy hw hybrid gpu` detects whether you have such a setup. Omarchy's troubleshooting pages do not cover driver problems beyond this, so for anything deeper, collect a debug report and ask.

**Firmware.** _Update > Firmware_ fetches BIOS, SSD, and dock updates your hardware has waiting. It may ask for a reboot.

**Caps Lock.** It does nothing by design: Omarchy makes it the compose key, which powers quick emojis and completions. By default, pressing both Shift keys together turns Caps Lock on, and the next lone Shift press turns it off. To move the compose key elsewhere, edit `~/.config/hypr/input.lua`; the manual's example makes the right Alt key the compose key:

```lua
hl.config({
  input = {
    kb_options = "compose:ralt",
  },
})
```

## Getting help that gets answers

Before you ask, collect evidence. `omarchy debug` writes a report to `/tmp/omarchy-debug.log` and then offers choices: view it, save it in your current directory, or (when the machine is online) upload it.

```bash
omarchy version
omarchy debug
```

The report holds your hostname, hardware details, kernel messages, the warnings from this boot's journal, and the list of installed packages. **Read it before you share it**, or print it with `omarchy debug --print` and look first. If you choose upload, it goes to `logs.omarchy.org` and you get a link to post. Add `--no-sudo` to skip the kernel messages if you would rather not run `sudo`.

The community help channel is `#omarchy-help` on [the Omarchy Discord](https://omarchy.org/discord). A request that gets answered quickly has five parts:

1. **What you did,** in order ("ran Update > Omarchy, restarted").
2. **What you expected and what happened instead.**
3. **What you already tried,** and what each attempt did.
4. **Your version and channel** (`omarchy version` and `omarchy version channel`).
5. **The debug log link.**

> 💡 **Key point.** "My Wi-Fi is broken" gets guesses. "After Update > Omarchy, Wi-Fi scans but never connects; `omarchy restart wifi` did not help; log: link" gets answers. Having rolled back or not is also worth saying.

## Reinstalling in stages

If a rollback and a config refresh did not fix it, reinstall, but choose the smallest version that touches your problem.

| Command | What it does | What it overwrites |
|---|---|---|
| `omarchy reinstall pkgs` | Resets the package config to Omarchy's stable mirrors, downgrades anything newer than stable, and installs any default package that is missing | Custom pacman mirror and repository settings |
| `omarchy reinstall configs` | Copies Omarchy's shipped user defaults over your home folder, and refreshes the bootloader, boot splash, and Neovim setup | Every shipped file you changed, including `~/.bashrc` and files under `~/.config` |
| `omarchy reinstall` | Both of the above, after asking you to confirm, then offers to reboot | Both lists |

It only replays files Omarchy itself ships, so your documents, projects, and photos are not on the list. But your edited dotfiles are, and the manual is blunt: all your user config changes "will be overwritten".

**Back up first.** Copy anything you would miss to a second drive, and copy your own tweaks in particular:

```console
$ cp -a ~/.config ~/config-before-reinstall
$ cp ~/.bashrc ~/bashrc-before-reinstall
```

*What just happened:* you saved your current settings beside your home folder's other files. After the reinstall you can copy back only the changes you still want, one at a time. Keep that copy on another drive too, if the reinstall is happening because the disk is failing. The manual also recommends GNU Stow as a good way to back up your dotfiles.

### The last rung: the ISO

Installing from the ISO is a full reinstall. A full-disk install wipes the drive you select, so a backup comes first, and the free-space option leaves other systems alone, as in a dual boot. Get the ISO from the [Omarchy 4.0.4 release page](https://github.com/basecamp/omarchy/releases/tag/v4.0.4) and compare its SHA256 with the one listed there. If you cannot reach your files at all, ask for help before you wipe the drive.

⚠️ **Gotcha.** _Setup > Reset Computer_ is not a reinstall. It is a factory reset meant for handing a machine to a new owner: it wipes every user account and everything in `/home`. Never use it to fix a problem.

## Your turn: write your recovery card

Do this once while nothing is wrong. It takes ten minutes.

```exercise
[
  {
    "type": "task",
    "task": "Prepare for your next breakage: restart once and find the boot menu, check that snapshots exist, back up your config, and note where to ask for help.",
    "reveal": "Restart and look at the Omarchy Bootloader menu. Run omarchy snapshot create and confirm it does not print the No Snapper configs found message. Run cp -a ~/.config ~/config-backup. Save the link https://omarchy.org/discord and the channel name #omarchy-help.",
    "checklist": [
      "I have seen the boot menu and know how to reach it",
      "omarchy snapshot create ran without the No Snapper configs found message",
      "My ~/.config and ~/.bashrc are copied somewhere safe",
      "I know my version (omarchy version) and where to ask for help"
    ]
  }
]
```

```quiz
[
  {
    "q": "Your Bluetooth headset will not reconnect, but everything else works. What is the best first move?",
    "choices": [
      "Reboot the machine",
      "Restart only Bluetooth from Update > Hardware",
      "Run omarchy reinstall"
    ],
    "answer": 1,
    "explain": "Restarting one piece is the smallest fix, and it shows you which piece failed. A reboot hides that, and a reinstall is far too large."
  },
  {
    "q": "What does omarchy reinstall configs overwrite?",
    "choices": [
      "Only files in /usr/share/omarchy",
      "The shipped files in your home folder you may have edited, such as ~/.bashrc and ~/.config",
      "Every file in your home folder, including documents"
    ],
    "answer": 1,
    "explain": "It replays Omarchy's shipped defaults over your home folder. Your own documents are not among those files, but your edited dotfiles are, so back them up first.",
    "why": [
      "That folder belongs to Omarchy and is replaced by packages, not by this command.",
      null,
      "It only replays files Omarchy ships, so your own documents and projects are not on the list."
    ]
  },
  {
    "q": "Which makes a help request most likely to get a useful answer?",
    "choices": [
      "A screenshot and the words: it is broken",
      "What you did, what happened, what you tried, your version, and the omarchy debug log",
      "Posting in every channel at once"
    ],
    "answer": 1,
    "explain": "Helpers need steps, evidence, and context. The debug report gives them your hardware, package list, and warnings in one link."
  }
]
```

## Recap

1. Restart the one piece that broke (`omarchy restart wifi`, `bluetooth`, `audio`, `trackpad`, `shell`) before you reboot.
2. Most hardware surprises have a cause: wrong audio output, display scale, a sleep feature, or Caps Lock being the compose key.
3. `omarchy debug` makes a report you can read first and then upload, view, or save. Ask in `#omarchy-help` with steps, expectations, attempts, version, and the log.
4. Reinstall in stages: `omarchy reinstall pkgs`, `omarchy reinstall configs`, or both. Your edited dotfiles are overwritten, so back them up.
5. The ISO is the last rung and wipes a full-disk target. `Reset Computer` is not a repair tool.
