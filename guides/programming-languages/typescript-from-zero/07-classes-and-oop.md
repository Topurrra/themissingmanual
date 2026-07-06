---
title: "Classes & OOP in TypeScript - Types on Objects With Behavior"
guide: "typescript-from-zero"
phase: 7
summary: "JavaScript already has classes; TypeScript adds a type layer - field types, visibility, and contracts. Learn typed fields, access modifiers, parameter properties, readonly, getters/setters, and implements vs abstract."
tags: [typescript, classes, oop, access-modifiers, implements, abstract, parameter-properties, inheritance]
difficulty: intermediate
synonyms: ["typescript classes explained", "typescript access modifiers private public", "typescript implements interface", "typescript abstract class", "typescript parameter properties", "typescript readonly class field", "typescript constructor shorthand"]
updated: 2026-06-22
---

# Classes & OOP in TypeScript - Types on Objects With Behavior

You already know what a class *is*. Over in [JavaScript from Zero](/guides/javascript-from-zero) you saw the reveal: a `class` in JavaScript isn't a new kind of thing - it's nicer syntax over prototypes, a function whose `.prototype` is pre-loaded with your methods. None of that changes in TypeScript; the runtime is still the same JavaScript runtime.

**TypeScript doesn't give classes new powers - it adds a type layer on top of the class you already know:** field types, visibility rules, and contracts that say "this class must match that shape." All of it is checked before your code runs, and most is *erased* before it ships. The class that lands in the browser is plain JavaScript; the types were a conversation between you and the checker.

One honest caveat: TypeScript leans functional, so you won't reach for classes as often as in Java or C#. They earn their keep in two places - **stateful objects** (data and behavior bundled together, like an account) and **implementing an interface** (when something else expects a specific shape). That's where we'll focus.

## Typed fields and a typed constructor

A class field gets a type, exactly like a variable, and constructor parameters get types too. The payoff is the same as everywhere else: the checker knows what each field holds, so it catches you the moment you misuse one.

📝 **Field (class property)** - a piece of data living on each instance. Declare it with a name and type at the top of the class body, and the checker enforces that type everywhere the field is read or written.

```typescript
class Account {
  owner: string;
  balance: number;

  constructor(owner: string, initial: number) {
    this.owner = owner;
    this.balance = initial;
  }

  deposit(amount: number): void {
    this.balance += amount;
  }
}

const acct = new Account("Ada", 100);
acct.deposit(50);
console.log(acct.balance); // 150

acct.balance = "lots"; // Error
```
```console
Type 'string' is not assignable to type 'number'.
```
*What just happened:* We declared two fields with types - `owner: string` and `balance: number` - in the class body, so the checker knows the shape of every `Account`. The constructor takes typed parameters and assigns them to `this.owner` and `this.balance`; the checker verifies the types line up. `deposit` takes a `number` and returns nothing (`void`). Everything works until the last line, where assigning a string to a `number` field gets flagged at edit-time.

💡 **Key point.** Declaring fields with types is the whole reason to bother. Without it, `this.balance` would be an untyped free-for-all and a typo like `this.balnce = 50` would silently create a junk property. With it, the checker holds the line on every access.

## Access modifiers - who's allowed to touch a field

By default every field and method is `public` - reachable from anywhere. Two more keywords narrow that so internal state stays internal.

📝 **`public`** - reachable from anywhere (the default; rarely written). **`private`** - reachable only from *inside this class*. **`protected`** - reachable from inside this class *and* its subclasses, but not from outside.

`private` protects invariants: if `balance` can only change through `deposit` and `withdraw`, nobody can reach in and set it to a nonsense value behind your back.

```typescript
class Account {
  private balance: number;

  constructor(initial: number) {
    this.balance = initial;
  }

  deposit(amount: number): void {
    this.balance += amount; // fine - we're inside the class
  }
}

const acct = new Account(100);
console.log(acct.balance); // Error
```
```console
Property 'balance' is private and only accessible within class 'Account'.
```
*What just happened:* `balance` is marked `private`, so the checker allows `this.balance` inside `deposit` (same class) but rejects `acct.balance` from outside. The invariant - "balance only changes through methods" - is now enforced by the type system instead of good intentions.

⚠️ **Gotcha - TypeScript's `private` is a compile-time fiction.** It's checked by the type checker and then *erased*. At runtime the field is an ordinary public property: `(acct as any).balance` reaches it fine, and so does anyone reading the compiled JavaScript. JavaScript has its *own* truly private fields - the `#name` syntax from [JavaScript from Zero](/guides/javascript-from-zero) - enforced by the runtime and genuinely inaccessible from outside. Use TypeScript's `private` for everyday encapsulation, and reach for JS `#private` when you need a *hard* runtime guarantee. Don't mistake `private` for security - it's a design tool, not a lock.

## Parameter properties - the constructor shorthand

Look back at the first `Account`: you name `owner` and `balance` once as fields, *again* as constructor parameters, and a *third* time in the `this.x = x` assignments. That repetition is common enough that TypeScript has a shorthand collapsing all three into one.

📝 **Parameter property** - adding an access modifier (`public`, `private`, `protected`, or `readonly`) to a constructor parameter. TypeScript automatically declares a field of that name and assigns the argument to it: declaration plus assignment, in one place.

```typescript
class Account {
  constructor(
    public owner: string,
    private balance: number,
  ) {}

  deposit(amount: number): void {
    this.balance += amount;
  }
}

const acct = new Account("Ada", 100);
console.log(acct.owner); // "Ada" - public, readable
acct.deposit(50);
```
*What just happened:* Putting `public` on `owner` and `private` on `balance` told TypeScript to create those fields *and* assign the constructor arguments to them - no separate declarations, no `this.owner = owner` lines. `acct.owner` is readable because it's `public`; `balance` is `private` and locked away. Behaviorally identical to the verbose version, with a third of the lines.

💡 **Key point.** Parameter properties are unique to TypeScript and a genuine boilerplate killer - the idiomatic way to write a stateful class whose fields come straight from constructor arguments. The catch: the modifier is *required*. A bare `constructor(owner: string)` is just a normal parameter that vanishes after the constructor runs; it becomes a field only once prefixed with `public`/`private`/`protected`/`readonly`.

## `readonly`, getters and setters

Sometimes a field should be set once and never change - an ID, a creation timestamp. Mark it `readonly` and the checker forbids any write after the constructor.

```typescript
class Account {
  readonly id: string;

  constructor(id: string, private balance: number) {
    this.id = id; // allowed - we're in the constructor
  }

  // a computed, read-only view of internal state
  get summary(): string {
    return `#${this.id}: ${this.balance}`;
  }

  // validated write - guards the invariant
  set deposit(amount: number) {
    if (amount > 0) this.balance += amount;
  }
}

const acct = new Account("A-1", 100);
acct.deposit = 50;          // calls the setter
console.log(acct.summary);  // getter: "#A-1: 150"
acct.id = "A-2";            // Error
```
```console
Cannot assign to 'id' because it is a read-only property.
```
*What just happened:* `readonly id` can be assigned once, inside the constructor, and never again - the final line is flagged. The `get summary()` accessor exposes a *computed* string built from internal state without exposing the fields themselves; read it as `acct.summary` (no parentheses - looks like a field but runs code). The `set deposit(...)` accessor runs validation on assignment, so `acct.deposit = 50` looks like a plain write but invokes a guarded method. Getters and setters are typed like any other member.

## `implements` and `abstract` - contracts and forced shapes

Here's where classes really pull their weight: stating that a class *fulfills a contract*.

📝 **`implements`** - a promise that a class matches an interface's shape. The checker verifies every required member is present with a compatible type. Forget one, or get a type wrong, and it's an error on the class, where you can fix it - not at some distant call site.

```typescript
interface Persistable {
  id: string;
  save(): void;
}

class Account implements Persistable {
  constructor(public id: string, private balance: number) {}

  save(): void {
    console.log(`saving ${this.id}`);
  }
}
```
*What just happened:* `Account implements Persistable` tells the checker "verify this class has everything `Persistable` requires." It has `id: string` (via a parameter property) and a `save(): void` method, so it compiles. Drop `save`, or type `id` as a `number`, and the error lands right on the `class Account` line.

Now the other tool: a base class that **can't be instantiated on its own** and forces subclasses to fill in specific methods.

📝 **`abstract`** - a class marked `abstract` can't be created with `new`; it exists only to be extended. An `abstract` method has no body - a required slot every concrete subclass must implement.

```typescript
abstract class Shape {
  abstract area(): number;       // no body - subclasses must provide one

  describe(): string {           // shared, concrete behavior
    return `area is ${this.area()}`;
  }
}

class Circle extends Shape {
  constructor(private radius: number) {
    super();
  }
  area(): number {
    return Math.PI * this.radius ** 2;
  }
}

const c = new Circle(2);
console.log(c.describe());  // "area is 12.566..."
const s = new Shape();      // Error
```
```console
Cannot create an instance of an abstract class.
```
*What just happened:* `Shape` declares an abstract `area()` with no implementation and a concrete `describe()` that *calls* it. `Circle extends Shape` supplies a real `area()`, so it's a complete, instantiable class. `new Shape()` directly is rejected - the base is a template, not a usable object. If `Circle` had forgotten `area()`, that omission would be flagged on `Circle` too. Abstract classes share real code in the base while *guaranteeing* every subclass fills in the missing pieces.

💡 **Key point - `implements` vs `extends`.** `implements` means "I promise to *match this shape*" - copies no code, just enforces a contract, and a class can implement many interfaces. `extends` means "I *reuse this base*" - you inherit its fields and methods, and a class extends exactly one base. Use `implements` when callers care that you fit a shape; use `extends` (often with `abstract`) to share behavior down a hierarchy.

## Recap

1. TypeScript classes are the **same JavaScript classes** you already know (sugar over prototypes) plus a **type layer** - field types, visibility, and contracts checked before the code runs.
2. **Typed fields and a typed constructor** let the checker enforce what each instance holds; **parameter properties** (`constructor(private balance: number)`) declare and assign a field in one line - a TS-only boilerplate killer.
3. **`public` / `private` / `protected`** control access, but ⚠️ TS `private` is *compile-time only and erased*; for a runtime-enforced field use JavaScript's `#private`.
4. **`readonly`** locks a field after the constructor; **getters/setters** expose computed views or validated writes that read like plain fields.
5. **`implements`** verifies a class matches an interface's shape (a contract, no code reuse); **`abstract`** defines a base that can't be instantiated and forces subclasses to fill in methods.
6. Reach for classes mainly for **stateful objects** and **implementing interfaces** - TypeScript leans functional, so don't force OOP where a plain function or object would do.

You can now put types on objects with behavior. Next, we leave the language and wire it into a real project: **modules, `tsconfig.json`, and the build** that turns typed source into shippable JavaScript.

## Quick check

Test yourself on the three ideas that matter most here - what `private` really does, the parameter-property shorthand, and `implements` vs `abstract`:

```quiz
[
  {
    "q": "You mark `balance` as `private` in a TypeScript class, then read it at runtime with `(acct as any).balance`. What happens?",
    "choices": [
      "It works - TS `private` is a compile-time check that's erased, so the field is an ordinary public property at runtime",
      "It throws a runtime error, because `private` fields are sealed by the JavaScript engine",
      "It returns `undefined`, because the field doesn't exist outside the class",
      "It fails to compile, because `as any` can never reach a private field"
    ],
    "answer": 0,
    "explain": "TypeScript's `private` is enforced only by the type checker and then erased. At runtime the field is a normal property, fully reachable. For a runtime-enforced private field, use JavaScript's `#name` syntax instead."
  },
  {
    "q": "What does the constructor `constructor(private balance: number) {}` do that a plain `constructor(balance: number) {}` does not?",
    "choices": [
      "It declares a `balance` field and assigns the argument to it automatically - declaration and assignment in one line",
      "It makes the constructor run faster by skipping the assignment step",
      "It marks the whole class as private so it can't be instantiated",
      "Nothing different - the modifier on a parameter is ignored at compile time"
    ],
    "answer": 0,
    "explain": "An access modifier on a constructor parameter is a 'parameter property': TypeScript declares a field of that name and assigns the argument to it. A bare parameter (no modifier) is just a local that disappears when the constructor returns."
  },
  {
    "q": "When should you reach for `implements` instead of `extends`?",
    "choices": [
      "When you want to promise a class matches an interface's shape, without inheriting any code - and a class can implement many interfaces",
      "When you want to copy all the methods and fields from a base class into your class",
      "Whenever you use an abstract class, since `implements` and `abstract` mean the same thing",
      "Only when the base class has no methods to inherit"
    ],
    "answer": 0,
    "explain": "`implements` enforces a contract - the checker verifies your class has every member the interface requires - but copies no code, and you can implement many interfaces. `extends` reuses a base class's actual code, and you extend exactly one."
  }
]
```

---

[← Phase 6: Generics](06-generics.md) · [Guide overview](_guide.md) · [Phase 8: Modules, tsconfig & the Build →](08-modules-and-tsconfig.md)
