---
title: "Integrating With the Desktop, Safely"
guide: "building-your-own-omarchy-plugin"
phase: 3
summary: "Place your widget in the bar, summon it over shell IPC, add keybindings and menu rows as user opt-ins, follow the theme, launch apps and TUIs, and keep to the safety rules for unsandboxed plugin code."
tags: [omarchy, plugins, bar, keybindings, menu, theme, security, ipc]
difficulty: advanced
synonyms: ["omarchy plugin keybinding", "add omarchy menu entry from plugin", "omarchy bar put move widget", "omarchy plugin theme colors", "omarchy-shell shell toggle", "omarchy plugin safety rules", "omarchy extensions omarchy-menu.jsonc", "launch tui from omarchy plugin"]
updated: 2026-10-04
---

# Integrating With the Desktop, Safely

A plugin that only draws is half a plugin. People will want a key to open it, a row in the menu, colors that follow their theme, and a shortcut to launch a related app. Each of those touches the reader's own configuration, so this phase is as much about restraint as capability: the plugin offers, the user opts in.

## Placing it in the bar

A `bar-widget` declares where it would like to land through `barWidget.defaultSection`, which must be `left`, `center`, or `right`. The validator rejects anything else. After enabling, the user can move it:

```bash
omarchy bar put tmm.manual --section right
omarchy bar move io.github.yourname.custom-clock --section center
```

Both forms appear in official docs: `put` in the omarchy-tmm README for a widget that did not appear on its own, and `move` in the development guide's README template. Settings for a widget are stored inline on its entry in `~/.config/omarchy/shell.json`. A widget that makes sense twice on one bar sets `allowMultiple: true`; most set it to `false`.

## Summoning over IPC

You control a running plugin from outside through one wrapper, `omarchy-shell`, which forwards calls to the running shell:

| Call | Effect |
|---|---|
| `omarchy-shell shell summon <id> '<payloadJson>'` | Load and open a panel or overlay. Prints `ok` or `unknown`. |
| `omarchy-shell shell toggle <id> '<payloadJson>'` | Summon if closed, hide if open. |
| `omarchy-shell shell hide <id>` | Close it. |
| `omarchy-shell shell call <id> <method> <arg>` | Call a method on an already-loaded plugin. |
| `omarchy-shell shell rescanPlugins` | Re-walk plugin folders and hot-reload code. |

The payload is JSON that your plugin defines the meaning of. The Missing Manual plugin accepts keys like `query`, `slug`, `catalog`, and `random`:

```bash
omarchy-shell shell summon tmm.manual '{"query":"git rebase"}'
```

Design your payload the way you would design a tiny API, because keybindings, menu rows, and scripts will all call it. The cheap way to make every entry route consistent is the same trick tmm uses: every menu row and keybinding summons the window through this one IPC call, so all of them land in the same place.

## Keybindings: offer a fragment

Omarchy 4 Hyprland config is Lua. The user's `~/.config/hypr/bindings.lua` is theirs, and your plugin should not edit it. Instead, ship a fragment the user can append, as tmm does:

```lua
local o = require("default.hypr.helpers")
o.bind("SUPER + ALT + M", "Missing Manual", "omarchy-shell shell toggle tmm.manual")
```

`o.bind(keys, description, command)` is Omarchy's helper: the description shows up in the keybinding viewer, and the command runs when the keys fire. The viewer is `omarchy menu keybindings`, also on `Super + K`, and `omarchy menu keybindings --print` lists the live bindings. Check it before you pick a key, so you do not shadow a default.

The helper also accepts a table in place of a command string for common launches, per its source: `{ tui = "btop" }` runs a terminal app (with `focus = true` to focus an existing window instead of opening a second), and `{ webapp = "https://..." }` opens a web app. Plain strings are shell commands.

## Menu rows: merge, never overwrite

The Omarchy menu has your own extension file, `~/.config/omarchy/extensions/omarchy-menu.jsonc`. Entries are keyed by dotted id, and the id places them in the tree: `personal` is a top-level row and `personal.notes` appears inside it. From the manual:

```jsonc
{
  "personal": {"icon": "", "label": "Personal"},
  "personal.notes": {"icon": "󰎞", "label": "Notes", "action": "omarchy-launch-editor ~/notes"}
}
```

Two practical facts. The `icon` is drawn literally as text, so it is a Nerd Font glyph and not an icon name: a name like `search` would show up as the word search. And the file is shared by every user menu entry, so a plugin that copies a fragment over it deletes the reader's other entries. tmm solves this with a helper script, `tmm-menu`, that merges its rows in, keeps a `.bak`, refuses to write anything that does not parse, and can remove its own rows. After any change, `omarchy menu refresh` reloads the menu.

## Following the theme

The reason your plugin should have no hardcoded colors is that Omarchy themes change them. The official clock reads colors and sizes from shared tokens: `Style` for spacing and fonts (`Style.space(240)`, `Style.font.subtitle`) and `Color` from `qs.Commons`. tmm goes further: its README says surfaces use the `Color.menu.*` tokens, the corner radius follows Hyprland's rounding, and spacing follows the shell's font and spacing settings, so a theme switch repaints the whole window. Follow the tokens and your plugin looks native in every theme.

## Launching things

When your plugin needs to start something, prefer Omarchy's own launchers over reinventing them. The documented ones include `omarchy launch tui <command>` (a TUI in the default terminal with Omarchy styling), `omarchy launch or focus tui <command>` (focus an existing one), `omarchy launch webapp <url>`, and `omarchy launch editor <path>`. They exist so everything Omarchy opens looks and behaves the same.

## Scoped, not sandboxed

Third-party plugins get capability-scoped facades rather than the real host objects. A full replacement bar, for example, gets detached snapshots and narrow proxies, not live service objects. Do not design a plugin that needs more reach than that, and do not assume the scoping protects the user from you: the shell README calls facades API boundaries, not same-process sandboxes.

## Safety rules

The official development guide opens with the rule: plugins run unsandboxed with your user permissions, so review every dependency and command, avoid unnecessary privileges, and never start a second Quickshell process for a plugin. Here is the full working set, with what comes from official docs and what is our advice:

**Official:**

- Avoid unnecessary privileges. The installer never uses `sudo`, and your plugin should not need it.
- No install hooks. The installer never runs plugin code, so do not rely on a post-install step. Anything the plugin needs must be a step the reader runs on purpose, documented in the README.
- Never start a second Quickshell process.
- No symlinks in the folder.
- Document every external dependency, setup step, privilege boundary, service, installer, or remote build.

**Our advice, based on how tmm is built:**

- Bound everything you call out to. tmm routes every network request through a helper, `bin/tmm-cap`, that caps the reply size and the run time and kills the process group past either.
- Send nothing about the user you do not have to. tmm sends only the search query or the question, and its README says so.
- Keep secrets in the user's own config, not your repo. tmm's optional AI chat reads a bring-your-own-key file at `~/.config/tmm/ai.json`.
- Make every setup step reversible, and ship the undo: tmm's README has a full uninstall list, because `omarchy plugin remove` only deletes the plugin's own folder.
- Keep optional features optional, and say what each does when its dependency is missing (tmm falls back to a plain card when `rsvg-convert` is absent).

> 💡 **Key point.** The marketplace validates listings, not plugin security. The safety work is yours, and the people reading your code before they enable it are your real audience.

Check yourself before moving on:

```quiz
[
  {
    "q": "Your plugin needs a keybinding. What is the right way to deliver it?",
    "choices": [
      "Write to ~/.config/hypr/bindings.lua from the plugin on first load",
      "Ship a bindings.lua fragment and document that the user appends it, so the change is their decision",
      "Ask for sudo and edit the system Hyprland files"
    ],
    "answer": 1,
    "explain": "bindings.lua is the user's file. A fragment the reader appends keeps them in control, which is what tmm does.",
    "why": ["Editing a user's config unasked is exactly the kind of surprise to avoid.", null, "Plugins must never need sudo, and system files are not where user bindings live."]
  },
  {
    "q": "Why does tmm ship tmm-menu instead of telling users to cp its menu file into place?",
    "choices": [
      "The menu file is binary",
      "The extension file is shared by all user menu entries, so cp would delete the user's other rows; the helper merges and keeps a backup",
      "Menu files must be created by root"
    ],
    "answer": 1,
    "explain": "One file holds every user menu entry. Merging protects them; omarchy menu refresh then reloads the menu."
  },
  {
    "q": "Which of these is an official rule for plugin authors?",
    "choices": [
      "Start a dedicated Quickshell process for each plugin to isolate it",
      "Never start a second Quickshell process for a plugin",
      "Run helper scripts with sudo so they can reach system services"
    ],
    "answer": 1,
    "explain": "Plugins live in the one long-running shell process. Starting another is explicitly ruled out."
  }
]
```

## Recap

1. `barWidget.defaultSection` must be `left`, `center`, or `right`; users move widgets with `omarchy bar move` or `omarchy bar put`.
2. Keybindings, menu rows, and scripts all reach your plugin through `omarchy-shell shell summon/toggle/hide`, with a JSON payload you design.
3. Deliver keybindings as a fragment for `bindings.lua`, and menu rows by merging into `~/.config/omarchy/extensions/omarchy-menu.jsonc`; never overwrite either file.
4. Use the shell's `Style` and `Color` tokens so themes repaint your plugin; use `omarchy launch ...` to start apps and TUIs.
5. Safety: no `sudo`, no install hooks, no second Quickshell process, no symlinks, document every dependency, and bound and minimize whatever you call out to.

Next up, [Testing and Publishing](04-testing-and-publishing.md): the pre-flight checklist and the marketplace submission.
