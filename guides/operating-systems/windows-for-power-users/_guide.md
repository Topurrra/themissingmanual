---
title: "Windows for People Who Use It Every Day"
guide: "windows-for-power-users"
phase: 0
summary: "What's actually underneath Windows - the NT kernel, drive letters and the real folder layout, services and the registry, and PowerShell - explained for someone who's used Windows for years but was never shown the manual."
tags: [windows, operating-systems, ntfs, registry, services, powershell, task-manager]
category: operating-systems
order: 6
difficulty: intermediate
synonyms: ["how does windows work", "what is the windows registry", "what is a windows service", "what is appdata", "windows powershell for beginners", "what is the nt kernel", "windows vs linux file system", "run as administrator explained"]
updated: 2026-06-19
---

# Windows for People Who Use It Every Day

You've used Windows for years. You install programs, you double-click icons, you've clicked "Yes" on a hundred of those darkening "Do you want to allow this app to make changes?" boxes without ever knowing what they were really asking. Nothing here is *hard* - you already know how to drive the car. This guide opens the hood and shows you the engine, so the next time something is weird, slow, or scary, you know where to look and why.

We're not going to cover clicking around the desktop - you've got that. We're going to cover the parts nobody ever explained: what `C:\` really is and why your settings hide in a folder called `AppData`, what "Run as administrator" is actually doing, what all those background processes in Task Manager are, what the registry is (and why people whisper about it), and PowerShell - the modern shell that's genuinely worth learning.

> ⏭️ **New to operating systems in general?** Read [What an Operating System Is](/guides/what-an-operating-system-is) first - it builds the kernel / user-space / process model that this whole guide leans on. We'll reference it but not re-teach it.

## How to read this

- **Want a specific answer?** Jump straight to the phase: drive letters and folders are in [Phase 1](01-windows-under-the-hood.md), the registry is in [Phase 2](02-services-task-manager-registry.md), PowerShell is in [Phase 3](03-powershell-basics.md).
- **Want it to finally make sense?** Read in order. Each phase assumes the mental model from the one before - by the end you'll be able to *reason* about Windows instead of memorizing where buttons are.

## The phases

1. **[Windows Under the Hood](01-windows-under-the-hood.md)** - the NT kernel, drive letters and the real folder layout (including `AppData`, the one everyone trips over), how "Run as administrator" maps to the OS permission model, and the plain list of ways Windows differs from Unix.
2. **[Services, Task Manager & the Registry](02-services-task-manager-registry.md)** - what services are and how they differ from apps, Task Manager in depth (Startup, Details, killing a process), and the registry explained for real - what it is, how it's organized, and ⚠️ how to touch it without breaking anything.
3. **[PowerShell Basics](03-powershell-basics.md)** - the big idea (commands pass *objects*, not text), the verb-noun cmdlet naming, piping objects, running a script, and the ⚠️ execution-policy gotcha that stops every beginner's first script.

> Deliberately deferred to follow-up guides: deep NTFS internals and permissions/ACLs, the Windows Subsystem for Linux (WSL), Group Policy, and PowerShell scripting beyond the basics. This guide is about *understanding the machine you use daily* - not turning you into a Windows sysadmin in one sitting.
