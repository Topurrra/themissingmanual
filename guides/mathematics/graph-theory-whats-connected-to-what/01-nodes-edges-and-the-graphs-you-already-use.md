---
title: "Nodes, Edges, and the Graphs You Already Use"
guide: "graph-theory-whats-connected-to-what"
phase: 1
summary: "A graph is nothing more than a collection of things and the connections between them. The things are nodes, the connections are edges, and the pattern shows up in social networks, dependency trees, and the internet itself. This phase teaches you to see and draw graphs."
tags: [mathematics, graph-theory, nodes, edges, directed, undirected, weighted, beginner-friendly]
difficulty: beginner
synonyms: ["what is a graph", "nodes and edges", "directed vs undirected graph", "weighted graph", "graph representation", "adjacency list"]
updated: 2026-06-28
---

# Nodes, Edges, and the Graphs You Already Use

## The group chat that taught me everything

Picture a group chat with four people: Alice, Bob, Cara, and Dave. Alice can message everyone. Bob can message Alice and Cara. Cara can message everyone. Dave can only message Alice.

If you draw a dot for each person and a line between any two people who can message each other, you have drawn a graph. The dots are **nodes** (or vertices). The lines are **edges**.

That is all a graph is. Nodes and edges. Everything else in graph theory is just asking questions about that picture.

## What a graph is

A **graph** is a set of nodes plus a set of edges that connect pairs of nodes.

```
Nodes: {Alice, Bob, Cara, Dave}
Edges: {(Alice, Bob), (Alice, Cara), (Alice, Dave), (Bob, Cara), (Cara, Dave)}
```

Each edge says "these two nodes are connected." The order of the pair does not matter in this example, because messaging is symmetric: if Alice can message Bob, Bob can message Alice. That makes this an **undirected graph**.

## Directed graphs: when direction matters

Now change the story. Suppose these are not messages but Twitter follows. Alice follows Bob, but Bob does not follow Alice. Now the direction matters.

```
Edges: {(Alice -> Bob), (Alice -> Cara), (Alice -> Dave), (Bob -> Cara), (Cara -> Dave)}
```

The arrows show who follows whom. This is a **directed graph**. The edge from Alice to Bob is not the same as the edge from Bob to Alice. In a directed graph, each edge has a source and a target.

## Weighted graphs: not all connections are equal

Sometimes an edge carries extra information. In a road map, the edge between two cities might represent the driving time between them. In a social network, the edge might represent how often two people interact.

When edges have numbers attached, the graph is **weighted**. The number is the **weight** of the edge.

```
Cities: {A, B, C}
Edges: {(A, B, 4), (B, C, 2), (A, C, 7)}
```

The weight from A to B is 4 (maybe 4 hours of driving). The weight from A to C is 7. The shortest path from A to C is not the direct edge of weight 7. It is A -> B -> C, with total weight 4 + 2 = 6.

## Representing a graph in code

There are two common ways to store a graph in code.

An **adjacency list** stores, for each node, the list of nodes it connects to:

```python
graph = {
    "Alice": ["Bob", "Cara", "Dave"],
    "Bob": ["Alice", "Cara"],
    "Cara": ["Alice", "Bob", "Dave"],
    "Dave": ["Alice"]
}
```

An **adjacency matrix** stores a grid where the cell at row i, column j says whether node i connects to node j:

```python
#    A  B  C  D
# A [0, 1, 1, 1]
# B [1, 0, 1, 0]
# C [1, 1, 0, 1]
# D [1, 0, 1, 0]
```

For sparse graphs (most nodes are not connected to most other nodes), the adjacency list is usually faster and uses less memory. For dense graphs, the matrix can be simpler to work with.

## See it run

Here is a tiny graph represented as an adjacency list, with a function that counts the total number of edges.

```python runnable
# An undirected graph as an adjacency list
graph = {
    "Alice": ["Bob", "Cara", "Dave"],
    "Bob": ["Alice", "Cara"],
    "Cara": ["Alice", "Bob", "Dave"],
    "Dave": ["Alice", "Cara"]
}

def count_edges(graph):
    # Each edge appears twice in an undirected adjacency list (once for each endpoint)
    total = sum(len(neighbors) for neighbors in graph.values())
    return total // 2

print("Nodes:", list(graph.keys()))
print("Edges:", count_edges(graph))
print("Alice's neighbors:", graph["Alice"])
print("Dave's neighbors:", graph["Dave"])
```

*What just happened:* The graph has four nodes. The `count_edges` function adds up all the neighbor counts and divides by two, because each undirected edge is stored twice (once for each endpoint). The result is 5 edges: Alice-Bob, Alice-Cara, Alice-Dave, Bob-Cara, Cara-Dave. Dave is only connected to Alice and Cara, which matches the story.

## For builders

Graphs are not a niche math topic. They are the structure behind most of the software you touch.

- **Dependency trees** - `npm install`, `pip install`, `cargo build`: all of them resolve a graph of package dependencies. A cycle in that graph (A depends on B, B depends on A) is an error.
- **Social networks** - Your followers and following lists are directed edges. The "friends of friends" suggestion is a graph traversal.
- **Network topology** - The internet is a graph of routers and cables. Routing protocols like OSPF and BGP are graph algorithms that find the best path.
- **State machines** - A finite state machine is a directed graph where nodes are states and edges are transitions.
- **Git branches** - A branch history is a directed acyclic graph. Merges create new edges. The graph structure is what makes distributed version control possible.

> The key insight: any time you have things and relationships between them, you have a graph. The moment you can draw it as dots and lines, you can apply graph algorithms to it.

## What we have built

- A **graph** is a set of nodes connected by edges.
- An **undirected graph** has edges with no direction (symmetric).
- A **directed graph** has edges with direction (asymmetric).
- A **weighted graph** has numbers attached to edges.
- An **adjacency list** stores, for each node, the list of its neighbors.
- An **adjacency matrix** stores a grid of connections.
- In code, dependency trees, social networks, and network topologies are all graphs.

A quick check before you move on:

```quiz
[
  {
    "q": "In a graph representing Twitter follows, if Alice follows Bob but Bob does not follow Alice, what kind of graph is this?",
    "choices": ["Undirected", "Directed", "Weighted", "Empty"],
    "answer": 1,
    "explain": "The relationship is not symmetric, so the edges have direction. That makes it a directed graph. An undirected graph would require the connection to work both ways."
  },
  {
    "q": "What does a weighted edge represent?",
    "choices": ["The color of the connection", "A number attached to the edge, such as distance, cost, or time", "The direction of the connection", "The number of nodes in the graph"],
    "answer": 1,
    "explain": "A weight is a number attached to an edge. In a road map it might be driving time. In a social network it might be interaction frequency. It quantifies the connection."
  },
  {
    "q": "Which representation is usually better for a sparse graph (most nodes are not connected to most others)?",
    "choices": ["Adjacency matrix", "Adjacency list", "Both are equally good", "Neither works for sparse graphs"],
    "answer": 1,
    "explain": "An adjacency list stores only the connections that exist, so it uses less memory and is faster to iterate for sparse graphs. An adjacency matrix stores every possible pair, which wastes space when most pairs are not connected."
  }
]
```

[← Guide overview](_guide.md) · [Phase 2: Finding the Shortest Path and Detecting Cycles →](02-finding-the-shortest-path-and-detecting-cycles.md)
