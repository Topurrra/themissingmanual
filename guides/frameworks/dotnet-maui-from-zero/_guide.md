---
title: ".NET MAUI From Zero"
guide: "dotnet-maui-from-zero"
phase: 0
summary: "Learn Microsoft's cross-platform UI framework: one C# codebase that ships to Android, iOS, macOS, and Windows. XAML and layouts, controls and data binding, the MVVM pattern, navigation with Shell, calling APIs and local storage, and platform features and deployment. Write once, run native, taught mental-model-first."
tags: [dotnet-maui, csharp, xaml, mvvm, mobile, cross-platform, ui]
category: frameworks
order: 32
group: "C#"
difficulty: intermediate
synonyms: ["learn dotnet maui", "maui tutorial", "net maui xaml", "maui mvvm", "maui cross-platform app", "maui vs xamarin", "csharp mobile app", "maui shell navigation"]
updated: 2026-06-23
---

# .NET MAUI From Zero

.NET MAUI (Multi-platform App UI) is how C# developers build native apps for **Android, iOS, macOS, and
Windows from one codebase**. It's the evolution of Xamarin.Forms, rebuilt on .NET: you write your UI and
logic once, and MAUI renders it with each platform's native controls. If you already know C#, MAUI is your
route into mobile and desktop without learning Swift, Kotlin, and a separate Windows stack.

The mental model is two layers tied by a pattern. The **UI** is a tree of controls, usually described in
**XAML** (a declarative markup) with a C# code-behind - a page holds layouts, layouts hold controls. The
**logic** lives in a **ViewModel**, and the two are joined by **data binding** (the MVVM pattern): the View
binds to properties and commands on the ViewModel, so UI and logic stay decoupled and testable. Hold "XAML
describes the UI, a ViewModel holds the state and behavior, and binding wires them together," and MAUI's
moving parts fall into place.

> 📝 This teaches the **framework** - it assumes you know **C#**: classes, properties, events,
> `async`/`await`, and interfaces ([C# From Zero](/guides/csharp-from-zero)). MVVM and binding echo other
> component UIs ([Blazor](/guides/blazor-from-zero) is the web sibling), and it consumes
> [ASP.NET Core](/guides/aspnet-core-from-zero) APIs. MAUI builds native apps, so examples are shown as
> XAML/C# rather than run on the page.

## How to read this

Read in order - it builds one small app (a cross-platform **notes** app: a list, a detail/edit page, save and
delete) from a single page to a navigable, MVVM-structured, API-aware app. Phases carry difficulty badges.

## The phases

**Part 1 - The UI (🟢 Basic → 🟡)**
1. **[What MAUI Is & Your First App](01-what-maui-is.md)** 🟢 - one codebase, native targets, XAML + code-behind, and a running app.
2. **[XAML & Layouts](02-xaml-and-layouts.md)** 🟡 - pages, `StackLayout`/`Grid`, and arranging controls.
3. **[Controls & Data Binding](03-controls-and-data-binding.md)** 🟡 - common controls, `{Binding}`, and `BindingContext`.

**Part 2 - Real structure (🟡 → 🔴)**
4. **[The MVVM Pattern](04-mvvm.md)** 🔴 - ViewModels, `INotifyPropertyChanged`, commands, and the CommunityToolkit.Mvvm.
5. **[Navigation with Shell](05-navigation-with-shell.md)** 🟡 - pages, routes, and moving between screens.
6. **[Data & Calling APIs](06-data-and-apis.md)** 🔴 - `HttpClient`, JSON, and local storage (Preferences/SQLite).

**Part 3 - Ship it (🟡 → 🟢)**
7. **[Platform Features & Deployment](07-platform-features-and-deployment.md)** 🟡 - sensors/permissions, per-platform code, and building for the stores.
8. **[Where to Go Next](08-where-to-go-next.md)** 🟢 - MAUI vs Flutter/React Native, Blazor Hybrid, and what to build.

> The throughline: **XAML describes the UI, a ViewModel holds state and behavior, and data binding wires
> them** - one codebase, native everywhere. Hold that and MAUI is approachable.

---

[Phase 1: What MAUI Is & Your First App →](01-what-maui-is.md)
