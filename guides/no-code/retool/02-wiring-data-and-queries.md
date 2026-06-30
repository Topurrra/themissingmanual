---
title: "Wiring Data, Queries & State"
guide: retool
phase: 2
summary: "How queries fetch and write data, how components bind to that data and to each other, and how transformers, events, and app state make a tool actually do something."
tags: [retool, queries, data-binding, state, transformers, events]
difficulty: intermediate
synonyms:
  - "bind a table to a query in retool"
  - "retool javascript transformer"
  - "trigger a query on button click"
  - "pass component value into a query"
  - "retool app state and variables"
updated: 2026-06-30
---

# Wiring Data, Queries & State

A table sitting on a canvas does nothing until you wire it up. Wiring is where Retool stops being a layout tool and starts being an app. There are four moving parts: queries that move data in and out, bindings that connect components to data and to each other, transformers that reshape values, and events that decide what happens when someone clicks. Get these four straight and you can build almost anything Retool is good at.

## Queries: the data verbs

A query is a named operation against a resource. It's the only way data enters or leaves your app. There are read queries and write queries, and the difference matters.

A read query pulls rows in - `select * from orders where status = 'late'`. A write query changes something - an insert, an update, a delete, or an API call that posts data. Each query has a name (`getOrders`, `updateRefund`), and that name becomes a handle you reference everywhere else. After a read query runs, its results live at `getOrders.data`, and any component can point at that.

The most useful thing about queries is that they take inputs from the rest of the app using a binding - an expression wrapped in double curly braces. Inside the braces you write a small JavaScript expression that reads other parts of the app.

```text
-- A query named getOrders, on the Production DB resource
select *
from orders
where status = {{ statusSelect.value }}
  and created_at > {{ dateInput.value }}
limit 100
```

Here `statusSelect` and `dateInput` are components on the canvas. When the user changes the dropdown, the binding re-evaluates and (if you set the query to run automatically) the table refreshes. That's the live feel from Phase 1, made concrete.

A safety note that's not optional: those `{{ }}` values are passed as bound parameters, not pasted into the SQL string. That's what keeps a user typing into a search box from rewriting your query - the database treats their input as a value, never as code. Use the binding; never hand-concatenate user input into a query string.

Queries don't only run on a schedule or a change. You can run one on demand - most often from a button - which we get to under events.

## Binding: components reading each other

Anywhere you see a property field with the `{{ }}` syntax available, you can put an expression that reads the app's current state. This is how components reference each other.

```text
Table  "ordersTable"   →  Data:  {{ getOrders.data }}
Text   "selectedId"    →  Value: {{ ordersTable.selectedRow.id }}
Query  "getCustomer"   →  where id = {{ ordersTable.selectedRow.customer_id }}
Text   "customerName"  →  Value: {{ getCustomer.data[0].name }}
```

Read that chain top to bottom and you've built a master-detail view: a table of orders, and a panel that shows the customer for whichever row is selected - without a line of glue code. Each binding is a tiny expression Retool re-evaluates whenever anything it depends on changes. The mental model is a spreadsheet: cells reference other cells, and editing one ripples outward automatically.

Bindings can do light logic inline: `{{ ordersTable.selectedRow ? "Editing order " + ordersTable.selectedRow.id : "Pick a row" }}`. Keep these short. The moment an expression needs more than a line, move it into a transformer.

## Transformers: reshaping data

Real data is rarely the shape your UI wants. The API returns nested JSON; you need a flat list. Two queries return halves of the same picture; you need them joined. A status code of `2` should read "Shipped". A transformer is a named block of JavaScript that takes inputs and returns a value - a clean place to do that reshaping once and reference the result like any other value.

```text
transformer "ordersForTable":
  return {{ getOrders.data }}.map(o => ({
    id:       o.id,
    customer: o.customer_name,
    total:    "$" + (o.cents / 100).toFixed(2),
    status:   { 1: "Pending", 2: "Shipped", 3: "Late" }[o.status]
  }))
```

Now your table binds to `{{ ordersForTable.value }}` and shows friendly columns, while the raw query stays untouched. Transformers recompute automatically when their inputs change, same as bindings. The rule of thumb: bindings for one-liners, transformers for anything you'd be tempted to copy-paste or that's more than a line of logic.

## Events: making buttons do things

Components fire events - a button has a click event, an input has a change event, a table has a row-select event. You attach event handlers to them. An event handler is "when X happens, do Y." The common Ys:

- Run a query (`updateRefund.trigger()`)
- Show or hide a modal
- Set a variable
- Show a notification ("Refund saved")
- Navigate to another page

A real write flow chains these. The button's click handler runs the write query; the write query has its own success handler that refreshes the read query and pops a confirmation; on failure, it shows the error.

```text
Button "Save Refund"  on click  →  trigger query  updateRefund

Query "updateRefund"  on success →  trigger query   getOrders   (refresh the table)
                                 →  show notification "Refund saved"
                      on failure →  show notification {{ updateRefund.error }}
```

This is the part beginners under-do. A write that doesn't refresh the table leaves the user staring at stale data, convinced it didn't work. Always close the loop: write, refresh, confirm.

## App state: holding values between clicks

Sometimes you need to remember something that isn't in any component or query - a multi-step wizard's progress, a list of selected IDs for a bulk action, a toggle. For that, Retool gives you variables (also called state): named slots you create, read with `{{ myVar.value }}`, and write with a "set variable" action in an event handler. Reach for a variable only when a value genuinely needs to outlive a single interaction or be shared across components. Most of the time the data you need already lives in a query result or a component's value - check there first before inventing state.

Put the four parts together - queries move data, bindings connect it, transformers shape it, events drive it, and variables remember it - and you have the full toolkit. Phase 3 is about making the tool you built safe to put in front of your team.
