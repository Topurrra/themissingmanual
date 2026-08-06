---
title: "Why BFS Isn't Enough for Weighted Graphs"
guide: "dijkstra-shortest-path"
phase: 1
summary: "BFS finds the shortest path by counting hops, which is exactly wrong once edges carry weights - a one-hop road of weight 10 beats a two-hop route of weight 2. This phase shows that failure concretely and names the greedy fix: always expand the closest unvisited node."
tags: [algorithms, dijkstra, bfs, weighted-graphs, shortest-path, greedy]
difficulty: beginner
synonyms: ["why does bfs fail on weighted graphs", "bfs vs dijkstra", "shortest path weighted graph", "greedy shortest path idea", "dijkstra intuition"]
updated: 2026-08-06
---

# Why BFS Isn't Enough for Weighted Graphs

Breadth-first search finds the shortest path in an unweighted graph by exploring outward one hop at a time -
the first time it reaches a node, it got there by the fewest edges. (If that is new, the
[graph theory guide](/guides/graph-theory-whats-connected-to-what/2) walks through BFS first.) That guarantee
quietly depends on one assumption: every edge costs the same. Break that assumption and BFS breaks with it.

## Where "fewest hops" goes wrong

Picture three intersections. From `A` you can take a direct road to `C` that is long (weight 10), or a short
hop to `B` (weight 1) and another short hop from `B` to `C` (weight 1). The direct road is one hop; the
detour is two. BFS counts hops, so it happily reports the one-hop road - the *longer* route.

```python runnable
from collections import deque

# weighted graph: node -> list of (neighbor, weight)
graph = {
    "A": [("B", 1), ("C", 10)],
    "B": [("C", 1)],
    "C": [],
}

def bfs_fewest_hops(graph, start, target):
    queue = deque([[start]])
    visited = {start}
    while queue:
        path = queue.popleft()
        node = path[-1]
        if node == target:
            return path
        for neighbor, _weight in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(path + [neighbor])
    return None

def path_weight(graph, path):
    total = 0
    for a, b in zip(path, path[1:]):
        for neighbor, weight in graph[a]:
            if neighbor == b:
                total += weight
    return total

path = bfs_fewest_hops(graph, "A", "C")
print("BFS route:", path, "with total weight", path_weight(graph, path))
```
```console
BFS route: ['A', 'C'] with total weight 10
```
*What just happened:* BFS returned `A -> C`, one hop, and threw the weights away entirely. Its actual cost is
10, while the two-hop route `A -> B -> C` costs only `1 + 1 = 2`. BFS is not buggy - it is answering "fewest
edges," which is simply the wrong question once edges have different costs.

📝 **Terminology.** A **weighted graph** attaches a number - a *weight* or *cost* - to each edge: distance,
travel time, price, whatever you are minimizing. The **shortest path** is the route with the smallest total
weight, not the fewest edges.

## The greedy idea that fixes it

Dijkstra keeps a running best-known distance to every node, all starting at infinity except the start, which
is 0. Then it repeats one move:

> Of all the nodes you have not finalized yet, take the one with the smallest known distance. Finalize it, and
> use its edges to try to improve its neighbors' distances.

The magic is in *why finalizing is safe*. When you pull out the unvisited node with the smallest tentative
distance, no other route to it can be shorter - any alternative would have to pass through some other
unvisited node that is already *farther* away, so it could only add cost. That is the key insight, and it is
exactly the assumption a negative edge would violate (phase 3).

```
Start: distance to A is 0, everything else is infinity.
Expand the closest unvisited node. Relax its edges (lower a neighbor's distance if you found a cheaper route).
Repeat, always taking the closest unfinalized node, until every reachable node is finalized.
```

💡 **Key point.** BFS also "expands the closest node" - but when every edge weight is 1, "closest" and
"fewest hops" are the same thing, which is exactly why BFS is just Dijkstra on an unweighted graph. Dijkstra
generalizes BFS from counting hops to summing weights.

Walk the earlier graph by hand: `A` is closest (0), so finalize it and set `B` to 1 and `C` to 10. Now the
closest unfinalized node is `B` at 1; finalize it, and its edge to `C` offers `1 + 1 = 2`, which beats 10, so
`C` drops to 2. Finalize `C` at 2. The detour wins, exactly as it should. Phase 2 makes this loop into code.

## Check yourself

```quiz
[
  {
    "q": "Why can BFS return the wrong route once edges have weights?",
    "choices": ["BFS cannot run on weighted graphs at all", "BFS counts hops, so it can pick a one-hop road of weight 10 over a two-hop route of weight 2", "BFS always returns the longest path", "Weights make BFS loop forever"],
    "answer": 1,
    "explain": "BFS minimizes the number of edges, not the total weight. When a single long edge beats a multi-edge shortcut on hop count, BFS chooses it despite the higher cost."
  },
  {
    "q": "On each step, which node does Dijkstra expand next?",
    "choices": ["A random unvisited node", "The unvisited node with the smallest known distance from the start", "The node with the most neighbors", "The target node first"],
    "answer": 1,
    "explain": "Dijkstra is greedy on distance: it always finalizes the closest unvisited node, because no shorter route to it can exist through the still-farther nodes."
  },
  {
    "q": "When every edge weight is 1, how does Dijkstra behave?",
    "choices": ["Like DFS", "Like BFS", "Like a random walk", "Like binary search"],
    "answer": 1,
    "explain": "With equal weights, 'closest unvisited node' is identical to 'fewest hops', which is exactly what BFS computes. Dijkstra is the weighted generalization of BFS."
  }
]
```
