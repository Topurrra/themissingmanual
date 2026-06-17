# Design System — The Missing Manual

## Product Context
- **What this is:** A free, text-first library of real-world developer knowledge, written like advice from a battle-hardened friend.
- **Who it's for:** Junior and mid-level developers drowning in undocumented reality; anyone who wants to actually understand the tools that run the world.
- **Project type:** Reading-first, search-first content platform (SvelteKit web app over a Rust/Tantivy API).
- **The one thing to remember:** "The manual a senior who actually cares would hand you." Calm, trustworthy, with a face.

## Aesthetic Direction
- **Direction:** Minimal-technical with an editorial headline. Calm, readable, developer-credible, character in the type.
- **Decoration:** Minimal. Typography, whitespace, and one accent do the work. No gradients, no decorative blobs.

## Typography
- **Display / headings / wordmark:** Bricolage Grotesque (500–700), at restrained sizes. Personality without shouting.
- **Body:** Geist (400–600). Clean, modern, excellent for long-form on screen.
- **Code:** JetBrains Mono (400–500). Dev-native; the content is code-heavy.
- **Loading:** Google Fonts `<link>` in `platform/web/src/app.html`.
- **Scale:** body 17px / 1.7; h1 2rem; h2 1.5rem; h3 1.2rem; tight letter-spacing on display.

## Color
- **Approach:** Restrained. One accent, crisp light base.
- **Background:** `#fcfcfd`  ·  **Surface:** `#f4f4f5`
- **Ink (headings):** `#131316`  ·  **Body:** `#2c2c33`  ·  **Muted:** `#5c5c66`  ·  **Faint:** `#8a8a93`
- **Line:** `#e8e8ec`
- **Accent (teal):** `#0e7c86`  ·  **Accent strong (hover / links):** `#0a5f67`
- **Code block:** bg `#16161a`, text `#e6e6ea`; inline code on `#eeeef1` in accent-strong.

## Spacing & Layout
- **Reading measure:** max-width 720px, centered.
- **Rhythm:** rem-based vertical spacing; sticky blurred header.
- **Radius:** 8px inputs/buttons, 10px code blocks, 12px cards.

## Motion
- **Approach:** Minimal-functional. Link / hover / focus transitions only. It is a place to read.

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-06-17 | Bricolage + Geist + JetBrains Mono, teal accent | Minimal-technical base with an editorial headline, after rejecting a warm literary-serif direction. Teal chosen over cobalt / emerald / charcoal for a confident-but-calm, non-generic look. |
