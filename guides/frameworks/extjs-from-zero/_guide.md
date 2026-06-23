---
title: "Ext JS From Zero"
guide: "extjs-from-zero"
phase: 0
summary: "Learn the config-driven enterprise JavaScript framework that thousands of internal apps still run on — and that almost nobody documents well: the class system, components and the containment tree, layouts, the data package (Model/Store/proxy/reader), the Grid and forms, MVVM with ViewControllers and ViewModels and binding, and Sencha Cmd. The magic, made explainable — especially if you got thrown into a legacy Ext JS codebase with no map."
tags: [extjs, sencha, javascript, framework, enterprise, grid, mvvm, legacy]
category: frameworks
order: 21
group: "JavaScript"
difficulty: intermediate
synonyms: ["learn ext js", "extjs tutorial", "sencha ext js", "ext js explained", "ext js class system", "ext.define xtype", "ext js grid panel", "ext js store proxy model", "ext js viewcontroller viewmodel binding", "ext js layouts border hbox vbox", "sencha cmd build", "legacy ext js codebase", "ext js for beginners"]
updated: 2026-06-23
---

# Ext JS From Zero

Some frameworks you choose. Ext JS is one you usually *inherit* — you join a company, get handed a
sprawling internal app (a CRM, a trading desk, an admin console, a logistics dashboard), open the code,
and nothing looks like the JavaScript you know. No HTML to speak of. No `document.querySelector`. Just
enormous nested objects full of `xtype` and `items` that somehow become a full desktop-grade UI. There's
often no useful documentation, the original authors are long gone, and the official docs sit behind a
login. If that's ever cost you sleep — or a job — this guide is for you.

Here's the mental model that turns Ext JS from alien to obvious: **you don't build the UI, you describe
it.** You write a tree of plain config objects — "a panel containing a grid and a form" — and the
framework instantiates, lays out, renders, and manages every piece for you. Every visible thing is a
**component**; components live inside **containers**; data flows in through **stores**. Once those three
ideas click — components, containment, stores — the "magic" stops being magic and becomes a system you
can read, debug, and change with confidence.

> 📝 This assumes solid **JavaScript** — objects, functions, prototypes, `this`
> ([JavaScript From Zero](/guides/javascript-from-zero)). Ext JS predates and differs sharply from
> React/Vue/Angular ([What a Framework Even Is](/guides/what-a-framework-even-is) explains the family),
> so park those instincts at the door. Ext JS is a large proprietary framework with its own build tool,
> so code here is shown and explained rather than run on the page.

## How to read this

Read in order — it builds from a single component up to a data-bound grid in an MVVM app, using a running
example of a small **users admin** screen. The last phase is a survival kit for legacy codebases. Phases
carry difficulty badges.

## The phases

**Part 1 — The foundations (🟢 → 🟡)**
1. **[What Ext JS Even Is](01-what-extjs-is.md)** 🟢 — the config-driven, component-based model, Classic vs Modern, and why it feels so different.
2. **[The Class System](02-the-class-system.md)** 🟡 — `Ext.define`, `extend`, the `config` block, `xtype`, `Ext.create`, `requires`, and mixins.
3. **[Components & the Containment Tree](03-components-and-containers.md)** 🟡 — every UI piece is a component; `items` nest them; the lifecycle and how to find a component without `Ext.getCmp`.

**Part 2 — Real screens (🟡 → 🔴)**
4. **[Layouts: How Things Get Positioned](04-layouts.md)** 🟡 — `fit`, `hbox`/`vbox`, `border`, `card`; why "nothing shows up" is almost always a layout problem.
5. **[The Data Package](05-the-data-package.md)** 🔴 — `Ext.data.Model`, `Store`, proxies and readers: how server data reaches the screen.
6. **[The Grid & Forms](06-the-grid-and-forms.md)** 🔴 — `Ext.grid.Panel` bound to a store, columns and renderers, editing plugins, and form panels.

**Part 3 — Wiring & survival (🔴 → 🟢)**
7. **[MVVM: ViewControllers, ViewModels & Binding](07-mvvm-and-binding.md)** 🔴 — view logic, two-way `bind`, formulas, and how a modern Ext JS app is held together (plus legacy MVC).
8. **[Sencha Cmd, Theming & Surviving a Legacy Codebase](08-sencha-cmd-and-survival.md)** 🟢 — the build tool, SASS theming, debugging tactics, Ext JS vs the modern field, and where to go next.

> The whole framework is one sentence: **describe a tree of components, point them at stores, and let the
> framework run it.** Hold that, and even a ten-year-old Ext JS app becomes something you can read.

---

[Phase 1: What Ext JS Even Is →](01-what-extjs-is.md)
