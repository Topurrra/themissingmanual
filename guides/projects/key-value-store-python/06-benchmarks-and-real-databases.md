---
title: "Benchmarks, and What Redis Does Differently"
guide: "key-value-store-python"
phase: 6
summary: "Measure your engine's real throughput, see the brutal price of fsync, and place your design honestly next to Redis, LevelDB, and SQLite - what each one changed and what it cost them."
tags: [python, benchmarks, fsync, redis, leveldb, lsm-tree]
difficulty: advanced
synonyms:
  - benchmark key value store
  - why is fsync slow
  - redis appendfsync explained
  - lsm tree vs hash index
  - bitcask vs leveldb
updated: 2026-07-06
---

# Benchmarks, and What Redis Does Differently

You built a database. The final phase does what a good engineer does after building anything: measures it honestly, then walks the neighborhood to see how the professionals handled the same trade-offs. There's no better position to understand Redis or LevelDB from - you've personally hit every problem their designs answer.

## One knob first: make fsync optional

Phase 2 committed to `fsync` on every write - full durability, full price. To measure what that price *is*, the store needs a way to decline. Three small edits to `kv.py`:

```python
    def __init__(self, path, fsync=True):
        self.path = path
        self._fsync = fsync
        self._index = {}          # key -> (value_offset, value_len)
        self._replay()
        self._log = open(path, "ab")
        self._reader = open(path, "rb")
```

And in both `set` and `delete`, guard the sync:

```python
        self._log.flush()
        if self._fsync:
            os.fsync(self._log.fileno())
```

With `fsync=False`, writes still reach the OS page cache (safe from *process* crashes, thanks to `flush`) but the disk write happens whenever the OS gets around to it - a power cut in that window loses recent writes. That's not a bug you're adding; it's a *durability policy* you're making explicit. Hold that thought for the Redis section.

## Measure it

Create `bench.py`:

```python
import os
import time

from kv import KV

N = 2000


def bench(label, fn):
    start = time.perf_counter()
    fn()
    took = time.perf_counter() - start
    print(f"{label:<26} {N / took:>12,.0f} ops/sec")


for fsync in (True, False):
    if os.path.exists("bench.log"):
        os.remove("bench.log")
    db = KV("bench.log", fsync=fsync)
    keys = [f"key:{i}".encode() for i in range(N)]
    mode = "fsync every write" if fsync else "no fsync"

    bench(f"set ({mode})", lambda: [db.set(k, b"x" * 100) for k in keys])
    bench(f"get ({mode})", lambda: [db.get(k) for k in keys])

    db.close()
    os.remove("bench.log")
```

Here's one run on my machine - a Windows desktop with an SSD. **Your absolute numbers will differ; the *ratios* are the lesson:**

```console
$ python bench.py
set (fsync every write)             238 ops/sec
get (fsync every write)       3,442,341 ops/sec
set (no fsync)                  161,993 ops/sec
get (no fsync)                4,327,131 ops/sec
```

*What just happened:* Three facts worth staring at.

- **The fsync cliff.** Same code, same data - roughly *seven hundred times* fewer writes per second when every one waits for the disk to confirm. A buffered write is a memory copy measured in microseconds; an fsync is a round trip to a physical device measured in milliseconds. Nothing in the software stack is more expensive than genuine durability, which is why every database makes it configurable and why "how often do you fsync?" is arguably *the* defining question of storage engine design.
- **Reads are absurdly fast.** Millions per second - because a `get` is a dict lookup plus a small file read that the OS serves from the page cache in RAM. Your index did its job: read cost is independent of database size.
- **Even the "slow" honest mode is fine for many systems.** A couple hundred fully-durable writes per second is a real workload's worth. Know your requirements before buying complexity.

If you want a third data point, benchmark through `client.py` - you'll find TCP round trips and Python's per-request overhead flatten the fsync gap considerably, a useful reminder that the bottleneck is wherever you *haven't* measured yet.

## What Redis does differently

Redis's answer to the fsync cliff: don't put disk on the write path at all. Data lives in RAM - reads and writes touch memory only, which is where the legendary speed comes from. Persistence runs *beside* the data path, in two forms that you have already built both halves of:

- **The AOF (append-only file)** is your phase 2 log - every write command appended. And `appendfsync`, Redis's most famous config knob, is your `fsync` parameter with three positions: `always` (your `fsync=True` - durable, slow), `everysec` (fsync once per second - lose at most about a second of writes on power failure), and `no` (your `fsync=False` - the OS decides). Production overwhelmingly runs `everysec`: the middle of the dial you measured. When the AOF grows bloated, *AOF rewrite* regenerates it from live data - your phase 4 compaction.
- **RDB snapshots** are phase 1's write-everything-out idea, done right: forked into a child process so serving never pauses, written to a temp file, atomically renamed into place. Your `os.replace` trick, at production scale.

And commands execute one at a time on a single thread - the serial guarantee your phase 5 lock provides, achieved with an event loop instead of threads. You didn't build a toy that resembles Redis; you built the same architecture with fewer zeros on the throughput.

## What LevelDB does differently

Your engine has two honest limits, both inherited from the hash index: every key must fit in RAM, and there are no range queries - "give me `user:100` through `user:200`" means checking each key, because a hash map has no order.

LevelDB (and its descendant RocksDB) restructures everything around *sorted order* to fix both. The design is the **LSM tree** - log-structured merge tree:

1. Writes go to a WAL (your log - the crash-safety layer never changes) and into an in-memory sorted structure called the **memtable**.
2. When the memtable fills, it's written out as an **SSTable** - an immutable, *sorted* file. Append-style writing, never modified after creation: still your discipline.
3. Reads check the memtable, then recent SSTables, oldest last. Because each file is sorted, a sparse index (one entry per few kilobytes, not per key) suffices - keys no longer need to all fit in RAM.
4. Background **compaction** continuously merges overlapping SSTables into fewer, larger sorted ones, discarding dead versions - your phase 4, made incremental and perpetual instead of stop-the-world.

Sorted files make range queries a seek-and-scan, and the sparse index frees RAM. The price: a read may probe several files (slower than your one-hop hash lookup), and background compaction consumes real I/O - the write traffic it generates even has a name, *write amplification*. Wins are purchased, never free.

## The honest scorecard

| | **Yours (Bitcask-style)** | **Redis** | **LevelDB/RocksDB** | **SQLite/PostgreSQL** |
|---|---|---|---|---|
| Data lives | Disk (log) + RAM index | RAM (disk is backup) | Disk (LSM tree) | Disk (B-tree pages) |
| Index | Hash: key → offset | Hash, in RAM | Sparse, per sorted file | B-tree |
| Range queries | No | Limited (`SCAN`) | Yes - files are sorted | Yes |
| All keys in RAM? | Required | Everything in RAM | No | No |
| Crash recovery | Replay log | Replay AOF / load RDB | Replay WAL | Replay WAL |
| Compaction story | Manual, stop-the-world | AOF rewrite (forked) | Continuous, background | VACUUM / autovacuum |
| Concurrency | One global lock | Single-threaded loop | Multi-threaded | MVCC, many readers+writers |

Read the recovery row twice: **every column replays a log.** Four radically different engines, one shared spine - the thing you built in phases 2 and 3 is the part nobody gets to skip. (The B-tree column is the [indexes](/guides/why-is-my-query-slow) and [WAL](/guides/database-backups-and-restores) story from the databases guides - same log, different index structure on top.)

## Where to take it

Each of these is a genuine weekend extension, in rough order of payoff:

| Want | What it takes |
|---|---|
| **Faster startup** | Replay is O(log size). Bitcask writes "hint files" - a compact dump of the index - at compaction time, so startup reads the small index file instead of the whole log. |
| **`everysec` durability** | A background thread that fsyncs once per second while writes only `flush()`. You'll have rebuilt Redis's default. |
| **Segmented logs** | Roll to a new log file every N MB and merge old segments in the background - compaction without pausing. Remember the tombstone rule from phase 4. |
| **Range queries** | Keep a sorted list of keys (`bisect`) beside the hash index, or go full memtable/SSTable. This is the door LSM trees live behind. |
| **Replication** | Ship the log to a second machine that replays it - your replay code *is* a replica's apply loop. [Scaling a Database](/guides/scaling-a-database) covers what leader-follower setups do about lag; you now know what they ship. |
| **Real protocol** | Implement RESP framing and point `redis-cli` at your server. There's no feeling quite like an off-the-shelf client accepting your homemade database. |

For the theory behind all of it, the Bitcask paper ([riak.com/assets/bitcask-intro.pdf](https://riak.com/assets/bitcask-intro.pdf)) is a short, readable description of exactly what you built - you'll recognize every diagram.

## What you built

From an empty folder, with nothing but the standard library: a persistent key-value store with a checksummed binary log format, durable writes with an explicit fsync policy, crash recovery that amputates torn writes and replays history, an in-memory index that keeps reads constant-time, live compaction with an atomic swap, and a TCP server with a wire protocol and a client.

More than the code, you own the ideas now. When PostgreSQL's docs mention the WAL, when Redis asks you to choose an `appendfsync` policy, when RocksDB's write amplification comes up in a design review - none of it is magic anymore. It's a log, an index, and a compactor. You've written all three.

```quiz
[
  {
    "q": "Redis's appendfsync everysec policy means what, concretely?",
    "choices": [
      "Every write blocks until the disk confirms it",
      "Writes go to the AOF continuously but fsync runs once per second - a power failure can lose at most about the last second of writes",
      "The database snapshots all of RAM to disk every second"
    ],
    "answer": 1,
    "explain": "It's the middle of the durability dial: writes hit the OS page cache immediately, and one fsync per second bounds the loss window. The benchmark's fsync cliff is exactly why this compromise is the production default."
  },
  {
    "q": "What can LevelDB's LSM design do that our hash-indexed engine fundamentally cannot?",
    "choices": [
      "Survive a crash mid-write",
      "Serve range queries efficiently and handle keysets too large for RAM, because its files are sorted and need only a sparse index",
      "Append records to a log without rewriting old data"
    ],
    "answer": 1,
    "explain": "Crash safety and append-only logging we already have. Sorting is the genuinely new capability: ordered files make 'every key from A to B' a seek-and-scan and let a sparse index replace one-entry-per-key."
  },
  {
    "q": "Why did enabling fsync on every write cost roughly three orders of magnitude in the set benchmark?",
    "choices": [
      "fsync recomputes the CRC32 of the whole log file",
      "Python's fsync wrapper holds the GIL",
      "A buffered write is a memory copy into the page cache; fsync is a blocking round trip to a physical storage device - you're comparing RAM speed to hardware speed"
    ],
    "answer": 2,
    "explain": "The gap is physics, not software: microseconds for a memory copy versus the milliseconds a device takes to confirm persistence. Every storage engine's design revolves around when to pay this exact cost."
  }
]
```

---

[← Phase 5: A TCP Server](05-a-tcp-server.md) · [Guide overview](_guide.md)
