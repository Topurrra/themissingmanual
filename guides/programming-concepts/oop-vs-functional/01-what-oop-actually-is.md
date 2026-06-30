---
title: "What OOP Actually Is"
guide: "oop-vs-functional"
phase: 1
summary: "Object-oriented programming bundles data together with the behavior that acts on it; encapsulation, inheritance, and polymorphism each solve a specific problem - here's the plain-language version of each."
tags: [oop, objects, classes, encapsulation, inheritance, polymorphism]
difficulty: intermediate
synonyms: ["what is object oriented programming", "what is encapsulation", "what is inheritance", "what is polymorphism", "what is a class vs object", "why is inheritance bad"]
updated: 2026-06-19
---

# What OOP Actually Is

If you learned to program in the last twenty years, there's a good chance OOP was the water you swam in - `class` this, `self` that - without anyone ever stopping to say what the *point* was. So you ended up writing classes the way you'd been shown, half-suspecting it was ceremony.

It isn't ceremony. There's one core idea underneath all of it, and once you see it, the three big buzzwords (encapsulation, inheritance, polymorphism) stop being vocabulary and start being tools that each fix a specific, nameable problem.

## The core idea: bundle data with the behavior that acts on it

**What it actually is.** Object-oriented programming groups together some *data* and the *functions that operate on that data* into one unit. That unit is an **object**. The blueprint for making objects of a certain kind is a **class**.

📝 **Object** - a bundle of related data plus the operations that belong with it. **Class** - the template that says what data and operations every object of that type has. You write the class once; you can make many objects from it.

**Why this exists.** Picture a bank account in a program with no objects. You'd have a loose `balance` number floating around, and separate functions `deposit(balance, amount)` and `withdraw(balance, amount)` somewhere else entirely. Nothing stops some unrelated code from setting `balance = -9999` directly. The data and the rules that protect it live in different places, and keeping them in sync is on you.

OOP's answer: put the balance and the only functions allowed to change it in the same box, and make the box guard its own data.

**A real example.** Here's that bank account as a class. The comments are the whole point - read them.

```python runnable
class BankAccount:
    def __init__(self, owner):
        self.owner = owner        # data that belongs to this account
        self._balance = 0         # the leading _ means "internal, don't touch from outside"

    def deposit(self, amount):    # behavior that acts on the data
        if amount <= 0:
            raise ValueError("deposit must be positive")
        self._balance += amount

    def withdraw(self, amount):
        if amount > self._balance:
            raise ValueError("insufficient funds")
        self._balance -= amount

    def balance(self):
        return self._balance

account = BankAccount("Nika")
account.deposit(100)
account.withdraw(30)
print(account.balance())
```
```console
$ python bank.py
70
```
*What just happened:* We made one object from the `BankAccount` blueprint, and that object carries its own `_balance` around with it. Every change to the balance has to go through `deposit` or `withdraw`, which enforce the rules (no negative deposits, no overdrawing). The data and its guardrails travel together as one thing.

## Encapsulation - hide the internals, expose a safe surface

**The problem it solves.** If any code anywhere can reach in and change an object's data directly, then "what could possibly modify this balance?" has the answer "literally anything," and that's a debugging nightmare.

**What it actually is.** Encapsulation means keeping an object's internal data private and only letting the outside world touch it through methods you chose to expose. In the example above, `_balance` is hidden; the only doors in are `deposit`, `withdraw`, and `balance`.

**Why this saves you later.** When a balance goes wrong, you have a short list of suspects - the handful of methods that can change it - instead of the entire codebase. The object becomes something you can *trust*, because it can't be put into a nonsensical state from outside.

## Inheritance - share behavior between related types

**The problem it solves.** Sometimes you have several kinds of thing that are mostly the same with small differences. A `SavingsAccount` is a `BankAccount` that also earns interest. Copy-pasting all the account code and adding one method is how you end up with five slightly-different copies that drift apart.

**What it actually is.** Inheritance lets one class build on another. The child class gets everything the parent has, and adds or changes only what's different.

```python
class SavingsAccount(BankAccount):
    def __init__(self, owner, rate):
        super().__init__(owner)   # reuse the parent's setup
        self.rate = rate

    def add_interest(self):
        self.deposit(self._balance * self.rate)   # reuse deposit's rules

savings = SavingsAccount("Nika", 0.05)
savings.deposit(1000)
savings.add_interest()
print(savings.balance())
```
```console
$ python savings.py
1050.0
```
*What just happened:* `SavingsAccount` didn't redefine `deposit`, `withdraw`, or `balance` - it inherited them from `BankAccount` and added one new method. It even calls the inherited `deposit` inside `add_interest`, so the same "no negative amounts" rule still applies. We described one difference, not a whole new account.

⚠️ **The classic trap: inheritance overuse.** Inheritance is the OOP feature people reach for too often, and it bites hard. The moment a `Penguin` inherits from `Bird` and you discover `Bird` has a `fly()` method, you've built a lie into your type system. Deep inheritance chains (class extends class extends class, four levels down) become impossible to reason about, because to understand one object you have to mentally merge four files. The widely-repeated guideline is **"favor composition over inheritance"** - meaning, instead of saying a `Car` *is a* `Engine`, give the `Car` an engine as one of its pieces (`self.engine = Engine()`). Use inheritance only for genuine "is-a, and always will be" relationships, and keep the chains shallow. When in doubt, hold an object as a field rather than inheriting from it.

## Polymorphism - one interface, many behaviors

**The problem it solves.** You have a list of different objects and you want to do "the same thing" to each - but what that thing *means* differs per object. Without polymorphism you write a giant `if type == "savings": ... elif type == "checking": ...` that grows every time you add a type.

**What it actually is.** Polymorphism (Greek for "many shapes") means different object types can respond to the same method call in their own way, and the calling code doesn't need to know which type it's holding.

```python
def describe(account):
    print(f"{account.owner}: {account.balance()}")   # works for ANY account type

accounts = [BankAccount("Ana"), SavingsAccount("Bo", 0.05)]
for acc in accounts:
    acc.deposit(50)
    describe(acc)
```
```console
$ python poly.py
Ana: 50
Bo: 50
```
*What just happened:* `describe` and the loop call `deposit` and `balance` without caring whether each `acc` is a plain account or a savings account. Each object responds to those calls in its own way. Add a new account type tomorrow and this code keeps working untouched - that's the payoff.

**Why this saves you later.** Polymorphism is how you add new cases without editing old code. Every `if/elif` chain on a type field is a place that will need editing every time a type is added; polymorphism turns those into "just write the new class." Fewer edits to working code means fewer chances to break it.

## Recap

1. **The core idea** of OOP is bundling data together with the behavior that acts on it, into objects (made from classes).
2. **Encapsulation** hides an object's internals so it can't be put in a bad state from outside - fewer suspects when something goes wrong.
3. **Inheritance** shares behavior between genuinely related types - but overusing it (deep chains, fake "is-a" relationships) is the classic OOP trap. Favor composition.
4. **Polymorphism** lets many types answer the same call their own way, so you add new types instead of editing old conditionals.

That's OOP's worldview: model your program as cooperating objects, each guarding its own data. Next we'll look at the other major worldview - one that starts not from objects, but from functions.

---

[← Guide overview](_guide.md) · [Phase 2: What Functional Programming Actually Is →](02-what-functional-actually-is.md)
