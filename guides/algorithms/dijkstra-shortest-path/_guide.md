---
title: "Dijkstra's Shortest Path, From Scratch"
guide: "dijkstra-shortest-path"
phase: 0
summary: "Dijkstra's algorithm taught from intuition: why BFS breaks once edges have weights, the greedy 'always expand the closest node' idea, a priority-queue implementation walked step by step across seven languages, and where it runs the real world - maps, routing, and A*."
tags: [algorithms, dijkstra, shortest-path, graphs, priority-queue, min-heap, routing, intermediate]
category: algorithms
order: 10
difficulty: intermediate
synonyms: ["how does dijkstra's algorithm work", "dijkstra shortest path explained", "dijkstra with priority queue", "why bfs fails on weighted graphs", "shortest path algorithm", "dijkstra vs a star"]
updated: 2026-08-06
---

# Dijkstra's Shortest Path, From Scratch

Every time a map app draws a fastest route, something very close to Dijkstra's algorithm is running
underneath. It answers one of the most useful questions in computing: given a network of places connected by
roads of different lengths, what is the cheapest way from here to there?

If you have met [BFS and graphs already](/guides/graph-theory-whats-connected-to-what/2), you have most of
the intuition. BFS finds the shortest path when every step costs the same. The moment steps have different
costs - a highway versus a side street - BFS gives the wrong answer, and Dijkstra is the fix. This guide
builds it from that gap.

Every example runs in Python right in the page, so you can watch the distances settle as it runs.

## How to read this

Read in order. Phase 1 shows exactly where BFS breaks and names the greedy idea that repairs it; phase 2
turns that idea into real code with a priority queue; phase 3 is where it lives in production, plus the one
input that quietly breaks it.

## The phases

1. **[Why BFS Isn't Enough for Weighted Graphs](01-why-bfs-isnt-enough.md)** 🟢 Basic - how a fewest-hops
   search picks a long road over a short detour, and the "always expand the closest unvisited node" idea that
   fixes it.
2. **[Dijkstra with a Priority Queue](02-dijkstra-with-a-priority-queue.md)** 🟡 Intermediate - the full
   algorithm, walked step by step, implemented with a min-heap across seven languages.
3. **[Where Dijkstra Runs the World](03-where-dijkstra-runs-the-world.md)** 🟡 Intermediate - maps and network
   routing, A* as Dijkstra plus a heuristic, and why a single negative edge weight breaks the whole thing.
