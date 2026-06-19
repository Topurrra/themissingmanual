---
title: "Why APIs Exist"
guide: "what-an-api-is"
phase: 2
summary: "APIs exist for three reasons — reuse (don't rebuild maps or payments yourself), separation (the frontend talks to the backend through a clean line), and integration (your app uses someone else's service) — all resting on one idea: a stable boundary you can depend on while the other side changes."
tags: [apis, reuse, integration, separation-of-concerns, boundaries]
difficulty: beginner
synonyms: ["why do apis exist", "why use an api", "what are apis good for", "frontend backend api", "why integrate with an api", "what problem do apis solve"]
updated: 2026-06-19
---

# Why APIs Exist

In Phase 1 we built the picture: an API is a contract that hides a kitchen. Fair enough — but *why* build software this way? Why not have each program just do everything itself? The answer is three real problems that APIs solve, and they show up constantly. Once you can name them, you'll spot APIs doing their job all over the software you already use.

## Reason 1: Reuse — don't rebuild the kitchen

Imagine you're building an app that needs a map. To do it yourself, you'd have to gather road data for the entire planet, keep it updated as roads change, draw the tiles, calculate driving routes... it's not a feature, it's a decade-long company.

So you don't. You use a maps **API** offered by someone who already did all that. Your app asks "draw a map centered here" or "give me directions from A to B," and their system does the heavy lifting. You got a planet's worth of map work for the cost of placing an order from a menu.

```text
   WITHOUT an API                  WITH an API
   ──────────────                  ───────────
   build maps yourself             ask a maps service
   build payments yourself         ask a payments service
   build email sending yourself    ask an email service
   (years of work each)            (a request each)
```

**What it does in real life.** This is why you almost never see an app handle credit cards by writing its own banking code. Money is hard and dangerous to get right, so apps use a payments API (the well-known one is Stripe) and let a specialist's system do the risky part. The app's job shrinks to *placing the order correctly.*

💡 **Key point.** An API lets you **reuse someone else's hard work** without rebuilding it — and without even understanding how they did it. The menu is all you need.

## Reason 2: Separation — a clean line through your own software

APIs aren't only for talking to *other* companies. They're also how a single app keeps its own halves from becoming a tangled mess.

Most apps you use have two big parts. There's the part you see and touch — the screens, the buttons, the layout — and there's the part that holds the real data and rules behind the scenes.

📝 **Terminology.** The visible part is the **frontend** (what runs in your browser or phone — the buttons and screens). The behind-the-scenes part is the **backend** (the server that stores data, checks passwords, enforces the rules). "Front" and "back" are literal: front is what faces the user, back is what's kept in back.

These two halves talk to each other through — you guessed it — an API.

```text
   ┌──────────────┐        the API         ┌──────────────┐
   │  FRONTEND    │   ── "log this user │   │  BACKEND     │
   │  (the screen │       in" ──────────►│   │  (data,      │
   │   you touch) │                      │   │   rules,     │
   │              │◄── "ok, here's their │   │   passwords) │
   └──────────────┘     name and inbox" ─┘   └──────────────┘
```

When you log in, the frontend doesn't check your password itself — it sends your details across this API to the backend and asks "is this person allowed in?" The backend does the checking and answers. Because there's a clean contract between them, two different teams can work on the two halves at once, and either side can be rebuilt without dragging the other along — as long as the contract holds.

**Why people get this wrong.** Beginners often picture an app as one single blob of code. Most real apps aren't; they're a frontend and a backend that *only* communicate through an agreed API. Knowing this line exists explains a lot — like why a website can change its entire look overnight while your data and login stay exactly the same. They changed the frontend; the backend and the contract between them didn't move.

## Reason 3: Integration — plugging into someone else's service

The third reason is the one that makes the modern software world feel connected: **integration.** When your app uses another company's service through its API, the two are "integrated."

This is how a small app can suddenly do big things. It posts to social media (through the platform's API), sends text messages (through a messaging API), checks the weather, looks up a shipment, charges a card — all by being a polite customer at other companies' menus. Your app becomes a coordinator that knows *which kitchens to order from*, rather than a place that cooks everything.

🪖 **War story.** A team I knew once seriously debated building their own email-sending system — handling spam filters, bounced addresses, the lot. They estimated months of work. Instead they integrated with an email API in an afternoon and shipped that week. The lesson stuck: before building a "kitchen," check whether someone already runs one and put a menu out front.

## The idea underneath all three: a stable boundary

Reuse, separation, integration — they look like three different things, but they're all the same trick. An API draws a **stable boundary** between two pieces of software. On your side of the boundary, you only have to know the contract. On the other side, they're free to change everything *except* the contract.

```text
        YOUR SIDE          │          THEIR SIDE
   ────────────────────────┼────────────────────────
   you depend only on      │  they can rewrite,
   the contract (the menu) │  rebuild, rehire, rehouse
                           │  — anything but the menu
        ───────────────────┴───────────────────
              the API = the line you both agree not to cross
```

This is why a boundary is so valuable. Software changes constantly — bugs get fixed, systems get rewritten, companies move things around. A stable API is the one thing both sides promise *not* to yank around. It lets the kitchen evolve while every customer who ordered from the menu keeps getting their pizza.

⚠️ **Gotcha.** That promise is exactly why **breaking an API is a big deal.** If a service changes its menu — renames a request, drops a field from the response — every app that depended on the old menu can break at once, often without warning. This is the reason serious APIs go to great lengths to keep old contracts working (you'll hear this called "versioning"), and why "we broke the API" is something engineers say in a lowered voice.

**Why this saves you later.** When you hear "we expose that through an API," "the frontend calls the backend," or "we integrated with their API," you'll now hear the *reason* underneath: someone wanted to reuse work, separate two halves, or plug into a service — by drawing a stable boundary they could depend on. That's the whole game.

## Recap

1. **Reuse** — use someone else's hard work (maps, payments, email) instead of rebuilding it.
2. **Separation** — the frontend and backend of one app talk through a clean API line, so each can change independently.
3. **Integration** — your app plugs into other companies' services through their APIs.
4. All three are the same idea: an API is a **stable boundary** you depend on while the other side is free to change — which is exactly why breaking it matters so much.

Next, we'll get concrete about the *kinds* of APIs you'll meet — the ones living inside your own program versus the ones you reach across a network — and name the styles you'll keep hearing about.

---

[← Phase 1: A Contract Between Programs](01-a-contract-between-programs.md) · [Phase 3: Kinds of APIs →](03-kinds-of-apis.md)
