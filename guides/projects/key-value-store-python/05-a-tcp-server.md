---
title: "A TCP Server - Speaking to Other Programs"
guide: "key-value-store-python"
phase: 5
summary: "Put a SET/GET/DEL wire protocol in front of the engine with a threaded TCP server and a lock, so any program on the machine can use your database - and see why concurrent writers need serializing."
tags: [python, tcp, socketserver, wire-protocol, threading, locks]
difficulty: advanced
synonyms:
  - python socketserver key value
  - simple database wire protocol
  - tcp set get del server
  - thread safety database writes
updated: 2026-07-06
---

# A TCP Server - Speaking to Other Programs

Everything so far lives inside one Python process - to use the store, you have to *be* the store. Real databases are servers: a separate long-running process that any program can talk to over a socket, in any language, using an agreed protocol. That separation is the difference between a library and a database. This phase builds it, and in doing so runs into the problem that shapes every database server's architecture: two clients writing at once.

## Design the protocol

A wire protocol is a contract about bytes: what a request looks like, what a response looks like, and how everyone knows where messages end. Ours is line-based - one request per line, one response per line:

| Request | Response | Meaning |
|---|---|---|
| `SET <key> <value>` | `OK` | Store the value under the key |
| `GET <key>` | `VALUE <bytes>` or `NOT_FOUND` | Fetch the current value |
| `DEL <key>` | `DELETED` or `NOT_FOUND` | Remove the key |
| anything else | `ERR unknown command` | You made a typo; the server survives it |

If that shape looks familiar, it should - it's a deliberate cousin of Redis's original inline protocol and memcached's text protocol. Text protocols win for a first version because you can debug them with your eyes.

The framing rule - "a message ends at `\n`" - has the exact flaw you identified in phase 2: a value containing a newline breaks the protocol. We accept the limitation knowingly for the wire (our record format on disk still handles arbitrary bytes fine), and the recap names how grown-up protocols fix it. Protocol design is trade-off design; the important thing is to *know* which corner you cut.

## The server

Create `server.py` next to `kv.py`:

```python
import socketserver
import threading

from kv import KV

store = KV("data.log")
lock = threading.Lock()


class Handler(socketserver.StreamRequestHandler):
    def handle(self):
        while True:
            line = self.rfile.readline()
            if not line:
                break                      # client hung up
            parts = line.strip().split(b" ", 2)
            cmd = parts[0].upper()

            if cmd == b"SET" and len(parts) == 3:
                with lock:
                    store.set(parts[1], parts[2])
                self.wfile.write(b"OK\n")
            elif cmd == b"GET" and len(parts) == 2:
                with lock:
                    value = store.get(parts[1])
                if value is None:
                    self.wfile.write(b"NOT_FOUND\n")
                else:
                    self.wfile.write(b"VALUE " + value + b"\n")
            elif cmd == b"DEL" and len(parts) == 2:
                with lock:
                    found = store.delete(parts[1])
                self.wfile.write(b"DELETED\n" if found else b"NOT_FOUND\n")
            else:
                self.wfile.write(b"ERR unknown command\n")


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


if __name__ == "__main__":
    with Server(("127.0.0.1", 5555), Handler) as server:
        print("kv server listening on 127.0.0.1:5555")
        server.serve_forever()
```

The load-bearing pieces:

- **`ThreadingTCPServer` spawns one thread per client connection.** Each connected client gets its own `Handler` running `handle()` in its own thread, looping over that client's lines until it disconnects. The stdlib does the accept-loop and thread plumbing; you write only the conversation.
- **`StreamRequestHandler` gives you `rfile` and `wfile`** - the socket dressed up as file objects. `rfile.readline()` blocks until a full line arrives (the framing rule, implemented for free); an empty result means the client closed the connection.
- **`split(b" ", 2)` splits at most twice**, so in `SET user:1 Ada Lovelace` the value keeps its space: everything after the second space is value bytes.
- **`allow_reuse_address`** spares you the classic dev-loop pain: without it, restarting the server within a minute of stopping it can fail with "address already in use" while the OS holds the old socket in a cool-down state.
- **`daemon_threads`** lets Ctrl+C actually stop the process instead of waiting on every open client connection.

## The lock is not optional

The line that deserves the most respect in that file is `lock = threading.Lock()`, so let's earn it. With one thread per client, two clients can call `store.set` **at the same time**. Trace what's inside `set`: append to the log, then update the index and `self._offset`. Interleave two of those and you get real corruption, not theoretical ickiness:

- Thread A computes its record's offset from `self._offset`. Before A finishes, thread B does the same - *the same offset*. Both index entries are wrong; one points into the middle of the other's record. A later `get` returns spliced garbage - which the CRC won't catch, because CRCs are checked on *replay*, not on reads through the index.
- The interleaved `_offset += len(record)` updates can lose one of the additions entirely, shifting every future offset in the index.

The lock makes each command a critical section: one thread at a time touches the store, everyone else queues for microseconds. Simple, correct, and upfront about its ceiling - under heavy parallel load, one global lock becomes the bottleneck. It's the right first answer anyway, and it's in good company: Redis processes commands one at a time by design (an event loop rather than a lock, but the same serial guarantee) and derives famous simplicity from it. When people say "Redis is single-threaded," *this* is the problem being dodged.

⚠️ **Gotcha:** the lock protects you only because every client goes through this one server process. If a second *process* opened `data.log` in append mode, the OS would happily interleave records from both - the lock never sees it. One writer process per log file is a rule, not a suggestion. (Real engines enforce it with a lock file on disk; SQLite's famous "database is locked" is that enforcement talking.)

## A client

The server speaks a protocol, so prove it with a client that isn't you-in-a-REPL. Create `client.py`:

```python
import socket
import sys


def send(command: str) -> str:
    with socket.create_connection(("127.0.0.1", 5555)) as sock:
        sock.sendall(command.encode() + b"\n")
        response = sock.makefile("rb").readline()
    return response.decode().rstrip("\n")


if __name__ == "__main__":
    print(send(" ".join(sys.argv[1:])))
```

Twelve lines, and note what they contain: connect, send a line, read a line back. Any language with sockets can implement this in the same twelve lines - Node, Go, Rust, a shell script with netcat. That's what "wire protocol" buys: your Python engine is now usable from software that has never heard of Python.

## Run it

Terminal 1 - the server:

```console
$ python server.py
kv server listening on 127.0.0.1:5555
```

Terminal 2 - the conversation:

```console
$ python client.py SET name Ada Lovelace
OK
$ python client.py GET name
VALUE Ada Lovelace
$ python client.py DEL name
DELETED
$ python client.py GET name
NOT_FOUND
$ python client.py SET counter 42
OK
```

Now the moment the whole guide has been building toward. In terminal 1, kill the server with **Ctrl+C**. Start it again. Then:

```console
$ python client.py GET counter
VALUE 42
```

*What just happened:* The server process died and took every in-memory structure with it - the index, the offsets, all of it. On restart, `KV("data.log")` replayed the log and rebuilt the world, and a client on the other side of a socket can't even tell it happened. Log, replay, index, recovery - every phase of this project fired in that one unremarkable `VALUE 42`. Unremarkable is the achievement.

## Recap

1. A database becomes a *server* when strangers can reach it through a socket and a protocol - the engine didn't change, its audience did.
2. Line-based text protocols are debuggable by eye and fine for v1; their framing bans newlines in values. The grown-up fix is length-prefixing - exactly what your on-disk record format already does, and what Redis's RESP protocol (`$5\r\nhello`) does on the wire.
3. One thread per client means concurrent access to shared state; the global lock serializes commands so log appends and index updates can't interleave into corruption.
4. One writer *process* per log file - a lock inside one process can't referee two processes.

```quiz
[
  {
    "q": "Two client threads call store.set() at the same instant with no lock. What's the realistic worst case?",
    "choices": [
      "One request is refused with an error by the OS",
      "Both writes compute offsets from the same _offset value, corrupting the index so reads return spliced bytes from two different records",
      "Nothing - Python's GIL makes the whole set() call atomic"
    ],
    "answer": 1,
    "explain": "The GIL makes single bytecode operations atomic, not multi-step methods - threads can interleave between the append and the bookkeeping. Both threads reading the same _offset leaves index entries pointing at wrong bytes."
  },
  {
    "q": "Why can't a value contain a newline in this wire protocol, and what's the standard fix?",
    "choices": [
      "TCP can't transmit newline bytes; the fix is base64-encoding everything",
      "The protocol frames messages by newline, so a newline inside a value would end the message early; the fix is length-prefixed framing, as in RESP or our own on-disk record format",
      "Python's readline() strips newlines; the fix is using read() instead"
    ],
    "answer": 1,
    "explain": "Delimiter-based framing always bans the delimiter from the payload. Length prefixes ('the next 5 bytes are the value') let payloads contain anything - the same reasoning that shaped the record format in phase 2."
  },
  {
    "q": "You restart the server process. Why do clients still see all their data?",
    "choices": [
      "The OS preserves the process's memory across restarts",
      "The clients cache their own writes locally",
      "KV's constructor replays the log on startup, rebuilding the index - the socket layer sits on top of the same crash-recovery machinery from phase 3"
    ],
    "answer": 2,
    "explain": "Nothing about the server is special: it constructs a KV, which replays data.log and rebuilds the index. Restarting a database is a controlled crash, and recovery is the same code path."
  }
]
```

---

[← Phase 4: Compaction](04-compaction.md) · [Guide overview](_guide.md) · [Phase 6: Benchmarks, and What Redis Does Differently →](06-benchmarks-and-real-databases.md)
