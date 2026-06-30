---
title: "A Tiny CLI, and Where to Take It"
guide: url-shortener-python
phase: 4
summary: "Wrap shorten() and resolve() in a small command loop you can drive with typed commands, then map out how to grow it into a real service."
tags: [python, cli, command-loop, persistence, beginner]
difficulty: beginner
synonyms:
  - command line interface
  - repl loop
  - interactive shell
  - next steps
  - extend the project
updated: 2026-06-30
---

# A Tiny CLI, and Where to Take It

The logic is finished. `shorten()` and `resolve()` do everything a URL shortener does. But right now the only way to use it is to edit the source code, which is no way to hand it to a friend. This phase wraps it in a small command interface - type a command, get an answer - and then lays out the paths from this toy to something real.

## A command loop

A command-line tool is a loop: read what the user typed, figure out which command it is, do the thing, print the result, repeat. We'll support two commands:

- `shorten <url>` - mint a code for a URL and print it.
- `get <code>` - resolve a code back to its URL.

On your own machine you'd read commands with Python's `input()` in a `while True:` loop. Here in the browser there's no keyboard prompt, so we'll feed the loop a fixed list of commands and process them the same way `input()` would. The command-parsing logic is identical - only the source of the lines changes.

Run this. It's the whole thing, end to end:

```python runnable
ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
BASE = len(ALPHABET)

def encode(number):
    if number == 0:
        return ALPHABET[0]
    chars = []
    while number > 0:
        number, remainder = divmod(number, BASE)
        chars.append(ALPHABET[remainder])
    return "".join(reversed(chars))

code_to_url = {}
url_to_code = {}
counter = 0

def shorten(long_url):
    global counter
    if long_url in url_to_code:
        return url_to_code[long_url]
    code = encode(counter)
    code_to_url[code] = long_url
    url_to_code[long_url] = code
    counter += 1
    return code

def resolve(code):
    return code_to_url.get(code, None)

def handle(line):
    parts = line.split(maxsplit=1)         # ["shorten", "https://..."]
    if not parts:
        return
    command = parts[0]
    if command == "shorten" and len(parts) == 2:
        print(f"  shortened -> {shorten(parts[1])}")
    elif command == "get" and len(parts) == 2:
        url = resolve(parts[1])
        print(f"  {parts[1]} -> {url if url else 'unknown code'}")
    else:
        print(f"  ? unknown command: {line!r}")

# on your machine this would be: while True: handle(input("> "))
# here we feed it a script of commands instead
session = [
    "shorten https://example.com/pricing",
    "shorten https://docs.python.org/3/",
    "shorten https://example.com/pricing",   # repeat -> same code
    "get 0",
    "get 1",
    "get zzz",                               # unknown -> handled
    "frobnicate now",                        # garbage -> handled
]

for line in session:
    print(f"> {line}")
    handle(line)
```

Run it and read the transcript. Each `>` line is a typed command; the indented line under it is the response. The repeated URL gets the same code, an unknown code reports cleanly, and even nonsense input gets a tidy "unknown command" instead of a crash. `line.split(maxsplit=1)` is what splits `shorten https://...` into the command and everything after it, keeping the URL whole even though URLs can contain spaces in odd cases.

That's a complete, usable URL shortener in well under 50 lines. You built it from a dictionary, a counter, and two functions.

## Taking it to your own machine

To run this for real, copy the code above into a file called `shortener.py`, and swap the scripted `session` loop for a live one:

```python
# replace the `session` block with this:
while True:
    line = input("> ")
    if line.strip() == "quit":
        break
    handle(line)
```

Then run it from a terminal:

```bash
python shortener.py
```

Now it prompts you with `>` and waits for commands until you type `quit`. Same logic, real keyboard.

## Where to take it

Here are the next steps in roughly increasing order of effort. Each one is a real, satisfying upgrade.

| Upgrade | What it adds | Where to start |
|---|---|---|
| **File persistence** | Codes survive restarts instead of vanishing | Save the two dicts to a JSON file on each change, load them on startup |
| **Custom aliases** | `shorten <url> <alias>` so users pick `/launch` | Add an optional third part to the command; reject it if the alias is taken |
| **A real web server** | Actual `http://localhost/aZ4` links that redirect | The stdlib `http.server`, or step up to Flask/FastAPI |
| **Unguessable codes** | Codes no one can walk through sequentially | Mix randomness into the counter, or hash + base62 the count |
| **Click counts** | Track how many times each link is followed | A third dict, `code -> count`, bumped in `resolve()` |

**File persistence** is the most rewarding first step - right now everything evaporates when the program stops. The standard-library `json` module turns your two dictionaries into a file and back:

```python
import json

def save(path="links.json"):
    with open(path, "w") as f:
        json.dump({"code_to_url": code_to_url, "url_to_code": url_to_code,
                   "counter": counter}, f)

def load(path="links.json"):
    global code_to_url, url_to_code, counter
    with open(path) as f:
        data = json.load(f)
    code_to_url = data["code_to_url"]
    url_to_code = data["url_to_code"]
    counter = data["counter"]
```

Call `load()` at startup (wrapped in a `try`/`except FileNotFoundError` for the first run) and `save()` after each `shorten()`. Now your links persist across restarts - the leap from a toy to something you'd actually keep.

**A real web server** is the upgrade that makes it feel like the real product. With `http.server` from the standard library you can answer `GET /aZ4` by looking up the code and returning an HTTP redirect to the long URL - at which point clicking your short link in a browser genuinely sends you somewhere. That's the moment it stops being a script and starts being a service.

## What you built

You started with a single sentence - a map from short code to long URL - and ended with a working program: a dictionary store, a base62 generator fed by a counter, `shorten()` and `resolve()` that handle the awkward cases, and a command loop to drive it. The same architecture, scaled up with a database and a web server, is what runs behind every short link you've ever clicked.

The mechanism was never the hard part. Now you've seen it bare, and you know exactly which dials to turn to take it further.
