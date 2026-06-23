---
title: "Transforms, Input & Movement"
guide: "unity-from-zero"
phase: 5
summary: "Move a GameObject by changing its Transform every frame, scaled by Time.deltaTime and driven by input. Vector3, transform.position, Input.GetAxis, the modern Input System, and a real PlayerMovement script."
tags: [unity, transform, input, movement, vector3]
difficulty: intermediate
synonyms: ["unity transform position", "unity move object", "unity input getaxis", "unity input system", "unity vector3", "unity player movement"]
updated: 2026-06-23
---

# Transforms, Input & Movement

Your collect-the-pickups game has a scene, a player sitting in it, and (from Phase 4) a script the engine calls every frame. But the player just sits there. Time to make it move when you press a key — the moment a project stops being a tutorial and starts feeling like a game.

Here's the whole idea before any code:

> **Moving an object = changing its Transform a little bit every frame, scaled by `Time.deltaTime`, in a direction the player chose with input.**

That's it. There's no "move" command that animates the object for you. *You* nudge its position by hand, 60-ish times a second, and the eye reads those tiny jumps as smooth motion — the same illusion as a flip-book. Once you internalize that movement is "read input → pick a direction → adjust the Transform," every movement system in Unity (player, enemies, projectiles, the camera) is a variation on the same three steps.

## The Transform: where an object lives

Every GameObject has exactly one component it can never lose: the **Transform**. It holds the object's place in the world — position, rotation, and scale. And because your scripts inherit from `MonoBehaviour`, every script gets a free shortcut to its own GameObject's Transform through the word `transform` (lowercase t).

```csharp
public class Probe : MonoBehaviour
{
    void Start()
    {
        Debug.Log(transform.position);    // where am I? -> e.g. (0.0, 1.0, 0.0)
        Debug.Log(transform.rotation);    // which way am I facing? (a Quaternion)
        Debug.Log(transform.localScale);  // how big am I? -> (1.0, 1.0, 1.0)
    }
}
```

*What just happened:* `transform` is a property the engine wires up for you — it always points at the Transform attached to the same GameObject as this script. `transform.position` is the object's location in the world. We logged it once in `Start` so it prints when the object wakes up. (`rotation` uses a `Quaternion`, a four-number representation of orientation; you rarely set it by hand this early, so we'll leave it alone.)

The three pieces you'll actually touch:

- `transform.position` — a `Vector3`, the object's spot in the world.
- `transform.rotation` — its orientation.
- `transform.localScale` — its size, relative to its original.

## Vector3: a position is three numbers

`transform.position` isn't one number — it's a **`Vector3`**, a little bundle of three: `x`, `y`, and `z`. In Unity's default 3D world, x is right/left, y is up/down, and z is forward/back. You build one with `new`:

```csharp
Vector3 spot = new Vector3(2f, 0f, 5f);   // x=2, y=0, z=5
transform.position = spot;                 // teleport this object there
transform.position = new Vector3(0f, 1f, 0f); // or inline, no variable
```

*What just happened:* `new Vector3(2f, 0f, 5f)` creates a position 2 units right and 5 units forward, at floor level (y=0). Assigning it to `transform.position` snaps the object to that exact place instantly. The `f` after each number marks it as a `float` (Unity's positions are floats, not whole numbers) — leave it off and C# will complain.

Unity hands you named shortcuts for the common directions so you don't memorize which axis is which:

```csharp
Vector3.up;       // (0, 1, 0)   -> straight up
Vector3.right;    // (1, 0, 0)   -> to the right
Vector3.forward;  // (0, 0, 1)   -> into the screen
Vector3.zero;     // (0, 0, 0)   -> the origin
```

*What just happened:* these are just pre-made `Vector3` values with friendly names. `Vector3.up` is identical to `new Vector3(0f, 1f, 0f)` — it reads better and is harder to get wrong.

> 💡 Making a **2D** game instead? Unity has a parallel type, **`Vector2`** (just `x` and `y`), and 2D games live on the x/y plane with the camera looking down the z-axis. Everything below works the same — swap `Vector3` for `Vector2` and ignore z. Our collect-the-pickups game is top-down, so we'll use `Vector3` and move on the x/z floor.

## Reading input

Movement needs a *direction*, and the direction comes from the player. Unity has **two** input systems, and it's worth knowing both exist before you pick one.

**1. The legacy Input Manager.** The old, built-in, always-available way. You ask `Input` what's happening right now:

```csharp
float h = Input.GetAxis("Horizontal");        // -1 (left) .. 0 .. 1 (right)
float v = Input.GetAxis("Vertical");          // -1 (down) .. 0 .. 1 (up)

bool jumping = Input.GetKeyDown(KeyCode.Space); // true the frame Space is pressed
bool held = Input.GetKey(KeyCode.Space);        // true every frame Space is held
```

*What just happened:* `Input.GetAxis("Horizontal")` reads the arrow keys and A/D (and a gamepad stick) and returns a number from -1 to 1 — and it *smooths* the value, ramping up and easing back to zero, so motion built on it feels less robotic. `"Vertical"` does the same for up/down via the arrows and W/S. `GetKeyDown` fires `true` for exactly one frame, the instant a key goes down (great for "jump" or "shoot"); `GetKey` stays `true` the whole time it's held (great for "keep moving").

> 📝 **The newer Input System package is the current, recommended choice.** It's action-based (you bind an action like "Move" to keys, a stick, and a touch control at once), handles multiple devices and rebinding cleanly, and is where Unity is investing. It's a bit more setup, so for *learning* the movement idea we'll use the legacy `Input.GetAxis` — the concept is identical, and you can migrate later. Just know that when a real project asks you to add the Input System package, that's not a detour: it's the modern path.

## Putting it together: PlayerMovement

Now the three steps — read input, build a direction, adjust the Transform — in one script. Attach this to your player GameObject (Phase 3 covered the Add Component flow).

```csharp
public class PlayerMovement : MonoBehaviour
{
    [SerializeField] private float speed = 5f;

    void Update()
    {
        float h = Input.GetAxis("Horizontal");
        float v = Input.GetAxis("Vertical");

        Vector3 move = new Vector3(h, 0f, v);
        transform.position += move * speed * Time.deltaTime;
    }
}
```

*What just happened:* every frame, `Update` reads horizontal and vertical input into `h` and `v`. We pack them into a `Vector3` — x from horizontal, **z** from vertical (top-down, so vertical input drives forward/back), and y left at 0 so the player stays on the floor. Then we *add* that direction to the current position. The `speed * Time.deltaTime` part is the Phase 4 lesson: `Time.deltaTime` is how long the last frame took, so multiplying by it makes the player travel the same real-world distance per second whether the game runs at 30 or 144 fps. `[SerializeField] private float speed = 5f;` exposes `speed` as a tweakable slider in the Inspector while keeping the field private to other code — so you can balance the feel without recompiling. When no key is pressed, `h` and `v` are 0, `move` is `(0,0,0)`, and the player holds still.

Press Play, tap the arrow keys, and the player slides around the floor. That's a real game responding to you.

### One catch: diagonals are too fast

Hold Right *and* Up together. The player moves faster diagonally than straight — because `new Vector3(1f, 0f, 1f)` has a length of about 1.41, not 1. The two inputs stack.

```csharp
Vector3 move = new Vector3(h, 0f, v);
if (move.magnitude > 1f)
    move = move.normalized;     // clamp diagonal length back to 1
transform.position += move * speed * Time.deltaTime;
```

*What just happened:* `move.normalized` returns the same direction but with length exactly 1, so diagonal movement matches straight-line speed. We only normalize when the length exceeds 1, so partial stick input (a gamepad nudged halfway) still moves slowly instead of being forced to full speed.

> 💡 `.normalized` gives you a *copy* at length 1; `.Normalize()` changes the vector in place. Reach for normalizing any time you have a direction whose length you don't want to matter — movement, aiming, knockback. It's one of those small habits that quietly fixes a "why does this feel off" bug before it happens.

## The wall you'll walk straight through

Run the game and steer the player into a wall. It glides right through it.

> ⚠️ **Setting `transform.position` directly ignores physics entirely.** You are teleporting the object frame by frame — colliders, walls, and gravity have no say. It's perfect for *learning* input and motion (and fine for things like a free-flying camera), but it is **not** how you move a character that should bump into things. For physics-correct movement — stopping at walls, sliding along them, being pushed — you move a **Rigidbody** instead, which is exactly what Phase 6 covers next. Don't try to bolt collision detection onto direct transform movement; that's a rabbit hole. Learn the input here, then hand movement to the physics engine there.

For now, direct transform movement is the right tool: it taught you the loop without a pile of physics setup in the way. The pickups in our game don't need the player to collide with walls yet — they need the player to *reach* them, and now it can.

## Recap

- Every GameObject has a **Transform**; your script reaches its own via `transform`, and `transform.position` is its spot in the world.
- A position is a **`Vector3`** (`x`, `y`, `z`); build one with `new Vector3(...)` or use shortcuts like `Vector3.up` and `Vector3.forward`. 2D uses `Vector2` on the x/y plane.
- **Input** comes from the legacy `Input.GetAxis`/`GetKey` (simple, always there) or the newer **Input System** package (action-based, multi-device, the modern recommendation).
- Move by reading input, building a direction `Vector3`, and adding `direction * speed * Time.deltaTime` to `transform.position` every frame.
- **Normalize** the direction so diagonal movement isn't faster than straight movement.
- Setting `transform.position` directly **ignores physics** and walks through walls — fine for learning input, but real characters move via a Rigidbody (Phase 6).

## Quick check

```quiz
[
  {
    "q": "Why multiply movement by Time.deltaTime each frame?",
    "choices": ["To make the object move faster", "So speed stays consistent regardless of frame rate", "To convert the Vector3 to a Vector2", "It is required for Input.GetAxis to work"],
    "answer": 1,
    "explain": "Time.deltaTime is the duration of the last frame, so multiplying by it makes the object travel the same distance per second whether the game runs at 30 or 144 fps."
  },
  {
    "q": "What does Input.GetAxis(\"Horizontal\") return?",
    "choices": ["true or false", "A Vector3 direction", "A number from -1 to 1 based on left/right input", "The number of keys pressed"],
    "answer": 2,
    "explain": "It returns a smoothed float from -1 (left) to 1 (right), reading arrow keys, A/D, or a gamepad stick."
  },
  {
    "q": "What happens if you steer a player into a wall using transform.position directly?",
    "choices": ["The player stops at the wall automatically", "The player slides along the wall", "The player passes straight through it", "Unity throws an error"],
    "answer": 2,
    "explain": "Setting transform.position directly ignores physics and colliders, so the object teleports through walls. Physics-correct movement uses a Rigidbody (Phase 6)."
  }
]
```

---

[← Phase 4: MonoBehaviour & the Game Loop](04-monobehaviour-and-the-game-loop.md) · [Guide overview](_guide.md) · [Phase 6: Physics & Collisions →](06-physics-and-collisions.md)
