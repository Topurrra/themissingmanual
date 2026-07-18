---
title: "Effects"
guide: "react-from-zero"
phase: 6
summary: "useEffect synchronizes your component with systems outside React - fetches, timers, subscriptions - with a dependency array saying when, and a cleanup function undoing what it set up."
tags: [react, useeffect, side-effects, dependency-array, cleanup, fetching]
difficulty: intermediate
synonyms: ["how does useeffect work", "useeffect dependency array explained", "useeffect infinite loop", "useeffect cleanup function", "fetch data in react"]
updated: 2026-07-18
---

# Effects

`useEffect` has a reputation as React's hardest part, and it's a deserved one - but not because the
hook is complicated. It's because it gets taught as "the place to put code that runs after render,"
which is vague enough to invite every bug it's famous for. Here's the accurate sentence:

💡 **Key point:** an effect **synchronizes your component with something outside React** - a server,
a timer, a browser API, a websocket. If no outside system is involved, you almost certainly don't
need an effect.

Rendering must stay pure: same props and state, same JSX, no side effects - that's the contract from
phase 1 that lets React re-run your components freely. But real apps must fetch data, start timers,
update `document.title`. Effects are the escape hatch: *after* React has rendered and patched the
DOM, it runs your effect, letting you touch the outside world without polluting the render itself.

## The shape

```jsx
useEffect(() => {
  // runs AFTER the render is committed to the DOM
  return () => {
    // cleanup: undo whatever the effect set up
  };
}, [deps]); // when to re-run
```

The dependency array is the part to get precise about, because its three forms mean three different
things:

| Form | Meaning |
|---|---|
| `[]` | run after the first render only (no value it reads can change) |
| `[userId]` | run after the first render, and again whenever `userId` changes |
| *(omitted)* | run after **every** render - almost always a mistake |

The real rule for what goes in the array: **every value from component scope that the effect
reads** - props, state, and anything derived from them. The array isn't a scheduling knob you tune;
it's a declaration of what the effect depends on, and lying about it causes the stale-data bugs
below.

## A real one: fetching

```jsx
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (!cancelled) setUser(data);
      });
    return () => { cancelled = true; };
  }, [userId]);

  if (!user) return <Spinner />;
  return <h1>{user.name}</h1>;
}
```

*What just happened:* after the first render, the effect fetches user data and stores it in state
(triggering a re-render that shows it). If the parent switches `userId` from 1 to 2, the dependency
changed, so React first runs the *cleanup* from the previous effect, then the effect again for the
new id.

That `cancelled` flag is not decoration - it's the fix for a real race. The user clicks profile 1,
then quickly profile 2. Two fetches are in flight, and nothing guarantees they return in order: if
1's response arrives *after* 2's, a naive effect would overwrite the correct profile with the stale
one. The cleanup flips 1's flag before 2's effect starts, so the late response gets ignored.

## Cleanup: the other half

Whatever an effect starts, its cleanup stops. React runs cleanup before re-running the effect, and
when the component unmounts.

```jsx
useEffect(() => {
  const id = setInterval(() => setSeconds(s => s + 1), 1000);
  return () => clearInterval(id);
}, []);
```

Skip the cleanup and every mount leaks an interval that keeps firing after the component is gone -
calling a setter on an unmounted component, stacking up if the component mounts repeatedly. The same
applies to event listeners (`removeEventListener`) and subscriptions (`unsubscribe`). An effect
without cleanup should make you ask: does this start anything that outlives the render?

Notice `setSeconds(s => s + 1)` - the function form from phase 3. `setSeconds(seconds + 1)` inside
this effect would read the `seconds` snapshot from the render the effect ran in: **0**, forever.
The interval would dutifully set `1` once a second. This is the **stale closure** - the effect's
functions see the values from the render that created them, and the function-form setter is the
clean way out.

📝 **Terminology:** in development, `<StrictMode>` (which Vite's template turns on) mounts every
component, unmounts it, and mounts it again - deliberately. Your effect runs twice on mount, *in dev
only*. It's not a bug; it's a smoke test: any effect whose double-run causes trouble is an effect
whose cleanup is missing or wrong. Write the cleanup instead of deleting StrictMode.

## The infinite loop, dissected

The most famous effect bug:

```jsx
const [data, setData] = useState([]);

useEffect(() => {
  fetch('/api/items').then(r => r.json()).then(setData);
}); // ← no dependency array
```

No array means "run after every render." The effect sets state → state change renders → the effect
runs again → sets state → ... The network tab fills with identical requests. Adding `[]` fixes this
one. The subtler variant survives the array:

```jsx
useEffect(() => { ... }, [{ id: userId }]); // object literal: new identity every render
```

Dependencies are compared by `Object.is` - the same identity check from phase 3, now working against
you. An object or array *created during render* is a brand-new identity each time, so the dependency
"always changed." Depend on the primitives inside (`[userId]`), not on containers built in render.

## When you don't need an effect

The most common `useEffect` in beginner code shouldn't exist:

```jsx
// ✗ derived state via effect: an extra render, an extra place to desync
const [items, setItems] = useState([]);
const [total, setTotal] = useState(0);
useEffect(() => { setTotal(items.reduce((s, i) => s + i.price, 0)); }, [items]);

// ✓ derived data is just... computed during render
const total = items.reduce((s, i) => s + i.price, 0);
```

If a value can be computed from props and state, compute it in render - no hook, no lag, no second
copy to keep in sync. The same goes for reacting to a click: put the code in the event handler, not
in an effect watching a `clicked` flag. Reach for `useEffect` only when an outside system is
genuinely involved.

## Recap

1. Effects synchronize with the world outside React; pure derivations and event responses don't
   belong in them.
2. The dependency array declares everything the effect reads. `[]` = once, `[x]` = when x changes,
   missing = every render.
3. Cleanup undoes the effect: cancel the fetch flag, clear the timer, unsubscribe. StrictMode's
   dev double-mount exists to expose missing cleanup.
4. Stale closures read old snapshots - the function-form setter sidesteps the commonest case.
5. Objects/arrays created in render make dependencies "always changed" - depend on primitives.

```quiz
[
  {
    "q": "An effect fetches data and sets state, and the network tab shows the same request firing forever. The most likely cause?",
    "choices": [
      "The API is slow, so React retries automatically",
      "The dependency array is missing, so the effect re-runs after the re-render its own setState caused",
      "The fetch was not awaited",
      "StrictMode is enabled"
    ],
    "answer": 1,
    "why": [
      "React never retries fetches - it has no idea your effect even makes one.",
      null,
      "Not awaiting changes nothing here - the .then chain handles the response either way.",
      "StrictMode doubles the mount-time run in dev (two requests), it cannot produce an endless stream."
    ],
    "explain": "No array = run after every render. Effect sets state, state renders, effect runs again: a loop through the render cycle."
  },
  {
    "q": "setInterval(() => setCount(count + 1), 1000) inside a mount-only effect makes the counter go 0 → 1 and then stop. Why?",
    "choices": [
      "The interval only fires once without a cleanup function",
      "The callback closed over count from the first render (0), so every tick sets 1",
      "setCount can't be called from inside setInterval",
      "The effect needs count in its dependency array to keep the interval running"
    ],
    "answer": 1,
    "why": [
      "The interval fires every second - the console would prove it; each firing just sets the same value.",
      null,
      "Setters work fine from any callback - the problem is which value the callback can see.",
      "Adding count to the deps 'works' by tearing down and recreating the interval every second - treating the symptom; the function-form setter fixes the cause."
    ],
    "explain": "A stale closure: the interval callback sees the snapshot from the render that created it. setCount(c => c + 1) asks React for the latest value instead."
  },
  {
    "q": "You have items in state and need the total price on screen. The React-appropriate way?",
    "choices": [
      "A second useState for total, updated by a useEffect watching items",
      "Compute const total = items.reduce(...) during render",
      "Store total inside the items array's last element",
      "A ref that accumulates the total as items are added"
    ],
    "answer": 1,
    "why": [
      "It works, but it renders twice per change and creates a second copy of the truth that can desync - the pattern this phase specifically warns against.",
      null,
      "Smuggling derived data into your source data corrupts the model both directions.",
      "Refs don't trigger renders, so the screen would never update when the total changes."
    ],
    "explain": "Derived data is computed, not stored. If it follows from existing state, calculate it in render - no effect, no extra state, nothing to desync."
  }
]
```

---

[← Phase 5: Events and Forms](05-events-and-forms.md) · [Guide overview](_guide.md) · [Phase 7: Sharing State →](07-sharing-state.md)
