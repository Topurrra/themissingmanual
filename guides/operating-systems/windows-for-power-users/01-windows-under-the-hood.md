---
title: "Windows Under the Hood"
guide: "windows-for-power-users"
phase: 1
summary: "Windows runs on the NT kernel; drive letters like C:\\ map to volumes; programs live in Program Files while your settings hide in AppData; 'Run as administrator' is a user-space program asking the trusted side for permission; and Windows differs from Unix in backslashes, .exe files, and the registry instead of config files."
tags: [windows, nt-kernel, drive-letters, appdata, program-files, uac, registry, unix-comparison]
difficulty: intermediate
synonyms: ["what is the nt kernel", "what does c drive mean", "what is appdata folder", "program files vs program files x86", "what does run as administrator do", "uac explained", "windows vs unix file paths", "why backslash in windows"]
updated: 2026-06-19
---

# Windows Under the Hood

Here's the reassuring truth: Windows is doing the exact same job every operating system does. A kernel in the middle, sharing the hardware among a crowd of programs, deciding who's allowed to do what. If that sentence is fuzzy, the [What an Operating System Is](/guides/what-an-operating-system-is) guide builds it from scratch - this phase assumes it and shows you what it looks like *wearing Windows clothes*.

What trips people up isn't the model. It's the local dialect: drive letters, a folder layout that scatters your stuff across several places, a permission prompt that darkens the whole screen, and a few decisions Microsoft made decades ago that still shape everything. Let's translate.

## The NT kernel: the engine you never see

**What it actually is.** At the center of Windows is a kernel called **NT** (the name is a holdover from "New Technology," Windows NT, 1993). Every version of Windows you've touched since Windows XP - including Windows 10 and 11 - runs on a descendant of that same NT kernel. It's the trusted core that talks to the CPU, the memory, and the disk, and enforces every rule about who can do what.

📝 **Terminology.** *NT kernel* = the core of Windows that manages the hardware and has full control of the machine. When people say "the Windows kernel," this is it.

**Why this matters to you.** Everything you see - the desktop, File Explorer, the Settings app, your browser - is a program running *on top of* NT, in user space, at arm's length from the hardware. None of them touch the disk or the network directly; they all ask the kernel. So when a program crashes, NT usually shrugs it off and keeps running (that's why one frozen app rarely takes the whole machine down). And when the whole machine locks up hard, that's the rarer, scarier case where the kernel itself is in trouble.

💡 **Key point.** "Windows" is two things wearing one name: the **NT kernel** (the real operating system) and the **desktop shell** (the Start menu, taskbar, File Explorer - the face you click on). When the taskbar freezes but music keeps playing, that's the face hanging while the kernel underneath is fine.

## Drive letters: `C:\` and friends

**What it actually is.** A drive letter is Windows' name for a **volume** - a formatted area of storage the OS can read and write. `C:` is, by long convention, the drive Windows itself is installed on. Plug in a USB stick and it shows up as `D:` or `E:`; a second hard drive might be `D:`. The letters aren't magic - they're just labels the OS hands out.

**Why people get this wrong.** People assume drive letters are physical - "C is my hard drive." Not quite. One physical disk can be split into several volumes (`C:` and `D:` on the same drive), and several disks can each get their own letter. The letter names a *volume*, not a piece of hardware.

📝 **Terminology.** *Volume* = a formatted, usable storage area with a filesystem on it. *Filesystem* = the scheme that organizes files and folders on a volume. Windows almost always uses **NTFS** (NT File System) for its main drive.

**How this differs from Unix.** This is the first big fork from the macOS/Linux world. On Unix-like systems there are no drive letters at all - there's one single tree starting at `/` (the "root"), and extra disks get *mounted* into a folder inside that one tree. Windows keeps each volume as its own lettered tree:

```text
   WINDOWS                          UNIX (macOS / Linux)
   ─────────────────────           ─────────────────────
   C:\                             /
   ├── Windows\                    ├── usr/
   ├── Program Files\              ├── etc/
   └── Users\                      └── home/
   D:\   ← a separate tree         /mnt/usb   ← the USB lives *inside* the one tree
   E:\   ← another separate tree
```

Neither is wrong - they're two answers to "how do we name more than one disk." Windows says "give each its own letter." Unix says "everything hangs off one root."

## The folder layout (and `AppData`, the one everyone trips over)

Open `C:\` and you'll see a handful of folders that actually matter. Here's what each is *for*:

```text
   C:\
   ├── Windows\          ← the OS itself: the kernel, drivers, system tools. Leave it alone.
   ├── Program Files\    ← installed apps (64-bit). One folder per app.
   ├── Program Files (x86)\  ← installed apps (older 32-bit). Yes, two folders. See below.
   ├── ProgramData\      ← app data shared by ALL users (licenses, shared databases). Hidden by default.
   └── Users\
       └── you\          ← your home folder. Everything that's "yours" lives under here.
           ├── Desktop\, Documents\, Downloads\, Pictures\ …
           └── AppData\  ← your per-user app settings and data. Hidden by default. ← the famous one.
```

**Why there are two `Program Files` folders.** `Program Files` holds modern 64-bit apps; `Program Files (x86)` holds older 32-bit ones. Windows keeps them apart so a 32-bit and 64-bit version of the same thing don't collide. It's not a bug - it's Windows quietly running both worlds at once. The `x86` name refers to the old 32-bit Intel architecture.

**Now, `AppData` - the folder that explains a hundred mysteries.** It's a *hidden* folder inside your home folder, and it's where applications stash your personal settings, caches, profiles, and save data. When you ask "where did my app save its config?" or "where are my game saves?" or "this program forgot all my settings after I reinstalled" - the answer is almost always somewhere in `AppData`. It has three sub-folders, and the difference is worth knowing:

```text
   C:\Users\you\AppData\
   ├── Local\      ← machine-specific data. Big caches, this-PC-only settings. Does NOT roam.
   ├── LocalLow\   ← like Local, but for low-permission apps (e.g. stuff running in a browser sandbox).
   └── Roaming\    ← settings meant to follow you between PCs on a corporate network. Smaller, portable.
```

The split exists for a real reason: in a company, your `Roaming` profile can follow you when you log into a different computer, while `Local` (full of huge caches) stays put. On a home PC you'll mostly care about `Local` and `Roaming` being the two places apps hide things.

**A real example.** You can jump straight there. In File Explorer's address bar, or anywhere a path is accepted, type `%AppData%`:

```console
C:\Users\you> echo %AppData%
C:\Users\you\AppData\Roaming
```
*What just happened:* `%AppData%` is an **environment variable** - a named shortcut Windows expands into a real path. It points at your `Roaming` folder. (There's a matching `%LocalAppData%` for the `Local` one.) This is why guides say "go to `%AppData%\SomeApp`" instead of spelling out `C:\Users\yourname\AppData\Roaming\SomeApp` - the variable works no matter what your username is.

⚠️ **Gotcha: AppData is hidden by default.** If you go looking in File Explorer and can't find `AppData`, it's not missing - it's a hidden folder. Turn on **View → Show → Hidden items**, or just paste `%AppData%` into the address bar and skip the hunt.

🪖 **War story.** A teammate spent an afternoon convinced an app had "deleted all his work" after an update. The work was fine - it was sitting in `%LocalAppData%\TheApp\`, exactly where the app had always saved it. He'd just never seen `AppData` because it's hidden, so as far as he knew it didn't exist. Five minutes of knowing this folder existed would have saved his whole afternoon.

## Processes and permissions: what "Run as administrator" really does

You met user space and kernel space in the OS guide: untrusted programs run in user space and must ask the trusted kernel for anything powerful. Windows adds one more layer *within* user space, and it's the thing behind every "Do you want to allow this app to make changes?" box.

**What it actually is.** Even when you're logged in as an administrator, your normal programs run with **limited** privileges - as if you were a standard user. This is on purpose. It means a random program (or some malware you clicked) can't quietly change system files just because *you* happen to be an admin. When a program genuinely needs elevated power - installing software into `Program Files`, editing `Windows\`, changing system settings - it has to *ask*, and you have to approve. That approval prompt is **UAC**.

📝 **Terminology.** *UAC* (User Account Control) = the Windows feature that keeps programs running with limited privileges and pops up a consent prompt when one needs to do something powerful. *Elevation* = the act of granting a program those higher privileges for the task.

```text
   Standard rights (default)            Elevated rights ("as administrator")
   ─────────────────────────            ────────────────────────────────────
   • read most files                    • write into Program Files\ and Windows\
   • write inside your own Users\ folder • install / uninstall software
   • run normal apps                    • change system-wide settings
   • CANNOT touch system folders         • edit other users' data
        │                                       ▲
        └────────── UAC prompt: "Allow changes?" ┘
                    you click Yes → the program is elevated for that task
```

**What it does in real life.** When you right-click a program and choose **Run as administrator**, you're telling Windows: launch this with elevated rights. Windows checks with you via the UAC prompt (the screen darkens to a "secure desktop" so a sneaky program can't fake your click), and if you approve, that program now runs on the powerful side of the line.

**Why this saves you later.** Half of all "it won't let me save here" and "the installer failed" problems are this, and now you'll recognize them instantly. Trying to save a file into `C:\Program Files\...` and getting "Access denied"? That folder needs elevation, and your editor isn't elevated. A command in a normal terminal fails with a permissions error but works after you reopen the terminal as administrator? Same line, same lesson. You're not fighting a random glitch - you're on the wrong side of the privilege boundary.

⚠️ **Gotcha: don't run everything as administrator "to be safe."** It's the opposite of safe. UAC's whole value is that your everyday programs *can't* wreck the system even if they misbehave. Run a thing elevated and you hand it the keys. Elevate only when a task genuinely needs it.

## How Windows really differs from Unix

You'll hear "Windows is different from Mac/Linux." Here's the honest, concrete version of *how* - the differences that actually bite you, not vibes:

| | Windows | Unix (macOS / Linux) |
|---|---|---|
| Path separator | backslash `\` - `C:\Users\you` | forward slash `/` - `/home/you` |
| Where disks live | drive letters, each its own tree (`C:`, `D:`) | one tree from `/`; extra disks *mounted* in |
| Runnable programs | a file ending in `.exe` (the extension marks it executable) | any file with the "executable" permission bit set |
| File-type meaning | decided by the **extension** (`.txt`, `.exe`, `.jpg`) | extension is a hint; the permission bit decides "can run" |
| Where settings live | the **registry** (a central database) + some files | plain-text config files (often in `/etc` and your home folder) |
| Case sensitivity | `File.txt` and `file.txt` are the **same** file | usually **different** files |

Two of these deserve a sentence more, because they're the ones that surprise people:

- **`.exe` and extensions.** On Windows, the file extension isn't just a label - it's how the OS decides what a file *is* and how to open it. Double-click `report.txt` and you get Notepad; rename it `report.exe` and Windows will try to *run* it. That's why hiding extensions is a security risk (a file named `invoice.pdf.exe` looks like a PDF when extensions are hidden) and why Windows asks "are you sure?" when you change one.

- **The registry instead of config files.** This is the deepest cultural difference, and it gets its own section in [Phase 2](02-services-task-manager-registry.md). The short version: where a Unix program drops a text file to remember its settings, a Windows program often writes them into one giant, central settings database called the **registry**. It's powerful and fast, and it's also why "just edit the config file" isn't always how you fix things on Windows.

💡 **Key point.** None of these differences make Windows "weird" - they're just different design choices for the same problems. Drive letters vs. one root. Extension vs. permission bit. Central database vs. scattered text files. Once you can name the choice, the difference stops being friction and starts being something you can reason about.

## Recap

1. Windows runs on the **NT kernel** - the trusted core. The desktop, File Explorer, and your apps all run *on top of it* in user space.
2. **Drive letters** (`C:`, `D:`) each name a *volume*, not a physical disk; Unix instead hangs everything off one root `/`.
3. Apps live in **`Program Files`** (and `Program Files (x86)` for old 32-bit ones); *your* settings and data hide in **`AppData`** - a hidden folder with `Local`, `LocalLow`, and `Roaming` inside.
4. **UAC / "Run as administrator"** is your programs asking to cross from limited to elevated privileges - the source of most "access denied" mysteries.
5. Windows differs from Unix in real, nameable ways: **`\` vs `/`**, **drive letters vs one root**, **`.exe`/extensions vs the permission bit**, and **the registry vs config files**.

Next, we'll watch the parts that run without you ever opening them - services - and meet the registry up close.

---

[← Guide overview](_guide.md) · [Phase 2: Services, Task Manager & the Registry →](02-services-task-manager-registry.md)
