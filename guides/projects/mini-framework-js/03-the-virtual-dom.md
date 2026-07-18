---
title: "The Virtual DOM"
guide: "mini-framework-js"
phase: 3
summary: "Represent UI as cheap description objects with an h() function, and write a renderer that turns a tree of them into HTML - React's core idea, built in 30 lines."
tags: [javascript, virtual-dom, vnode, render-function, h-function]
difficulty: intermediate
synonyms: ["build a virtual dom", "what is a vnode", "h function explained", "render function from scratch javascript"]
updated: 2026-07-18
---

# The Virtual DOM

Phases 1-2 built the *when* - knowing the moment data changes. Now the *what*: what should the
screen look like? React's founding idea (which our
[React guide's phase 1](../../frontend/react-from-zero/01-what-react-actually-is.md) described
from the outside) is that UI should be a **description** - a cheap, throwaway JavaScript object -
produced fresh from your data every time. Today you build the describer; phase 4 compares
descriptions; phase 5 connects them to your reactivity engine.

## h(): the element factory

A UI description needs three facts per element: what tag, what attributes, what's inside. So:

```js runnable
function h(type, props, ...children) {
  return { type, props: props || {}, children: children.flat() };
}

// Describe a product card - no DOM involved, this is just data:
const card = h('article', { class: 'card' },
  h('h3', null, 'Kettle'),
  h('p', { class: 'price' }, '19.00 €'),
  h('button', { disabled: false }, 'Add to cart'),
);

console.log(JSON.stringify(card, null, 2));
```

*What just happened:* `h` (the traditional name - "hyperscript") builds a plain object: a
**virtual node**, or *vnode*. Children can be more vnodes or bare strings (text). `...children`
gathers everything after props; `.flat()` lets callers pass arrays (you'll see why in a moment).
The printout is the whole point: **your UI is now data** - inspectable, comparable, cheap to make
and throw away.

📝 **Terminology:** when our React guide said JSX compiles to `createElement` calls returning
"description objects" - this is that, minus the compiler. `<h3>Kettle</h3>` and
`h('h3', null, 'Kettle')` are the same sentence in two spellings.

## Describing dynamically: it's just JavaScript

Because descriptions are built by function calls, all of JavaScript is your template language:

```js runnable
function h(type, props, ...children) {
  return { type, props: props || {}, children: children.flat() };
}

function TodoList({ todos, filter }) {
  const shown = filter === 'all' ? todos : todos.filter(t => !t.done);
  return h('div', { class: 'todos' },
    h('h2', null, `${shown.length} of ${todos.length} tasks`),
    shown.length === 0
      ? h('p', null, 'Nothing here.')                    // conditional: a ternary
      : h('ul', null,
          shown.map(t => h('li', null, t.text)),          // a list: map (hence .flat()!)
        ),
  );
}

const vtree = TodoList({
  todos: [ { text: 'Build h()', done: true }, { text: 'Build render()', done: false } ],
  filter: 'active',
});

console.log(JSON.stringify(vtree, null, 2));
```

*What just happened:* `TodoList` is a **component** - a plain function from data to description,
which is all a component fundamentally is. Conditionals are ternaries, lists are `map` - the
exact idioms our React guide teaches, revealed as ordinary code because that's all they ever
were. The `map` returns an array of vnodes inside the children list - which is why `h` flattens.

## render(): description to HTML

A description is only useful if something realizes it. Browsers realize DOM nodes; for a runnable
console project, we'll realize HTML text - the logic is identical, minus `document.createElement`:

```js runnable
function h(type, props, ...children) {
  return { type, props: props || {}, children: children.flat() };
}

function renderToString(vnode) {
  if (vnode == null || vnode === false) return '';        // skip empty branches
  if (typeof vnode === 'string' || typeof vnode === 'number') return String(vnode);

  const attrs = Object.entries(vnode.props)
    .filter(([, v]) => v !== false && v != null)           // false/null props: omitted
    .map(([k, v]) => (v === true ? ` ${k}` : ` ${k}="${v}"`))
    .join('');

  const inner = vnode.children.map(renderToString).join('');
  return `<${vnode.type}${attrs}>${inner}</${vnode.type}>`;
}

const page = h('main', null,
  h('h1', { class: 'hero' }, 'Mini Framework'),
  h('button', { disabled: true }, 'Ship it'),
  false && h('p', null, 'never rendered'),                 // conditional that's off
);

console.log(renderToString(page));
```

*What just happened:* a recursive walk - strings render as themselves, vnodes render as a tag,
its attributes, and its recursively-rendered children. Notice two framework behaviors emerging
naturally: `false`/`null` children render as nothing (that's why `{cond && <X/>}` works in JSX),
and boolean props render as bare attributes (`disabled`) or vanish (`disabled: false`) - the
attribute-vs-property care our Angular guide's phase 2 made a fuss about, now visible from the
implementing side.

## Your turn

Real renderers must escape text - otherwise user data containing `<` breaks the page (or worse:
injected scripts - this is XSS, the reason React strings are safe by default). Add escaping:

```js runnable
function h(type, props, ...children) {
  return { type, props: props || {}, children: children.flat() };
}

function escapeHtml(s) {
  // YOUR CODE: return s with & < > " replaced by &amp; &lt; &gt; &quot;
  // (order matters: & first, or you'll double-escape the others!)
  return s;
}

function renderToString(vnode) {
  if (vnode == null || vnode === false) return '';
  if (typeof vnode === 'string' || typeof vnode === 'number') return escapeHtml(String(vnode));
  const attrs = Object.entries(vnode.props)
    .filter(([, v]) => v !== false && v != null)
    .map(([k, v]) => (v === true ? ` ${k}` : ` ${k}="${v}"`))
    .join('');
  return `<${vnode.type}${attrs}>${vnode.children.map(renderToString).join('')}</${vnode.type}>`;
}

// A user "typed" this into a comment box:
const evil = h('p', null, '<script>steal(cookies)</script> & fun');
console.log(renderToString(evil));
// Goal: <p>&lt;script&gt;steal(cookies)&lt;/script&gt; &amp; fun</p>
```

## Recap

1. `h(type, props, ...children)` builds vnodes - plain objects describing UI. JSX is this with
   nicer clothes.
2. Components are functions from data to vnode trees; conditionals and lists are just JavaScript.
3. A renderer is a recursive walk realizing descriptions - as HTML here, as DOM nodes in the real
   thing; skipping `false`/`null` is why `&&`-rendering works.
4. Escaping text at render time is why frameworks are XSS-safe by default.
5. Descriptions are cheap and comparable - and comparing two of them is phase 4.

---

[← Phase 2: Effects and Computed](02-effects-and-computed.md) · [Guide overview](_guide.md) · [Phase 4: The Diff →](04-the-diff.md)
