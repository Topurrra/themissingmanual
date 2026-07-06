---
title: "A Dict, and Why Persistence Is Hard"
guide: "key-value-store-python"
phase: 1
summary: "The in-memory store is ten lines of Python; saving it to disk naively fails two ways - every write rewrites everything, and a crash mid-write corrupts the whole file."
tags: [python, persistence, json, torn-writes, atomic-rename]
difficulty: advanced
synonyms:
  - why not save dict to json
  - torn write corruption
  - atomic file write python
  - naive database persistence
updated: 2026-07-06
---

# A Dict, and Why Persistence Is Hard

Ask a senior engineer what a key-value store is and you'll get a shrug: "a dict with persistence." The shrug is earned - the dict part takes one minute. The persistence part is the rest of this guide, because *doing it without losing data* is one of the genuinely hard problems in computing, and every naive attempt fails in a way that teaches you something. This phase builds the dict, then breaks persistence twice on purpose, so that the design in phase 2 feels inevitable instead of clever.

Make a project folder and let's start with the one-minute part.

```bash
mkdir kvstore
cd kvstore
```

## The store, in memory

Create `kv.py`:

```python
class MemoryKV:
    def __init__(self):
        self._data = {}

    def set(self, key, value):
        self._data[key] = value

    def get(self, key):
        return self._data.get(key)

    def delete(self, key):
        self._data.pop(key, None)
```

That's a complete key-value store with one flaw: it *is* the process. Python dicts live in RAM, RAM belongs to the process, and when the process exits - cleanly, by crash, by `kill`, by power cut - the operating system reclaims that memory without ceremony. Every key you set is gone.

This isn't a strawman, by the way. Memcached is essentially this class, hardened and put behind a network port, and it's deployed everywhere - as a *cache*, where losing everything on restart is an accepted cost. The moment you need data to outlive the process, you need a **database**, and the difference between the two is everything below this line.

## Naive attempt #1: write the whole thing out

The obvious fix: serialize the dict to a file on every write, load it on startup.

```python
import json

class SnapshotKV:
    def __init__(self, path):
        self.path = path
        try:
            with open(path) as f:
                self._data = json.load(f)
        except FileNotFoundError:
            self._data = {}

    def set(self, key, value):
        self._data[key] = value
        with open(self.path, "w") as f:
            json.dump(self._data, f)

    def get(self, key):
        return self._data.get(key)

    def delete(self, key):
        self._data.pop(key, None)
        with open(self.path, "w") as f:
            json.dump(self._data, f)
```

This works. Data survives restart. And it hides two failures that get worse the longer you don't notice them.

**Failure 1: every write rewrites everything.** Setting one key serializes and writes the *entire* dict. With ten keys, who cares. With a million keys totaling 2 GB, changing one 40-byte value costs a 2 GB disk write. Write cost grows with the size of the store, not the size of the change - O(total data) per write. No amount of hardware outruns that; the design is wrong.

**Failure 2: a crash mid-write destroys everything.** `open(path, "w")` truncates the file to zero bytes *before* writing the new content. If the process dies between the truncate and the final flush - crash, `kill -9`, power loss - you're left with a partial file. Watch what a partial JSON file is worth:

```console
$ python
>>> import json
>>> json.dump({"name": "Ada", "language": "python", "year": "1843"}, open("snapshot.json", "w"))
>>> # simulate the crash: keep only the first half of the file
>>> import os
>>> size = os.path.getsize("snapshot.json")
>>> with open("snapshot.json", "r+b") as f:
...     f.truncate(size // 2)
...
>>> open("snapshot.json").read()
'{"name": "Ada", "language"'
>>> json.load(open("snapshot.json"))
Traceback (most recent call last):
  ...
json.decoder.JSONDecodeError: Expecting ':' delimiter: line 1 column 27 (char 26)
```

*What just happened:* We cut the file where a crash might have cut it, and `json.load` refused the remains. Note the blast radius: one interrupted write didn't lose one key - it lost **the entire database**, including keys written days ago that were sitting safely on disk until this write rewrote them. This is called a **torn write**, and defending against it is half of what a storage engine is for.

📝 **Terminology:** a *torn write* is any write that was interrupted partway, leaving a mix of new bytes, old bytes, and garbage. Disks and operating systems only promise atomicity for tiny writes (a sector), so any multi-byte file write can tear.

## The patch that half-works: atomic rename

There's a classic fix for failure 2: never overwrite the real file. Write the new snapshot to a temporary file, then rename it over the original.

```python
import os

def save_atomically(data, path):
    tmp = path + ".tmp"
    with open(tmp, "w") as f:
        json.dump(data, f)
        f.flush()
        os.fsync(f.fileno())     # force it to disk before the swap
    os.replace(tmp, path)        # atomic on POSIX and Windows
```

`os.replace` is atomic: readers see the complete old file or the complete new file, never a mixture. If you crash before the rename, the original is untouched; if you crash after, the new one is complete. Torn writes: solved. Remember this move - it comes back as the finale of phase 4, doing serious work.

But look at what it *didn't* fix. Every write still serializes and rewrites the entire store. The atomic rename makes the O(total data) write safe, not cheap. Patch applied, disease intact.

## The reframe that fixes both

Both failures come from the same wrong idea: that the file should always contain *the current state* of the store. Keeping a file constantly equal to your state means rewriting it on every change - which is where both the cost and the tear risk come from.

Real storage engines flip the idea. The file doesn't store the state. The file stores **the history of changes** - and the state is whatever that history adds up to. A change is small, so writing one is cheap (failure 1 gone). A change is *appended* after the existing bytes, so a crash can only damage the newest record, never the accumulated past (failure 2's blast radius shrinks from "everything" to "the last write").

That file has a name: the **append-only log**. It's the beating heart of nearly every database you've ever used - PostgreSQL's write-ahead log, Redis's append-only file, Kafka's entire existence. In phase 2 you'll design its record format byte by byte and build the write path.

## Recap

1. The in-memory store is a dict; the entire project is about making it survive the death of its process.
2. Snapshotting the whole store per write costs O(total data) per change - the cost grows with the store, not the change.
3. A crash mid-rewrite is a torn write, and with a single snapshot file it destroys *everything*, not only the interrupted write.
4. Write-temp-then-`os.replace` makes a rewrite atomic, but not cheap. File this trick away for phase 4.
5. The fix for both is to stop storing state and start storing *changes*: the append-only log.

Before moving on, make sure the failure modes stuck - they justify every decision in the next two phases.

```quiz
[
  {
    "q": "SnapshotKV rewrites the whole store on every set(). What are its two fundamental problems?",
    "choices": [
      "JSON can't store nested data, and Python file writes are slow",
      "Each write costs O(total data), and a crash mid-rewrite can corrupt the entire file",
      "The dict uses too much RAM, and JSON files can't exceed 2 GB"
    ],
    "answer": 1,
    "explain": "Writing one key serializes everything (cost grows with the store), and because open(path, 'w') truncates first, a crash mid-write leaves a partial, unparseable file - losing even data written long ago."
  },
  {
    "q": "The write-to-temp-file-then-os.replace() trick fixes which of the two problems?",
    "choices": [
      "The O(total data) cost of each write",
      "Corruption from a crash mid-write",
      "Both of them"
    ],
    "answer": 1,
    "explain": "os.replace is atomic, so readers see the complete old file or the complete new file - never a torn mixture. But you still rewrote the entire store to produce the temp file."
  },
  {
    "q": "Why does an append-only log shrink the blast radius of a crash?",
    "choices": [
      "Appends are buffered in RAM until the file is closed",
      "The log is written twice, so one copy always survives",
      "A crash can only damage the newest record being appended - the bytes of every earlier record are never touched again"
    ],
    "answer": 2,
    "explain": "Appending never modifies existing bytes. The accumulated history is physically out of reach of the write that crashes, so at most the in-flight record is lost."
  }
]
```

---

[← Guide overview](_guide.md) · [Phase 2: The Append-Only Log →](02-the-append-only-log.md)
