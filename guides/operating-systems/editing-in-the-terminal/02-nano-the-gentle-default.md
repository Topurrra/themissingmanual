---
title: "nano: the gentle default"
guide: "editing-in-the-terminal"
phase: 2
summary: "nano works the way your instincts expect: type to insert, arrow keys to move, and a menu of shortcuts at the bottom of the screen the whole time. Ctrl+O saves, Ctrl+X quits - and it never hides the exit."
tags: [nano, terminal-editor, save, quit, shortcuts, beginner-friendly]
difficulty: beginner
synonyms: ["how to use nano", "how to save in nano", "how to exit nano", "nano save and exit", "what does ctrl o do in nano", "nano shortcuts", "edit file with nano"]
updated: 2026-06-30
---

# nano: the gentle default

Let's start with the easy one. `nano` is the editor that behaves the way you already expect a text editor to
behave: you type and the letters appear, the arrow keys move the cursor, Backspace deletes. There's no
secret mode to be in and no hidden state. Best of all, it prints its own instructions across the bottom of
the screen at all times, so you're never guessing what to press. If you can read the screen, you can use
nano.

## Opening a file

You launch nano by giving it a filename:

```console
ada@laptop:~$ nano notes.txt
```
*What just happened:* nano opened `notes.txt` for editing. If the file already exists, you see its
contents; if it doesn't exist yet, you get an empty buffer and nano will create the file when you save. The
cursor sits at the top, ready - you can start typing immediately, no mode-switching required.

## What you're looking at

Here's the shape of the nano screen. The important part is the menu glued to the bottom:

```text
  GNU nano 7.2                       notes.txt

Buy milk
Call the plumber
Finish the report


^G Help      ^O Write Out  ^W Where Is   ^K Cut
^X Exit      ^R Read File  ^\ Replace    ^U Paste
```
*What just happened:* The top line is the editor's name and the file you're editing. The middle is your
text - edit it directly with the arrow keys and normal typing. The bottom two rows are the **menu**, and
they're the whole reason nano is friendly: every command you need is printed right there, all the time.

📝 **Reading the menu.** The `^` symbol means the **Ctrl** key. So `^O` means "hold Ctrl and press O," and
`^X` means "hold Ctrl and press X." (You don't need to use a capital letter - `Ctrl+O` and `Ctrl+o` are the
same.) On a Mac, it's still the **Ctrl** key here, *not* Command - nano follows the Unix convention. The two
you'll use constantly are `^O` to save and `^X` to quit.

## Editing: it's exactly what you'd guess

There's almost nothing to learn for basic editing, because nano works on instinct:

- **Type** anywhere to insert text at the cursor.
- **Arrow keys** move the cursor up, down, left, right.
- **Backspace / Delete** remove characters, as always.
- **Enter** makes a new line.

That's the whole everyday toolkit. No mode to enter, no command to type first. The cursor is where your
next character lands, and what you type is what you get.

## Saving: Ctrl+O ("Write Out")

To save, press **Ctrl+O**. nano calls saving "Write Out" - think *output to disk* - which is why the
shortcut is the letter O. It then asks you to confirm the filename:

```text
File Name to Write: notes.txt
^G Help          M-D DOS Format   M-A Append
^C Cancel        M-M Mac Format   M-P Prepend
```
*What just happened:* nano is confirming where to save. The filename you opened is already filled in, so
press **Enter** to accept it and write the file. (Type a different name first if you want to save a copy
elsewhere.) After you press Enter, you're back in your text with the changes safely on disk - nano stays
open so you can keep editing.

💡 **Key point.** Saving and quitting are two separate steps in nano, and that's a feature. `Ctrl+O` saves
*without leaving*, so you can save your work mid-edit as often as you like - a good habit over a flaky SSH
connection, where saving often means a dropped connection costs you seconds of work instead of an hour.

## Quitting: Ctrl+X

To leave nano, press **Ctrl+X**. If everything is already saved, nano closes immediately and drops you back
at the shell prompt. If you have *unsaved* changes, nano won't let you lose them by accident - it asks:

```text
Save modified buffer?
 Y Yes
 N No           ^C Cancel
```
*What just happened:* nano noticed unsaved changes and is protecting you. Press **Y** to save then quit,
**N** to quit and *throw away* your changes, or **Ctrl+C** to cancel and stay in the editor. If you press
**Y**, it then asks you to confirm the filename (same as `Ctrl+O`) - press **Enter** and you're done.

⚠️ **Gotcha.** Pressing **N** here means "quit *without* saving" - your edits since the last save are gone
for good. If you're not sure whether you want to keep your changes, choose **Ctrl+C** to cancel, look at
your work, and decide deliberately. There's no undo once you've quit.

## The one full workflow, start to finish

Put it together and editing a file in nano is four moves:

```text
1. nano somefile      → open it
2. (type your edits)  → arrow keys + normal typing
3. Ctrl+O, Enter      → save (Write Out, confirm filename)
4. Ctrl+X             → quit back to the shell
```
*What just happened:* That's the complete loop - open, edit, save, quit. There's no fifth secret step and
no mode to escape. Once these four are in your fingers, nano is a solved problem and you can edit any file
on any machine that has it.

## A couple of handy extras (optional)

You don't need these to be productive, but they come up:

- **Ctrl+W** ("Where Is") - search for text. Type your search term, press Enter, and the cursor jumps to the
  next match.
- **Ctrl+K** cuts the current line; **Ctrl+U** pastes it back. Press `Ctrl+K` a few times in a row to cut
  several lines, then `Ctrl+U` to drop them somewhere else.

📝 **Note.** Some nano versions show `M-` shortcuts in the menu - `M` means the **Meta** key, which is
**Alt** on most keyboards (and **Esc** pressed-then-released on many Macs). You can safely ignore all of
these while you're learning; the `Ctrl` shortcuts cover everything in this phase.

## For builders

nano respects an environment variable called `EDITOR`. If you set `export EDITOR=nano` in your shell's
startup file (like `~/.bashrc`), then tools that open an editor for you - `git commit`, `crontab -e`, and
many others - will use nano instead of vim. That one line turns the scariest "a tool opened vim" moments
into the friendly editor you already know. (If that didn't fully land, the next phase makes sure vim holds
no fear either way.)

## Recap

1. Open a file with `nano filename`; start typing immediately - there's no mode to enter.
2. The **menu at the bottom** shows every shortcut, always. `^` means **Ctrl**.
3. **Ctrl+O** saves ("Write Out") without leaving - confirm the filename with Enter.
4. **Ctrl+X** quits; if there are unsaved changes, nano asks before letting you lose them.
5. The full loop is four moves: open, edit, `Ctrl+O`, `Ctrl+X`.

nano is the easy one. Now let's defang the editor everyone fears - and it all comes down to a single idea.

```quiz
[
  {
    "q": "In nano's on-screen menu, what does `^O` mean?",
    "choices": ["Press Option then O", "Hold Ctrl and press O", "Type a caret then the letter O", "Press O twice"],
    "answer": 1,
    "explain": "The `^` symbol stands for the Ctrl key, so `^O` means Ctrl+O - nano's command for saving ('Write Out')."
  },
  {
    "q": "You've made edits and press Ctrl+X. nano asks 'Save modified buffer?'. What does pressing N do?",
    "choices": ["Saves and quits", "Quits and discards your unsaved changes", "Renames the file", "Cancels and stays in nano"],
    "answer": 1,
    "explain": "N means quit without saving - your changes since the last save are lost. Ctrl+C cancels and keeps you in the editor."
  },
  {
    "q": "Why is it useful that Ctrl+O saves without quitting?",
    "choices": ["It compresses the file", "You can save often mid-edit, so a dropped connection costs little work", "It locks the file from other users", "It automatically commits to git"],
    "answer": 1,
    "explain": "Saving and quitting being separate lets you save frequently - handy over a flaky SSH link where a drop could otherwise cost a lot of work."
  }
]
```

---

[← Phase 1: Why edit in the terminal](01-why-edit-in-the-terminal.md) · [Guide overview](_guide.md) · [Phase 3: vim - modes and escaping →](03-vim-modes-and-escaping.md)
