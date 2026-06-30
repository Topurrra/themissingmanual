---
title: "Energy and momentum: the currencies that never vanish"
guide: "energy-forces-and-motion"
phase: 3
summary: "Newton without the dread: what a force really is, why things keep moving, and energy as the currency that is never created or destroyed."
tags: [physics, energy, momentum, conservation, kinetic, potential, seatbelts]
difficulty: beginner
synonyms: ["conservation of energy explained", "kinetic and potential energy", "what is momentum", "is energy ever destroyed", "why do you need a seatbelt physics", "how does a crumple zone work", "energy conversion examples"]
updated: 2026-06-30
---

# Energy and momentum: the currencies that never vanish

Forces tell you *why* motion changes moment to moment. But there's a higher-level way to look at the same world - one that lets you skip the moment-to-moment push entirely and reason about *before* and *after*. That's the power of energy and momentum: two quantities the universe keeps a strict ledger of and refuses to lose. Get these and you can predict outcomes without tracking every shove in between.

## Energy is a currency that converts but never disappears

The single most useful idea in physics fits in one line:

> Energy is never created and never destroyed. It only changes form.

Think of energy as money in a closed economy. It moves from one account to another, but the total never changes. Nothing is conjured from nothing; nothing vanishes into nothing. When something seems to "lose" energy, follow the ledger and you'll find where it went.

The two forms you meet first are:

- **Kinetic energy** - the energy of *motion*. Anything moving has it. More speed means more of it (and speed counts double - going twice as fast carries *four* times the kinetic energy, which is why high speeds are so much more dangerous than they feel).
- **Potential energy** - *stored* energy, waiting. A ball held above the floor has gravitational potential energy: lift it up and you've loaded the spring; let go and gravity spends it.

Watch the currency flow through a single dropped ball:

```text
Held up high:    all potential energy,   no motion       (full account, parked)
Falling:         potential → kinetic      as it speeds up (transferring funds)
Just before hit: almost all kinetic,      barely any left (account nearly drained into motion)
After the bounce: some kinetic → sound + heat in the floor (spent, not vanished)
```

*What just happened:* the ball never gained or lost total energy on the way down - it converted stored height-energy into motion-energy, dollar for dollar. The bounce comes back lower each time not because energy disappeared, but because some got spent as heat and sound. Follow the ledger and it always balances.

A roller coaster is the same trick stretched out: the long initial climb loads the cars with potential energy, and the whole ride after that is gravity spending it - into speed on the drops, back into height on the rises, with a little lost to friction and the roar you hear. No engine on the track; the energy was all banked at the top.

> [!NOTE]
> "Lost" energy usually means *turned into heat*. Friction, drag, and crunching metal all convert orderly motion into the scattered jiggling of molecules - which is what heat is. The energy is still there; it's only spread out and hard to use again.

## Momentum: motion that's hard to stop, and it's conserved too

**Momentum** is mass times velocity - loosely, *how much motion* a thing has, counting both how heavy it is and how fast it's going. A slow freight train and a fast bullet can both have fearsome momentum: one from enormous mass, the other from enormous speed.

Like energy, momentum is **conserved**: in any collision or push between objects, the total momentum before equals the total momentum after. This is what lets you predict a crash without simulating every millisecond. It's also the third law from phase 2 wearing different clothes - equal-and-opposite forces over the same instant trade exactly equal-and-opposite momentum, so the books always balance.

```text
Before:  truck (heavy, slow) →        ← car (light, fast)
After:   total momentum is unchanged; it just gets redistributed between them
```

*What just happened:* the collision can crumple, spin, and tangle the two vehicles in complicated ways, but the *sum* of their momentum is the same one instant after as one instant before. That conservation is the quiet rule underneath every crash-test prediction.

## What a seatbelt is actually doing

Now the payoff that might genuinely matter to you someday. When a car stops hard in a crash, *you* are still moving at the car's old speed - first law, your inertia doesn't care that the car stopped. Something has to change your motion, and fast. The question is only: *what,* and *over how long?*

The physics hinges on a subtle but life-saving fact: to remove your momentum, a force has to act on you over some stretch of time. **The longer that time, the gentler the force.** Same change in motion, stretched over more time, means less force on your body at any instant.

```text
No belt:  you keep going until you hit the dashboard or glass.
          Your motion stops in a few thousandths of a second.
          Tiny time  →  enormous force  →  serious injury.

With belt + airbag + crumple zone:
          the belt stretches, the bag cushions, the front of the car folds.
          Your motion stops over a much longer stretch of time.
          More time  →  much smaller force  →  you walk away.
```

*What just happened:* the seatbelt doesn't reduce *how much* your motion has to change - you're going from full speed to zero either way. It reduces *how fast* that change happens by stretching it out over more time, and a slower change means a gentler force. The crumple zone (the part of the car designed to fold) and the airbag do the same job: they buy time, and time is what spreads the force thin enough to survive. A car built to crumple is a car built to give you more milliseconds.

This is the whole arc of the guide landing in one object. Inertia (phase 1) is why you keep moving when the car stops. Force changing motion (phase 2) is what the belt applies to you. And conservation plus the time-trade here is why *how* that force is delivered decides whether you're bruised or broken.

**For builders:** conservation laws are a simulation engineer's best friend and best bug-detector. If your physics loop conserves momentum and energy when it should, collisions behave; if your total energy mysteriously climbs every frame, objects start vibrating and flying apart - a classic sign of an unstable integrator. Many engineers add an assertion that total momentum before and after a collision matches within a tiny tolerance, precisely because the universe's ledger is the cheapest correctness check there is.

```quiz
[
  {
    "q": "A ball is dropped from a height. As it falls, what happens to its energy?",
    "choices": [
      "Energy is created as it speeds up",
      "Potential (stored height) energy converts into kinetic (motion) energy",
      "Kinetic energy converts into potential energy",
      "Energy is destroyed by gravity"
    ],
    "answer": 1,
    "explain": "Falling trades stored height-energy for motion-energy, dollar for dollar. Energy changes form; it's never created or destroyed."
  },
  {
    "q": "Momentum is best described as...",
    "choices": [
      "The same thing as energy",
      "A measure of how much stored energy an object has",
      "Mass times velocity - how much motion an object has, counting both its mass and speed",
      "The force an object applies when it stops"
    ],
    "answer": 2,
    "explain": "Momentum combines how heavy something is with how fast it's going, and like energy it's conserved in collisions."
  },
  {
    "q": "Why does a seatbelt (plus airbag and crumple zone) reduce injury in a crash?",
    "choices": [
      "It reduces how much your motion has to change",
      "It cancels your inertia so you stop instantly",
      "It stretches the time over which your motion changes, so the force on you at any instant is much smaller",
      "It adds momentum to push you back into the seat"
    ],
    "answer": 2,
    "explain": "You still go from full speed to zero. The belt spreads that change over more time, and more time means a gentler force."
  }
]
```

[← Phase 2](02-how-forces-change-motion.md) | [Overview](_guide.md)
