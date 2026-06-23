---
title: "UI, Audio & Building"
guide: "unity-from-zero"
phase: 8
summary: "Turn the pickups demo into a real game: a Canvas with TextMeshPro score text, a GameManager holding shared state, an AudioSource for pickup sounds and music, then a build that exports your scenes to a platform."
tags: [unity, ui, audio, build, gamemanager]
difficulty: intermediate
synonyms: ["unity ui canvas", "unity textmeshpro score", "unity audiosource", "unity game manager", "unity build settings", "unity export game"]
updated: 2026-06-23
---

# UI, Audio & Building

You can move a player, collide with things, and spawn pickups (Phases 5–7). But right now collecting a pickup makes it vanish and... nothing else. No score on screen, no satisfying chime, no way to hand the game to a friend. This phase closes that gap — it's the difference between a tech demo and a thing people call a game.

Three pieces, one idea each:

> **UI is GameObjects living under a Canvas. A GameManager holds shared state (like the score) and updates that UI. Building exports your scenes to a platform people can actually run.**

That's the whole arc. The pickups game already *works* — this phase makes it *finished*. Hold the mental model: there's no separate "UI layer" with its own rules; a score label is just another GameObject with a text component, the same composition you've used since Phase 3. And a build isn't a mysterious export — it's Unity packaging the scenes you list into an app for the platform you pick.

## UI lives under a Canvas

Every bit of on-screen interface in Unity — text, buttons, images, sliders — lives as a child of a special GameObject called a **Canvas**. The Canvas is the drawing surface for UI; by default it renders in **screen-space overlay**, meaning it's painted flat on top of the game, unaffected by the camera or the 3D world. Move your camera around, and the score stays pinned to the corner. That's what you want for a HUD.

In the editor: right-click in the Hierarchy → **UI → Text - TextMeshPro**. Unity creates a Canvas for you automatically (if you don't have one) and drops the text inside it. The first time, it'll offer to import the **TMP Essentials** — say yes; that's the font data TextMeshPro needs.

> 📝 You'll see two text options: plain **Text** (the old, legacy UI text) and **Text - TextMeshPro**. Always reach for **TextMeshPro**. It's the modern text component — sharper rendering at any size, rich formatting, and it's what every current tutorial and project assumes. The legacy one is there for old projects; ignore it.

Position the text in the top-left using the Rect Transform's anchor presets, type a placeholder like `Score: 0`, and you've got a label on screen. Now you need a script to *change* that label as the game plays.

## Referencing and setting text from a script

A script reaches a UI text component the same way it reaches any component: you declare a field for it and drag the object in via the Inspector. The TextMeshPro types live in the `TMPro` namespace, so the file starts with a `using TMPro;`.

```csharp
using UnityEngine;
using TMPro;

public class ScoreLabel : MonoBehaviour
{
    [SerializeField] private TMP_Text label;

    void Start()
    {
        label.text = "Score: 0";
    }
}
```

*What just happened:* `using TMPro;` pulls in the TextMeshPro types so you can name them. `TMP_Text` is the component type for a TextMeshPro label (the on-screen kind is technically `TextMeshProUGUI`, but `TMP_Text` is the shared base — referencing that works and reads cleaner). `[SerializeField] private TMP_Text label;` makes an empty slot appear on this script in the Inspector; you drag your score text object onto it, and now `label` points at that component. Setting `label.text = "..."` changes the words shown on screen. That single `.text` assignment is the whole trick to live UI — change the string, the display updates.

That's the mechanism. But the *score* shouldn't live in a label script — it should live somewhere any part of the game can reach it. That's the job of a GameManager.

## The GameManager: one place for shared state

Your game has state that doesn't belong to any single object. The score isn't the player's, and it isn't a pickup's — it's the *game's*. The common pattern is a **GameManager**: a GameObject with one script that holds that shared state and owns the methods that change it.

Here's a minimal one for our game:

```csharp
using UnityEngine;
using TMPro;

public class GameManager : MonoBehaviour
{
    [SerializeField] private TMP_Text scoreText;
    private int score;

    public void AddPoint()
    {
        score++;
        scoreText.text = $"Score: {score}";
    }
}
```

*What just happened:* the GameManager keeps the score in a private `int` so nothing else can scribble on it directly. The only way to change it is `AddPoint()`, which bumps the score by one and immediately rewrites the on-screen label using a string interpolation (`$"Score: {score}"` drops the current number into the text). Make a GameObject named `GameManager`, attach this script, and drag your score text onto its `scoreText` slot. Now there's one trustworthy owner of the score, and one method that keeps the number and the display in sync — they can never drift apart, because they're updated in the same breath.

### Wiring it to the pickup (back to Phase 6)

Remember the pickup's trigger from Phase 6 — the `OnTriggerEnter` that fires when the player overlaps a pickup and then `Destroy`s it. That's exactly where the score should go up. The pickup needs a reference to the GameManager so it can call `AddPoint()`:

```csharp
using UnityEngine;

public class Pickup : MonoBehaviour
{
    [SerializeField] private GameManager gameManager;

    void OnTriggerEnter(Collider other)
    {
        if (other.CompareTag("Player"))
        {
            gameManager.AddPoint();
            Destroy(gameObject);
        }
    }
}
```

*What just happened:* when the player enters the pickup's trigger, the pickup tells the GameManager to add a point, then destroys itself — the same disappear-on-collect from Phase 6, now with a consequence. The score ticks up, the label updates, the pickup vanishes. That's the full pickup-to-score loop closed. (Each pickup needs its `gameManager` slot filled; if your pickups are spawned from a prefab as in Phase 7, you'd hand them the reference when you `Instantiate` them, or have them find the manager — see the singleton note below.)

> 📝 **The singleton pattern — useful, easy to overuse.** Dragging a GameManager reference onto every pickup gets tedious fast. A very common shortcut is to make the GameManager a *singleton*: a static `Instance` any script can reach without a reference, e.g. `GameManager.Instance.AddPoint();`. You set it in `Awake` with `Instance = this;`. It's genuinely handy for the one or two truly global things in a game (the manager, an audio system). The smell is when *everything* becomes a singleton and your objects all secretly depend on global state — that makes the game hard to test and reason about. Use it sparingly, for things there's genuinely only ever one of.

## Audio: a sound when you collect

A game without sound feels half-asleep. Unity plays audio through two pieces working together: an **`AudioClip`** is the actual sound file (your chime, your music), and an **`AudioSource`** is the component that plays it. You attach an AudioSource to a GameObject, and tell it which clip to play.

For a one-off sound like a pickup chime, the right call is `PlayOneShot`:

```csharp
using UnityEngine;

public class GameManager : MonoBehaviour
{
    [SerializeField] private TMP_Text scoreText;
    [SerializeField] private AudioSource audioSource;
    [SerializeField] private AudioClip pickupSound;
    private int score;

    public void AddPoint()
    {
        score++;
        scoreText.text = $"Score: {score}";
        audioSource.PlayOneShot(pickupSound);
    }
}
```

*What just happened:* we gave the GameManager an `AudioSource` (the speaker) and an `AudioClip` (the chime), both filled via the Inspector. `audioSource.PlayOneShot(pickupSound)` plays the clip once, layered on top of anything else the source is doing — so rapid pickups chime over each other instead of cutting one another off. Putting this in `AddPoint()` means every score increase is *heard* as well as seen. (You'll need `using TMPro;` at the top too, for the `TMP_Text` field — keeping the snippet focused, that line is unchanged from before.)

For **background music** you don't trigger it from code at all — you set it up on the AudioSource component itself in the Inspector: drop in a music clip, and tick **Loop** and **Play On Awake**. That source starts the music the moment the scene loads and loops it forever, no script required.

> 💡 `PlayOneShot` is for fire-and-forget sound effects you might overlap (footsteps, coins, hits). The plain `audioSource.Play()` plays the source's assigned clip and *restarts* it if called again — better for music or a single looping sound, worse for rapid effects because each call cuts off the last.

## Building: from editor to a real app

Everything so far runs inside the Unity editor when you press Play. A **build** is Unity packaging your game into a standalone app — a `.exe`, a Mac app, an Android `.apk`, or a browser-playable WebGL folder — that runs without the editor. This is how the game leaves your machine.

Open **File → Build Settings** (in newer Unity versions this is **Build Profiles**, same idea). You'll do three things:

1. **Add your scenes.** There's a "Scenes In Build" list. Click **Add Open Scenes** (or drag scenes in) to include your game's scene. The order matters — the first scene in the list is the one that loads when the game starts.
2. **Pick a platform.** Windows, Mac, Linux, Android, iOS, or **WebGL**. WebGL is the magic one for sharing: it exports a build that runs in any modern browser, so you can put your game on a web page and someone plays it with a link — no install. Selecting a platform may trigger a one-time module download.
3. **Set Player settings and Build.** The Player settings hold your game's name, icon, and resolution options. Then hit **Build**, choose an output folder, and Unity compiles everything.

> ⚠️ **Scenes must be in the "Scenes In Build" list or they won't ship.** This trips up nearly everyone once: the game runs perfectly in the editor (where the open scene plays regardless), then the build launches to a black screen or the wrong level — because the scene you tested was never added to the list. Before every build, glance at that list and confirm your scenes are there, in the right order.

When the build finishes, you have a real, distributable game. The pickups demo is now something you can hand to someone.

> Building is the technical half of finishing. The other half — actually getting it in front of players, naming it, and not letting it rot in a folder — is its own discipline. [Ship Your Side Project](/guides/ship-your-side-project) is the mindset for crossing that last mile, and it applies to a game build exactly as much as to a web app.

## Recap

- **UI lives under a Canvas** — a special GameObject that draws the interface; text, buttons, and images are its children, rendered in screen-space overlay by default.
- Use **TextMeshPro** (`TMP_Text`) for text, not the legacy Text. A script changes a label by setting `.text` on a referenced component.
- A **GameManager** holds shared game state (the score) and owns the methods that change it, like `AddPoint()` — keeping the number and the displayed label in sync. The pickup's trigger from Phase 6 calls `AddPoint()`.
- The **singleton** pattern (a static `Instance`) makes a manager globally reachable — handy for the one or two truly global systems, a smell when overused.
- **Audio** = an `AudioSource` (the speaker) playing an `AudioClip` (the sound). `PlayOneShot(clip)` for overlapping effects; an AudioSource with Loop + Play On Awake for background music.
- A **build** packages your scenes into a standalone app via Build Settings: add scenes (or they won't ship), pick a platform (WebGL for browser play), set Player settings, and Build.

## Quick check

```quiz
[
  {
    "q": "What does every UI element in Unity need as a parent?",
    "choices": ["A Rigidbody", "A Canvas", "The Main Camera", "A GameManager"],
    "answer": 1,
    "explain": "UI elements (text, buttons, images) live as children of a Canvas, the special GameObject that draws the interface — by default in screen-space overlay, on top of the game."
  },
  {
    "q": "Why keep the score in a GameManager with an AddPoint() method instead of in the pickup or player script?",
    "choices": ["It makes the game build faster", "Shared state needs one owner, and AddPoint() keeps the number and the on-screen label in sync", "Pickups cannot hold integer values", "Unity requires a script named GameManager"],
    "answer": 1,
    "explain": "The score belongs to the game, not any single object. One owner with one update method means the score value and its displayed label can never drift out of sync."
  },
  {
    "q": "Your game runs fine in the editor, but the build launches to a black screen. What is the most likely cause?",
    "choices": ["You forgot to attach an AudioSource", "The scene was never added to the Scenes In Build list", "TextMeshPro Essentials were not imported", "The Canvas is in world-space mode"],
    "answer": 1,
    "explain": "The editor plays whatever scene is open, but a build only includes scenes in the Scenes In Build list. A scene missing from that list won't ship, so the build has nothing to load."
  }
]
```

---

[← Phase 7: Prefabs & Instantiation](07-prefabs-and-instantiation.md) · [Guide overview](_guide.md) · [Phase 9: Where to Go Next →](09-where-to-go-next.md)
