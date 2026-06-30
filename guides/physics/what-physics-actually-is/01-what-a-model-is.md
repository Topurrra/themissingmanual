---
title: "What a Model Actually Is"
guide: "what-physics-actually-is"
phase: 1
summary: "Physics is the craft of predicting the world with simple models: measurement, units, and the idea that a few rules explain enormous amounts."
tags: [physics, foundations, mental-model, measurement, units, models]
difficulty: beginner
synonyms: ["what is physics", "what does physics actually do", "physics without formulas", "why learn physics", "physics for beginners", "is physics basically math", "how do physicists think"]
updated: 2026-06-30
---

# What a Model Actually Is

## You already predict the world

Toss your keys across the room to someone. You didn't solve an equation. But something in you *predicted* - the arc the keys would take, roughly where they'd land, how hard to throw so they'd reach without overshooting. You ran a model of the world, fast and wordless, and it was good enough.

Physics is that same instinct, slowed down and written out so you can trust it past the range your gut covers. Your gut is great at catching keys. It is terrible at predicting where a satellite will be in six months, or how much your bridge will sag under traffic. The gut doesn't scale. A written-down model does.

So before any formula, hold onto this: **physics is the practice of building a small description of part of the world that lets you predict what happens next.** Not memorizing what happened. *Predicting* what will.

## A model is a deliberate simplification

Here's the part school usually skips. A physics model is not a perfect copy of reality. It's a *cartoon* of reality - and the cartooning is on purpose.

The real world is hopelessly tangled. A rolling ball touches air, which pushes back. It touches the floor, which is slightly rough, slightly warm, very slightly soft. The ball itself flexes a hair. Track every one of those and you'd never finish a single calculation. So physicists do something that sounds like cheating and is actually the whole skill: **they throw away everything that doesn't matter much.**

The famous "frictionless plane" you may have heard mocked? That's the move in its purest form. Nobody thinks friction is zero. The physicist is saying: *for this question, friction is small enough that pretending it's zero gives me an answer close enough to be useful - and far simpler to get.*

```text
REAL situation                  MODEL (deliberate cartoon)
-----------------------         --------------------------
ball: spinning, flexing,   -->  point with a mass
  warming, dimpled
floor: rough, soft, sloped -->  flat, frictionless surface
air: pushing, swirling     -->  ignored
result: messy, near-true        result: simple, close enough
```

*What just happened:* we traded a perfectly accurate description we can't compute for a slightly wrong one we *can*. That trade is the engine of physics. The art is knowing what's safe to throw away.

## "Wrong but useful" is the goal, not the failure

This reframes everything, so sit with it. A model being *wrong* is not a scandal. Every model is wrong, because every model leaves things out - that's what makes it a model and not the universe itself. The only question that matters is: **wrong by how much, and does that matter for what I'm doing?**

Treating a thrown ball as a point with no air resistance predicts its landing spot to within a step or two. For playing catch, perfect. For a long-range artillery shell, that same model is dangerously off, because over a long flight the air you ignored adds up. Same model, same physics - *useful in one context, useless in another.* Knowing the difference is judgment, and judgment is the thing you're actually building when you learn physics.

> A model isn't true or false. It's *appropriate* or *inappropriate* for a question. The skill is matching the cartoon to the job.

## A worked first cartoon

Let's predict something. You drop a stone off a bridge and want to know roughly how long until it hits the water. The honest answer involves air resistance, the stone's shape, and the wind. The *useful* answer throws all of that away and keeps one fact: near Earth's surface, things speed up by about 9.8 metres per second, every second they fall.

```text
Model:   ignore air. Falling speed grows 9.8 m/s each second.
Rule:    distance fallen = 1/2 x 9.8 x (time in seconds)^2

Bridge height measured: about 20 metres.
Try time = 2 seconds:  1/2 x 9.8 x (2 x 2) = 4.9 x 4 = 19.6 metres.

19.6 is almost exactly 20. So the stone hits at roughly 2 seconds.
```

*What just happened:* with one stripped-down rule and no air, we predicted a real event before it happened. The prediction is a little optimistic - real air would slow the stone, so it'd take a touch longer - but for "is it 2 seconds or 20 seconds?" the cartoon nails it. That gap between our 2 seconds and the true answer is honest information, not a mistake to hide.

**For builders:** this is exactly what a good first version of anything is. You don't model every edge case before shipping - you build the simplest thing that predicts the common path, measure where it's wrong, and add detail only where the wrongness costs you. A frictionless plane and a happy-path prototype are the same instinct.

## Why a few rules cover so much

The reason this craft is worth your time: the cartoons compose. A handful of rules - how things fall, how they push on each other, how energy moves - recombine to describe a staggering range of the world. The rule that drops a stone in 2 seconds is *the same rule* that holds the Moon in orbit. You don't learn a new physics for every situation. You learn a few deep rules and a skill for cartooning, and between them they reach almost everywhere.

That's the promise of this whole pillar. Not a pile of disconnected formulas to cram. A small toolkit, and the judgment to point it at the world.

```quiz
[
  {
    "q": "In physics, what is a 'model'?",
    "choices": [
      "A perfect, complete description of a real situation",
      "A deliberate simplification that predicts well enough to be useful",
      "A formula you memorize without understanding",
      "A physical object built to scale"
    ],
    "answer": 1,
    "explain": "A model intentionally throws away unimportant details so the situation becomes simple enough to compute, while staying close enough to reality to be useful."
  },
  {
    "q": "Why do physicists talk about a 'frictionless plane' when no such thing exists?",
    "choices": [
      "They believe friction is genuinely zero",
      "It's a mistake that gets corrected in advanced courses",
      "Ignoring small friction makes the problem far simpler while staying close enough to true",
      "Frictionless surfaces are common in laboratories"
    ],
    "answer": 2,
    "explain": "It's a deliberate cartoon: when friction is small for the question at hand, pretending it's zero gives an answer that's close enough and much easier to get."
  },
  {
    "q": "A model treating a thrown ball as a point with no air resistance predicts a backyard toss perfectly but fails for a long-range shell. What does this show?",
    "choices": [
      "The model is broken and should never be used",
      "Models are appropriate or inappropriate for a question, not true or false",
      "Air resistance can always be safely ignored",
      "Longer distances require fewer assumptions"
    ],
    "answer": 1,
    "explain": "The same model is useful in one context and useless in another. Matching the simplification to the question is the core judgment of physics."
  }
]
```

← [Overview](_guide.md) | [Phase 2: Measurement and units →](02-measurement-and-units.md)
