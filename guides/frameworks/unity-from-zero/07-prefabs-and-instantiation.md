---
title: "Prefabs & Instantiation"
guide: "unity-from-zero"
phase: 7
summary: "Prefabs are reusable GameObject templates: edit once, every copy updates. Spawn them at runtime with Instantiate, remove them with Destroy, and meet object pooling for spawn-heavy games."
tags: [unity, prefabs, instantiate, destroy, spawning]
difficulty: advanced
synonyms: ["unity prefab", "unity instantiate", "unity destroy", "unity spawn objects", "unity object pooling", "unity prefab variants"]
updated: 2026-07-10
---

# Prefabs & Instantiation

So far every object in your collect-the-pickups game has been a thing you placed by hand in the
editor - the player, the ground, a pickup or two you dropped into the scene. That works right up until
you want *twenty* pickups, or pickups that keep appearing while the game runs. You don't want to copy-paste
a GameObject twenty times and then, when you decide the pickup should be gold instead of blue, edit all
twenty by hand.

The fix is the single most important asset type in Unity: the **prefab**.

## The mental model: a prefab is a template

Here's the whole idea in one breath: **a prefab is a reusable GameObject saved as an asset - a template.
`Instantiate` stamps copies of it at runtime; `Destroy` removes them. Edit the prefab, and every copy
changes.**

📝 If you've used C# classes, the analogy is close: a prefab is like a *class*, and each thing you spawn
from it is an *instance*. One definition, many live copies. (It's not a perfect analogy - a prefab is data,
not code - but "template you stamp out" is exactly the right instinct.)

Think of it like a rubber stamp. You carve the stamp once. Then you press it onto the page as many times as
you like, and every imprint looks the same. Re-carve the stamp and every *future* imprint changes - and
with Unity prefabs, even the imprints already on the page update too, because each one stays linked to the
stamp. That linkage is what makes prefabs the DRY (don't-repeat-yourself) tool for game objects.

## Creating a prefab

You already have the raw material in your scene. To turn a GameObject into a prefab, you drag it from the
**Hierarchy** window down into the **Project** window. That's it - Unity creates a `.prefab` asset, and the
GameObject in your scene becomes a *linked instance* of it (its name turns blue in the Hierarchy to show the
connection).

Walk through it for the pickup:

1. Set up one pickup the way you want it - a small sphere, a Collider marked **Is Trigger**, a script that
   bumps the score, maybe a material so it glows.
2. Drag that GameObject from the Hierarchy into the Project window (a folder like `Assets/Prefabs` is a good
   home).
3. You now have a `Pickup` prefab asset. Delete the one in the scene if you want - the template lives on in
   the Project window, ready to be stamped out.

To change the prefab later, double-click the asset to open it in **Prefab Mode** (an isolated editing view),
make your edits, and save. Every instance in every scene - and every copy you spawn at runtime - picks up
the change. That's the edit-once-update-all payoff.

💡 **Prefab Variants** are prefabs that inherit from a base prefab, the way a subclass inherits from a parent
class. You make a `GoldPickup` variant of `Pickup`, override just its color and point value, and it still
tracks every *other* change you make to the base `Pickup`. Handy when you have a family of similar objects;
reach for it when you notice yourself making near-identical prefabs.

## Spawning copies at runtime: `Instantiate`

A prefab sitting in the Project window does nothing on its own - it's just a template. To put copies into the
running game you call **`Instantiate`** from a script:

```csharp
Instantiate(pickupPrefab, position, rotation);
```

`Instantiate` creates a fresh copy of the prefab in the scene and returns a reference to that new instance,
so you can capture it and tweak it:

```csharp
GameObject pickup = Instantiate(pickupPrefab, spawnPos, Quaternion.identity);
pickup.name = "Pickup (spawned)";
```

*What just happened:* we stamped out a new copy of `pickupPrefab` at `spawnPos` with no rotation, and the
return value `pickup` is *that specific copy* - not the template. Renaming `pickup` touches only this one
instance; the prefab asset and every other copy are untouched. Capturing the return value is how you spawn
something and then immediately give it speed, a target, a color, whatever this particular copy needs.

The mirror image is **`Destroy`**, which removes an object from the scene:

```csharp
Destroy(gameObject);          // remove this object now (end of frame)
Destroy(gameObject, 3f);      // remove it after 3 seconds
```

*What just happened:* the first line schedules this GameObject for removal - Unity actually deletes it at the
end of the current frame, not the instant you call it, so any code running right after still sees a valid
object. The second line delays removal by three seconds, which is perfect for "spawn a particle burst, then
clean it up" or "this pickup expires if nobody grabs it." Spawn with `Instantiate`, remove with `Destroy` -
that's the full lifecycle of a runtime object.

### The PickupSpawner

Let's make pickups actually appear in your game. Create an empty GameObject called `Spawner`, attach this
script, and your scene starts producing pickups on a timer:

```csharp
using UnityEngine;

public class PickupSpawner : MonoBehaviour
{
    [SerializeField] private GameObject pickupPrefab;
    [SerializeField] private float interval = 2f;

    void Start() => InvokeRepeating(nameof(Spawn), 1f, interval);

    void Spawn()
    {
        var pos = new Vector3(Random.Range(-5f, 5f), 0.5f, Random.Range(-5f, 5f));
        Instantiate(pickupPrefab, pos, Quaternion.identity);
    }
}
```

*What just happened:* `[SerializeField] private GameObject pickupPrefab` creates a slot in the Inspector where
you drag your `Pickup` prefab - that's how the script knows *what* to spawn. In `Start`, `InvokeRepeating`
tells Unity: call `Spawn` after a 1-second delay, then again every `interval` seconds, forever. Each `Spawn`
picks a random `x`/`z` somewhere on the ground (`y` is fixed at `0.5` so the pickup sits on the surface) and
calls `Instantiate` to stamp a new pickup there. `Quaternion.identity` means "no rotation" - Unity stores
rotations as quaternions, and `identity` is the do-nothing rotation, the rotational equivalent of zero. The
result: a pickup pops into existence every couple of seconds at a random spot, and your collect-the-pickups
game finally has things to collect.

## The trap: an unassigned prefab

⚠️ Here is the mistake nearly everyone hits at least once. You write `PickupSpawner`, hit Play, and the
console explodes with **`UnassignedReferenceException: The variable pickupPrefab of PickupSpawner has not
been assigned.`**

The cause: `[SerializeField] private GameObject pickupPrefab` declares the slot, but a slot is empty until
*you* fill it. You have to select the Spawner in the Hierarchy and **drag your Pickup prefab into that field
in the Inspector**. The script can't guess which prefab you mean - that wiring happens in the editor, not in
code. A null `pickupPrefab` throws the instant `Spawn` runs.

So the rule: any `[SerializeField]` reference you see in a script is a promise that you'll assign it in the
Inspector. If something "isn't working" and the console mentions `Unassigned`, an empty Inspector slot is
almost always the culprit - go look.

## When spawning gets heavy: object pooling

💡 `Instantiate` and `Destroy` are fine for a pickup every two seconds. But the moment you spawn *fast* - a
machine gun firing bullets, an explosion throwing particles, a wave of enemies - they become a performance
trap. Every `Instantiate` allocates memory, and every `Destroy` leaves garbage behind. Do that hundreds of
times a second and the **garbage collector** eventually has to sweep up, which causes a visible stutter - a
"GC hitch" - right when the action is most intense.

The fix is **object pooling**: instead of creating and destroying objects, you create a fixed pool of them up
front, then reuse them. When you need a bullet, you grab an inactive one from the pool and switch it on
(`SetActive(true)`); when it's done, you switch it off (`SetActive(false)`) and return it to the pool instead
of destroying it. No allocation, no garbage, no hitch - you're recycling the same handful of objects forever.

You don't need to build this by hand. Unity ships a built-in `ObjectPool<T>` in `UnityEngine.Pool` that
manages the get/release cycle for you. For your collect-the-pickups game, a pickup every couple of seconds is
nowhere near the threshold where pooling matters - plain `Instantiate`/`Destroy` is the right, simple choice
here. But file pooling away as *the* next step the day you build something spawn-heavy. Premature pooling is
wasted effort; pooling when you're spawning hundreds of objects a second is the difference between smooth and
stuttering.

## Recap

- A **prefab** is a reusable GameObject saved as an asset - a template you create by dragging a GameObject
  from the Hierarchy into the Project window. Edit the prefab and every linked instance updates.
- **`Instantiate(prefab, position, rotation)`** stamps a copy into the running scene and returns a reference
  to that new instance, so you can capture and customize it. `Quaternion.identity` means no rotation.
- **`Destroy(gameObject)`** removes an object (at end of frame); `Destroy(obj, seconds)` delays removal.
- A spawner references its prefab through a `[SerializeField]` field and spawns on a timer (e.g.
  `InvokeRepeating`).
- ⚠️ You must **assign the prefab in the Inspector** - an empty slot throws `UnassignedReferenceException`
  the moment you spawn.
- 💡 For spawn-heavy games, swap `Instantiate`/`Destroy` for **object pooling** (`ObjectPool<T>`) to avoid
  garbage-collection hitches - but only when you actually spawn fast.

## Quick check

```quiz
[
  {
    "q": "What does Instantiate(pickupPrefab, pos, Quaternion.identity) return?",
    "choices": ["Nothing (void)", "The prefab asset itself", "A reference to the newly spawned copy", "A boolean for success"],
    "answer": 2,
    "explain": "Instantiate returns a reference to the new instance in the scene, so you can capture it and modify that specific copy without touching the prefab asset."
  },
  {
    "q": "You hit Play and get 'UnassignedReferenceException: the variable pickupPrefab has not been assigned.' What's the fix?",
    "choices": ["Mark the field public instead of private", "Drag the Pickup prefab into the script's slot in the Inspector", "Call Instantiate twice", "Add a try/catch around Spawn"],
    "answer": 1,
    "explain": "A [SerializeField] field creates an Inspector slot that starts empty. You have to drag the prefab into that slot in the Inspector; the script can't guess which prefab you mean."
  },
  {
    "q": "Why prefer object pooling over Instantiate/Destroy when spawning many objects fast?",
    "choices": ["Pooling makes objects move faster", "It avoids the memory allocation and garbage-collection hitches that constant create/destroy causes", "Instantiate doesn't work for more than 10 objects", "Pooling is required for all prefabs"],
    "answer": 1,
    "explain": "Constant Instantiate/Destroy allocates memory and creates garbage, triggering GC stutters under heavy spawning. Pooling reuses a fixed set of objects (SetActive on/off), eliminating that churn."
  }
]
```

[← Phase 6: Physics & Collisions](06-physics-and-collisions.md) · [Guide overview](_guide.md) · [Phase 8: UI, Audio & Building →](08-ui-audio-and-building.md)
