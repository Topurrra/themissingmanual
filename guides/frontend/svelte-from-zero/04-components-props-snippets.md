---
title: "Components: Props, Callbacks, and Snippets"
guide: "svelte-from-zero"
phase: 4
summary: "$props() receives typed inputs, callback props carry events up, $bindable opts into two-way binding, and snippets pass markup into components the way slots used to."
tags: [svelte, components, props, snippets, bindable, callbacks]
difficulty: beginner
synonyms: ["svelte 5 props rune", "svelte callback props vs dispatch", "svelte snippets vs slots", "svelte bindable prop", "svelte component events"]
updated: 2026-07-18
---

# Components: Props, Callbacks, and Snippets

A `.svelte` file is already a component; using one is an import and a tag. This phase is the
interface layer: data in (`$props`), events out (callback props), two-way when explicitly agreed
(`$bindable`), and markup in (snippets). If you've read the React or Vue guides, the shape is
familiar - Svelte's version is notable mostly for how little of it there is.

## $props: declared inputs

```html
<!-- ProductCard.svelte -->
<script>
  let { name, price, inStock = true } = $props();
</script>

<article class:dimmed={!inStock}>
  <h3>{name}</h3>
  <p>{(price / 100).toFixed(2)} €</p>
</article>
```

```html
<!-- parent -->
<script>
  import ProductCard from '$lib/ProductCard.svelte';
</script>

<ProductCard name="Kettle" price={4900} inStock={false} />
```

*What just happened:* `$props()` returns the props object, destructured with defaults in the
declaration - one line documents the component's inputs. Attributes pass strings; `{expressions}`
pass everything else - the same string-vs-expression rule as every framework, same
`price="4900"`-is-a-string trap included.

Wait - phase 2 said destructuring kills reactivity. `$props()` is the sanctioned exception: the
compiler treats these destructured names specially, keeping them live as the parent re-renders.
Rune magic, but *declared* magic, in the one place it's guaranteed.

Props are the parent's data on loan: assigning to a prop from inside the child triggers a runtime
warning (`ownership_invalid_mutation`) rather than silently diverging. The child's channel for
change requests is the next section. With TypeScript, type the destructure and the contract is
checked at build time:

```ts
let { name, price, inStock = true }: { name: string; price: number; inStock?: boolean } = $props();
```

## Events up: callback props

Svelte 5 dropped its old event-dispatch system for something with zero new concepts: **a callback
is just a prop that happens to be a function.**

```html
<!-- ProductCard.svelte -->
<script>
  let { name, price, onAddToCart } = $props();
</script>

<article>
  <h3>{name}</h3>
  <button onclick={() => onAddToCart(1)}>Add</button>
</article>
```

```html
<!-- parent -->
<ProductCard name="Kettle" price={4900} onAddToCart={qty => cart.add('kettle', qty)} />
```

*What just happened:* data down, function down, call up - the React pattern, name and all. The
child announces intent by calling; the parent decides what it means. Legacy note: older code does
this with `createEventDispatcher()` and `on:addToCart` listeners - deprecated but everywhere in
the wild; mentally translate `dispatch('x', detail)` to `onX(detail)`.

## $bindable: two-way, by consent

Sometimes parent and child genuinely co-own a value - a search input component, a rating widget.
Svelte allows `bind:` on component props, but only if the child *opts in*:

```html
<!-- StarRating.svelte -->
<script>
  let { value = $bindable(0) } = $props();
</script>

{#each [1, 2, 3, 4, 5] as n}
  <button onclick={() => value = n}>{n <= value ? '★' : '☆'}</button>
{/each}
```

```html
<!-- parent -->
<StarRating bind:value={rating} />
```

*What just happened:* `$bindable` marks the prop as writable-from-within; the parent's `bind:`
links it to their own state. Without the rune, `bind:` on that prop is a compile error - two-way
flow exists, but it's a declared contract, never an ambush. Use it for genuine form-like
components; everywhere else, callbacks keep the data flow one-way and traceable.

## Snippets: markup as a prop

The composition mechanism - a Card owning the frame while callers own the contents:

```html
<!-- Card.svelte -->
<script>
  let { title, children } = $props();
</script>

<section class="card">
  <h2>{title}</h2>
  {@render children()}
</section>
```

```html
<!-- parent -->
<Card title="Danger zone">
  <p>Deleting your account is permanent.</p>
  <button onclick={confirmDelete}>Delete</button>
</Card>
```

*What just happened:* content nested inside `<Card>` arrives as `children` - a **snippet**, a
chunk of renderable markup passed as a prop - and `{@render children()}` places it. For multiple
outlets, declare named snippets explicitly:

```html
<!-- parent -->
<PageLayout>
  {#snippet header()}<h1>Orders</h1>{/snippet}
  {#snippet footer()}<small>Updated hourly.</small>{/snippet}
  Order list goes here.
</PageLayout>

<!-- PageLayout.svelte -->
<script>
  let { header, footer, children } = $props();
</script>
<header>{@render header?.()}</header>
<main>{@render children()}</main>
<footer>{@render footer?.()}</footer>
```

The `?.()` renders the snippet only if the caller provided it - optional outlets in one character.
And because snippets are functions, they take parameters: a list component can hand each item back
to caller-supplied markup - `{#snippet row(item)}` in the parent, `{@render row(item)}` in the
child - which is the scoped-slot pattern with plain function semantics instead of new syntax.

📝 **Terminology:** legacy Svelte does all this with `<slot>` / `<slot name="x">` elements, like
Vue. Snippets replaced slots in the runes dialect; both render fine today, and the translation is
mechanical: default slot ↔ `children`, named slot ↔ named snippet, slot props ↔ snippet
parameters.

## Recap

1. `let { x, y = default } = $props()` - the one sanctioned reactive destructure; type it with TS
   for a checked contract.
2. Events are callback props: `onAddToCart={fn}` down, `onAddToCart(payload)` up. Dispatcher code
   is legacy.
3. `bind:` on a component prop requires the child's `$bindable` - two-way by explicit consent.
4. Snippets pass markup: `children` implicitly, `{#snippet name()}` for multiple outlets,
   parameters for the scoped case, `{@render x?.()}` for optional ones.
5. Props are on loan - mutating them warns; call the callback instead.

```quiz
[
  {
    "q": "In Svelte 5, how does a child tell its parent the user clicked Save?",
    "choices": [
      "createEventDispatcher and dispatch('save')",
      "Call the onSave function the parent passed as a prop",
      "Mutate a $bindable flag the parent watches",
      "Emit through a shared store"
    ],
    "answer": 1,
    "why": [
      "That's the deprecated legacy system - still read it in old code, don't write it.",
      null,
      "Bindable exists for co-owned values, not event signaling - a save click is intent, not shared state.",
      "A store for a parent-child signal is global machinery for a local conversation."
    ],
    "explain": "Svelte 5 events-up are just function props: the parent hands down onSave, the child calls it with any payload. No dispatcher concept needed."
  },
  {
    "q": "bind:query={search} on your SearchBox component fails to compile. What's missing?",
    "choices": [
      "The parent must also declare $bindable",
      "The child must declare the prop as query = $bindable() - two-way binding requires the child's opt-in",
      "bind: only works on DOM elements, never components",
      "The prop must be named value for binding to work"
    ],
    "answer": 1,
    "why": [
      "The parent's side is just bind: - the consent lives in the child's declaration.",
      null,
      "Component binding is fully supported - gated behind $bindable.",
      "Any prop name binds, once bindable."
    ],
    "explain": "Two-way flow is a contract both sides sign: the child marks the prop $bindable, then the parent may bind:. Without the rune, the compiler refuses - no accidental two-way."
  },
  {
    "q": "A Table component should let callers control each row's markup while it handles sorting and pagination. Which mechanism fits?",
    "choices": [
      "A rowHtml string prop the caller formats",
      "A snippet parameter: the caller passes {#snippet row(item)}, the Table does {@render row(item)} per item",
      "A $bindable rows prop",
      "The caller wraps the Table and renders rows above it"
    ],
    "answer": 1,
    "why": [
      "HTML strings mean no reactivity, no components inside rows, and an injection footgun.",
      null,
      "Bindable shares a value both ways - it can't carry markup.",
      "Then the Table isn't rendering the rows at all, so its sorting and pagination decorate nothing."
    ],
    "explain": "Snippets with parameters are the scoped-slot pattern: the child owns iteration and logic, hands each item back to caller-supplied markup. Composition without new syntax - snippets are functions."
  }
]
```

---

[← Phase 3: Template Logic](03-template-logic.md) · [Guide overview](_guide.md) · [Phase 5: Sharing State →](05-sharing-state.md)
