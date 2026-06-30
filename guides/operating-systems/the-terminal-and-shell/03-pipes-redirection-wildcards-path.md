---
title: "The Real Power: Pipes, Redirection, Wildcards & PATH"
guide: "the-terminal-and-shell"
phase: 3
summary: "The features that make typing beat clicking: | pipes the output of one command into the next, > and >> redirect output into files, * matches groups of filenames, and PATH is the list of folders the shell searches to find which program a command name means."
tags: [terminal, shell, pipes, redirection, wildcards, globbing, path, grep, bash, powershell]
difficulty: beginner
synonyms: ["what is a pipe in the terminal", "what does the pipe symbol do", "redirect output to a file", "what is > and >> in bash", "what is a wildcard asterisk", "what is PATH", "echo $PATH", "command not found why", "ls grep example"]
updated: 2026-06-19
---

# The Real Power: Pipes, Redirection, Wildcards & PATH

So far each command has stood alone: type one, get its answer, type the next. That's already useful. But
the reason experienced developers genuinely *prefer* the terminal isn't the individual commands - it's that
the shell lets you **wire them together**, **capture their output**, and **act on whole groups of files at
once**, all from one line. This phase is where "I can use the terminal" turns into "the terminal makes me
fast."

The four ideas here - pipes, redirection, wildcards, and PATH - are the ones worth real understanding.
Each is small. Together they're most of what makes a shell powerful.

> The syntax below is bash/zsh (Mac/Linux). PowerShell shares all four *ideas* - it has pipes,
> redirection, wildcards, and a PATH - but pipes something richer than plain text, and a few symbols
> differ. Where it matters, it's flagged. Learn the concepts here and the PowerShell versions read easily.

## Pipes (`|`) - feed one command's output into the next

**What it actually is.** A **pipe**, written `|`, takes the text output of the command on its left and
hands it straight to the command on its right *as that command's input*. Instead of one command printing
to your screen, its output flows into another command for further processing.

**Why this is the big one.** Each shell command is small and does one job. Pipes let you snap them together
like LEGO into a custom tool you invented on the spot. The classic example pairs `ls` (which lists files)
with `grep` (which filters lines, keeping only those that match):

```console
ada@laptop:~/projects$ ls
notes.txt  report-2025.pdf  report-2026.pdf  photo.jpg  draft.md
ada@laptop:~/projects$ ls | grep report
report-2025.pdf
report-2026.pdf
```
*What just happened:* `ls` produced its usual list of filenames - but the `|` meant that list never hit
your screen. Instead it flowed into `grep report`, which kept only the lines containing "report" and
printed those. You just built a "list only the report files" tool out of two general commands. Read the
`|` as the word "then": *list the files, **then** keep the ones matching "report."*

📝 **Terminology.** **`grep`** is a filter: it reads lines of text and prints only the ones matching a
pattern you give it. It's one of the most-used commands in any pipe, precisely because so often you want
"only the lines that mention X."

You can chain more than two. Each `|` passes its left side's output rightward:

```console
ada@laptop:~/projects$ ls | grep report | wc -l
2
```
*What just happened:* `ls` listed the files, `grep report` narrowed to the two report files, and `wc -l`
("word count, lines") counted the lines it received - answering "how many report files are there?" with
`2`. No single command does "count the report files," but three small ones piped together do. That's the
whole spirit of the shell.

## Redirection (`>` and `>>`) - capture output into a file

**What it actually is.** Where a pipe sends output to another *command*, **redirection** sends it to a
*file*. `>` writes the output to a file, and `>>` appends it to the end of a file.

```console
ada@laptop:~/projects$ ls > filelist.txt
ada@laptop:~/projects$ cat filelist.txt
notes.txt
report-2025.pdf
report-2026.pdf
photo.jpg
draft.md
filelist.txt
```
*What just happened:* `ls > filelist.txt` ran `ls`, but instead of printing the list to the screen, `>`
redirected it into a new file called `filelist.txt`. Then `cat` showed that the file now holds exactly
what `ls` would have printed. You've captured a command's output as a file you can keep, edit, or send to
someone.

⚠️ **Gotcha.** A single `>` **overwrites** the target file completely - if `filelist.txt` already had
contents, they're gone, no warning. Use `>>` when you want to *add to* a file instead of replacing it:

```console
ada@laptop:~/projects$ echo "draft.md" >> filelist.txt
ada@laptop:~/projects$ tail -n 1 filelist.txt
draft.md
```
*What just happened:* `>>` appended the line `draft.md` to the *end* of `filelist.txt` without disturbing
what was already there; `tail -n 1` (show the last 1 line) confirms it landed at the bottom. The rule to
burn in: **`>` replaces, `>>` adds.** Reach for `>>` whenever you're not sure, because it's the one that
can't silently erase your file.

And of course pipes and redirection combine - filter, then save the result:

```console
ada@laptop:~/projects$ ls | grep report > reports.txt
ada@laptop:~/projects$ cat reports.txt
report-2025.pdf
report-2026.pdf
```
*What just happened:* `ls` listed files, `grep report` kept the report lines, and `>` wrote that filtered
result into `reports.txt` - a real one-liner that lists, filters, and saves in a single pass. This is the
kind of thing that's clumsy with a mouse and trivial by typing.

## Wildcards (`*`) - act on a whole group of files at once

**What it actually is.** A **wildcard** is a placeholder that matches multiple filenames. The star `*`
means "any run of characters," so `*.pdf` means "every name ending in `.pdf`." This is called **globbing**.

The crucial thing to understand - and the source of a classic surprise - is *who* expands it: the **shell
does the matching before the command ever runs.** The command never sees the `*`; it sees the actual list
of files the shell found.

```console
ada@laptop:~/projects$ ls *.pdf
report-2025.pdf  report-2026.pdf
```
*What just happened:* Before running `ls`, the shell looked in the folder, found every name ending in
`.pdf`, and replaced `*.pdf` with that list. So `ls` actually received `report-2025.pdf report-2026.pdf`
and listed them. The `*` saved you from typing both names - and it would scale identically to fifty PDFs.

It works with any command, which is where it gets powerful (and a little dangerous):

```console
ada@laptop:~/projects$ mkdir pdfs
ada@laptop:~/projects$ mv *.pdf pdfs/
ada@laptop:~/projects$ ls pdfs
report-2025.pdf  report-2026.pdf
```
*What just happened:* The shell expanded `*.pdf` to both PDF filenames, so `mv` received "move these two
files into `pdfs/`" and did exactly that - moving a whole category of files in one line.

⚠️ **Gotcha.** Because the shell expands `*` *before* the command runs, a wildcard with `rm` is genuinely
dangerous - and remember from Phase 2 that `rm` has no undo. `rm *.tmp` deletes every `.tmp` file, fine.
But a stray space turns `rm *.tmp` into `rm * .tmp` - which means `rm *` (delete *everything in the
folder*) followed by `.tmp`. To stay safe, **preview the match with `ls` first**: run `ls *.tmp`, confirm
the list is what you expect, *then* swap `ls` for `rm`. Seeing what `*` matches before you act on it is the
whole safety habit.

## PATH - how the shell finds the program behind a command name

Here's a question you may not have thought to ask: when you type `ls`, how does the shell know *where the
`ls` program actually lives* on disk? `ls` is itself a small program in a file somewhere - so how does
typing five letters find it?

**What it actually is.** **PATH** is a list of folders the shell searches, in order, whenever you type a
command name. When you type `ls`, the shell walks through those folders one by one until it finds a program
called `ls`, and runs the first match. That's the entire mechanism behind every command name you type.

You can see your own PATH. It's stored in an **environment variable** - a named value the shell keeps
around - and `echo` prints it (the `$` tells the shell "give me the *value* of this variable"):

```console
ada@laptop:~$ echo $PATH
/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/home/ada/.local/bin
```
*What just happened:* `echo $PATH` printed your PATH - a list of folders separated by colons. When you
type any command, the shell searches these folders left to right. `ls` lives in `/bin`, so it's found
there. The leftmost folders win ties, which is why order matters.

📝 **Terminology.** An **environment variable** is a named setting the shell (and the programs it runs)
can read - `PATH` is the most important one. `$NAME` means "the value stored in `NAME`." (On PowerShell
the same idea is written `$env:PATH`, and the folders are separated by semicolons, not colons.)

**Why this saves you later.** That dreaded message -

```console
ada@laptop:~$ myprogram
bash: myprogram: command not found
```
*What just happened:* The shell searched every folder in your PATH, found nothing named `myprogram`, and
gave up. `command not found` almost never means the program is broken - it means **the shell couldn't find
it in any PATH folder.** Either it isn't installed, or it's installed somewhere that isn't on your PATH.
This is *the* single most common terminal error, and now you know precisely what it's telling you: "I
looked in all my folders and there's no program by that name." The fix is to install the program, or to
add its folder to PATH - which is exactly what an installer's "add to PATH" checkbox is doing for you.

💡 **Key point.** A command name is not magic - it's a filename the shell *looks up* in your PATH folders.
Understanding that turns `command not found` from a mystery into a checklist: is it installed, and is its
folder on the PATH?

## The same ideas in PowerShell

You'll meet Windows machines, so it's worth knowing the concepts here are universal even though the syntax
shifts:

- **Pipes** exist (`|`) - but PowerShell pipes *objects* with named fields, not just lines of text, so its
  filtering reads like `Get-ChildItem | Where-Object Name -like "*report*"` rather than `ls | grep`.
- **Redirection** `>` and `>>` work the same way (write / append to a file).
- **Wildcards** `*` work the same way for matching filenames.
- **PATH** exists; you read it with `$env:PATH`, and its folders are separated by `;` instead of `:`.

Different words, identical ideas. Once you hold the concepts, you can read either shell.

## Recap

1. **Pipe `|`** - sends one command's output into the next as input. Read it as "then." `ls | grep report`
   = "list, then keep the report ones." Chain freely.
2. **Redirect `>` / `>>`** - sends output to a *file*. `>` **overwrites**; `>>` **appends**. When unsure,
   use `>>`.
3. **Wildcard `*`** - matches groups of filenames; the **shell expands it before the command runs**.
   Preview a match with `ls` before using it with `rm`.
4. **PATH** - the list of folders the shell searches to find the program behind a command name. `echo
   $PATH` shows it; `command not found` means it wasn't found in any of them.
5. The concepts carry to **PowerShell** even though some syntax differs.

That's the whole foundation. You know what the terminal and shell *are*, the everyday commands to drive
them, and the power features that let you combine, capture, and scale your work. From here, the natural
next step is **shell scripting** - saving a sequence of these commands in a file so you can rerun your own
little tools on demand. But everything a script does, you can now do by hand, on purpose, knowing exactly
what each line means.

---

[← Phase 2: The Essential Commands](02-essential-commands.md) · [Guide overview](_guide.md)
