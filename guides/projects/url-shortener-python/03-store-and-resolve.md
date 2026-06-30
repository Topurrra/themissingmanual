---
title: "Store and Resolve"
guide: url-shortener-python
phase: 3
summary: "Join the store and the generator into shorten() and resolve(), handling unknown codes and the same URL submitted twice."
tags: [python, functions, resolve, edge-cases, beginner]
difficulty: beginner
synonyms:
  - shorten and resolve
  - lookup function
  - handle unknown code
  - deduplicate urls
  - end to end demo
updated: 2026-06-30
---

# Store and Resolve

You've got the two halves now: a dictionary store (Phase 1) and a base62 code generator (Phase 2). This phase joins them into the two functions a shortener lives or dies by - `shorten()` and `resolve()` - and deals with the messy real-world cases that a naive version gets wrong.

## The two functions

`shorten(long_url)` takes a long URL, mints the next code, files the pair, and returns the code.

`resolve(code)` takes a code and returns the long URL it points to - or tells you it doesn't know that code, without crashing.

Here's the first honest version. Run it end to end:

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

# state: the store, plus the counter that feeds the generator
store = {}
counter = 0

def shorten(long_url):
    global counter
    code = encode(counter)
    store[code] = long_url
    counter += 1
    return code

def resolve(code):
    return store.get(code, None)   # None instead of a crash on a miss

# take three URLs for a spin
a = shorten("https://example.com/articles/the-long-one")
b = shorten("https://docs.python.org/3/library/index.html")
c = shorten("https://example.com/pricing")

print("Codes minted:", a, b, c)
print("Resolve", a, "->", resolve(a))
print("Resolve", b, "->", resolve(b))
print("Resolve", c, "->", resolve(c))
```

Run it. Three URLs go in, three short codes come back (`0`, `1`, `2`), and each code resolves to the right URL. That's a working shortener. The `global counter` line lets `shorten()` advance the shared counter that lives outside the function - without it, Python would treat `counter` as a brand-new local and the codes would never move past `0`.

## Edge case one: an unknown code

Someone will hand you a code you never minted - a typo, a guess, a link you've since dropped. `resolve()` already handles it: `store.get(code, None)` returns `None` on a miss instead of raising `KeyError`. But returning `None` and *acting* on it are different things. The caller needs to notice the miss and say something useful.

```python runnable
store = {"0": "https://example.com/real-link"}

def resolve(code):
    return store.get(code, None)

for code in ["0", "zzz", "99"]:
    url = resolve(code)
    if url is None:
        print(f"{code!r}: unknown code - no such link")
    else:
        print(f"{code!r}: -> {url}")
```

Run it. The real code resolves; the two bogus ones report "unknown code" and the program keeps running. That `if url is None` check is the difference between a service that shrugs off bad input and one that 500s on it.

## Edge case two: the same URL twice

Here's the one people miss. Submit the same long URL twice and the naive version mints two different codes for it:

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

store, counter = {}, 0
def shorten(long_url):
    global counter
    code = encode(counter); store[code] = long_url; counter += 1
    return code

first  = shorten("https://example.com/pricing")
second = shorten("https://example.com/pricing")   # exact same URL
print("First time: ", first)
print("Second time:", second)
print("Two codes for one URL?", first != second)
```

Run it and you'll see two different codes - `0` and `1` - for the identical URL. Whether that's a bug depends on what you want. It's harmless (both codes resolve correctly), but it wastes codes and means you can't tell a user "you already shortened this." Most real shorteners return the *existing* code when they recognize a URL.

Fixing it needs a second lookup - URL back to code - so we can check "have I seen this URL before?" A second dictionary, keyed the other way, does it:

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

code_to_url = {}   # code -> url   (for resolve)
url_to_code = {}   # url  -> code  (for dedup)
counter = 0

def shorten(long_url):
    global counter
    if long_url in url_to_code:        # seen it? hand back the old code
        return url_to_code[long_url]
    code = encode(counter)
    code_to_url[code] = long_url
    url_to_code[long_url] = code
    counter += 1
    return code

def resolve(code):
    return code_to_url.get(code, None)

first  = shorten("https://example.com/pricing")
second = shorten("https://example.com/pricing")   # same URL again
other  = shorten("https://example.com/about")

print("First time: ", first)
print("Second time:", second, "(same as first?", first == second, ")")
print("Different URL:", other)
print("Resolve", first, "->", resolve(first))
```

Run it. The repeated URL now comes back with the *same* code both times, while a genuinely new URL gets a fresh one. The `if long_url in url_to_code` check is the whole fix - one membership test before minting.

## Where we are

`shorten()` and `resolve()` work together, unknown codes are handled without crashing, and the same URL twice returns one code. That's a complete shortener - the logic is done. What it lacks is a way for a person to *use* it without editing the source. In Phase 4 we wrap it in a small command loop so you can type URLs at it and get codes back, then map out where to take the project once it's off the page.
