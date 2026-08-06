---
title: "BFS shortest path"
guide: practice-algorithms
phase: 4
summary: "Walk a graph breadth-first to return the shortest path from one node to another, or None when there is no route."
tags: [algorithms, bfs, graphs, shortest-path, python]
difficulty: intermediate
synonyms:
  - bfs shortest path python
  - breadth first search graph
  - shortest path in a graph
  - bfs path finding
updated: 2026-08-06
---

# BFS shortest path

Breadth-first search (BFS) explores a graph in rings: first the start node,
then everything one step away, then everything two steps away, and so on.
Because it reaches every node in order of distance, the very first time it
touches the target it has found a shortest path there - no route with fewer
hops could have been missed.

The classic way to do this is a queue of paths. Start with the path `[start]`.
Pull a path off the front, look at its last node, and for each neighbor build a
new path with that neighbor tacked on. If a neighbor is the target, that
extended path is your answer. Mark nodes as visited when you enqueue them so
you never loop back on yourself or waste time on a longer route to a node you
have already reached.

**Your task:** write `bfs_shortest_path(graph, start, target)`, where `graph`
is a dict mapping each node to a list of its neighbors. Return the shortest
path from `start` to `target` as a list of nodes (including both ends), or
`None` if the target cannot be reached. If `start` equals `target`, the path is
just `[start]`.

**You'll practice:**

- Exploring a graph level by level with a queue
- Tracking visited nodes and reconstructing the path you took

```lesson
{
  "language": "python",
  "starterCode": "# Return the shortest path from start to target as a list of nodes, or None.\n# graph is a dict mapping each node to a list of its neighbor nodes.\ndef bfs_shortest_path(graph, start, target):\n    pass",
  "solution": "def bfs_shortest_path(graph, start, target):\n    if start == target:\n        return [start]\n    visited = {start}\n    queue = [[start]]\n    while queue:\n        path = queue.pop(0)\n        node = path[-1]\n        for neighbor in graph.get(node, []):\n            if neighbor == target:\n                return path + [neighbor]\n            if neighbor not in visited:\n                visited.add(neighbor)\n                queue.append(path + [neighbor])\n    return None",
  "hints": [
    "Breadth-first search explores the graph level by level, so the first time you reach the target you have found a shortest path.",
    "Use a queue of paths, starting with just [start]. Take a path off the front, look at its last node, and extend it by each unvisited neighbor.",
    "Mark nodes visited as you enqueue them so you never revisit one, and return the path the moment a neighbor equals the target."
  ],
  "tests": [
    {
      "name": "finds a direct one-step path",
      "code": "g = {'A': ['B', 'C'], 'B': ['A', 'D', 'E'], 'C': ['A', 'F'], 'D': ['B'], 'E': ['B', 'F'], 'F': ['C', 'E']}\nassert bfs_shortest_path(g, 'A', 'B') == ['A', 'B'], \"path from A to B should be ['A', 'B']\""
    },
    {
      "name": "finds the shortest multi-hop path",
      "code": "g = {'A': ['B', 'C'], 'B': ['A', 'D', 'E'], 'C': ['A', 'F'], 'D': ['B'], 'E': ['B', 'F'], 'F': ['C', 'E']}\nassert bfs_shortest_path(g, 'A', 'F') == ['A', 'C', 'F'], \"shortest path from A to F should be ['A', 'C', 'F']\""
    },
    {
      "name": "returns None when the target is unreachable",
      "code": "g = {'A': ['B', 'C'], 'B': ['A', 'D', 'E'], 'C': ['A', 'F'], 'D': ['B'], 'E': ['B', 'F'], 'F': ['C', 'E']}\nassert bfs_shortest_path(g, 'A', 'Z') is None, 'an unreachable target should return None'"
    },
    {
      "name": "returns a single-node path when start equals target",
      "code": "g = {'A': ['B', 'C'], 'B': ['A', 'D', 'E'], 'C': ['A', 'F'], 'D': ['B'], 'E': ['B', 'F'], 'F': ['C', 'E']}\nassert bfs_shortest_path(g, 'A', 'A') == ['A'], \"path from A to A should be ['A']\""
    }
  ]
}
```
