---
title: "Finding the Shortest Path and Detecting Cycles"
guide: "graph-theory-whats-connected-to-what"
phase: 2
summary: "Once you can draw a graph, the natural questions are: what is the shortest route from A to B, and does this graph loop back on itself? This phase covers BFS, DFS, Dijkstra's algorithm, and the cycle detection that saves package managers from infinite loops."
tags: [mathematics, graph-theory, BFS, DFS, Dijkstra, shortest-path, cycles, beginner-friendly]
difficulty: beginner
synonyms: ["shortest path algorithm", "BFS vs DFS", "Dijkstra explained", "cycle detection", "topological sort", "minimum spanning tree"]
updated: 2026-06-28
---

# Finding the Shortest Path and Detecting Cycles

## The question a GPS asks every second

You open a map app. You type "cafe" and your current location. The app draws a line from your position to the nearest coffee shop. That line is the **shortest path** - the route with the smallest total weight, where weight might be distance, time, or traffic.

Finding that path is one of the most common graph problems in computing. The algorithm that solves it is called **Dijkstra's algorithm**, and it is one of the most useful pieces of applied mathematics ever written.

But before we reach Dijkstra, we need two simpler ways to walk through a graph: BFS and DFS.

## BFS: spreading out in circles

**Breadth-first search** (BFS) explores a graph by visiting all the neighbors of a node before moving on to the neighbors of those neighbors. It spreads out like a ripple in a pond.

If you are one degree of separation from everyone in your network, BFS will find them in the first round. If you are two degrees away, BFS will find them in the second round. It finds the shortest path in an unweighted graph because it explores all paths of length 1, then all paths of length 2, and so on. The first time it reaches a node, it has done so by the shortest possible route.

## DFS: following one path as far as it goes

**Depth-first search** (DFS) goes the opposite direction. It picks a neighbor and follows it as far as it can, backtracking only when it hits a dead end. It is a systematic way of exploring every possible path, but it does not guarantee the shortest path.

DFS is useful when you want to know "is there any path at all?" or "what does the entire connected component look like?" It is also the foundation of many other algorithms, including cycle detection and topological sort.

## Dijkstra: the shortest weighted path

BFS finds the shortest path when every edge has the same weight. In the real world, edges usually have different weights. A highway is faster than a side road. A direct flight is shorter than a connection. Dijkstra's algorithm handles weighted graphs.

The idea is simple: always expand the node with the smallest known distance from the start. Keep a list of "tentative distances" and update them as you discover shorter routes. When you reach the destination, the tentative distance is the shortest possible.

```
Start at A. Distance to A is 0. Distance to everything else is infinity.
Look at A's neighbors. Update their distances.
Pick the neighbor with the smallest distance. Expand it.
Repeat until you reach the target.
```

For a graph with thousands of nodes and edges, Dijkstra runs fast enough for real-time use. That is why your map app can recalculate your route while you are still driving.

## Detecting cycles: the loop that breaks everything

A **cycle** is a path that starts and ends at the same node. In a social network, a cycle is just a friend group. In a dependency graph, a cycle is a disaster: A depends on B, B depends on C, C depends on A. Nothing can be installed because everything is waiting for something else.

Detecting a cycle is straightforward with DFS. As you walk through the graph, keep track of the nodes you are currently visiting (the "recursion stack"). If you ever reach a node that is already in the stack, you have found a cycle.

This is why `npm install` or `cargo build` can tell you "circular dependency detected." It ran a cycle detection algorithm on the dependency graph and found a loop.

## Topological sort: ordering things that depend on each other

Sometimes you have a directed graph where edges mean "must come before." A depends on B, so B must be built before A. A course prerequisite graph works the same way: you must take Calculus before taking Differential Equations.

A **topological sort** is an ordering of the nodes where every edge points forward. If there is a cycle, no such ordering exists, and the graph is not a valid dependency structure.

Topological sort is the algorithm behind build systems, task runners, and course planners. It answers: "in what order can I do all of these things, given that some of them depend on others?"

## See it run

Here is BFS for shortest path in an unweighted graph, and a cycle detection function using DFS.

```python runnable
from collections import deque

# An unweighted graph as an adjacency list
graph = {
    "A": ["B", "C"],
    "B": ["A", "D", "E"],
    "C": ["A", "F"],
    "D": ["B"],
    "E": ["B", "F"],
    "F": ["C", "E"]
}

def bfs_shortest_path(graph, start, target):
    visited = set()
    queue = deque([(start, [start])])
    visited.add(start)
    while queue:
        node, path = queue.popleft()
        if node == target:
            return path
        for neighbor in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append((neighbor, path + [neighbor]))
    return None

def has_cycle_dfs(graph):
    visited = set()
    rec_stack = set()
    def dfs(node):
        visited.add(node)
        rec_stack.add(node)
        for neighbor in graph[node]:
            if neighbor not in visited:
                if dfs(neighbor):
                    return True
            elif neighbor in rec_stack:
                return True
        rec_stack.remove(node)
        return False
    for node in graph:
        if node not in visited:
            if dfs(node):
                return True
    return False

print("Shortest path from A to F:", bfs_shortest_path(graph, "A", "F"))
print("Graph has cycle:", has_cycle_dfs(graph))

# Add a cycle: F connects back to A
graph_cyclic = {
    "A": ["B", "C"],
    "B": ["A", "D"],
    "C": ["A", "F"],
    "D": ["B"],
    "F": ["C", "A"]  # cycle: A -> C -> F -> A
}
print("Cyclic graph has cycle:", has_cycle_dfs(graph_cyclic))
```

*What just happened:* The `bfs_shortest_path` function found the shortest path from A to F: A -> C -> F. BFS guarantees this is the shortest because it explores all paths of length 1, then length 2, and so on. The `has_cycle_dfs` function used depth-first search with a recursion stack to detect cycles. The first graph had no cycle. The second graph, with the added edge F -> A, created a cycle A -> C -> F -> A, and the function detected it.

## For builders

Graph algorithms are not academic exercises. They are the reason your software works.

- **Package managers** - `npm`, `pip`, `cargo` all resolve dependency graphs. A cycle in that graph is an error. A topological sort gives the installation order.
- **Social networks** - "People you may know" is often a graph traversal. "Friends of friends" is BFS with depth 2.
- **Network routing** - OSPF and other routing protocols use variants of Dijkstra to find the fastest path through a network of routers.
- **Build systems** - `make`, `bazel`, and `gradle` all use topological sort to decide which files to compile first.
- **Game AI** - Pathfinding in games uses A-star, a variant of Dijkstra that uses a heuristic to explore promising paths first.

> The key insight: any time you have things and prerequisites or connections between them, you have a graph. The moment you can draw it, you can run algorithms on it to find shortest paths, detect cycles, or order the nodes.

## What we have built

- A **graph** is nodes connected by edges.
- An **undirected graph** has symmetric edges. A **directed graph** has asymmetric edges with direction.
- A **weighted graph** has numbers attached to edges.
- **BFS** explores level by level and finds the shortest path in an unweighted graph.
- **DFS** follows one path as far as it can go, then backtracks.
- **Dijkstra's algorithm** finds the shortest weighted path by always expanding the closest unvisited node.
- **Cycle detection** uses DFS with a recursion stack to find loops.
- **Topological sort** orders nodes so that every edge points forward, or reports that no such order exists.

A quick check before you move on:

```quiz
[
  {
    "q": "In an unweighted graph, which algorithm guarantees the shortest path?",
    "choices": ["DFS", "BFS", "Dijkstra", "Topological sort"],
    "answer": 1,
    "explain": "BFS explores all nodes at distance 1, then distance 2, and so on. The first time it reaches a node, it has done so by the shortest possible path. DFS does not guarantee shortest path."
  },
  {
    "q": "What does it mean if a directed graph has a cycle?",
    "choices": ["The graph is empty", "There is a path that starts and ends at the same node", "All nodes are connected to each other", "The graph has no edges"],
    "answer": 1,
    "explain": "A cycle is a path that starts and ends at the same node. In a dependency graph, a cycle means A depends on B, B depends on C, and C depends on A - nothing can be resolved."
  },
  {
    "q": "When would you use Dijkstra's algorithm instead of BFS?",
    "choices": ["When the graph has no edges", "When the graph is directed", "When edges have different weights and you need the shortest weighted path", "When you want to detect cycles"],
    "answer": 2,
    "explain": "BFS finds the shortest path when every edge has the same weight. Dijkstra handles weighted edges by always expanding the node with the smallest known distance from the start."
  }
]
```

[← Phase 1: Nodes, Edges, and the Graphs You Already Use](01-nodes-edges-and-the-graphs-you-already-use.md) · [Guide overview](_guide.md) · [Phase 3: Graphs That Run the World →](03-graphs-that-run-the-world.md)
