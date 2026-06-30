---
title: "Elasticsearch and OpenSearch"
guide: elasticsearch-and-opensearch
phase: 0
summary: "Full-text search at scale: the inverted index, analyzers and relevance scoring, and how a search engine differs from a database WHERE clause."
tags: [elasticsearch, opensearch, search, inverted-index, bm25, analyzers]
category: tooling
group: "API & Search"
order: 50
difficulty: intermediate
synonyms: ["elasticsearch tutorial", "opensearch vs elasticsearch", "full text search engine", "inverted index explained", "why is LIKE slow", "BM25 relevance", "elasticsearch analyzers", "near real time search"]
updated: 2026-06-30
---

# Elasticsearch and OpenSearch

You added a search box. You wired it to `WHERE title LIKE '%term%'` and it worked on your laptop with fifty rows. Then real data arrived, the queries crawled, typos returned nothing, and "the most relevant result" turned out to mean "whatever row the database happened to scan first." A search engine exists because that problem is genuinely different from a database lookup, and this guide shows you why and how to reach for the right tool.

## How to read this

Read it in order the first time. Phase 1 builds the one mental model that makes everything else click: search engines flip the data structure inside out. Phase 2 is the everyday work, indexing documents, mappings, analyzers, and getting back ranked results. Phase 3 is the reality nobody warns you about, near-real-time refresh, eventual consistency, and the honest question of whether you needed search at all. Skim later for reference, but the first pass should be front to back.

## The phases

1. [Phase 1: The inverted index, or why search is a different problem](01-the-inverted-index.md)
2. [Phase 2: Indexing, mappings, analyzers, and getting ranked results](02-indexing-and-relevance.md)
3. [Phase 3: Near-real-time, consistency, and when to add search at all](03-production-reality.md)

[Phase 1: The inverted index, or why search is a different problem](01-the-inverted-index.md) →
