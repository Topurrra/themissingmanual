---
title: "Mutations: Forms and Server Actions"
guide: "nextjs-from-zero"
phase: 5
summary: "A server action is a function marked 'use server' that the framework turns into an endpoint - forms call it directly, revalidatePath refreshes what it changed, and route handlers remain for real HTTP APIs."
tags: [nextjs, server-actions, forms, mutations, revalidatepath, route-handlers]
difficulty: intermediate
synonyms: ["nextjs server actions explained", "use server directive", "nextjs form submission app router", "revalidatepath nextjs", "route handler vs server action"]
updated: 2026-07-18
---

# Mutations: Forms and Server Actions

Reading data was phase 4. Writing it - the form submit, the delete button, the "add to cart" - used
to require building an API route, fetching it from the client, and hand-managing the states in
between. Server actions collapse that: **you write a function, and the framework builds the
endpoint.** It's the feature that looks most like magic and is most worth de-mystifying, because
under the hood it's the plainest thing in Next: a POST request with a name on it.

## What a server action actually is

```tsx
// app/todos/actions.ts
'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function addTodo(formData: FormData) {
  const text = String(formData.get('text') ?? '').trim();
  if (!text) return;                       // validate on the server - the only place it counts
  await db.todos.insert({ text });
  revalidatePath('/todos');                // more on this below
}
```

```tsx
// app/todos/page.tsx - a server component with a form
import { addTodo } from './actions';

export default async function TodosPage() {
  const todos = await db.todos.list();
  return (
    <>
      <form action={addTodo}>
        <input name="text" />
        <button>Add</button>
      </form>
      <ul>{todos.map(t => <li key={t.id}>{t.text}</li>)}</ul>
    </>
  );
}
```

*What just happened:* `'use server'` marks the file's exports as **server actions** - functions that
always execute on the server, no matter where they're called from. When you pass one to a form's
`action`, the framework registers a private endpoint for it; submitting the form POSTs the form data
there, runs your function server-side, and re-renders the page with the result. You wrote zero API
code, zero fetch code, and the database call never left the server.

📝 **Terminology:** this is the one legal way a *function* crosses the server/client boundary from
phase 3 - because what actually crosses is not the function but a **reference** to it, which the
framework resolves back to server code when invoked.

⚠️ **Gotcha:** `'use server'` does not mean "server component" - components are server-rendered *by
default* and need no directive. It means "callable-from-anywhere function that runs on the server."
Two directives, two meanings: `'use client'` marks a bundle boundary; `'use server'` marks remote
callability. And because every server action **is a public HTTP endpoint** (anyone can POST to it),
validation and auth checks belong *inside the action*, every time - the form is a convenience, not a
gate.

## Why this beats the fetch-an-API version

The old shape - `onSubmit` handler, `fetch('/api/todos', ...)`, JSON parsing, then manually
re-fetching the list - had four moving parts to keep aligned. The action version has one function.
And the `<form action={...}>` spelling has a property the fetch version can't offer: it works as a
plain HTML form. JavaScript still loading on a slow connection? Disabled? The form still POSTs and
the action still runs - the enhanced behavior (no page reload, streamed re-render) layers on when
hydration completes.

## revalidatePath: telling the cache what you changed

That `revalidatePath('/todos')` line is doing real work. Next caches rendered pages (the whole
machinery is phase 6), and a mutation makes cached copies *wrong* - you inserted a row, but the
cached `/todos` still shows the old list. `revalidatePath` marks that path's cached data stale so
the next look re-renders it fresh. Its sibling `revalidateTag` invalidates by tag across many pages
at once (tag your fetches with `{ next: { tags: ['todos'] } }`, then `revalidateTag('todos')`).

💡 **Key point:** mutation without revalidation is the source of the "I saved it but the page shows
the old data" class of bug. The reflex to build: every action that writes ends by declaring what it
invalidated.

## Pending state and results: useActionState

Forms need feedback - a disabled button while submitting, an error message when validation fails.
The client-side hook `useActionState` wraps an action with exactly that:

```tsx
'use client';
import { useActionState } from 'react';
import { addTodo } from './actions';       // action returns { error?: string } now

export function AddTodoForm() {
  const [state, formAction, pending] = useActionState(addTodo, { error: undefined });
  return (
    <form action={formAction}>
      <input name="text" />
      <button disabled={pending}>{pending ? 'Adding…' : 'Add'}</button>
      {state.error && <p className="error">{state.error}</p>}
    </form>
  );
}
```

*What just happened:* the hook gives you the action's last return value (`state`), a wrapped action
for the form, and a `pending` boolean during the round-trip. The action itself changes shape
slightly: it receives `(prevState, formData)` and returns the new state - which is how server-side
validation messages travel back to the form without you building a response channel.

## Route handlers: when you actually want an API

Server actions serve *your own UI*. Sometimes you need a real HTTP endpoint - a webhook receiver, a
JSON API for a mobile app, an RSS feed. That's `route.ts` from phase 2's table:

```tsx
// app/api/todos/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const todos = await db.todos.list();
  return NextResponse.json(todos);
}
```

One folder exposes `GET`/`POST`/`PUT`/`DELETE` by exporting functions with those names. The
decision line: **consumed by your own components → server action; consumed by anything else →
route handler.** (A folder can't have both `route.ts` and `page.tsx` - a URL is either a page or an
endpoint.)

## Recap

1. A server action is a `'use server'` function the framework exposes as a private POST endpoint -
   forms call it via `action={fn}`, no API layer written.
2. It's still a public endpoint: validate and authorize inside the action, always.
3. Writes end with `revalidatePath`/`revalidateTag`, or cached pages keep showing pre-mutation data.
4. `useActionState` supplies pending state and carries server validation messages back to the form.
5. Route handlers (`route.ts`) are for external consumers; actions are for your own UI.

```quiz
[
  {
    "q": "A server action skips validation because \"the form already validates in the browser.\" What's wrong with that reasoning?",
    "choices": [
      "Browser validation doesn't run for controlled inputs",
      "The action is an HTTP endpoint anyone can POST to directly, bypassing your form entirely",
      "Server actions can't read FormData without validating it first",
      "Nothing - client validation is sufficient when using form action={}"
    ],
    "answer": 1,
    "why": [
      "Browser validation runs fine on any input - but it runs in a place the attacker controls.",
      null,
      "FormData reads happily without validation - that's precisely the danger.",
      "Client validation is UX, not security, in every architecture - actions included."
    ],
    "explain": "The form is one caller of the endpoint, not the only possible one. curl can invoke your action with anything - the server-side check is the real one."
  },
  {
    "q": "After an action inserts a row, the page still lists the old data until a hard refresh. What's missing?",
    "choices": [
      "An await on the database insert",
      "A revalidatePath (or revalidateTag) call marking the cached page stale",
      "A useEffect to re-fetch after submit",
      "The form needs method=\"POST\""
    ],
    "answer": 1,
    "why": [
      "A missing await would be a race, fixed by luck on fast databases - but the hard-refresh recovery points at caching, not timing.",
      null,
      "Re-fetching client-side patches the symptom for one visitor; the cached server render stays wrong for everyone else.",
      "Actions POST already - the method is handled by the framework."
    ],
    "explain": "Next serves the cached render until told otherwise. Mutations must declare what they invalidated: revalidatePath('/todos') makes the next request re-render fresh."
  }
]
```

---

[← Phase 4: Data on the Server](04-data-on-the-server.md) · [Guide overview](_guide.md) · [Phase 6: Static, Dynamic, and the Cache →](06-static-dynamic-and-the-cache.md)
