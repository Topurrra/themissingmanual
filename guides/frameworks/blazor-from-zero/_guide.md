---
title: "Blazor From Zero"
guide: "blazor-from-zero"
phase: 0
summary: "Learn to build interactive web UIs in C# instead of JavaScript: components and Razor, the Server vs WebAssembly hosting models, data binding, events and the component lifecycle, forms and validation, component communication and state, and calling APIs with dependency injection. Microsoft's answer to single-page apps, taught mental-model-first."
tags: [blazor, csharp, dotnet, web, components, ui, razor, webassembly]
category: frameworks
order: 29
group: "C#"
difficulty: intermediate
synonyms: ["learn blazor", "blazor tutorial", "blazor components", "blazor server vs webassembly", "blazor data binding", "razor components", "blazor forms validation", "csharp web ui", "blazor lifecycle"]
updated: 2026-06-23
---

# Blazor From Zero

Blazor lets you build interactive web front-ends in **C# instead of JavaScript**. If you live in the .NET
world, that's a genuinely big deal: the same language, types, and tooling you use on the server now drive
the browser UI too — components, data binding, events, forms, the lot. It's Microsoft's answer to the
single-page-app frameworks (React, Vue, Angular), and it shares their core idea: a UI built from reusable,
self-contained **components** that re-render when their data changes.

The mental model is one unit and one hosting choice. The unit is the **component** — a `.razor` file that
mixes HTML markup with C# logic (in an `@code` block) and re-renders when its **state** changes. The
choice is **where that C# runs**: **Blazor Server** runs it on the server and streams UI updates to the
browser over a live connection, while **Blazor WebAssembly** ships a .NET runtime to the browser and runs
the C# there. Same components, same code — different trade-offs (covered in Phase 1). Hold "the UI is a
tree of components that re-render on state change, and you pick where the C# executes," and Blazor clicks.

> 📝 This teaches the **framework** — it assumes you know **C#** (classes, `async`/`await`, events,
> generics — [C# From Zero](/guides/csharp-from-zero)) and basic **HTML/CSS**. It pairs with
> [ASP.NET Core](/guides/aspnet-core-from-zero) (which hosts it and serves the APIs it calls). The
> component model echoes the JS frameworks ([What a Framework Even Is](/guides/what-a-framework-even-is)).
> Blazor compiles and runs as a .NET app, so examples are shown with the commands to run them.

## How to read this

Read in order — it grows from a single component to a small **products** UI that talks to an API. Phases
carry difficulty badges.

## The phases

**Part 1 — Components (🟢 Basic → 🟡)**
1. **[What Blazor Is (Server vs WebAssembly)](01-what-blazor-is.md)** 🟢 — components, the two hosting models, and a running app.
2. **[Components & Razor](02-components-and-razor.md)** 🟡 — `.razor` files, markup + `@code`, and rendering.
3. **[Data Binding](03-data-binding.md)** 🟡 — `@bind`, one-way vs two-way, and reacting to state.

**Part 2 — Interactivity (🟡 → 🔴)**
4. **[Events & the Component Lifecycle](04-events-and-lifecycle.md)** 🟡 — `@onclick`, `OnInitialized`/`OnParametersSet`, and `StateHasChanged`.
5. **[Forms & Validation](05-forms-and-validation.md)** 🟡 — `EditForm`, data annotations, and validation messages.
6. **[Component Communication & State](06-communication-and-state.md)** 🔴 — `[Parameter]`, `EventCallback`, cascading values, and shared state.

**Part 3 — Real apps (🔴 → 🟢)**
7. **[Calling APIs & Dependency Injection](07-calling-apis-and-di.md)** 🔴 — `@inject`, `HttpClient`, and loading data from a backend.
8. **[Where to Go Next](08-where-to-go-next.md)** 🟢 — Blazor vs React/Angular, the render modes, and what to build.

> The throughline: a Blazor app is a **tree of components that re-render when their state changes**, and
> you choose **where the C# runs** (server or WebAssembly). Everything else is detail on those two ideas.

---

[Phase 1: What Blazor Is (Server vs WebAssembly) →](01-what-blazor-is.md)
