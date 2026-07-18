---
title: "When React Breaks"
guide: "react-from-zero"
phase: 8
summary: "The classic React errors - too many re-renders, missing keys, hook order violations, stale state, frozen inputs - decoded: what each message means, why it happened, and the calm fix."
tags: [react, errors, debugging, too-many-re-renders, rules-of-hooks]
difficulty: intermediate
synonyms: ["too many re-renders react fix", "rendered more hooks than during the previous render", "react error each child unique key", "objects are not valid as a react child", "react input not updating"]
updated: 2026-07-18
---

# When React Breaks

Every error on this page is one you will meet. That's not pessimism - it's the good news: React's
classic failures are a short, fixed list, each one a direct consequence of a rule from earlier
phases. Meet them here first and each becomes a thirty-second fix instead of a lost afternoon.

## The cheat-card

| Symptom / message | Almost always means | Fix |
|---|---|---|
| **"Too many re-renders"** | A setter is being called *during* render | Find `onClick={fn(...)}` or a bare `setX(...)` in the body; wrap in a function |
| **"Rendered more hooks than during the previous render"** | A hook inside `if`/loop/early return | Move all hooks above the first `return`; branch *after* them |
| **"Each child in a list should have a unique 'key'"** | Mapped elements without `key` | `key={item.id}` on the top element inside `map` |
| **"Objects are not valid as a React child"** | Rendering `{obj}` instead of `{obj.field}` | Render the field; `JSON.stringify(obj)` to inspect |
| **"Cannot read properties of undefined/null"** | Rendering before async data exists | Guard: `if (!data) return <Spinner />` |
| UI stuck, but the data is right in the console | State was mutated, identity unchanged | New array/object: spread, `map`, `filter` (phase 3) |
| Input won't accept typing | `value` set with no working `onChange` | `onChange={e => setX(e.target.value)}` (phase 5) |
| Handler sees old state values | Stale closure snapshot | Function-form setter, complete effect deps (phase 6) |
| Effect fires twice on mount (dev) | StrictMode's deliberate double-mount | Not a bug - write the cleanup, don't remove StrictMode |

The rest of this phase walks the five that deserve more than a table row.

## "Too many re-renders. React limits the number of renders..."

```jsx
function Tabs() {
  const [active, setActive] = useState(0);
  return <button onClick={setActive(1)}>Details</button>; // ✗
}
```

Read `onClick={setActive(1)}` as JavaScript: call `setActive(1)` *now*, during render, and pass its
return value to `onClick`. Setting state schedules a render; the render runs this line again; loop.
React counts the laps and pulls the plug with this error.

The fix is the phase 5 rule: `onClick={() => setActive(1)}`. When the error points at a component
with no obvious handler bug, look for any bare `setX(...)` call sitting in the function body - the
same crime without the costume.

## "Rendered more hooks than during the previous render"

```jsx
function Profile({ user }) {
  if (!user) return <Spinner />;        // ✗ early return above a hook
  const [tab, setTab] = useState('posts');
  ...
}
```

Phase 3 told you *why* this rule exists: React matches state to hooks by call order. First render
(no user): zero hooks ran. Second render (user loaded): one hook. The bookkeeping no longer lines
up, and React refuses to guess. The mechanical fix: hooks first, branches after.

```jsx
function Profile({ user }) {
  const [tab, setTab] = useState('posts'); // ✓ every hook, every render
  if (!user) return <Spinner />;
  ...
}
```

## "Objects are not valid as a React child"

```jsx
<p>Ordered by {order.customer}</p>  // customer is { name: 'Ada', id: 7 }
```

JSX happily renders strings and numbers, skips booleans and null, and *throws* on plain objects -
because there's no sane default for "draw this object." The error names the object's keys
(`found: object with keys {name, id}`), which is your map to the fix: render `{order.customer.name}`.
A surprise variant: `{new Date()}` throws too - a `Date` is an object; format it first.

## The one with no error message at all

The worst React bug is silent: you click, the handler runs, the console shows the data changing,
and the screen just... sits there. You've already learned everything needed to solve it, so here it
is as a drill. The suspects, in order of likelihood:

1. **Mutation** - `push`/`sort`/property assignment on state, then setting the same reference.
   Verify: is the setter receiving a *new* object? (phase 3)
2. **Wrong state copy** - two components own separate copies of "the same" data and you updated the
   other one. Lift it. (phase 7)
3. **Snapshot arithmetic** - `setX(x + 1)` where `x` is stale. Function form. (phase 3)

🪖 **War story:** a teammate lost half a day to a table that wouldn't re-sort. The sort *worked* -
`console.log` showed the array perfectly ordered. The code was `setRows(rows.sort(byDate))`: `sort`
mutates in place and returns the same array, so the data was right, the reference identical, and
React saw nothing to do. The fix was eleven characters: `setRows([...rows].sort(byDate))`. The
lesson: when the console is right and the screen is wrong, stop debugging your logic - hunt the
mutation.

## Reading a React error like a local

Two habits turn React's scary red walls into directions:

- **Read the component stack, bottom-up.** Under the message, React prints which component was
  rendering, inside which parent. The top frames are React internals - your bug is in the first
  frame that names *your* component.
- **In dev, errors surface twice** (StrictMode double-invokes renders to flush out impure ones).
  Fix the first occurrence; the echo is the same bug.

## Recap

1. Setter called during render → infinite loop → "Too many re-renders." Wrap it in a function.
2. Hook count must match every render - hooks above all returns, branches below.
3. Missing `key` is a warning today and a corrupted-row bug the day the list reorders.
4. Objects can't be rendered - render their fields; guard against not-yet-loaded data.
5. Right data + frozen screen = mutation, almost every time. New references.

```quiz
[
  {
    "q": "\"Rendered more hooks than during the previous render\" appears after data loads. What's the likely shape of the bug?",
    "choices": [
      "Two components share one useState",
      "An early return (like a loading guard) sits above a hook, so hook count changed between renders",
      "The dependency array of an effect is missing",
      "useState was called with a different initial value on the second render"
    ],
    "answer": 1,
    "why": [
      "Hooks can't be shared across components - each call belongs to the component that made it.",
      null,
      "A missing deps array causes extra effect runs, not a hook-count mismatch.",
      "The initial value is only read on the first render; changing it later is ignored, not an error."
    ],
    "explain": "The count went from N to N+1 because a conditional path skipped a hook last render. Hooks first, returns after - always."
  },
  {
    "q": "Clicking sort visibly reorders the array in the console, but the table on screen never changes. First thing to check?",
    "choices": [
      "Whether the API returned the rows in the wrong order",
      "Whether sort mutated the state array in place, so the setter received the same reference",
      "Whether the table is missing an onChange handler",
      "Whether StrictMode is double-rendering the table"
    ],
    "answer": 1,
    "why": [
      "The console already shows the data correctly ordered - the data layer is fine; the update isn't reaching the screen.",
      null,
      "onChange belongs to inputs; a display table doesn't have or need one.",
      "StrictMode double-renders in dev but never suppresses an update."
    ],
    "explain": "Array.prototype.sort mutates and returns the same array - identical reference, no re-render. Copy first: setRows([...rows].sort(fn))."
  }
]
```

---

[← Phase 7: Sharing State](07-sharing-state.md) · [Guide overview](_guide.md) · [Phase 9: Where to Go Next →](09-where-to-go-next.md)
