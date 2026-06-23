---
title: "Unity From Zero"
guide: "unity-from-zero"
phase: 0
summary: "Learn the game engine behind a huge share of the games industry: the editor, GameObjects and Components, the MonoBehaviour script lifecycle, transforms and input and movement, physics and collisions, prefabs and instantiation, UI and audio, and building your game. C# game development, taught mental-model-first."
tags: [unity, csharp, game-development, gamedev, monobehaviour, engine]
category: frameworks
order: 31
group: "C#"
difficulty: intermediate
synonyms: ["learn unity", "unity tutorial", "unity c# scripting", "unity gameobject component", "monobehaviour", "unity for beginners", "unity game engine", "make a game in unity"]
updated: 2026-06-23
---

# Unity From Zero

Unity is the engine behind an enormous slice of the games you've played — indie hits, mobile chart-toppers,
and plenty of AA titles — and it's a whole career path of its own, separate from web and backend work. If
you know C# already, Unity is your fastest route into making games: the engine handles rendering, physics,
audio, input, and the platform builds, and you write C# scripts that bring it all to life. This guide takes
you from opening the editor to a small, playable game you built yourself.

The mental model is one pattern repeated everywhere: **composition**. A scene is a collection of
**GameObjects** (every player, enemy, camera, light, and bit of UI is one), and each GameObject is an empty
container that does something only because of the **Components** attached to it — a Transform (position), a
Renderer (how it looks), a Rigidbody (physics), and your own **scripts** (behavior). You don't subclass a
god-object; you *compose* behavior by attaching components. Hold "a GameObject is a bag of Components, and
your scripts are Components," and Unity stops being a sprawling tool and becomes a system you can reason about.

> 📝 This teaches the **engine** — it assumes you know **C#**: classes, methods, fields, and inheritance
> ([C# From Zero](/guides/csharp-from-zero)). It's a different world from the web frameworks
> ([What a Framework Even Is](/guides/what-a-framework-even-is) sets the broad context). Unity runs in its
> own editor and builds native apps, so examples are shown as C# scripts and editor steps rather than run on
> the page.

## How to read this

Read in order — it builds one small game (a top-down **collect-the-pickups** game: a player you move, items
to grab, a score) from an empty scene to a built, playable result. Phases carry difficulty badges.

## The phases

**Part 1 — The engine model (🟢 Basic → 🟡)**
1. **[What Unity Is](01-what-unity-is.md)** 🟢 — the engine, the editor, scenes, and the GameObject/Component idea.
2. **[The Editor](02-the-editor.md)** 🟢 — the Scene/Game/Hierarchy/Inspector/Project windows, and how you build a scene.
3. **[GameObjects & Components](03-gameobjects-and-components.md)** 🟡 — composition over inheritance, the Transform, and attaching components.

**Part 2 — Bringing it to life (🟡 → 🔴)**
4. **[MonoBehaviour & the Game Loop](04-monobehaviour-and-the-game-loop.md)** 🟡 — scripts as components, `Start`/`Update`, and frame-rate-independent movement.
5. **[Transforms, Input & Movement](05-transforms-input-movement.md)** 🟡 — moving objects, reading input, and the new Input System.
6. **[Physics & Collisions](06-physics-and-collisions.md)** 🔴 — Rigidbody, Colliders, triggers, and `OnCollision`/`OnTrigger`.
7. **[Prefabs & Instantiation](07-prefabs-and-instantiation.md)** 🔴 — reusable objects, spawning at runtime, and `Destroy`.

**Part 3 — A real game (🟡 → 🟢)**
8. **[UI, Audio & Building](08-ui-audio-and-building.md)** 🟡 — a score UI, sound, game state, and exporting a build.
9. **[Where to Go Next](09-where-to-go-next.md)** 🟢 — Unity vs Godot/Unreal, ScriptableObjects, and what to build.

> The throughline: a scene is **GameObjects**, each a bag of **Components**, and your **scripts are
> Components** the engine calls every frame. Hold that and Unity is approachable.

---

[Phase 1: What Unity Is →](01-what-unity-is.md)
