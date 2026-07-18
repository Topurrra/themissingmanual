---
title: "Lists, Keys, and Conditional Rendering"
guide: "react-from-zero"
phase: 4
summary: "Render lists with map, show things conditionally with && and ternaries, and give every list item a stable key so React can tell your items apart across renders."
tags: [react, lists, keys, map, conditional-rendering]
difficulty: beginner
synonyms: ["react key prop warning", "how to render a list in react", "react conditional rendering", "why not use index as key", "each child in a list should have a unique key"]
updated: 2026-07-18
---

# Lists, Keys, and Conditional Rendering

Real UIs are mostly two moves: *show one of these for each item in this array* and *show this only
when that's true*. React has no special syntax for either - both are plain JavaScript expressions
inside JSX. That's good news (nothing new to memorize) with one exception: the `key` prop, which
looks like bureaucracy until you've seen the bug it prevents. This phase shows you the bug.

## Rendering a list: map, nothing more

```jsx
function TodoList({ todos }) {
  return (
    <ul>
      {todos.map(todo => (
        <li key={todo.id}>{todo.text}</li>
      ))}
    </ul>
  );
}
```

*What just happened:* `map` turns an array of data into an array of elements, and JSX renders an
array of elements as siblings. There's no `for` directive, no repeater component - the JavaScript
you already know is the templating language.

Which brings us to the attribute you were told to add without being told why.

## What keys are actually for

Recall phase 1: on every render, React diffs the new description against the old one. For a list,
that raises a question the diff can't answer on its own: *is the first `<li>` in the new list the
same item as the first `<li>` in the old list, or a different one?*

The `key` is your answer. It's an identity tag: "this element represents item `id: 7`, wherever it
appears." With stable keys, React can tell moved-vs-changed apart:

- Same key, new position → the item **moved**; React moves the existing DOM node (and everything
  attached to it) instead of rebuilding it.
- New key → a genuinely new item; build DOM for it.
- Key gone → item removed; delete its DOM.

## The index-as-key bug, live

The tempting shortcut is `key={index}` - it silences the console warning, and it *seems* fine. Here's
the situation where it corrupts your UI. Suppose each row has an uncontrolled input (some state that
lives in the DOM, like what the user typed), and the user deletes the *first* row:

```text
Before delete (key = index):          After deleting "Buy milk":
  key=0  Buy milk    [typed: "2L"]      key=0  Walk dog    [typed: "2L"]  ← wrong!
  key=1  Walk dog    [typed: ""  ]      key=1  Call mom    [typed: ""  ]
  key=2  Call mom    [typed: ""  ]
```

React's view with index keys: "key 0 still exists, its text changed from 'Buy milk' to 'Walk dog'" -
so it *keeps the first DOM row* (typed text and all) and just swaps the label. The "2L" the user
typed for milk now sits next to "Walk dog". No error, no warning, just data attached to the wrong
row. With `key={todo.id}`, key 0's row is correctly seen as *deleted*, and every other row keeps its
own DOM.

💡 **Key point:** a key must be **stable** (same item → same key on every render) and **unique among
siblings**. An `id` from your data is right. The array index is only acceptable for lists that never
reorder, never insert, and never delete - which is a promise most lists eventually break.

⚠️ **Gotcha:** `key={Math.random()}` or `key={crypto.randomUUID()}` *generated during render* is the
opposite error: every render invents new keys, so React sees every item as brand new and rebuilds the
entire list's DOM each time - state wiped, focus lost, performance gone. Generate ids when the *data*
is created, not when it's rendered.

## Conditional rendering

Again, plain JavaScript expressions - three idioms cover nearly everything:

```jsx
function Inbox({ messages, error, isLoading }) {
  if (error) return <ErrorBanner error={error} />;   // 1. early return for whole-component branches

  return (
    <section>
      {isLoading && <Spinner />}                     {/* 2. && for "show or nothing" */}
      {messages.length > 0
        ? <MessageList messages={messages} />
        : <p>Inbox zero. Enjoy it.</p>}              {/* 3. ternary for either/or */}
    </section>
  );
}
```

⚠️ **Gotcha:** the `&&` idiom has one famous edge: numbers. `{messages.length && <List />}` renders
the *number* `0` on screen when the list is empty, because `0 && anything` evaluates to `0`, and JSX
renders numbers (it only skips `false`, `null`, and `undefined`). Write the comparison explicitly:
`{messages.length > 0 && <List />}`. If a stray `0` ever appears in your UI, this is where it came
from.

## Hiding vs unmounting - it matters

When a condition flips from true to false, React doesn't hide the component - it **unmounts** it:
DOM removed, state destroyed. Flip it back and you get a brand-new component with fresh initial
state. A collapsed panel rendered with `{open && <Panel />}` forgets everything typed inside it when
it closes. If the contents must survive, either lift the state up to the parent (phase 7) or keep the
component mounted and hide it with CSS. Neither is "the right way" - one destroys state, one
preserves it; choose the one the UX needs.

## Recap

1. Lists are `array.map(item => <El key={item.id} />)` - plain JavaScript, no special syntax.
2. Keys give list items identity across renders so React can move DOM instead of rebuilding it.
3. Index keys corrupt row-attached state the moment a list reorders or deletes; render-time random
   keys rebuild everything every time. Use stable data ids.
4. Conditionals: early return, `&&` (watch the `0`!), ternary.
5. A false condition unmounts - state inside is destroyed, not hidden.

```quiz
[
  {
    "q": "A list uses key={index}. The user deletes the first row, and the text they'd typed into that row's input now appears in a different row. What happened?",
    "choices": [
      "The browser cached the input value and restored it in the wrong place",
      "React matched rows by index, so it kept the first DOM node and only changed its label",
      "The delete handler mutated the array instead of copying it",
      "Two rows accidentally had the same id in the data"
    ],
    "answer": 1,
    "why": [
      "The browser restores values on page reload, not on list re-renders - this is React's reconciliation at work.",
      null,
      "A mutation bug would freeze the UI entirely (no re-render), not shift typed text between rows.",
      "Duplicate data ids cause a console warning about duplicate keys - but this list isn't using data ids at all."
    ],
    "explain": "With index keys, 'the item with key 0' still exists after the delete, so React reuses that DOM node - along with the user's typed text - for what is actually a different item."
  },
  {
    "q": "Your UI mysteriously shows a stray 0 above an empty list. Which line produced it?",
    "choices": [
      "{items.length > 0 && <List items={items} />}",
      "{items.length && <List items={items} />}",
      "{items.map(i => <Row key={i.id} />)}",
      "<List items={items ?? []} />"
    ],
    "answer": 1,
    "why": [
      "The explicit comparison yields false for an empty list, and JSX renders false as nothing - this is the fixed version.",
      null,
      "Mapping an empty array renders an empty array - nothing appears, stray or otherwise.",
      "?? substitutes an empty array for null/undefined; it never produces a visible number."
    ],
    "explain": "0 && X evaluates to 0, and JSX renders numbers. Only false, null, and undefined render as nothing - always write the comparison."
  }
]
```

---

[← Phase 3: State and Re-renders](03-state-and-re-renders.md) · [Guide overview](_guide.md) · [Phase 5: Events and Forms →](05-events-and-forms.md)
