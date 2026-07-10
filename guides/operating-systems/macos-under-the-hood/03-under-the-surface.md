---
title: "Under the Surface"
guide: "macos-under-the-hood"
phase: 3
summary: "The Terminal runs zsh, macOS's default shell; launchd is the service manager that starts and supervises everything (macOS's answer to Linux's systemd); and Gatekeeper, SIP, and permission prompts are the security layers a power user meets - plus where macOS really differs from Linux."
tags: [macos, terminal, zsh, launchd, gatekeeper, sip, security, linux]
difficulty: intermediate
synonyms: ["what shell does macos use", "what is zsh", "what is launchd", "launchd vs systemd", "what is gatekeeper", "what is sip macos", "system integrity protection", "macos permission prompts", "macos vs linux differences"]
updated: 2026-07-10
---

# Under the Surface

You've got the foundation (macOS is Unix) and the layout (apps are folders, settings live in Library). This
last phase is about the parts you *operate* - the Terminal you type into, the invisible manager that keeps
services running, and the security walls that occasionally stop you with a prompt or a flat "Operation not
permitted." None of these are obstacles once you know what they're doing and why.

## The Terminal and zsh

**What it actually is.** The **Terminal** is just a window. The thing that actually reads your commands,
runs them, and prints results is a program running *inside* that window called the **shell**. On a modern
Mac the default shell is **zsh** (the Z shell). It's the interpreter; Terminal is its screen.

📝 **Terminology.** *Shell* = the program that turns the text you type into actions (running programs,
moving through folders, chaining commands). *zsh* is the shell Apple ships as the default. (Older Macs
defaulted to **bash**; Apple switched the default to zsh, though bash is still present.)

You can ask the system which shell is yours:

```console
$ echo $SHELL
/bin/zsh
$ zsh --version
zsh 5.9 (arm64-apple-darwin24.0)
```
*What just happened:* `$SHELL` is the environment variable holding the path to your login shell - here
`/bin/zsh`, confirming zsh is the default. The version line even says `darwin24.0`: a quiet reminder that
under this familiar shell sits **Darwin**, the Unix core from Phase 1.

⚠️ **Gotcha: your startup file is `.zshrc`, not `.bashrc`.** Coming from Linux (or old Macs), muscle memory
says edit `~/.bashrc` to set up your shell. On a default Mac that file is ignored - zsh reads **`~/.zshrc`**.
Put your aliases, your `PATH` additions (including the Homebrew line from Phase 2), and your prompt tweaks
there. Editing the wrong file and wondering why nothing takes effect is a classic first-week-on-a-Mac
afternoon lost.

> ⏭️ If shells, `PATH`, aliases, and startup files are new, [The Terminal & Shell](/guides/the-terminal-and-shell)
> is the dedicated guide - this section just names the macOS specifics (zsh, `~/.zshrc`).

## `launchd`: the manager that starts everything

Back in [What an Operating System Is](/guides/what-an-operating-system-is) you saw that after the kernel
boots, it starts **one first process** whose job is to start everything else. On macOS, that first
process - and the manager that keeps services running for the rest of the time the Mac is on - is
**`launchd`**.

**What it actually is.** `launchd` is macOS's **service manager**. It's the very first process the kernel
launches (process ID 1), and it's responsible for starting, stopping, and supervising background services -
Spotlight indexing, Time Machine, networking helpers, and any background agents apps install. If a service
it's watching dies, `launchd` can bring it back.

**The Linux bridge.** If you know Linux, you know **systemd** - the thing you poke with
`systemctl start ...`. `launchd` is **macOS's counterpart to systemd**: same role, different tool. They
are *not* the same software and the commands differ, but the *concept* maps cleanly:

| | macOS | Linux (systemd) |
|---|---|---|
| Service manager | `launchd` | `systemd` |
| First process (PID 1) | `launchd` | `systemd` |
| Command-line control | `launchctl` | `systemctl` |
| A service is defined by | a `.plist` file | a `.service` unit file |

📝 **Terminology.** *Service* (also *daemon*, or on macOS an *agent*) = a program that runs in the
background without a window, doing ongoing work - indexing, syncing, listening on the network. *`launchctl`*
is the command-line tool for talking to `launchd`.

You can watch `launchd` reporting on the services it manages:

```console
$ launchctl list | head -n 5
PID     Status  Label
1234    0       com.apple.Spotlight
-       0       com.apple.Safari.SafeBrowsing.Service
891     0       com.apple.Dock.agent
```
*What just happened:* `launchctl list` asked `launchd` for the jobs it's overseeing. Each row is a managed
service: a `PID` if it's currently running (or `-` if loaded but idle), a status code (`0` means it exited
cleanly last time), and a reverse-DNS **Label** - the same `com.company.thing` naming convention from
preference files in Phase 2.

**Why this saves you later.** When something background-y misbehaves - a sync agent stuck, a helper eating
CPU - you now know there's a single manager responsible for it, with a tool (`launchctl`) to inspect and
control it, and that it's the *same idea* as `systemctl` if you've used Linux.

## The security walls a power user meets

macOS is locked down by default, and as a power user you'll bump into three protections. Each one looks like
it's "in your way" until you understand it's protecting you. Here's the cheat-card; explanations follow.

| You see this | What's doing it | Calm response |
|---|---|---|
| *"App can't be opened - unidentified developer"* | **Gatekeeper** | Verify the source, then allow it in **System Settings → Privacy & Security**. |
| *"Operation not permitted"* editing a `/System` file | **SIP** | That file is protected on purpose; you almost never should edit it. Find the right, unprotected place instead. |
| *"App wants to access your Camera / Files / Desktop"* | **TCC permission prompts** | Grant or deny per app in **System Settings → Privacy & Security**. |

### Gatekeeper - checking apps before they run

**What it actually is.** **Gatekeeper** checks an app's signature and origin the first time you open it, to
make sure it's from an identified developer and hasn't been tampered with. (This is what the
`_CodeSignature` folder inside every `.app` from Phase 2 is *for*.) If an app fails the check - often
because it's from an unidentified developer - Gatekeeper refuses to open it and shows a warning.

⚠️ **Gotcha:** the right move is *not* to reflexively disable security. When you trust the source, open
**System Settings → Privacy & Security**, where macOS shows an **"Open Anyway"** button for the just-blocked
app - that allows that one app without lowering the wall for everything else.

### SIP - System Integrity Protection

**What it actually is.** **SIP** (System Integrity Protection) is a kernel-enforced wall that stops *even
the administrator* from modifying protected system locations like `/System`. This is why, in Phase 1,
`/System` was "read-only" - SIP is the reason. It exists so that malware (or a careless command) can't
corrupt the core OS, even with admin rights.

📝 **Terminology.** *SIP* = a protection that puts critical system files and processes off-limits to
modification, enforced by the kernel itself rather than ordinary file permissions. It's why `sudo` sometimes
*still* says "Operation not permitted."

🪖 **War story.** A Linux admin who tries to drop a file into a `/System` path the way they would on a
server, hitting `sudo` first, still gets `Operation not permitted` - and assumes the Mac is broken. It
isn't; that's SIP doing exactly its job. "Permission denied even with `sudo`" on a Mac usually isn't a
permissions bug - it's SIP telling you the thing you're editing is protected on purpose. The fix is almost
never "turn SIP off"; it's "put this where it belongs" (your `~/Library`, `/opt/homebrew`, `/usr/local`).

### Permission prompts - apps asking for access

**What it actually is.** The "*[App] would like to access your Camera / Microphone / Photos / Desktop
folder*" prompts come from a system that requires apps to get your explicit consent before touching
sensitive things. (Apple's internal name for it is **TCC** - Transparency, Consent, and Control.) Every
grant is recorded, and you can review and revoke them all in **System Settings → Privacy & Security**.

**Why this saves you later.** All three walls share one logic: *the system, not just file permissions,
decides what's allowed* - Gatekeeper for app origin, SIP for system files, TCC for sensitive data. When one
stops you, you'll know which one it is and the calm, correct response.

## Where macOS really differs from Linux

You've seen how alike they are - same Unix shape, same shell feel, same service-manager concept. To close,
here's an honest list of where the Mac genuinely goes its own way, so the similarities don't lull you into
wrong assumptions:

| | macOS | Linux |
|---|---|---|
| Kernel | XNU (Mach + BSD) | Linux |
| Default shell | zsh | usually bash (varies by distro) |
| Service manager | `launchd` (`launchctl`) | commonly `systemd` (`systemctl`) |
| Package manager | Homebrew (not built in) | built in: `apt`, `dnf`, `pacman`, … |
| An app is | a `.app` **bundle** (a folder) | usually files spread across `/usr/bin`, `/etc`, … |
| Your home | `/Users/you` | `/home/you` |
| Settings format | `.plist` files | mostly plain-text config in `/etc` and dotfiles |
| Command flavor | BSD-style (e.g. BSD `ls`, `sed`) | GNU-style (GNU `ls`, `sed`) - flags can differ |

💡 **Key point.** macOS and Linux are close enough that your Unix instincts transfer, and different enough
that the details will occasionally bite. Reach for what's the same (the shell, the filesystem shape, the
service-manager concept), and stay alert where the Mac diverges (XNU, `.app` bundles, `.plist`, Homebrew,
SIP). The instincts carry; verify the specifics.

## You can see the machine now

The Mac isn't a sealed appliance anymore. Under the Dock and the wallpaper is **Darwin**, a real Unix
system: a kernel (XNU) managing the hardware, a familiar shell (zsh) over a familiar filesystem, apps that
are really folders, settings tucked in `~/Library`, services supervised by `launchd`, and security walls
(Gatekeeper, SIP, TCC) standing guard for good reasons. You can open the Terminal and recognize every layer
- a Mac you can *reason* about.

## Recap

1. The **Terminal** is a window; **zsh** is the default **shell** inside it. Your startup file is
   **`~/.zshrc`** (not `~/.bashrc`).
2. **`launchd`** is macOS's **service manager** and first process - the counterpart to Linux's
   **systemd**; control it with **`launchctl`**, services are defined by `.plist` files.
3. Three security walls: **Gatekeeper** (checks apps before they run), **SIP** (protects `/System` from
   everyone, even admin), and **permission prompts / TCC** (apps ask before touching sensitive data).
   Each has a calm, correct response.
4. macOS and Linux are **Unix siblings**: alike in shell, filesystem shape, and service concept;
   genuinely different in kernel, packaging, app format, and config style.

> ⏭️ **Where next.** Go deeper into the parts this guide named: [The Terminal & Shell](/guides/the-terminal-and-shell),
> [The Filesystem Explained](/guides/the-filesystem-explained), and the foundation,
> [What an Operating System Is](/guides/what-an-operating-system-is). Curious how the *other* side does it?
> [Windows for Power Users](/guides/windows-for-power-users) is the companion tour.

---

[← Phase 2: Apps, Bundles & Where Things Live](02-apps-bundles-and-where-things-live.md) · [Guide overview](_guide.md)
