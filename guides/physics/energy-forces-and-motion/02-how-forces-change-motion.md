---
title: "How forces change motion"
guide: "energy-forces-and-motion"
phase: 2
summary: "Newton without the dread: what a force really is, why things keep moving, and energy as the currency that is never created or destroyed."
tags: [physics, newton, forces, acceleration, mass, second-law, third-law]
difficulty: beginner
synonyms: ["f equals ma meaning", "newtons second law explained", "what is acceleration", "newtons third law equal and opposite", "why is a heavy door hard to start and stop", "how does mass affect motion", "action and reaction explained"]
updated: 2026-06-30
---

# How forces change motion

You've got the hard part already: motion sticks on its own, and a force is what *changes* it. This phase is about that change — how much you get for a given push, why heavier things are stubborner, and the strange-sounding rule that every push pushes back. None of it needs more than the arithmetic you do at a grocery store.

## Acceleration is the word for "motion changing"

When motion changes, physicists call that **acceleration**. The word feels like it should mean "speeding up," but it's broader and more useful than that. Acceleration is *any* change to motion:

- Speeding up.
- Slowing down (this is acceleration too — it's pointed backward).
- Turning, even at a steady speed (your direction is changing, so your motion is changing).

So when a car brakes, it's accelerating. When you round a corner at constant speed, you're accelerating. If the needle isn't moving and you're going straight, *that's* the only time you're not accelerating. Hold that, because the second law is entirely about acceleration.

## The second law: F = ma, read as a sentence

Here's the equation everyone braces for:

```text
F = m × a

F  =  the net force (the push that wins, in newtons)
m  =  the mass (how much stuff, in kilograms)
a  =  the acceleration (how fast motion changes)
```

Don't read it as algebra to solve. Read it as a sentence about cause and effect: **the change in an object's motion depends on the force pushing it and how much stuff there is to move.** Rearrange it in your head and it says something obvious — for a given push, more mass means less change:

```text
a = F / m

Same push, light object  →  big acceleration   (easy to get moving)
Same push, heavy object  →  small acceleration  (sluggish to get moving)
```

*What just happened:* the formula is the receipt for an instinct you already trust. Shove an empty shopping cart and it leaps forward. Shove a full one with the same effort and it barely budges. Same force, more mass, less acceleration — that's `a = F / m` in a parking lot.

Let's put numbers to it once, slowly, units kept visible:

```text
You push a 2 kg toy car with a net force of 6 N.

a = F / m = 6 N / 2 kg = 3 m/s²

Now the same 6 N push on a 6 kg car:

a = F / m = 6 N / 6 kg = 1 m/s²
```

*What just happened:* tripling the mass cut the acceleration to a third for the same push. The unit "m/s²" reads as "meters per second, added every second" — it's the *rate* at which speed builds. You don't need to memorize the number; you need to feel that mass and force pull the result in opposite directions.

## Why a heavy door is hard to start AND hard to stop

A heavy fire door is the perfect everyday lab for this. Two annoyances live in it:

1. **It's hard to get moving.** Big mass, your push, small acceleration. It swings open slowly no matter how you lean.
2. **It's hard to stop once it's moving.** That same big mass resists *any* change — including being stopped. Try to catch a heavy swinging door late and it'll walk you backward.

Both annoyances are the same fact wearing two coats: mass resists change in *both* directions. This is the deep link back to phase 1 — mass *is* the measure of inertia. The number `m` in `F = ma` and the stubbornness you felt in the first law are literally the same thing. A bigger `m` means more force needed for the same change, whether that change is starting or stopping.

## The third law: every push pushes back

Now the one that sounds like a riddle:

> For every force, there is an equal and opposite force. Whenever A pushes B, B pushes A back as hard, in the opposite direction.

When you push on a wall, the wall pushes back on you with exactly the same strength. (If it didn't, your hand would sink into it.) The forces come in **pairs** — always two, always equal in size, always opposite in direction, always on *two different objects*.

That last part is the key that unlocks the riddle people always ask: *if the forces are equal and opposite, why doesn't everything cancel and nothing ever move?* Because the two forces act on **different things**, so they never get to cancel each other:

```text
You push the ground backward   →   the ground pushes you forward   →  you walk
Rocket flings gas downward     →   the gas flings the rocket up    →  liftoff
Your hand pushes the wall       →   the wall pushes your hand        →  nobody moves (wall's anchored)
```

*What just happened:* walking is you shoving the planet backward and the planet shoving you forward — same-size forces, but the Earth's gargantuan mass means *its* acceleration is unmeasurably tiny while yours sends you down the sidewalk. Same force, wildly different masses, wildly different results — straight from `a = F / m`. A rocket needs no air or ground to push against; it throws its own exhaust out the back, and the exhaust throws the rocket forward. That's why engines work in space.

> [!NOTE]
> The two forces in a pair never act on the same object, so they can't cancel each other's motion. "Equal and opposite" is about a relationship between two things, not a tie inside one thing.

**For builders:** the third law is why a collision in a physics engine applies *two* impulses, one to each body, equal and opposite. And `a = F / m` is the literal update step in a simulation loop: sum the forces on a body, divide by its mass to get acceleration, add that to velocity, add velocity to position. Heavier bodies move less per frame for the same force — the sluggishness is free, you don't code it, it falls out of the division.

```quiz
[
  {
    "q": "You apply the same push to a light cart and a heavy cart. What does F = ma predict?",
    "choices": [
      "Both accelerate equally because the push is the same",
      "The heavy cart accelerates more because it has more mass",
      "The light cart accelerates more because, for the same force, less mass means more acceleration",
      "Neither accelerates until the force exceeds the mass"
    ],
    "answer": 2,
    "explain": "Rearranged, a = F / m. Same force, smaller mass gives bigger acceleration — the light cart leaps ahead."
  },
  {
    "q": "A car rounds a corner at a perfectly steady 30 km/h. Is it accelerating?",
    "choices": [
      "No — its speed isn't changing",
      "Yes — its direction is changing, and any change in motion is acceleration",
      "Only if it also speeds up or slows down",
      "No — acceleration only means speeding up"
    ],
    "answer": 1,
    "explain": "Acceleration is any change in motion, including a change in direction. Turning at steady speed still counts."
  },
  {
    "q": "When you push on a wall and it doesn't move, the wall pushes back on your hand just as hard. Why don't these equal-and-opposite forces cancel out to nothing?",
    "choices": [
      "They do cancel — that's why nothing moves",
      "The wall's force is actually slightly smaller",
      "The two forces act on different objects (your hand and the wall), so they can't cancel each other",
      "The forces only become equal after something moves"
    ],
    "answer": 2,
    "explain": "A force pair acts on two different objects, never the same one, so the pair can't cancel a single object's motion."
  }
]
```

[← Phase 1](01-what-a-force-really-is.md) | [Overview](_guide.md) | [Phase 3: Energy and momentum →](03-energy-and-momentum.md)
