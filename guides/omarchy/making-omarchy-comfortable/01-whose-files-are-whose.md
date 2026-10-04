---
title: "Whose Files Are Whose"
guide: "making-omarchy-comfortable"
phase: 1
summary: "Omarchy's files live in /usr/share/omarchy and are replaced by updates, while yours live in ~/.config and load on top - so you can customize freely and still undo any mistake."
tags: [omarchy, dotfiles, config, hyprland, updates, reset]
difficulty: beginner
synonyms: ["where are omarchy config files", "will omarchy updates overwrite my config", "how to reset omarchy config", "omarchy dotfiles explained", "what is in ~/.config/hypr", "omarchy reinstall configs"]
updated: 2026-10-04
---

# Whose Files Are Whose

On Windows, settings hide behind a gear icon. On Omarchy most of them are plain-text files, and the first question every newcomer asks is: what happens to my edits when the next update lands? The answer is a clean split. Some files belong to Omarchy and get replaced during updates. Others belong to you and are never replaced by the package manager. Once you know which is which, editing stops being scary.

## Two owners, two places

Omarchy installs itself as ordinary pacman packages. Everything it ships lives under `/usr/share/omarchy`. The manual's rule is blunt: files there belong to Omarchy, and your changes to them are overwritten on the next update. Your own settings live in dotfiles under `~/.config`, and those are yours.

Think of a printed map with a sheet of tracing paper laid on top. Omarchy can reprint the map whenever it likes. Your pencil marks are on the tracing paper, so they survive. Hyprland (the window manager) is configured exactly this way. Its main file loads Omarchy's defaults first and your files after them, so whatever you set wins:

```mermaid
flowchart LR
  A["Omarchy defaults"] --> B["monitors.lua"]
  B --> C["input.lua"]
  C --> D["bindings.lua"]
  D --> E["looknfeel.lua"]
  E --> F["autostart.lua"]
```

The relevant part of `~/.config/hypr/hyprland.lua` looks like this (comments trimmed):

```lua
-- Load Omarchy defaults.
require("default.hypr.omarchy")

-- Your personal overrides, loaded after the defaults.
require("hypr.monitors")
require("hypr.input")
require("hypr.bindings")
require("hypr.looknfeel")
require("hypr.autostart")
```

Since v4, Hyprland's config is written in Lua, a small scripting language, so every one of those files ends in `.lua`. Old guides that show `hyprland.conf` or lines starting with `bind =` describe Omarchy 3 and do not apply.

> 💡 **Key point**: you never edit the defaults. You write the one setting you want different, in your file, and it overrides the default underneath.

## The files you will actually touch

| File | What it controls |
|---|---|
| `~/.config/hypr/hyprland.lua` | The main Hyprland config. Loads the defaults plus your override files. |
| `~/.config/hypr/bindings.lua` | Your keybindings and overrides of the defaults. |
| `~/.config/hypr/monitors.lua` | Monitors, resolution, scaling, and position. |
| `~/.config/hypr/input.lua` | Keyboard layout, mouse, and trackpad. |
| `~/.config/hypr/looknfeel.lua` | Gaps, borders, rounding, animations. |
| `~/.config/hypr/autostart.lua` | Extra programs started with your session. |
| `~/.config/omarchy/shell.json` | The bar (position, layout, widgets) plus screensaver, lock, and idle timings. |
| `~/.config/foot/foot.ini` | The default terminal, Foot. |
| `~/.config/tmux/tmux.conf` | Tmux. |
| `~/.config/starship.toml` | The shell prompt. |
| `~/.XCompose` | Quick-access emoji and name or email autocomplete. Run `omarchy-restart-xcompose` after editing. |

## Open files the Omarchy way

Press `Super + Space` to open the Omarchy menu, then pick one of these:

- _Setup > Monitors_ opens `monitors.lua`.
- _Setup > Keybindings_ opens `bindings.lua`.
- _Setup > Input_ opens `input.lua`.
- _Setup > Config_ offers Hyprland (`hyprland.lua`), Hyprsunset (the night-light config), and XCompose.
- _Style > Hyprland_ opens `looknfeel.lua`.

The file opens in your default editor, which is Neovim until you change it under _Setup > Defaults > Editor_. When you quit the editor (`:wq` in Neovim), Omarchy restarts whatever needs restarting for that file. That is the reason to prefer the menu over opening files by hand: it finishes the job.

Files with no menu entry, like `shell.json`, you open from a terminal. Omarchy defines `n` as an alias for `nvim`, so `n ~/.config/omarchy/shell.json` works.

## What an update does to each layer

- **Package files in `/usr/share/omarchy`** are replaced with the new release. This is how defaults improve without touching your files.
- **Your files in `~/.config`** are not overwritten by the package update. A seed copy of the shipped configs (kept in `/etc/skel`) only goes into a home folder when a user account is created, which is why existing users do not get new defaults pushed onto them.
- **Migrations** are the exception to know about. After the packages, `omarchy update` runs one-time repair scripts as your user, and a migration may touch `~/.config` when a new release needs a config changed. The manual's own warning: occasionally an update restores a config to its original condition, and then your version is saved next to it as a `.bak` file.
- **`shell.json` is yours once you change it.** Until you customize, the shell reads Omarchy's default file. After you drag a widget or run an `omarchy bar` command, your file is the only one that counts, with no merging. New default widgets in future releases will not appear on your bar on their own.

## The undo ladder

Every mistake has a rung, from gentle to drastic:

| You want to | Do this | What happens |
|---|---|---|
| Undo one bad edit | Edit it back, or `omarchy refresh config hypr/bindings.lua` | Copies Omarchy's shipped version of that one file into place and saves yours as a backup |
| Reset every Hyprland file | _Update > Config > Hyprland_ | Replaces `autostart.lua`, `bindings.lua`, `input.lua`, `looknfeel.lua`, `hyprland.lua`, and `monitors.lua` (plus a `.luarc.json` helper file), backing each up |
| Reset the bar | _Update > Config > Shell_ | Resets `shell.json` and the bar to defaults |
| Reset tmux | _Update > Config > Tmux_ | Replaces `tmux.conf` and reloads tmux |
| Reset everything | `omarchy reinstall configs` | Destructive: copies the shipped defaults over your home folder |

The single-file command prints what it did, using the path relative to `~/.config`:

```console
$ omarchy refresh config hypr/bindings.lua
Replaced /home/you/.config/hypr/bindings.lua with new Omarchy default.
Saved backup as /home/you/.config/hypr/bindings.lua.bak.1791100000.

Changes:
...
```

*What just happened:* Omarchy copied your file to a backup named with a Unix timestamp (the number differs every time), put its shipped version in place, and printed a diff of what changed. If your file already matched the default, it makes no backup and prints nothing.

> ⚠️ **Gotcha**: `omarchy reinstall configs` replays the shipped home-folder defaults over your files, same-named files included. That covers `~/.bashrc`, where your own aliases live. It is the last rung for a reason. Copy anything you care about somewhere safe before you use it.

## Four more places that are yours

- `~/.config/hypr/autostart.lua`: start something with every login, for example `o.launch_on_start("my-service")`.
- `~/.bashrc`: your own shell aliases, functions, and exports. The manual says Omarchy does not overwrite it on updates, and that you can safely override Omarchy's aliases here.
- `~/.config/omarchy/hooks/<event>.d/`: scripts that run on events: `post-boot`, `post-update`, `pre-refresh-pacman`, `theme-set`, `font-set`, and `battery-low`. Each folder ships a `.sample` file; remove the `.sample` ending to switch it on. `omarchy hook install post-boot ~/my-hook` copies a script in and makes it executable.
- `~/.config/omarchy/extensions/omarchy-menu.jsonc`: add rows to the Omarchy menu. A row's dotted id decides its place, so `personal.notes` appears inside the `personal` submenu:

```jsonc
"personal": {"icon":"","label":"Personal"},
"personal.notes": {"icon":"󰎞","label":"Notes","action":"omarchy-launch-editor ~/notes"},
```

The manual suggests GNU Stow for backing up your dotfiles once you have made a lot of changes. If you would rather keep them in version control yourself, [Git From Zero](/guides/git-from-zero) teaches the tool.

> 📝 **Terminology**: if you really want to change Omarchy's own files, the manual points to _Update > Channel > Dev_, which links Omarchy to a git checkout in `~/omarchy`. It is meant for people working on Omarchy itself and comes with the breakage that implies. Overriding in `~/.config` covers nearly everything.

## Your turn: recover one file

You edited `bindings.lua`, regretted it, and want Omarchy's shipped version of only that file back.

```exercise
[
  {
    "type": "predict",
    "task": "Type the command that restores only ~/.config/hypr/bindings.lua to Omarchy's shipped version (and saves yours as a backup). The argument is the path relative to ~/.config.",
    "accept": ["/^omarchy[ -]refresh[ -]config\\s+hypr\\/bindings\\.lua$/i"],
    "hint": "It starts with omarchy refresh config, then the path hypr/bindings.lua."
  }
]
```

Check yourself before moving on:

```quiz
[
  {
    "q": "You change a default by editing a file under /usr/share/omarchy. What happens at the next Omarchy update?",
    "choices": [
      "Your change is kept, because Omarchy merges it",
      "The file is replaced, because it belongs to the Omarchy package",
      "Omarchy asks you which version to keep"
    ],
    "answer": 1,
    "explain": "/usr/share/omarchy belongs to Omarchy's packages and your changes there are overwritten. Put overrides in ~/.config instead.",
    "why": ["Nothing merges package files; they are replaced.", null, "Package files are replaced; there is no prompt. Overrides belong in ~/.config."]
  },
  {
    "q": "You dragged a bar widget, so you now have your own shell.json. A new Omarchy release adds a default widget. What happens to your bar?",
    "choices": [
      "The new widget appears automatically",
      "Nothing changes: once you own shell.json it is the only file that counts, with no merging",
      "Your shell.json is deleted and replaced"
    ],
    "answer": 1,
    "explain": "Your file is canonical once you customize. Run omarchy bar defaults, or Update > Config > Shell, to return to the shipped layout."
  },
  {
    "q": "Which command resets one config file to Omarchy's version and keeps a backup of yours?",
    "choices": [
      "omarchy reinstall configs",
      "omarchy refresh config hypr/bindings.lua",
      "sudo pacman -Syu"
    ],
    "answer": 1,
    "explain": "omarchy refresh config takes one path relative to ~/.config. Reinstall configs resets everything and is destructive.",
    "why": ["That resets all your configs, not one file.", null, "That is a system upgrade, which Omarchy guards and sends through omarchy update. It does not reset a config file."]
  }
]
```

## Recap

1. `/usr/share/omarchy` is Omarchy's and is replaced by updates; `~/.config` is yours.
2. `hyprland.lua` loads Omarchy's defaults first and your `monitors`, `input`, `bindings`, `looknfeel`, and `autostart` files after, so yours win.
3. Open files through _Setup_ or _Style > Hyprland_ in the Omarchy menu so Omarchy restarts what needs it after you save.
4. Package updates leave `~/.config` alone. Migrations may change it, and when they do your version is saved as `.bak`.
5. Undo from small to large: one file with `omarchy refresh config`, a group with _Update > Config_, everything with `omarchy reinstall configs`.

Next up, [Changing and Adding Keybindings](02-changing-and-adding-keybindings.md): your first real edit, in `bindings.lua`.
