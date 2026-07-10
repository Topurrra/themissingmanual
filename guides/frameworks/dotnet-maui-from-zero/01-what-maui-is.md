---
title: "What MAUI Is & Your First App"
guide: "dotnet-maui-from-zero"
phase: 1
summary: "MAUI builds native Android, iOS, macOS, and Windows apps from one C# codebase. Meet the XAML + code-behind shape, the MVVM mental model, and scaffold and run your first app."
tags: [dotnet-maui, csharp, xaml, cross-platform, getting-started]
difficulty: beginner
synonyms: ["what is dotnet maui", "maui first app", "maui xaml code-behind", "maui vs xamarin", "maui cross platform", "net maui hello world"]
updated: 2026-07-10
---

# What MAUI Is & Your First App

You know [C#](/guides/csharp-from-zero). You've written classes, awaited tasks, raised events.
But shipping a real mobile app used to mean Swift for iOS, Kotlin for Android, and yet another
stack for Windows — three languages and toolchains for what is, to the user, one app.

**.NET MAUI tears that wall down.** MAUI (Multi-platform App UI) lets you build **native apps for
Android, iOS, macOS, and Windows from a single C# codebase**. It's the evolution of Xamarin.Forms,
rebuilt on modern .NET. You describe the UI and write the logic once, and MAUI renders it using
each platform's *real, native* controls — a MAUI button is a genuine Android button on Android and
a genuine UIKit button on iOS, not a lookalike.

If you already write C#, MAUI is your route into mobile and desktop without picking up Swift and
Kotlin. It's a [framework](/guides/what-a-framework-even-is) — it calls *your* code at the right
moments (when a screen appears, when a button is tapped).

📝 If you've seen [Blazor](/guides/blazor-from-zero), MAUI's C# sibling for the web, the resemblance
is real: both lean on a component/MVVM mindset where state drives the UI. The difference is what
they render — Blazor produces **HTML** in a browser; MAUI produces **native controls** on a device.

## The one mental model to hold

Hold these three pieces and how they connect — everything in this guide hangs off them.

💡 **XAML describes the UI. A ViewModel holds the state and behavior. Data binding wires them
together.** That triangle is the **MVVM pattern** (Model-View-ViewModel):

- The **View** is your screen — a tree of controls, usually written in **XAML**, a declarative markup
  that says *what* the UI looks like without spelling out *how* to draw it.
- The **ViewModel** is a plain C# class holding the screen's data (the text in a box, the items in a
  list) and the things it can do (save, delete).
- **Data binding** is the wire between them: the View says "show whatever's in the ViewModel's `Title`
  property," and when that property changes, the displayed text updates automatically.

You don't need to *build* a ViewModel yet — that's Phases 3 and 4. For now, hold the shape:
**markup for the look, a C# class for the state, binding to connect them.** This phase uses the
simplest version, with logic right next to its markup in a **code-behind** file.

## The minimal page

A MAUI screen is a `ContentPage`. Here's one in XAML — a greeting and a button:

```xml
<ContentPage xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
             xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
             x:Class="NotesApp.MainPage">
    <VerticalStackLayout Padding="20" Spacing="10">
        <Label Text="Hello, MAUI" FontSize="24" />
        <Button Text="Tap me" Clicked="OnTap" />
    </VerticalStackLayout>
</ContentPage>
```

*What just happened:* this is the **View** — pure markup, no logic. Read it top to bottom:

- `<ContentPage>` is the root: one full screen. The two `xmlns=` lines are namespace declarations —
  boilerplate telling the XAML parser which vocabulary of controls (`Label`, `Button`, layouts) is in
  play. Copy them and forget them.
- `x:Class="NotesApp.MainPage"` is the important link: it ties this markup to a C# class named
  `MainPage`. The XAML and the code-behind are **two halves of one page**.
- `<VerticalStackLayout>` is a layout container — it stacks its children top to bottom, with `Padding`
  (space inside the edges) and `Spacing` (gaps between children). More on layouts in
  [Phase 2](02-xaml-and-layouts.md).
- `<Label>` shows text; `<Button>` is tappable. `Clicked="OnTap"` says "when this button is tapped,
  call the `OnTap` method" — living in the other half of the page.

Here's that other half — the **code-behind**, a file named `MainPage.xaml.cs`:

```csharp
public partial class MainPage : ContentPage
{
    public MainPage() => InitializeComponent();

    private void OnTap(object sender, EventArgs e) =>
        DisplayAlert("Hi", "You tapped", "OK");
}
```

*What just happened:* this is plain C#, the partner to the XAML above.

- `partial class MainPage` — `partial` means "this class is defined in more than one file." The other
  part is **generated from your XAML** at build time, fusing markup and code into a single class.
- `InitializeComponent()` reads your XAML and builds the control tree — the layout, the label, the
  button. Without it, the page would be blank.
- `OnTap` is the event handler the XAML pointed at. Its signature — `(object sender, EventArgs e)` — is
  the standard .NET event shape you already know. When the user taps, MAUI calls it, and `DisplayAlert`
  pops a native dialog with a title, a message, and an OK button.

💡 This small example is the View (XAML) and its immediate logic (code-behind) for one screen. As the
app grows, you'll lift that logic out into a ViewModel so it's testable and reusable — the mental
shape never changes.

## Create and run your first app

Let's get one running. The .NET SDK ships a MAUI template:

```bash
dotnet new maui -o NotesApp
cd NotesApp
```

*What just happened:* `dotnet new maui` scaffolded a complete cross-platform app named `NotesApp` — the
project file, a starter `MainPage.xaml` + `MainPage.xaml.cs` (like the pair above), app startup code,
and the per-platform plumbing for all four targets — one folder, every platform.

Now run it. Unlike a web app, you don't `dotnet run` into a browser — you build *for a specific
device target* and launch it there:

```bash
dotnet build -t:Run -f net8.0-android
```

*What just happened:* `-t:Run` says "build, then launch," and `-f net8.0-android` picks the **target
framework** — here, Android (it starts an emulator or uses a connected device). Swap that flag to
choose a different platform:

- `-f net8.0-windows` — runs as a native Windows app
- `-f net8.0-ios` — runs on the iOS simulator or a device
- `-f net8.0-maccatalyst` — runs as a native macOS app

The C# and XAML you wrote stay the same across all of them; only the target flag changes.

📝 **iOS and macOS builds require a Mac.** Apple's toolchain (and code signing) only runs on macOS, so
building the `ios` or `maccatalyst` targets needs a Mac — either as your dev machine or paired over the
network from Windows. Android and Windows build from a Windows PC directly. An Apple rule, not a MAUI
limitation.

⚠️ The first build is slow — it restores packages, spins up an emulator, and compiles for the whole
platform. That's a one-time cost; later runs are much quicker.

## The running example: a notes app

Snippets are fine for a first look, but you learn a framework by building something. Across this
guide we'll grow one small, real app in your `NotesApp` project: a **cross-platform notes app**.

By the end it will let you:

- see a **list** of your notes,
- tap one to open a **detail/edit** page,
- and **save** or **delete** a note.

It starts in [Phase 2](02-xaml-and-layouts.md) as a single laid-out screen, gains real controls and
binding in Phase 3, gets a proper ViewModel and the MVVM treatment in Phase 4, learns to navigate
between list and detail in Phase 5, and persists your notes to storage in Phase 6. Build along and
you'll finish with a working app that runs natively on a phone, a Mac, and a Windows desktop — not
just a pile of code you read once.

## Recap

1. **MAUI builds native Android, iOS, macOS, and Windows apps from one C# codebase** — it's the
   evolution of Xamarin.Forms on modern .NET, and it renders each platform's *real* native controls.
2. **For C# developers, MAUI is the route into mobile and desktop** without learning Swift or Kotlin.
   It's the native-app sibling of [Blazor](/guides/blazor-from-zero), which targets the web (HTML)
   instead.
3. **The mental model is MVVM:** XAML describes the UI (the View), a ViewModel holds state and
   behavior, and data binding wires them together. This phase used the simple form, with logic in a
   **code-behind** file.
4. **A screen is a `ContentPage`** — XAML markup plus a `partial` code-behind class joined by
   `x:Class`. `InitializeComponent()` builds the control tree from the XAML; `Clicked="OnTap"` wires a
   tap to a C# handler.
5. **Create with `dotnet new maui`, run with `dotnet build -t:Run -f net8.0-<target>`** (`android`,
   `windows`, `ios`, `maccatalyst`). 📝 iOS and macOS builds need a Mac.
6. **We'll grow one running example** — a cross-platform notes app (list, detail/edit, save/delete) —
   across the whole guide.

## Quick check

Three questions on the ideas that have to stick — what MAUI is, the page's two halves, and how you
run it:

```quiz
[
  {
    "q": "What does .NET MAUI let you build?",
    "choices": [
      "Native apps for Android, iOS, macOS, and Windows from a single C# codebase",
      "Server-rendered web pages written in JavaScript",
      "A single Android-only app that can't target other platforms",
      "Desktop apps for Windows only, written in XAML"
    ],
    "answer": 0,
    "explain": "MAUI (Multi-platform App UI) is the evolution of Xamarin.Forms: one C# codebase that ships native apps to Android, iOS, macOS, and Windows, rendering each platform's real native controls."
  },
  {
    "q": "In a MAUI page, what links the XAML markup to its C# code-behind?",
    "choices": [
      "The x:Class attribute on the ContentPage, paired with a partial class; InitializeComponent() builds the control tree from the XAML",
      "A SignalR connection that streams the UI to the device at runtime",
      "Nothing — XAML and C# are compiled into two completely separate apps",
      "A JavaScript bridge file you have to write by hand"
    ],
    "answer": 0,
    "explain": "x:Class names the partial class the XAML belongs to. The code-behind is the other half of that partial class, and its constructor calls InitializeComponent() to read the XAML and build the page's controls."
  },
  {
    "q": "How do you run a MAUI app on Android, and what's the catch with iOS?",
    "choices": [
      "dotnet build -t:Run -f net8.0-android; building the iOS target requires a Mac",
      "dotnet run --browser; iOS just needs a different browser",
      "There's no CLI — you can only run MAUI apps from Visual Studio on a Mac",
      "dotnet build -f net8.0-android, and iOS builds run fine from Windows alone"
    ],
    "answer": 0,
    "explain": "You build for a specific target with -t:Run and -f net8.0-<target> (android, windows, ios, maccatalyst). Apple's toolchain and code signing only run on macOS, so the ios and maccatalyst targets need a Mac."
  }
]
```

---

[Guide overview](_guide.md) · [Phase 2: XAML & Layouts →](02-xaml-and-layouts.md)
