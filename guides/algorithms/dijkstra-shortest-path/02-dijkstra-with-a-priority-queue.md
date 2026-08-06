---
title: "Dijkstra with a Priority Queue"
guide: "dijkstra-shortest-path"
phase: 2
summary: "The full algorithm in code: a min-priority-queue always hands you the closest unfinalized node, edge relaxation lowers neighbors' tentative distances, and stale heap entries are skipped. Walked step by step in Python, then shown in seven languages."
tags: [algorithms, dijkstra, priority-queue, min-heap, heapq, edge-relaxation, shortest-path]
difficulty: intermediate
synonyms: ["dijkstra priority queue implementation", "dijkstra python heapq", "dijkstra min heap", "edge relaxation dijkstra", "dijkstra algorithm code", "dijkstra in seven languages"]
updated: 2026-08-06
---

# Dijkstra with a Priority Queue

Phase 1 gave the loop in words: repeatedly take the closest unfinalized node and use its edges to improve its
neighbors. The one piece that needs care is "take the closest node." Scanning every node each round works but
is slow. A **min-priority-queue** - a min-heap - hands you the smallest-distance node in `O(log n)`, and that
is what makes Dijkstra fast enough to route traffic in real time.

## The data structures

- `dist` - a dictionary mapping each node to its best-known distance from the start. Everything begins at
  infinity except the start at 0.
- A **min-heap** `pq` of `(distance, node)` pairs. Python's `heapq` keeps the smallest pair on top, and
  because the distance is first, "smallest pair" means "closest node."

## The algorithm, step by step

```python runnable
import heapq

graph = {
    "A": [("B", 1), ("C", 10)],
    "B": [("C", 1), ("D", 5)],
    "C": [("D", 1)],
    "D": [],
}

def dijkstra(graph, start):
    dist = {node: float("inf") for node in graph}
    dist[start] = 0
    pq = [(0, start)]                      # (distance, node), min-heap by distance
    while pq:
        d, node = heapq.heappop(pq)        # closest unfinalized node
        if d > dist[node]:
            continue                       # stale entry - we already found a shorter route
        for neighbor, weight in graph[node]:
            new_dist = d + weight
            if new_dist < dist[neighbor]:  # relax: found a cheaper way to neighbor
                dist[neighbor] = new_dist
                heapq.heappush(pq, (new_dist, neighbor))
    return dist

print(dijkstra(graph, "A"))
```
```console
{'A': 0, 'B': 1, 'C': 2, 'D': 3}
```
*What just happened:* trace the heap. It starts with `(0, A)`. Popping `A` relaxes its edges, pushing
`(1, B)` and `(10, C)`. Next the heap yields `(1, B)` - the closest node - and `B`'s edge to `C` offers
`1 + 1 = 2`, beating 10, so `C` drops to 2 and `(2, C)` is pushed; `B` also sets `D` to 6. Then `(2, C)` pops
and improves `D` to `2 + 1 = 3`. When the old `(6, D)` and `(10, C)` finally surface, the guard
`d > dist[node]` throws them away as stale. Final distances: `B` is 1, `C` is 2, `D` is 3.

📝 **Terminology.** *Relaxing* an edge `(u, v)` means: if `dist[u] + weight(u, v)` is less than the current
`dist[v]`, lower `dist[v]` to that new, cheaper value. The whole algorithm is just relaxing edges in the
right order - closest node first.

💡 **Key point: the stale-entry skip.** A plain binary heap has no "decrease-key," so instead of updating an
existing entry we just push a new, smaller `(distance, node)`. That leaves outdated pairs in the heap. The
`if d > dist[node]: continue` line quietly discards them: if the distance we popped is worse than the best we
have already recorded, this entry is old news. This lazy approach is simpler than a decrease-key heap and
runs in `O((V + E) log V)`.

## Getting the path, not just the distance

Distances are often not enough - you want the actual route. Track each node's predecessor as you relax, then
walk the predecessors backward from the target.

```python runnable
import heapq

graph = {
    "A": [("B", 1), ("C", 10)],
    "B": [("C", 1), ("D", 5)],
    "C": [("D", 1)],
    "D": [],
}

def shortest_path(graph, start, target):
    dist = {node: float("inf") for node in graph}
    dist[start] = 0
    prev = {node: None for node in graph}
    pq = [(0, start)]
    while pq:
        d, node = heapq.heappop(pq)
        if d > dist[node]:
            continue
        for neighbor, weight in graph[node]:
            nd = d + weight
            if nd < dist[neighbor]:
                dist[neighbor] = nd
                prev[neighbor] = node
                heapq.heappush(pq, (nd, neighbor))
    # rebuild the route by following predecessors backward
    path, cur = [], target
    while cur is not None:
        path.append(cur)
        cur = prev[cur]
    path.reverse()
    return path, dist[target]

print(shortest_path(graph, "A", "D"))
```
```console
(['A', 'B', 'C', 'D'], 3)
```
*What just happened:* every time a node's distance improved, we recorded *which* node we came from in `prev`.
Starting at `D` and following `prev` gives `D -> C -> B -> A`; reversing it yields the route `A -> B -> C -> D`
with total weight 3 - the same cheap detour the intuition predicted.

## The same algorithm, in other languages

The moving parts never change: a `dist` map, a min-heap of `(distance, node)`, pop the closest, skip stale
entries, relax edges. What changes is how each language spells "min-heap" - Python's `heapq`, Java's
`PriorityQueue`, C++'s `priority_queue` with `greater`, Go's `container/heap`, Rust's `BinaryHeap` with
`Reverse`. Flip through the tabs.

[[codegroup Dijkstra]]

```python
import heapq

def dijkstra(graph, start):
    dist = {node: float("inf") for node in graph}
    dist[start] = 0
    pq = [(0, start)]
    while pq:
        d, node = heapq.heappop(pq)
        if d > dist[node]:
            continue
        for neighbor, weight in graph[node]:
            nd = d + weight
            if nd < dist[neighbor]:
                dist[neighbor] = nd
                heapq.heappush(pq, (nd, neighbor))
    return dist
```

```javascript
class MinHeap {
  constructor() { this.items = []; }
  get size() { return this.items.length; }
  push(item) {
    const a = this.items;
    a.push(item);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p][0] <= a[i][0]) break;
      [a[p], a[i]] = [a[i], a[p]];
      i = p;
    }
  }
  pop() {
    const a = this.items;
    const top = a[0];
    const last = a.pop();
    if (a.length > 0) {
      a[0] = last;
      let i = 0;
      while (true) {
        const l = 2 * i + 1, r = 2 * i + 2;
        let small = i;
        if (l < a.length && a[l][0] < a[small][0]) small = l;
        if (r < a.length && a[r][0] < a[small][0]) small = r;
        if (small === i) break;
        [a[small], a[i]] = [a[i], a[small]];
        i = small;
      }
    }
    return top;
  }
}

function dijkstra(graph, start) {
  const dist = {};
  for (const node in graph) dist[node] = Infinity;
  dist[start] = 0;
  const pq = new MinHeap();
  pq.push([0, start]);
  while (pq.size > 0) {
    const [d, node] = pq.pop();
    if (d > dist[node]) continue;
    for (const [neighbor, weight] of graph[node]) {
      const nd = d + weight;
      if (nd < dist[neighbor]) {
        dist[neighbor] = nd;
        pq.push([nd, neighbor]);
      }
    }
  }
  return dist;
}
```

```typescript
type Graph = Record<string, [string, number][]>;

class MinHeap {
  private items: [number, string][] = [];
  get size(): number { return this.items.length; }
  push(item: [number, string]): void {
    const a = this.items;
    a.push(item);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p][0] <= a[i][0]) break;
      [a[p], a[i]] = [a[i], a[p]];
      i = p;
    }
  }
  pop(): [number, string] {
    const a = this.items;
    const top = a[0];
    const last = a.pop()!;
    if (a.length > 0) {
      a[0] = last;
      let i = 0;
      while (true) {
        const l = 2 * i + 1, r = 2 * i + 2;
        let small = i;
        if (l < a.length && a[l][0] < a[small][0]) small = l;
        if (r < a.length && a[r][0] < a[small][0]) small = r;
        if (small === i) break;
        [a[small], a[i]] = [a[i], a[small]];
        i = small;
      }
    }
    return top;
  }
}

function dijkstra(graph: Graph, start: string): Record<string, number> {
  const dist: Record<string, number> = {};
  for (const node in graph) dist[node] = Infinity;
  dist[start] = 0;
  const pq = new MinHeap();
  pq.push([0, start]);
  while (pq.size > 0) {
    const [d, node] = pq.pop();
    if (d > dist[node]) continue;
    for (const [neighbor, weight] of graph[node]) {
      const nd = d + weight;
      if (nd < dist[neighbor]) {
        dist[neighbor] = nd;
        pq.push([nd, neighbor]);
      }
    }
  }
  return dist;
}
```

```java
import java.util.*;

record Edge(String to, int weight) {}

static Map<String, Integer> dijkstra(Map<String, List<Edge>> graph, String start) {
    record State(int dist, String node) {}
    Map<String, Integer> dist = new HashMap<>();
    for (String node : graph.keySet()) dist.put(node, Integer.MAX_VALUE);
    dist.put(start, 0);
    PriorityQueue<State> pq = new PriorityQueue<>(Comparator.comparingInt(State::dist));
    pq.add(new State(0, start));
    while (!pq.isEmpty()) {
        State cur = pq.poll();
        if (cur.dist() > dist.get(cur.node())) continue;
        for (Edge e : graph.get(cur.node())) {
            int nd = cur.dist() + e.weight();
            if (nd < dist.get(e.to())) {
                dist.put(e.to(), nd);
                pq.add(new State(nd, e.to()));
            }
        }
    }
    return dist;
}
```

```cpp
#include <queue>
#include <unordered_map>
#include <vector>
#include <string>
#include <limits>

std::unordered_map<std::string, int> dijkstra(
    std::unordered_map<std::string, std::vector<std::pair<std::string, int>>>& graph,
    const std::string& start) {
    std::unordered_map<std::string, int> dist;
    for (auto& [node, edges] : graph) dist[node] = std::numeric_limits<int>::max();
    dist[start] = 0;
    using State = std::pair<int, std::string>;   // (distance, node)
    std::priority_queue<State, std::vector<State>, std::greater<State>> pq;
    pq.push({0, start});
    while (!pq.empty()) {
        auto [d, node] = pq.top();
        pq.pop();
        if (d > dist[node]) continue;
        for (auto& [neighbor, weight] : graph[node]) {
            int nd = d + weight;
            if (nd < dist[neighbor]) {
                dist[neighbor] = nd;
                pq.push({nd, neighbor});
            }
        }
    }
    return dist;
}
```

```go
package main

import (
    "container/heap"
    "math"
)

type Edge struct {
    to     string
    weight int
}

type State struct {
    dist int
    node string
}

type PriorityQueue []State

func (pq PriorityQueue) Len() int           { return len(pq) }
func (pq PriorityQueue) Less(i, j int) bool { return pq[i].dist < pq[j].dist }
func (pq PriorityQueue) Swap(i, j int)      { pq[i], pq[j] = pq[j], pq[i] }
func (pq *PriorityQueue) Push(x any)        { *pq = append(*pq, x.(State)) }
func (pq *PriorityQueue) Pop() any {
    old := *pq
    n := len(old)
    item := old[n-1]
    *pq = old[:n-1]
    return item
}

func dijkstra(graph map[string][]Edge, start string) map[string]int {
    dist := make(map[string]int)
    for node := range graph {
        dist[node] = math.MaxInt
    }
    dist[start] = 0
    pq := &PriorityQueue{{0, start}}
    heap.Init(pq)
    for pq.Len() > 0 {
        cur := heap.Pop(pq).(State)
        if cur.dist > dist[cur.node] {
            continue
        }
        for _, e := range graph[cur.node] {
            nd := cur.dist + e.weight
            if nd < dist[e.to] {
                dist[e.to] = nd
                heap.Push(pq, State{nd, e.to})
            }
        }
    }
    return dist
}
```

```rust
use std::collections::{BinaryHeap, HashMap};
use std::cmp::Reverse;

fn dijkstra(graph: &HashMap<String, Vec<(String, u32)>>, start: &str) -> HashMap<String, u32> {
    let mut dist: HashMap<String, u32> = graph.keys().map(|k| (k.clone(), u32::MAX)).collect();
    dist.insert(start.to_string(), 0);
    let mut pq = BinaryHeap::new();
    pq.push(Reverse((0u32, start.to_string())));
    while let Some(Reverse((d, node))) = pq.pop() {
        if d > dist[&node] {
            continue;
        }
        for (neighbor, weight) in &graph[&node] {
            let nd = d + weight;
            if nd < dist[neighbor] {
                dist.insert(neighbor.clone(), nd);
                pq.push(Reverse((nd, neighbor.clone())));
            }
        }
    }
    dist
}
```

[[/codegroup]]

Two details worth noticing across the tabs. C++ and Rust make a min-heap out of a max-heap: `std::greater`
flips the comparison, and `Reverse` flips the ordering, because both `priority_queue` and `BinaryHeap` are
max-heaps by default. And every version keeps the distance first in the pair, so "smallest in the heap"
always means "closest node."

## Check yourself

```quiz
[
  {
    "q": "Why does Dijkstra use a min-priority-queue?",
    "choices": ["To sort the final list of distances", "To efficiently pull out the unfinalized node with the smallest tentative distance each round", "To store the graph's edges", "To detect cycles in the graph"],
    "answer": 1,
    "explain": "The core operation is 'expand the closest node.' A min-heap returns that node in O(log n), which is what keeps the whole algorithm fast."
  },
  {
    "q": "What does 'relaxing' an edge (u, v) mean?",
    "choices": ["Removing the edge from the graph", "If dist[u] + weight(u, v) is smaller than dist[v], lowering dist[v] to that value", "Doubling the edge's weight", "Marking v as finalized"],
    "answer": 1,
    "explain": "Relaxation is the update step: whenever going through u gives a cheaper route to v, dist[v] is lowered. Dijkstra is just edge relaxation in closest-first order."
  },
  {
    "q": "In the heap-based version, why skip a popped (d, node) when d > dist[node]?",
    "choices": ["It signals a bug in the graph", "It is a stale, outdated entry - a shorter route to that node was already recorded, so this one is obsolete", "Only to save a little memory", "That situation can never actually happen"],
    "answer": 1,
    "explain": "Without decrease-key, improved distances are pushed as new heap entries, leaving older larger ones behind. If the popped distance is worse than the recorded best, the entry is stale and is discarded."
  }
]
```
