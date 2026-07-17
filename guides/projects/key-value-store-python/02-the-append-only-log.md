---
title: "The Append-Only Log - the Write Path"
guide: "key-value-store-python"
phase: 2
summary: "Design a binary record format with length prefixes and a CRC32 checksum, append every change to a log, and learn what flush and fsync actually promise about your data reaching the disk."
tags: [python, append-only-log, binary-format, crc32, fsync, durability]
difficulty: advanced
synonyms:
  - append only log format
  - what does fsync do python
  - crc32 checksum records
  - write ahead log explained
  - struct pack binary file
updated: 2026-07-16
---

# The Append-Only Log - the Write Path

Phase 1 ended with a decision: the file on disk stores *changes*, not state. This phase builds the machinery that writes those changes - the record format, the append, and the part almost everyone gets wrong, which is what it actually takes to get bytes onto a disk. By the end, every `set` and `delete` will be recorded permanently, in a format that can detect its own corruption.

## Designing the record

A record has to carry a key and a value, back to back, in one file with thousands of siblings. That raises the first real design question of the project: when you read the file later, **how do you know where one record ends and the next begins?**

Text formats answer "a newline separates them" - and instantly ban newlines from your values. A database can't dictate what bytes your values contain; you might store JSON, a pickle, an image. The standard answer is the one nearly every binary format uses: **length prefixes**. Before the data, write how long the data is. The reader reads the lengths, then knows exactly how many bytes to consume.

Here's our record, byte by byte:

```text
[ crc:4 ][ key_len:4 ][ val_len:4 ][ key bytes... ][ value bytes... ]
```

- `key_len` and `val_len` are 4-byte integers giving the sizes of the key and value.
- `crc` is a 4-byte **checksum** of everything after it. When reading, recompute the checksum; if it doesn't match what's stored, the record is damaged - a torn write from a crash, a flipped bit. Without it, corrupt bytes parse as garbage data and you serve wrong answers with a straight face. With it, damage is *detectable*, and phase 3 turns detectable into recoverable.
- Deletes need recording too - "this key is gone" is a change like any other. We mark one with `val_len = -1` and no value bytes. A delete record is called a **tombstone**, and the name is standard vocabulary in storage engines.

📝 **Terminology:** *CRC32* is a fast 32-bit checksum, in Python's stdlib as `zlib.crc32`. It detects accidental corruption; it is not cryptographic and won't stop a malicious editor - the right tool here, where the enemy is crashes, not attackers.

Notice what a record *doesn't* have: types, encodings, field names. To a storage engine, keys and values are **bytes**, period. Meaning belongs to the caller. That's why everything below traffics in `b"name"` rather than `"name"` - the plain fact of `bytes` in, `bytes` out is exactly how real engines think.

## Your turn: encode_record

Before the full file, write the encoder yourself - the format above is everything you need: `[crc:4][key_len:4][val_len:4][key bytes][value bytes]`, little-endian, and a delete stores `val_len = -1` (`TOMBSTONE`) with no value bytes. The crc covers everything after itself.

```python
import struct
import zlib

TOMBSTONE = -1


def encode_record(key: bytes, value) -> bytes:
    # your turn: pack the lengths (+ key + value, or TOMBSTONE for a delete),
    # then prepend a 4-byte crc32 of everything after it
    return b""
```

`struct.pack` and `zlib.crc32` are the only two stdlib pieces involved - `struct.pack("<I", n)` for the 4-byte crc, `struct.pack("<ii", a, b)` for the two lengths. My version is in the file below; once you have yours, run `encode_record(b"name", b"Ada")` in a REPL and compare it byte-for-byte against the output shown after the code.

## Encoding a record

Start a fresh `kv.py` (replace phase 1's experiments):

```python
import os
import struct
import zlib

# One record on disk:
#   [crc:4][key_len:4][val_len:4][key bytes][value bytes]
# crc covers everything after itself. val_len == -1 marks a delete.
HEADER = struct.Struct("<Iii")   # uint32 crc, int32 key_len, int32 val_len
TOMBSTONE = -1


def encode_record(key: bytes, value) -> bytes:
    if value is None:  # a delete
        body = struct.pack("<ii", len(key), TOMBSTONE) + key
    else:
        body = struct.pack("<ii", len(key), len(value)) + key + value
    crc = zlib.crc32(body)
    return struct.pack("<I", crc) + body
```

`struct` is the stdlib's number-to-bytes converter. The format string `"<Iii"` reads: little-endian (`<`), one unsigned 4-byte int (`I` - the CRC), two signed 4-byte ints (`ii` - the lengths, signed so `-1` can mean tombstone). Fixing the endianness matters: it makes the file format identical on every machine, instead of inheriting whatever CPU wrote it.

Test the encoder in a REPL:

```console
$ python
>>> from kv import encode_record
>>> encode_record(b"name", b"Ada")
b'\x95GJ\xfb\x04\x00\x00\x00\x03\x00\x00\x00nameAda'
>>> len(encode_record(b"name", b"Ada"))
19
```

*What just happened:* 19 bytes - 4 of CRC (`\x95GJ\xfb`), then `\x04\x00\x00\x00` (key length 4, little-endian), `\x03\x00\x00\x00` (value length 3), then `nameAda`. You can read your own file format off the screen. Hold onto that feeling; it's rarer than it should be.

## The write path

Now the store. Writes append a record *and* update an in-memory dict, so reads stay instant:

```python
class KV:
    def __init__(self, path):
        self.path = path
        self._data = {}                  # key -> value (rebuilt in phase 3)
        self._log = open(path, "ab")

    def set(self, key: bytes, value: bytes):
        self._log.write(encode_record(key, value))
        self._log.flush()
        os.fsync(self._log.fileno())
        self._data[key] = value

    def get(self, key: bytes):
        return self._data.get(key)

    def delete(self, key: bytes) -> bool:
        if key not in self._data:
            return False
        self._log.write(encode_record(key, None))
        self._log.flush()
        os.fsync(self._log.fileno())
        del self._data[key]
        return True

    def close(self):
        self._log.close()
```

`open(path, "ab")` is append-binary mode: every write lands at the end of the file, and the OS enforces it. There is no code path in this class that can modify an existing byte - the safety property from phase 1, guaranteed by construction.

Two details deserve a hard look.

**The order inside `set` is a law, not a preference.** Log first, memory second. If the process dies between the two lines, the log has a record the dict doesn't - harmless, since the dict is rebuilt from the log anyway. Flip the order and a reader could `get` a value that a crash then erases forever: the store *lied*. "Nothing is acknowledged or visible until the log has it" is the **write-ahead** principle, and it's the same rule that makes PostgreSQL's WAL work - the databases guides show it powering [durability in ACID](/guides/transactions-and-acid) and [point-in-time recovery](/guides/database-backups-and-restores). You've now written one.

**`flush` and `fsync` are not the same thing, and the difference is your data.** A byte you "write" crosses three layers before it's safe:

```text
your process (Python's buffer)  --flush()-->  OS page cache  --fsync()-->  the disk
```

`self._log.write(...)` may only copy bytes into Python's userspace buffer. `flush()` pushes them to the operating system - now they survive your *process* crashing, because the OS owns them. But the OS keeps them in RAM (the page cache) and writes them to the physical disk at its leisure, seconds later. If the *machine* loses power in that window, flushed data is gone. `os.fsync()` is the third push: it blocks until the disk itself confirms the bytes are persistent. Only after `fsync` returns can you truly tell a caller "your write is durable."

That certainty has a price - `fsync` waits for a physical device, thousands of times slower than a memory copy. Every real database sits somewhere on this durability-versus-speed dial, and in phase 6 you'll measure the gap on your own machine and see exactly why Redis offers three settings for it. For now we pay full price on every write, because correct-then-fast beats fast-then-sorry.

## Watch the log grow

```console
$ python
>>> from kv import KV
>>> db = KV("data.log")
>>> db.set(b"name", b"Ada")
>>> db.set(b"language", b"python")
>>> db.get(b"name")
b'Ada'
>>> db.close()
>>> open("data.log", "rb").read()
b'\x95GJ\xfb\x04\x00\x00\x00\x03\x00\x00\x00nameAda\xd7\x02\x19\x9f\x08\x00\x00\x00\x06\x00\x00\x00languagepython'
```

*What just happened:* Two records, 45 bytes, sitting end to end on disk. You can see the boundary yourself: 19 bytes for `name=Ada`, then the second CRC starts. That file is now a permanent, ordered history of every change this store has seen.

⚠️ **Gotcha:** overwriting a key does *not* modify its old record. `db.set(b"name", b"Grace")` appends a third record; the `Ada` bytes remain on disk, dead but present. The log accumulates every version of everything - that's the price of never touching old bytes, and it's the entire reason phase 4 exists.

## The hole we're leaving open

Restart the REPL and read a key back. You'll get `None`. The log holds the truth - you can see the bytes - but `__init__` never *reads* it; the dict starts empty every time. We've built a store that remembers everything and recalls nothing.

That's the read path, and it's phase 3's job: replay the log on startup, rebuild the state, and handle the record that was halfway written when the power died.

```quiz
[
  {
    "q": "Why length-prefix each record instead of separating records with a newline?",
    "choices": [
      "Length prefixes compress better than delimiters",
      "A delimiter byte could legally appear inside a value, corrupting the framing - length prefixes let values contain any bytes at all",
      "Newlines behave differently on Windows and Linux"
    ],
    "answer": 1,
    "explain": "A store can't dictate what bytes values contain. With a length prefix the reader knows exactly how many bytes to consume, so values can hold newlines, null bytes, anything."
  },
  {
    "q": "Your write() and flush() both succeeded, then the machine lost power. Is the record safe without fsync?",
    "choices": [
      "Yes - flush() writes it to the file",
      "No - flush() only hands the bytes to the OS page cache in RAM; only fsync() waits until the disk itself has them",
      "Yes, as long as the file was opened in append mode"
    ],
    "answer": 1,
    "explain": "flush() protects you from your process dying. Power loss wipes the OS page cache too - fsync() is the call that blocks until the physical disk confirms persistence."
  },
  {
    "q": "In set(), why must the log append happen before the in-memory dict update?",
    "choices": [
      "Because the dict update is faster, so total latency is lower this way",
      "So that a reader can never observe a value that a crash could still erase - nothing is visible until the log has it",
      "Because Python evaluates statements bottom to top inside methods"
    ],
    "answer": 1,
    "explain": "Memory-first would let a get() return a value that exists nowhere durable. Log-first means the worst crash outcome is a logged record nobody saw yet - harmless. That's the write-ahead principle."
  }
]
```

---

[← Phase 1: A Dict, and Why Persistence Is Hard](01-the-dict-and-the-problem.md) · [Guide overview](_guide.md) · [Phase 3: Replay and the Index →](03-replay-and-the-index.md)
