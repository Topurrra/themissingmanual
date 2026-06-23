---
title: "Framework vs Library — Who Calls Whom"
guide: "what-a-framework-even-is"
phase: 1
summary: "The one idea behind the whole 'framework' label: a library is code you call when you need it, while a framework is code that calls you — control inverts, and that reversal is the entire distinction."
tags: [frameworks, libraries, inversion-of-control, hollywood-principle, control-flow]
difficulty: beginner
synonyms: ["framework vs library difference", "inversion of control explained", "hollywood principle dont call us", "who calls whom framework", "is react a library or framework", "what makes something a framework"]
updated: 2026-06-22
---

# Framework vs Library — Who Calls Whom

You've heard both words a thousand times, often in the same sentence: "React is a library," "Django is a
framework," "should I learn a framework or a library first?" And if you're honest, the line between them has
always been a little smudgy. People use the terms like they're interchangeable, then argue for an hour about
whether some tool counts as one or the other.

Here's the good news: underneath all that noise sits a single, clean idea. Once you see it, every one of
those arguments suddenly makes sense — including why people disagree. It comes down to one question:

**When your code and the other code run together, who is in charge of the schedule?**

That's it. That's the whole category. Let's make it concrete.

## The one-line distinction

📝 **Library** — a collection of code someone else wrote that *you call* whenever you need it. You're driving;
the library is a tool you reach for. You decide when, in what order, and whether at all.

📝 **Framework** — a structure someone else built that *calls your code* at the moments it decides. The
framework is driving; you fill in the parts it asks for, and it runs them on its own schedule.

Read those two definitions again, because the difference is exactly one swapped subject:

- With a **library**, *your code* calls *their code*.
- With a **framework**, *their code* calls *your code*.

That reversal — who is the caller and who is the called — is the single defining idea of this entire topic.
Everything else (structure, conventions, the trade-offs we'll spend the rest of the guide on) flows
downstream from it.

💡 A quick gut test you can apply to any tool: do you reach into it, or do you live inside it? If you pick it
up and put it down whenever you like, it's acting like a library. If your code is slotted into something that
runs the show around you, it's acting like a framework.

## Inversion of control: "Don't call us, we'll call you"

This swap has a proper name, and it's worth knowing because you'll see it everywhere.

📝 **Inversion of control (IoC)** — the normal flow is: *your* program is in charge and calls helpers as it
needs them. A framework *inverts* that: it takes the position of being in charge, and your code becomes the
helper that *it* calls. Control has been flipped from you to the framework.

The classic one-liner for this is the **Hollywood Principle**: *"Don't call us, we'll call you."* Picture an
actor after an audition. They don't get to phone the studio every morning demanding to perform. They leave
their details, go home, and the studio calls them when there's a scene that needs them. You, the programmer,
are that actor. You hand the framework your pieces — a function here, a component there — and it calls them at
the right moments: when a button is clicked, when a web request arrives, when a page needs redrawing.

A pair of analogies that tends to stick:

- A **library is a power drill.** It sits in your toolbox. You pick it up when you decide a hole needs
  drilling, you use it, you set it back down. The drill never tells you what to build. You are completely in
  charge; it's a capable tool waiting for your command.
- A **framework is a kit house.** The frame, the floor plan, the load-bearing walls, the wiring routes — all
  decided for you before you arrive. Your job is to fit your rooms and furniture into the structure it
  dictates. You get a house far faster than building from raw lumber, but you're living inside someone else's
  shape, on their terms.

⚠️ Notice the cost hiding in the kit-house analogy. With the drill, freedom is total but *you* have to supply
the entire plan. With the kit house, the plan is handed to you for free — but you can't easily move a
load-bearing wall just because you'd have preferred it elsewhere. That's the framework bargain in miniature,
and we'll come back to it.

## A concrete contrast you can feel

Let's see the reversal in actual code. The example below is JavaScript, and it's runnable — tweak it and run
it. It's *not* a real framework; it's a stripped-down sketch meant to show you the *shape* of "you call it"
versus "it calls you" side by side.

```javascript runnable
// LIBRARY SHAPE: you're in charge.
// You decide exactly when sort runs. You call it.
const nums = [3, 1, 2];
nums.sort((a, b) => a - b);
console.log("library style — I called sort:", nums);

// FRAMEWORK SHAPE: it's in charge.
// You hand over a function and walk away. Something else
// decides when to run it. You never call it yourself.
function onTick() {
  console.log("framework style — it called me back");
}
setTimeout(onTick, 100); // you registered onTick; the runtime calls it later

console.log("...meanwhile my code already moved on");
```

*What just happened:* In the first half, **you** were the caller — `nums.sort(...)` runs the instant you say
so, in the order you wrote, and control comes right back to you. That's the library shape: you reach in and
use it. In the second half, you never call `onTick` at all. You *register* it and immediately move on — notice
the "meanwhile" line prints *before* the callback. Later, something else (here, the timer; in a real
framework, its lifecycle) decides the moment has come and calls your function for you. That's inversion of
control, live: you wrote the code, but you gave up the decision of *when it runs*. `setTimeout` is clearly
not a framework — but that "hand it a function, it calls you back" gesture is the exact seed a real framework
grows from, repeated across dozens of moments.

## It's a spectrum, not a binary

Now for the part that resolves all those internet arguments. The labels "library" and "framework" are not two
sealed boxes. They're two ends of a slider, and most real tools land somewhere in between.

⚠️ The official labels often lie about how a tool actually behaves. React is almost always called a
"library" — yet it absolutely inverts control: you write components, and React decides when to call (and
re-call) them as state changes. By the strict who-calls-whom test, that's framework behavior. Meanwhile
Express is commonly called a "framework," but in day-to-day use it feels library-ish — you call its methods to
wire up routes and it mostly does what you tell it, when you tell it. The marketing word and the real
experience don't always match.

So the useful question is *not* "is this technically a framework?" — that's a label argument that goes
nowhere. The useful question is:

> **How much is this thing in charge, versus how much am I in charge?**

💡 The more a tool calls *you* (versus you calling *it*), the more framework-like it is. The more you reach
into it on your own schedule, the more library-like it is. Slide any tool onto that scale and you've learned
something real about it — something the label on the box won't always tell you.

## Why this distinction matters to you

This isn't trivia. Where a tool sits on that slider *predicts the experience* of using it, before you've
written a line:

- A **framework** hands you structure and speed. There's a place for everything, a "right way" to do common
  tasks, and a lot already wired up so you're productive fast. The price is the steering wheel: you live
  inside its lifecycle, its conventions, and its opinions. When you want something it didn't anticipate,
  you're working *against* the structure, not with it.
- A **library** keeps you in the driver's seat. You decide the architecture, the flow, the shape of
  everything. The price is that *you* have to assemble it all — there's no pre-built frame catching you, and a
  pile of great libraries doesn't organize itself into an application.

Neither is better. They're different bargains about where your control goes. The rest of this guide is about
that bargain: in the next phase, *why* frameworks exist at all (what problem is so worth giving up control
for), and after that, what living inside one really costs and how to choose well.

## Recap

1. The whole distinction is one question: **who calls whom.** A **library** is code *you call*; a
   **framework** is code that *calls you*.
2. That reversal has a name — **inversion of control** — and a motto, the **Hollywood Principle**: "Don't
   call us, we'll call you." You supply the pieces; the framework decides when to run them.
3. Think **power drill** (a tool you pick up and command) versus **kit house** (a structure you fit your life
   into). The drill gives total freedom and zero help with the plan; the kit house gives a plan you can't
   easily fight.
4. It's a **spectrum, not a binary.** React is called a "library" but inverts control; Express is called a
   "framework" but feels library-ish. The labels blur.
5. The question worth asking isn't "is it technically a framework?" but **"how much is it in charge versus
   me?"** The more it calls you, the more framework-like it is.
6. Where a tool sits on that slider **predicts the experience**: framework = structure and speed for the cost
   of the steering wheel; library = full control for the cost of assembling everything yourself.

## Quick check

```quiz
[
  {
    "q": "In the framework-vs-library distinction, what is the single defining difference?",
    "choices": ["A framework is bigger and has more files than a library", "With a library your code calls it; with a framework it calls your code", "Frameworks are compiled while libraries are interpreted", "Libraries are free and frameworks cost money"],
    "answer": 1,
    "explain": "The whole distinction is who calls whom. You call a library when you need it; a framework calls the code you supply, on its own schedule."
  },
  {
    "q": "The Hollywood Principle — 'Don't call us, we'll call you' — describes which idea?",
    "choices": ["Inversion of control: the framework is in charge and calls your code", "That you should avoid frameworks when starting out", "That libraries are always faster than frameworks", "That you must phone the maintainers before using their code"],
    "answer": 0,
    "explain": "It's the motto for inversion of control: you hand over your pieces (handlers, components), and the framework invokes them at the right moments."
  },
  {
    "q": "React is usually called a 'library,' yet it decides when to call (and re-call) your components. What does this best illustrate?",
    "choices": ["That React is mislabeled and is actually broken", "That the official label is the only thing that matters", "That library vs framework is a spectrum — what matters is how much the tool is in charge versus you", "That every library secretly compiles to a framework"],
    "answer": 2,
    "explain": "The labels blur. The useful question isn't 'is it technically a framework?' but 'how much is it in charge versus me?' React inverting control makes it framework-like despite the 'library' label."
  }
]
```

---

[Guide overview](_guide.md) · [Phase 2: Why Frameworks Exist →](02-why-frameworks-exist.md)
