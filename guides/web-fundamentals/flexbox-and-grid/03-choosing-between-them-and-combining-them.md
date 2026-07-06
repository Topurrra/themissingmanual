---
title: "Choosing Between Them (and Combining Them)"
guide: "flexbox-and-grid"
phase: 3
summary: "The rule of thumb for Flexbox vs Grid, why they compose rather than compete, and a holy grail layout that uses both together."
tags: [css, flexbox, grid, layout, holy-grail-layout]
difficulty: intermediate
synonyms: ["flexbox vs grid which to use", "can you use flexbox and grid together", "holy grail layout css", "css layout rule of thumb"]
updated: 2026-07-06
---

# Choosing Between Them (and Combining Them)

By now you've used both systems on real layouts. The question left is which one to reach for first -
and the honest answer is that it's rarely either/or.

## The rule of thumb

**One dimension → Flexbox. Two dimensions → Grid.**

Ask yourself what you're actually arranging:

- A row of nav links, a stack of form fields, a row of buttons, centering one thing inside
  another - you're thinking about a single line of items. **Flexbox.**
- A page skeleton (header/sidebar/main/footer), a photo gallery, a dashboard of cards that need to
  align in both rows and columns at once - you're thinking about a grid. **Grid.**

A quick test: if you can describe the layout with words like "row" or "column," it's Flexbox. If you
need both words at once - "these should line up in rows *and* columns" - it's Grid.

⚠️ **Common tell.** If you're using Flexbox and reaching for `flex-wrap` plus fixed widths to fake
columns lining up, that's usually Grid work being done with the wrong tool. Grid keeps columns aligned
by definition; Flexbox wrapping breaks onto new lines without any column-alignment guarantee.

## They compose

Grid and Flexbox aren't competing systems - a `display: grid` container and a `display: flex`
container are both boxes, and boxes nest. A grid of flex containers is normal, common CSS, not a hack:

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
}

.card {
  display: flex;
  flex-direction: column;
  justify-content: space-between; /* footer sticks to bottom of each card */
}
```

```html
<div class="card-grid">
  <div class="card">
    <h3>Plan A</h3>
    <p>Description text of varying length.</p>
    <button>Choose</button>
  </div>
  <div class="card">
    <h3>Plan B</h3>
    <p>A much longer description that wraps onto more lines than the others.</p>
    <button>Choose</button>
  </div>
</div>
```

*What just happened:* Grid handles the outer problem - how many cards fit per row, keeping them
aligned as a gallery. Flexbox handles the inner problem - inside each card, stacking title, text, and
button vertically, with `justify-content: space-between` pinning the button to the bottom regardless
of how much text is above it. Each system solves the dimension it's good at; neither fakes the other's
job.

## Build it: a holy grail layout

The "holy grail" layout - header, footer, and three columns (nav, main content, aside) - used to be a
CSS interview question because it was genuinely hard with floats. With Grid for the page and Flexbox
for the header's contents, it's short:

```css
.page {
  display: grid;
  grid-template-columns: 200px 1fr 200px;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "header header header"
    "nav    main   aside"
    "footer footer footer";
  min-height: 100vh;
  gap: 1rem;
}

.header { grid-area: header; }
.nav    { grid-area: nav; }
.main   { grid-area: main; }
.aside  { grid-area: aside; }
.footer { grid-area: footer; }

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
```

```html
<div class="page">
  <header class="header">
    <div class="logo">Acme</div>
    <nav class="nav-links">…links…</nav>
  </header>
  <nav class="nav">Sidebar nav</nav>
  <main class="main">Page content</main>
  <aside class="aside">Related links</aside>
  <footer class="footer">Footer</footer>
</div>
```

*What just happened:* `.page` is a Grid defining the three-column, three-row skeleton by name -
identical in spirit to the dashboard from phase 2, with one extra column. `.header`, one of the
grid's own cells, is *also* a flex container internally, spacing its logo and links the way you built
in phase 1. Two systems, two different jobs, one layout.

This is the pattern to internalize: Grid answers "where do the big regions go," Flexbox answers "how
do things line up inside a region." Reach for both without ceremony - there's no penalty for nesting
one inside the other, and most real-world pages do exactly this.

Test the big picture before moving on:

```quiz
[
  {
    "q": "You need a row of navigation links that stay centered vertically next to a logo. Which layout system fits best?",
    "choices": ["CSS Grid, because it's newer", "Flexbox, because it's a one-dimensional row arrangement", "Neither - use floats", "Grid, because navbars always need two dimensions"],
    "answer": 1,
    "explain": "A navbar is a single row of items - the one-dimension case Flexbox is built for."
  },
  {
    "q": "What's true about combining Grid and Flexbox in the same page?",
    "choices": ["They conflict and shouldn't be mixed", "A Grid container can hold Flex containers as children, and this is a normal pattern", "You must pick one system for the entire site", "Flexbox items can't be placed inside a Grid"],
    "answer": 1,
    "explain": "Grid and Flex containers are both boxes; nesting a flex container inside a grid cell (or vice versa) is standard, common CSS."
  },
  {
    "q": "In the holy grail layout example, what is grid-template-areas responsible for, and what is the header's internal display: flex responsible for?",
    "choices": ["Both do the same job redundantly", "grid-template-areas places the big page regions; flex arranges the logo and links inside the header region", "flex places the big regions; grid arranges items inside the header", "grid-template-areas only works with exactly three columns"],
    "answer": 1,
    "explain": "Grid handles the outer page skeleton (header/nav/main/aside/footer placement); Flexbox handles alignment inside the header cell itself."
  }
]
```

## Where to go next

Both layout systems assume a page that already reflows sensibly at different sizes. For the full
picture on breakpoints, fluid units, and mobile-first design, see
[Responsive Design](/guides/responsive-design).

---

[← Phase 2: CSS Grid: Two-Dimensional Layout](02-css-grid-two-dimensional-layout.md) · [Guide overview](_guide.md)
