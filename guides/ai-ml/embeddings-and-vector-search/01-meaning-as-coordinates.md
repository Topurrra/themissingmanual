---
title: "Meaning as Coordinates - What an Embedding Actually Is"
guide: "embeddings-and-vector-search"
phase: 1
summary: "An embedding is a list of numbers (a vector) that captures the meaning of a piece of text or image, placing it on a map where similar meanings land near each other and unrelated ones land far apart."
tags: [embeddings, vectors, semantic-meaning, dimensions, ai, ml]
difficulty: intermediate
synonyms: ["what is an embedding", "what does an embedding vector mean", "how do vectors capture meaning", "why is cat near kitten in embedding space", "what are dimensions in an embedding", "embedding map analogy"]
updated: 2026-07-10
---

# Meaning as Coordinates - What an Embedding Actually Is

You've probably heard "an embedding is a vector representation of text." True, and it explains nothing - the kind of definition that makes people nod and stay quietly confused for a year. Here's the idea it's hiding: **if you can place every word, sentence, or document somewhere on a map, then "things that mean similar things" become "things that sit near each other."** An embedding is how you compute that placement. Once you see it, vector search stops being magic and becomes geometry.

## An embedding is a list of numbers that means something

**What it actually is.** An embedding is a list of numbers - a **vector** - that a model produces for a piece of input. Hand a model the word `cat` and it might hand back `[0.21, -0.88, 0.04, ...]`. Those numbers aren't random and they aren't a lookup ID. They're *coordinates*. Each one nudges the input toward or away from some aspect of meaning the model learned.

📝 **Terminology - vector.** In this guide, "vector" just means "an ordered list of numbers." `[0.21, -0.88, 0.04]` is a vector with three numbers in it.

**Why people get this wrong.** People assume an embedding is a *code* for the text - like an ID you could look up to get the word back. It isn't. You can't turn an embedding back into the original text. It's lossy on purpose: it throws away surface details (spelling, exact word choice) and keeps the *meaning*. Two sentences that mean the same thing produce two nearly-identical vectors, even sharing no words.

**What it does in real life.** Think of a map. Latitude and longitude place a city in space, and cities near each other on the map are near each other in reality. An embedding does the same for meaning - coordinates in a "meaning space," and the model is trained so that **similar meanings get similar coordinates**.

```text
   meaning space (simplified to 2 directions)

        kitten •
              • cat
   puppy •  • dog
   ───────────────────────────────────────
                              • car
                                • truck

   words about pets cluster together (top-left)
   words about vehicles cluster together (bottom-right)
   cat ↔ kitten: very close   |   cat ↔ car: far apart
```

*What just happened:* We placed five words on a flat map by their meaning. `cat` and `kitten` land almost on top of each other because they mean nearly the same thing. `dog` and `puppy` form their own little pet cluster nearby. `car` and `truck` sit far off in their own vehicle corner. Nobody told the map "pets go top-left" - the geometry *is* the meaning.

## The map is real, but it has way more than two directions

The 2D picture above is a teaching simplification, so let's correct it before it misleads you.

**What it actually is.** Real embeddings don't have two numbers - they have hundreds or thousands. OpenAI's `text-embedding-3-small` produces vectors with 1,536 numbers each (source: <https://platform.openai.com/docs/guides/embeddings>). Each number is one **dimension**: one independent direction in the meaning space.

📝 **Terminology - dimension.** A dimension is just one slot in the vector. A 2D map has 2 dimensions (left/right, up/down). An embedding with 1,536 numbers lives in a 1,536-dimensional space. You can't picture it, and you don't need to - the math works the same regardless of how many dimensions there are.

**Why people get this wrong.** "High-dimensional" sounds exotic, like intuition should break down. It doesn't: more dimensions just means more independent ways for two things to be similar or different. Two words can be close on the "animal vs object" direction but far apart on the "big vs small" direction. With 1,536 dimensions, the model has 1,536 subtle aspects of meaning to spread things along - exactly why it can tell apart meanings a flat 2D map would smush together.

⚠️ **Gotcha - you can't eyeball high-dimensional closeness.** `[0.21, -0.88, ...]` versus `[0.19, -0.85, ...]` - your eye gives up immediately. Closeness has to be *computed*, with a formula, which is exactly what [Phase 2](02-measuring-similarity.md) is about. Don't try to read meaning out of raw embedding numbers.

## Where the numbers come from

**What it actually is.** You don't write embeddings by hand. A trained model - an **embedding model** - produces them. You send it text, it returns the vector.

**What it does in real life.** In code it looks about as boring as calling any other API:

```console
$ curl https://api.openai.com/v1/embeddings \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "text-embedding-3-small", "input": "a small fluffy cat"}'
{
  "data": [
    { "embedding": [0.0123, -0.0456, 0.0789, ... ], "index": 0 }
  ],
  "model": "text-embedding-3-small",
  "usage": { "prompt_tokens": 5, "total_tokens": 5 }
}
```

*What just happened:* You sent one short string and got back one `embedding` - a long list of numbers (truncated here with `...`; the real response has 1,536 of them). That list is the coordinates of "a small fluffy cat" in the model's meaning space. Send a different model the same text and you'll get a *different* list - each model has its own private map. (Hold that thought; it becomes a real trap in [Phase 3](03-vector-databases-and-the-gotchas.md).)

**Why this saves you later.** Once you internalize "text in, coordinates out, and nearby coordinates mean similar things," every downstream idea clicks into place. Semantic search is "embed the query, find the nearest stored coordinates." Recommendations are "find items near this one." Clustering is "find groups of points that huddle together." They're all the same move on the same map.

## It's not only words, and not only text

**What it actually is.** The same trick works on whole sentences, paragraphs, and documents - and on images, audio, and more. An image embedding model places pictures on a map where a photo of a beach lands near other beach photos and far from spreadsheets.

**What it does in real life.** Some models are even trained so that *text and images share one map* - the text "a small fluffy cat" lands near actual photos of small fluffy cats. That's what powers "search your photo library by typing a description." The mechanism is identical: everything becomes coordinates; closeness means similarity. For the rest of this guide we'll stick to text, because the ideas transfer cleanly.

## Recap

1. An **embedding** is a list of numbers (a **vector**) that a model produces for a piece of input.
2. Those numbers are **coordinates on a map of meaning** - similar meanings land near each other, unrelated ones land far apart.
3. Real embeddings live in **hundreds or thousands of dimensions**, not two; the 2D scatter is just for intuition.
4. You **can't eyeball** closeness in high dimensions - it has to be computed (next phase).
5. The same idea covers sentences, documents, and even images; **closeness always means similarity**.

You now have the one idea the whole field rests on: meaning as coordinates. Next we make "near" precise - how a computer actually measures the distance between two of these vectors, and turns that into search.

---

Click a word to see its nearest neighbours. Similar meanings sit close together - that's the whole idea behind an embedding:

```playground-embed
```

Watch it animated: [embeddings](/explainers/Embeddings.dc.html)

[← Guide overview](_guide.md) · [Phase 2: Measuring Similarity →](02-measuring-similarity.md)
