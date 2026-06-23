---
title: "Data Binding"
guide: "blazor-from-zero"
phase: 3
summary: "How Blazor ties markup to state: one-way (@field renders into the DOM) and two-way (@bind links inputs to C# fields both ways), plus @bind:event, @bind:format, and @bind:after."
tags: [blazor, csharp, data-binding, bind, state]
difficulty: intermediate
synonyms: ["blazor data binding", "blazor @bind", "blazor two-way binding", "blazor bind:event", "blazor input binding", "blazor one-way binding"]
updated: 2026-06-23
---

# Data Binding

Here's the one idea that makes Blazor feel alive instead of static: **binding ties your markup to your C# state.** You don't manually grab an element and shove text into it the way you would with `document.getElementById` in JavaScript. You declare a relationship — "this bit of UI reflects that field" — and Blazor keeps them in sync for you.

That relationship runs in one of two directions:

- **One-way** (`@field`): your C# state flows *into* the markup. When the field changes and the component re-renders, the DOM updates. The data travels state → UI.
- **Two-way** (`@bind`): your C# state and a form input stay locked together in *both* directions. The user types, the field updates; your code changes the field, the input updates. Data travels state ↔ UI.

Hold that picture — **one-way is a read-out, two-way is a handshake** — and everything below is just syntax for those two cases. We'll build it on the running **products** UI from the earlier phases.

> 📝 You already met one-way binding in [Components & Razor](02-components-and-razor.md) without us naming it. Every time you wrote `@something` in markup, that was one-way binding. This phase names it, then adds the two-way kind.

## One-way binding: state into markup

When you drop `@expression` into your markup, Blazor evaluates that C# and renders the result. If the value changes later (and the component re-renders), the rendered output changes with it. The data only ever flows one way: from your field into the page.

```razor
<h2>@ProductName</h2>
<p>Price: $@Price</p>
<p>In stock: @(InStock ? "yes" : "no")</p>

@code {
    private string ProductName = "Mechanical Keyboard";
    private decimal Price = 89.99m;
    private bool InStock = true;
}
```

*What just happened:* The three `@` expressions read straight out of the `@code` fields and render their current values. Notice `@(InStock ? ... : ...)` — when the expression is more than a simple name, wrap it in parentheses so Blazor knows where the C# ends and the markup resumes. This is a one-way relationship: the markup mirrors the fields, but nothing in the markup can change those fields. For that, you need two-way binding.

## Two-way binding with `@bind`

A read-out isn't enough for a form. When the user types into a search box or edits a price, you want that typed value to land back in your C# field. That's `@bind`.

`@bind` ties a form element's value to a C# field in **both** directions: change the field in code and the input updates; type in the input and the field updates. Let's wire up a search box that filters the product list.

```razor
<input @bind="filter" placeholder="Search products..." />
<p>Filtering by: <strong>@filter</strong></p>

<ul>
    @foreach (var p in products.Where(p => p.Contains(filter, StringComparison.OrdinalIgnoreCase)))
    {
        <li>@p</li>
    }
</ul>

@code {
    private string filter = "";
    private List<string> products = new()
    {
        "Mechanical Keyboard", "Wireless Mouse", "USB-C Hub", "Monitor Arm"
    };
}
```

*What just happened:* `@bind="filter"` connects the text box to the `filter` field. When `filter` changes, the `@foreach` re-runs and the list narrows. The `<strong>@filter</strong>` next to it is *one-way* binding reading the same field — a handy way to see two-way and one-way working side by side. One field, two roles.

`@bind` isn't only for text boxes. It adapts to the element it's on:

```razor
<select @bind="category">
    <option value="all">All</option>
    <option value="input">Input devices</option>
    <option value="display">Displays</option>
</select>

<label>
    <input type="checkbox" @bind="inStockOnly" />
    In stock only
</label>

<p>Category: @category · In-stock filter: @inStockOnly</p>

@code {
    private string category = "all";
    private bool inStockOnly = false;
}
```

*What just happened:* On a `<select>`, `@bind` reads and writes the chosen `<option>`'s `value`. On `<input type="checkbox">`, it binds to a `bool` — checked is `true`, unchecked is `false`. Blazor picks the right HTML attribute and conversion for each element type, so you write the same `@bind` everywhere and let the framework sort out the plumbing.

> 💡 Here's the timing detail that trips people up: by default `@bind` on a text input syncs on the **`onchange`** event — which fires when the input *loses focus*, not on every keystroke. So in the search example above, `filter` only updates after you click away or press Tab. That's often not what you want for a live search. The next section fixes it.

## Controlling *when* and *how* it syncs

`@bind` has a few companion directives that tune its behavior.

**`@bind:event`** changes the event that triggers the sync. Switch it to `oninput` and the field updates on every keystroke — perfect for a live filter:

```razor
<input @bind="filter" @bind:event="oninput" placeholder="Search products..." />
<p>Showing results for: <strong>@filter</strong></p>

@code {
    private string filter = "";
}
```

*What just happened:* With `@bind:event="oninput"`, `filter` updates as the user types each character, so the filtered list reacts instantly instead of waiting for the box to lose focus. The default `onchange` is fine for a price field you only care about once editing is done; `oninput` is what you want for anything that should feel live.

**`@bind:format`** controls how a value is rendered into the input — most commonly for dates:

```razor
<input type="date" @bind="restockDate" @bind:format="yyyy-MM-dd" />
<p>Restocks on: @restockDate.ToShortDateString()</p>

@code {
    private DateTime restockDate = DateTime.Today;
}
```

*What just happened:* `@bind:format="yyyy-MM-dd"` tells Blazor how to format the `DateTime` when it writes it into the input's value. Without a matching format, an `<input type="date">` may refuse to display the value, since the browser expects exactly `yyyy-MM-dd`.

**`@bind:after`** runs a method *after* the bound field has been updated — the right place to react to a change (recalculate, log, call an API):

```razor
<input @bind="filter" @bind:event="oninput" @bind:after="OnFilterChanged" />
<p>@status</p>

@code {
    private string filter = "";
    private string status = "";

    private void OnFilterChanged()
    {
        status = string.IsNullOrWhiteSpace(filter)
            ? "Showing all products"
            : $"Searching for \"{filter}\"";
    }
}
```

*What just happened:* Each time the bind updates `filter`, Blazor then calls `OnFilterChanged`, which reads the freshly-updated value and sets `status`. The key word is *after* — by the time your method runs, `filter` already holds the new value, so you don't have to chase the event arguments.

> ⚠️ This one bites everyone: **`@bind="x"` is shorthand** for `value="@x"` plus an `@onchange` handler that assigns the typed value back to `x`. Because `@bind` already owns the `@onchange` (or `oninput`) handler under the hood, you **cannot** also add your own `@onchange` to the same element — they'd both try to handle the event and Blazor will error. If you need to run code on change, use `@bind:after` (shown above), or drop `@bind` entirely and write `value="@x"` with your own `@onchange` handler that does both the assignment and your logic. Pick one or the other; never both on the same element.

## When does the UI actually update?

Binding handles the sync, but *re-rendering* is what makes the change visible. The good news: when a bound field changes **because of the UI** (a keystroke, a checkbox click), Blazor re-renders that component automatically. That's why the filtered list updates without you lifting a finger.

> 💡 The exception is state you change from **your own code** outside of a UI event — say, a background timer ticking, or a value updated inside an `async` callback. In those cases Blazor may not know it needs to re-render, and you have to nudge it with `StateHasChanged()`. We cover exactly when and why in [Events & the Component Lifecycle](04-events-and-lifecycle.md). For now, just know: UI-driven changes render themselves; code-driven changes sometimes need a tap on the shoulder.

## Recap

- **Binding ties markup to state.** One-way (`@field`) flows state → UI; two-way (`@bind`) keeps a form input and a C# field in sync in both directions.
- **One-way** is anything you write as `@expression` in markup — a read-out of your fields. Wrap non-trivial expressions in `@( ... )`.
- **`@bind`** works on text inputs, `<select>`, `<textarea>`, and checkboxes (bound to a `bool`), picking the right attribute and conversion for each. By default it syncs on `onchange` — when the element loses focus.
- **Tune the sync** with `@bind:event="oninput"` (every keystroke), `@bind:format` (e.g. date formatting), and `@bind:after` (run a method once the field has updated).
- **`@bind` is sugar** for `value` + an `@onchange` handler, so you can't add a second manual `@onchange` to the same element — use `@bind:after` or hand-roll value + handler instead.
- **UI-driven changes re-render automatically**; changes from your own code may need `StateHasChanged()` (Phase 4).

## Quick check

```quiz
[
  {
    "q": "By default, when does @bind on a text <input> sync the field?",
    "choices": ["On every keystroke", "When the input loses focus (the onchange event)", "Only when the form is submitted", "Once when the component first renders"],
    "answer": 1,
    "explain": "Default @bind syncs on the onchange event, which fires when the input loses focus. Use @bind:event=\"oninput\" to sync on every keystroke."
  },
  {
    "q": "Why can't you add your own @onchange handler to an element that already uses @bind?",
    "choices": ["@bind only works on read-only elements", "@bind is shorthand for value + an @onchange handler, so it already owns that event", "@onchange is not a valid Blazor event", "You can, but only if the field is a string"],
    "answer": 1,
    "explain": "@bind=\"x\" expands to value=\"@x\" plus an @onchange handler that writes back. Adding another @onchange conflicts; use @bind:after instead."
  },
  {
    "q": "Which directive runs a method right after a bound field has been updated?",
    "choices": ["@bind:format", "@bind:event", "@bind:after", "@onchange"],
    "answer": 2,
    "explain": "@bind:after runs your method once the bind has assigned the new value, so the field already holds the updated value when it runs."
  }
]
```

---

[← Phase 2: Components & Razor](02-components-and-razor.md) · [Guide overview](_guide.md) · [Phase 4: Events & the Component Lifecycle →](04-events-and-lifecycle.md)
