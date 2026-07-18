---
title: "When Angular Breaks"
guide: "angular-from-zero"
phase: 7
summary: "Angular's NG-numbered errors decoded: unknown elements from missing imports, injection context violations, signal-write guards, dialect mismatches, and the subscription leak - each with its calm fix."
tags: [angular, errors, debugging, ng8001, ng0203]
difficulty: intermediate
synonyms: ["ng8001 is not a known element", "ng0203 inject must be called", "angular signal error in effect", "angular common errors", "expressionchangedafterithasbeencheckederror"]
updated: 2026-07-18
---

# When Angular Breaks

Angular fails loudly and bureaucratically: errors arrive with NG-numbers, long names, and - once
you can read them - unusually precise diagnoses. That's the good news: where our Vue and Svelte
phases hunted *silent* failures, most Angular failures announce themselves. The skill is
translation, and the translations cluster around the same handful of causes.

## The cheat-card

| Symptom / message | Almost always means | Fix |
|---|---|---|
| **NG8001: 'app-x' is not a known element** | Component used in a template but not in the `imports` array | Add it to the standalone component's `imports` |
| **NG0203: inject() must be called from an injection context** | `inject()` in a handler, timeout, or lifecycle body | Move to a field initializer or constructor (phase 5) |
| **NullInjectorError: No provider for X** | Service/feature never registered | `providedIn: 'root'` on the service, or the `provideX()` bootstrap call (e.g. `provideHttpClient()`) |
| **Signal write error inside effect/computed** | Deriving state with an effect, or mutating inside `computed` | It's a `computed` (phase 3); keep derivations pure |
| Template shows `() => ...` or `[object Object]` | Interpolating the signal/observable itself | Call the signal (`{{ x() }}`); pipe the observable (`{{ x$ \| async }}`) |
| `{{ title() }}` throws "title is not a function" | Calling a *legacy* decorator input like a signal | Check the dialect: `@Input()` fields read without parens (phase 4) |
| Screen updates late or only after clicking elsewhere | Mutating an object/array in place, or zone-era code paths | Return fresh references from `update` (phase 3) |
| Rows shuffle state after delete/reorder | `track $index` on a mutable list | `track item.id` (phase 2) |
| Callbacks firing on destroyed components | Manual `subscribe` without a lifetime | `toSignal`/`async` pipe, or `takeUntilDestroyed` (phase 6) |
| **ExpressionChangedAfterItHasBeenCheckedError** | Legacy zone-era code changing state mid-check | In new code, move the write out of rendering paths; in old code, see below |

Three of these deserve the walk-through.

## NG8001: the standalone tax

```text
NG8001: 'app-product-card' is not a known element
```

The single most common error in modern Angular, and it's a feature wearing an error's clothing.
Standalone components declare their template dependencies explicitly:

```ts
@Component({
  selector: 'app-products-page',
  imports: [ProductCard],        // ← without this line: NG8001
  template: `<app-product-card [price]="4900" name="Kettle" />`,
})
```

*Why it exists:* in the NgModule era, anything declared in the module was visible to every
component in it - convenient, and impossible to tell what any single component actually used.
Standalone flips that: each component's `imports` array is its complete dependency list. The error
is the compiler asking you to finish the sentence. Same cure for pipes and directives
(`imports: [DatePipe, FormsModule]`) - if the template uses it, the component imports it.

## The dialect mismatch pair

Phase 4 planted the flag; here's how it looks when it goes off. Two mirror-image errors:

- **`title is not a function`** - template says `{{ title() }}`, but this component declares
  `@Input() title: string`. Legacy inputs are plain fields: drop the parens.
- **`[object Object]` or a function body on screen** - template says `{{ count }}`, but `count`
  is a signal. Interpolating the signal object prints it; *calling* it reads it: `{{ count() }}`.

Neither is subtle once you know the tell: **before editing any component, check its dialect** -
signal functions (`input()`, `signal()`) mean parens in the template; decorators (`@Input()`) mean
none. Mixed teams migrating incrementally hit these weekly, and they're ten-second fixes with the
habit installed.

## The legacy ghost: ExpressionChangedAfterItHasBeenCheckedError

You'll meet this one in older codebases, and its infamy is why it earns a section even in a
modern guide. Zone-era Angular checked every binding after every event - then, in development
mode, checked *again* to verify nothing changed mid-check. Code that wrote state during rendering
(a getter with a side effect, a child mutating a parent's value during init) failed that second
check and produced this error - Angular's bluntest statement of the universal rule that
**rendering must not change state**.

In signal-era code the same sin surfaces earlier and clearer (the signal-write guards from
phase 3). If you hit the legacy error in old code: find the write that happens during change
detection - the error message names the binding - and move it into an event handler, lifecycle
hook, or effect. The bug is always the write's *timing*, never the value.

## Reading NG errors like a local

- **The number is a documentation key.** Every NG-code has a page at `angular.dev/errors/NG8001`
  (swap the code) with causes and fixes - among the best error docs in the industry. Paste the
  code before pasting the stack trace into a search engine.
- **Read the template position.** Compile-time errors point at file, line, and column *in the
  template* - the answer is usually at that exact spot, not in the TypeScript.
- **Trust the compiler's strictness.** A large share of "Angular is fighting me" moments are the
  type system catching a real mismatch early - `input.required` missing, a wrong payload type on
  an output. The fight is the feature.

## Recap

1. NG8001 = the template uses something the component didn't import - standalone components list
   their dependencies, completely.
2. NG0203 = `inject()` outside construction; NullInjectorError = nothing registered - both are
   DI's rules, not mysteries.
3. Dialect tells: signals read with parens, decorator inputs without - check before editing.
4. Signal-write guards and the legacy ExpressionChanged error enforce one law: rendering never
   writes state.
5. NG-numbers are lookup keys at angular.dev/errors - translate first, debug second.

```quiz
[
  {
    "q": "NG8001: 'app-star-rating' is not a known element - but the component definitely exists and compiles. What's missing?",
    "choices": [
      "The selector must start with a capital letter",
      "StarRating isn't in the using component's imports array - standalone components declare their template dependencies explicitly",
      "The component needs providedIn: 'root'",
      "star-rating.ts must be renamed to match the selector"
    ],
    "answer": 1,
    "why": [
      "Selectors are kebab-case by convention - casing isn't the issue.",
      null,
      "providedIn registers services with the injector; components enter templates through imports.",
      "File names are free - the compiler resolves classes, not paths-by-convention."
    ],
    "explain": "A standalone component's imports array is its complete template vocabulary. Existing and compiling isn't enough - the using component must import it."
  },
  {
    "q": "A migrated-halfway codebase shows {{ count }} rendering as [object Object] in one component and {{ title() }} throwing in another. What single habit prevents both?",
    "choices": [
      "Always use parentheses in templates",
      "Check each component's dialect first: signal declarations mean parens, decorator inputs mean none",
      "Convert every component to signals before touching templates",
      "Use the async pipe for all bindings"
    ],
    "answer": 1,
    "why": [
      "Parens on a legacy field is exactly one of the two crashes.",
      null,
      "A full migration is the long-term fix, not the habit that keeps you safe on Tuesday.",
      "The async pipe unwraps observables - neither of these is one."
    ],
    "explain": "The two errors are mirror images of one mismatch. Ten seconds of checking whether the class says signal()/input() or @Input() tells you exactly how the template must read it."
  },
  {
    "q": "In a legacy codebase, ExpressionChangedAfterItHasBeenCheckedError appears in development. What is Angular fundamentally objecting to?",
    "choices": [
      "The component tree is too deep",
      "Some code changed bound state during change detection - rendering must not write state",
      "zone.js is missing from the build",
      "A signal was read without being called"
    ],
    "answer": 1,
    "why": [
      "Depth is irrelevant - timing of a write is the whole story.",
      null,
      "This error comes FROM zone-era checking - its absence would preclude it.",
      "That produces the [object Object] display, not this error."
    ],
    "explain": "The dev-mode double check exists to catch writes that happen mid-render. Find the write the message names and move it to a handler, hook, or effect - same law signals now enforce upfront."
  }
]
```

---

[← Phase 6: HTTP and Just Enough RxJS](06-http-and-just-enough-rxjs.md) · [Guide overview](_guide.md) · [Phase 8: Where to Go Next →](08-where-to-go-next.md)
