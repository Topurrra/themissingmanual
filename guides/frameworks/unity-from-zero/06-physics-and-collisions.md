---
title: "Physics & Collisions"
guide: "unity-from-zero"
phase: 6
summary: "Hand an object to the physics engine with a Rigidbody, give it shape with Colliders, and react to contact with OnCollisionEnter and OnTriggerEnter — the right way to move characters and collect pickups."
tags: [unity, physics, rigidbody, collider, collisions]
difficulty: advanced
synonyms: ["unity rigidbody", "unity collider", "unity oncollisionenter", "unity ontriggerenter", "unity physics", "unity trigger vs collision"]
updated: 2026-06-23
---

# Physics & Collisions

At the end of Phase 5 your player walked straight through a wall. That wasn't a bug in your code — it was the whole point. Setting `transform.position` by hand teleports an object; nothing in the world gets a vote. This phase is where you stop teleporting and start letting Unity's physics engine do the heavy lifting: gravity, stopping at walls, bumping into things, and — the payoff for our game — *noticing* when the player touches a pickup.

Here's the mental model to carry through everything below:

> **A `Rigidbody` hands an object to the physics engine. `Collider`s give that object a shape. Triggers *sense* overlaps; solid colliders *block* movement. And you drive physics in `FixedUpdate`, not `Update`.**

Three parts, one idea. The Rigidbody is the membership card to the physics club. The Collider is the body that other bodies can touch. The trigger flag decides whether touching means "you can't pass" or "I noticed you." Hold those three and physics stops being a black box.

## The Rigidbody: handing an object to physics

By default, a GameObject is invisible to physics. It has a Transform (Phase 5), so it has a position — but gravity ignores it, forces don't push it, and it never falls. The moment you add a **`Rigidbody`** component, that changes: the engine takes the wheel. It applies gravity, integrates forces, and resolves collisions for you, writing the results back into the Transform every physics step.

You add a Rigidbody the same way you add any component (Phase 3's Add Component flow). Once it's on, three properties matter early:

```csharp
public class PlayerSetup : MonoBehaviour
{
    void Start()
    {
        Rigidbody rb = GetComponent<Rigidbody>();
        rb.mass = 1f;            // heavier objects resist forces more
        rb.useGravity = true;    // does it fall? pickups often set this false
        rb.isKinematic = false;  // false = physics moves it; true = code moves it
    }
}
```

*What just happened:* `GetComponent<Rigidbody>()` fetches the Rigidbody already attached to this GameObject (you add the component in the editor; the script grabs a reference to it). `mass` controls how much a force budges the object — a 10-mass crate barely moves when a 1-mass ball shoves it. `useGravity` toggles whether it falls. `isKinematic` is the important switch: when `false`, the physics engine owns the object's motion; when `true`, the object still *participates* in collisions (other things bump off it) but only **you** move it from code — handy for moving platforms or a player you steer precisely.

### Driving a Rigidbody: do it in FixedUpdate

In Phase 5 you moved by editing `transform.position` inside `Update`. With a Rigidbody you do **not** touch the Transform directly anymore — that fights the physics engine and produces jitter and missed collisions. Instead you ask the engine to move the body, and you do it in **`FixedUpdate`**.

`FixedUpdate` is a sibling to `Update`, but the engine calls it on the **physics clock** (a fixed timestep, 50 times a second by default) rather than once per rendered frame. All physics work belongs there. You have three tools:

```csharp
public class PlayerMovement : MonoBehaviour
{
    [SerializeField] private float speed = 5f;
    private Rigidbody rb;

    void Start()
    {
        rb = GetComponent<Rigidbody>();
    }

    void FixedUpdate()
    {
        float h = Input.GetAxis("Horizontal");
        float v = Input.GetAxis("Vertical");
        Vector3 move = new Vector3(h, 0f, v);

        // Move the body to a new spot, letting collisions stop it:
        rb.MovePosition(rb.position + move * speed * Time.fixedDeltaTime);
    }
}
```

*What just happened:* this is Phase 5's player, rebuilt to respect physics. We cache the Rigidbody in `Start` (cheaper than calling `GetComponent` every step). In `FixedUpdate` we read input and build a direction exactly as before, but instead of writing `transform.position`, we call `rb.MovePosition(...)` — which moves the body *through* the physics system, so a wall in the way actually stops it. Note `Time.fixedDeltaTime` (the physics step's duration) rather than `Time.deltaTime` here, because we're on the physics clock. The other two tools you'll reach for: `rb.AddForce(Vector3.up * 300f)` shoves the body like a real push (great for jumps and explosions), and setting `rb.velocity = move * speed` commands its speed directly. `MovePosition` is the most "Phase 5-like" of the three and the easiest to start with.

> 💡 Reading input is fine in either method, but *acting* on physics goes in `FixedUpdate`. A common beginner pattern: read one-shot input like `Input.GetKeyDown(KeyCode.Space)` in `Update` (so you never miss the frame it happened), stash a `bool jumpQueued = true`, then apply the force in `FixedUpdate`. For our continuous `GetAxis` movement, reading it right inside `FixedUpdate` is fine.

## Colliders: giving an object a shape

A Rigidbody makes an object obey physics, but physics needs to know its *shape* to figure out what's touching what. That shape is a **`Collider`** — a separate component. Unity gives you a few primitives, cheap and fast:

- **`BoxCollider`** — a rectangular box. Crates, walls, platforms.
- **`SphereCollider`** — a ball. Our pickups, projectiles, anything round.
- **`CapsuleCollider`** — a pill shape. The standard choice for characters (smooth, won't snag on edges).
- **`MeshCollider`** — matches an arbitrary mesh exactly. Precise but expensive; reach for it only when a primitive won't do.

(Every one has a 2D twin — `BoxCollider2D`, `CircleCollider2D`, and so on — for 2D games.) A collider does **not** need a Rigidbody to exist; a static wall is happy with just a `BoxCollider`. But for two objects to register contact, at least one of them must have a Rigidbody — we'll hammer that rule home at the end.

### isTrigger: sense versus block

Every collider has one checkbox that completely changes its behavior: **`isTrigger`**.

- `isTrigger = false` (the default): a **solid** collider. It physically blocks. Walk into it and you stop. This is what makes walls walls.
- `isTrigger = true`: a **trigger**. It stops blocking and becomes a *sensing volume*. Things pass right through it, but the moment something overlaps it, the engine fires an event. This is exactly what a pickup, a checkpoint, a damage zone, or a "you entered the boss room" trigger needs.

For our collect-the-pickups game, the player's collider is solid (so it can bump walls), and each **pickup's collider is a trigger** — the player should walk *over* a coin and collect it, not get stopped by it like a wall.

## Reacting to contact: the callbacks

Here's the part that makes a game feel alive. When colliders touch, Unity calls special methods on any `MonoBehaviour` attached to the involved objects. You don't register anything — you just *define a method with the magic name* and the engine finds it (same deal as `Start` and `Update`). There are two families, matching the two collider modes:

**Solid contact** uses the `OnCollision*` family, which hands you a `Collision` object full of contact detail (where they hit, how hard):

```csharp
void OnCollisionEnter(Collision collision)
{
    Debug.Log("Bumped into " + collision.gameObject.name);
}
// also: OnCollisionStay (every step while touching), OnCollisionExit (when they part)
```

*What just happened:* the engine calls `OnCollisionEnter` once, the instant two **solid** colliders make contact (and at least one has a Rigidbody). The `Collision` parameter describes the hit; `collision.gameObject` is the other object. `OnCollisionStay` fires every physics step while they remain in contact, and `OnCollisionExit` fires when they separate.

**Trigger overlap** uses the `OnTrigger*` family, which hands you the other **`Collider`** directly (no contact physics, because nothing collided — they overlapped):

```csharp
void OnTriggerEnter(Collider other)
{
    Debug.Log("Entered trigger with " + other.name);
}
// also: OnTriggerStay, OnTriggerExit
```

*What just happened:* `OnTriggerEnter` fires once when something enters a trigger volume. The parameter is the *other* object's `Collider` (note: `Collider`, not `Collision` — a trigger has no collision data, only an overlap). This is the callback our pickups will use.

### Knowing *what* touched you: CompareTag

Most contacts need a filter — a pickup should only react to the *player*, not to a stray crate rolling through. The clean way is **tags**. You set a tag on a GameObject in the Inspector (a small dropdown at the top), then check it in code with `CompareTag`:

```csharp
void OnTriggerEnter(Collider other)
{
    if (other.CompareTag("Player"))
    {
        Debug.Log("The player reached me!");
    }
}
```

*What just happened:* `other.CompareTag("Player")` returns `true` only if the entering object is tagged `"Player"`. Use `CompareTag` rather than `other.name == "Player"` — names are fragile (Unity renames clones to "Player (1)"), and tags are the purpose-built, faster tool. Set the tag once in the Inspector; check it forever in code.

### The payoff: collecting a pickup

Now the whole point of this guide. Put this script on each **pickup** (a sphere with a `SphereCollider` whose `isTrigger` is checked, tagged `"Pickup"`). When the player overlaps it, the pickup destroys itself:

```csharp
public class Pickup : MonoBehaviour
{
    void OnTriggerEnter(Collider other)
    {
        if (other.CompareTag("Player"))
        {
            Destroy(gameObject);   // collect it — remove this pickup from the scene
            // increment the score here (Phase 8 wires up the UI)
        }
    }
}
```

*What just happened:* the player (tagged `"Player"`, carrying a Rigidbody) walks into a pickup's trigger volume. The engine fires `OnTriggerEnter` on the pickup's script, passing the player's collider as `other`. We confirm it's the player with `CompareTag`, then call `Destroy(gameObject)` — `gameObject` (lowercase g) is *this* pickup, so the pickup vanishes from the scene. That's a working collect mechanic. The score line is a placeholder; Phase 8 connects it to an on-screen counter. Put this on one pickup, and Phase 7 (Prefabs) will let you stamp out a hundred more without copy-pasting.

## The one rule that trips everyone

You will, at some point, set all this up and get *absolutely nothing*. No log, no destroy, no bump. It happens to everyone. Almost always it's this:

> ⚠️ **Collision and trigger events only fire if at least one of the two objects has a `Rigidbody`, and both have `Collider`s.** A pickup with a trigger collider but *no Rigidbody on either object* will sit there silently as the player passes through. This is the number-one physics confusion in Unity. The usual fix is to make sure your **player has a Rigidbody** (it does, from this phase's movement script) — that one Rigidbody is enough to wake up the events for everything it touches. If events still don't fire, check: does each object have a Collider? Is the pickup's `isTrigger` actually checked? Are you moving the player via the **Rigidbody in `FixedUpdate`**, and not still teleporting `transform.position` from Phase 5 (which bypasses physics and can skip right past thin triggers)?

Keep that checklist handy. "Nothing happens" is never mysterious once you know the three things it can be: missing Rigidbody, missing Collider, or movement that dodges physics.

## Recap

- A **`Rigidbody`** hands a GameObject to the physics engine — gravity, forces, and collisions. Key knobs: `mass`, `useGravity`, `isKinematic` (true = you move it from code, but it still collides).
- Drive a Rigidbody in **`FixedUpdate`** (the physics clock) with `rb.MovePosition(...)`, `rb.AddForce(...)`, or `rb.velocity`, scaled by `Time.fixedDeltaTime` — never by editing `transform.position`, which bypasses physics (Phase 5).
- A **`Collider`** (`Box`, `Sphere`, `Capsule`, `Mesh`, plus 2D twins) gives an object a shape. **`isTrigger`** flips it from *blocking* (solid wall) to *sensing* (overlap volume).
- React to contact with **`OnCollisionEnter(Collision c)`** for solid hits and **`OnTriggerEnter(Collider other)`** for trigger overlaps (each also has `Stay`/`Exit`). Identify the other object with **`other.CompareTag("...")`**, not its name.
- Our pickup is a trigger that calls `Destroy(gameObject)` when the `"Player"` overlaps it — a complete collect mechanic.
- **The rule:** events need **at least one Rigidbody** and a **Collider on both** objects, or "nothing happens." That trio is the first thing to check.

## Quick check

```quiz
[
  {
    "q": "You add a trigger SphereCollider to a pickup, write OnTriggerEnter, and walk the player through it — but nothing fires. What is the most likely cause?",
    "choices": ["OnTriggerEnter must be spelled OnTriggerEntered", "Neither object has a Rigidbody, so no physics events fire", "Triggers only work in 2D games", "You must call Physics.Enable() in Start"],
    "answer": 1,
    "explain": "Collision and trigger events only fire when at least one of the two objects has a Rigidbody (and both have Colliders). Adding a Rigidbody to the player wakes the events up."
  },
  {
    "q": "What is the difference between a collider with isTrigger off versus on?",
    "choices": ["Off blocks movement and fires OnCollision events; on lets objects pass through and fires OnTrigger events", "Off is for 3D, on is for 2D", "On makes the object invisible", "There is no functional difference; it is only an editor label"],
    "answer": 0,
    "explain": "A solid collider (isTrigger off) physically blocks and fires OnCollisionEnter. A trigger (isTrigger on) is a sensing volume that things pass through, firing OnTriggerEnter instead."
  },
  {
    "q": "Where should you move a Rigidbody, and with which method?",
    "choices": ["In Update, by setting transform.position", "In FixedUpdate, with rb.MovePosition or rb.AddForce", "In Start, once", "In OnTriggerEnter, with Destroy"],
    "answer": 1,
    "explain": "Physics movement belongs in FixedUpdate (the physics step), driven through the Rigidbody via MovePosition, AddForce, or velocity — not by editing transform.position, which bypasses physics."
  }
]
```

---

[← Phase 5: Transforms, Input & Movement](05-transforms-input-movement.md) · [Guide overview](_guide.md) · [Phase 7: Prefabs & Instantiation →](07-prefabs-and-instantiation.md)
