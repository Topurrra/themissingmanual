---
title: "GameObjects & Components"
guide: "unity-from-zero"
phase: 3
summary: "The core Unity pattern: a GameObject is an empty bag of Components. The Transform is always there; looks, physics, and behavior are Components you attach — composition over inheritance."
tags: [unity, gameobject, component, transform, composition]
difficulty: intermediate
synonyms: ["unity gameobject", "unity component", "unity transform", "composition over inheritance unity", "unity getcomponent", "unity add component"]
updated: 2026-06-23
---

# GameObjects & Components

Here's the one idea that makes Unity click. Once you hold it, ninety percent of the engine
stops feeling like a pile of unrelated menus and starts feeling like a single pattern repeated
everywhere.

> 📝 **A GameObject is a bag of Components.** The GameObject itself does nothing. It's an empty
> container with a name. Everything it *does* — show up on screen, have a position, fall under
> gravity, play a sound, run your code — comes from **Components** you attach to it. The only
> Component every GameObject is born with is the **Transform**. Everything else, you add.

If you came from object-oriented C#, your instinct is probably to reach for inheritance: a
`Player` class extends `Character` extends `Entity`. Unity gently asks you not to. Instead of
*being* a deep chain of classes, a player *has* a Transform, a Renderer, a Collider, a
Rigidbody, and a movement script — each a separate Component, each doing one job. That's
**composition over inheritance**, and Unity is built around it from the ground up. (If you want
the broader theory of why composition often beats inheritance, see
[OOP vs Functional](/guides/oop-vs-functional).)

## The Transform: the one Component that's always there

Create an empty GameObject in a scene and look at the Inspector. It's almost bare — but there's
one Component already attached that you can't remove: the **Transform**.

The Transform answers three questions about the object in space:

- **Position** — where it is (an x, y, z point).
- **Rotation** — which way it's facing.
- **Scale** — how big it is.

That's it. An empty GameObject with only a Transform is an invisible, intangible point in your
scene. It has a location, but no shape, no picture, no physics. To make it *anything*, you attach
more Components.

> 💡 In 2D projects you'll often see a **RectTransform** instead — it's a Transform variant built
> for UI rectangles (anchors, pivots, width/height). Same idea, extra knobs. For plain 2D and 3D
> objects, the regular Transform is what you get.

## The common Components, and what each one gives you

Think of these as the building blocks you'll reach for constantly. Each one bolts a single
capability onto a GameObject:

| Component | What it adds | Covered in |
|-----------|--------------|------------|
| **MeshRenderer** / **SpriteRenderer** | Makes the object *visible* (a 3D mesh, or a 2D sprite) | here |
| **Camera** | Turns the object into a viewpoint the player sees through | here |
| **Light** | Makes the object emit light into the scene | here |
| **AudioSource** | Lets the object play sounds | Phase 8 |
| **Collider** (Box/Sphere) | Gives the object a *physical shape* for collisions | Phase 6 |
| **Rigidbody** | Hands the object over to the physics engine (gravity, forces) | Phase 6 |
| **Your scripts** | Custom behavior — your C# code, running as a Component | Phase 4 |

The pattern is always the same: a GameObject is dumb on its own; you make it smart by stacking
Components. A camera is just a GameObject with a Camera component. A light is a GameObject with a
Light component. There's no special "Camera class" you inherit from — you compose.

## Building the player as a composition

Let's make this concrete with the player for our collect-the-pickups game. We don't write a giant
`Player` class that knows how to render itself and simulate physics. We build the player by
stacking Components on one GameObject:

```text
Player (GameObject)
├── Transform          ← where the player is (always present)
├── MeshRenderer       ← so you can see it
├── BoxCollider        ← so it can bump into things
├── Rigidbody          ← so physics moves it
└── PlayerMovement     ← your script: reads input, moves the player
```

*What just happened:* one GameObject, five Components, each with a single responsibility. Want the
player to glow? Add a Light. Want it to play a footstep? Add an AudioSource. You never rewrite the
player — you attach another Component. Compare this to an inheritance tree, where adding "can play
sound" might mean inventing a new base class and reshuffling the hierarchy. Composition lets you
add capabilities like clipping LEGO bricks together.

You add Components two ways: in the **Inspector** with the **Add Component** button (the visual
editor for a GameObject's Components), or from code. Most setup happens in the Inspector; code is
for when you need to add a Component at runtime.

## Reaching Components from a script

A script is itself a Component, attached to a GameObject. Very often your script needs to talk to
*another* Component on the *same* GameObject — for example, the movement script needs the Rigidbody
to apply force. The way you get a reference to a sibling Component is `GetComponent<T>()`:

```csharp
using UnityEngine;

public class PlayerMovement : MonoBehaviour
{
    private Rigidbody rb;

    void Start()
    {
        // Grab the Rigidbody attached to the SAME GameObject as this script.
        rb = GetComponent<Rigidbody>();
    }

    void FixedUpdate()
    {
        // Now we can use the cached reference every physics step.
        rb.AddForce(Vector3.forward);
    }
}
```

*What just happened:* `GetComponent<Rigidbody>()` looks at the GameObject this script is on and
hands back its Rigidbody Component. We call it **once** in `Start` and store the result in the `rb`
field, so later code (`FixedUpdate`) reuses it instead of looking it up again. ( `Start`,
`FixedUpdate`, and the script lifecycle are Phase 4 — for now, `Start` runs once at the beginning,
and the `Update`/`FixedUpdate` methods run repeatedly.)

> ⚠️ Two traps with `GetComponent`, and you'll hit both eventually:
> 1. **It returns `null` if that Component isn't attached.** If there's no Rigidbody on the
>    GameObject, `rb` is `null`, and the first time you use it you get a `NullReferenceException`.
>    It's a crash waiting to happen — so attach the Component (in the Inspector), or check for
>    `null` before using the result.
> 2. **It's not free — don't call it every frame.** Looking a Component up has a cost. Calling
>    `GetComponent` inside `Update` (which runs ~60 times a second) is wasteful. **Cache it once**
>    in `Awake` or `Start`, like we did above, then reuse the stored reference.

When the Component you want lives on a *child* or *parent* GameObject instead of the same one,
there are sibling methods:

```csharp
// Same GameObject:
var rb   = GetComponent<Rigidbody>();

// Search this GameObject AND its children (e.g. a weapon mesh nested under the player):
var mesh = GetComponentInChildren<MeshRenderer>();

// Search this GameObject AND up toward its parents:
var root = GetComponentInParent<Rigidbody>();
```

*What just happened:* same lookup, different search area. `GetComponent` stays on the one
GameObject; `GetComponentInChildren` and `GetComponentInParent` walk down or up the hierarchy
(next section) to find the first matching Component. They share the same null-and-cost caveats —
cache the result, don't spam it per frame.

You can also *create* a Component from code with `AddComponent<T>()` — handy for assembling
objects at runtime:

```csharp
// Attach a fresh AudioSource to this GameObject and keep a reference to it.
var audio = gameObject.AddComponent<AudioSource>();
```

*What just happened:* `gameObject` refers to the GameObject this script is attached to, and
`AddComponent<AudioSource>()` bolts a new AudioSource onto it — the exact same thing the **Add
Component** button does in the Inspector, but in code.

## The hierarchy: parenting GameObjects

GameObjects don't just float independently — they nest into a **hierarchy** (this is the
Hierarchy window from Phase 2). Drag one GameObject onto another and it becomes a **child**; the
other becomes its **parent**. This relationship lives in the Transform.

The key rule: **a child's Transform is relative to its parent.** Move the parent, and every child
moves with it, keeping its offset. This is how you build composite objects — a car body with four
wheels parented to it, a player with a camera rig parented above. Move the car; the wheels and
everything else come along for free.

```text
Car (parent)              ← move this...
├── Body
├── Wheel_FL              ← ...and all four wheels move with it,
├── Wheel_FR                 each staying in its place relative to the Car.
├── Wheel_RL
└── Wheel_RR
```

*What just happened:* parenting via the Transform turns five separate GameObjects into one thing
you can move, rotate, and scale as a unit. A child positioned at "2 units to the right" stays 2
units to the right *of its parent*, wherever the parent goes. That relative-to-parent math is the
whole point of the hierarchy.

## Recap

- **A GameObject is an empty container.** It does nothing by itself — its abilities come entirely
  from the **Components** attached to it.
- The **Transform** (position, rotation, scale) is the one mandatory Component every GameObject
  has. Everything else — Renderer, Collider, Rigidbody, Camera, AudioSource, your scripts — you
  add.
- This is **composition over inheritance**: you build an object by stacking single-purpose
  Components, not by extending a deep class hierarchy.
- From a script, reach a Component on the same GameObject with `GetComponent<T>()` (and
  children/parent variants). **Cache the result in `Start`** — it returns `null` if absent, and
  it's wasteful to call every frame.
- GameObjects nest into a **hierarchy** via the Transform. A child's position is **relative to its
  parent**, so moving the parent moves the whole group.

## Quick check

Test the mental model before moving on:

```quiz
[
  {
    "q": "You create a brand-new empty GameObject. Which Component does it already have?",
    "choices": ["A MeshRenderer", "A Rigidbody", "A Transform", "None — it's completely empty"],
    "answer": 2,
    "explain": "Every GameObject is born with exactly one mandatory Component: the Transform (position, rotation, scale). Everything else you add yourself."
  },
  {
    "q": "Your script calls GetComponent<Rigidbody>() inside Update() every frame and stores it nowhere. What's the problem?",
    "choices": ["GetComponent only works in Start()", "It's wasteful to look up the same Component ~60 times a second; cache it once in Start", "Update() can't access other Components", "It will add a new Rigidbody each frame"],
    "answer": 1,
    "explain": "GetComponent has a cost. Call it once in Awake/Start, store the reference in a field, and reuse it — don't look it up every frame."
  },
  {
    "q": "Why does Unity favor composition (attaching Components) over a deep inheritance hierarchy for a player?",
    "choices": ["Inheritance isn't supported in C#", "You add capabilities by attaching single-purpose Components instead of reshaping a class tree", "Components run faster than classes", "It's the only way to set a position"],
    "answer": 1,
    "explain": "A player is a GameObject with a Transform + Renderer + Collider + Rigidbody + a script. Want a new ability? Attach another Component — no need to rework a base-class chain."
  }
]
```

---

[← Phase 2: The Editor](02-the-editor.md) · [Guide overview](_guide.md) · [Phase 4: MonoBehaviour & the Game Loop →](04-monobehaviour-and-the-game-loop.md)
