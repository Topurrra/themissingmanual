---
title: "Events and Forms"
guide: "react-from-zero"
phase: 5
summary: "Pass functions (not calls) to onClick, and make inputs controlled - value from state, onChange into state - so the form's data lives where the rest of your logic can use it."
tags: [react, events, forms, controlled-components, onchange]
difficulty: beginner
synonyms: ["react onclick not working", "controlled vs uncontrolled inputs", "react form handling", "react onchange input", "why does my react function run on render"]
updated: 2026-07-18
---

# Events and Forms

Events are where your app stops being a picture and starts being software. React's event handling is
deliberately close to the DOM's - `onClick`, `onChange`, `onSubmit` - so there's little new to learn.
But two spots reliably burn newcomers: passing a function *call* instead of a function, and the
controlled-input pattern. Both get named and defused here.

## Handlers: pass the function, don't call it

```jsx
function DeleteButton({ onDelete, itemId }) {
  return (
    <>
      <button onClick={onDelete}>Delete</button>                {/* ✓ pass the function */}
      <button onClick={() => onDelete(itemId)}>Delete</button>  {/* ✓ pass a function that calls it */}
      <button onClick={onDelete(itemId)}>Delete</button>        {/* ✗ calls it DURING render */}
    </>
  );
}
```

The third line is the classic. `onDelete(itemId)` isn't "wired up to run on click" - it's plain
JavaScript, evaluated *while the component renders*. The item deletes itself the moment it appears,
and `onClick` receives the function's return value (probably `undefined`). When the handler needs an
argument, wrap it in an arrow function: the arrow is what gets called on click.

⚠️ **Gotcha:** the same mistake with a state setter is worse: `onClick={setCount(count + 1)}` calls
the setter during render, which triggers a re-render, which calls it again, forever. That's the
"Too many re-renders" error - phase 8 covers the message, but the cause lives here.

React hands your handler an event object, and one method earns daily use: `preventDefault`. The
browser's default for a form submit is a full page reload - the one thing a React app never wants:

```jsx
function handleSubmit(e) {
  e.preventDefault(); // forget this and every submit reloads the page
  // ...do the actual work
}
```

## The controlled input

Here's the pattern that makes React forms click. An `<input>` is a strange beast: it has its *own*
built-in state - the browser tracks what's typed with no help from you. So when you build a form in
React, there are suddenly two places the truth could live: the DOM's memory, or your state. The
controlled pattern picks one:

💡 **Key point:** a **controlled input** takes its `value` from state and reports every keystroke
into state via `onChange`. React state becomes the single source of truth; the input displays it.

```jsx
function SignupForm() {
  const [email, setEmail] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    console.log('signing up:', email); // the value is right here in state - no DOM digging
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <button disabled={!email.includes('@')}>Sign up</button>
    </form>
  );
}
```

*What just happened:* each keystroke fires `onChange`; `setEmail` stores the new text; the re-render
feeds it back as `value`. The payoff is that last line: the submit button's disabled state is
*derived* from the same state the input writes to. Live validation, character counters, dependent
fields - they all become one-liners because the data is already where your logic is, on every
keystroke, not just at submit time.

⚠️ **Gotcha:** set `value` without `onChange` and the input **freezes** - state never changes, so
every render shows the same text, and typing appears to do nothing (React also warns in the console).
The half-fix `onChange={setEmail}` freezes it more quietly: `onChange` receives the *event object*,
not the text, so you've stored an event in state. It's `e => setEmail(e.target.value)`.

📝 **Terminology:** the alternative - leaving the input's state in the DOM and reading it only when
you need it - is an **uncontrolled** input. It's legitimate for fire-and-forget forms where nothing
reacts to the value until submit. But every "the button should enable when...", "show the error
as they type..." requirement pushes you controlled, which is why controlled is the default habit
worth building.

Checkboxes are the one syntax variation: the boolean lives on `checked`, not `value` -
`<input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} />`.

## A real form, whole

The pattern scaled to a form with two fields and a select, sharing one state object (the
copy-don't-mutate move from phase 3):

```jsx
function ProfileForm({ onSave }) {
  const [form, setForm] = useState({ name: '', role: 'dev' });

  function update(field) {
    return e => setForm({ ...form, [field]: e.target.value });
  }

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }}>
      <input value={form.name} onChange={update('name')} placeholder="Name" />
      <select value={form.role} onChange={update('role')}>
        <option value="dev">Developer</option>
        <option value="designer">Designer</option>
      </select>
      <button disabled={!form.name.trim()}>Save</button>
    </form>
  );
}
```

*What just happened:* `update('name')` returns a handler for that field; each handler copies the
form object and overwrites its own key. One state object, one submit handler that already has
everything, and the events-up rule from phase 2: the form doesn't know what saving means - it calls
`onSave` and lets the parent decide.

## Recap

1. `onClick={fn}` or `onClick={() => fn(arg)}` - never `onClick={fn(arg)}`, which runs during render.
2. `e.preventDefault()` in submit handlers, or the browser reloads the page.
3. Controlled input: `value` from state, `onChange` into state - one source of truth, and validation
   becomes derived data.
4. `value` without a working `onChange` = frozen input. Checkboxes use `checked`.
5. Forms report upward: collect in state, hand the result to a callback prop.

```quiz
[
  {
    "q": "A button is written as onClick={deleteItem(item.id)} and the item vanishes as soon as the page loads. Why?",
    "choices": [
      "The click event fired automatically when the button mounted",
      "deleteItem(item.id) is evaluated during render, so the delete runs immediately",
      "item.id was undefined, which deletes everything",
      "React batched the click with the initial render"
    ],
    "answer": 1,
    "why": [
      "No click happened - mounting never fires click events; the call happened in plain JavaScript before any event existed.",
      null,
      "An undefined id would make the delete miss, not fire early - the timing is the clue, not the argument.",
      "Batching groups state updates; it cannot invent a click."
    ],
    "explain": "JSX braces hold ordinary expressions. deleteItem(item.id) calls the function right there during render; onClick={() => deleteItem(item.id)} passes a function to call later."
  },
  {
    "q": "You set value={text} on an input but typing does nothing. What's missing?",
    "choices": [
      "A name attribute so the browser can track the field",
      "An onChange handler that writes e.target.value into state",
      "A key prop to preserve the input between renders",
      "defaultValue instead of value"
    ],
    "answer": 1,
    "why": [
      "name matters for browser autofill and form submission payloads - it has no effect on typing into a controlled input.",
      null,
      "Keys identify list siblings; a single input doesn't need one and it wouldn't unfreeze typing.",
      "defaultValue would technically make typing work - by making the input uncontrolled, which abandons the pattern rather than completing it."
    ],
    "explain": "A controlled input displays state. If keystrokes never reach state via onChange, every render shows the same value and the input appears frozen."
  }
]
```

---

[← Phase 4: Lists, Keys, and Conditional Rendering](04-lists-keys-and-conditional-rendering.md) · [Guide overview](_guide.md) · [Phase 6: Effects →](06-effects.md)
