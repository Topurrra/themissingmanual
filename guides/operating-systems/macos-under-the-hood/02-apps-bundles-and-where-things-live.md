---
title: "Apps, Bundles & Where Things Live"
guide: "macos-under-the-hood"
phase: 2
summary: "A .app is actually a folder (a bundle), not a single file; macOS has several Library folders (system, /Library, and ~/Library) holding preferences as plist files, caches, and application support; and Homebrew is how you install real CLI tools."
tags: [macos, app-bundle, library, plist, preferences, homebrew, application-support]
difficulty: intermediate
synonyms: ["what is a .app file", "is a mac app a folder", "show package contents", "what is in the library folder mac", "where are mac app preferences", "what is a plist", "how to install homebrew", "where does homebrew install"]
updated: 2026-07-10
---

# Apps, Bundles & Where Things Live

On Windows a program is a `.exe` file. So when you drag a Mac app to the trash and it just… vanishes
cleanly, with no installer and no uninstaller, it can feel like magic. It isn't. The Mac's approach to
"where an app and its stuff live" is unusually tidy, but it only makes sense once you know two secrets: **an
app is really a folder**, and **your settings live in a place called Library** - three of them, actually.

## A `.app` is a folder, not a file

**What it actually is.** That `Safari.app` or `VLC.app` you double-click is not a single file. It's a
**folder** - a special kind macOS calls a **bundle** - with a strict layout inside, holding the program, its
icons, images, and everything else it needs. Finder *pretends* it's one icon so you can move it around as a
single thing, but on disk it's a directory full of parts.

📝 **Terminology.** *Bundle* = a folder that macOS treats as a single object in the Finder. App bundles
end in `.app`; there are other bundle types too (`.framework`, `.bundle`). The "it's one icon but really
a folder" trick is the whole idea.

**Prove it to yourself - the Finder way.** Right-click any app and choose **Show Package Contents**.
Finder opens it like the folder it is. But the Terminal makes the truth even plainer:

```console
$ cd /Applications
$ ls -d Calculator.app
Calculator.app
$ ls Calculator.app/Contents
Info.plist      MacOS           PkgInfo         Resources       _CodeSignature
```
*What just happened:* `Calculator.app` looked like a file in Finder, but `ls` walked right into it - it's a
folder. Inside is a `Contents` directory with a predictable structure. The important parts:

- `MacOS/` - the **actual executable**, the real program that runs.
- `Resources/` - icons, images, sounds, translated text: the app's assets.
- `Info.plist` - a settings file describing the app (its name, version, what it needs). We'll meet
  `.plist` files again in a moment.
- `_CodeSignature/` - Apple's cryptographic signature proving the app hasn't been tampered with (Phase 3
  covers why that matters).

💡 **Key point.** Because an app is a self-contained folder carrying everything it needs, **installing is
just copying the folder into `/Applications`, and uninstalling is just dragging it to the trash** - no
installer wizard, no registry, no leftover system files for the app itself. (Its *preferences* live
elsewhere - coming up next - which is why a stray settings file can linger after you trash an app.)

## The Library folders: where your settings actually live

If the app is a tidy self-contained folder, where do your preferences, caches, and saved data go? Not inside
the app - that would get wiped on every update. They go into **Library**, and here's the part that trips
everyone up: **there are several Library folders, at different levels.**

```text
   /System/Library     ← Apple's own. Hands off. Protected by the OS (see Phase 3).
   /Library            ← Shared by ALL users of this Mac. Needs admin to change.
   ~/Library           ← YOURS. Your account's settings, caches, app data. Hidden by default.
```

**What each is for, in plain terms:**

| Folder | Whose | What's in it |
|---|---|---|
| `/System/Library` | Apple's | Core OS components. You don't touch this; the OS won't let you. |
| `/Library` | The whole machine | App support and preferences shared by every user; system-wide fonts. |
| `~/Library` | Just you | **Your** per-app settings, caches, and saved data. This is the one you'll actually visit. |

⚠️ **Gotcha: `~/Library` is hidden on purpose.** Apple hides your personal Library so you don't wander in
and break things - it won't show in a normal Finder window. To reveal it: in Finder press **Shift + Cmd + G**
and type `~/Library`, or hold **Option** while clicking Finder's **Go** menu. From the Terminal it was never
hidden at all:

```console
$ ls ~/Library
Application Support   Caches               Logs                 Saved Application State
Application Scripts   Containers           Mobile Documents     Preferences
Autosave Information  Fonts                Preferences          ...
```
*What just happened:* You listed your personal Library - the real home of your settings. The three
folders worth knowing by name:

- **`Preferences/`** - your app settings, one file per app, stored as `.plist` files.
- **`Application Support/`** - an app's larger saved data (databases, profiles, plugins) - anything
  bigger than a few preferences.
- **`Caches/`** - disposable temporary data an app keeps to be faster. Safe to lose; the app rebuilds it.

📝 **Terminology.** *plist* (property list) = macOS's standard settings-file format, ending in `.plist`.
It's a structured key/value file (often XML or a compact binary form) storing one app's preferences.
When you change a setting in an app's Preferences window, you're usually editing its `.plist`.

Take a peek at one:

```console
$ cd ~/Library/Preferences
$ ls | grep -i finder
com.apple.finder.plist
```
*What just happened:* that's the Finder's own settings file. Notice the naming convention: **reverse-DNS**,
like `com.apple.finder` - vendor's domain backwards, then the app name. Every Mac app's preferences follow
this `com.company.app.plist` pattern, so you can find any app's settings file by guessing its name.

🪖 **War story.** An app that keeps launching with a corrupted, broken window every time it opens, where
reinstalling changes nothing, usually has the problem in its **preferences**, not its code - reinstalling
only replaces the app folder. Deleting that one `com.vendor.app.plist` from `~/Library/Preferences` (the app
rewrites a fresh one on next launch) fixes in seconds what an hour of reinstalling couldn't.

**Why this saves you later.** "I trashed the app but its settings came back" and "the app is broken even
after reinstalling" are the *same* lesson from two directions: the app folder and the app's Library data are
separate.

## Installing real CLI tools with Homebrew

macOS ships with a Unix userland (Phase 1), but Apple keeps it conservative and doesn't include everything a
developer wants - and there's no built-in package manager like Linux's `apt` or `dnf` for adding more. The
community filled that gap with **Homebrew**, the standard way Mac developers install command-line software.

📝 **Terminology.** *Package manager* = a tool that installs, updates, and removes software for you,
handling dependencies (the other software a program needs). *Homebrew* (`brew`) is the de facto package
manager for macOS.

Installing a tool looks like this:

```console
$ brew install wget
==> Fetching dependencies for wget: openssl@3
==> Fetching wget
==> Pouring wget--1.25.0.arm64_sequoia.bottle.tar.gz
🍺  /opt/homebrew/Cellar/wget/1.25.0: 92 files, 4.5MB
==> Running `brew cleanup wget`...
```
*What just happened:* `brew` downloaded `wget` (and the dependency it needs, `openssl@3`), unpacked the
prebuilt copy - Homebrew calls a prebuilt binary a **bottle** - into its own storage, and made it available
to run. You didn't compile anything or hunt for an installer; one command did it.

Notice the install path: `/opt/homebrew`. That ties straight back to Phase 1's filesystem map:

```text
   Apple silicon (M1/M2/M3/M4…)  →  Homebrew installs under  /opt/homebrew
   Intel Macs (older)            →  Homebrew installs under  /usr/local
```

⚠️ **Gotcha: Homebrew keeps its world separate from Apple's.** It installs into its own prefix
(`/opt/homebrew` or `/usr/local`) rather than mixing into Apple's `/usr/bin`. That's deliberate and good -
Apple can update the system without clobbering your tools, and you can remove Homebrew cleanly. But it means
your shell has to know to look there. On a fresh Apple-silicon Mac, after installing Homebrew you have to
add it to your `PATH` (the list of folders your shell searches for commands) - the installer prints the
exact lines to paste, and if you skip that step, `brew` "isn't found" even though it's installed. See
[The Terminal & Shell](/guides/the-terminal-and-shell) if `PATH` is unfamiliar.

**Why this saves you later.** When a tutorial says "just run `brew install ...`" and your Mac says
`command not found`, you won't be stuck - you'll know Homebrew lives in its own prefix and exactly where to
look.

## Recap

1. A **`.app` is a folder** (a *bundle*), not a single file - `Show Package Contents` (or `cd` into it)
   reveals the executable, resources, and `Info.plist` inside.
2. Because the app is self-contained, **installing = copy to `/Applications`, uninstalling = drag to
   trash** - but its settings live elsewhere.
3. There are **several Library folders**: `/System/Library` (Apple's, off-limits), `/Library`
   (machine-wide), and **`~/Library`** (yours - and hidden by default).
4. Inside `~/Library`: **`Preferences/`** (per-app `.plist` settings, named `com.company.app.plist`),
   **`Application Support/`** (bigger app data), and **`Caches/`** (disposable).
5. **Homebrew** is the package manager for real CLI tools - it installs into its own prefix
   (`/opt/homebrew` on Apple silicon, `/usr/local` on Intel), kept separate from Apple's `/usr`.

Next, the surface you already touch every day - the Terminal and zsh - plus the service manager that
keeps the Mac running and the security walls a power user runs into.

---

[← Phase 1: macOS Is Unix](01-macos-is-unix.md) · [Phase 3: Under the Surface →](03-under-the-surface.md)
