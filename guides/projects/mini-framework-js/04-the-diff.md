---
title: "The Diff"
guide: "mini-framework-js"
phase: 4
summary: "Compare two vnode trees and emit the minimal patch list - then break positional matching with a reordered list and fix it with keys, finally seeing why every framework demands them."
tags: [javascript, diff, reconciliation, keys, virtual-dom]
difficulty: intermediate
synonyms: ["virtual dom diff algorithm", "how reconciliation works", "why react needs keys", "diff two trees javascript"]
updated: 2026-07-18
---

# The Diff

You can now produce a fresh description of the whole UI after every change. Realizing the whole
description every time would work - and throw away every input's text, every scroll position,
every video's playback, while doing a page worth of work for a one-word change. The fix is the
algorithm at the heart of React and Vue: **compare the new description to the old one, and change
only what differs.** Today you write it - and personally trigger the bug that made every
framework demand keys.

## diff(): the recursive compare

Our diff walks two vnode trees and emits *patch operations* - console-friendly descriptions of
what a real renderer would do to the DOM:

```js runnable
function h(type, props, ...children) {
  return { type, props: props || {}, children: children.flat() };
}

function diff(oldNode, newNode, path = 'root') {
  const patches = [];

  // 1. Something vs nothing:
  if (oldNode == null) { patches.push(`CREATE ${path}: ${describe(newNode)}`); return patches; }
  if (newNode == null) { patches.push(`REMOVE ${path}: ${describe(oldNode)}`); return patches; }

  // 2. Text nodes: compare content.
  const oldIsText = typeof oldNode !== 'object';
  const newIsText = typeof newNode !== 'object';
  if (oldIsText || newIsText) {
    if (oldNode !== newNode) patches.push(`TEXT   ${path}: "${oldNode}" -> "${newNode}"`);
    return patches;
  }

  // 3. Different tag entirely: no way to patch - replace the subtree.
  if (oldNode.type !== newNode.type) {
    patches.push(`REPLACE ${path}: <${oldNode.type}> -> <${newNode.type}>`);
    return patches;
  }

  // 4. Same tag: compare props...
  const keys = new Set([...Object.keys(oldNode.props), ...Object.keys(newNode.props)]);
  for (const k of keys) {
    if (oldNode.props[k] !== newNode.props[k]) {
      patches.push(`PROP   ${path}: ${k}: ${oldNode.props[k]} -> ${newNode.props[k]}`);
    }
  }

  // 5. ...and recurse into children, matched BY POSITION (remember this!).
  const len = Math.max(oldNode.children.length, newNode.children.length);
  for (let i = 0; i < len; i++) {
    patches.push(...diff(oldNode.children[i], newNode.children[i], `${path}/${newNode?.type}[${i}]`));
  }
  return patches;
}

function describe(n) { return typeof n === 'object' && n ? `<${n.type}>` : `"${n}"`; }

// --- a small change between two renders ---
const before = h('main', null,
  h('h1', null, 'Cart (2)'),
  h('button', { disabled: false }, 'Checkout'),
);
const after = h('main', null,
  h('h1', null, 'Cart (3)'),
  h('button', { disabled: false }, 'Checkout'),
);

diff(before, after).forEach(p => console.log(p));
```

*What just happened:* one text patch. The whole page was re-*described*, but the diff found that
only the heading's text differs - the button, its props, everything else produced zero
operations. That's the virtual DOM bargain in one console line: describe everything, touch
almost nothing. The rules you implemented - text compare, type mismatch = replace subtree, same
type = patch props and recurse - are React's reconciliation heuristics, straight from their
docs, in your handwriting.

## Now break it

Step 5 matched children *by position* - old[0] vs new[0]. Watch what that does to a reordered
list. Same `diff` (compact), a list that moves its first item to the end:

```js runnable
function h(t, p, ...c) { return { type: t, props: p || {}, children: c.flat() }; }
function describe(n) { return typeof n === 'object' && n ? `<${n.type}>` : `"${n}"`; }
function diff(o, n, path = 'root') {
  const P = [];
  if (o == null) { P.push(`CREATE ${path}: ${describe(n)}`); return P; }
  if (n == null) { P.push(`REMOVE ${path}: ${describe(o)}`); return P; }
  if (typeof o !== 'object' || typeof n !== 'object') { if (o !== n) P.push(`TEXT   ${path}: "${o}" -> "${n}"`); return P; }
  if (o.type !== n.type) { P.push(`REPLACE ${path}`); return P; }
  const keys = new Set([...Object.keys(o.props), ...Object.keys(n.props)]);
  for (const k of keys) if (o.props[k] !== n.props[k]) P.push(`PROP   ${path}: ${k}`);
  const len = Math.max(o.children.length, n.children.length);
  for (let i = 0; i < len; i++) P.push(...diff(o.children[i], n.children[i], `${path}[${i}]`));
  return P;
}

const before = h('ul', null,
  h('li', null, 'Buy milk'),
  h('li', null, 'Walk dog'),
  h('li', null, 'Call mom'),
);
// The user "moved" Buy milk to the bottom - same three items, one moved:
const after = h('ul', null,
  h('li', null, 'Walk dog'),
  h('li', null, 'Call mom'),
  h('li', null, 'Buy milk'),
);

diff(before, after).forEach(p => console.log(p));
console.log('\nOne item moved. Patches emitted:', diff(before, after).length);
```

*What just happened:* **three** text rewrites for a single move. Position-matching decided
"item 0 changed its text from Buy milk to Walk dog" and so on down the list - it rewrote *every
row's contents* instead of moving one node. In a real DOM those rewrites destroy whatever lived
in those rows: input text, checkbox state, focus. This is - exactly, mechanically - the
index-key corruption bug from our
[React guide's phase 4](../../frontend/react-from-zero/04-lists-keys-and-conditional-rendering.md)
(and Vue's, and Svelte's, and Angular's `track` rule). You've now caused it from the inside.

## Your turn: fix it with keys

Give the differ identity to match by, instead of position. Add key support to the child loop:

```js runnable
function h(t, p, ...c) { return { type: t, props: p || {}, children: c.flat() }; }
function diffChildren(oldChildren, newChildren) {
  const patches = [];
  // YOUR CODE: match children by props.key instead of position.
  // Plan:
  //  1. Build a Map from key -> old child (for old children that have props.key).
  //  2. For each new child: if its key exists in the map at a DIFFERENT index -> "MOVE key=<k>".
  //     If the key isn't in the map -> "CREATE key=<k>".
  //  3. Any old key absent from the new children -> "REMOVE key=<k>".
  // (Ignore non-keyed children in this exercise.)
  return patches;
}

const before = [ h('li', { key: 'milk' }, 'Buy milk'), h('li', { key: 'dog' }, 'Walk dog'), h('li', { key: 'mom' }, 'Call mom') ];
const after  = [ h('li', { key: 'dog' }, 'Walk dog'), h('li', { key: 'mom' }, 'Call mom'), h('li', { key: 'milk' }, 'Buy milk') ];

diffChildren(before, after).forEach(p => console.log(p));
// Goal: exactly one MOVE (milk) - and zero rewrites. That's what keys buy.
```

When your version prints a single `MOVE key=milk`, you've written the reason every framework
demands stable keys: identity turns "rewrite three rows" into "move one node." (Real frameworks'
keyed algorithms also minimize *which* moves - longest-increasing-subsequence tricks - but the
identity insight is the whole foundation.)

## Recap

1. The diff: null checks, text compare, different type = replace, same type = patch props +
   recurse into children.
2. One data change → one patch, even though the whole tree was re-described. That's the bargain.
3. Positional child matching turns a reorder into a cascade of rewrites - you triggered the
   famous keys bug deliberately.
4. Keys give the differ identity: match by key, and a move is a move.
5. Everything our framework guides said about reconciliation and keys, you have now implemented.

---

[← Phase 3: The Virtual DOM](03-the-virtual-dom.md) · [Guide overview](_guide.md) · [Phase 5: Wiring It Together →](05-wiring-it-together.md)
