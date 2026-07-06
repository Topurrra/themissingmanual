---
title: "Reactivity Without Magic"
guide: "building-your-own-mini-framework"
phase: 2
summary: "Build a signal from scratch - a value plus a list of subscribers - and wire it to phase 1's diff/patch renderer so changing state triggers a real re-render."
tags: [javascript, reactivity, signals, frameworks, web-fundamentals]
difficulty: advanced
synonyms: ["what is a signal in javascript", "how does react state work", "build your own reactivity system", "how does svelte reactivity work"]
updated: 2026-07-06
---

# Reactivity Without Magic

Phase 1 built `diff()` and `patch()`: given an old tree and a new tree, update only what changed. That still leaves a gap. Something has to notice that state changed, build the new tree, and call `patch()` at the right moment. In React that's `setState`. In Vue and Svelte it's a signal or a reactive variable. All of them reduce to the same small idea: a value that remembers who's watching it.

## The signal

A signal is a box holding a value and a list of functions to call when that value changes:

```js
function createSignal(initialValue) {
  let value = initialValue;
  const subscribers = new Set();

  function read() {
    return value;
  }

  function write(newValue) {
    value = newValue;
    subscribers.forEach(fn => fn(value));
  }

  function subscribe(fn) {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
  }

  return [read, write, subscribe];
}
```

`read` and `write` are what your code calls directly. `subscribe` is what the *renderer* calls, once, to register itself as a listener. Nobody polls for changes and nobody watches the whole app - `write` fires exactly the subscribers registered on that one signal.

```js
const [count, setCount] = createSignal(0);

count(); // 0
setCount(5);
count(); // 5
```

Notice `subscribe` isn't even used yet here - this part alone is just a value with a notification list, no DOM involved. That separation matters: you can test a signal in a plain script, no browser needed.

## Wiring it to the renderer

Connect a signal to phase 1's `diff`/`patch` by subscribing a render function that rebuilds the tree and patches the real DOM:

```js
function mount(root, renderFn, ...signals) {
  let oldTree = renderFn();
  root.appendChild(createEl(oldTree));

  function rerender() {
    const newTree = renderFn();
    patch(root, diff(oldTree, newTree));
    oldTree = newTree;
  }

  signals.forEach(([, , subscribe]) => subscribe(rerender));
}
```

`renderFn` is a function that reads signals and returns a vnode tree - the same `h()` calls from phase 1, just wrapped so they can run more than once:

```js
const [count, setCount] = createSignal(0);

function view() {
  return h("div", null,
    h("span", null, `Count: ${count()}`),
    h("button", { onclick: "increment()" }, "+1")
  );
}

mount(document.getElementById("app"), view, [count, setCount, count.subscribe]);

function increment() {
  setCount(count() + 1);
}
```

(Real frameworks attach `onclick` as an actual event listener rather than a string, and track which signals a component *actually read* automatically - more on that gap in phase 3. This version keeps the wiring explicit so you can see it.)

Call `increment()` and the sequence is: `setCount` runs, updates the stored value, calls every subscriber - here just `rerender` - which calls `view()` again to get a new tree, diffs it against the old one, and patches only the `<span>`'s text. The button, its listener, any other untouched DOM: left alone.

## Why this is the whole loop

This is the mechanism people mean when they say a framework is "reactive": state holds a list of interested parties, and changing the state notifies exactly those parties, who then reconcile the UI through a diff. No magic, no polling, no framework runtime scanning your app for changes every frame. It's a subscriber list and a function call.

The gap between this and a real signal library (like Solid's or Vue's) is mostly about *how subscriptions get registered*. Here, you list `[count, setCount, count.subscribe]` by hand. Production reactivity systems track dependencies automatically: when `view()` runs, the framework notices it called `count()` and subscribes for you, with no explicit list. That's a real engineering feat, but it's an optimization on top of this loop, not a different loop.

Trace through the update sequence once more before moving on.

```quiz
[
  {
    "q": "What does createSignal's write() function do?",
    "choices": [
      "Saves the value to localStorage",
      "Updates the stored value and calls every subscribed function",
      "Immediately re-renders the whole page"
    ],
    "answer": 1
  },
  {
    "q": "In mount(), what triggers patch() to run again after the first render?",
    "choices": [
      "A setInterval timer checking for changes",
      "A signal's write() calling the subscribed rerender function",
      "The browser automatically detects DOM differences"
    ],
    "answer": 1,
    "explain": "rerender is registered via subscribe(), so it only runs when write() calls it."
  },
  {
    "q": "What do production frameworks automate that this mini version does by hand?",
    "choices": [
      "The diff() algorithm itself",
      "Detecting which signals a render function read, and subscribing automatically",
      "Creating DOM elements"
    ],
    "answer": 1
  }
]
```

---

[← Phase 1: A Virtual DOM From Scratch](01-a-virtual-dom-from-scratch.md) · [Guide overview](_guide.md) · [Phase 3: What React/Vue/Svelte Actually Add On Top →](03-what-react-vue-svelte-actually-add-on-top.md)
