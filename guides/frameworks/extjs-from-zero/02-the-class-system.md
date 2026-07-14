---
title: "The Class System"
guide: "extjs-from-zero"
phase: 2
summary: "Ext JS has its own class system, built before ES2015. Learn Ext.define, extend and callParent, the config-block getters/setters, xtype vs Ext.create, requires, and mixins."
tags: [extjs, sencha, class-system, ext-define, xtype, mixins]
difficulty: intermediate
synonyms: ["ext.define", "ext js class system", "ext js xtype", "ext.create vs xtype", "ext js extend", "ext js config block getters setters", "ext js requires loader", "ext js mixins"]
updated: 2026-07-10
---

# The Class System

The one idea to carry through this phase: **in Ext JS, almost nothing is a plain object - everything
is a *class*.** Every view, data model, controller, and reusable widget is declared with `Ext.define`.
Once you can read an `Ext.define` block - what it extends, what config it exposes, what xtype it
answers to - you can read the *shape* of an entire Ext JS codebase, even one nobody has touched in years.

Why a custom class system when JavaScript already has classes? Ext JS predates ES2015 classes by the
better part of a decade - the language gave you raw prototypes and not much else, so Sencha built a
full object system on top: single inheritance, mixins, static members, and the part that surprises
everyone, **declarative config properties that generate their own getters and setters**. The class
system also powers **lazy loading** and the dependency graph the build tool relies on. This is the
spine of the framework, not legacy cruft to ignore.

> 📝 This builds on [What Ext JS Even Is](01-what-extjs-is.md) - read that first if "config-driven"
> and "component" don't ring a bell yet.

## `Ext.define`: declaring a class

Every class starts with `Ext.define`, taking a **string name** and a **config object**.

```javascript
Ext.define('MyApp.view.UserGrid', {
    extend: 'Ext.grid.Panel',

    title: 'Users',

    initComponent: function () {
        this.columns = [
            { text: 'Name',  dataIndex: 'name', flex: 1 },
            { text: 'Email', dataIndex: 'email', flex: 1 }
        ];
        this.callParent(arguments);
    }
});
```

*What just happened:* we declared a class named `'MyApp.view.UserGrid'`. That dotted string is a
**namespace path** mapped to a folder/file convention (`app/view/UserGrid.js` under `MyApp`), which is
how the loader and build tool find it. `extend: 'Ext.grid.Panel'` means our class **inherits** from
the built-in grid panel. Inside `initComponent` (a lifecycle hook run as the component sets itself up)
we call `this.callParent(arguments)` to run the parent's version too. **Forgetting `callParent` is one
of the most common Ext JS bugs** - the component half-initializes into a blank or broken widget with
no obvious error.

A few things about `extend`:

- It's **single inheritance** - one parent, like Java or C# classes (mixins cover multiple, below).
- `this.callParent(arguments)` passes the original arguments straight to the parent method; you'll
  see `this.callParent([newArg])` when a method deliberately changes what it passes up.
- The dotted name tells you the file's home - `MyApp.controller.Users` lives at
  `app/controller/Users.js`. This convention is how you navigate an unfamiliar Ext JS repo.

## The `config` block: getters and setters you never wrote

This trips up everyone arriving from plain JavaScript. Declare properties inside a `config` block, and
Ext JS **automatically generates a getter and setter for each one** - plus optional hooks that fire
when the value changes.

```javascript
Ext.define('MyApp.view.UserPanel', {
    extend: 'Ext.panel.Panel',

    config: {
        userName: 'Anonymous',
        unreadCount: 0
    },

    // optional hook: runs whenever userName is set
    updateUserName: function (newName, oldName) {
        this.setTitle('Profile: ' + newName);
    }
});

var p = Ext.create('MyApp.view.UserPanel');
p.getUserName();          // 'Anonymous' - getter you never wrote
p.setUserName('Nika');    // setter you never wrote; fires updateUserName
```

*What just happened:* we declared two config properties. Ext JS generated `getUserName()`/
`setUserName()` and `getUnreadCount()`/`setUnreadCount()` for us - nowhere in the file are those
methods written, yet they exist. Calling `setUserName('Nika')` also triggers the `updateUserName`
hook, which we used to re-title the panel. **This is why an Ext JS codebase is full of `getX()`/`setX()`
calls for properties that seem to have no definition** - they're config accessors.

Two hook flavors, and the difference matters:

- **`applyXxx(newValue, oldValue)`** runs *before* the value is stored and can *transform or veto*
  it - whatever you `return` becomes the stored value (`undefined` skips the set). Use it to coerce
  or validate.
- **`updateXxx(newValue, oldValue)`** runs *after* the value is stored. Use it for side effects.

> 💡 When you find a setter call and want to know what *actually* happens, search the class (and its
> parents) for `applyThatProp` and `updateThatProp` - that's where the real logic hides.

## `xtype` vs `Ext.create`: why config objects are everywhere

Phase 1 showed nested config objects with `xtype` instead of `new`. Here's the machinery behind that.

An **`xtype`** is a short string alias assigned to a component class. Once assigned, you can describe
that component as a plain object - `{ xtype: 'usergrid' }` - and the framework instantiates it
**lazily**, only when actually needed.

```javascript
Ext.define('MyApp.view.UserGrid', {
    extend: 'Ext.grid.Panel',
    xtype: 'usergrid',            // short alias
    // alias: 'widget.usergrid',  // the long form xtype is sugar for
    title: 'Users'
});

// Eager: instantiated right now
var grid = Ext.create('MyApp.view.UserGrid', { title: 'All Users' });

// Lazy: just a config object; the parent builds it when it renders
Ext.create('Ext.panel.Panel', {
    items: [
        { xtype: 'usergrid' },
        { xtype: 'textfield', fieldLabel: 'Search' }
    ]
});
```

*What just happened:* `Ext.create('MyApp.view.UserGrid', {...})` builds an instance **immediately**.
The second block never instantiates anything by hand - it hands the parent panel an `items` array of
plain config objects, and the parent turns each into a real component **lazily**, as it lays itself
out. That lazy-by-xtype pattern is *the* reason an Ext JS codebase reads as giant nested config trees
rather than a pile of `new` calls.

- `xtype: 'usergrid'` is sugar for `alias: 'widget.usergrid'` - you'll see both forms in the wild.
- `Ext.create(...)` is the loader-aware replacement for `new`; prefer it - it cooperates with the
  dependency system, `new` does not.

## `requires` and Ext.Loader: the "works in dev, breaks in build" trap

Ext JS can load classes **dynamically** - the **Ext.Loader** fetches a class file the first time it's
referenced, reading the **`requires`** array on each class to know what to load and in what order.

```javascript
Ext.define('MyApp.view.UserPanel', {
    extend: 'Ext.panel.Panel',

    requires: [
        'MyApp.view.UserGrid',
        'Ext.form.field.Text'
    ],

    items: [
        { xtype: 'usergrid' },
        { xtype: 'textfield', fieldLabel: 'Search' }
    ]
});
```

*What just happened:* we declared that `UserPanel` **depends on** `UserGrid` and the text field
class. The Loader guarantees both load before `UserPanel` is used, and - crucially - **Sencha Cmd
reads these same `requires` arrays to build the dependency graph** for the production bundle. Leave
one out and you've planted a time bomb.

> ⚠️ The classic Ext JS bug: you reference a class by xtype but forget to add it to `requires`. In
> **development** it often still works, because the Loader lazily fetches everything on demand and the
> class happens to already be loaded by something else. A **production build** with Sencha Cmd - which
> only bundles what's declared - leaves it out, and the app throws `xtype not found` or shows a blank
> screen. When a built app breaks but dev is fine, **suspect a missing `requires` first.**

## Mixins: behavior without inheritance

`extend` gives you exactly one parent. To compose *reusable behavior* from several sources, use
**mixins** - additional classes whose methods get folded into yours.

```javascript
Ext.define('MyApp.util.Logger', {
    extend: 'Ext.Base',
    mixins: ['Ext.mixin.Observable'],   // can now fire/listen to events

    statics: {                          // shared across all instances
        VERSION: '1.0'
    },

    log: function (msg) {
        this.fireEvent('logged', msg);  // method from the Observable mixin
    }
});
```

*What just happened:* `Logger` extends `Ext.Base` (the root of every Ext class) but also **mixes in**
`Ext.mixin.Observable`, gaining event methods like `fireEvent` and `on` without inheriting from an
event class. You can list **multiple** mixins - composition alongside single inheritance. The
`statics` block means `MyApp.util.Logger.VERSION` is shared by the class itself, not copied per
instance.

> 💡 Two entry points you'll see atop a legacy app: **`Ext.application({...})`** boots a full
> MVC/MVVM app, and the older **`Ext.onReady(function () {...})`** runs code once the framework and
> DOM are ready. Both just mean "where execution begins."

## Recap

- **Everything is a class** declared with `Ext.define('Namespace.Path.Name', {...})`; the dotted name
  is also the file's location in the project.
- **`extend`** gives single inheritance; call up the chain with **`this.callParent(arguments)`** - 
  forgetting it is a top-tier Ext JS bug.
- The **`config` block** auto-generates `getX()`/`setX()`; setters fire **`applyX`** (transform/veto,
  before store) and **`updateX`** (side effects, after store) hooks - that's where the real logic lives.
- **`xtype`** (sugar for `alias: 'widget.xxx'`) lets the framework instantiate components **lazily**
  from plain config objects; **`Ext.create`** instantiates eagerly and is the loader-aware `new`.
- **`requires`** feeds Ext.Loader and Sencha Cmd's build graph; a forgotten `requires` works in dev but
  breaks the production build.
- **Mixins** compose reusable behavior from multiple sources alongside single inheritance; `statics`
  holds class-level members.

## Quick check

```quiz
[
  {
    "q": "You set a config property with setUserName('Nika') and want to run a side effect (re-render a label) afterward. Which hook fires after the value is stored?",
    "choices": ["applyUserName", "updateUserName", "initUserName", "onUserName"],
    "answer": 1,
    "explain": "updateXxx runs after the value is stored - use it for side effects. applyXxx runs before and can transform or veto the value."
  },
  {
    "q": "An app works perfectly in dev but throws 'xtype not found' after a Sencha Cmd production build. What's the most likely cause?",
    "choices": ["A missing requires declaration", "A typo in callParent", "Using Ext.create instead of new", "A mixin conflict"],
    "answer": 0,
    "explain": "The build only bundles classes listed in requires. Dev loads lazily and often works by accident; the production build doesn't, so the undeclared class is missing."
  },
  {
    "q": "What is xtype: 'usergrid' shorthand for?",
    "choices": ["extend: 'usergrid'", "alias: 'widget.usergrid'", "requires: ['usergrid']", "statics: { usergrid: true }"],
    "answer": 1,
    "explain": "xtype is sugar for alias: 'widget.usergrid'. The widget. prefix is what registers the class so it can be created lazily from a config object."
  }
]
```

[← Phase 1: What Ext JS Even Is](01-what-extjs-is.md) · [Guide overview](_guide.md) · [Phase 3: Components & the Containment Tree →](03-components-and-containers.md)
