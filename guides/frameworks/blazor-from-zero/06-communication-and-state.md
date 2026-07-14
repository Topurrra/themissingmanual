---
title: "Component Communication & State"
guide: "blazor-from-zero"
phase: 6
summary: "How Blazor components talk: parameters down, events up with EventCallback, cascading values for deep data, and a DI-registered service for app-wide shared state."
tags: [blazor, csharp, parameters, eventcallback, cascading, state]
difficulty: advanced
synonyms: ["blazor parameter", "blazor eventcallback", "blazor cascading value", "blazor component communication", "blazor shared state service", "blazor bind-value component"]
updated: 2026-07-10
---

# Component Communication & State

By now you can build a single component and even a tree of them - a products page holding three `<ProductCard />` tags from Phase 2, each its own markup-plus-`@code` unit. But a tree where the pieces can't talk to each other isn't an app; it's a static page. The page needs to hand each card its own product. A card needs to tell the page "the user clicked me." And a cart, off to the side, needs to know about purchases happening in components it has never heard of.

Here's the mental model to hold before any code. **Components talk over four channels, and you pick the channel by who needs to reach whom:**

1. **Parameters down** - a parent hands data to a direct child (`[Parameter]`).
2. **Events up** - a child notifies its parent that something happened (`EventCallback<T>`).
3. **Cascading values** - a value flows down to *any* descendant, however deep, without being threaded through every level in between (`CascadingValue` / `[CascadingParameter]`).
4. **A shared service** - app-wide state that *unrelated* components read and write, living outside the tree entirely (a class registered in DI).

The first two are the workhorses you'll use constantly; the last two solve the "this is getting awkward" problems the first two create at scale.

> 💡 Rule of thumb: parameters and events are for components that already know about each other (parent and direct child). Cascading values and the shared service are for when threading data through every intermediate component would be miserable, or the components have no parent-child relationship at all.

## Channel 1: parameters down (`[Parameter]`)

A **parameter** is a public property on the child marked with `[Parameter]`. The parent sets it by writing an HTML-style attribute on the child's tag. This is the channel that finally lets each `ProductCard` show its *own* product instead of a hardcoded one.

Here's `ProductCard` accepting a `Product` from its parent:

```razor
@* ProductCard.razor *@
<div class="card">
    <h3>@Product.Name</h3>
    <p>@Product.Price.ToString("C")</p>
</div>

@code {
    [Parameter]
    public Product Product { get; set; } = default!;
}
```

And the products page passing one in:

```razor
@page "/products"

<div class="grid">
    @foreach (var p in products)
    {
        <ProductCard Product="p" />
    }
</div>

@code {
    private List<Product> products = new()
    {
        new() { Name = "Mechanical Keyboard", Price = 89.99m },
        new() { Name = "USB-C Hub", Price = 34.50m },
        new() { Name = "Laptop Stand", Price = 42.00m },
    };
}
```

*What just happened:* the child declared `[Parameter] public Product Product { get; set; }` - a normal C# property plus the attribute telling Blazor "the parent is allowed to set this." The parent's `<ProductCard Product="p" />` looks like an HTML attribute, but the value (`p`) is real C#: the current loop variable. Each `@foreach` iteration renders one card with a different product - three products, three cards. `= default!;` is a C# nicety: it promises the compiler the parameter will be set, silencing the nullable warning.

> 📝 Parameters flow **one way: parent to child.** A child should *read* its parameters, not reassign them - if it writes to its own `[Parameter]` property, Blazor overwrites that value the next time the parent re-renders, and your change vanishes. When a child needs to send something *back*, that's channel 2.

### Passing markup, not just data: child content

Sometimes a parent doesn't want to pass a value - it wants to pass *markup* to be rendered inside the child. A reusable `<Card>` wrapper that draws a border and padding but lets the caller decide what goes inside is the classic case. Blazor handles this with a special parameter type, `RenderFragment`, conventionally named `ChildContent`:

```razor
@* Card.razor *@
<div class="card">
    @ChildContent
</div>

@code {
    [Parameter]
    public RenderFragment? ChildContent { get; set; }
}
```

Now any component can nest content between the `<Card>` tags:

```razor
<Card>
    <h3>Mechanical Keyboard</h3>
    <p>Clicky. Loud. Worth it.</p>
</Card>
```

*What just happened:* when you put markup *between* a component's opening and closing tags, Blazor captures it as a `RenderFragment` and assigns it to the parameter named `ChildContent`. `Card` renders `@ChildContent` wherever it wants the caller's markup to land - here, inside the bordered `<div>`. This is how you build layout and wrapper components: the wrapper owns the chrome, the caller owns the contents.

## Channel 2: events up (`EventCallback<T>`)

A child can't reach up and call a method on its parent - it doesn't even know what its parent is. Instead, the parent hands the child a **callback**, and the child invokes it when something happens. In Blazor that callback is an `EventCallback<T>`: a parameter the child exposes, wired by the parent to one of its own methods.

Let's make `ProductCard` tell its parent when it's clicked:

```razor
@* ProductCard.razor *@
<div class="card" @onclick="HandleClick">
    <h3>@Product.Name</h3>
    <p>@Product.Price.ToString("C")</p>
</div>

@code {
    [Parameter]
    public Product Product { get; set; } = default!;

    [Parameter]
    public EventCallback<Product> OnSelected { get; set; }

    private async Task HandleClick()
    {
        await OnSelected.InvokeAsync(Product);
    }
}
```

The parent provides the handler:

```razor
@page "/products"

<p>Selected: @(selected?.Name ?? "nothing yet")</p>

<div class="grid">
    @foreach (var p in products)
    {
        <ProductCard Product="p" OnSelected="HandleSelected" />
    }
</div>

@code {
    private Product? selected;

    private void HandleSelected(Product product)
    {
        selected = product;
    }

    private List<Product> products = new() { /* ...as before... */ };
}
```

*What just happened:* the child exposes `OnSelected` as an `EventCallback<Product>` parameter. When its `<div>` is clicked, `HandleClick` runs and calls `OnSelected.InvokeAsync(Product)`, passing the clicked product upward. The parent set `OnSelected="HandleSelected"`, so its `HandleSelected` method runs with that product, updating `selected`. Data went *up* the tree - child to parent - which parameters alone can't do. The parent's `<p>` re-renders to show the new selection.

> 📝 Why `EventCallback<T>` and not a plain `Action<T>` or C# `event`? Because `EventCallback` is **Blazor-aware**: after the handler runs, Blazor automatically re-renders the parent. With a raw `Action`, the parent's method would run, but Blazor wouldn't know its state changed, so the UI wouldn't update until something else triggered a render - you'd have to call `StateHasChanged` by hand, exactly the trap channel 4 warns about.

### Two-way component binding (`@bind-Value`)

There's a shorthand built on these two channels. If a component exposes a `Value` parameter *and* a matching `ValueChanged` event (`EventCallback<T>`), a parent can bind to it with `@bind-Value`, and changes flow both directions automatically:

```razor
<MyTextBox @bind-Value="searchTerm" />
```

*What just happened:* `@bind-Value="searchTerm"` expands to setting `Value="searchTerm"` (parent → child, channel 1) *and* wiring `ValueChanged` to update `searchTerm` (child → parent, channel 2) in one line. This is exactly the pattern the built-in `InputText` uses, and why `@bind-Value` worked in the Phase 5 form. Build your own input-like components following the `Value` + `ValueChanged` naming convention and callers get `@bind-Value` for free.

## Channel 3: cascading values for deep data

Parameters work beautifully parent-to-child. But imagine a value the *whole tree* needs - the current theme, the logged-in user, an app config. With parameters alone, you'd declare it on every component between the top and the place it's used, passing it down level by level, even through components that don't care about it. That tedious threading is called "prop drilling," and **cascading values** exist to skip it.

A parent wraps part of the tree in `<CascadingValue>`, and *any* descendant - at any depth - can pull it out with `[CascadingParameter]`:

```razor
@* App layout - somewhere near the top of the tree *@
<CascadingValue Value="theme">
    <ProductsPage />
</CascadingValue>

@code {
    private Theme theme = new() { Accent = "teal", Dark = true };
}
```

A deeply-nested `ProductCard` - without any intermediate component knowing about `theme` - reaches in:

```razor
@* ProductCard.razor, deep inside the tree *@
<div class="card @(Theme.Dark ? "dark" : "light")">
    <h3 style="color:@Theme.Accent">@Product.Name</h3>
    <p>@Product.Price.ToString("C")</p>
</div>

@code {
    [Parameter]
    public Product Product { get; set; } = default!;

    [CascadingParameter]
    public Theme Theme { get; set; } = default!;
}
```

*What just happened:* `<CascadingValue Value="theme">` makes `theme` available to everything rendered inside it, however many components deep. `ProductCard` grabbed it with `[CascadingParameter] public Theme Theme { get; set; }` - no `Theme="..."` attribute on the card's tag, and no intermediate component had to forward it. Blazor matches cascading values to cascading parameters **by type** by default. This is the right channel for cross-cutting, tree-wide data; for ordinary parent-to-child data, use a plain `[Parameter]`.

> ⚠️ Cascading values are matched by type. If you ever need *two* cascading values of the same type in scope, give them a `Name` (`<CascadingValue Value="x" Name="Primary">`) and match it on the parameter (`[CascadingParameter(Name = "Primary")]`), or Blazor can't tell them apart.

## Channel 4: app-wide shared state via a service

Cascading values still flow *down* a tree. But some state belongs to no single tree - a shopping cart, say. The products page adds to it; a cart badge in the navbar reads from it; a checkout page on a different route reads it too. These components are siblings or strangers, not ancestors and descendants. The answer: move that state **out of the component tree entirely** into a plain C# class, register it as a **DI service**, and inject it wherever needed.

Here's a minimal cart state class:

```csharp
public class CartState
{
    private readonly List<Product> items = new();

    public IReadOnlyList<Product> Items => items;

    public event Action? OnChange;

    public void Add(Product product)
    {
        items.Add(product);
        OnChange?.Invoke();
    }
}
```

You register it once at startup (in `Program.cs`):

```csharp
builder.Services.AddScoped<CartState>();
```

*What just happened:* `CartState` is an ordinary class holding the list of items, plus an `OnChange` event it raises on change. Registering it with `AddScoped` means Blazor hands the *same* instance to every component that asks for it, within a user's session. 📝 The lifetime choice differs by hosting model from Phase 1: **`Scoped` in Blazor Server** (one instance per user connection), typically **`Singleton` in Blazor WebAssembly** (the whole app is one user in one browser tab anyway). Pick the one matching your host.

Any component injects it with `@inject` (the directive you met in Phase 2) and uses it:

```razor
@* In ProductCard - add to cart on selection *@
@inject CartState Cart

<button @onclick="() => Cart.Add(Product)">Add to cart</button>
```

```razor
@* CartBadge.razor - lives in the navbar, far from ProductCard *@
@inject CartState Cart
@implements IDisposable

<span class="badge">@Cart.Items.Count</span>

@code {
    protected override void OnInitialized()
    {
        Cart.OnChange += StateHasChanged;
    }

    public void Dispose()
    {
        Cart.OnChange -= StateHasChanged;
    }
}
```

*What just happened:* both components inject the same `CartState`. The button in `ProductCard` calls `Cart.Add(Product)`, which mutates the shared list and fires `OnChange`. `CartBadge` - which `ProductCard` has never heard of - subscribed to `OnChange` in `OnInitialized`, so when the event fires it calls `StateHasChanged` and re-renders its count. State changed in one component; a completely unrelated component updated in response - the whole point of the service channel.

> ⚠️ The gotcha that bites everyone once. A component does **not** automatically re-render when state *outside it* changes - Blazor only re-renders on its own parameters, its own events, or an explicit `StateHasChanged`. A component reading shared state must (1) **subscribe** to the service's change event, (2) call **`StateHasChanged`** in the handler, and (3) **unsubscribe in `Dispose`** (via `@implements IDisposable`). Skip the subscribe and the badge silently shows a stale count; skip the unsubscribe and you leak the component. All three steps, every time.

## Recap

- Components talk over **four channels**: parameters **down**, events **up**, cascading values for the **deep tree**, and a shared **service** for app-wide state. Pick by who needs to reach whom.
- **`[Parameter]`** sends data parent → child; the parent sets it as an attribute (`<ProductCard Product="p" />`). A `RenderFragment? ChildContent` parameter lets a parent nest **markup** inside the child.
- **`EventCallback<T>`** sends notifications child → parent; the child calls `OnSelected.InvokeAsync(...)`, the parent handles it. It's preferred over a plain `Action` because it **auto-re-renders** the parent. A `Value` + `ValueChanged` pair gives callers `@bind-Value`.
- **`CascadingValue` / `[CascadingParameter]`** push a value to any descendant without threading it through every level - for cross-cutting data like a theme or current user. Matched by type (use `Name` to disambiguate).
- **A DI-registered state service** holds app-wide state outside the tree (`Scoped` on Server, usually `Singleton` on WebAssembly). It raises an event on change.
- A component **won't** re-render on external state changes unless it **subscribes**, calls **`StateHasChanged`**, and **unsubscribes in `Dispose`** - all three, or you get a stale UI or a leak.

## Quick check

Make sure the four channels are straight before moving on:

```quiz
[
  {
    "q": "A child ProductCard needs to tell its parent page which product the user clicked. Which channel fits?",
    "choices": ["A [Parameter] on the child", "An EventCallback<Product> the child invokes", "A CascadingValue wrapping the page", "Reassigning the child's own parameter"],
    "answer": 1,
    "explain": "Child-to-parent notification is exactly what EventCallback<T> is for. The child calls OnSelected.InvokeAsync(product); the parent handles it - and the parent auto-re-renders."
  },
  {
    "q": "Why is EventCallback<T> preferred over a plain Action<T> for child-to-parent communication in Blazor?",
    "choices": ["Action cannot carry a value", "EventCallback automatically triggers a re-render of the parent after the handler runs", "Action only works in Blazor WebAssembly", "EventCallback is faster at runtime"],
    "answer": 1,
    "explain": "EventCallback is Blazor-aware: after the handler runs it re-renders the parent. With a raw Action the parent's method runs but the UI won't update until something else triggers a render."
  },
  {
    "q": "A CartBadge in the navbar injects the shared CartState service but its count never updates when items are added elsewhere. What's missing?",
    "choices": ["It needs a [Parameter] for the count", "It must subscribe to the service's change event and call StateHasChanged (and unsubscribe in Dispose)", "CartState must be registered as Transient", "The badge needs its own @page route"],
    "answer": 1,
    "explain": "A component doesn't re-render on external state changes by itself. It must subscribe to the service's OnChange event, call StateHasChanged in the handler, and unsubscribe in Dispose to avoid a leak."
  }
]
```

---

[← Phase 5: Forms & Validation](05-forms-and-validation.md) · [Guide overview](_guide.md) · [Phase 7: Calling APIs & Dependency Injection →](07-calling-apis-and-di.md)
