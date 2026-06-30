---
title: "Statements, Truth, and Validity"
guide: "what-logic-actually-is"
phase: 2
summary: "A statement can be true; an argument can be valid; only a sound argument is both. Confusing truth with validity is the single biggest reasoning mistake - here's how to never make it again."
tags: [logic, validity, soundness, arguments, premises, truth]
difficulty: beginner
synonyms: ["difference between true and valid", "what is a valid argument", "what is soundness in logic", "can a valid argument be false", "premises and conclusion"]
updated: 2026-06-25
---

# Statements, Truth, and Validity

## You have lost arguments you were right about

Think back to a disagreement where you knew, in your bones, that you were correct - and still walked away looking like the one without a point. The other person sounded confident. Their sentences connected. You couldn't pin down what was wrong, so the room sided with them.

The reverse happens too. Someone tells you something you already believe, wraps it in a few agreeable sentences, and you nod along - without ever checking whether their reasoning holds. It felt right, so you let it pass.

Both moments come from the same gap. Most people are never taught that **the truth of a claim and the strength of an argument are two different things**, measured separately. Once you can see them apart, broken reasoning stops hiding from you - including your own. This phase is about three words: *truth*, *validity*, and *soundness*. Get these straight and the rest of logic has somewhere solid to stand.

## A statement is something that can be true or false

📝 A **statement** (also called a *proposition*) is a sentence that is either true or false. Not necessarily true - only the kind of thing that *has* a truth value at all.

These are statements:

- "The earth orbits the sun." (true)
- "There are forty pigeons on that roof." (true or false depending on the roof, but it's the kind of thing you could check)
- "7 is greater than 10." (false - still a statement; being false doesn't disqualify it)

These are **not** statements:

- "What time is it?" - a question. It isn't true or false; it's a request.
- "Close the door." - a command. You can obey or ignore it, but you can't call it false.
- "Pineapple belongs on pizza." - a pure preference. There's no fact of the matter to match against reality.

The test: *could you, even in principle, ask whether this matches reality?* If yes, it's a statement. If the sentence is a question, an order, or a taste with no fact underneath, it isn't. Logic operates on statements, because logic is about how truth flows from one claim to another. No truth value to begin with, nothing for logic to work on.

## An argument is premises offered for a conclusion

📝 An **argument** is one or more statements (the **premises**) offered in support of another statement (the **conclusion**). The premises are the reasons. The conclusion is the claim those reasons are supposed to land you on.

In everyday speech "argument" means a fight. Here it means something calmer and more precise: a structure. Premises in, conclusion out. Lay an argument out plainly and the structure becomes visible - and once it's visible, you can inspect it.

```text
Premise 1:  If it rained last night, the street is wet.
Premise 2:  It rained last night.
Conclusion: The street is wet.
```

Two premises, one conclusion. That's the whole machine. The rest of this phase is about a question you can now ask of any machine like this: *does it actually work?*

## Truth, validity, soundness: three separate measurements

Here are the three words, defined cleanly. Read them slowly - the difference between the first two is the whole game.

📝 **Truth** is a property of a *statement*. A statement is true when it matches reality. "Paris is in France" is true because Paris is, in fact, in France. Truth is about the world.

📝 **Validity** is a property of an *argument's structure*. An argument is valid when, **IF** the premises are true, the conclusion **MUST** be true - there's no way to have true premises and a false conclusion at once. Notice what validity does *not* claim: it says nothing about whether the premises are actually true. It only checks the connection between them and the conclusion. Validity is about *flow*, not about the world.

📝 **Soundness** combines both. An argument is sound when it is **valid AND its premises are actually true**. A sound argument is the real prize: the structure forces the conclusion and the inputs are genuinely true, so the conclusion is *guaranteed* true. Soundness is the only one of the three that lets you bank the result.

The shape to hold in your head: validity is a promise about *plumbing* - if true things go in, true things come out. Soundness is validity **plus** the guarantee that true things really did go in.

## Three counterintuitive facts that fix everything

People stay confused because they expect truth and validity to move together. They don't. Here are the three cases that pry them apart.

### 1. A valid argument can have false premises and a false conclusion

The structure can be flawless while the content is wrong. Look:

```text
Premise 1:  All birds can fly.
Premise 2:  A penguin is a bird.
Conclusion: Therefore, a penguin can fly.
```

This argument is **valid**. *If* all birds could fly, and *if* a penguin is a bird, then the conclusion would be forced - there'd be no escape. The plumbing is perfect. But premise 1 is false (penguins, ostriches, kiwis), so the conclusion is false too. Valid, yet the conclusion is false.

Sit with that, because people refuse to believe it at first: **validity is not a promise that the conclusion is true.** It's a promise that the conclusion *follows*. Garbage in, garbage out - through a perfectly good pipe.

### 2. A true conclusion can come from invalid reasoning

The conclusion being true does not make the argument good. The reasoning can be broken and stumble onto a true answer anyway:

```text
Premise 1:  All dogs are animals.
Premise 2:  My cat is an animal.
Conclusion: Therefore, my cat is a dog.
```

Wait - that conclusion is false. Let's make the conclusion *true* and keep the reasoning broken:

```text
Premise 1:  All dogs are animals.
Premise 2:  Some animals are pets.
Conclusion: Therefore, the sun is hot.
```

Both premises are true. The conclusion is true. And the argument is **invalid** - the conclusion has nothing to do with the premises; it doesn't *follow* from them. A true conclusion at the bottom of an argument tells you nothing about whether the argument earned it. The conclusion might be true for reasons unrelated to the ones offered.

This is case 1 run backwards, and it's the one that fools agreeable people most.

### 3. The sound argument: the one you can actually bank

```text
Premise 1:  All humans are mortal.
Premise 2:  Socrates is a human.
Conclusion: Therefore, Socrates is mortal.
```

Valid: if both premises hold, the conclusion is inescapable. And both premises are actually true. So the argument is **sound**, and the conclusion is guaranteed. This is the target. Everything else is a step on the way to it or a counterfeit of it.

## The three at a glance

| Word | Property of | Asks | One-line example |
|------|-------------|------|------------------|
| **Truth** | a statement | Does it match reality? | "Water boils at 100°C at sea level" - true. |
| **Validity** | an argument's structure | If premises true, must the conclusion be true? | "All birds fly; penguins are birds; so penguins fly" - valid (even though false). |
| **Soundness** | an argument (both) | Is it valid *and* are the premises true? | "All humans are mortal; Socrates is human; so Socrates is mortal" - sound. |

Read it as a pipeline: truth describes the *pieces*, validity describes the *connection*, soundness describes the *whole working thing*.

## ⚠️ The error that runs the world

> The most common reasoning mistake in real life is accepting an argument because you **agree with its conclusion**, not because the reasoning holds.

When a conclusion flatters what you already believe, your guard drops and you stop checking the structure. That's case 2 happening to you in real time - a true-feeling conclusion smuggling a broken argument past your attention.

This is exactly the lever manipulators pull. A skilled persuader doesn't argue well; they lead with a conclusion you *want* to be true, and you supply the trust the argument never earned. The defense is a single reflex: separate the two questions. First - *do I think the conclusion is true?* Then, independently - *do these premises actually force it?* Keep them apart, and "I agree with the ending" can no longer wave a bad argument through.

## 🪖 For builders

You already meet this distinction every day; it wears different clothes.

**A passing test is evidence, not proof.** A green suite is a *true-looking conclusion*: "the code works." But if the assertions are weak - checking that a function returns *something* rather than the *right thing* - you reached that conclusion through reasoning that doesn't establish it. Valid-looking, unsound. The premises ("these assertions capture correctness") were never actually true, so the green checkmark guarantees nothing. Strong assertions are what move you from "the tests pass" to "the tests passing *means* something."

A useful mapping to carry around:

- **Validity ≈ the logic of your conditionals.** Given these inputs, does this branch *have* to produce that output? That's a structure question, answerable without knowing real data.
- **Soundness ≈ whether your input assumptions actually hold.** Your logic can be airtight and still ship a bug, because the real input wasn't what you assumed. Correct logic over false premises is a valid argument with a false conclusion - code that reasons perfectly about a world that isn't there.

Most production incidents aren't invalid logic. They're *unsound* logic: clean reasoning resting on an assumption about the input that quietly stopped being true.

## Recap: three words, kept apart

- **Truth** is about a *statement* and the *world*: does the claim match reality?
- **Validity** is about an *argument's structure*: if the premises were true, would the conclusion be forced? (It can be valid with false premises and a false conclusion.)
- **Soundness** is *valid + premises actually true*: the only one that guarantees the conclusion.

Hold these apart and you stop being fooled by confident-but-broken arguments - and you stop accepting reasoning merely because you liked where it ended. If the way logic carries truth from premise to conclusion still feels a little abstract, the comfort with abstraction itself is its own muscle - [why math isn't your enemy](/guides/why-math-isnt-your-enemy) is about building it.

Next, we look at the three different *ways* people get from premises to conclusions - and why one of them gives guarantees while the others only give good bets.

Quick check before you move on:

```quiz
[
  {
    "q": "What is the difference between truth and validity?",
    "choices": [
      "Truth is a property of a statement (does it match reality); validity is a property of an argument's structure (if the premises are true, the conclusion must follow)",
      "They mean the same thing - a valid argument is merely a true one",
      "Truth applies to arguments and validity applies to single statements",
      "Validity means the premises are true; truth means the conclusion is true"
    ],
    "answer": 0,
    "explain": "Truth describes statements against reality. Validity describes the structure of an argument - whether the conclusion is forced IF the premises hold - and says nothing about whether those premises are actually true."
  },
  {
    "q": "Can a valid argument have a false conclusion?",
    "choices": [
      "No - if it's valid, the conclusion is always true",
      "No - validity guarantees the conclusion matches reality",
      "Yes - if a premise is false, a valid structure can deliver a false conclusion ('All birds fly; penguins are birds; so penguins fly')",
      "Only if the argument also happens to be invalid"
    ],
    "answer": 2,
    "explain": "Validity only promises the conclusion follows IF the premises are true. Feed a valid structure a false premise and you get a false conclusion through perfectly good plumbing."
  },
  {
    "q": "What does it mean for an argument to be sound?",
    "choices": [
      "Its conclusion happens to be true",
      "It is valid AND its premises are actually true, so the conclusion is guaranteed true",
      "It is persuasive and most people agree with it",
      "Its premises are true, regardless of whether the structure is valid"
    ],
    "answer": 1,
    "explain": "Soundness = validity + actually-true premises. That combination is the only one of the three that guarantees the conclusion is true."
  }
]
```

[← Phase 1: Logic Is the Skill Under Everything](01-logic-is-the-skill-under-everything.md) · [Guide overview](_guide.md) · [Phase 3: The Three Ways We Reason →](03-the-three-ways-we-reason.md)