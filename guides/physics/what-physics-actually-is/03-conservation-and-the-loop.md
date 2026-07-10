---
title: "The Deepest Idea: Things That Never Change"
guide: "what-physics-actually-is"
phase: 3
summary: "Physics is the craft of predicting the world with simple models: measurement, units, and the idea that a few rules explain enormous amounts."
tags: [physics, foundations, mental-model, measurement, units, conservation]
difficulty: beginner
synonyms: ["what are conservation laws", "conservation of energy explained", "scientific method physics", "deepest idea in physics", "why is energy conserved", "how physics tests ideas"]
updated: 2026-07-10
---

# The Deepest Idea: Things That Never Change

## The accountant's trick

Imagine watching a chaotic scene - a break in pool, balls scattering everywhere, spinning off cushions, colliding, impossible to track. Now imagine someone hands you a single number that *doesn't change* through the whole mess. No matter how the balls fly, you add up that number before the break and after, and it's identical. You'd cling to that number. In a storm of moving parts, the one thing that stays put is gold.

That's a conservation law, and it's the deepest idea in physics. Underneath the changing, swirling world, certain quantities **never get created or destroyed - only moved around or swapped between forms.** Find one, and you've found a fixed point in the chaos. You can predict the end of a process you couldn't possibly trace step by step, because whatever else happens, *this number must come out the same.*

## Energy is the famous one

The headline conservation law: energy is never created or destroyed. It only changes costume.

Lift a book onto a shelf and you've stored energy in its raised position - call it stored-up energy. Let it fall and that stored energy turns into motion energy, faster and faster. It smacks the floor and the motion energy doesn't vanish - it becomes a tiny bit of sound, a tiny bit of heat in the floor and the book. Add it all up at every instant and the total is constant. The energy was never gone. It was only ever moving between forms.

```text
On the shelf:      all stored-up (height) energy,  no motion
Halfway down:      half stored, half motion         (still adds to the same total)
Just before floor: almost all motion,  little stored
After impact:      motion energy -> sound + heat     (total unchanged)
```

*What just happened:* we tracked a falling book without solving its motion second by second. We only insisted the *total* energy stay fixed and watched it change disguise. That's the power: conservation lets you skip the messy middle and still know how the story ends.

## A prediction you can almost feel

Conservation laws make predictions that sound like magic until you see the bookkeeping. A swinging pendulum, pulled back and released, will climb the other side to *almost exactly* the height it started from - never higher, because climbing higher would mean ending with more energy than you put in, and there's nowhere for extra energy to come from. The law forbids it before you do any calculation.

```text
Start: pulled to height H, let go.
Bottom of swing: all that height-energy is now motion (fastest point).
Other side: motion converts back to height -> rises to about H again.

It can't exceed H. That would create energy from nothing.
(Real pendulums creep slightly lower each swing -
 a little energy leaks to air and friction as heat. Still conserved,
 it only left the pendulum's account.)
```

*What just happened:* the law told us the *limit* of the swing with zero arithmetic. And the small real-world droop isn't a violation - the missing energy is conserved too, it's been quietly transferred to heat in the air and the pivot. The books always balance; you sometimes have to look in another account.

## How an idea becomes knowledge: the loop

So where do laws like this come from, and how do we trust them? Not from authority. From a loop that physics runs over and over, and you can run it yourself:

```text
   observe something
        |
        v
   guess a simple rule (a model)
        |
        v
   predict what the rule says happens next
        |
        v
   test it against reality (measure!)
        |
        +--> matches?  -> trust it more, push it harder
        |
        +--> doesn't?  -> the model is wrong. fix it or drop it.
                          (loop back to the top)
```

*What just happened:* this is the whole machine of science in one diagram. The non-negotiable arrow is the test. A guess that hasn't met reality is a story, not knowledge. And reality always wins - when a beautiful model disagrees with a careful measurement, the model is what changes. Conservation of energy earns its place not because it's elegant but because in two centuries of relentless testing, nobody has caught it breaking.

> A model that *can't* be tested isn't wrong - it's worse than wrong, it's outside the loop entirely. The test is what separates physics from a nice-sounding story.

**For builders:** you already run this loop. A bug report is an observation. Your hunch about the cause is a model. "If I'm right, changing this line fixes it" is a prediction. Running it is the test. When the bug survives your fix, you don't argue with the program - you update your model of what's happening. Debugging *is* the scientific method, pointed at a codebase instead of a pendulum.

## Where this pillar goes

You now have the three load-bearing ideas. Physics is **model-building** - the deliberate, useful cartoon. Every quantity is a **number with a unit**, and the units quietly guard your work. And underneath the motion sit **conserved quantities** that never change, tested and re-tested by **the loop**. Everything else in this pillar - motion, forces, energy in depth, heat, light, the strange quantum rules - is these three instincts applied harder and to stranger corners of the world. You're not memorizing a wall of formulas. You're learning to think like the world's most patient, most honest accountant. And if the math still makes you flinch, go meet it on friendlier terms first: [/guides/why-math-isnt-your-enemy](/guides/why-math-isnt-your-enemy).

```quiz
[
  {
    "q": "What does it mean for a quantity to be 'conserved' in physics?",
    "choices": [
      "It slowly decreases over time",
      "It is never created or destroyed, only moved around or changed in form",
      "It only applies to objects at rest",
      "It can be measured but not predicted"
    ],
    "answer": 1,
    "explain": "A conserved quantity stays constant overall - its total doesn't change, even as it swaps between forms or locations, giving you a fixed point in a changing system."
  },
  {
    "q": "A real pendulum rises slightly lower on each swing. How does this fit conservation of energy?",
    "choices": [
      "It violates the law, which only holds in theory",
      "Energy is destroyed by the swinging",
      "The missing energy leaked to heat in air and the pivot - still conserved, only transferred",
      "The pendulum gains energy from the air"
    ],
    "answer": 2,
    "explain": "Energy isn't lost, it's transferred out of the pendulum into heat. The total is still conserved; you only have to look in the other 'account'."
  },
  {
    "q": "In the scientific loop, what happens when a model's prediction disagrees with a careful measurement?",
    "choices": [
      "You trust the model and assume the measurement was wrong",
      "The model is wrong and must be fixed or dropped",
      "You ignore the result and keep the model",
      "It proves measurement is unreliable"
    ],
    "answer": 1,
    "explain": "Reality is the arbiter. When a model conflicts with a careful test, the model changes - that test is what turns a guess into knowledge."
  }
]
```

← [Phase 2: Measurement and units](02-measurement-and-units.md) | [Overview](_guide.md)
