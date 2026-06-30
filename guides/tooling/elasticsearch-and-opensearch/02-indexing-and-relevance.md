---
title: "Phase 2: Indexing, mappings, analyzers, and getting ranked results"
guide: elasticsearch-and-opensearch
phase: 2
summary: "Full-text search at scale: the inverted index, analyzers and relevance scoring, and how a search engine differs from a database WHERE clause."
tags: [elasticsearch, opensearch, search, inverted-index, bm25, analyzers]
difficulty: intermediate
synonyms: ["elasticsearch tutorial", "opensearch vs elasticsearch", "full text search engine", "inverted index explained", "why is LIKE slow", "BM25 relevance", "elasticsearch analyzers", "near real time search"]
updated: 2026-06-30
---

# Phase 2: Indexing, mappings, analyzers, and getting ranked results

Phase 1 was the model. Now you actually use it. You will put documents in, control how the words get processed, and pull results back out *ranked by relevance* instead of by accident. Everything here is JSON over HTTP, so the examples are `curl`-shaped and read the same against Elasticsearch or OpenSearch.

## Indexing a document

In search-engine vocabulary an **index** is roughly a table, and a **document** is roughly a row, stored as JSON. You add a document with a PUT:

```bash
PUT /products/_doc/1
{
  "name": "Wireless Optical Mouse",
  "description": "Ergonomic wireless mouse with USB receiver",
  "price": 24.99,
  "in_stock": true
}
```

*What just happened:* you created (or replaced) the document with id `1` in the `products` index. The engine ran each text field through an analyzer, broke it into terms, and wrote those terms into the inverted index. The document is now findable, almost, there is a short delay before it shows up, which is the whole story of Phase 3.

## Analyzers: the step that makes text searchable

An **analyzer** is the pipeline that turns a blob of text into the clean terms that go in the index. It runs at write time on your documents and again at query time on the search string, so both sides end up speaking the same reduced language. A typical analyzer does three things:

```text
input:      "The Wireless Mice, Running!"
1 tokenize: ["The", "Wireless", "Mice", "Running"]   (split on spaces/punctuation)
2 lowercase:["the", "wireless", "mice", "running"]
3 stem/stop:["wireless", "mouse", "run"]             (drop "the", stem to roots)
```

*What just happened:* this is why a search for "Wireless Mice" finds a product described as "wireless mouse." Both strings get lowercased, stripped of the stopword "the," and stemmed to root forms, so "Mice" and "mouse" both collapse toward the same term. Without the analyzer, you would be doing exact string matching and the search would feel broken. The default analyzer handles most English text well; you swap in language-specific or custom analyzers when you need them.

## Mappings: telling the engine what each field is

A **mapping** is the schema for an index, it says each field's type and how it should be analyzed. The engine can guess (dynamic mapping), but guessing causes pain later, so for anything real you define it:

```bash
PUT /products
{
  "mappings": {
    "properties": {
      "name":        { "type": "text" },
      "price":       { "type": "float" },
      "in_stock":    { "type": "boolean" },
      "category":    { "type": "keyword" }
    }
  }
}
```

*What just happened:* the critical distinction is `text` versus `keyword`. A **`text`** field is run through the analyzer and broken into terms, that is what you do full-text search against. A **`keyword`** field is stored whole, exactly as given, not analyzed, so it is right for things you filter, sort, or group by exactly: status codes, tags, category slugs, IDs. Mark a category as `text` and you cannot reliably filter on the exact value "kitchen-tools"; mark a description as `keyword` and full-text search against it stops working. Choosing the type per field is the bulk of mapping work, and it is the same instinct as designing a clean schema in [/guides/designing-apis-that-last](/guides/designing-apis-that-last): name the shape of your data deliberately, up front.

## Querying, and the word that matters most: score

Here is a real search across two fields:

```bash
POST /products/_search
{
  "query": {
    "multi_match": {
      "query": "wireless mouse",
      "fields": ["name", "description"]
    }
  }
}
```

The response comes back sorted by `_score`, highest first:

```json
{
  "hits": {
    "max_score": 2.41,
    "hits": [
      { "_id": "1", "_score": 2.41, "_source": { "name": "Wireless Optical Mouse" } },
      { "_id": "2", "_score": 0.93, "_source": { "name": "Wireless Keyboard and Mouse Combo" } }
    ]
  }
}
```

*What just happened:* this is the thing a database `WHERE` clause cannot give you. Document 1 scored higher than document 2 because the query terms are denser and more prominent in it. The engine did not return "the rows that match," it returned "the best matches, ranked." That ranking number is `_score`.

## BM25: where the score comes from

The default scoring algorithm is **BM25**. You do not need its formula, you need its intuition, which is three forces:

- **Term frequency** — a document that uses your search word more often is more relevant, but with *diminishing returns*. The tenth mention of "mouse" barely moves the needle past the third.
- **Inverse document frequency** — a word that appears in *few* documents is more informative. Matching "ergonomic" tells you far more than matching "the," so rare terms are weighted up and common ones down.
- **Field length** — a match in a short field counts for more. Your term appearing in a five-word title is a stronger signal than the same term buried in a thousand-word description.

```text
search "wireless mouse":
  doc A title "Wireless Mouse"            -> short field, both terms        -> high score
  doc B desc "...a wireless mouse pad..." -> long field, terms less central -> lower score
```

*What just happened:* BM25 combined those three forces to decide A beats B. This is also why returning the literal `LIKE` scan order felt random, there was no scoring at all. When relevance looks wrong, you are usually fighting one of these three knobs (often field length or a too-common term), and the fix is in your mapping and analyzer choices, not in the algorithm.

## Filter vs. query: not everything needs a score

Often you want to *narrow* results without affecting ranking, "in stock only," "under $50." That is a filter, and it is both faster and cacheable because the engine skips scoring entirely:

```bash
POST /products/_search
{
  "query": {
    "bool": {
      "must":   { "multi_match": { "query": "wireless mouse", "fields": ["name", "description"] } },
      "filter": [
        { "term":  { "in_stock": true } },
        { "range": { "price": { "lte": 50 } } }
      ]
    }
  }
}
```

*What just happened:* the `must` clause scores documents for relevance; the `filter` clause just includes or excludes them with no effect on `_score`. Rule of thumb, full-text matching where ranking matters goes in `must`; exact, yes/no constraints go in `filter`. This split is most of practical query writing.

> Keep your relevance-affecting clauses (`must`) separate from your hard constraints (`filter`). Mixing a `term` filter into the scoring path wastes scoring work and can subtly distort ranking. Filters are the lazy win: faster and cached.

```quiz
[
  {
    "q": "You have a field of category slugs like 'kitchen-tools' that you want to filter on exactly. Which type should it be?",
    "choices": [
      "text, so the analyzer breaks it into searchable terms",
      "keyword, so it is stored whole and unanalyzed for exact filtering",
      "float, so it sorts correctly",
      "boolean, since a category is either matched or not"
    ],
    "answer": 1,
    "explain": "keyword stores the value exactly and is not analyzed, which is what exact filtering, sorting, and grouping need. text would tokenize it."
  },
  {
    "q": "Which is NOT one of the three forces in BM25 scoring?",
    "choices": [
      "Term frequency, with diminishing returns",
      "Inverse document frequency, favoring rare terms",
      "Field length, favoring matches in shorter fields",
      "Document creation date, favoring newer documents"
    ],
    "answer": 3,
    "explain": "BM25 uses term frequency, inverse document frequency, and field length. Recency is not part of it; you would add that explicitly if you wanted it."
  },
  {
    "q": "You want 'in stock only' to narrow results without changing the relevance ranking. Where does it go?",
    "choices": [
      "In the must clause, so it contributes to the score",
      "In the filter clause, which includes/excludes with no scoring",
      "In the analyzer, as a stopword",
      "In the mapping, as a text field"
    ],
    "answer": 1,
    "explain": "filter clauses include or exclude without affecting _score, and they are cacheable, so hard yes/no constraints belong there."
  }
]
```

[← Phase 1: The inverted index](01-the-inverted-index.md) | [Overview](_guide.md) | [Phase 3: Near-real-time, consistency, and when to add search at all →](03-production-reality.md)
