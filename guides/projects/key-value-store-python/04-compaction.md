---
title: "Compaction - the Log Can't Grow Forever"
guide: "key-value-store-python"
phase: 4
summary: "An append-only log accumulates every dead version of every key; compaction rewrites only the live records to a new file and swaps it in atomically, reclaiming the space without losing a byte."
tags: [python, compaction, garbage-collection, atomic-rename, storage-engine]
difficulty: advanced
synonyms:
  - log compaction explained
  - why does append only log grow
  - atomic file swap os.replace
  - database vacuum reclaim space
updated: 2026-07-06
---

# Compaction - the Log Can't Grow Forever

Append-only bought you crash safety by promising to never touch old bytes. The bill for that promise arrives now: the old bytes pile up. Every overwrite leaves the previous value dead in the file; every delete *adds* bytes (a tombstone) to record a removal. A store whose live data fits in a kilobyte can sit on a gigabyte of history. This phase measures the waste, then reclaims it with the one trick you already know - and the crash-safety analysis of that trick is the best part of the whole project.

## Measure the damage

Start with a fresh log (delete `data.log`) and update one key a thousand times:

```console
$ python
>>> from kv import KV
>>> db = KV("data.log")
>>> for i in range(1000):
...     db.set(b"counter", str(i).encode())
...
>>> db.get(b"counter")
b'999'
>>> import os; os.path.getsize("data.log")
21890
```

One live key, three live value bytes - and 21,890 bytes of file. Every one of the thousand records is still in there; 999 of them are unreachable, because the index points only at the last. The ratio only gets worse with time: the file grows with *write traffic*, while the useful content grows with *data size*. Those are different curves, and the gap between them is garbage.

It's worth being able to see the gap from inside the store. Add this small method to `KV`:

```python
    def wasted_bytes(self) -> int:
        live = sum(HEADER.size + len(key) + length
                   for key, (_, length) in self._index.items())
        return self._offset - live
```

It computes what a file holding *only* the live records would take (one header + key + value per live key) and subtracts that from the actual file size:

```console
>>> db.wasted_bytes()
21868
```

21,868 of 21,890 bytes are dead. Time to collect the garbage.

## The idea: rewrite only what's alive

The index already knows exactly which records matter - it points at the one live value per key. So: walk the index, read each live value, write it as a fresh record into a **new** file, and when the new file is complete, swap it in place of the old one. The dead 999 versions never get copied at all. This is **compaction**.

Two phase-old friends do the heavy lifting. The walk-and-copy produces what phase 1's snapshot writer produced - a file of exactly the current state - but produced *offline, on the side*, while the real log keeps its integrity. And the swap is phase 1's atomic rename, `os.replace`, finally deployed where it belongs.

```python
    def compact(self):
        tmp_path = self.path + ".compact"
        new_index = {}
        offset = 0
        with open(tmp_path, "wb") as tmp:
            for key, (old_off, length) in self._index.items():
                self._reader.seek(old_off)
                value = self._reader.read(length)
                record = encode_record(key, value)
                tmp.write(record)
                new_index[key] = (offset + HEADER.size + len(key), length)
                offset += len(record)
            tmp.flush()
            os.fsync(tmp.fileno())
        self._log.close()
        self._reader.close()
        os.replace(tmp_path, self.path)      # atomic swap
        self._log = open(self.path, "ab")
        self._reader = open(self.path, "rb")
        self._index = new_index
        self._offset = offset
```

Read it as three acts:

1. **Build the replacement.** Every live record is copied into `data.log.compact`, and a matching `new_index` is built as we go - the offsets in the new file differ from the old, so the index must be rebuilt to point at them. The `fsync` before the swap matters: the new file must be *fully on disk* before it's allowed to become the real one.
2. **Close, then swap.** `os.replace` atomically substitutes the new file for the old. The handles are closed first because Windows refuses to replace a file that's held open - on Linux you'd get away without it, and "works on my OS" is not a property you want in a storage engine.
3. **Point at the new world.** Fresh handles, the new index, the new (much smaller) offset.

## The crash-safety audit

Any operation that touches the live data file must survive this question: *what happens if we crash at every single line?* Walk it:

- **Crash while building `tmp`?** The real log was never touched - reopen, replay, nothing lost. A stale `data.log.compact` litters the directory and gets overwritten by the next compaction. (A tidy engine would delete stray `.compact` files on startup; ours tolerates them.)
- **Crash after the fsync, before the replace?** Same story. Old log intact, new file complete but unused. No harm.
- **Crash *during* the replace?** This is why it must be `os.replace` and not copy-over. The rename is atomic: after reboot the path names either the complete old file or the complete new file. Both are valid logs; replay works on either. There is no in-between to be caught in.
- **Crash after the replace?** The new compact log *is* the database now, and it's complete. Done.

Every line, a survivable crash. That's the standard your `compact` now meets, and it's the standard any code touching a data file has to meet.

One subtlety worth naming: tombstones don't survive compaction at all. A deleted key isn't in the index, so nothing about it is copied - the delete becomes true *absence* rather than a recorded event. That works because we compact into a single file that replaces all history. Engines that keep multiple log segments (Bitcask, LevelDB) must *retain* tombstones until every older segment that might still hold the key is merged away - drop the tombstone too early and a zombie value from an old segment comes back to life. Multi-file designs buy incremental compaction at the price of that kind of bookkeeping.

## Run it

Continuing the session from above:

```console
>>> before = os.path.getsize("data.log")
>>> db.compact()
>>> os.path.getsize("data.log")
22
>>> before
21890
>>> db.get(b"counter")
b'999'
>>> db.wasted_bytes()
0
>>> db.close()
>>> db = KV("data.log")          # replay the compacted log
>>> db.get(b"counter")
b'999'
```

*What just happened:* 21,890 bytes became 22 - one header, seven key bytes, three value bytes - with the store live the whole time, and the compacted file replays like any other log, because it *is* one: a log whose history happens to contain no mistakes.

**When to trigger it** is a policy question, separate from the mechanism. A common rule: compact when `wasted_bytes()` exceeds half the file, checked occasionally rather than per-write. We leave `compact()` manual - you have the measuring stick and the lever, and wiring a threshold to them is a three-line `if` you can place where you like.

## You've now built what real engines run

This exact rhythm - append until wasteful, rewrite the live set, swap atomically - is everywhere once you know its shape. Redis calls it *AOF rewrite*: the append-only file is rewritten as the minimal command sequence producing the current state. Bitcask calls it *merging* its data files. LevelDB's *compaction* does it continuously in the background across sorted files (phase 6 digs into that). PostgreSQL's `VACUUM` is the same debt being paid in a page-based world - dead row versions from updates get reclaimed. Every database that never overwrites in place must, eventually, take out the garbage.

Your engine is complete: durable, crash-safe on both the write and compact paths, indexed, and now able to run forever without eating the disk. What it can't do yet is serve anyone but you. Phase 5 puts a network protocol in front of it.

```quiz
[
  {
    "q": "The store holds one key, updated a million times. Roughly what does the log contain before compaction?",
    "choices": [
      "One record - sets overwrite in place",
      "A million records, of which exactly one is reachable through the index",
      "Two records - the first and the latest"
    ],
    "answer": 1,
    "explain": "Append-only means every version is retained on disk. The index points only at the newest; the other 999,999 are dead bytes waiting for compaction."
  },
  {
    "q": "Why is compact() safe even if the process dies halfway through writing the new file?",
    "choices": [
      "Because the new file is written with fsync after every record",
      "Because the live log is never modified during the build - the swap via os.replace happens only after the replacement is complete and fsynced, and the rename itself is atomic",
      "Because Python flushes all open files automatically when a process crashes"
    ],
    "answer": 1,
    "explain": "All work happens in a side file. Until os.replace, the old log is untouched and authoritative; after it, the new one is complete. The atomic rename leaves no in-between state to crash into."
  },
  {
    "q": "Why can our compaction drop tombstones entirely, when multi-segment engines like Bitcask must keep them around during merges?",
    "choices": [
      "Our tombstones are smaller than Bitcask's",
      "We compact everything into a single file that replaces all history, so a deleted key never appears at all - there's no older segment left that could resurrect it",
      "Python's garbage collector removes them from the file"
    ],
    "answer": 1,
    "explain": "With multiple segments, an old segment may still hold a value for the deleted key; the tombstone must survive until that segment is merged away, or the old value comes back. Compacting to one file removes the entire past at once."
  }
]
```

---

[← Phase 3: Replay and the Index](03-replay-and-the-index.md) · [Guide overview](_guide.md) · [Phase 5: A TCP Server →](05-a-tcp-server.md)
