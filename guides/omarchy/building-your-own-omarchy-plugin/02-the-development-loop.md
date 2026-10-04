---
title: "The Development Loop"
guide: "building-your-own-omarchy-plugin"
phase: 2
summary: "Clone a built-in plugin into your own folder, edit it with live reload, validate it with omarchy plugin validate and qmllint, run it through shell IPC, and debug it from the logs."
tags: [omarchy, plugins, development, omarchy-plugin-clone, validate, qmllint, debugging]
difficulty: advanced
synonyms: ["omarchy plugin clone", "how to develop an omarchy plugin", "omarchy plugin validate", "omarchy-shell rescanPlugins", "omarchy plugin not showing up", "omarchy plugin qmllint", "debug omarchy plugin"]
updated: 2026-10-04
---

# The Development Loop

The fastest way to learn a plugin system is to start from one that works. Omarchy builds that in: you clone a built-in into your own folder, and from that moment the desktop runs your copy and reloads it whenever you save. This phase is the loop you will repeat dozens of times: edit, validate, run, inspect.

## When it breaks first

| Symptom | Calm fix |
|---|---|
| Plugin folder not found | Use the exact id printed by `omarchy plugin clone`; confirm the folder under `~/.config/omarchy/plugins/`. |
| `entry point file not found` | Match the `entryPoints` value to the file name and capitalization on disk. |
| Validates but is not listed | `omarchy-shell shell rescanPlugins`, then `omarchy plugin list --json`. |
| Listed but does not appear | Enable it, confirm the declared kind, and read the shell log (below). |
| Panel opens once, never again | Forward `opened`, `open()`, and `close()` from the bar entry point to the loaded panel. |

Those are the official troubleshooting entries. The rest of the phase explains where each comes from.

## Step 1: clone a built-in

Choose a built-in with the same kind and interaction pattern as what you want to build. For a bar widget with a details panel, that is the built-in clock:

```bash
omarchy plugin clone omarchy.clock --edit
```

*What just happened:* Omarchy printed a new plugin id built from your username, for example `yourname.clock`, created `~/.config/omarchy/plugins/yourname.clock/`, opened the folder in your editor, and replaced the built-in clock in your active bar with your copy. The folder holds `manifest.json`, `BarWidget.qml`, `Panel.qml`, and `Model.js`.

The whole plugin directory is copied, including every declared kind and local dependency. Calls made to the original id (`omarchy.clock`) are routed to your clone, so nothing that referred to the built-in needs changing. If you make a mess, `omarchy plugin remove yourname.clock` puts the built-in back, because the clone keeps `omarchy.clonedFrom` in its manifest while you develop.

> ⚠️ **Gotcha.** Never edit the built-in under `$OMARCHY_PATH`. It belongs to the package, and the next update overwrites it. Always work in your own copy under `~/.config/omarchy/plugins/`.

Keep the clone id while developing. You choose a permanent one at publish time (Phase 4).

## Step 2: edit with live reload

Saving any file under `~/.config/omarchy/plugins/` reloads the plugin automatically, so leave the editor open and watch changes land. If discovery seems stale, force it:

```bash
omarchy-shell shell rescanPlugins
```

Here is the heart of the cloned `BarWidget.qml`, abridged from the official example. The manifest points at this file; it draws the clock button and loads `Panel.qml`:

```qml
import QtQuick
import Quickshell
import qs.Ui

BarWidget {
  id: root
  moduleName: "yourname.clock"

  // ... open(), close(), toggle() forward to the loaded panel ...

  SystemClock {
    id: clock
    precision: SystemClock.Minutes
  }

  Loader {
    id: panelLoader
    active: true
    source: Qt.resolvedUrl("Panel.qml")
    visible: false
  }

  WidgetButton {
    id: button
    anchors.fill: parent
    bar: root.bar
    text: Qt.formatTime(clock.date, "HH:mm")
    tooltipText: "Open Custom Clock"
    onPressed: function(buttonCode) {
      if (buttonCode === Qt.LeftButton) root.toggle()
    }
  }
}
```

Two details matter. `moduleName` must be the same in `BarWidget.qml` and `Panel.qml` (the official example sets it to the plugin id). And the imports come from the shell: `qs.Ui` for the bar and panel building blocks and `qs.Commons` for the shared `Style` and `Color` tokens. Take the full working files from your clone rather than from this excerpt.

To start without a clone, make the folder by hand: put `manifest.json` and your QML in `~/.config/omarchy/plugins/<plugin-id>/`, run `omarchy-shell shell rescanPlugins`, then `omarchy plugin enable <id>`. Bar widgets land in `barWidget.defaultSection`, or in the center when it is omitted, and you can move them later with `omarchy bar move`.

## Step 3: validate, without running

Two checks, neither of which runs your code:

```bash
PLUGIN_ID="yourname.clock"
PLUGIN_DIR="$HOME/.config/omarchy/plugins/$PLUGIN_ID"
omarchy plugin validate "$PLUGIN_DIR"
qmllint -I "$OMARCHY_PATH/shell" \
  "$PLUGIN_DIR/BarWidget.qml" "$PLUGIN_DIR/Panel.qml"
```

`omarchy plugin validate` checks the manifest and layout using the same rules the shell enforces at load time. `qmllint` checks your QML against the shell's installed imports. Both should exit without an error. A broken mapping gives an actionable message:

```console
$ omarchy plugin validate "$PLUGIN_DIR"
omarchy-plugin-validate: entry point file not found: 'BarWidget.qml'
```

*What just happened:* the validator found that `entryPoints` names a file that is not on disk. It checks, in order, that the manifest is valid JSON, that `schemaVersion` is the number 1, that the required fields exist, that the id is legal and not reserved, that `kinds` is a non-empty array, that every entry point is a safe relative path to a real file, that each claimed kind has its key, and that there are no symlinks.

## Step 4: run and inspect

The clone command already enabled your plugin. Confirm the shell sees it:

```bash
omarchy plugin list --json \
  | jq --arg id "$PLUGIN_ID" '.[] | select(.id == $id)'
```

The result should include your id, its kind, and `"enabled": true`. Then drive the panel through the shell's IPC, which is the same route a keybinding or menu entry uses:

```bash
omarchy-shell shell summon "$PLUGIN_ID" '{}'
omarchy-shell shell hide "$PLUGIN_ID"
```

`summon` prints `ok` when the shell knows the plugin and `unknown` when it does not. A panel closes with `Escape` too.

## Reading the logs

When a plugin is listed and enabled but nothing appears, the QML probably failed to draw. The shell logs QML errors, and two documented ways to read them are:

```bash
qs log -p "$OMARCHY_PATH/shell" --tail 100
journalctl -t omarchy-shell -n 100 --no-pager
```

The first comes from the official development guide; the second is the journal tag the shell logs under, as used in the omarchy-tmm README. Add `-f` to the journal command to watch live while you summon. If a reload does not seem to take, `omarchy restart shell` restarts the shell. One more rule from the shell docs: a plugin marked `keepLoaded: true` stays mounted, so code changes to a kept-loaded service itself only take effect after a shell restart.

> 🪖 **War story.** The silent failure the validator exists to prevent: a manifest that claims a kind without its entry point would otherwise install, enable, and do nothing, explained only by one line on the shell console. The validator's own comments say it refuses this while there is still someone to tell. Run it every time.

Check yourself before moving on:

```quiz
[
  {
    "q": "You edited Panel.qml in your clone and saved. What must you do to see the change?",
    "choices": [
      "Log out and back in",
      "Nothing: saving a file under ~/.config/omarchy/plugins/ reloads the plugin; rescanPlugins forces it if needed",
      "Run omarchy plugin add again"
    ],
    "answer": 1,
    "explain": "Live reload is the point of working in your own plugin folder. Use omarchy-shell shell rescanPlugins when discovery looks stale."
  },
  {
    "q": "omarchy plugin validate passes, omarchy plugin list shows your plugin enabled, but the widget is not on screen. Where do you look next?",
    "choices": [
      "The shell log, for QML errors, using qs log or journalctl -t omarchy-shell",
      "The marketplace",
      "Delete the manifest and recreate it"
    ],
    "answer": 0,
    "explain": "Validation covers the manifest and layout, not whether your QML runs. A QML error shows up in the shell log."
  },
  {
    "q": "Why is it unsafe to edit the built-in clock under $OMARCHY_PATH directly?",
    "choices": [
      "It is read-only forever",
      "Those files belong to the package, and the next update overwrites your changes",
      "Omarchy refuses to start with edited built-ins"
    ],
    "answer": 1,
    "explain": "That is why omarchy plugin clone copies the plugin into your own config directory first."
  }
]
```

## Recap

1. `omarchy plugin clone omarchy.clock --edit` copies a working built-in into `~/.config/omarchy/plugins/<yourname>.clock/`, enables it, and swaps it into your bar.
2. Saving files there reloads the plugin; `omarchy-shell shell rescanPlugins` forces discovery.
3. `omarchy plugin validate <folder>` and `qmllint -I "$OMARCHY_PATH/shell" <files>` check the plugin without running it.
4. `omarchy plugin list --json | jq` confirms it is enabled; `omarchy-shell shell summon <id> '{}'` and `hide <id>` exercise it.
5. When it validates but does not show, read the log: `qs log -p "$OMARCHY_PATH/shell" --tail 100` or `journalctl -t omarchy-shell`.

Next up, [Integrating With the Desktop, Safely](03-integrating-with-the-desktop-safely.md): bar placement, keys, menu rows, theme, and the rules that keep a plugin from hurting anyone.
