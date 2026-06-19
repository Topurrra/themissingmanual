---
title: "Boxes and Arrows"
guide: "what-architecture-means"
phase: 1
summary: "Software architecture is the high-level shape of a system: the major components (the boxes) and how they talk to each other (the arrows), decided before you build — like a building's floor plan."
tags: [architecture, components, system-design, mental-model, diagrams]
difficulty: beginner
synonyms: ["what is software architecture", "boxes and arrows", "what is a component in software", "high level system design", "what does a system architecture diagram show"]
updated: 2026-06-19
---

# Boxes and Arrows

Let's start with the one picture that makes everything else click. Forget patterns, frameworks, and the scary diagrams you've seen on whiteboards. We're going to build the mental model first, because once you have it, "architecture" stops being a vague word and becomes something you can actually see.

## What architecture actually is

**What it actually is.** The architecture of a software system is its **high-level shape** — the major parts it's made of, and how those parts talk to each other. That's genuinely it. People draw the parts as **boxes** and the conversations between them as **arrows**, which is why you'll hear engineers casually call this "boxes and arrows."

Here's the most common shape in all of software — the one behind nearly every website and app you use:

```text
   ┌──────────────┐        ┌──────────────┐        ┌──────────────┐
   │   THE WEB    │  ───►  │   THE API    │  ───►  │  THE DATABASE │
   │   (browser)  │        │   (server)   │        │   (storage)   │
   │              │  ◄───  │              │  ◄───  │              │
   └──────────────┘        └──────────────┘        └──────────────┘
     what the user          the rules and             where the data
     sees and clicks        logic live here           is kept safe

     ──►  "sends a request"        ◄──  "sends an answer back"
```

Read it left to right: you click something in your **browser**, which sends a request to the **server** (often called the API), which asks the **database** for the data it needs, and the answer flows back the other way. Three boxes, arrows between them. That diagram *is* an architecture.

**Why people get this wrong.** Beginners often think architecture means "the code" — the files, the functions, the language you chose. But architecture lives one level *above* the code. You could rewrite every line inside the "API" box and the architecture wouldn't change at all, as long as it still sits between the web and the database and talks to both the same way. Architecture is about the boxes and the arrows, not what's written inside any single box.

📝 **Terminology.** A **component** is one of the boxes — a meaningful, self-contained part of the system with a clear job (the browser, the server, the database). When someone says "component," picture one box.

## The floor-plan mental model

Here's the analogy that makes it stick: **architecture is the floor plan of a building.**

When an architect designs a house, they don't pick the paint colors or the furniture first. They decide the *shape*: where the load-bearing walls go, how many floors, where the plumbing runs, how rooms connect. Those decisions come **before** anyone pours concrete — and they shape everything that follows.

Software architecture is the same move. Before you write the detailed code (the paint and furniture), you decide the shape: what the major pieces are, where each kind of work happens, and how the pieces connect.

```text
   BUILDING                          SOFTWARE
   ─────────                         ────────
   floor plan          ⇄            architecture diagram
   rooms               ⇄            components (the boxes)
   hallways / doors    ⇄            connections (the arrows)
   load-bearing wall   ⇄            a core decision everything rests on
   paint & furniture   ⇄            the day-to-day code inside each box
```

**What it does in real life.** Deciding the shape up front gives everyone a shared map. When a new engineer joins, you hand them the boxes-and-arrows picture and they understand the system in minutes instead of weeks. When something breaks, the diagram tells you *where* to look. When someone proposes a new feature, you can point at the boxes and say "this lives here, and it'll need to talk to that."

💡 **Key point.** Architecture is the **high-level shape** of a system — the major components and the connections between them — chosen before the detailed building begins. Boxes and arrows. Floor plan, not furniture.

## Reading a real architecture

Let's make those three boxes concrete. Imagine you open a weather app and check today's forecast. Here's the conversation that happens between the boxes:

```text
   YOU tap "Today"
        │
        ▼
   ┌──────────┐   "GET today's forecast for London"   ┌──────────┐
   │ BROWSER  │  ───────────────────────────────────► │  SERVER  │
   │ / APP    │                                        │  (API)   │
   └──────────┘                                        └────┬─────┘
        ▲                                                   │ "find London's
        │                                                   ▼  latest forecast"
        │            { "high": 18, "low": 11,         ┌──────────┐
        └──────────────  "summary": "cloudy" }   ◄────│ DATABASE │
                                                       └──────────┘
```

*What just happened:* The app didn't know the forecast itself — it just knew *who to ask*. It sent a request to the server. The server held the logic ("which city? what's the latest reading?") and asked the database, which is where the actual numbers live. The database handed back the data, the server passed it along, and the app drew it on your screen. Each box did one job and trusted the next box to do its own. That separation — each part with a clear role — is the heart of good architecture.

**The gotcha.** It's tempting to think more boxes always means better architecture. It doesn't. Every box you add is another thing to build, run, and debug, and every arrow is a connection that can fail. A great architecture has *exactly as many boxes as the problem needs* — no more. We'll come back to this hard in [Phase 3](03-thinking-in-trade-offs.md); for now, just notice that the three-box shape above is powerful precisely because it's small.

**Why this saves you later.** Once you can see systems as boxes and arrows, a huge amount of engineering talk decodes itself. "The API is slow" means one specific box is taking too long to answer. "We should cache that" means adding a small box that remembers recent answers so you don't bother the database every time. "It's a network issue" means an *arrow* is failing, not a box. You're no longer guessing — you have a map.

## Recap

1. **Architecture is the high-level shape of a system**: the major components (boxes) and how they talk (arrows).
2. It lives **above the code** — you can rewrite what's inside a box without changing the architecture.
3. The most common shape is **web → API → database**: the UI asks, the server decides, the database remembers.
4. Think **floor plan, not furniture** — the shape is decided before the detailed building, and it gives everyone a shared map.

Next, we'll answer the obvious question: if architecture is just the shape, why do people treat it as such a big deal? The answer is about *cost*.

---

[← Guide overview](_guide.md) · [Phase 2: Why It Matters →](02-why-it-matters.md)
