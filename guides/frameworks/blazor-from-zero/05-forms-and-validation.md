---
title: "Forms & Validation"
guide: "blazor-from-zero"
phase: 5
summary: "Build a product create/edit form with EditForm, the built-in input components, and DataAnnotationsValidator - wiring model annotations to validation messages and the OnValidSubmit event."
tags: [blazor, csharp, forms, validation, editform]
difficulty: intermediate
synonyms: ["blazor editform", "blazor validation", "blazor dataannotationsvalidator", "blazor inputtext inputnumber", "blazor validationmessage", "blazor onvalidsubmit"]
updated: 2026-07-10
---

# Forms & Validation

Sooner or later your products UI needs a real form - a screen where someone types a product name, a price, and hits **Save**. The moment you have a form, you have a second job: stopping bad data before it reaches your database. Empty names. Negative prices. A description three paragraphs longer than your column allows.

You could wire all that by hand - track every input, check every value on submit, render every error message yourself. People did, for years. Blazor gives you a system instead, and once you see its shape, you won't want to go back.

## The mental model: a form is a model with a guard

Here's the one idea to hold. In Blazor, **a form is built around a model object** - a plain C# class holding the data being edited. The `<EditForm>` component wraps that model and quietly tracks its state: which fields changed, which are valid, whether the whole thing is ready to submit. That tracking object is the **`EditContext`**, and Blazor creates it the instant you hand `EditForm` a model.

Three moving parts, and they all point at the same model:

1. **The model** - a class with your fields (`Name`, `Price`) plus *annotations* that describe the rules (`[Required]`, `[Range]`).
2. **The inputs** - components like `InputText` that bind to model properties, so typing updates the model and the model updates the screen.
3. **The validator** - a component that reads the model's annotations and decides, field by field, whether the data is valid.

> 💡 The shape to keep in your head: *inputs write to the model, the validator checks the model, the form submits the model.* Everything in this phase is one of those three roles.

Let's build it up piece by piece, using a product form.

## EditForm and the input components

Start with the container. `EditForm` needs a `Model` - the object it's editing - and a handler for when the form is submitted successfully.

```razor
<EditForm Model="@product" OnValidSubmit="Save">
    <label>
        Name
        <InputText @bind-Value="product.Name" />
    </label>

    <label>
        Price
        <InputNumber @bind-Value="product.Price" />
    </label>

    <button type="submit">Save</button>
</EditForm>

@code {
    private ProductForm product = new();

    private void Save()
    {
        // product.Name and product.Price are filled in from the inputs.
    }
}

public class ProductForm
{
    public string Name { get; set; } = "";
    public decimal Price { get; set; }
}
```

*What just happened:* `EditForm` rendered a real HTML `<form>` and built an `EditContext` around `product`. Each input is a **built-in Blazor component** - not a raw `<input>` - and `@bind-Value="product.Name"` is two-way binding (the same `@bind` idea from [Phase 3](03-data-binding.md), here named `Value` because that's the input's parameter). Type in the box, `product.Name` updates; change it in code, the box updates. Click Save, and `OnValidSubmit` runs your `Save` method with the model already populated.

Blazor ships an input component for each common field type. You bind every one of them with `@bind-Value`:

| Component | For |
|-----------|-----|
| `InputText` | single-line text |
| `InputTextArea` | multi-line text |
| `InputNumber` | numeric types (`int`, `decimal`, …) |
| `InputSelect` | dropdowns (`<option>` children) |
| `InputCheckbox` | booleans |
| `InputDate` | dates (`DateTime`, `DateOnly`) |
| `InputRadioGroup` | a set of radio buttons |

> 📝 Why use these instead of plain `<input>` tags? Because the built-in components plug into the `EditContext`. They report changes back to it, and - crucially for the next section - they know how to show themselves as invalid. A raw `<input>` is just HTML; it's outside the form's awareness.

## Validation: annotations plus a validator

Right now nothing stops a user from saving an empty name or a price of negative ten. Let's add rules.

Rules live as **data annotation attributes** on the model. They're declarative - you describe the constraint, not the checking code:

```csharp
using System.ComponentModel.DataAnnotations;

public class ProductForm
{
    [Required(ErrorMessage = "A product needs a name.")]
    [StringLength(120)]
    public string Name { get; set; } = "";

    [Range(0, 100000, ErrorMessage = "Price must be between 0 and 100,000.")]
    public decimal Price { get; set; }
}
```

*What just happened:* nothing yet - that's the whole catch. `[Required]`, `[StringLength]`, and `[Range]` are passive metadata, sitting on the class doing nothing until something reads them. Common annotations: `[Required]`, `[StringLength(max)]`, `[Range(min, max)]`, `[EmailAddress]`.

> ⚠️ The annotations alone do **nothing**. They're inert until you place a `<DataAnnotationsValidator />` inside the `EditForm`. This is the single most common Blazor forms mistake - a form that "ignores" its rules almost always means the validator component is missing. Attributes describe the rules; the component enforces them.

So you add the validator, plus a way to show the errors. `<ValidationSummary />` lists every error at once; `<ValidationMessage For="..." />` shows the error for one specific field, right next to it. Here's the full, working form:

```razor
@using System.ComponentModel.DataAnnotations

<EditForm Model="@product" OnValidSubmit="Save">
    <DataAnnotationsValidator />
    <ValidationSummary />

    <label>
        Name
        <InputText @bind-Value="product.Name" />
        <ValidationMessage For="@(() => product.Name)" />
    </label>

    <label>
        Price
        <InputNumber @bind-Value="product.Price" />
        <ValidationMessage For="@(() => product.Price)" />
    </label>

    <button type="submit">Save</button>
</EditForm>

@code {
    private ProductForm product = new();

    private void Save()
    {
        // We only get here if every annotation passed.
    }
}

public class ProductForm
{
    [Required(ErrorMessage = "A product needs a name.")]
    [StringLength(120)]
    public string Name { get; set; } = "";

    [Range(0, 100000)]
    public decimal Price { get; set; }
}
```

*What just happened:* `<DataAnnotationsValidator />` hooked into the `EditContext` and started reading the model's annotations. When the user edits a field or tries to submit, it validates against the rules and marks fields valid or invalid. `<ValidationSummary />` renders the full error list near the top; each `<ValidationMessage For="@(() => product.Name)" />` renders just that field's error inline. The `For` argument is a lambda that *points at* the property - how the message component knows which field it represents.

> 💡 Look closely at `ProductForm`: a plain class with `[Required]` and `[Range]` - the **exact same** `System.ComponentModel.DataAnnotations` attributes you'd put on an ASP.NET Core DTO or an EF Core entity. The knowledge transfers directly - if you've validated a request body in a Web API, you already know how to validate a Blazor form.

## Submit events: OnValidSubmit vs OnSubmit

`EditForm` gives you three submit events. Pick based on who does the validating.

- **`OnValidSubmit`** - fires *only* when validation passes. The one you'll reach for most: by the time your handler runs, the model is guaranteed valid, so you save straight away. (Pair it with `OnInvalidSubmit` to react to *failed* attempts - say, scroll to the first error.)
- **`OnSubmit`** - fires on *every* submit, valid or not. Blazor won't gate the handler; *you* call validation yourself and decide what to do.

You almost always want the first. Here's the contrast:

```razor
@* Clean path: handler only runs on valid data *@
<EditForm Model="@product" OnValidSubmit="Save" OnInvalidSubmit="ShowProblems">
    <DataAnnotationsValidator />
    <!-- inputs… -->
    <button type="submit">Save</button>
</EditForm>

@* Manual path: you validate, you decide *@
<EditForm Model="@product" OnSubmit="HandleEverything">
    <DataAnnotationsValidator />
    <!-- inputs… -->
    <button type="submit">Save</button>
</EditForm>

@code {
    private ProductForm product = new();

    private void Save() { /* product is valid - persist it */ }
    private void ShowProblems() { /* at least one field failed */ }

    private void HandleEverything(EditContext ctx)
    {
        if (ctx.Validate())
        {
            // valid - go ahead
        }
        // ctx tells you the state; you choose what happens next
    }
}
```

*What just happened:* the first form splits the two outcomes cleanly - `Save` for success, `ShowProblems` for failure - and you never write an `if` to check validity. The second routes everything through one handler receiving the `EditContext`; you call `ctx.Validate()` yourself and branch on the result. Use `OnSubmit` only when you need that manual control; for ordinary save-this-product forms, `OnValidSubmit` is less code and harder to get wrong.

> 💡 Data annotations are perfect for field-level rules. For richer logic - "this field is required *only if* that other one is set," cross-field comparisons - reach for **FluentValidation**, which has community Blazor integrations slotting into the same `EditContext`. Start with annotations; graduate when the rules outgrow attributes.

## Recap

- A Blazor form is built around a **model object**; `<EditForm Model="@model">` wraps it and tracks its state in an `EditContext`.
- Use the **built-in input components** (`InputText`, `InputNumber`, `InputSelect`, …) and bind them with `@bind-Value` so they participate in the form's validation.
- Validation rules are **data annotations** (`[Required]`, `[StringLength]`, `[Range]`, `[EmailAddress]`) on the model - the same attributes you'd use on an ASP.NET Core DTO.
- Annotations do nothing on their own: you **must** add `<DataAnnotationsValidator />` inside the form, then show errors with `<ValidationSummary />` and `<ValidationMessage For="@(() => model.Field)" />`.
- Prefer **`OnValidSubmit`** (runs only when valid); use `OnSubmit` when you want to call `EditContext.Validate()` and handle outcomes manually. For complex rules, consider FluentValidation.

## Quick check

```quiz
[
  {
    "q": "You added [Required] and [Range] to your model, but the form saves invalid data anyway. What's the most likely cause?",
    "choices": ["The model class is in the wrong namespace", "There's no <DataAnnotationsValidator /> inside the EditForm", "You used InputText instead of a plain <input>", "OnValidSubmit doesn't support validation"],
    "answer": 1,
    "explain": "Data annotations are inert metadata. Nothing checks them until a <DataAnnotationsValidator /> component is placed inside the EditForm."
  },
  {
    "q": "How do you bind a built-in input component to a model property?",
    "choices": ["value=\"product.Name\"", "@bind=\"product.Name\"", "@bind-Value=\"product.Name\"", "Model=\"product.Name\""],
    "answer": 2,
    "explain": "Built-in input components expose a Value parameter, so two-way binding uses @bind-Value=\"product.Name\"."
  },
  {
    "q": "You want a handler that runs only when the form's data passes validation. Which event do you use?",
    "choices": ["OnSubmit", "OnInvalidSubmit", "OnValidSubmit", "OnChange"],
    "answer": 2,
    "explain": "OnValidSubmit fires only after validation succeeds, so the model is guaranteed valid inside the handler - no manual check needed."
  }
]
```

---

[← Phase 4: Events & the Component Lifecycle](04-events-and-lifecycle.md) · [Guide overview](_guide.md) · [Phase 6: Component Communication & State →](06-communication-and-state.md)
