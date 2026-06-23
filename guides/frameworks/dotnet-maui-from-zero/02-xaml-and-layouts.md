---
title: "XAML & Layouts"
guide: "dotnet-maui-from-zero"
phase: 2
summary: "How a MAUI page is built: one root layout holding controls, arranged with stack layouts and Grid. XAML markup, key properties, and the notes app's main screen, mental-model first."
tags: [dotnet-maui, csharp, xaml, layouts, grid]
difficulty: intermediate
synonyms: ["maui xaml", "maui layouts", "maui verticalstacklayout grid", "maui contentpage", "xaml controls", "maui ui markup"]
updated: 2026-06-23
---

# XAML & Layouts

Here's the mental model to carry through this whole phase: **a page is one root layout holding controls.** That's it. A screen in MAUI is a `ContentPage`, the `ContentPage` holds exactly one thing — a layout — and the layout's whole job is to arrange the controls you put inside it. Controls are the leaves: labels, buttons, text boxes. Layouts are the branches that decide where those leaves sit.

The markup you write to describe this tree is **XAML** — an XML dialect. And the part that trips people up at first is worth saying out loud now: XAML isn't a separate magic language. Every XAML element is just a C# object. When you write `<Label Text="Hi" />`, MAUI creates a `Label` object and sets its `Text` property to `"Hi"`. The page's `<x:Class>` attribute literally names a C# partial class, and the XAML becomes part of that class at build time. So XAML *describes the UI*, and that description compiles down to the same C# objects you could have written by hand.

> 📝 You *can* build the entire UI in C# instead of XAML — `new ContentPage { Content = new Label { Text = "Hi" } }`. Most MAUI code uses XAML because a declarative tree is easier to read and tweak than nested constructor calls. We'll use XAML throughout, but remember it's objects underneath.

## The page and its one root layout

A bare page looks like this:

```xml
<?xml version="1.0" encoding="utf-8" ?>
<ContentPage xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
             xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
             x:Class="NotesApp.MainPage">

    <Label Text="Hello, notes." />

</ContentPage>
```

*What just happened:* The `xmlns` lines map XML namespaces to MAUI's control library and to XAML's own keywords (that's where `x:Class` comes from). `x:Class="NotesApp.MainPage"` ties this file to the C# partial class `MainPage` in your project. And the `ContentPage` holds a single child — here a lone `Label`. A `ContentPage` has exactly **one** `Content`. To show more than one control, that single child has to be a *layout* that holds the rest.

## The layouts you'll actually use

### Stack layouts — children in a line

`VerticalStackLayout` arranges its children top to bottom; `HorizontalStackLayout` does it left to right. They're the simplest containers and great for short, linear groups.

```xml
<VerticalStackLayout Spacing="12" Padding="20">
    <Label Text="Quick note" FontSize="20" />
    <Entry Placeholder="Type here..." />
    <Button Text="Save" />
</VerticalStackLayout>
```

*What just happened:* Three controls stacked vertically with a 12-unit gap between each (`Spacing`) and 20 units of breathing room around the whole group (`Padding`). `Padding` is space *inside* the container's edge; `Spacing` is the gap *between* children. Note the page now has one root child (the stack), and the stack holds the three controls — the mental model in action.

### Grid — rows and columns, the real workhorse

Stacks are fine for a line of controls, but real screens have structure: a header pinned at the top, a body that fills the rest, a footer that hugs the bottom. That's a `Grid`.

A `Grid` defines `RowDefinitions` and `ColumnDefinitions`, then each child says which cell it lives in with `Grid.Row` and `Grid.Column` (both default to `0`).

```xml
<Grid RowDefinitions="Auto,*,Auto"
      ColumnDefinitions="*"
      Padding="20"
      RowSpacing="12">

    <Label Grid.Row="0"
           Text="My Notes"
           FontSize="28" />

    <Label Grid.Row="1"
           Text="(your notes will appear here)"
           VerticalOptions="Start" />

    <Button Grid.Row="2"
            Text="Add note" />

</Grid>
```

*What just happened:* `RowDefinitions="Auto,*,Auto"` makes three rows. **`Auto`** sizes a row to exactly fit its content — the title and the button take only the height they need. **`*`** means "take all the leftover space" — the middle row stretches to fill whatever's left, which is exactly what you want for a scrolling list of notes. The header sits in row 0, the body in row 1, the button in row 2. This is the notes-list skeleton: header on top, body fills the gap, action button parked at the bottom.

> 💡 The sizing tokens are the whole point of `Grid`. **`Auto`** = size to content. **`*`** = take the remaining space (and `2*` takes twice the share of a plain `*`, so `*,2*` splits leftover space one-third / two-thirds). Because `*` rows and columns flex with the screen, the *same* layout looks right on a narrow phone and a wide desktop — no per-device code.

### ScrollView — when content overflows

A `ContentView` or stack won't scroll on its own; if its content is taller than the screen, the overflow is clipped. Wrap it in a `ScrollView` and it scrolls.

```xml
<ScrollView>
    <VerticalStackLayout Spacing="16" Padding="20">
        <Label Text="A very long note..." />
        <!-- ...many more controls... -->
    </VerticalStackLayout>
</ScrollView>
```

*What just happened:* `ScrollView` takes one child (here the stack) and gives it a scrollable viewport. Anything taller than the screen now scrolls instead of getting cut off. (`FlexLayout` and `AbsoluteLayout` also exist for wrap-and-flow and pixel-precise positioning, but you'll reach for them far less often — start with stacks, `Grid`, and `ScrollView`.)

## Common controls and their key properties

Layouts arrange things; **controls** are the things. The handful you'll use constantly:

- **`Label`** — displays text.
- **`Button`** — a tappable button with a `Clicked` event.
- **`Entry`** — single-line text input.
- **`Editor`** — multi-line text input (think note body).
- **`Image`** — shows an image from a `Source`.

Properties are written as XAML attributes. The ones you'll set most often:

```xml
<VerticalStackLayout Spacing="10" Padding="20">

    <Label Text="Note title"
           FontSize="22"
           TextColor="DarkSlateBlue"
           HorizontalOptions="Center" />

    <Entry Placeholder="Title" />

    <Editor Placeholder="Write your note..."
            HeightRequest="120" />

    <Button Text="Save"
            Margin="0,16,0,0"
            HorizontalOptions="End" />

</VerticalStackLayout>
```

*What just happened:* `FontSize` and `TextColor` style the label. `HorizontalOptions` (and its sibling `VerticalOptions`) control how a child sits in the space its parent gives it — the values are `Start`, `Center`, `End`, and `Fill`; here the title is centered and the button is pushed to the right (`End`). `Margin="0,16,0,0"` adds space *outside* the button (left, top, right, bottom order), nudging it down from the editor. `Placeholder` is the grey hint text shown in an empty `Entry`/`Editor`.

> ⚠️ Margin vs. Padding catches everyone once: **Padding** is space *inside* a container, before its children start. **Margin** is space *outside* a control, pushing its neighbors away. Same four-number order — `left,top,right,bottom` — but opposite sides of the control's edge.

## One real warning: don't nest stacks endlessly

When stacks are the only tool you know, it's tempting to build a whole screen by burying stacks inside stacks inside stacks to push things around. Resist it.

⚠️ **Deeply nested stack layouts hurt performance and are miserable to maintain.** Each stack measures and arranges its children, and nesting multiplies that work on every layout pass — on a list that scrolls, it shows up as jank. Worse, six levels deep, *nobody* can tell which container owns which spacing. A `Grid` with a few `RowDefinitions`/`ColumnDefinitions` does the same job flat: one container, every child placed by row and column, far less measuring. **For anything beyond a short line of controls, reach for `Grid` first.**

## Building the notes app's main page

Let's put it together into the real screen for our running **notes** app: a title at the top, a list area in the middle (a placeholder for now — the real list comes in [Phase 3](03-controls-and-data-binding.md)), and an Add button at the bottom.

```xml
<?xml version="1.0" encoding="utf-8" ?>
<ContentPage xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
             xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
             x:Class="NotesApp.MainPage"
             Title="Notes">

    <Grid RowDefinitions="Auto,*,Auto"
          Padding="20"
          RowSpacing="16">

        <!-- Header -->
        <Label Grid.Row="0"
               Text="My Notes"
               FontSize="32"
               FontAttributes="Bold"
               TextColor="DarkSlateBlue" />

        <!-- List area (placeholder until Phase 3) -->
        <Label Grid.Row="1"
               Text="You have no notes yet."
               FontSize="16"
               TextColor="Gray"
               HorizontalOptions="Center"
               VerticalOptions="Start" />

        <!-- Action -->
        <Button Grid.Row="2"
                Text="+ Add note"
                HorizontalOptions="Fill" />

    </Grid>

</ContentPage>
```

*What just happened:* One `ContentPage`, one root `Grid`, three children — exactly the mental model. The `Auto,*,Auto` rows give us a fixed-height header, a flexible body that fills the screen (so when real notes arrive they have room to grow and scroll), and a fixed-height button at the bottom. The body label is just a placeholder; in Phase 3 we swap it for a `CollectionView` bound to actual data. `HorizontalOptions="Fill"` on the button makes it stretch the full width. Run this and you've got the skeleton of the whole app — and you built it with one flat `Grid` instead of a tangle of stacks.

## Recap

- A page is **one root layout holding controls** — `ContentPage` has exactly one `Content`, and to show several controls that one child must be a layout.
- **XAML is C# objects.** Each element constructs an object and each attribute sets a property; `x:Class` ties the file to a C# partial class.
- **Stack layouts** line children up (`Spacing` between, `Padding` around); **`Grid`** places children in rows/columns using `Grid.Row`/`Grid.Column`, with `Auto` = size-to-content and `*` = take remaining space; **`ScrollView`** lets overflow scroll.
- Common controls — `Label`, `Button`, `Entry`, `Editor`, `Image` — are styled with attributes like `FontSize`, `TextColor`, `HorizontalOptions`, `Margin`, and `Padding`.
- Prefer **`Grid` over deeply nested stacks** for any non-trivial screen — it's faster and far more maintainable — and lean on `*` sizing so one layout works across phone, tablet, and desktop.

## Quick check

```quiz
[
  {
    "q": "In a Grid with RowDefinitions=\"Auto,*,Auto\", what does the middle \"*\" row do?",
    "choices": ["Sizes itself to exactly fit its content", "Takes up all the leftover space after the Auto rows", "Is hidden until content is added", "Forces a fixed height of 1 unit"],
    "answer": 1,
    "explain": "\"*\" means take the remaining space. Combined with Auto rows above and below, it gives a flexible body between a fixed header and footer."
  },
  {
    "q": "How many direct children can a ContentPage's Content hold?",
    "choices": ["As many as you like", "Exactly one (usually a layout)", "Up to ten", "Only controls, never layouts"],
    "answer": 1,
    "explain": "A ContentPage holds one Content. To show multiple controls, that single child must be a layout that holds the rest."
  },
  {
    "q": "Why prefer a Grid over deeply nested stack layouts for a non-trivial screen?",
    "choices": ["Grids can't be styled, so they're simpler", "Nested stacks hurt performance and maintainability; a flat Grid does the same job", "Stacks don't work on iOS", "Grids are the only layout that supports Padding"],
    "answer": 1,
    "explain": "Each nested stack adds measure/arrange work and obscures which container owns what. A Grid places everything flat by row and column — faster and clearer."
  }
]
```

---

[← Phase 1: What MAUI Is & Your First App](01-what-maui-is.md) · [Guide overview](_guide.md) · [Phase 3: Controls & Data Binding →](03-controls-and-data-binding.md)
