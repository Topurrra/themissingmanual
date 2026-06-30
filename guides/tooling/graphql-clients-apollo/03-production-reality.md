---
title: "When the cache lies to you"
guide: graphql-clients-apollo
phase: 3
summary: "Consuming GraphQL from the front end: how Apollo Client's normalized cache, queries, and mutations change data fetching versus REST calls."
tags: [graphql, apollo, frontend, caching, react]
difficulty: intermediate
synonyms: ["apollo client", "graphql client", "apollo cache", "usequery hook", "graphql mutations frontend", "normalized cache", "apollo vs fetch"]
updated: 2026-06-30
---

# When the cache lies to you

Everything good about Apollo comes from the cache, and so does everything that goes wrong. The failures in this phase are not bugs in Apollo - they're the predictable consequences of keeping a second copy of your data in the browser. Once you can name them, they stop being mysteries and become a short checklist.

## The missing id, the silent killer

This is the one that costs people the most hours. Apollo normalizes by `__typename` plus `id`. If a query forgets to select `id`, or a type genuinely has no id, Apollo can't build a cache key - so it stores that object *inside* the query result instead of in the flat table. Normalization silently doesn't happen, and the symptoms look like everything else.

```graphql
query GetUser {
  user(id: "42") {
    name        # no id selected!
    avatarUrl
  }
}
```

*What just happened:* Apollo received a user but had no id to key it on, so it stashed the object under the query rather than as `User:42`. Now a mutation that updates `User:42` elsewhere has nothing to match against here, this view goes stale, and the same user gets duplicated across queries. The fix is boring and absolute: **select `id` in every selection of every normalizable type.** When updates aren't propagating, check for a missing id before you check anything else.

> You can inspect the actual cache with the Apollo Client Devtools browser extension. Open the cache tab and look for entries keyed `User:42` versus objects buried inside `ROOT_QUERY`. The buried ones are your un-normalized data, staring back at you.

## Fetch policies: how much do you trust the cache?

By default `useQuery` uses `cache-first`: if the data is in the cache, use it and skip the network entirely. That's fast, and it's exactly wrong for data that goes stale - a dashboard, an inbox, anything other people change. The lever is `fetchPolicy`.

```jsx
useQuery(GET_INBOX, { fetchPolicy: "cache-and-network" });
```

*What just happened:* `cache-and-network` shows the cached data instantly *and* fires a request to refresh it, updating the view when the response lands. The user sees something immediately and gets fresh data a moment later. The common policies are worth memorizing:

```text
cache-first       cache if present, else network   (default; fast, can be stale)
cache-and-network cache now, network always         (instant + fresh; extra request)
network-only      always network, then cache it     (fresh; no instant paint)
no-cache          always network, never store       (one-off, sensitive data)
```

*What just happened:* each policy is a different answer to "how much do you trust what's already in the cache?" There's no globally correct choice - pick per query based on how fast the underlying data changes. Treating every query as `cache-first` is how you ship a stale UI.

## The refetch storm

`refetchQueries` is the safe, readable way to keep the cache honest after a mutation - but it's also how you accidentally hammer your server. Each named query you list is a fresh network request, and it's tempting to list "everything that might have changed" after every write.

```jsx
useMutation(ADD_TODO, {
  refetchQueries: ["GetTodos", "GetStats", "GetSidebar", "GetActivity"],
});
```

*What just happened:* every time someone adds a todo, four full queries re-run against the server. On a busy screen with several such mutations, you've turned one user action into a flurry of round trips. The fix is the targeted cache update from Phase 2 for hot paths, and reserving `refetchQueries` for the writes where a round trip is genuinely cheaper than hand-written cache surgery. Correctness first, but watch the request count in your network tab.

## Optimistic UI and its rollback

For snappy interactions you can tell Apollo to assume a mutation will succeed and update the cache *before* the server responds, via `optimisticResponse`. The view updates instantly; if the server later rejects the write, Apollo rolls the cache back to where it was.

```jsx
renameUser({
  variables: { id, name: "Grace" },
  optimisticResponse: {
    renameUser: { __typename: "User", id, name: "Grace" },
  },
});
```

*What just happened:* the UI showed "Grace" the instant the button was clicked, before any network round trip. If the mutation succeeds, the real response replaces the optimistic one seamlessly. If it fails, Apollo discards the optimistic write and the old name snaps back. The gotcha: your `optimisticResponse` must include `__typename` and `id`, or Apollo can't apply it to the right entry - the same id discipline as everywhere else.

## The honest tradeoff

Step back and the shape of the deal is clear. REST gives you a simple mental model - a request, a response, state you hold yourself - and makes over- and under-fetching your problem. Apollo solves fetching shape and cross-screen consistency, and hands you a cache to keep honest in return. You traded *"my data is stale because I forgot to refetch"* for *"my cache is wrong because I forgot to update it."* Different failure mode, not zero failure mode.

**For builders:** the teams who stay happy with Apollo treat the cache as a real part of their architecture, not an invisible convenience. They select `id` everywhere, choose fetch policies deliberately, write surgical cache updates on hot paths, and keep the Devtools cache tab open when something looks stale. Do that, and the normalized cache pays for itself many times over. Ignore it, and you'll spend Phase 3's gotchas in production instead of in this guide.

```quiz
[
  {
    "q": "Updates from a mutation aren't showing up in one component. What should you check first?",
    "choices": [
      "Whether the server is down",
      "Whether that component's query selected the entity's id",
      "Whether React is installed correctly",
      "Whether the network is offline"
    ],
    "answer": 1,
    "explain": "A missing id means Apollo can't normalize the object, so it never matches the cache entry a mutation updates. Check for id first."
  },
  {
    "q": "Which fetch policy shows cached data immediately and also fetches fresh data from the network?",
    "choices": [
      "cache-first",
      "no-cache",
      "cache-and-network",
      "network-only"
    ],
    "answer": 2,
    "explain": "cache-and-network paints from the cache instantly and fires a request to refresh, updating when it returns - instant plus fresh, at the cost of an extra request."
  },
  {
    "q": "What is the risk of listing many queries in refetchQueries after every mutation?",
    "choices": [
      "It disables the normalized cache permanently",
      "Each listed query is a fresh network request, so writes can trigger a storm of round trips",
      "It deletes the cache entries it refetches",
      "It converts the mutation into a query"
    ],
    "answer": 1,
    "explain": "refetchQueries re-runs each named query against the server. Listing many on hot mutations multiplies network traffic; use targeted cache updates instead."
  }
]
```

[← Phase 2: Queries and mutations in real components](02-queries-and-mutations.md) · [Overview](_guide.md)
