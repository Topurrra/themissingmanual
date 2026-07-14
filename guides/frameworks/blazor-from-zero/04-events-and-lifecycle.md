---
title: "Events & the Component Lifecycle"
guide: "blazor-from-zero"
phase: 4
summary: "Wire up @onclick and other DOM events to C# methods, run code at the right moment with OnInitializedAsync and friends, and use StateHasChanged to force a re-render when state changes outside Blazor's view."
tags: [blazor, csharp, events, lifecycle, statehaschanged]
difficulty: intermediate
synonyms: ["blazor events onclick", "blazor lifecycle", "OnInitializedAsync", "OnParametersSet", "blazor StateHasChanged", "blazor async event handler"]
updated: 2026-07-10
---

# Events & the Component Lifecycle

So far your components have rendered and bound data. Now we make them *do* things - react
when a user clicks, and run setup code at exactly the right moment. This is where a
component stops being a static page and starts feeling alive.

Here's the whole chapter in one breath - the rest is detail:

- **Events run your C# methods.** A click, a change, a submit - each can call a method in
  your `@code` block.
- **Lifecycle methods run your code at defined moments.** Blazor calls specific methods when
  a component is created, when its parameters change, and after it paints to the screen. You
  override the one that fits your need.
- **`StateHasChanged()` asks Blazor to re-render.** Most of the time Blazor renders for you.
  When state changes somewhere Blazor isn't watching, this is how you say "the screen is stale,
  redraw it."

Hold those three sentences. Everything below hangs off them.

> 📝 We'll keep building the **products** UI from the previous phases: load a list of products
> when the component appears, and add a button that does something. Same component, more life.

## Events: making clicks run your code

You attach a handler to a DOM event with `@on` + the event name, pointing at a method:

```razor
<button @onclick="Refresh">Refresh</button>

<p>Clicked @count times.</p>

@code {
    private int count = 0;

    private void Refresh()
    {
        count++;
    }
}
```

*What just happened:* `@onclick="Refresh"` tells Blazor "when this button is clicked, call the
`Refresh` method." `Refresh` bumps `count`, and because this ran inside a Blazor event handler,
Blazor re-renders automatically afterward - the `<p>` updates with no extra work from you. Same
pattern for `@onchange` (value committed), `@oninput` (every keystroke), and `@onsubmit` (form
submitted).

Sometimes you need details about the event - which key, which mouse button, the new value.
Blazor hands you a strongly-typed event-args object when you ask for it:

```razor
<input @oninput="OnTyping" placeholder="Type something" />

<p>You typed: @text</p>

@code {
    private string text = "";

    private void OnTyping(ChangeEventArgs e)
    {
        text = e.Value?.ToString() ?? "";
    }
}
```

*What just happened:* declaring the parameter as `ChangeEventArgs e` makes Blazor pass the event
data in. `e.Value` is the input's current value (typed as `object?`, so we convert and guard
against null). Different events carry different args - `MouseEventArgs` for clicks,
`KeyboardEventArgs` for key presses - take the parameter only when you need it.

### Async handlers

Real work - calling an API, saving to a database - is asynchronous. Handlers can be `async Task`,
and you wire them up exactly the same way:

```razor
<button @onclick="LoadProducts" disabled="@isLoading">
    @(isLoading ? "Loading..." : "Load products")
</button>

<ul>
    @foreach (var p in products)
    {
        <li>@p.Name - $@p.Price</li>
    }
</ul>

@code {
    private List<Product> products = new();
    private bool isLoading = false;

    private async Task LoadProducts()
    {
        isLoading = true;
        products = await Http.GetFromJsonAsync<List<Product>>("api/products") ?? new();
        isLoading = false;
    }
}
```

*What just happened:* `LoadProducts` is `async Task`, so it can `await` the HTTP call without
freezing the UI. Notice the timing: when you set `isLoading = true` and hit the `await`, Blazor
re-renders *while it waits* (showing "Loading..." and disabling the button). When the `await`
completes, Blazor re-renders *again* (products shown, button re-enabled). You set the flag; Blazor
handles both repaints around the `await`.

> ⚠️ Make async handlers return `Task`, not `void`. An `async void` method can't be awaited, so
> Blazor can't track when it finishes or surface its exceptions - errors just vanish. `async Task`
> is the rule for event handlers.

## The lifecycle: running code at the right moment

A component isn't a one-shot render. It gets *created*, has its *parameters set*, *renders*, and
later *re-renders*. Blazor exposes hooks at each stage. You override the one whose timing matches
what you need.

The three you'll actually reach for:

| Method | When it runs | Use it for |
|--------|-------------|------------|
| `OnInitialized` / `OnInitializedAsync` | Once, when the component is first created | Loading initial data |
| `OnParametersSet` / `OnParametersSetAsync` | Initially **and** every time a parent updates a parameter | Reacting to changed inputs |
| `OnAfterRender` / `OnAfterRenderAsync` | After the component renders to the DOM | JS interop, anything needing the rendered DOM |

### `OnInitializedAsync` - load your initial data

The most common one. This is where the products list should load - automatically, when the
component appears, instead of waiting for a button:

```razor
@if (products is null)
{
    <p>Loading products...</p>
}
else
{
    <ul>
        @foreach (var p in products)
        {
            <li>@p.Name - $@p.Price</li>
        }
    </ul>
}

@code {
    private List<Product>? products;

    protected override async Task OnInitializedAsync()
    {
        products = await Http.GetFromJsonAsync<List<Product>>("api/products");
    }
}
```

*What just happened:* Blazor calls `OnInitializedAsync` once, right after creating the component.
The timing again matters: the component **renders once before the `await` finishes** - at that
point `products` is still `null`, so the reader sees "Loading products...". When the data arrives,
Blazor re-renders and the list appears. That `null` check isn't ceremony; it's the loading state
your reader sees for the first beat. (`List<Product>?` here precisely so `null` can mean "not
loaded yet.")

### `OnParametersSet` - react to the parent

If a parent component passes in a parameter (covered fully in
[Phase 6](06-communication-and-state.md)), `OnParametersSet` runs initially *and* every time the
parent changes that value. It's where you respond to new inputs:

```razor
@code {
    [Parameter]
    public string CategoryId { get; set; } = "";

    private List<Product>? products;

    protected override async Task OnParametersSetAsync()
    {
        products = await Http.GetFromJsonAsync<List<Product>>(
            $"api/products?category={CategoryId}");
    }
}
```

*What just happened:* whenever the parent renders with a different `CategoryId`, Blazor sets the
new value and calls `OnParametersSetAsync`, so the products reload for the new category.
`OnInitializedAsync` would *not* re-run on a parameter change - it only fires once - exactly why
this hook exists.

### `OnAfterRender` - when you need the real DOM

This one runs *after* the markup is on the page. It's the home for JavaScript interop and anything
that has to touch the actual rendered DOM (focusing an element, initializing a JS chart library):

```razor
@code {
    protected override void OnAfterRender(bool firstRender)
    {
        if (firstRender)
        {
            // Runs only after the very first paint - initialize JS here.
        }
    }
}
```

*What just happened:* `firstRender` is `true` only on the component's first paint and `false` on
every re-render after. Guard one-time setup (like wiring up a JS library) with `if (firstRender)`
so it doesn't re-run on every render. Don't load data here - by the time `OnAfterRender` runs, the
component has already drawn, so you'd cause an extra render. Data loading belongs in
`OnInitializedAsync`.

## `StateHasChanged()` - forcing a re-render

Here's the part that trips people up, so let's be precise.

Blazor automatically re-renders a component after **its own** events: a UI event handler like
`@onclick`, a lifecycle method, or the resumption of an `await` inside one of those. In all those
cases you change state and Blazor redraws - no `StateHasChanged()` needed.

⚠️ The trouble starts when state changes from **outside** that flow - somewhere Blazor isn't
watching. Common culprits:

- a `System.Threading.Timer` callback firing on a background thread,
- a long-running background task completing,
- an event raised by *another* object your component subscribed to.

Blazor has no idea those happened, so it doesn't re-render. You have to tell it:

```razor
<p>Auto-refreshed @refreshCount times.</p>

@code {
    private int refreshCount = 0;
    private System.Threading.Timer? timer;

    protected override void OnInitialized()
    {
        timer = new System.Threading.Timer(_ =>
        {
            refreshCount++;
            InvokeAsync(StateHasChanged);   // tell Blazor to re-render
        }, null, 0, 1000);
    }
}
```

*What just happened:* the timer callback fires every second on a background thread and bumps
`refreshCount` - but nothing on screen would change, because no Blazor event ran. Calling
`StateHasChanged()` is the explicit "redraw me" signal. We wrap it in `InvokeAsync(...)` because
the callback is on a background thread, and Blazor's render must happen on its own thread - 
`InvokeAsync` marshals it back. Inside a normal `@onclick` handler you'd never need this.

> 💡 **The render-loop intuition.** Picture a loop: Blazor **renders** → the user (or a lifecycle
> hook) triggers an **event/handler** → your code changes **state** → Blazor **re-renders**. As
> long as the change happens *inside* that loop, the redraw is free. `StateHasChanged()` kicks the
> loop from the *outside* when something changed that it never saw. If you find yourself reaching
> for it inside an ordinary click handler, pause - you almost certainly don't need it there.

## Recap

- **Events** wire DOM actions to C# with `@onclick`, `@onchange`, `@oninput`, `@onsubmit`. Add a
  typed event-args parameter (`ChangeEventArgs`, `MouseEventArgs`) only when you need the details.
- **Async handlers** return `Task`, never `void`. Blazor re-renders both before the `await` (so set
  a loading flag) and after it resumes.
- **`OnInitializedAsync`** loads initial data once; the component renders before the data arrives,
  so show a loading state (a `null` check).
- **`OnParametersSetAsync`** re-runs whenever a parent changes a parameter - use it to react to new
  inputs; **`OnAfterRender(firstRender)`** is for JS interop and DOM-dependent setup.
- **`StateHasChanged()`** forces a re-render only when state changes *outside* Blazor's own
  handlers/lifecycle (timers, background tasks, external events) - wrap it in `InvokeAsync` from a
  background thread.

## Quick check

```quiz
[
  {
    "q": "Where should you load a component's initial data list so it appears automatically when the component is shown?",
    "choices": ["In OnAfterRender", "In OnInitializedAsync", "In an @onclick handler", "In the @code field initializer with await"],
    "answer": 1,
    "explain": "OnInitializedAsync runs once when the component is created - the standard place for initial data loading. The component renders once before the await completes, so show a loading state."
  },
  {
    "q": "You have a System.Threading.Timer that updates a counter every second, but the screen never changes. Why?",
    "choices": ["Timers don't work in Blazor", "The change happened outside Blazor's event flow, so it didn't re-render - call StateHasChanged via InvokeAsync", "You forgot @bind", "OnParametersSet wasn't overridden"],
    "answer": 1,
    "explain": "Blazor only auto-renders after its own handlers and lifecycle methods. A background timer callback is outside that flow, so you must call StateHasChanged() (wrapped in InvokeAsync from the background thread) to request a redraw."
  },
  {
    "q": "Which lifecycle method re-runs every time a parent component changes a parameter passed to this component?",
    "choices": ["OnInitializedAsync", "OnAfterRender", "OnParametersSet / OnParametersSetAsync", "StateHasChanged"],
    "answer": 2,
    "explain": "OnParametersSet runs initially and again on every parameter update from the parent. OnInitialized only fires once, so it won't react to later parameter changes."
  }
]
```

[← Phase 3: Data Binding](03-data-binding.md) · [Guide overview](_guide.md) · [Phase 5: Forms & Validation →](05-forms-and-validation.md)
