---
title: "Worked Example: The Missing Manual Plugin"
guide: "omarchy-plugins-and-the-marketplace"
phase: 3
summary: "One real plugin, installed the careful way: review tmm.manual before it runs, enable it, place its bar button, and learn what removing a plugin does and does not clean up."
tags: [omarchy, plugins, tmm, omarchy-tmm, install, review]
difficulty: intermediate
synonyms: ["omarchy missing manual plugin", "install omarchy-tmm", "tmm.manual", "omarchy plugin worked example", "review an omarchy plugin before enabling", "what does omarchy plugin remove delete"]
updated: 2026-10-04
---

# Worked Example: The Missing Manual Plugin

Everything so far has been principle. Here is one real plugin, installed the careful way. It is [omarchy-tmm](https://github.com/Topurrra/omarchy-tmm), plugin id `tmm.manual`, which brings The Missing Manual (this library) into Omarchy as a window you can open with a keystroke. The version we checked is 0.5.0.

This phase uses it to practice the habits from Phase 2: review, enable, and know what removal leaves behind. Hotkeys, the menu entry, and daily use have their own guide, [The Missing Manual on Omarchy](/guides/the-missing-manual-on-omarchy).

## What it is

A native Omarchy 4 plugin made of three kinds: a `panel` (the reader window), a `service` (a headless search and cache service), and a `bar-widget` (a book button in the bar). It also ships a terminal command, `tmm`, that renders the same guides in your terminal. It requires Omarchy 4 and does not work on 3.x.

What does it talk to? Only the public endpoints of themissingmanual.dev, such as search and the guide text. Its README says it never uploads anything about you: a search sends your query, an Ask question sends your question, and nothing else.

## Step 1: review it first

You know the drill from Phase 2. Add it without `--enable`:

```bash
omarchy plugin add https://github.com/Topurrra/omarchy-tmm.git
```

Answer no to "Enable now?". Then read the folder:

```bash
ls ~/.config/omarchy/plugins/tmm.manual/
cat ~/.config/omarchy/plugins/tmm.manual/manifest.json
ls ~/.config/omarchy/plugins/tmm.manual/bin/
```

*What just happened:* the repo is on disk and the manifest validated, but nothing has run. You will see `Panel.qml`, `Service.qml`, `BarWidget.qml`, and a `bin/` folder of helper scripts such as `tmm`, `tmm-cap`, `tmm-diagrams`, and `tmm-menu`. Those scripts are why the review matters: they run as you. `Service.qml` is where every network address is built, so it is the file to read if you want to confirm the "public endpoints only" claim yourself.

## Step 2: enable it

Once you have read it, enable it and let the shell pick it up:

```bash
omarchy plugin enable tmm.manual
omarchy-shell shell rescanPlugins
```

The one-line install, `omarchy plugin add https://github.com/Topurrra/omarchy-tmm.git --enable`, adds and enables in a single step. It is the shortcut for people who have already reviewed the code. Run in a terminal, it may first ask which bar section to place the widget in; the plugin's default is the right side.

A book glyph should appear in the bar. Click it to toggle the window. If it does not appear, place it by hand:

```bash
omarchy bar put tmm.manual --section right
```

> ⚠️ **Gotcha.** A disabled plugin answers a summon by doing nothing at all, which looks exactly like a broken install. If a keystroke or menu entry does nothing, check `omarchy plugin list` for the enabled state before anything else.

## Everything after that is opt-in

`omarchy plugin add` only puts files in the plugins folder. It never runs plugin code, install hooks, or `sudo`. So anything a plugin wants outside its own folder, such as a hotkey in `~/.config/hypr/bindings.lua`, a row in the Omarchy menu, or a command on your `PATH`, is a step you take yourself, on purpose.

For tmm.manual those steps are a hotkey, a menu entry, and the `tmm` terminal command. [The Missing Manual on Omarchy](/guides/the-missing-manual-on-omarchy) walks through each one, including two lines in the plugin's own install notes that do not work as written on Omarchy 4.0.4.

## Removing a plugin, and what it leaves behind

`omarchy plugin disable tmm.manual` turns it off and keeps the files. `omarchy plugin remove tmm.manual` asks for confirmation, disables the plugin, and deletes its folder.

What remove does not touch is everything you set up outside that folder: hotkey lines in `bindings.lua`, menu rows, copied commands, and any cache or state the plugin wrote while it ran. That is true of every plugin, not only this one. Before you remove a plugin, undo the extras you added (for tmm.manual, the removal steps are in the guide above), then remove it.

If a plugin's window does not appear at all, the debugging order works for any plugin: confirm it is enabled with `omarchy plugin list`, rescan with `omarchy-shell shell rescanPlugins`, then summon it. If the summon prints `ok` but nothing shows, the plugin's QML failed to draw. The shell logs to the journal, so look there:

```bash
journalctl -t omarchy-shell -n 100 --no-pager
```

Check yourself before moving on:

```quiz
[
  {
    "q": "You ran omarchy plugin add for tmm.manual without --enable, then pressed its hotkey and nothing happened. What is the most likely cause?",
    "choices": [
      "The plugin is broken and must be reinstalled",
      "The plugin is installed but disabled, and a disabled plugin ignores a summon",
      "Omarchy blocks hotkeys from third-party plugins"
    ],
    "answer": 1,
    "explain": "Plugins stay disabled unless you pass --enable or confirm the prompt. Run omarchy plugin enable tmm.manual, then rescan."
  },
  {
    "q": "Why add a plugin without --enable first?",
    "choices": [
      "It installs faster",
      "The files land on disk but nothing runs yet, so you can read the manifest and scripts before they run as you",
      "Plugins added with --enable cannot be removed later"
    ],
    "answer": 1,
    "explain": "A plugin runs with your user's access. Adding it disabled gives you a window to review the code before any of it executes."
  },
  {
    "q": "After omarchy plugin remove tmm.manual, what can still be left on your machine?",
    "choices": [
      "Nothing, remove deletes everything the plugin ever created",
      "Anything set up outside the plugin folder, such as hotkey lines, menu rows, copied commands, and its cache",
      "Only the plugin folder itself"
    ],
    "answer": 1,
    "explain": "Remove deletes the plugin's own folder. Hotkeys, menu rows, and files outside that folder are yours to clean up, ideally before removing the plugin."
  }
]
```

## Recap

1. `tmm.manual` is a panel, service, and bar widget plugin that needs Omarchy 4; it reads only public themissingmanual.dev endpoints.
2. Review first: `omarchy plugin add <url>` without `--enable`, read the manifest, `bin/`, and `Service.qml`, then `omarchy plugin enable tmm.manual` and rescan.
3. A disabled plugin ignores summons silently, so check `omarchy plugin list` first when nothing happens.
4. Adding a plugin never touches your config; hotkeys, menu rows, and commands are opt-in steps you take yourself.
5. `omarchy plugin remove` deletes only the plugin folder, so undo the extras first.

Ready to make your own? [Building Your Own Omarchy Plugin](/guides/building-your-own-omarchy-plugin) uses this same plugin as a structural reference. For using tmm.manual every day, see [The Missing Manual on Omarchy](/guides/the-missing-manual-on-omarchy).
