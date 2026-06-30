---
title: "Editing in the Terminal"
guide: "editing-in-the-terminal"
phase: 0
summary: "vim and nano survival: open, edit, save, and (the part everyone fears) quit, without losing your work or your SSH session."
tags: [vim, nano, terminal, text-editor, ssh, command-line, beginner-friendly]
category: operating-systems
order: 9
difficulty: beginner
synonyms: ["how to quit vim", "how to exit vim", "how to save in vim", "how to use nano", "how to save and exit nano", "edit a file in the terminal", "vim vs nano", "stuck in vim", "esc colon wq", "editing files over ssh"]
updated: 2026-06-30
---

# Editing in the Terminal

Sooner or later something puts you inside a text editor in the terminal - a config file on a server, a
commit message, a quick fix over SSH - and there's no mouse, no menus, and no obvious way out. If you've
ever opened `vim`, typed a few characters, watched nothing make sense, and then *couldn't even close it*,
this guide is for you. That panic is normal, it happens to nearly everyone once, and it ends today.

By the end you'll understand *why* people edit in the terminal at all, you'll be able to drive `nano` with
total confidence (it tells you what to do right on the screen), and you'll know vim's one big idea - modes -
which is the key that unlocks everything, including the calm, guaranteed way out.

> ⏭️ This guide assumes you're comfortable moving around in a terminal. If commands like `cd` and `ls`
> still feel shaky, start with [/guides/the-terminal-and-shell](/guides/the-terminal-and-shell) and come
> back - editing makes far more sense once driving the shell is second nature.

## How to read this

- **Scared of vim right now, or stuck in it?** Skip straight to [Phase 3: vim - the mode that traps everyone, and the way out](03-vim-modes-and-escaping.md). The escape sequence is near the top.
- **Want the whole picture?** Read in order. Phase 1 explains *why* this skill exists, Phase 2 gives you a friendly editor you can use today, and Phase 3 demystifies the scary one.

## The phases

1. **[Why edit in the terminal at all](01-why-edit-in-the-terminal.md)** - SSH, servers with no desktop,
   and the moment something drops you into an editor you didn't choose. The mental map of which editor is
   where, and which one to reach for.
2. **[nano: the gentle default](02-nano-the-gentle-default.md)** - open, type, save, and quit, with the
   shortcuts printed right on the screen the whole time. The one editor you can use the minute you learn it.
3. **[vim: the mode that traps everyone, and the way out](03-vim-modes-and-escaping.md)** - the big idea
   (normal vs. insert mode), why that design is powerful instead of cruel, and the exact keystrokes to
   save, quit, and escape - including when you've made a mess and want out clean.

[Phase 1: Why edit in the terminal at all](01-why-edit-in-the-terminal.md) →
