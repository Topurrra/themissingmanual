---
title: "Components & Razor"
guide: "blazor-from-zero"
phase: 2
summary: "How a Blazor component works: a .razor file mixing HTML markup with C# in an @code block, compiled into one class - plus Razor essentials, directives, and composing components into a tree."
tags: [blazor, csharp, components, razor, markup]
difficulty: intermediate
synonyms: ["blazor component", "razor syntax", "blazor code block", "blazor render fragment", "blazor markup csharp", "razor directives"]
updated: 2026-07-10
---

# Components & Razor

Phase 1 showed the big picture: a Blazor app is a tree of components, and you choose where the C# runs. Now we open up a single component and look inside - where Blazor stops being an abstract idea and becomes something you can actually type.

Here's the mental model to hold before touching any code: **a component is markup plus a `@code` block, compiled together into one C# class.** The HTML you write is the shape of the UI; the `@code` block is the data and behavior behind it; the `@` symbol is the bridge that lets one reach into the other. Once that clicks, every piece of Razor you see is a variation on "HTML, with C# woven in through `@`."

> 📝 A component lives in a **`.razor`** file, and the file name is the component name. `ProductCard.razor` defines a component you'll later use as `<ProductCard />`. PascalCase, always - the compiler turns the file name into a class name, and C# classes are PascalCase.

## The two halves of a component

Let's build the running example for this guide: a `ProductCard` that shows a single product. Start with the smallest version that has both halves - some markup, and a `@code` block holding the data it renders.

```razor
<div class="card">
    <h3>@product.Name</h3>
    <p>@product.Price.ToString("C")</p>
</div>

@code {
    private Product product = new() { Name = "Mechanical Keyboard", Price = 89.99m };

    private record Product
    {
        public string Name { get; init; } = "";
        public decimal Price { get; init; }
    }
}
```

*What just happened:* the top part is plain HTML except for `@product.Name` and `@product.Price...` - **Razor expressions**: `@` followed by C# that gets evaluated and dropped into the page. The `@code { }` block is ordinary C#: a field (`product`) and a little `record` type. When this component renders, Blazor runs the C#, evaluates each `@`, and produces the final HTML. Markup on top, code on the bottom, `@` stitching them together.

## Razor essentials

Everything in Razor flows from one symbol. `@` means "switch from HTML into C# here." How much C# follows depends on what comes after the `@`.

**`@expression` renders a value.** This is the most common case - `@` followed by a simple expression, and Razor writes the result into the HTML:

```razor
<p>@product.Name</p>
<p>You have @items.Count items.</p>
```

*What just happened:* `@product.Name` evaluates the property and renders the string; `@items.Count` does the same with an `int` - Razor calls `.ToString()` for you. The `@` reaches into C#, grabs the value, and the rest of the line stays HTML.

When the expression has spaces or operators that Razor might confuse with surrounding markup, wrap it in `@(...)` to be explicit:

```razor
<p>Total: @(product.Price * quantity)</p>
```

*What just happened:* the parentheses tell Razor exactly where the C# starts and stops - without them, it might try to read the `*` or the space as markup. When in doubt, `@(...)`.

**Control flow uses C# directly in the markup.** There's no special template language for loops and conditionals - you write real `@if`, `@foreach`, `@for`, `@switch`, and the markup inside the braces gets rendered each time through:

```razor
@if (product.InStock)
{
    <span class="badge">In stock</span>
}
else
{
    <span class="badge muted">Sold out</span>
}
```

*What just happened:* `@if` is a normal C# `if`, but the braces hold **markup** instead of statements - C# control flow that emits HTML.

Loops work the same way - here's the product **list** that will sit alongside `ProductCard`:

```razor
<ul class="product-list">
    @foreach (var p in products)
    {
        <li>@p.Name - @p.Price.ToString("C")</li>
    }
</ul>

@code {
    private List<Product> products = new()
    {
        new() { Name = "Mechanical Keyboard", Price = 89.99m },
        new() { Name = "USB-C Hub", Price = 34.50m },
        new() { Name = "Laptop Stand", Price = 42.00m },
    };
}
```

*What just happened:* `@foreach` loops over `products`, and the `<li>` inside the braces renders once per item - three products means three `<li>` elements. Exactly how you'd loop in C#, just emitting markup instead of writing to a console.

> 💡 One thing that trips people up: **how do you print a literal `@` sign?** An email address like `you@example.com` in your markup would make Razor think `@example` is C#. Escape it by doubling: `you@@example.com` renders a single `@`.

## Directives: pages vs reusable components

At the very top of a `.razor` file you'll often see lines starting with `@` that aren't expressions - they're **directives**. They configure the component itself rather than rendering anything.

The one you'll meet first is `@page`:

```razor
@page "/products"

<h1>Our Products</h1>

<ul class="product-list">
    @foreach (var p in products)
    {
        <li>@p.Name - @p.Price.ToString("C")</li>
    }
</ul>

@code {
    private List<Product> products = new() { /* ... */ };
}
```

*What just happened:* `@page "/products"` makes this component a **routable page** - navigate to `/products` and Blazor renders it. Without `@page`, a component isn't reachable by URL on its own.

> 📝 The key distinction: a component **with** `@page` is a *page* - it has a URL the router can land on. A component **without** `@page` is a *reusable piece* - `ProductCard` has no URL; you drop its tag inside another component (`<ProductCard />`). Pages are destinations; reusable components are the building blocks assembled inside them. We'll wire data into `<ProductCard Product="p" />` in Phase 6.

Two other directives you'll see soon (don't worry about the details yet):

```razor
@using MyApp.Models
@inject ProductService Products
```

*What just happened:* `@using` imports a namespace, exactly like a `using` at the top of a C# file - write `Product` instead of `MyApp.Models.Product`. `@inject` asks for a service via dependency injection, how a component gets things like an `HttpClient` to load data. Covered properly in [Phase 7: Calling APIs & Dependency Injection](07-calling-apis-and-di.md) - for now, recognize the shape.

## Composing components into a tree

A component becomes useful when other components *use* it. You render one by writing its name as an HTML tag. Here's a products page that uses `ProductCard`:

```razor
@page "/products"

<h1>Our Products</h1>

<div class="grid">
    <ProductCard />
    <ProductCard />
    <ProductCard />
</div>
```

*What just happened:* each `<ProductCard />` tells Blazor to render the `ProductCard` component right there. The page is a component; it contains three `ProductCard` components; each is its own markup-plus-`@code` unit. That nesting **is** the component tree from Phase 1 - a page at the top, smaller components inside it, all the way down. (These three cards show the same hardcoded product for now; passing each its own data is what Phase 6's `Product="p"` parameter does.)

## A note on what "compiled" really means

Something that saves real debugging time once internalized: **Razor is compiled, not interpreted.** Your markup and `@code` block aren't read line-by-line at runtime - they're compiled together into a regular C# class before the app ever runs.

> ⚠️ The practical consequence: **mistakes in Razor are compile errors, not runtime errors.** A mismatched `{ }`, an unclosed tag in a `@foreach`, or a stray `@` where you meant a literal - these stop the build with an error message, same as a typo in any C# file. The compiler catches a whole category of bugs before the page ever loads. When the build fails after editing a `.razor` file, read the error like any C# compile error - it's pointing at your markup.

## Recap

- A **component** is **markup + a `@code` block, compiled into one C# class**; `@` is the bridge from HTML into C#.
- `@expression` renders a value; use `@(...)` when the expression isn't a simple member access; double `@@` to print a literal `@`.
- Control flow is real C# in the markup - `@if`/`@else`, `@foreach`, `@for`, `@switch` - with HTML inside the braces.
- A component **with `@page`** is a routable **page** (it has a URL); a component **without `@page`** is a **reusable piece** you place as a tag, like `<ProductCard />`.
- You compose components by using them as tags; nested tags form the **component tree**.
- Razor **compiles** - brace, tag, and `@` mistakes are **compile errors**, caught at build time, not runtime.

## Quick check

Test the mental model before moving on:

```quiz
[
  {
    "q": "What does a component's @code block hold?",
    "choices": ["The CSS styles for the component", "The component's fields and methods (its C# logic)", "A list of other components to import", "The compiled HTML output"],
    "answer": 1,
    "explain": "The @code block is ordinary C# - fields, methods, and types - that compiles together with the markup into a single class."
  },
  {
    "q": "What is the difference between a component with @page and one without it?",
    "choices": ["@page makes it run on the server instead of WebAssembly", "@page makes it a routable page with a URL; without it, the component is used as a tag inside other components", "@page is required for every .razor file", "Without @page the component cannot have a @code block"],
    "answer": 1,
    "explain": "@page \"/products\" gives a component a URL the router can land on. Reusable components like ProductCard have no @page - you place them as tags such as <ProductCard />."
  },
  {
    "q": "You have a mismatched brace inside a @foreach loop in your .razor file. When does it surface?",
    "choices": ["At runtime, when the loop first executes", "As a compile error at build time", "Only when a user visits the page", "It is silently ignored and the loop is skipped"],
    "answer": 1,
    "explain": "Razor is compiled, not interpreted. Markup and @code compile into a C# class, so brace and @ mistakes are compile errors caught at build time."
  }
]
```

---

[← Phase 1: What Blazor Is (Server vs WebAssembly)](01-what-blazor-is.md) · [Guide overview](_guide.md) · [Phase 3: Data Binding →](03-data-binding.md)
