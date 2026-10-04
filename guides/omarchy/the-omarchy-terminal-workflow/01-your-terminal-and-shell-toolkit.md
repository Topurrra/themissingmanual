---
title: "Your Terminal and Shell Toolkit"
guide: "the-omarchy-terminal-workflow"
phase: 1
summary: "Foot is the fast default terminal with no tabs, Super + C and Super + V copy and paste everywhere, and Omarchy adds modern shell tools and helper functions that make finding, jumping, and searching quick."
tags: [omarchy, terminal, foot, bash, fzf, zoxide, ripgrep, eza, shell-functions]
difficulty: beginner
synonyms: ["omarchy default terminal", "omarchy foot tabs splits", "omarchy copy paste terminal", "omarchy ff fzf command", "omarchy zoxide cd", "omarchy shell functions", "omarchy ls eza alias", "omarchy change default terminal"]
updated: 2026-10-04
---

# Your Terminal and Shell Toolkit

You press `Super + Return` and a window opens with no tabs, no menu bar, and a minimal prompt. Then you try `Ctrl + V` to paste and get a strange character, or type `ls` and see icons. None of it is broken; it is a deliberate toolkit. This phase explains the terminal, the clipboard keys that work everywhere, and the shell commands Omarchy adds.

## Foot, and why it has no tabs

[Foot](https://codeberg.org/dnkl/foot) is the default terminal. The manual calls it fast, lightweight, and compatible with even old computers. It does not support native tabs or splits. Omarchy's answer is tmux (see [Phase 2](02-tmux-sessions-windows-and-panes.md)), which gives you tabs, splits, and sessions that survive in any terminal. If you would rather use another terminal, Omarchy fully supports Alacritty, Ghostty, and Kitty too. Ghostty has its own split and tab keys, listed in the manual's hotkeys chapter.

- Install one from the Omarchy menu under _Install > Terminal_.
- Switch the default under _Setup > Defaults > Terminal_, or run `omarchy default terminal ghostty`.
- `Super + Return` always opens whichever terminal is your default. The new window starts in the current directory of the terminal you were in.

Foot's settings are in `~/.config/foot/foot.ini`. The shipped file sets the font to JetBrainsMono Nerd Font at size 9, keeps 10,000 lines of scrollback, uses a block cursor that does not blink, and takes its colors from the current theme. Foot cannot reload its config, so open a new terminal to see changes.

## Copy and paste without the Ctrl + C trap

In a terminal, `Ctrl + C` does not copy. It sends an interrupt to the running program, which is how you stop a command (see [The Terminal and Shell](/guides/the-terminal-and-shell)). That is why Linux terminals use `Ctrl + Shift + C` and `Ctrl + Shift + V` for copy and paste, and ordinary apps use `Ctrl + C` and `Ctrl + V`. Two rules for two kinds of window is what trips up newcomers.

Omarchy removes the split. These work in every app, terminals included:

| Key | What it does |
|---|---|
| `Super + C` | Copy |
| `Super + V` | Paste |
| `Super + X` | Cut (not in a terminal) |
| `Super + Ctrl + V` | Open the clipboard manager |

Under the hood, `Super + C` in a terminal sends the Ctrl + Insert shortcut and `Super + V` sends Shift + Insert, which terminals accept, while in other apps it sends `Ctrl + C` and `Ctrl + V`. You never have to think about which window you are in. Foot's own `Ctrl + Shift + C` and `Ctrl + Shift + V` still work, as does selecting text and pasting from the clipboard.

## The shell tools

Your shell is Bash with a [Starship](https://starship.rs/) prompt. Omarchy adds modern replacements for old commands, and the manual lists the key ones:

| Command | Think of it as | What it does |
|---|---|---|
| `ls`, `lsa`, `lt`, `lta` | `ls` | `eza` listings with color and icons. `lsa` includes hidden files, `lt` shows two levels as a tree, `lta` is the tree with hidden files. |
| `ff` | `find` plus a viewer | Fuzzy-find any file under the current directory, with a preview on the right. |
| `Ctrl + R` | history search | Fuzzy-search your command history with fzf. |
| `cd` | `cd` | Aliased to zoxide: remembers directories you have visited so `cd oma` can jump to `~/.config/omarchy`. |
| `rg pattern path` | `grep -r` | ripgrep: search file contents, for example `rg Controller app/`. |
| `fd` | `find` | `fd person.rb` finds a file in the current tree. Add `/` to search the whole system, and `-H` to include hidden directories. |
| `bat file` | `cat` | Syntax highlighting, line numbers, paging. |
| `tldr tar` | `man` | The handful of examples you actually wanted. |
| `try` | n/a | Date-stamped experiment folders in `~/Work/tries`. |

Three things to know about how they behave:

- **zoxide only knows places you have been.** Run `cd ~/.config/omarchy` once, and later `cd omarchy` works. Before that, `cd omarchy` fails with `Error: Directory not found`, which is also what you get when no remembered directory matches.
- **`cd` still works normally** with real paths. It tries the real directory first and falls back to zoxide's memory only when the name is not a directory.
- **`ff` and Neovim share a finder.** The manual notes that fzf is also behind `Space Space` in Neovim and ripgrep behind `Space S G`, so the habits transfer ([Phase 3](03-neovim-the-omarchy-way.md)).

A few short aliases come with the setup: `..`, `...`, and `....` go up directories, `n` opens Neovim, `g` is `git`, `gcm` is `git commit -m`, `gcam` is `git commit -a -m`, and `gcad` is `git commit -a --amend`. That last one rewrites your most recent commit, so read it before you type it. If you are new to Git, [Git From Zero](/guides/git-from-zero) explains why amending is risky once a commit is shared.

## The helper functions

Omarchy ships functions that wrap awkward command lines:

| Function | What it does |
|---|---|
| `compress [file/dir]`, `decompress [file.tar.gz]` | Make or expand a `tar.gz` archive. |
| `iso2sd [image.iso]` | Create a bootable SD card from an ISO file, picking the drive interactively. |
| `format-drive [device] [name]` | Format a whole disk with one exFAT partition, which works on Windows and macOS too. |
| `ga [branch]`, `gd` | Make a Git worktree and branch next to the repo and jump into it, then remove it later after a confirmation. |
| `rsw [source] [destination]`, `lsw`, `dsw` | Start a background watcher that rsyncs on every change, list watchers, stop them all. |
| `fip`, `dip`, `lip` | Forward remote ports to localhost over SSH, disconnect them, list them. |

> ⚠️ **Gotcha**: `format-drive` erases an entire disk. Run it with no arguments first to see the available drives, and read the device name twice. The manual's own advice is "Be careful!"

The `fip` function is worth a worked example. Say a dev server runs on port 3000 on a machine you reach as `nyc-dev`:

```bash
fip nyc-dev 3000
```

After that, `localhost:3000` on your laptop reaches `nyc-dev:3000`, which gives browsers the secure-context treatment they give to localhost (needed for testing things like web sockets) without setting up certificates. `lip` lists the forwards and `dip` closes them. For what SSH is doing underneath, see [SSH and Keys](/guides/ssh-and-keys).

`ssh` itself is wrapped too. If a connection dies while a remote tmux, Herdr, or editor has the terminal, Omarchy cleans the terminal up and reconnects automatically on an interactive session that drops. `Ctrl + C` stops the retry loop.

Your own aliases go in `~/.bashrc`, which the manual says Omarchy does not overwrite on updates.

## Your turn: stop, copy, jump

```exercise
[
  {
    "type": "predict",
    "task": "In a terminal, you run a command that will not stop and press Ctrl + C. What does that key combination do to the program? (One word is enough.)",
    "accept": ["/interrupt|stop|cancel|sigint|kill|terminate/i"],
    "hint": "It is not copy. Think of how you stop a runaway command."
  }
]
```

Check yourself before moving on:

```quiz
[
  {
    "q": "Why does Omarchy give you Super + C and Super + V for copy and paste?",
    "choices": [
      "Because Ctrl + C does not work in any Linux app",
      "Because in a terminal Ctrl + C means interrupt, so terminals and other apps normally need different keys, and Super + C works in both",
      "Because Foot has no clipboard support"
    ],
    "answer": 1,
    "explain": "Terminals use Ctrl + Shift + C and V because Ctrl + C interrupts the running program. Omarchy's Super keys work the same everywhere.",
    "why": ["Ctrl + C copies in ordinary apps. Only terminals treat it differently.", null, "Foot has a clipboard; its own copy and paste keys are Ctrl + Shift + C and V."]
  },
  {
    "q": "You type cd omarchy in a fresh terminal and it fails, but cd ~/.config/omarchy works. Why?",
    "choices": [
      "zoxide only remembers directories you have already visited",
      "cd with a short name is not allowed",
      "The directory is hidden"
    ],
    "answer": 0,
    "explain": "zoxide builds its memory from the directories you actually enter. Visit it once with the full path and the short name works afterward."
  },
  {
    "q": "What does format-drive do?",
    "choices": [
      "Cleans up the current directory",
      "Formats an entire disk with a single exFAT partition, so you should run it with no arguments first to see the drives",
      "Mounts a USB stick read-only"
    ],
    "answer": 1,
    "explain": "It erases the whole disk you point it at. The manual warns to be careful."
  }
]
```

## Recap

1. Foot is the default terminal. It is fast and has no tabs or splits; tmux covers that, or install Alacritty, Ghostty, or Kitty from _Install > Terminal_.
2. `Super + C` and `Super + V` copy and paste in every app, because `Ctrl + C` in a terminal means interrupt.
3. Omarchy adds `ff`, `Ctrl + R`, zoxide-backed `cd`, `rg`, `fd`, `bat`, `eza` listings, and `tldr`.
4. Helper functions cover archives, drives, Git worktrees, rsync watching, and SSH port forwarding. `format-drive` erases a disk.
5. Put your own aliases and functions in `~/.bashrc`.

Next up, [Tmux: Sessions, Windows, and Panes](02-tmux-sessions-windows-and-panes.md): tabs and splits that survive closing the window.
