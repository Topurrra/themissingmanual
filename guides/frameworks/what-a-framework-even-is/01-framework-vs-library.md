---
title: "Framework vs Library - Who Calls Whom"
guide: "what-a-framework-even-is"
phase: 1
summary: "The one idea behind the whole 'framework' label: a library is code you call when you need it, while a framework is code that calls you - control inverts, and that reversal is the entire distinction."
tags: [frameworks, libraries, inversion-of-control, hollywood-principle, control-flow]
difficulty: beginner
synonyms: ["framework vs library difference", "inversion of control explained", "hollywood principle dont call us", "who calls whom framework", "is react a library or framework", "what makes something a framework"]
updated: 2026-07-10
---

# Framework vs Library - Who Calls Whom

"React is a library," "Django is a framework," "should I learn a framework or a library first?" People throw these words around like they're interchangeable, then argue for an hour about which is which. Underneath the noise sits one clean question:

**When your code and the other code run together, who is in charge of the schedule?**

That's the whole category. Let's make it concrete.

## The one-line distinction

📝 **Library** - code someone else wrote that *you call* whenever you need it. You decide when, in what order, and whether at all.

📝 **Framework** - a structure someone else built that *calls your code* at the moments it decides. You fill in the parts it asks for; it runs them on its own schedule.

The difference is one swapped subject:

- With a **library**, *your code* calls *their code*.
- With a **framework**, *their code* calls *your code*.

That reversal is the single defining idea of this entire topic. Everything else - structure, conventions, the trade-offs the rest of this guide covers - flows downstream from it.

💡 Quick gut test: do you reach into a tool, or live inside it? Pick it up and put it down whenever you like - that's library behavior. Slotted into something that runs the show around you - that's framework behavior.

## Inversion of control: "Don't call us, we'll call you"

📝 **Inversion of control (IoC)** - normally *your* program is in charge and calls helpers as it needs them. A framework flips that: it's in charge, and your code becomes the helper *it* calls.

The classic name for this is the **Hollywood Principle**: *"Don't call us, we'll call you."* Picture an actor after an audition - they don't phone the studio demanding to perform, they leave their details and the studio calls when a scene needs them. You hand the framework your pieces - a function, a component - and it calls them at the right moments: a button click, a request arriving, a page needing redrawing.

Two analogies worth keeping:

- A **library is a power drill.** It sits in your toolbox. You pick it up when a hole needs drilling and set it back down. It never tells you what to build - you're completely in charge.
- A **framework is a kit house.** The frame, floor plan, and wiring routes are decided before you arrive. You fit your rooms into its structure. You get a house faster than building from raw lumber, but you're living inside someone else's shape.

⚠️ Notice the cost hiding there. With the drill, freedom is total but *you* supply the whole plan. With the kit house, the plan is free - but you can't move a load-bearing wall just because you'd prefer it elsewhere. That's the framework bargain in miniature.

## A concrete contrast you can feel

The example below is JavaScript and runnable. It's not a real framework - just a stripped-down sketch of "you call it" versus "it calls you" side by side.

```javascript runnable
// LIBRARY SHAPE: you're in charge.
// You decide exactly when sort runs. You call it.
const nums = [3, 1, 2];
nums.sort((a, b) => a - b);
console.log("library style - I called sort:", nums);

// FRAMEWORK SHAPE: it's in charge.
// You hand over a function and walk away. Something else
// decides when to run it. You never call it yourself.
function onTick() {
  console.log("framework style - it called me back");
}
setTimeout(onTick, 100); // you registered onTick; the runtime calls it later

console.log("...meanwhile my code already moved on");
```

*What just happened:* In the first half **you** were the caller - `nums.sort(...)` runs the instant you say so, in the order you wrote, and control comes right back. That's the library shape. In the second half, you never call `onTick` at all - you *register* it and immediately move on (notice "meanwhile" prints *before* the callback). Later, something else - here the timer, in a real framework its lifecycle - decides the moment has come and calls your function. `setTimeout` is clearly not a framework, but that "hand it a function, it calls you back" gesture is the exact seed a real framework grows from, repeated across dozens of moments.

## It's a spectrum, not a binary

"Library" and "framework" aren't two sealed boxes - they're two ends of a slider, and most real tools land somewhere in between.

⚠️ The official label often lies about how a tool actually behaves. React is almost always called a "library," yet it absolutely inverts control: you write components, and React decides when to (re-)call them as state changes - framework behavior by the strict test. Express is commonly called a "framework," but day-to-day it feels library-ish - you call its methods to wire up routes and it mostly does what you tell it, when you tell it.

So the useful question isn't "is this technically a framework?" It's:

> **How much is this thing in charge, versus how much am I in charge?**

💡 The more a tool calls *you*, the more framework-like it is. The more you reach into it on your own schedule, the more library-like it is. Slide any tool onto that scale and you've learned something real about it - something the label on the box won't always tell you.

## Why this distinction matters to you

Where a tool sits on that slider predicts the experience of using it, before you've written a line:

- A **framework** hands you structure and speed - a "right way" for common tasks, a lot already wired up. The price is the steering wheel: you live inside its lifecycle and conventions, and when it didn't anticipate something you need, you're working *against* the structure.
- A **library** keeps you in the driver's seat - you decide the architecture. The price is that *you* assemble it all; a pile of great libraries doesn't organize itself into an application.

Neither is better. They're different bargains about where your control goes. Next up: *why* frameworks exist at all - what problem is worth giving up control for.

## Recap

1. The whole distinction is one question: **who calls whom.** A **library** is code *you call*; a
   **framework** is code that *calls you*.
2. That reversal has a name - **inversion of control** - and a motto, the **Hollywood Principle**: "Don't
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
    "q": "The Hollywood Principle - 'Don't call us, we'll call you' - describes which idea?",
    "choices": ["Inversion of control: the framework is in charge and calls your code", "That you should avoid frameworks when starting out", "That libraries are always faster than frameworks", "That you must phone the maintainers before using their code"],
    "answer": 0,
    "explain": "It's the motto for inversion of control: you hand over your pieces (handlers, components), and the framework invokes them at the right moments."
  },
  {
    "q": "React is usually called a 'library,' yet it decides when to call (and re-call) your components. What does this best illustrate?",
    "choices": ["That React is mislabeled and is actually broken", "That the official label is the only thing that matters", "That library vs framework is a spectrum - what matters is how much the tool is in charge versus you", "That every library secretly compiles to a framework"],
    "answer": 2,
    "explain": "The labels blur. The useful question isn't 'is it technically a framework?' but 'how much is it in charge versus me?' React inverting control makes it framework-like despite the 'library' label."
  }
]
```

---

[Guide overview](_guide.md) · [Phase 2: Why Frameworks Exist →](02-why-frameworks-exist.md)
