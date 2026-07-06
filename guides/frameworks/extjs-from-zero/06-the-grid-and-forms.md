---
title: "The Grid & Forms"
guide: "extjs-from-zero"
phase: 6
summary: "The Grid is a store rendered as rows; the form is fields over one record. Build a users grid with columns and renderers, add editing plugins and paging, then wire a form to edit the selected row."
tags: [extjs, grid, panel, forms, columns, renderers, editing]
difficulty: advanced
synonyms: ["ext.grid.panel", "ext js grid columns", "ext js grid renderer", "ext js cell editing rowediting", "ext js form panel", "ext js field fieldlabel", "ext js form loadRecord", "ext js paging toolbar"]
updated: 2026-06-23
---

# The Grid & Forms

The mental model that dissolves most of the apparent complexity: **the Grid is just a store rendered as rows, and the form is just fields over one record.** Nothing more exotic than that.

The Grid (`Ext.grid.Panel`) is Ext JS's flagship — for a lot of enterprises it's *the reason they chose Ext JS in the first place*. Sortable, editable, paged, filterable data tables that would take weeks to hand-roll, declared in a config object. But under that power it's doing something simple: it takes the `store` you built in [the data package](05-the-data-package.md), walks its records, and paints one row per record. Change the store, the grid updates — the grid is a *view* of the store.

The form is the same idea aimed at a single record instead of a collection. A grid shows you *all* the users; a form shows you *one* user's fields to edit. Both are windows onto the data package — the grid is the list, the form is the detail.

> 💡 If you remember one thing: a grid is bound to a **store** (many records), a form is bound to a **record** (one). Selecting a row in the grid and loading it into the form is just handing one record from the collection over to the detail view. That single move is the spine of nearly every admin screen ever built in Ext JS.

We'll build the users admin from [phase 4](04-layouts.md)'s shell for real: a grid of users on top, a form to edit the selected one below.

## The grid: a store with columns

A grid needs two things: a `store` (where the data lives) and `columns` (how to show it). You already have the store from phase 5. The columns are new — each one maps to a field on your model via `dataIndex`.

```javascript
Ext.create('Ext.grid.Panel', {
    renderTo: Ext.getBody(),
    title: 'Users',
    height: 400,
    width: 700,
    store: usersStore,          // the Ext.data.Store from phase 5
    columns: [
        { text: 'Name',  dataIndex: 'name',  flex: 1 },
        { text: 'Email', dataIndex: 'email', width: 240 },
        { text: 'Active', dataIndex: 'active', width: 80 }
    ]
});
```

*What just happened:* the grid asked `usersStore` for its records and drew one row per record. Each column's `text` is the header you see; its `dataIndex` is the **model field** it reads from each record — `dataIndex: 'name'` pulls the `name` field out of every user and stacks those values down the Name column. `flex: 1` lets the Name column grow to fill leftover width (same `flex` from `hbox` in phase 4 — columns size the same way), while `width: 240` pins Email to a fixed size. Click a header and the grid sorts the store by that field for free.

So far the `active` column shows raw `true`/`false`. That's what renderers are for.

## Renderers: formatting a cell

A `renderer` is a function on a column that turns the raw field value into what the user actually sees: booleans become "Yes/No", numbers become currency, statuses become badges — all without touching the underlying data.

```javascript
columns: [
    { text: 'Name',  dataIndex: 'name',  flex: 1 },
    { text: 'Email', dataIndex: 'email', width: 240 },
    {
        text: 'Active',
        dataIndex: 'active',
        width: 80,
        renderer: function (value, meta, record) {
            return value ? 'Yes' : 'No';
        }
    }
]
```

*What just happened:* for every cell in the Active column, the grid called your `renderer` with three things: `value` (the raw `active` field — `true` or `false`), `meta` (cell metadata you can tweak, e.g. `meta.tdCls` to add a CSS class), and `record` (the whole user model instance, in case you need *another* field to decide). You returned a string, and that string is what got painted. The stored value is still a real boolean; only the *display* changed.

> ⚠️ Renderers run a **lot** — once per visible cell, and again on every scroll, sort, filter, and refresh. Keep them cheap: no DOM lookups, no network calls, no heavy formatting inside a renderer. Real work in there will hurt on a grid with thousands of rows — precompute on the model or cache outside the function.

## Selection: knowing which row the user picked

The grid tracks selection for you. The `selModel` (or its shorthand `selType`) decides *how* the user selects — `'rowmodel'` (the default: click a row to select it) or `'checkboxmodel'` (a checkbox column for multi-select).

```javascript
Ext.create('Ext.grid.Panel', {
    title: 'Users',
    store: usersStore,
    selType: 'rowmodel',          // default; 'checkboxmodel' adds checkboxes
    columns: [ /* ... */ ],
    listeners: {
        selectionchange: function (selModel, selected) {
            var record = selected[0];       // the chosen user, or undefined
            if (record) {
                console.log('Picked:', record.get('name'));
            }
        }
    }
});
```

*What just happened:* `selType: 'rowmodel'` means a click selects a whole row. The `selectionchange` event fires whenever the selection changes, handing you the array of selected records. We grabbed the first one — for single selection that's your picked user. You can also ask the grid directly any time with `grid.getSelection()` (returns an array). This event is the trigger we'll use later to load the selected user into the edit form.

## Editing in the grid: plugins + editor columns

Grids can be editable in place, but editing isn't built into the base grid — it comes from a **plugin**. Two options:

- **`Ext.grid.plugin.CellEditing`** (`ptype: 'cellediting'`) — double-click a single cell to edit just that cell.
- **`Ext.grid.plugin.RowEditing`** (`ptype: 'rowediting'`) — double-click a row to edit the whole row at once, with Update/Cancel buttons.

You add the plugin to the grid, then give each editable column an `editor` (the field component used while editing).

```javascript
Ext.create('Ext.grid.Panel', {
    title: 'Users',
    store: usersStore,
    plugins: [{ ptype: 'cellediting', clicksToEdit: 2 }],
    columns: [
        {
            text: 'Name', dataIndex: 'name', flex: 1,
            editor: { xtype: 'textfield', allowBlank: false }
        },
        {
            text: 'Email', dataIndex: 'email', width: 240,
            editor: { xtype: 'textfield', vtype: 'email' }
        },
        { text: 'Active', dataIndex: 'active', width: 80 }   // no editor = read-only
    ]
});
```

*What just happened:* the `cellediting` plugin made cells editable on double-click (`clicksToEdit: 2`). Each column with an `editor` swaps in that field when you edit — Name becomes a `textfield` that refuses to be blank (`allowBlank: false`), Email a `textfield` that validates as an email (`vtype: 'email'`). The Active column has no `editor`, so it stays read-only. When you commit an edit, the plugin writes the new value back into the record and the store marks that record **dirty**.

This connects straight back to phase 5: editing only changes the record *in memory*. To push those changes to the server, call `sync` on the store.

```javascript
usersStore.sync({
    success: function () { console.log('Saved.'); },
    failure: function () { console.log('Save failed.'); }
});
```

*What just happened:* `store.sync()` looked at every dirty (modified), newly created, and removed record, and sent them to the server through the store's proxy — the same proxy/writer machinery from phase 5. Edit a cell, then `sync()`, and the change persists. No sync, and your edit lives only in the browser until a refresh wipes it. This is the most common "why didn't my change save?" gotcha: editing and persisting are two separate steps.

## Paging: don't load 50,000 rows at once

When a store has more records than you want on screen, a **paging toolbar** (`pagingtoolbar`) docks at the bottom and walks through pages, binding to the same store and driving the proxy's paging params.

```javascript
Ext.create('Ext.grid.Panel', {
    title: 'Users',
    store: usersStore,         // proxy reader has totalProperty set (phase 5)
    columns: [ /* ... */ ],
    bbar: {
        xtype: 'pagingtoolbar',
        store: usersStore,
        displayInfo: true      // shows "Displaying 1 - 25 of 1,043"
    }
});
```

*What just happened:* the `bbar` (bottom toolbar) holds a `pagingtoolbar` bound to the store. When you click Next, the toolbar asks the store to load the next page; the store's proxy sends `page`, `start`, and `limit` params to the server, and the reader uses `totalProperty` from the response to know how many records exist in total (so it can compute the page count and enable/disable the arrows). The grid only ever holds one page of rows in memory — that's the whole point.

> 💡 For genuinely huge datasets (hundreds of thousands of rows) where you want a single scrollbar instead of page buttons, Ext JS offers **buffered / infinite grids** — the store loads pages on demand as you scroll and discards rows that scroll out of view. Same store/proxy foundation, different rendering strategy, and more finicky to set up — reach for it only when paging genuinely isn't enough.

A few more column features you'll bump into in legacy grids, worth recognizing:

- **Filtering** — the `Ext.grid.filters.Filters` plugin adds per-column filter menus in the headers.
- **Grouping** — the `Ext.grid.feature.Grouping` feature collapses rows into labeled groups by a field.
- **Locked columns** — `locked: true` on a column freezes it on the left while the rest scroll horizontally.

## The form: fields over one record

Now the detail half. `Ext.form.Panel` (xtype `'form'`) is a container whose children are **field** components — `textfield`, `numberfield`, `combobox`, `datefield`, `checkbox`, and friends. Each field has a `fieldLabel` (the label beside it) and a `name` (the key it reads/writes under).

```javascript
Ext.create('Ext.form.Panel', {
    renderTo: Ext.getBody(),
    title: 'Edit User',
    width: 400,
    bodyPadding: 10,
    defaults: { anchor: '100%' },   // make every field full width
    items: [
        { xtype: 'textfield',   fieldLabel: 'Name',  name: 'name',  allowBlank: false },
        { xtype: 'textfield',   fieldLabel: 'Email', name: 'email', vtype: 'email' },
        { xtype: 'checkbox',    fieldLabel: 'Active', name: 'active' },
        {
            xtype: 'combobox',  fieldLabel: 'Role',  name: 'roleId',
            store: rolesStore,  displayField: 'name', valueField: 'id',
            queryMode: 'local'
        }
    ]
});
```

*What just happened:* the form rendered a labeled field per item. `fieldLabel` is what the user reads; `name` is the data key — `name: 'email'` means this field maps to the `email` value when the form reads or writes data. The `combobox` is itself bound to a **store** (`rolesStore`) — combos are mini-grids really: `displayField` is what the user sees in the dropdown, `valueField` is what actually gets stored. So the form, too, leans on the data package. `defaults: { anchor: '100%' }` applies that config to every child so you don't repeat it.

The form panel exposes its underlying engine as `basicForm` (reachable via `form.getForm()`) — that's the object that holds field values, validation state, and the load/submit machinery.

## Wiring it together: select → load → edit → save

The payoff: connecting the grid and the form into a working editor. The bridge is two methods: **`form.loadRecord(record)`** copies a record's values *into* the form's fields, and **`form.updateRecord(record)`** copies the edited field values *back into* the record.

```javascript
// when the grid selection changes, load that user into the form
usersGrid.on('selectionchange', function (selModel, selected) {
    var record = selected[0];
    if (record) {
        editForm.loadRecord(record);   // fields now show this user's values
    }
});

// when the user clicks Save on the form
function onSave() {
    if (!editForm.isValid()) {
        return;                        // a field failed validation; stop
    }
    var record = editForm.getRecord(); // the record we loaded earlier
    editForm.updateRecord(record);     // write edited values back into it
    usersStore.sync();                 // persist via the proxy (phase 5)
}
```

*What just happened:* selecting a row fires `selectionchange`; we take the chosen user and call `loadRecord`, which matches each field's `name` to a model field and fills the inputs — the form now mirrors that user. The user edits. On Save we first call `isValid()` to check every field's validation rules (`allowBlank`, `vtype`, custom validators) and bail if anything's wrong. Then `updateRecord` does the reverse of `loadRecord` — it copies the field values back onto the record, which marks it **dirty**. Finally `store.sync()` ships the change to the server, closing the same loop the grid editing did. Grid and form, two views of the same record, kept in step.

> 📝 Older code sometimes skips the record entirely and uses the form's own proxy: `form.submit()` POSTs the field values directly, `form.load()` GETs them. That classic load/submit path still works and shows up in legacy screens. But the **record-based path** (`loadRecord`/`updateRecord` + `store.sync()`) is the common modern approach because it keeps the store as the single source of truth — the grid and form never disagree about what a user's data is. When you see both styles in one codebase, that's usually history, not intent.

A couple of validation helpers worth keeping in your pocket:

- `form.getValues()` — returns a plain object of all field values (handy for logging or a custom save).
- `allowBlank: false` makes a field required; `vtype: 'email'` (and `'url'`, `'alpha'`, etc.) validate format; a `validator` function lets you write arbitrary checks. All of these feed `isValid()`.

## Recap

- **The Grid is a store rendered as rows; the form is fields over one record.** Both are views onto the phase-5 data package — the grid shows the collection, the form shows one member of it.
- A grid needs a **`store`** and **`columns`**; each column's **`dataIndex`** maps it to a model field, and a **`renderer`** formats the displayed value (keep renderers cheap — they run constantly).
- Editing comes from a **plugin** (`cellediting` or `rowediting`) plus an **`editor`** on each editable column. Edits mark records **dirty**; **`store.sync()`** is the separate step that actually persists them.
- A **`pagingtoolbar`** bound to the store walks pages using the proxy's paging params and the reader's `totalProperty`; buffered grids handle truly huge datasets.
- Wire grid to form with **`loadRecord`** (record → fields) and **`updateRecord`** (fields → record), guard with **`isValid()`**, then **`sync()`** — so the grid and form stay two consistent windows onto the same record.

## Quick check

Lock in what binds to what, and how an edit actually reaches the server:

```quiz
[
  {
    "q": "What does a column's dataIndex do?",
    "choices": ["Sets the column's pixel width", "Maps the column to a field on the store's model", "Defines the sort order", "Names the CSS class for the cell"],
    "answer": 1,
    "explain": "dataIndex tells the column which model field to read from each record, so dataIndex: 'name' fills the column with every record's name field."
  },
  {
    "q": "You edit a cell with the cellediting plugin and see the new value in the grid, but after a refresh it's gone. Why?",
    "choices": ["The renderer overwrote it", "Editing only changed the record in memory; you never called store.sync()", "The column had no dataIndex", "The grid wasn't bound to a store"],
    "answer": 1,
    "explain": "Editing marks the record dirty in memory. Persisting is a separate step: store.sync() sends dirty/new/removed records to the server via the proxy."
  },
  {
    "q": "Which pair of methods moves data between a grid's selected record and a form?",
    "choices": ["form.load() and form.submit()", "form.loadRecord(record) to fill the form, form.updateRecord(record) to write edits back", "grid.getSelection() and grid.setSelection()", "store.add() and store.remove()"],
    "answer": 1,
    "explain": "loadRecord copies record values into the form's fields; updateRecord copies edited field values back into the record (which then gets persisted with store.sync())."
  }
]
```

---

[← Phase 5: The Data Package](05-the-data-package.md) · [Guide overview](_guide.md) · [Phase 7: MVVM: ViewControllers, ViewModels & Binding →](07-mvvm-and-binding.md)
