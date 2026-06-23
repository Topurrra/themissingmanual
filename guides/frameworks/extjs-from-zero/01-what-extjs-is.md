---
title: "What Ext JS Even Is"
guide: "extjs-from-zero"
phase: 1
summary: "Ext JS describes a UI as a tree of config objects and the framework builds it. Meet components, containment, xtype, the Classic vs Modern toolkits, and why it feels nothing like React."
tags: [extjs, sencha, javascript, components, classic, modern]
difficulty: beginner
synonyms: ["what is ext js", "ext js explained", "ext js config driven", "ext js components", "ext js classic vs modern", "why ext js is different"]
updated: 2026-06-23
---

# What Ext JS Even Is

You started Monday with a ticket and a repository. The app is some big internal thing — a CRM, an
admin console, a trading desk, pick your flavor — and the people who wrote it left years ago. You
open a file expecting JavaScript and instead you get a wall of nested objects: `xtype` this,
`items` that, `panel` inside `tabpanel` inside `viewport`. There's no HTML you can grep for. No
`document.querySelector`. No JSX. The docs, if they exist, sit behind a Sencha login. And somehow
this soup renders a polished, desktop-grade interface that real money depends on.

If that's where you are, take a breath. Nothing here is magic. It's a single, very consistent idea
wearing unfamiliar clothes — and once you see the idea, the whole codebase stops being a haunted
house and becomes a building with rooms you can walk through.

Here's the idea, stated once, plainly: **in Ext JS you don't build the UI, you describe it.** You
write a tree of plain JavaScript config objects — "a panel containing a grid and a form" — and the
framework reads that description and does the rest: creates the objects, lays them out, renders the
HTML, wires up events, and manages them for their whole life. You write the *what*; the framework
owns the *how*.

> 📝 **Ext JS** — Sencha's comprehensive JavaScript framework for **data-intensive enterprise web
> apps**: internal admin consoles, CRMs, trading desks, dashboards. It started around 2006 as an
> extension of the YUI library (hence "Ext"), grew into a full framework, and is now owned by IDERA.
> It long predates React, Vue, and Angular — so it solves the same problems they do, but with
> conventions invented years before any of them existed.

## The one big idea: config in, UI out

Let's make "describe, don't build" concrete. Here is a minimal Ext JS application that puts a panel
on the screen.

```javascript
Ext.application({
    name: 'Admin',

    launch: function () {
        Ext.create('Ext.panel.Panel', {
            renderTo: Ext.getBody(),
            title: 'Users',
            width: 400,
            height: 200,
            html: 'A panel, built from a config object.'
        });
    }
});
```

*What just happened:* `Ext.application({...})` declares the app and hands Ext a `launch` function to
run once the framework has finished booting (loading classes, setting up the page). Inside `launch`,
`Ext.create('Ext.panel.Panel', {...})` asks the framework to build one component — a Panel — from
the config object you passed. That object is pure data: `title`, `width`, `height`, `html`, and
`renderTo: Ext.getBody()` telling Ext where to drop it in the page. You never wrote a `<div>`, never
touched the DOM, never set a single style. You described a panel and Ext turned your description into
real, rendered HTML. That is the entire framework in one move.

Now the part that makes Ext *feel* like Ext: components nest. Watch what happens when a panel
contains other components.

```javascript
Ext.create('Ext.panel.Panel', {
    renderTo: Ext.getBody(),
    title: 'Users',
    width: 500,
    height: 300,
    layout: 'vbox',
    items: [
        { xtype: 'textfield', fieldLabel: 'Search' },
        { xtype: 'button',    text: 'Add user' }
    ]
});
```

*What just happened:* the outer Panel now has an `items` array — its children. Each child is *also*
a config object, but instead of a full class name we used `xtype`: `'textfield'` and `'button'` are
short string nicknames for component classes. Ext reads `items`, sees the `xtype` on each entry,
creates the matching component, and stacks them inside the panel (the `layout: 'vbox'` says "lay the
children out vertically"). One config object described a parent and two children, and Ext built the
whole little tree. Scale that up — panels inside tab panels inside a viewport, each with their own
`items` — and you have the entire UI of that legacy app you inherited.

> 💡 The mental shortcut for reading *any* Ext JS file: find the outermost config object, then follow
> `items` downward like branches of a tree. The shape of the nested objects **is** the shape of the
> screen. You're not reading instructions that run top to bottom — you're reading a blueprint.

## Components, containers, and `xtype`

You just met the three words the rest of this guide leans on, so let's name them clearly (phases 2
and 3 go deep — this is the teaser).

📝 **Component** — every visible thing in Ext JS is a component: a button, a text field, a data grid,
a panel, a popup window. They're all objects descended from a common base class, which is why they
all take config the same way and share the same lifecycle. **Container** — a component that can hold
*other* components, via its `items` array (a Panel is the classic container). **xtype** — the short
string name of a component class (`'grid'`, `'form'`, `'button'`), used so Ext can create children
lazily, only when they're actually needed. Components nest inside containers via `items`; `xtype`
names which component to make. That's the containment tree, and it's most of what you'll ever read.

## Classic vs Modern: which toolkit is this codebase?

Ext JS ships in two flavors, called **toolkits**, and knowing which one you're looking at saves real
confusion.

📝 **Classic toolkit** — the older, mature, desktop-focused widget set. This is where the famous,
deeply-featured data **Grid** lives, along with the dense forms and windows that enterprise apps are
built from. If you inherited a big internal back-office app, it's very likely Classic. **Modern
toolkit** — built for touch and mobile, with widgets styled and behaved for phones and tablets. Same
core concepts — components, `items`, `xtype`, stores — but the widget *packages* differ, so a few
class names and options won't match between them.

A codebase picks one (or builds both as separate outputs via Sencha Cmd, the build tool we'll meet
later). How to tell which you're in:

```javascript
// app.json (an Ext JS app's config file)
{
    "name": "Admin",
    "toolkit": "classic",
    "theme": "theme-triton"
}
```

*What just happened:* the `app.json` at the root of an Ext JS project declares the `toolkit` outright
— here, `"classic"`. That one line is your fastest answer. No `app.json` handy? Other tells:
`require`/`import` paths or class names mentioning `Ext.grid.Panel` and themes like `triton` or
`neptune` point to **Classic**; paths under `modern` or touch-flavored components point to
**Modern**. When in doubt, check `app.json` first — it doesn't lie.

> ⚠️ Don't mix advice across toolkits. A snippet you found online for the Modern Grid may use config
> options that do not exist in the Classic Grid, and vice versa. When you search for help,
> include the toolkit name in the query — "Ext JS **classic** grid column renderer" — or you'll burn
> an afternoon on options that were never going to apply.

## Why it feels so different from React

If your instincts come from React, Vue, or Angular, Ext JS will feel alien — and being honest about
*why* is the fastest way to stop fighting it.

The first difference is **config vs. markup**. In React you write JSX, a template that looks like
HTML. In Ext JS there are no templates and no JSX — you write **plain JavaScript objects** that
*describe* components. `{ xtype: 'panel', title: 'Users', items: [...] }` is not a special syntax;
it's an ordinary object literal. The structure of your data is the structure of your UI.

The second difference is **how much the framework owns**. Modern front-end work is "pick your
libraries": React for views, plus a router, a state library, a data-fetching library, a component
kit, a bundler — all from npm, all your choice. Ext JS is the opposite: it's **batteries-included to
the extreme**. The widgets, the layout engine, the class system, the data layer, the charts, the
theming, even the build tool — all of it is Sencha's, all of it ships together. That's exactly why it
feels like its own universe rather than a library you dropped into a project: it *is* the project.

> 💡 New to the whole idea of a framework calling *your* code instead of you calling *its*? The
> "describe the pieces, let the framework run them" relationship is the same inversion-of-control
> pattern every framework shares — see
> [What a Framework Even Is](/guides/what-a-framework-even-is). Ext JS just takes it further than
> most: it owns more of the stack than almost anything else you'll meet.

So when newcomers call Ext JS "weird," what they really mean is: no JSX, config instead of markup, a
custom class system instead of plain ES classes, its own data layer instead of `fetch` plus a state
library, slow Java-based builds, and docs that were historically thin and often paywalled. Every one
of those is a real friction — but none of them is chaos. It's a consistent system with consistent
rules, and a consistent system is exactly the kind of thing you *can* learn.

📝 One honest note on **where you'll meet it**: greenfield Ext JS is rare today — new projects almost
always reach for the React/Vue/Angular family. What's *not* rare is maintaining the enormous body of
revenue-critical enterprise software already built on Ext JS. That's the job this guide prepares you
for: reading, debugging, and changing an Ext JS app you didn't write.

## Our running example: a users admin screen

To keep every phase grounded in something real, we'll build up one small feature across the whole
guide: a **users admin screen**. Picture the everyday back-office tool — a table of users on the
left, and an edit form on the right that fills in when you click a row.

In Ext JS terms, that screen is a containment tree you can already half-read:

```javascript
{
    xtype: 'panel',
    title: 'User Administration',
    layout: 'hbox',
    items: [
        { xtype: 'grid', title: 'Users', flex: 1 },   // the list, on the left
        { xtype: 'form', title: 'Edit',  flex: 1 }     // the editor, on the right
    ]
}
```

*What just happened:* a top-level Panel lays its children out side by side (`layout: 'hbox'`) and
holds two components in `items` — a Grid (the users list) and a Form (the editor) — each taking an
equal share of the width (`flex: 1`). Right now both are empty placeholders: no columns, no fields,
no data. Over the coming phases we'll fill the Grid with columns, feed it real users through a
**Store**, wire the Form to edit the selected row, and hold it all together with Ext's MVVM tools.
But notice — you can *read the shape of the whole feature already*, because the config tree is the
feature. That's the payoff of "describe, don't build," and it's the thread we'll pull on the rest of
the way.

## Recap

- **The one idea:** in Ext JS you describe the UI as a tree of plain config objects, and the
  framework instantiates, lays out, renders, and manages it. You write *what*, not *how*.
- **Everything visible is a component**; **containers** hold other components via their `items`
  array; **`xtype`** is the short string name Ext uses to create a component (often lazily).
- **Two toolkits:** **Classic** (desktop, the mature widget set with the famous Grid) and **Modern**
  (touch/mobile). Check `app.json`'s `toolkit` to know which one a codebase uses — and don't mix
  advice across them.
- **Why it feels alien vs. React:** config objects instead of JSX/templates, and a batteries-included
  framework that owns the whole stack (widgets, layout, class system, data, charts, build) instead of
  a library you assemble from npm pieces.
- **Where you meet it:** maintaining big, revenue-critical enterprise apps — greenfield Ext JS is rare,
  but the existing codebases are everywhere.
- **Running example:** a users admin screen (a Grid of users + an edit Form) we'll build across the guide.

## Quick check

Three questions on the ideas that have to stick — the config-driven model, the toolkits, and how Ext
differs from React:

```quiz
[
  {
    "q": "What is the core idea behind how you build a UI in Ext JS?",
    "choices": [
      "You write a tree of plain config objects describing the components, and the framework instantiates, lays out, and renders them",
      "You write HTML templates with placeholders that Ext fills in",
      "You imperatively create and append DOM nodes with document.createElement",
      "You write JSX that compiles to component calls"
    ],
    "answer": 0,
    "explain": "Ext JS is config-driven: you describe the UI as nested config objects (parents with an `items` array of children) and the framework builds, lays out, renders, and manages everything. No HTML, no JSX, no manual DOM."
  },
  {
    "q": "What does `xtype` mean in an Ext JS config object?",
    "choices": [
      "The short string name of a component class, used so Ext can create the component (often lazily)",
      "An HTML element tag like 'div' or 'span'",
      "A CSS class applied to the rendered element",
      "The unique id of an existing component instance"
    ],
    "answer": 0,
    "explain": "`xtype` is the short nickname for a component class — `'grid'`, `'form'`, `'button'`. Ext reads it inside `items` to know which component to create, and can defer creation until the component is actually needed."
  },
  {
    "q": "What's the main difference between the Classic and Modern toolkits, and how do you tell which a codebase uses?",
    "choices": [
      "Classic targets desktop (the mature widget set incl. the Grid), Modern targets touch/mobile; check the `toolkit` field in app.json",
      "Classic is the free version and Modern is the paid one; check your Sencha license",
      "Classic is written in JavaScript and Modern in TypeScript; check the file extensions",
      "There is no difference — they are two names for the same widgets"
    ],
    "answer": 0,
    "explain": "Both share the same core concepts (components, items, xtype, stores), but Classic is the desktop-focused mature widget set and Modern is built for touch/mobile, so some widget packages differ. The `toolkit` field in app.json tells you which one outright."
  }
]
```

---

[Guide overview](_guide.md) · [Phase 2: The Class System →](02-the-class-system.md)
