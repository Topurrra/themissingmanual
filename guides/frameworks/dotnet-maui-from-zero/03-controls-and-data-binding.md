---
title: "Controls & Data Binding"
guide: "dotnet-maui-from-zero"
phase: 3
summary: "Wire controls to data with BindingContext and {Binding}, pick OneWay vs TwoWay modes, understand why live updates need change notifications, and render lists with CollectionView."
tags: [dotnet-maui, csharp, data-binding, collectionview, bindingcontext]
difficulty: intermediate
synonyms: ["maui data binding", "maui binding context", "maui collectionview", "xaml binding", "maui itemssource", "maui two-way binding"]
updated: 2026-06-23
---

# Controls & Data Binding

In Phase 2 you arranged controls by hand and, if you wanted a `Label` to show some text, you set that text yourself in code. That works for one label. It falls apart the moment your UI has a dozen fields that all need to reflect a changing object — you end up writing `titleLabel.Text = note.Title;` over and over, and remembering to re-run it every time the data changes. Data binding is the escape hatch.

## The mental model: tie the control to the data, then walk away

Here's the one idea to hold for this whole phase: **data binding connects a control's property to a property on a data object.** You declare the connection once — "this `Label`'s `Text` should mirror this note's `Title`" — and MAUI keeps them in sync for you. You stop poking the UI by hand.

Two pieces make it work:

- **`BindingContext`** — the data object a control (or a whole page) is pointed at. Think of it as "the thing this UI is about." A notes detail page is *about* one `Note`, so that `Note` is its `BindingContext`.
- **`{Binding PropertyName}`** — in XAML, this says "fill me from the property called `PropertyName`, looked up on the `BindingContext`."

So the page gets pointed at a `Note`, and each control reaches into that note for the property it cares about. You set the source once; the UI follows.

> 📝 If you've used the web, this is the same instinct as templating — but two-way and live, not a one-time render. The control doesn't *copy* the value; it *subscribes* to it.

## Your first binding

Let's bind a `Label` to a note's title. First the data object — a plain C# class for now:

```csharp
public class Note
{
    public string Title { get; set; }
    public string Body { get; set; }
}
```

*What just happened:* nothing magic — just a class with two properties. This is the kind of object a binding reads from. (We'll see its one limitation in a minute.)

Now the page. Set the `BindingContext` in the code-behind, then bind in XAML:

```csharp
public partial class NoteDetailPage : ContentPage
{
    public NoteDetailPage()
    {
        InitializeComponent();
        BindingContext = new Note { Title = "Buy milk", Body = "2%, not skim" };
    }
}
```

```xml
<ContentPage ...>
    <VerticalStackLayout Padding="20" Spacing="10">
        <Label Text="{Binding Title}" FontSize="24" />
        <Label Text="{Binding Body}" />
    </VerticalStackLayout>
</ContentPage>
```

*What just happened:* the page's `BindingContext` is one `Note`. The first `Label` looks up `Title` on that note and shows "Buy milk"; the second shows the body. We never wrote `titleLabel.Text = ...`. The binding did the lookup. Notice the controls inherit the page's `BindingContext` — you set it once on the page and every child can bind against it.

## Binding modes: which way does data flow?

A binding has a *direction*. The mode decides who tells whom about changes.

- **OneWay** — source → UI. The data drives the control. This is the default for display controls like `Label`, and it's what you usually want for read-only text.
- **TwoWay** — source ↔ UI. Changes flow both directions. This is for *inputs*: when the user types into an `Entry`, you want their text written back into the data object. `Entry.Text` and `Switch.IsToggled` default to TwoWay.
- **OneTime** — set once at bind time, then never again. Rare; useful for values you know won't change.

Here's a TwoWay binding on an editable title:

```xml
<Entry Text="{Binding Title, Mode=TwoWay}" Placeholder="Note title" />
```

*What just happened:* the `Entry` shows the note's current `Title`, and when the user edits it, the new text is written straight back to `note.Title`. No `TextChanged` event handler, no manual assignment. That's the payoff of TwoWay — the data object stays current as the user types.

> 💡 You often don't need to write `Mode=TwoWay` on an `Entry` — its `Text` is TwoWay by default. Spell it out when you want to be explicit, or when you're binding a property whose default mode isn't what you want.

## The catch: live updates need change notifications

Now the part that trips up everyone the first time. Bind a `Label` to `note.Title`, then later run `note.Title = "Buy oat milk";` in code — and the label **doesn't change.** The binding read the value once and has no idea the property moved.

Why? Because a plain class like our `Note` has no way to announce "hey, `Title` changed." The binding wired itself up, but nobody rang the bell.

The fix is an interface called **`INotifyPropertyChanged`**: your data object raises an event every time a property changes, and the binding listens for it. With that in place, set `note.Title` in code and the label updates instantly.

> ⚠️ A plain object (a "POCO") binds *once* — it'll show the initial value fine — but it won't *live-update* when properties change afterward. If your UI mysteriously goes stale after you change data in code, this is almost always why.

We're not implementing `INotifyPropertyChanged` by hand here — it's the whole reason Phase 4 exists, and the CommunityToolkit.Mvvm makes it nearly free. For now, just hold the rule: **bindings show the current value at bind time, but only live-update if the source raises change notifications.** See [Phase 4: The MVVM Pattern](04-mvvm.md).

## Lists: CollectionView, ItemsSource, and ItemTemplate

A notes app needs to show *many* notes, not one. That's `CollectionView` — MAUI's workhorse for scrolling lists. It has two key bindings:

- **`ItemsSource`** — bound to a *collection* of objects (your list of notes).
- **`ItemTemplate`** — a `DataTemplate` describing how to render *one* row.

```xml
<CollectionView ItemsSource="{Binding Notes}">
    <CollectionView.ItemTemplate>
        <DataTemplate>
            <Label Text="{Binding Title}" Padding="10" />
        </DataTemplate>
    </CollectionView.ItemTemplate>
</CollectionView>
```

*What just happened:* `ItemsSource` points at the page's `Notes` collection, so the `CollectionView` knows it has, say, five notes. For each one it stamps out a copy of the `DataTemplate`. Crucially, **inside the `DataTemplate`, `{Binding Title}` is relative to each item — a single `Note` — not the page.** The page's `BindingContext` is the screen as a whole; each row's `BindingContext` is automatically the note for that row. That switch of context inside the template is the thing to internalize.

So you have two layers of binding context at once: the page is about the *list*, each row is about *one note*. MAUI sets the row context for you; you just bind to the note's properties as if it were the only thing in the world.

> 💡 Back the list with an **`ObservableCollection<T>`**, not a plain `List<T>`. An `ObservableCollection` tells the `CollectionView` whenever you add or remove an item, so the list redraws automatically. A plain `List` has no such signal — add to it and the screen won't budge. (Same family of problem as `INotifyPropertyChanged`, one level up: the *collection* needs to announce changes too.)

## Wiring the notes app

Let's pull it together. The list page is *about* a collection of notes; the detail page is *about* one note with an editable title.

The list page's context holds an `ObservableCollection<Note>`:

```csharp
public partial class NotesListPage : ContentPage
{
    public ObservableCollection<Note> Notes { get; } = new()
    {
        new Note { Title = "Buy milk", Body = "2%, not skim" },
        new Note { Title = "Call dentist", Body = "Reschedule cleaning" },
    };

    public NotesListPage()
    {
        InitializeComponent();
        BindingContext = this;
    }
}
```

*What just happened:* the page exposes a `Notes` collection and sets itself as the `BindingContext` (`BindingContext = this`), so `{Binding Notes}` in XAML resolves to that property. Using `ObservableCollection` means a later `Notes.Add(...)` will show up in the UI without a manual refresh.

The list XAML binds the `CollectionView` to it:

```xml
<ContentPage ...>
    <CollectionView ItemsSource="{Binding Notes}">
        <CollectionView.ItemTemplate>
            <DataTemplate>
                <VerticalStackLayout Padding="15" Spacing="2">
                    <Label Text="{Binding Title}" FontSize="18" />
                    <Label Text="{Binding Body}" FontSize="13" TextColor="Gray" />
                </VerticalStackLayout>
            </DataTemplate>
        </CollectionView.ItemTemplate>
    </CollectionView>
</ContentPage>
```

*What just happened:* each note becomes a two-line row — title on top, body in gray underneath. The bindings inside the template (`Title`, `Body`) read from each individual `Note`, because that's what the row's context is. One template, every note rendered consistently.

And the detail page edits one note's title with a TwoWay `Entry`:

```xml
<VerticalStackLayout Padding="20" Spacing="10">
    <Entry Text="{Binding Title, Mode=TwoWay}" Placeholder="Title" FontSize="22" />
    <Editor Text="{Binding Body, Mode=TwoWay}" Placeholder="Write your note..." HeightRequest="200" />
</VerticalStackLayout>
```

*What just happened:* point this page's `BindingContext` at one `Note` and the `Entry`/`Editor` both show and *write back* its title and body as the user types. The note object stays in sync with the screen automatically — exactly the "set it once, walk away" promise from the top of the phase.

You now have a list of notes that renders itself and an edit screen that reads and writes a note — all declared in XAML, no manual UI-poking. The one gap left: making the UI live-update when data changes in code. That's the change-notification problem, and it's the heart of the next phase.

## Recap

- **Data binding ties a control's property to a data object's property.** Set the source once via `BindingContext`; the UI follows — no manual `label.Text = ...`.
- **`{Binding PropertyName}`** looks the property up on the current `BindingContext`. Children inherit the page's context unless overridden.
- **Modes:** OneWay (source → UI, default for display) and TwoWay (source ↔ UI, default for inputs like `Entry`). OneTime sets once.
- **Live updates need change notifications** — a plain object binds once but won't refresh when its properties change later. `INotifyPropertyChanged` (Phase 4) fixes that.
- **Lists** use `CollectionView` + `ItemsSource` + an `ItemTemplate`/`DataTemplate`; bindings inside the template are relative to *each item*. Back the source with an `ObservableCollection` so adds/removes show up automatically.

## Quick check

```quiz
[
  {
    "q": "A Label is bound to note.Title. In code you run note.Title = \"new\", but the Label doesn't change. Why?",
    "choices": ["The binding only supports TwoWay mode", "A plain object doesn't raise change notifications, so the binding never hears about the update", "Labels can't be bound to strings", "BindingContext must be re-assigned on every change"],
    "answer": 1,
    "explain": "Bindings show the current value at bind time, but live updates require the source to raise change notifications via INotifyPropertyChanged (Phase 4)."
  },
  {
    "q": "Inside a CollectionView's DataTemplate, what is {Binding Title} relative to?",
    "choices": ["The page's BindingContext", "The CollectionView itself", "Each individual item (e.g. one Note) being rendered", "The app's global resources"],
    "answer": 2,
    "explain": "Each row's BindingContext is the item for that row, so bindings in the template read from a single item, not the page."
  },
  {
    "q": "You want an Entry whose text both displays and updates a note's Title as the user types. Which mode fits?",
    "choices": ["OneTime", "OneWay", "TwoWay", "No binding needed"],
    "answer": 2,
    "explain": "TwoWay flows both directions: the Entry shows the current value and writes edits back to the source. It's the default for Entry.Text."
  }
]
```

---

[← Phase 2: XAML & Layouts](02-xaml-and-layouts.md) · [Guide overview](_guide.md) · [Phase 4: The MVVM Pattern →](04-mvvm.md)
