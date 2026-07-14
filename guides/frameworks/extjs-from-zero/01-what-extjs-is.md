---
title: "What Ext JS Even Is"
guide: "extjs-from-zero"
phase: 1
summary: "Ext JS describes a UI as a tree of config objects and the framework builds it. Meet components, containment, xtype, the Classic vs Modern toolkits, and why it feels nothing like React."
tags: [extjs, sencha, javascript, components, classic, modern]
difficulty: beginner
synonyms: ["what is ext js", "ext js explained", "ext js config driven", "ext js components", "ext js classic vs modern", "why ext js is different"]
updated: 2026-07-10
---

# What Ext JS Even Is

You open a legacy internal app - a CRM, an admin console, a trading desk - expecting JavaScript and
find a wall of nested objects: `xtype` this, `items` that, `panel` inside `tabpanel` inside `viewport`.
No HTML to grep for, no `document.querySelector`, no JSX. And somehow this soup renders a polished,
desktop-grade interface that real money depends on.

Nothing here is magic. It's one consistent idea wearing unfamiliar clothes.

Stated once, plainly: **in Ext JS you don't build the UI, you describe it.** You write a tree of plain
JavaScript config objects - "a panel containing a grid and a form" - and the framework reads that
description and does the rest: creates the objects, lays them out, renders the HTML, wires up events,
manages their whole life. You write the *what*; the framework owns the *how*.

> 📝 **Ext JS** - Sencha's comprehensive JavaScript framework for **data-intensive enterprise web
> apps**: admin consoles, CRMs, trading desks, dashboards. It started around 2006 as an extension of
> the YUI library (hence "Ext"), grew into a full framework, and is now owned by IDERA - predating
> React, Vue, and Angular, so it solves the same problems with conventions invented years earlier.

## The one big idea: config in, UI out

A minimal Ext JS application that puts a panel on the screen:

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
run once the framework finishes booting. Inside it, `Ext.create('Ext.panel.Panel', {...})` asks the
framework to build one component from the config object - pure data: `title`, `width`, `height`,
`html`, and `renderTo: Ext.getBody()` telling Ext where to drop it in the page. You never wrote a
`<div>`, never touched the DOM. You described a panel and Ext turned that description into real,
rendered HTML.

The part that makes Ext *feel* like Ext: components nest.

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

*What just happened:* the outer Panel now has an `items` array - its children. Each child is *also* a
config object, but instead of a full class name we used `xtype`: `'textfield'` and `'button'` are
short nicknames for component classes. Ext reads `items`, sees each `xtype`, creates the matching
component, and stacks them inside the panel (`layout: 'vbox'` lays children out vertically). Scale
that up - panels inside tab panels inside a viewport - and you have the entire UI of a legacy app.

> 💡 The mental shortcut for reading *any* Ext JS file: find the outermost config object, then follow
> `items` downward like branches of a tree. The shape of the nested objects **is** the shape of the
> screen. You're reading a blueprint, not instructions that run top to bottom.

## Components, containers, and `xtype`

Three words the rest of this guide leans on (Phases 2 and 3 go deep - this is the teaser).

📝 **Component** - every visible thing in Ext JS is a component: a button, a text field, a data grid,
a panel, a popup window. All descend from a common base class, which is why they all take config the
same way and share the same lifecycle. **Container** - a component that can hold *other* components
via its `items` array (a Panel is the classic container). **xtype** - the short string name of a
component class (`'grid'`, `'form'`, `'button'`), used so Ext can create children lazily, only when
needed. Components nest inside containers via `items`; `xtype` names which one to make.

## Classic vs Modern: which toolkit is this codebase?

Ext JS ships in two flavors, called **toolkits**, and knowing which one you're looking at saves real
confusion.

📝 **Classic toolkit** - the older, mature, desktop-focused widget set. This is where the famous,
deeply-featured data **Grid** lives, along with the dense forms and windows enterprise apps are built
from. If you inherited a big internal back-office app, it's very likely Classic. **Modern toolkit** - 
built for touch and mobile. Same core concepts - components, `items`, `xtype`, stores - but the widget
*packages* differ, so a few class names and options won't match between them.

A codebase picks one (or builds both via Sencha Cmd, the build tool we'll meet later):

```javascript
// app.json (an Ext JS app's config file)
{
    "name": "Admin",
    "toolkit": "classic",
    "theme": "theme-triton"
}
```

*What just happened:* the `app.json` at the root of an Ext JS project declares the `toolkit` outright
 - your fastest answer. No `app.json` handy? Class names mentioning `Ext.grid.Panel` and themes like
`triton` or `neptune` point to **Classic**; paths under `modern` or touch-flavored components point to
**Modern**.

> ⚠️ Don't mix advice across toolkits. A snippet for the Modern Grid may use config options that don't
> exist in the Classic Grid, and vice versa. Include the toolkit name in searches - "Ext JS
> **classic** grid column renderer" - or you'll burn an afternoon on options that never applied.

## Why it feels so different from React

If your instincts come from React, Vue, or Angular, Ext JS will feel alien - knowing *why* is the
fastest way to stop fighting it.

The first difference is **config vs. markup**. React uses JSX, a template that looks like HTML. Ext
JS has no templates and no JSX - you write **plain JavaScript objects** that *describe* components.
`{ xtype: 'panel', title: 'Users', items: [...] }` is an ordinary object literal. The structure of
your data is the structure of your UI.

The second is **how much the framework owns**. Modern front-end work is "pick your libraries": React
for views, plus a router, a state library, a data-fetching library, a bundler - all your choice. Ext
JS is the opposite: **batteries-included to the extreme**. Widgets, layout engine, class system, data
layer, charts, theming, even the build tool - all Sencha's, all shipped together. That's why it feels
like its own universe rather than a library dropped into a project: it *is* the project.

> 💡 New to a framework calling *your* code instead of you calling *its*? That inversion of control is
> shared by every framework - see [What a Framework Even Is](/guides/what-a-framework-even-is). Ext JS
> just takes it further: it owns more of the stack than almost anything else you'll meet.

So when newcomers call Ext JS "weird," they mean: no JSX, config instead of markup, a custom class
system instead of plain ES classes, its own data layer instead of `fetch` plus a state library, slow
Java-based builds, and docs that were historically thin and often paywalled. Every one is real
friction - but none is chaos. It's a consistent system with consistent rules, and that's learnable.

📝 **Where you'll meet it:** greenfield Ext JS is rare today - new projects reach for React/Vue/
Angular. What's *not* rare is maintaining the enormous body of revenue-critical enterprise software
already built on Ext JS. That's the job this guide prepares you for.

## Our running example: a users admin screen

To keep every phase grounded in something real, we'll build one small feature across the guide: a
**users admin screen** - a table of users on the left, an edit form on the right that fills in when
you click a row.

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

*What just happened:* a top-level Panel lays its children side by side (`layout: 'hbox'`) and holds
two components - a Grid and a Form, each taking an equal share of the width (`flex: 1`). Both are
empty placeholders right now. Coming phases fill the Grid with columns, feed it real users through a
**Store**, wire the Form to edit the selected row, and hold it together with Ext's MVVM tools. You can
already *read the shape of the whole feature*, because the config tree is the feature.

## Recap

- **The one idea:** in Ext JS you describe the UI as a tree of plain config objects, and the framework
  instantiates, lays out, renders, and manages it. You write *what*, not *how*.
- **Everything visible is a component**; **containers** hold other components via their `items`
  array; **`xtype`** is the short string name Ext uses to create a component (often lazily).
- **Two toolkits:** **Classic** (desktop, the mature widget set with the famous Grid) and **Modern**
  (touch/mobile). Check `app.json`'s `toolkit` to know which one a codebase uses - don't mix advice.
- **Why it feels alien vs. React:** config objects instead of JSX/templates, and a batteries-included
  framework that owns the whole stack instead of a library you assemble from npm pieces.
- **Where you meet it:** maintaining big, revenue-critical enterprise apps - greenfield is rare, but
  existing codebases are everywhere.
- **Running example:** a users admin screen (a Grid of users + an edit Form) we'll build across the guide.

## Quick check

Three questions on the config-driven model, the toolkits, and how Ext differs from React:

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
    "explain": "`xtype` is the short nickname for a component class - `'grid'`, `'form'`, `'button'`. Ext reads it inside `items` to know which component to create, and can defer creation until the component is actually needed."
  },
  {
    "q": "What's the main difference between the Classic and Modern toolkits, and how do you tell which a codebase uses?",
    "choices": [
      "Classic targets desktop (the mature widget set incl. the Grid), Modern targets touch/mobile; check the `toolkit` field in app.json",
      "Classic is the free version and Modern is the paid one; check your Sencha license",
      "Classic is written in JavaScript and Modern in TypeScript; check the file extensions",
      "There is no difference - they are two names for the same widgets"
    ],
    "answer": 0,
    "explain": "Both share the same core concepts (components, items, xtype, stores), but Classic is the desktop-focused mature widget set and Modern is built for touch/mobile, so some widget packages differ. The `toolkit` field in app.json tells you which one outright."
  }
]
```

---

[Guide overview](_guide.md) · [Phase 2: The Class System →](02-the-class-system.md)
