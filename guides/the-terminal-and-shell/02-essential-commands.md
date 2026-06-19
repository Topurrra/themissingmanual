---
title: "The Essential Commands"
guide: "the-terminal-and-shell"
phase: 2
summary: "The anatomy of a command (command + options + arguments), then the everyday toolkit: pwd, ls, cd, cat, less, mkdir, cp, mv, and rm — each with a real transcript, explained for real, and the gotchas that bite beginners (rm has no undo; quote filenames with spaces)."
tags: [terminal, shell, commands, pwd, ls, cd, cat, less, mkdir, cp, mv, rm, navigation]
difficulty: beginner
synonyms: ["what does pwd do", "what does ls do", "how to change directory cd", "how to view a file cat less", "how to make a folder mkdir", "how to copy cp move mv delete rm", "command options vs arguments", "rm no undo recycle bin"]
updated: 2026-06-19
---

# The Essential Commands

You know what the shell is and how its loop works. Now let's fill your hands. There are thousands of
commands out there, but the truth is you'll reach for the same small handful constantly — looking around,
moving between folders, reading files, and making/copying/moving/deleting things. Learn these nine well
and you can navigate any system with confidence.

Type along in your own terminal. Doing it once teaches more than reading it five times.

> The transcripts below show a Mac/Linux shell (bash or zsh). PowerShell on Windows has built-in
> equivalents and even understands many of these names as aliases (`ls`, `cd`, `cat` work there too).
> Where it differs in a way that matters, it's noted.

## The anatomy of a command

Almost every command you'll ever type follows the same three-part shape. See it once and every command
afterward is readable:

```text
   ls   -l   Documents
   │    │     │
   │    │     └── ARGUMENT  — what to act on (here: a folder)
   │    └──────── OPTION/FLAG — how to do it (here: "-l" = long, detailed listing)
   └───────────── COMMAND  — the program to run (here: "ls", "list")
```

- The **command** is the name of the program to run — always first.
- **Options** (also called **flags**) change *how* it runs. They usually start with a dash: a single dash
  for short forms (`-l`, `-a`), two dashes for long, readable forms (`--all`, `--help`). They're optional;
  the command has sensible defaults without them.
- **Arguments** are *what* the command acts on — a filename, a folder, some text.

Parts are separated by spaces. That one fact — **spaces separate the pieces** — is behind a gotcha we'll
hit with filenames shortly, so keep it in mind.

📝 **Terminology.** "Option" and "flag" mean the same thing — a setting like `-l` that tweaks a command's
behavior. People use both words interchangeably; don't let the two names fool you into thinking they're
different.

💡 **Key point.** Almost any command accepts `--help` (or `-h`), which prints a summary of its options
and arguments. When you forget how something works, `ls --help` is faster and safer than guessing.

## `pwd` — where am I right now?

The shell is always "standing inside" exactly one folder, called your **current working directory**.
Everything you do happens relative to it, so the first question is always *where am I?*

```console
ada@laptop:~$ pwd
/home/ada
```
*What just happened:* `pwd` ("print working directory") reported the full path of the folder you're
currently in: `/home/ada`. That `/home/ada` is the same place the prompt's `~` was standing in for — `~`
is just shorthand for your home folder. Whenever you feel lost, `pwd` re-orients you. It only reports; it
changes nothing.

## `ls` — what's in here?

```console
ada@laptop:~$ ls
Desktop  Documents  Downloads  notes.txt  photo.jpg
```
*What just happened:* `ls` ("list") showed the contents of your current folder — three folders and two
files. By default it gives you the bare names. Ask for more detail with `-l`:

```console
ada@laptop:~$ ls -l
total 20
drwxr-xr-x  2 ada  ada  4096 Jun 18 09:14 Desktop
drwxr-xr-x  5 ada  ada  4096 Jun 19 11:02 Documents
drwxr-xr-x  3 ada  ada  4096 Jun 17 16:30 Downloads
-rw-r--r--  1 ada  ada   132 Jun 19 10:45 notes.txt
-rw-r--r--  1 ada  ada  8841 Jun 15 13:20 photo.jpg
```
*What just happened:* The `-l` flag switched `ls` into a "long," detailed listing — one item per line with
its permissions, owner, size in bytes, and last-modified date. The leading `d` (as on `Desktop`) marks a
**d**irectory; a leading `-` marks a regular file. You don't need to decode every column today; the point
is that the *same command* gives you the answer at the level of detail you ask for.

⚠️ **Gotcha.** By default `ls` hides files whose names start with a dot (like `.git` or `.bashrc`) — these
"dotfiles" are config files meant to stay out of the way. If a file seems missing, try `ls -a` ("all") to
reveal the hidden ones. They were always there; `ls` was just being tidy.

## `cd` — move to another folder

```console
ada@laptop:~$ cd Documents
ada@laptop:~/Documents$ pwd
/home/ada/Documents
```
*What just happened:* `cd Documents` ("change directory") moved you *into* the `Documents` folder. Notice
the prompt updated — `~` became `~/Documents` — and `pwd` confirms you're now at `/home/ada/Documents`.
Your shell is now standing in a different room, so `ls` and everything else will act there.

A few `cd` moves worth memorizing, because you'll use them constantly:

```console
ada@laptop:~/Documents$ cd ..
ada@laptop:~$ cd
ada@laptop:~$
```
*What just happened:* `cd ..` went *up* one level — `..` always means "the parent folder," so you went
from `Documents` back to `/home/ada`. Then plain `cd` with nothing after it jumped you straight back to
your home folder from wherever you were. (`cd -` is a handy third: it returns you to the folder you were
in just before — like a "back" button.)

📝 **Terminology.** A **path** is the address of a file or folder. `Documents` is a *relative* path
(relative to where you are now); `/home/ada/Documents` is an *absolute* path (the full address from the
top). `.` means "here," `..` means "one level up," and `~` means "my home folder." If paths in general
feel shaky, the sibling guide
[/guides/the-filesystem-explained](/guides/the-filesystem-explained) is the deep dive.

## `cat` — dump a file's contents to the screen

```console
ada@laptop:~$ cat notes.txt
Buy milk
Call the dentist
Finish the terminal guide
```
*What just happened:* `cat` printed the entire contents of `notes.txt` straight into your terminal. It's
the fastest way to glance at a short file without opening an editor. (The odd name is short for
"concatenate" — its original job was joining files together — but day to day you'll use it to peek at
one.)

⚠️ **Gotcha.** `cat` dumps the *whole* file at once. On a short file that's perfect; on a 10,000-line log
it floods your screen and scrolls everything useful off the top. For anything long, use `less` instead.

## `less` — read a long file calmly, one screen at a time

```console
ada@laptop:~$ less server.log
2026-06-19 11:02:14  INFO  server started on port 3000
2026-06-19 11:02:15  INFO  connected to database
2026-06-19 11:03:01  WARN  slow query (1.2s)
...
:
```
*What just happened:* `less` opened the file in a scrollable viewer instead of dumping it. That `:` at the
bottom is `less` waiting for you — it has taken over the screen. Use the **arrow keys** or **Space** to
scroll, type `/word` then Enter to search for "word," and press **`q`** to quit back to your prompt.

⚠️ **Gotcha.** The first time `less` (or a similar pager) takes over your screen, it's easy to feel
trapped — none of your normal commands seem to work, because `less` is intercepting your keys. The way out
is always the same: press **`q`**. Plain `git log`, `man`, and other commands open pagers too; `q` quits
all of them.

## `mkdir` — make a new folder

```console
ada@laptop:~$ mkdir projects
ada@laptop:~$ ls
Desktop  Documents  Downloads  notes.txt  photo.jpg  projects
```
*What just happened:* `mkdir projects` ("make directory") created a new, empty folder named `projects`,
and the follow-up `ls` confirms it's there. Nothing is inside it yet — it's an empty room ready for you to
`cd` into and start working.

## `cp` — copy a file (the original stays put)

```console
ada@laptop:~$ cp notes.txt notes-backup.txt
ada@laptop:~$ ls
Desktop  Documents  Downloads  notes-backup.txt  notes.txt  photo.jpg  projects
```
*What just happened:* `cp` ("copy") made a duplicate of `notes.txt` named `notes-backup.txt`. The shape is
always `cp <source> <destination>` — *from* first, *to* second. The original `notes.txt` is untouched; you
now have two files. (To copy a whole folder and everything inside it, you need `cp -r` — the `-r` flag
means "recursive," i.e. include the contents.)

## `mv` — move or rename (the original does *not* stay)

```console
ada@laptop:~$ mv notes-backup.txt projects/
ada@laptop:~$ ls projects
notes-backup.txt
```
*What just happened:* `mv` ("move") relocated `notes-backup.txt` into the `projects` folder — it's now
*there* and no longer in the home folder. Same `<source> <destination>` shape as `cp`, but `mv` doesn't
leave a copy behind.

Here's the part that surprises people: **renaming and moving are the same operation.** "Move this file to
a new name in the same folder" *is* a rename:

```console
ada@laptop:~$ mv notes.txt todo.txt
ada@laptop:~$ ls
Desktop  Documents  Downloads  photo.jpg  projects  todo.txt
```
*What just happened:* Giving `mv` a destination that's just a different *name* in the same folder renamed
`notes.txt` to `todo.txt`. There is no separate "rename" command in the shell — `mv` is it. That feels odd
at first, then perfectly natural.

## `rm` — delete a file (and this one needs your full attention)

```console
ada@laptop:~$ rm todo.txt
ada@laptop:~$ ls
Desktop  Documents  Downloads  photo.jpg  projects
```
*What just happened:* `rm` ("remove") deleted `todo.txt`. Notice what *didn't* happen: no confirmation
prompt, no "are you sure?", and the command printed nothing at all. Silence means it worked. `todo.txt` is
gone, and the only sign is that it's no longer in the `ls` output.

⚠️ **Gotcha — read this twice.** `rm` does **not** move files to a Recycle Bin or Trash. There is **no
undo**. When you `rm` something, the shell asks the OS to delete it immediately and permanently — it does
not pass through any safety net the desktop gives you. This is the precision from Phase 1 cutting the other
way: the terminal does *exactly* what you said, instantly. Treat `rm` with respect:
- Run `ls` first to confirm you're deleting what you think you are.
- Be extremely careful with `rm -r` (recursive — deletes a folder *and everything inside it*). It's
  powerful and unforgiving.
- If you want a confirmation prompt, `rm -i` asks before each delete. A good habit while you're new.

🪖 **War story.** Every seasoned developer has, at least once, deleted the wrong thing with `rm` and felt
that specific cold drop in the stomach. It's a rite of passage precisely *because* there's no undo. The
fix isn't fear — it's the habit above: look before you delete.

## The gotcha that spans all of these: spaces in filenames

Remember from the anatomy section that **spaces separate the pieces of a command**. So what happens when a
filename itself contains a space?

```console
ada@laptop:~$ cat my notes.txt
cat: my: No such file or directory
cat: notes.txt: No such file or directory
```
*What just happened:* You meant *one* file called `my notes.txt`, but the shell saw the space and split it
into *two* arguments — `my` and `notes.txt` — and went looking for two separate files that don't exist.
The shell isn't being difficult; it genuinely can't tell your filename-space from a separator-space unless
you tell it.

The fix is to **quote** the name, which tells the shell "treat all of this as one piece":

```console
ada@laptop:~$ cat "my notes.txt"
Remember to quote filenames with spaces.
```
*What just happened:* The quotes wrapped `my notes.txt` into a single argument, so `cat` got the one file
you meant and printed it. Single quotes work too. This is why filenames with spaces are a small headache
in the terminal — and why many developers name files `my-notes.txt` or `my_notes.txt` to sidestep it
entirely.

## Recap

1. **Anatomy:** `command [options] [arguments]`, separated by spaces. Options (flags) tweak *how*;
   arguments say *what*. `--help` reminds you of both.
2. **`pwd`** — where am I? **`ls`** (`-l` detailed, `-a` shows hidden) — what's here?
3. **`cd <folder>`** — move in; **`cd ..`** up; **`cd`** home; **`cd -`** back.
4. **`cat`** — dump a short file; **`less`** — scroll a long one (press **`q`** to quit).
5. **`mkdir`** — make a folder. **`cp <from> <to>`** — copy (original stays). **`mv <from> <to>`** — move
   *or* rename (original doesn't stay).
6. **`rm`** — delete, **permanently, no undo, no Recycle Bin**. Look before you leap; `rm -r` deletes whole
   folders.
7. **Quote filenames with spaces** (`"my notes.txt"`), because spaces normally separate command pieces.

You can now navigate and manage files by hand. Next, the features that make the terminal genuinely
*powerful* — chaining commands together and letting the shell do the tedious parts for you.

---

[← Phase 1: What the Terminal and Shell Actually Are](01-terminal-vs-shell.md) · [Guide overview](_guide.md) · [Phase 3: The Real Power →](03-pipes-redirection-wildcards-path.md)
