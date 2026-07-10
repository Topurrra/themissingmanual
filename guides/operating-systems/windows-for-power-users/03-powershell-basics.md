---
title: "PowerShell Basics"
guide: "windows-for-power-users"
phase: 3
summary: "PowerShell is a modern shell whose big idea is that commands pass objects, not plain text; cmdlets are named Verb-Noun (Get-Process, Get-ChildItem, Stop-Process); you pipe objects from one cmdlet to the next; and running a script for the first time hits the execution-policy gotcha."
tags: [powershell, shell, cmdlets, objects, pipeline, execution-policy, windows]
difficulty: intermediate
synonyms: ["what is powershell", "powershell for beginners", "powershell objects vs text", "what does get-process do", "powershell verb noun cmdlet", "how to pipe in powershell", "how to run a powershell script", "powershell execution policy error", "running scripts is disabled on this system"]
updated: 2026-07-10
---

# PowerShell Basics

If you've used a terminal before - or read [The Terminal & Shell](/guides/the-terminal-and-shell) - you know a shell is a program that takes typed commands and runs them. PowerShell is Windows' modern shell, and it's genuinely worth learning. But here's the thing nobody tells you up front, and it changes everything about how you read it:

**Most shells pass plain text between commands. PowerShell passes *objects*.**

That one sentence is the whole personality of PowerShell. Grasp it first, and every weird-looking thing afterward - the `Verb-Noun` names, the way you can sort and filter so easily - stops being weird and starts being obvious. So let's build that idea before we type anything serious.

> 📝 **Terminology.** *Shell* = the program that reads your typed commands and runs them (PowerShell, plus the older Command Prompt `cmd.exe`, are Windows' shells). *Cmdlet* (pronounced "command-let") = a built-in PowerShell command, like `Get-Process`.

## The big idea: objects, not text

**What it actually is.** In a traditional shell, when one command's output feeds into the next, what flows between them is **text** - lines of characters. The second command has to *re-parse* that text (hunt for the right column, split on spaces) to get at the data. It works, but it's fiddly and fragile.

PowerShell flows **objects** instead - structured things with named properties. When a cmdlet hands you a process, it's not a line of text that *says* "chrome 14% 2140MB"; it's an actual process object with a `.Name` property, a `.CPU` property, an `.Id` property. The next cmdlet can ask for `.CPU` directly. No parsing, no guessing which column is which.

```text
   TRADITIONAL SHELL (text)              POWERSHELL (objects)
   ──────────────────────────           ──────────────────────────
   command → "chrome 14% 2140MB"        command → { Name="chrome",
                  │   (a line of text)               Id=8124,
                  ▼                                   CPU=14.2,
   next command must SPLIT the text                  WorkingSet=2140MB }
   to find the number it wants                       │  (a real object)
                                                     ▼
                                          next command just asks for .CPU
```

**Why this is the whole game.** Because the data stays structured, you sort, filter, and select by *property name* with simple, readable commands instead of text-wrangling incantations. That's why PowerShell feels verbose at first, then suddenly feels powerful: you're manipulating data, not scraping text.

💡 **Key point.** Whenever you see a PowerShell command, ask "what *object* does this produce, and what properties does it have?" That question is the key to the entire shell. The display you see on screen is just a *printed view* of objects that are richer than what's shown.

## Cmdlets are named `Verb-Noun`

**What it actually is.** Every built-in PowerShell command follows one naming pattern: a **verb**, a hyphen, and a **noun**. `Get-Process`. `Get-ChildItem`. `Stop-Process`. `Set-Location`. The verb says what you're doing; the noun says what you're doing it to.

**Why this is a gift.** Once you know the pattern, you can *guess* commands instead of memorizing them. Want to see services? `Get-Service`. Stop one? `Stop-Service`. Start one? `Start-Service`. The verbs come from a small, standard list (`Get`, `Set`, `Start`, `Stop`, `New`, `Remove`, …), so the language is far more predictable than the cryptic short names of older shells.

**A real example.** `Get-Process` produces process objects - and PowerShell prints them as a tidy table:

```powershell
PS C:\> Get-Process

 NPM(K)    PM(M)      WS(M)     CPU(s)      Id  SI ProcessName
 ------    -----      -----     ------      --  -- -----------
     28    18.45      52.10       4.31    8124   1 chrome
     31    24.02      88.77      12.96    8456   1 chrome
     12     2.10       6.44       0.20    1190   0 spoolsv
     45    61.30     142.88      31.07    9032   1 Code
```
*What just happened:* `Get-Process` asked the OS for every running process and handed back one **object per process**. PowerShell printed a default table view of them - but each row is a full object with properties like `Id`, `ProcessName`, `CPU`, and `WS` (working set, i.e. memory in use). You're seeing the same processes Task Manager shows, as data you can now work with. (`SI` is the session; `0` is a service session, `1` is your login.)

📝 **Terminology.** *`Get-ChildItem`* is PowerShell's "list what's in this folder" cmdlet - the equivalent of the old `dir`. The noun "ChildItem" is general on purpose: it lists the *children* of wherever you are, whether that's files in a folder or - neatly - keys in the registry.

```powershell
PS C:\Users\you> Get-ChildItem

    Directory: C:\Users\you

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
d-----         6/18/2026   9:14 AM                Desktop
d-----         6/19/2026   8:02 AM                Documents
d-----         6/17/2026   4:48 PM                Downloads
-a----         6/15/2026  11:30 AM          14237 notes.txt
```
*What just happened:* `Get-ChildItem` listed the children of your home folder. The `d-----` rows are directories; `-a----` is a normal file (the `d` flag means directory, `a` means archive). Again - these aren't text lines, they're file/folder objects, each carrying `Name`, `Length`, `LastWriteTime`, and more.

## Piping objects from one cmdlet to the next

This is where "objects, not text" pays off. The **pipe** `|` takes the objects coming out of one cmdlet and feeds them into the next. Because they're objects, the next cmdlet can act on their properties directly.

**A real example - find your top memory hogs:**

```powershell
PS C:\> Get-Process | Sort-Object WS -Descending | Select-Object -First 3 Name, Id, WS

Name      Id     WS
----      --     --
chrome  8456  93057024
Code    9032  68891648
chrome  8124  54618112
```
*What just happened:* Read it left to right as a sentence. `Get-Process` produced process objects; `Sort-Object WS -Descending` reordered them by the **`WS`** (memory) property, biggest first; `Select-Object -First 3 Name, Id, WS` kept the top three and showed only those three properties. At no point did anything parse text - each cmdlet reached straight into the objects' properties by name. *That's* the power the object pipeline buys you: a readable English-ish line does what would be a gnarly text-scraping script elsewhere.

**Stopping a process from the pipeline.** Because objects carry their identity, you can pipe them straight into an action cmdlet:

```powershell
PS C:\> Get-Process notepad | Stop-Process
```
*What just happened:* `Get-Process notepad` found the Notepad process **object(s)**, and the pipe handed them to `Stop-Process`, which terminated each one. You didn't have to look up and retype a PID - the object you found *is* the thing you stopped. (This is the same hard kill as Task Manager's "End task," so the same caution applies: unsaved work in that program is lost.)

⚠️ **Gotcha:** `Stop-Process` is a hard kill - no "save your work?" prompt. Be sure you've matched the right process before you pipe it into a stop. `Get-Process notepad` first, *look* at what came back, *then* stop it.

## Running a script - and the execution-policy gotcha

A PowerShell script is a text file ending in `.ps1` - a saved list of the same commands you'd type. You run it by giving its path:

```powershell
PS C:\Users\you> .\hello.ps1
```

And here, on a fresh Windows machine, almost everyone hits the same wall the very first time:

```powershell
PS C:\Users\you> .\hello.ps1
.\hello.ps1 : File C:\Users\you\hello.ps1 cannot be loaded because running
scripts is disabled on this system. For more information, see
about_Execution_Policies at https:/go.microsoft.com/fwlink/?LinkID=135170.
    + CategoryInfo          : SecurityError: (:) [], PSSecurityException
    + FullyQualifiedErrorId : UnauthorizedAccess
```
*What just happened:* This is **not** a bug, and your script is fine. Windows ships with an **execution policy** that blocks running script files by default - a deliberate safety setting so a downloaded `.ps1` can't silently run itself. PowerShell is refusing to execute the file, and politely telling you why.

📝 **Terminology.** *Execution policy* = a PowerShell safety setting that controls whether (and which) script files are allowed to run. It is a *speed bump, not a security boundary* - Microsoft is explicit that it's meant to prevent accidental script runs, not to stop a determined attacker.

**The fix - for your own account, deliberately:**

```powershell
PS C:\> Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```
*What just happened:* You changed the policy for **your user account only** (`-Scope CurrentUser`, so you don't need admin rights and you don't change it for everyone). `RemoteSigned` means: scripts *you* wrote locally can run, but scripts *downloaded from the internet* must be digitally signed by a trusted publisher first. That's the sensible middle ground - your own scripts work, random downloads don't get a free pass.

⚠️ **Gotcha - don't reach for `Unrestricted` or `Bypass` to "make the error go away."** Those turn the safety off entirely and let *any* script, including ones you downloaded without thinking, run unchallenged. `RemoteSigned` for `CurrentUser` is the standard, safe choice. If a tutorial tells you to set `Bypass` machine-wide, that's a flag to slow down and understand what you're being asked to disable.

🪖 **War story.** Every Windows developer has watched a colleague paste a script, hit that red "running scripts is disabled" wall, and conclude "PowerShell is broken." It isn't - it's a safety setting doing its job, and now a 30-minute confused detour is a 10-second `Set-ExecutionPolicy`.

## Where to go from here

You now have the load-bearing idea: PowerShell moves **objects**, named **`Verb-Noun`**, **piped** from one to the next. Three habits will carry you a long way:

- When stuck on what a command is called, guess the `Verb-Noun` - or run `Get-Command *process*` to search.
- When you want to know what an object can do, pipe it into `Get-Member` (`Get-Process | Get-Member`) to list its properties and methods.
- When you want to read a cmdlet's manual, `Get-Help Get-Process` (the help system is itself just more cmdlets).

Deeper scripting - variables, loops, functions, error handling, writing real automation - is its own guide. But the daily wins (find a hog, stop a stuck process, list a folder, run a trusted script) are all yours now.

## Recap

1. PowerShell's defining idea: commands pass **objects** (structured data with named properties), not plain text - so you work with data instead of scraping it.
2. Built-in commands are **cmdlets**, named **`Verb-Noun`** (`Get-Process`, `Get-ChildItem`, `Stop-Process`) - predictable enough to guess.
3. The **pipe `|`** passes objects from one cmdlet to the next, which is why `Get-Process | Sort-Object WS | Select-Object -First 3` reads like a sentence and needs no text parsing.
4. Scripts are `.ps1` files; the first run usually hits the **execution policy** block. ⚠️ Fix it deliberately with `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` - not by turning the safety off entirely.

> ⏭️ **Where next.** For the shell concepts underneath all this (what a prompt, a path, and a pipe really are), see [The Terminal & Shell](/guides/the-terminal-and-shell). To compare how the *other* big OSes do the same jobs, see [macOS Under the Hood](/guides/macos-under-the-hood) and the foundation in [What an Operating System Is](/guides/what-an-operating-system-is).

---

[← Phase 2: Services, Task Manager & the Registry](02-services-task-manager-registry.md) · [Guide overview](_guide.md)
