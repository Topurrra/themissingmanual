# Frontend brief — render Mermaid diagrams in guides

**For:** web/designer agents. **From:** backend. **Decision:** Mermaid is our diagram tool (chosen over D2).
**Backend status:** no change needed — comrak already passes ```mermaid blocks straight through as
`<pre><code class="language-mermaid">…</code></pre>`. The writer skill now authors diagrams in Mermaid.

## What to build
Render fenced `mermaid` code blocks inside rendered guide HTML as themed SVG.

1. **Detect** — in the guide reader (`routes/guides/[slug]/[phase]/+page.svelte`, which does
   `{@html phase.html}`, and the overview), after mount find `code.language-mermaid` blocks.
2. **Render** — load `mermaid` (npm `mermaid@11`), `mermaid.run({ nodes })` (or `render()`), replace each
   block with its SVG. Load it **lazily** (dynamic `import()` only when a diagram is present) to keep the
   bundle small.
3. **Theme it to the site** — initialize with a theme that matches our design (dark/light + teal). Starting
   point (tune to `app.css` tokens):
   ```js
   mermaid.initialize({ startOnLoad: false, theme: 'base', securityLevel: 'strict',
     themeVariables: { fontFamily: 'IBM Plex Sans, system-ui, sans-serif',
       primaryColor: 'var(--raise)', primaryBorderColor: 'var(--accent)', lineColor: 'var(--accent-strong)',
       primaryTextColor: 'var(--ink)' } });
   ```
   (Mermaid wants concrete colors, not CSS vars, so read the computed token values or keep a dark + light
   palette.)
4. **Re-render on theme toggle** — when `data-theme` changes (the `Appearance` component owns it), re-run
   Mermaid with the matching theme so diagrams never look out of place.
5. **No flash** — hide `code.language-mermaid` (e.g. `visibility:hidden` on the wrapper) until rendered, so
   the raw source never shows.
6. **Responsive** — SVG `max-width:100%`, centered; for wide diagrams allow horizontal scroll or a
   tap-to-zoom/lightbox. A wide flowchart on mobile is the main UX risk.

## Notes
- Keep `securityLevel: 'strict'` — diagrams come from our own Markdown, but no reason to loosen it.
- Leave the original ```mermaid source as a fallback if rendering throws (don't blank the block).
- The writer skill (`.claude/skills/missing-manual-writer/SKILL.md` §3.4) keeps diagrams sparse
  (~6–7 nodes, one idea each), so you won't get 40-node monsters — but the zoom affordance is still worth it.
