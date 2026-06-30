---
title: "Queries and mutations in real components"
guide: graphql-clients-apollo
phase: 2
summary: "Consuming GraphQL from the front end: how Apollo Client's normalized cache, queries, and mutations change data fetching versus REST calls."
tags: [graphql, apollo, frontend, caching, react]
difficulty: intermediate
synonyms: ["apollo client", "graphql client", "apollo cache", "usequery hook", "graphql mutations frontend", "normalized cache", "apollo vs fetch"]
updated: 2026-06-30
---

# Queries and mutations in real components

Phase 1 was the model. Now the daily work. In practice you spend your time in three places: reading data with a query hook, changing it with a mutation hook, and reusing field selections with fragments. The thing that ties them together is still the cache - every one of these tools is really about reading from or writing to it.

## Reading with useQuery

The `useQuery` hook is your default for "this screen needs this data." You give it a query, it gives you back three things you'll use constantly: `loading`, `error`, and `data`.

```jsx
const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      name
      avatarUrl
    }
  }
`;

function Profile({ id }) {
  const { loading, error, data } = useQuery(GET_USER, {
    variables: { id },
  });

  if (loading) return <Spinner />;
  if (error) return <ErrorBox error={error} />;
  return <h1>{data.user.name}</h1>;
}
```

*What just happened:* on first render `loading` is `true` and Apollo fires the request. When it resolves, the result lands in the normalized cache and the hook re-renders with `data` filled in. Mount this same component again with the same `id` and `loading` may never flip to `true` at all - the cache already has `User:42`, so it serves instantly. That "instant on the second visit" is the cache working, not magic.

Notice what you did *not* write: no `useState` for the result, no `useEffect` to fetch, no manual cleanup. In a REST app you'd hand-roll all three. Here the hook owns the lifecycle and the cache owns the data.

## Writing with useMutation

Mutations change server data. The hook hands you a function to call and the same status fields for the in-flight write.

```jsx
const RENAME_USER = gql`
  mutation RenameUser($id: ID!, $name: String!) {
    renameUser(id: $id, name: $name) {
      id
      name
    }
  }
`;

function RenameButton({ id }) {
  const [renameUser, { loading }] = useMutation(RENAME_USER);

  return (
    <button
      disabled={loading}
      onClick={() => renameUser({ variables: { id, name: "Grace" } })}
    >
      Rename
    </button>
  );
}
```

*What just happened:* clicking sends the mutation. The server responds with the updated user, and because that response includes `id` and the changed field, Apollo writes it straight back into `User:42`. Every component reading that user - the header, a sidebar, a list row - re-renders with the new name. You wrote zero update logic, and the whole app stayed consistent.

That automatic write-back is the happy path, and it only works because you asked the mutation to **return the changed entity with its id**. Drop the `id` from the selection and Apollo can't match it to a cache entry, so nothing updates. Returning the fields you changed, with the id, is the single most important mutation habit.

## When the cache can't update itself

Apollo updates the cache for free in exactly one case: a mutation that modifies an **existing** entity and returns it. It cannot guess for the two cases it has no way to reason about - **adding** to a list and **removing** from one. There's no rule that says "a new comment belongs in *that* query's results," so you have to tell it.

The clean tool for adding is the mutation's `update` function, which hands you the cache and the mutation result.

```jsx
const ADD_COMMENT = gql`
  mutation AddComment($postId: ID!, $text: String!) {
    addComment(postId: $postId, text: $text) {
      id
      text
    }
  }
`;

useMutation(ADD_COMMENT, {
  update(cache, { data: { addComment } }) {
    cache.modify({
      id: cache.identify({ __typename: "Post", id: postId }),
      fields: {
        comments(existing = []) {
          const ref = cache.writeFragment({
            data: addComment,
            fragment: gql`fragment NewComment on Comment { id text }`,
          });
          return [...existing, ref];
        },
      },
    });
  },
});
```

*What just happened:* after the comment is created, the `update` function reaches into the post's `comments` field and appends a reference to the new comment. `cache.modify` targets one field on one entity; `writeFragment` puts the new object into the cache and hands back a reference to it. The list re-renders with the new row, no refetch required.

For a delete, the symmetric move is `cache.evict` to drop the entity, then `cache.gc()` to clean up references. The principle holds: **structural changes to lists are yours to make; in-place field edits are Apollo's.**

> If hand-writing cache updates feels heavy for a given mutation, the escape hatch is `refetchQueries` - name the queries to re-run after the write and let the server be the source of truth. It costs a round trip, but it's correct and readable. Reach for surgical cache updates only where the extra request actually hurts.

## Fragments: stop repeating field lists

Once several components read the same entity, they tend to ask for the same fields. A **fragment** is a named, reusable selection you drop into multiple queries.

```graphql
fragment UserCard on User {
  id
  name
  avatarUrl
}

query GetTeam {
  team {
    id
    members {
      ...UserCard
    }
  }
}
```

*What just happened:* `UserCard` defines the fields a user card needs once, and any query spreads it with `...UserCard`. Beyond saving typing, fragments keep a component's data needs next to the component itself - the card declares what it reads, and every query that renders a card pulls in exactly those fields. It also keeps cache entries consistent: when many queries select the same fields via one fragment, they all fill the same slots on `User:42`.

**In the wild:** teams co-locate a fragment with the component that uses it, then compose page-level queries out of those fragments. The page query becomes a list of `...ComponentFragment` spreads, and each component owns its own data contract. It's the GraphQL equivalent of a component declaring its props.

```quiz
[
  {
    "q": "After a mutation that edits an existing entity, why does Apollo update all views automatically?",
    "choices": [
      "It re-runs every active query on the page",
      "The response includes the entity's id, so Apollo writes the fields back to that cache entry",
      "It polls the server until the data matches",
      "It clears the entire cache and refetches"
    ],
    "answer": 1,
    "explain": "When a mutation returns the changed entity with its id, Apollo merges it into the matching cache entry, and every subscriber re-renders."
  },
  {
    "q": "Which change does Apollo NOT handle automatically after a mutation?",
    "choices": [
      "Updating a field on an existing entity that the mutation returned",
      "Adding a new item to a list or removing one from it",
      "Re-rendering components that read a changed entity",
      "Storing the returned entity under its type and id"
    ],
    "answer": 1,
    "explain": "Apollo can't know which lists a new or deleted item belongs to, so adds and removes need an update function (or refetchQueries)."
  },
  {
    "q": "What is the main purpose of a GraphQL fragment in an Apollo app?",
    "choices": [
      "To split a query across multiple network requests",
      "To define a reusable, named set of fields that components share",
      "To disable the normalized cache for certain fields",
      "To convert a query into a mutation"
    ],
    "answer": 1,
    "explain": "A fragment is a named selection of fields, letting components declare their data needs and share consistent selections across queries."
  }
]
```

[← Phase 1: The cache is the point](01-the-cache-is-the-point.md) · [Overview](_guide.md) · [Phase 3: When the cache lies to you →](03-production-reality.md)
