---
title: "Neovim the Omarchy Way"
guide: "the-omarchy-terminal-workflow"
phase: 3
summary: "Omarchy ships Neovim pre-built on LazyVim; learn how to open it, the Space-key commands that cover daily use, how to edit root files with sudoedit, and how to switch to a different editor."
tags: [omarchy, neovim, lazyvim, vim, editor, terminal]
difficulty: intermediate
synonyms: ["omarchy neovim setup", "lazyvim basics for beginners", "omarchy how to open neovim", "omarchy neovim file tree", "omarchy sudoedit", "omarchy change default editor", "omarchy leader key space", "omarchy use vscode instead of neovim"]
updated: 2026-10-04
---

# Neovim the Omarchy Way

You open Omarchy's editor, type a few letters, and the cursor jumps around instead of inserting text. That is not a bug. Neovim is a modal editor, and Omarchy ships it fully set up so that a few memorized keys give you a file finder, a search, a file tree, and Git inside the editor. The payoff is large and the learning curve is real, so this phase gives you the smallest path through it.

## What you actually get

Omarchy installs Neovim as the default editor with the `omarchy-nvim` package, built on [LazyVim](https://www.lazyvim.org/), a curated collection of Neovim plugins and settings. You do not write any configuration for it to work. Switching your Omarchy theme also restyles the editor, because a theme covers Neovim.

Start it any of these ways:

- Type `n` in a terminal. It is an alias for `nvim`, and with no argument it opens the current directory. `n myfile.txt` opens one file.
- Press `Super + Shift + N` to launch your default editor from anywhere.
- Run a `tdl` layout from [Phase 2](02-tmux-sessions-windows-and-panes.md), which opens it for you in the left pane.

## The three keys that save you

Neovim starts in **normal mode**, where letter keys are commands rather than text. That is why typing "moves the cursor around". Three keys get you out of every corner:

| Key | What it does |
|---|---|
| `i` | Enter insert mode, where typing inserts text |
| `Esc` | Back to normal mode |
| `:wq` then `Enter` | Save and quit (`:q!` quits without saving) |

That is survival. The full mental model, including how to quit without panic, is in [Editing in the Terminal](/guides/editing-in-the-terminal). For learning vim properly, the Omarchy manual recommends ThePrimeagen's "Vim As Your Editor" series on YouTube, and it is straight about the trade: vim takes longer to become proficient in than a mainstream editor, and the payoff is also larger.

## The leader key: Space

LazyVim's **leader key** is `Space`. It is the doorway to nearly every command. Press it, wait a second, and a menu appears showing what each next key does, so you can discover commands instead of memorizing them. The commands the manual says it uses all the time:

| Keys | What it does |
|---|---|
| `Space Space` | Fuzzy-find any file in the current directory |
| `Space S G` | Search the contents of all files with grep, with a preview |
| `Space E` | Toggle the file tree |
| `Ctrl + W W` | Hop between the file tree and the editor |
| `Shift + H` and `Shift + L` | Move to the tab on the left or right (vim calls them buffers) |
| `Space B D` | Close the current tab |
| `Space B O` | Close all other tabs |
| `Space G G` | Open LazyGit in a floating pane |
| `Space U W` | Toggle soft wrap |

The file finder and the search are the same fzf and ripgrep tools from [Phase 1](01-your-terminal-and-shell-toolkit.md), so what you learned at the shell prompt carries over.

In the file tree (`Space E` to open, `Ctrl + W W` to jump into it), press `a` to add a file, `A` to add a directory, and `?` to see every command.

> 💡 **Key point**: you do not have to memorize LazyVim. Press `Space` and read. When you want the full list, _Learn > Neovim_ in the Omarchy menu opens the [LazyVim keymaps page](https://www.lazyvim.org/keymaps).

## Git without leaving the editor

`Space G G` opens LazyGit in a floating pane over your code. LazyGit is a terminal Git interface you will meet again in [Phase 4](04-tuis-and-development-tools.md). If Git commands themselves are new, [Git From Zero](/guides/git-from-zero) explains what you are looking at.

## Editing files only root can change

Some files, like those under `/etc`, belong to root. Skip `sudo nvim` for these. The manual's approach keeps all your plugins:

```bash
sudoedit /etc/sudoers.d/00-sudo-only-file
```

*What just happened:* `sudoedit` opens a copy of the file in your normal editor with your normal config, then writes it back with elevated privileges when you save.

## Prefer a different editor

Neovim is the default, not a requirement. Open the Omarchy menu (`Super + Space`) and look under _Install > Editor_: VSCode, Cursor, Zed, Sublime Text, Helix, Vim, and Emacs are listed. If your editor is not there, try _Install > Package_, and then _Install > AUR_. Set the system-wide default under _Setup > Defaults > Editor_, or run `omarchy default editor code`. Theme matching is offered for VSCode, Cursor, VSCodium, and Helix.

> ⚠️ **Gotcha**: `omarchy reinstall configs` (the drastic reset from [Making Omarchy Comfortable](/guides/making-omarchy-comfortable)) also refreshes the Neovim setup, according to the script that implements it. If you have added your own Neovim customizations, back them up before using it.

## Your turn: three keystrokes

```exercise
[
  {
    "type": "predict",
    "task": "In Neovim on Omarchy, which key sequence (leader key plus keys) opens the fuzzy file finder? Type the keys separated by spaces, for example: Space A B.",
    "accept": ["/^space\\s+space$/i"],
    "hint": "The leader key twice."
  },
  {
    "type": "predict",
    "task": "Which key sequence toggles the file tree? Type it the same way.",
    "accept": ["/^space\\s+e$/i"],
    "hint": "Leader key, then the first letter of Explorer."
  }
]
```

Check yourself before moving on:

```quiz
[
  {
    "q": "You open a file in Neovim, type some letters, and the cursor jumps around instead of inserting text. What is happening?",
    "choices": [
      "The file is read-only",
      "You are in normal mode, where letter keys are commands; press i to insert text",
      "Neovim is frozen"
    ],
    "answer": 1,
    "explain": "Neovim starts in normal mode. Press i to insert, Esc to return, and :wq to save and quit.",
    "why": ["A read-only file would give you a warning, not cursor movement.", null, "It is responding to your keys as commands."]
  },
  {
    "q": "Which key sequence opens LazyGit in a floating pane from inside Neovim?",
    "choices": [
      "Space G G",
      "Space E",
      "Ctrl + W W"
    ],
    "answer": 0,
    "explain": "Space G G launches LazyGit. Space E toggles the file tree and Ctrl + W W hops between tree and editor."
  },
  {
    "q": "You need to edit a root-owned file and keep your Neovim setup. What does the manual suggest?",
    "choices": [
      "Log in as root and run nvim",
      "Run sudoedit on the file",
      "Change the file's permissions to 777"
    ],
    "answer": 1,
    "explain": "sudoedit edits a copy with your own editor and config, then writes it back with elevated privileges.",
    "why": ["A root session would not have your plugins and settings.", null, "Loosening permissions on system files is unsafe and is not what the manual suggests."]
  }
]
```

## Recap

1. Omarchy's Neovim is the `omarchy-nvim` package built on LazyVim, themed with your Omarchy theme and ready without configuration.
2. Start it with `n`, or `Super + Shift + N` for your default editor.
3. Normal mode first: `i` to type, `Esc` to stop, `:wq` to save and quit.
4. `Space` is the leader key. Learn `Space Space`, `Space S G`, `Space E`, and `Space G G` first.
5. Use `sudoedit` for root-owned files, and install other editors from _Install > Editor_ if you prefer them.

Next up, [TUIs and Development Tools](04-tuis-and-development-tools.md): lazygit, lazydocker, mise, Docker, and databases.
