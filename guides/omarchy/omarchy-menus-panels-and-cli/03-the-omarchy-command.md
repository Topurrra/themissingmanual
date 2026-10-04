---
title: "The omarchy Command"
guide: "omarchy-menus-panels-and-cli"
phase: 3
summary: "The omarchy command is the terminal twin of the menu: learn how its groups and subcommands are organized, how to explore with --help, which commands only read, and which ones change or overwrite things."
tags: [omarchy, cli, terminal, commands, scripting, hyprland, beginner-friendly]
difficulty: intermediate
synonyms: ["what does the omarchy command do", "omarchy cli commands list", "omarchy update command", "omarchy theme set command", "omarchy toggle command", "omarchy command not found", "omarchy-update vs omarchy update", "how to script omarchy", "omarchy refresh vs reinstall"]
updated: 2026-10-04
---

# The omarchy Command

The menu and the bar are for your hands. The `omarchy` command is for everything else: scripts, your own hotkeys, and the moment you are already in a terminal and a menu would be a detour. Every action behind the menu has a command, and the manual calls this especially useful when an AI agent is helping you configure the machine.

You do not need to memorize it. You need to know how it is organized and how to ask it what it can do.

## One command, many groups

Run `omarchy` with nothing after it. It prints the command center. This is the shape the manual shows, trimmed:

```console
$ omarchy
Omarchy command center

Usage:
  omarchy <command> [args...]
  omarchy commands [--all] [--json] [--check]
  omarchy <group> --help
  omarchy <group> <command> --help

Common commands:
  omarchy update              Update Omarchy and system packages
  omarchy theme list          List available themes
  omarchy theme set <name>    Apply a theme
  omarchy font list           List available fonts
  omarchy screenshot          Take a screenshot
  omarchy debug               Print debugging information

Groups:
  agent          AI coding agent usage data
  audio          Audio input and output controls
  bar            Omarchy shell bar layout and settings
  ...
```

*What just happened:* Omarchy listed the most common commands and then every **group**. A group is a family of related commands, like `theme`, `pkg`, `toggle`, or `capture`. The structure is always `omarchy <group> <command> [arguments]`.

Version 4.0.4 has dozens of groups. A few you will meet early:

| Group | What it controls |
|---|---|
| `theme`, `font` | Appearance |
| `pkg` | Installing and removing packages |
| `update`, `channel`, `snapshot` | Keeping the system current and recoverable |
| `toggle`, `reminder`, `notification` | The modes and messages from Phase 2 |
| `bar`, `plugin`, `menu` | The shell and its widgets |
| `capture` | Screenshots and screen recording |
| `restart` | Restarting one component, such as the shell, Wi-Fi, or audio |
| `debug`, `version` | Diagnostics |

## Asking the command what it can do

Every group and every command answers `--help`:

```bash
omarchy capture --help
omarchy capture screenshot --help
```

Typing a group name alone, such as `omarchy capture`, lists its commands with their arguments. The manual shows the capture group returning lines like `omarchy capture screenshot [smart|region|windows|fullscreen] [slurp|copy|save] [--editor=<name>]`. Square brackets mean optional, angle brackets mean you fill it in, and `|` means choose one.

To list everything at once, use `omarchy commands`. Add `--all` to include commands marked hidden, and `--json` for output a program can read.

## Hyphens and spaces are the same thing

Omarchy's commands are programs named `omarchy-<group>-<command>`, and `omarchy <group> <command>` is a friendlier way to call them. These pairs are identical:

| Spaced form | Hyphenated form |
|---|---|
| `omarchy update` | `omarchy-update` |
| `omarchy pkg add jq` | `omarchy-pkg-add jq` |
| `omarchy snapshot create` | `omarchy-snapshot create` |
| `omarchy theme set <name>` | `omarchy-theme-set <name>` |

You will see both forms in the manual, in menu definitions, and in other people's config files. Do not let it confuse you. The hyphenated form is also what keybinding files tend to use.

## Safe to explore: commands that only read

Start with these. They print information and change nothing:

```bash
omarchy version              # which Omarchy you are running
omarchy channel current      # stable, rc, edge, or dev
omarchy theme current        # the active theme
omarchy theme list           # every theme you can apply
omarchy font list            # every monospace font you can apply
omarchy network status       # active network state
omarchy reminder show        # your pending reminders
omarchy weather location     # where Omarchy thinks you are
omarchy toggle idle status   # stay-awake state, as JSON
```

## Everyday commands that change something small

These change a setting you can change back:

```bash
omarchy theme set <name>                  # apply a theme
omarchy font set <font-name>              # set the monospace font
omarchy toggle nightlight                 # same as Super + Ctrl + N
omarchy reminder 20 'Stand up'            # minutes, then a message
omarchy bar position bottom               # move the bar
omarchy restart shell                     # restart the Omarchy shell
```

`omarchy restart` is the gentle first move when something misbehaves. It has targets for the shell, Wi-Fi, Bluetooth, audio, and the trackpad, and restarting one component is far cheaper than rebooting. [When Omarchy Breaks](/guides/when-omarchy-breaks) builds a whole troubleshooting routine on it.

## Commands that return true or false

Some commands answer a yes-or-no question through their **exit status**, which makes them usable in scripts. Exit status is the hidden number every Unix command leaves behind: zero means success or true, anything else means failure or false. The `&&` operator runs the next command only when the first one succeeds.

```console
$ omarchy pkg present jq && echo "jq is installed"
jq is installed
```

*What just happened:* `omarchy pkg present` returns true only when every named package is installed. Its sibling `omarchy pkg missing` is true when any named package is absent, and `omarchy battery present` checks for a battery. The manual's example for toggles uses the same idea: `omarchy-toggle-enabled screensaver-off && echo "screensaver is off"`.

The shell is covered properly in [The Terminal and Shell](/guides/the-terminal-and-shell). You only need `&&` here.

## Commands that overwrite or erase: read first

This is where the CLI earns respect. The same tool that sets a theme can also reset your whole configuration. Their summaries say what they do, and you should read them before running:

| Command | What it does | Cost |
|---|---|---|
| `omarchy update` | Updates Omarchy and system packages, asking first unless you pass `-y` | Large and intentional. See the software guide |
| `omarchy refresh hyprland` | Overwrites all your Hyprland Lua configs in `~/.config/hypr` with the defaults | Your edits there are replaced |
| `omarchy refresh shell` | Resets `shell.json` to the defaults | Your bar layout and idle timings are replaced |
| `omarchy reinstall configs` | Resets Omarchy user configs to the shipped defaults, described as destructive | Your config changes are overwritten |
| `omarchy reinstall` | Reinstalls the default packages and resets configs | Same, plus package changes |
| `omarchy system factory reset` | Returns the machine to its freshly installed state | Everything you added |

⚠️ **Gotcha.** A `refresh` or `reinstall` is a fix for a corrupted config, not a tidy-up. If your config files hold changes you care about, copy them somewhere first. The manual warns that after `omarchy reinstall`, "all your user config changes to the Omarchy defaults will be overwritten".

A habit that costs nothing: run `omarchy <group> <command> --help` before any command you did not write yourself.

## Using the command from your own hotkey

Because every menu action is a command, you can bind any of them to a key. Your personal bindings live in `~/.config/hypr/bindings.lua`, in Lua. The shipped template shows the pattern, which is a key combination, a description, and a command:

```lua
o.bind("SUPER + SHIFT + R", "Stand up reminder", "omarchy reminder 20 'Stand up'")
```

Press `Super + K` first to check that your chosen combination is free. Making bindings and the rest of your config comfortable is the subject of [Making Omarchy Comfortable](/guides/making-omarchy-comfortable).

## Your turn: read before you run

```exercise
[
  {
    "type": "predict",
    "task": "`omarchy-pkg-add` and `omarchy pkg add` are two spellings of one command. Which one of these is NOT a valid way to call the update command: `omarchy update`, `omarchy-update`, or `omarchy_update`? Write the invalid one.",
    "accept": ["omarchy_update"],
    "hint": "The two valid forms use a space or a hyphen between omarchy and the command."
  },
  {
    "type": "task",
    "task": "Run `omarchy`, pick any group, then run `omarchy <group> --help`. Find one read-only command and one that changes something, and say which is which from the summary text.",
    "reveal": "Examples: `omarchy theme current` (reads) and `omarchy theme set <name>` (changes). The summaries tell you: 'Show current theme' versus 'Apply an Omarchy theme'.",
    "checklist": ["Listed the groups", "Opened a group's help", "Classified one read-only and one changing command"]
  }
]
```

Check yourself before moving on:

```quiz
[
  {
    "q": "In omarchy capture screenshot [smart|region|windows|fullscreen], what do the square brackets and the pipes mean?",
    "choices": [
      "The argument is optional, and you choose one of the listed words",
      "You must type all four words, separated by pipes",
      "The brackets are literal characters you type"
    ],
    "answer": 0,
    "explain": "Brackets mean optional, pipes mean choose one. Angle brackets, as in <name>, mean a value you fill in."
  },
  {
    "q": "Your Hyprland config has odd behavior and you have personal edits in it. You are tempted to run omarchy refresh hyprland. What is the right first step?",
    "choices": [
      "Run it, because refresh only reloads the config",
      "Back up the files you care about, because it overwrites your Hyprland Lua configs with the defaults",
      "Run a factory reset instead, which is safer"
    ],
    "answer": 1,
    "explain": "Refresh replaces your files with the shipped defaults. A copy first means you can recover your own changes.",
    "why": ["Refresh does not merely reload. It overwrites.", null, "A factory reset is the most destructive option on the list."]
  },
  {
    "q": "What does omarchy pkg present jq && echo done print when jq is not installed?",
    "choices": ["done", "Nothing, because present returns false and && skips the echo", "An error saying jq is missing, then done"],
    "answer": 1,
    "explain": "present is true only when every named package is installed. When it returns false, && does not run the echo."
  }
]
```

## Recap

1. `omarchy` on its own prints the command center, and the shape is always `omarchy <group> <command> [arguments]`.
2. Every group and command answers `--help`, and `omarchy commands` lists them all.
3. `omarchy update` and `omarchy-update` are the same command, spaced or hyphenated.
4. Read-only commands are safe to explore, and `restart` is the gentle first fix.
5. Commands such as `pkg present` return true or false, which makes them usable with `&&`.
6. `refresh`, `reinstall`, and `system factory reset` overwrite or erase, so back up and read `--help` first.

This guide covered the three ways to control Omarchy. Next, [Installing and Updating Software on Omarchy](/guides/installing-and-updating-software-on-omarchy) puts the `pkg` and `update` groups to real work.
