---
title: "Components and Templates"
guide: "angular-from-zero"
phase: 2
summary: "Angular templates bind with [property] in and (event) out, branch with @if, and loop with @for plus a mandatory track expression - the modern control flow that replaced *ngIf and *ngFor."
tags: [angular, templates, binding, control-flow, ngfor, ngif]
difficulty: intermediate
synonyms: ["angular template syntax", "angular property binding vs interpolation", "angular @if @for control flow", "ngfor trackby explained", "angular event binding"]
updated: 2026-07-18
---

# Components and Templates

Angular templates are HTML plus two bracket conventions and a block syntax. The brackets carry the
whole binding model: `[square]` means data flowing *into* a DOM property, `(round)` means events
flowing *out*. Once those two register, every Angular template reads left to right - and the modern
`@if`/`@for` blocks (which replaced the older `*ngIf`/`*ngFor` you'll meet in legacy code) read
like the TypeScript around them.

## Interpolation and property binding: data in

```ts
@Component({
  selector: 'app-product',
  template: `
    <h2>{{ name() }}</h2>
    <img [src]="imageUrl()" [alt]="name()" />
    <button [disabled]="!inStock()">Buy</button>
  `,
})
export class Product {
  name = signal('Kettle');
  imageUrl = signal('/kettle.jpg');
  inStock = signal(true);
}
```

*What just happened:* `{{ expr }}` interpolates into text. `[src]="expr"` binds a DOM *property*
to an expression - re-evaluated whenever the signals it reads change. Without the brackets,
`disabled="false"` would set a plain HTML attribute to the literal string `"false"` - which, for
boolean attributes, means *disabled* (the string is truthy). The brackets are the difference
between "this text" and "this expression, kept live" - the same string-vs-expression rule as every
framework, wearing square brackets.

Class and style get ergonomic forms you'll use daily: `[class.active]="isActive()"` toggles one
class by boolean; `[style.width.px]="size()"` binds one style with units.

## Event binding: actions out

```ts
template: `
  <button (click)="addToCart(product().id)">Add</button>
  <input (input)="onSearch($event)" />
  <form (submit)="save(); $event.preventDefault()">...</form>
`
```

*What just happened:* `(click)="..."` runs the statement when the event fires - a method call,
usually. `$event` is the native event object when you need it. Like Vue's compiled templates (and
unlike JSX), writing the call with parentheses is correct - it runs on the event, not during
render; there's no pass-the-function-don't-call-it trap here.

## Branching: @if

```html
@if (cart().length === 0) {
  <p>Your cart is empty.</p>
} @else if (cart().length < 10) {
  <p>{{ cart().length }} items.</p>
} @else {
  <p>Bulk order!</p>
}
```

Block syntax, braces and all, right in the template. A false branch **unmounts** its contents -
DOM gone, component state inside destroyed - the standard conditional-rendering semantics. For
hide-but-keep-alive, bind the class: `[class.hidden]="!open()"` plus a CSS rule.

📝 **Terminology:** legacy spelling: `<p *ngIf="cart.length === 0">` - a "structural directive"
with its asterisk, plus `ng-template` gymnastics for the else branch. The `@if` block does the
same job with less ceremony; codebases are migrating incrementally, so read both fluently.

## Loops: @for and the mandatory track

```html
<ul>
  @for (todo of todos(); track todo.id) {
    <li>{{ todo.text }}</li>
  } @empty {
    <li>Nothing to do.</li>
  }
</ul>
```

*What just happened:* one `<li>` per item, an `@empty` block for the zero case - and a `track`
expression that is **mandatory**. Angular took the identity lesson every framework teaches
(React's `key`, Vue and Svelte's keyed lists) and made it required syntax: `track todo.id` tells
the renderer how to match items across updates, so reorders move DOM instead of rewriting it and
row state stays with its row.

💡 **Key point:** Angular forcing `track` is the framework encoding a decade of production bugs
into the compiler. You can still write `track $index` - and for lists that reorder or delete,
that's the same corruption-by-position bug as an unkeyed list elsewhere, just explicitly chosen.
Track a stable id whenever the list's shape can change. (Legacy spelling: `*ngFor="let t of
todos; trackBy: myTrackFn"` - where `trackBy` was optional, usually omitted, and its omission was
a notorious performance foot-gun on big lists.)

## Two-way on inputs: banana in a box

```ts
import { FormsModule } from '@angular/forms';

@Component({
  imports: [FormsModule],
  template: `
    <input [(ngModel)]="email" placeholder="you@example.com" />
    <p>Signing up: {{ email }}</p>
  `,
})
export class Signup {
  email = '';
}
```

*What just happened:* `[(ngModel)]` - the community reads the syntax as "banana in a box" - is
two-way binding on a form control: value in (`[ ]`), changes out (`( )`), composed. It requires
importing `FormsModule` into the component (note the `imports` array - standalone components
declare their template dependencies, which phase 7 revisits as a classic error source).
`[(ngModel)]` serves simple forms well; Angular's fuller answer for serious forms - reactive
forms - is deferred to a follow-up guide, and phase 8 places it on the map.

## Recap

1. `{{ expr }}` for text; `[prop]="expr"` for live property binding - bare attributes are just
   strings.
2. `(event)="statement"` runs on the event; `$event` is the native object; calls-with-parens are
   correct here.
3. `@if / @else` unmounts on false; `[class.x]` toggles are the keep-alive alternative.
4. `@for (... ; track item.id)` - track is mandatory, and `track $index` on mutable lists is the
   old corruption bug, opted into.
5. Legacy dialect: `*ngIf`/`*ngFor`/`trackBy` - same semantics, older spelling.
6. `[(ngModel)]` gives two-way form binding; it needs `FormsModule` in the component's imports.

```quiz
[
  {
    "q": "A button written as <button disabled=\"false\"> stays disabled. Why?",
    "choices": [
      "Angular inverts boolean attributes by default",
      "Without brackets it's a plain HTML attribute set to the string \"false\", which is truthy - [disabled]=\"false\" binds the expression",
      "disabled requires FormsModule",
      "The component forgot to import CommonModule"
    ],
    "answer": 1,
    "why": [
      "Angular doesn't touch bare attributes at all - that's the point: without brackets, the framework isn't involved.",
      null,
      "FormsModule powers ngModel, not native attributes.",
      "No module fixes a binding that was never a binding."
    ],
    "explain": "Square brackets mean 'evaluate this expression and bind the DOM property.' Without them you wrote static HTML, and any non-empty string on a boolean attribute means true."
  },
  {
    "q": "Why did Angular make the track expression in @for mandatory rather than optional like the old trackBy?",
    "choices": [
      "To make templates more verbose for readability",
      "Item identity is what lets the renderer move DOM instead of rewriting it - optional trackBy was omitted so often it became a chronic performance and state bug",
      "track is needed for TypeScript type inference",
      "It replaces the need for @empty blocks"
    ],
    "answer": 1,
    "why": [
      "Verbosity is a cost here, paid deliberately for correctness.",
      null,
      "Types flow from the iterated array either way.",
      "@empty handles the zero case - unrelated to identity."
    ],
    "explain": "Every framework needs list identity (React keys, Vue/Svelte keyed each). Angular's old optional trackBy was chronically skipped, so the modern syntax makes the identity decision explicit and required."
  },
  {
    "q": "In an Angular template, (click)=\"remove(item.id)\" - does the call run during rendering, like it would in JSX?",
    "choices": [
      "Yes - wrap it in an arrow function to be safe",
      "No - templates are compiled, and the statement runs only when the event fires",
      "Only if the method returns void",
      "It runs once at render and once per click"
    ],
    "answer": 1,
    "why": [
      "Arrow-wrapping is a JSX necessity; here it's just extra characters.",
      null,
      "Return types don't change when template statements execute.",
      "Nothing executes at render - the compiler wires the statement to the event."
    ],
    "explain": "Angular templates (like Vue's) are compiled: the (event) binding is wiring, not evaluation. The call-during-render trap belongs to JSX, where braces hold live JavaScript."
  }
]
```

---

[← Phase 1: What Angular Actually Is](01-what-angular-actually-is.md) · [Guide overview](_guide.md) · [Phase 3: Signals →](03-signals.md)
