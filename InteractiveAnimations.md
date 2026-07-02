# Interactive Explainers — how they work, and how to change them

This is a code-level guide, not a content guide. If you just want to *use* an
existing explainer in a guide, see `WRITERMANUAL.md` section 9 — one fenced
block, no code. This doc is for when you want to tweak how one looks/behaves,
or build a new one.

An **explainer** is different from a **playground**: a playground is a try-it
tool (a regex tester, a base converter). An explainer teaches ONE concept with
a continuously animated, instrument-styled widget — always moving, never a
static diagram. Today there are three: `explainer-clock` (CPU clock signal),
`explainer-latency` (network round-trip), `explainer-rebase` (git rebase).

---

## 1. The big picture — how a fence becomes a live widget

A guide author writes this in Markdown:

````
```explainer-clock
```
````

Nothing on the Rust/backend side knows what `explainer-clock` is — the
renderer just emits whatever's inside the fence as plain HTML:
`<pre><code class="language-explainer-clock"></code></pre>`. It passes
through completely untouched, the same way `playground-*` and `runnable`
fences do.

The real work happens client-side, in
[`platform/web/src/lib/Explainers.svelte`](platform/web/src/lib/Explainers.svelte).
On mount, it scans the rendered guide for those code tags and swaps each one
for a live Svelte component:

```js
const REGISTRY = {
  clock: ClockSignal,
  latency: LatencyTrace,
  rebase: RebaseAnimated
};

onMount(() => {
  // ...
  const codes = reader.querySelectorAll('code[class*="language-explainer-"]');
  codes.forEach((code) => {
    const cls = [...code.classList].find((c) => c.startsWith('language-explainer-'));
    const type = cls.slice('language-explainer-'.length);   // "clock", "latency", ...
    const Comp = REGISTRY[type];
    if (!Comp) return;
    const host = code.closest('pre') || code;
    const config = (code.textContent || '').replace(/\n$/, ''); // raw text inside the fence, if any
    const container = document.createElement('div');
    host.replaceWith(container);
    instances.push(mount(Comp, { target: container, props: { config } }));
  });
});
```

So: **the fence's suffix (`clock`, `latency`, `rebase`) is just a lookup key
into `REGISTRY`.** Whatever component that key points to gets mounted exactly
where the fence was written in the Markdown — so place the fence right next
to the paragraph it illustrates, not at the bottom of the phase.

`config` is the raw text typed inside the fence (empty for all three today,
but there if a future explainer wants inline config like `playground-regex`
does).

---

## 2. Anatomy of one explainer

Every explainer is a normal `.svelte` file living in
`platform/web/src/lib/explainers/`. They all follow the same skeleton:

1. A `<canvas>` inside the shared `.ins-bezel` / `.ins-screen` chrome.
2. A `requestAnimationFrame` loop that clears the canvas and redraws every frame.
3. `onMount` starts the loop; `onDestroy` cancels it. **This cleanup is not
   optional** — skip it and every explainer a reader has scrolled past keeps
   animating forever in the background, mounted or not.

There are two animation patterns in use. Pick whichever fits the concept.

### Pattern A — continuous signal (`ClockSignal.svelte`, `LatencyTrace.svelte`)

A value scrolls forever; the canvas is redrawn from scratch every frame based
on elapsed time. Walking through `ClockSignal.svelte`:

```js
let scrollX = 0;
let lastT = null;

function frame(now) {
  if (lastT === null) lastT = now;
  const dt = Math.min(0.05, (now - lastT) / 1000);  // seconds since last frame, capped
  lastT = now;
  if (playing) scrollX += dt * 70;                   // <- this is the "speed"

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#0b0f0f';
  ctx.fillRect(0, 0, w, h);
  drawGrid(w, h);

  // ...compute a path from scrollX + freq, stroke it...

  raf = requestAnimationFrame(frame);   // <- schedules the next frame, forever
}
```

Key details worth understanding before you touch one of these:

- **DPR scaling.** `resize()` multiplies the canvas's pixel dimensions by
  `window.devicePixelRatio` and rescales the context. Skip this and the
  canvas looks blurry on retina/high-DPI screens.
- **The glow-line trick.** Every trace is stroked *twice* — this is what
  makes the line look like it's glowing instead of just being drawn:
  ```js
  ctx.strokeStyle = '#4dffcf'; ctx.lineWidth = 5; ctx.globalAlpha = 0.35;
  ctx.shadowColor = '#4dffcf'; ctx.shadowBlur = 14; ctx.stroke();   // wide, blurred glow pass
  ctx.globalAlpha = 1; ctx.shadowBlur = 0; ctx.lineWidth = 1.6; ctx.strokeStyle = '#c9fff0'; ctx.stroke(); // crisp core pass
  ```
  First pass: wide + blurred + dim = the glow halo. Second pass: thin + sharp
  + bright = the core line. Reuse this exact two-pass pattern for any new
  glowing trace so it matches the others.

### Pattern B — eased state machine (`RebaseAnimated.svelte`)

For a concept that's really a sequence of discrete steps (not a continuous
signal), don't just snap between states — ease into them so the screen is
still visibly *moving*, matching the "always animated" bar:

```js
let current = layout(0).map((n) => ({ ...n }));   // current on-screen positions

function frame(now) {
  const targets = layout(step);                    // where things SHOULD be at this step
  for (let i = 0; i < current.length; i++) {
    current[i].x += (targets[i].x - current[i].x) * 0.12;  // glide 12% of the remaining distance, every frame
    current[i].y += (targets[i].y - current[i].y) * 0.12;
  }
  // ...draw using `current`, not `targets`...
  raf = requestAnimationFrame(frame);
}
```

Changing `step` (via Prev/Next/Play buttons) just updates `targets` —
the lerp in the loop above does the actual gliding, frame by frame. Bump
`0.12` up for a snappier ease, down for a slower one.

`RebaseAnimated` also adds idle motion so the screen never looks frozen even
when nothing is transitioning: `const breathe = 10 + Math.sin(now / 400) * 3`
pulses the radius of the "focus" node continuously.

---

## 3. The shared chrome — `.ins-*` classes

Defined once in `platform/web/src/app.css` (search for `.ins-`), used by
every explainer so they all look like they belong together. **Never write
new CSS for this chrome — reuse these classes.**

| Class | What it is |
|---|---|
| `.ins-bezel` | The outer card/frame around the whole widget |
| `.ins-screen` | The dark screen area (`#0b0f0f`, fixed — stays dark even in light theme, like a real instrument) — your `<canvas>` goes inside this |
| `.ins-label` | Small caption pinned top-left of the screen (e.g. "Clock signal") |
| `.ins-live` | Pulsing red recording dot, top-right of the screen. Add `class:paused={!playing}` to dim it when stopped |
| `.ins-row` | A horizontal control row (flex, wraps) |
| `.ins-lbl` | Small label text at the start of a row (e.g. "Clock speed") |
| `.ins-chip` | Mono-font readout pill (e.g. "2.4 GHz") |
| `.ins-btn` | Button style (Play/Pause, Prev/Next) |
| `.ins-range` | Styled `<input type="range">` with a teal thumb |
| `.ins-switch` + `.ins-switch-track` | Styled toggle switch (wrap an `<input type="checkbox">`) |

The glow colors (`#4dffcf`, `#c9fff0`, etc.) are **not** CSS variables — each
explainer picks its own accent inline in the canvas drawing code, since
canvas can't read CSS custom properties directly. That's intentional; don't
try to theme the canvas colors from `app.css`.

---

## 4. How to tweak an existing explainer

All three files are plain Svelte components — edit and save, Vite's dev
server hot-reloads it immediately (no restart needed; restarting the API is
only for *guide content* changes, not component code).

- **Change the color.** Find the hex literal in the `.svelte` file (e.g.
  `ClockSignal.svelte`'s `'#4dffcf'` / `'#c9fff0'`) and replace both the glow
  pass and the core pass with your new color.
- **Change the speed.** `ClockSignal.svelte`: `scrollX += dt * 70` — raise
  70 to speed it up, lower it to slow down. `RebaseAnimated.svelte`: the
  `0.12` ease factor, or the `1500` ms interval in `togglePlay`'s auto-play
  timer.
- **Change a slider's range.** It's a plain `<input type="range" min="0.5"
  max="5" step="0.1" bind:value={freq} />` — edit the attributes directly.
- **Add a new control.** Three steps: add a `let` variable, add an
  `.ins-row` with the input bound to it, reference the variable inside
  `frame()`. E.g. to add a "line width" slider to `ClockSignal`, add
  `let lineWidth = 1.6;`, a `<input type="range" bind:value={lineWidth}>`
  row, then use `lineWidth` instead of the hardcoded `1.6` in the stroke call.
- **Change labels/text.** `.ins-label` text, `.ins-chip` contents, and any
  caption strings (like `RebaseAnimated`'s `CAPTIONS` array) are just
  template text — edit directly.

---

## 5. How to build a brand new explainer

1. **Pick the concept and the pattern.** Is it a continuous value (signal,
   like clock/latency) or a discrete process (steps, like rebase)? Pick the
   matching pattern from section 2 as your starting point.

2. **Make sure it's genuinely different from the existing ones.** This is
   the one rule that actually matters: before writing code, sketch what it
   *looks* like (shape, layout, motion style) and compare against every
   explainer already shipped. If it's another scrolling horizontal trace,
   it's too similar — the whole point of separate explainers is that each
   one has a distinct visual identity, not just different data on the same
   template. When in doubt, prototype it first (a quick mockup, shown before
   you write the real component) rather than finding out after it's built.

3. **Create the file** —
   `platform/web/src/lib/explainers/YourConcept.svelte`. Minimal skeleton to
   copy from (continuous-signal flavor):

   ```svelte
   <script>
     import { onMount, onDestroy } from 'svelte';
     let canvas, ctx, raf;

     function resize() {
       if (!canvas) return;
       const dpr = window.devicePixelRatio || 1;
       const w = canvas.clientWidth || 600;
       canvas.width = w * dpr;
       canvas.height = 200 * dpr;
       ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
     }

     function frame(now) {
       const w = canvas.clientWidth || 600, h = 200;
       ctx.clearRect(0, 0, w, h);
       ctx.fillStyle = '#0b0f0f';
       ctx.fillRect(0, 0, w, h);
       // ...draw your thing here, using `now` for motion...
       raf = requestAnimationFrame(frame);
     }

     onMount(() => {
       ctx = canvas.getContext('2d');
       resize();
       window.addEventListener('resize', resize);
       raf = requestAnimationFrame(frame);
     });
     onDestroy(() => {
       if (raf) cancelAnimationFrame(raf);
       if (typeof window !== 'undefined') window.removeEventListener('resize', resize);
     });
   </script>

   <div class="ins-bezel">
     <div class="ins-screen">
       <canvas bind:this={canvas} style="display:block;width:100%;height:200px"></canvas>
       <span class="ins-live" aria-hidden="true"></span>
       <span class="ins-label">Your label</span>
     </div>
     <div class="ins-row">
       <!-- ins-btn / ins-chip / ins-range / ins-switch controls go here -->
     </div>
   </div>
   ```

4. **Register it** in `platform/web/src/lib/Explainers.svelte` — one import,
   one line in `REGISTRY`:

   ```js
   import YourConcept from '$lib/explainers/YourConcept.svelte';
   const REGISTRY = {
     clock: ClockSignal,
     latency: LatencyTrace,
     rebase: RebaseAnimated,
     yourtype: YourConcept   // <- new line
   };
   ```

5. **Drop the fence into a real guide phase**, right above the nav line,
   with a lead-in sentence — same placement rule as playgrounds/quizzes:

   ````
   ```explainer-yourtype
   ```
   ````

   Guide content changes need the API to resync `guides/` (restart it, or
   wait for the periodic sync) — but the component code itself is picked up
   live by Vite, no restart needed for that part.

6. **Verify in the browser**: open the phase, confirm the widget mounts
   exactly where the fence sits (not at the bottom of the page), confirm the
   animation is actually running (not a single static frame), and click
   every control once.

7. **Document it** — add a row to the table in `WRITERMANUAL.md` section 9
   so future guide authors know the type exists.

---

## 6. Common mistakes

- **No `onDestroy` cleanup.** The #1 canvas/rAF bug — the loop keeps running
  forever if you don't `cancelAnimationFrame` on destroy, even after the
  reader navigates away from that phase.
- **No DPR handling in `resize()`.** Looks fine on your monitor, blurry on
  everyone else's retina display.
- **No way to pause.** Every explainer should have a Play/Pause (or
  equivalent) — an animation a reader can't stop is an accessibility and
  battery problem, not just a nice-to-have.
- **Reinventing the chrome.** If you're writing new CSS for a bezel, a
  slider, or a chip, stop — it already exists in `.ins-*`. New CSS here
  means the new explainer will visually drift from the rest.

---

## 7. Current registry (reference)

| Fence | Component | Concept | Lives in |
|---|---|---|---|
| `explainer-clock` | `explainers/ClockSignal.svelte` | CPU clock signal — frequency, period, jitter | Hardware |
| `explainer-latency` | `explainers/LatencyTrace.svelte` | Network round-trip time — jitter, packet loss | Networking |
| `explainer-rebase` | `explainers/RebaseAnimated.svelte` | Git rebase, replayed step by step | Version control |
