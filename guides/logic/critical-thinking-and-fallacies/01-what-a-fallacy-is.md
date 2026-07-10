---
title: "What a Fallacy Is (and Why They Work)"
guide: "critical-thinking-and-fallacies"
phase: 1
summary: "A fallacy is an argument that's persuasive but logically broken. Formal fallacies break the structure; informal ones smuggle in irrelevance or emotion. They work because they exploit how human brains take shortcuts."
tags: [logic, fallacies, critical-thinking, persuasion]
difficulty: beginner
synonyms: ["what is a logical fallacy", "why do fallacies work", "formal vs informal fallacy", "persuasive but wrong arguments", "fallacy definition"]
updated: 2026-07-10
---

# What a Fallacy Is (and Why They Work)

## Start where logic left off

In [What Logic Actually Is](/guides/what-logic-actually-is) you met two words that look similar
but do different jobs. An argument is **valid** when its conclusion follows from its premises -
if the premises are true, the conclusion has to be true. An argument is **sound** when it's valid
*and* the premises are actually true. Validity is about shape; soundness is shape plus facts.

Neither word covers a third thing that runs the world: how convincing an argument *feels*.
Feeling convincing isn't the same as being valid or true - they come apart constantly. A
**fallacy** lives in that gap: an argument that's invalid or unsound, broken on the inside, yet
still feels like it should work. A clumsy mistake isn't dangerous; you'll catch it. The dangerous
one slides past because it *feels* right - this guide is about learning to feel that "wait, that
doesn't actually follow" click before the conclusion settles in.

## Two ways an argument can break

Logicians sort fallacies into two families that fail for different reasons and need different
instincts to catch.

A **formal fallacy** is broken in its *structure* - the shape is bad, so the argument fails no
matter what you plug into it. You don't even need to know what the words mean. An **informal
fallacy** has a fine structure but cheats in its *content*: it leans on something irrelevant,
applies emotional pressure, plays with ambiguous words, or yanks your attention elsewhere.

Think of a bridge. A formal fallacy is a bridge with a flawed design - it collapses under any
load. An informal fallacy is a well-designed bridge built out of cardboard: the blueprint is
fine, the materials are a lie.

## Formal: when the shape itself is wrong

The cleanest example, worth memorizing, is **affirming the consequent**. Recall from
[Implication and Conditionals](/guides/implication-and-conditionals) that "if P then Q" only
promises one direction: P guarantees Q, and says nothing about going backward from Q to P. The
fallacy ignores that:

```text
If it rained, the street is wet.   (If P then Q)
The street is wet.                 (Q is true)
Therefore, it rained.              (Therefore P)
```

Feel how natural that sounds? But the street could be wet because a truck spilled water, or
someone washed their car, or a pipe burst. The conditional never promised that *only* rain wets
the street. That's the signature of a formal fallacy: the error is in the wiring. Swap rain and
wet streets for any other P and Q, and the same broken pattern produces the same broken
conclusion - which is why you can spot these without knowing a single fact about the topic.

## Informal: when the content cheats

Here the shape is usually fine - what fails is relevance, honesty, or clarity. A few flavors, to
show the range:

- **Irrelevance.** The argument brings in something that has nothing to do with whether the claim
  is true. "You can't trust her budget plan; she got divorced last year." The divorce has no
  bearing on the math.
- **Emotional pressure.** Instead of giving reasons, the argument makes you feel something - fear,
  pity, belonging - and lets the feeling stand in for the reason.
- **Ambiguity.** A word quietly changes meaning partway through. "Only man is rational; no woman
  is a man; therefore no woman is rational." "Man" flips from "human" to "male" mid-argument, and
  the whole thing rides on you not noticing.
- **Distraction.** The argument changes the subject to something easier to attack, then declares
  victory on the wrong question.

You'll meet each by name in [Phase 2](02-the-fallacies-youll-meet-most.md). For now, absorb the
pattern behind the patterns: an informal fallacy gives you something that *looks* like a reason
but isn't connected to the truth of the claim.

## Why fallacies work on us

Fallacies aren't rare glitches that fool careless people - they work on careful people too,
because they exploit how every human brain is built. Reasoning carefully is slow and effortful,
so your mind runs on shortcuts most of the time, and those shortcuts are usually *fine*. A
fallacy is just a shortcut pointed in the wrong direction. A few of the levers it pulls:

- **Heuristics.** Your brain prefers fast rules of thumb - "sounds right, moving on." A fallacy
  hands you something that *sounds* right and counts on you not slowing down.
- **Emotion.** A claim wrapped in fear, anger, or warmth feels more true than the same claim
  stated flatly. The feeling is real; the extra truth is imaginary.
- **Authority and the crowd.** "An expert said so" and "everyone believes it" are decent first
  guesses - but they're guesses, not proof, and a fallacy dresses a guess up as a verdict.
- **Effort avoidance.** Checking an argument is work, and a clean, confident conclusion lets you
  skip it. We take the offer.

None of these are stupidity - they're features that mostly serve you well. A fallacy is what
happens when someone, by accident or on purpose, aims one of those features at a false
conclusion. **Persuasiveness and truth are different properties, and the gap between them is the
entire vulnerability.** When you can *name* a manipulation, it stops working on you: the moment
you can say "that's affirming the consequent" or "that's an appeal to fear," the spell breaks and
you're examining instead of reacting. A person who can't be easily fooled can't be easily steered.

## For builders

The everyday fallacy in software is the **confident, fluent, wrong answer.** It shows up when a
teammate explains a bug's cause smoothly and completely, and is completely mistaken; it shows up
when documentation reads beautifully and describes behavior the code doesn't have; and it shows up
constantly in AI output, where a model produces a polished, authoritative answer that is false -
the polish is doing the persuading, not the correctness. Fluency reads as competence, but fluency
is a property of the wording, and correctness is a property of reality. The fix is boring and
reliable: run the code, check the source, reproduce the claim. Trust the test, not the tone.

## Recap

- A **fallacy** is an argument that's invalid or unsound but still feels convincing - and the
  convincing-but-broken kind is the one that actually fools people.
- **Formal fallacies** break in their structure (like affirming the consequent); the wiring is
  bad regardless of content.
- **Informal fallacies** keep a fine structure but cheat in their content - irrelevance,
  emotion, ambiguity, or distraction.
- They work because human brains run on shortcuts, respond to feeling, defer to authority and
  the crowd, and avoid effort. **Persuasive is not the same as valid, and neither is the same as
  true.**
- Naming a manipulation is the first step to being immune to it - and "fluent and confident"
  (from a person or an AI) is not evidence of "correct."

## Open-ended exercise

Read this argument carefully:

> "We should adopt framework X. The top three companies in our industry use it, and
> their engineering blogs all say it's transformed their deployment speed."

Name at least two different moves happening in this short paragraph. For each one,
say whether it's a good reason to adopt the framework, a fallacy, or something in
between - and what additional evidence would turn it from persuasion into a sound
argument.

Quick gut-check before you move on:

```quiz
[
  {
    "q": "Which best describes what a logical fallacy is?",
    "choices": [
      "Any argument you personally disagree with",
      "An argument that is invalid or unsound yet still feels convincing",
      "An argument whose conclusion is false",
      "An argument that uses big or technical words"
    ],
    "answer": 1,
    "explain": "A fallacy is about the reasoning being broken - invalid or unsound - while still feeling persuasive. The conclusion of a fallacious argument can even happen to be true; what's broken is how you got there."
  },
  {
    "q": "What's the difference between a formal and an informal fallacy?",
    "choices": [
      "Formal fallacies are written down; informal ones are spoken",
      "Formal fallacies are easy to spot; informal ones are impossible to spot",
      "A formal fallacy breaks the argument's structure; an informal one keeps the structure but cheats in its content",
      "There is no real difference; the terms are interchangeable"
    ],
    "answer": 2,
    "explain": "Formal fallacies fail in their shape, no matter the content (like affirming the consequent). Informal fallacies have an okay shape but lean on irrelevance, emotion, ambiguity, or distraction."
  },
  {
    "q": "A friend gives a smooth, confident explanation for why a bug happened, and it sounds completely right. What does this phase say you should conclude?",
    "choices": [
      "It's persuasive, so it's almost certainly correct",
      "Persuasiveness isn't evidence of truth - fluency can be wrong, so verify it",
      "Confident people are usually trying to manipulate you",
      "Only AI answers need checking; people's explanations don't"
    ],
    "answer": 1,
    "explain": "Persuasiveness and truth are different properties. A fluent, confident answer - from a person or an AI - can still be false, so the move is to check it (run the code, reproduce the claim), not trust the tone."
  }
]
```

[← Guide overview](_guide.md) · [Phase 2: The Fallacies You'll Meet Most →](02-the-fallacies-youll-meet-most.md)
