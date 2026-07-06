---
title: "A Virtual DOM From Scratch"
guide: "building-your-own-mini-framework"
phase: 1
summary: "Build a real diff() and patch() pair that compares two plain-object trees and updates only the DOM nodes that changed - the core trick behind every virtual-DOM framework."
tags: [javascript, virtual-dom, diffing, frameworks, web-fundamentals]
difficulty: advanced
synonyms: ["how does virtual dom diffing work", "build a virtual dom", "what is a diff algorithm", "why not touch the real dom directly"]
updated: 2026-07-06
---

# A Virtual DOM From Scratch

Here's the naive way to render a counter that ticks every second:

```js
function render(count) {
  document.getElementById("app").innerHTML = `<div>Count: ${count}</div>`;
}
setInterval(() => render(count++), 1000);
```

That works, and it's wrong for reasons you don't feel until the page gets bigger. `innerHTML` on a whole container tears down every node inside it and rebuilds them - event listeners you attached get silently dropped, an `<input>` the user was typing into loses focus and its cursor position, and a browser has to re-run layout and paint for the entire subtree instead of one text node. Real DOM writes go through style recalculation and layout - operations a browser tries hard to batch and skip, but only if you give it small, targeted changes instead of "throw everything away and start over."

Frameworks solve this by never handing the DOM a wholesale replacement. Instead they keep a lightweight description of what the UI *should* look like, compare it to the previous description, and touch only the real nodes that differ. That lightweight description is the "virtual DOM" - and it's less exotic than the name suggests.

## The tree as plain objects

A virtual DOM node is a plain JavaScript object with a tag, some props, and children:

```js
function h(tag, props, ...children) {
  return { tag, props: props || {}, children };
}
```

`h` (short for "hyperscript," the name React and Vue both use internally) just builds a tree:

```js
const view = h("div", { class: "card" },
  h("h2", null, "Count: 3"),
  h("button", null, "+1")
);
```

That's it - no DOM involved yet. It's data: an object you can compare, log, and diff without touching the browser at all.

## Rendering a tree for the first time

Before diffing two trees, you need a way to turn one tree into real nodes:

```js
function createEl(vnode) {
  if (typeof vnode === "string") return document.createTextNode(vnode);

  const el = document.createElement(vnode.tag);
  for (const [key, value] of Object.entries(vnode.props)) {
    el.setAttribute(key, value);
  }
  vnode.children.forEach(child => el.appendChild(createEl(child)));
  return el;
}
```

This runs once, on first render. From then on, you never call it again for the whole tree - only `diff` and `patch` touch the DOM.

## Comparing two trees

`diff()` takes an old vnode and a new vnode and returns a list of changes - it does not touch the DOM itself:

```js
function diff(oldNode, newNode) {
  if (oldNode === undefined) return { type: "CREATE", newNode };
  if (newNode === undefined) return { type: "REMOVE" };
  if (changed(oldNode, newNode)) return { type: "REPLACE", newNode };
  if (typeof newNode === "string") return { type: "NONE" };

  const childPatches = [];
  const len = Math.max(oldNode.children.length, newNode.children.length);
  for (let i = 0; i < len; i++) {
    childPatches.push(diff(oldNode.children[i], newNode.children[i]));
  }
  return { type: "UPDATE", props: diffProps(oldNode.props, newNode.props), childPatches };
}

function changed(a, b) {
  if (typeof a !== typeof b) return true;
  if (typeof a === "string") return a !== b;
  return a.tag !== b.tag;
}

function diffProps(oldProps, newProps) {
  const patches = [];
  for (const key in newProps) {
    if (oldProps[key] !== newProps[key]) patches.push({ key, value: newProps[key] });
  }
  for (const key in oldProps) {
    if (!(key in newProps)) patches.push({ key, value: null });
  }
  return patches;
}
```

Four outcomes, and that covers the whole tree: a node is new (`CREATE`), gone (`REMOVE`), swapped for something of a different type (`REPLACE`), or the same element with possibly different props and children (`UPDATE`, recursing into each child by position).

## Applying the changes

`patch()` walks the real DOM alongside the patch tree and makes the minimum edits:

```js
function patch(parent, patches, index = 0) {
  if (!patches) return;
  const el = parent.childNodes[index];

  switch (patches.type) {
    case "CREATE":
      parent.appendChild(createEl(patches.newNode));
      break;
    case "REMOVE":
      parent.removeChild(el);
      break;
    case "REPLACE":
      parent.replaceChild(createEl(patches.newNode), el);
      break;
    case "UPDATE":
      patches.props.forEach(({ key, value }) => {
        if (value === null) el.removeAttribute(key);
        else el.setAttribute(key, value);
      });
      patches.childPatches.forEach((childPatch, i) => patch(el, childPatch, i));
      break;
  }
}
```

Wire it together and the counter from the top of this phase becomes:

```js
let oldTree = h("div", null, h("span", null, "Count: 0"));
const root = document.getElementById("app");
root.appendChild(createEl(oldTree));

function update(count) {
  const newTree = h("div", null, h("span", null, `Count: ${count}`));
  patch(root, diff(oldTree, newTree));
  oldTree = newTree;
}
```

Only the text node inside `<span>` changes on the real DOM. The `<div>` and `<span>` elements themselves are never touched, so their attributes, any listeners attached directly to them, and focus state all survive. That's the entire trick: describe the UI as data, compare two descriptions, apply only the difference.

Check your understanding of why this beats direct DOM writes.

```quiz
[
  {
    "q": "Why does replacing a container's innerHTML on every update cause problems?",
    "choices": [
      "It's slower to type than querySelector",
      "It destroys and recreates every node inside, dropping listeners and focus state",
      "innerHTML doesn't work with CSS classes"
    ],
    "answer": 1,
    "explain": "Every element inside is torn down and rebuilt, even ones that didn't change."
  },
  {
    "q": "In the diff() function, what does an UPDATE patch mean?",
    "choices": [
      "The node type changed and needs full replacement",
      "The node was removed",
      "Same tag, but props and/or children may differ - recurse into children"
    ],
    "answer": 2
  },
  {
    "q": "Where does createEl() get called after the initial render?",
    "choices": [
      "Every time update() runs",
      "Only for CREATE and REPLACE patches, to build the specific new node needed",
      "Never again"
    ],
    "answer": 1,
    "explain": "UPDATE patches reuse the existing element and only touch its attributes/children."
  }
]
```

---

[Guide overview](_guide.md) · [Phase 2: Reactivity Without Magic →](02-reactivity-without-magic.md)
