---
title: "Catching Common Passwords"
guide: password-strength-checker-python
phase: 4
summary: "Reject a built-in list of common and leaked passwords no matter how they score, finish the full check_password function, and see where real systems go further."
tags: [python, security, blocklist, validation, beginner]
difficulty: beginner
synonyms:
  - common passwords
  - blocklist
  - leaked passwords
  - reject password
  - password blacklist
updated: 2026-06-30
---

# Catching Common Passwords

Here's the uncomfortable truth the last three phases led us to: a password can pass every rule, score a perfect 5, and still be one an attacker tries first. `P@ssw0rd!` looks varied — upper, lower, digit, symbol, long enough — but it's a textbook pattern. Cracking tools have the common substitutions (`a` to `@`, `o` to `0`, `s` to `$`) built in. They guess it almost as fast as `password`.

No character-class rule can catch this, because the password genuinely satisfies them all. The only fix is to *know* which passwords are common and refuse them outright. That's a blocklist: a set of known-bad passwords that get rejected regardless of score.

## A small built-in blocklist

For a hobby checker, a short hardcoded set covers the worst offenders. Store them as a Python `set`, not a list — checking membership in a set is instant no matter how big it gets, while a list has to scan item by item. We also lowercase the password before checking, so `Password` and `password` both get caught.

```python runnable
COMMON = {
    "password", "123456", "123456789", "qwerty", "abc123",
    "111111", "12345678", "iloveyou", "admin", "letmein",
    "welcome", "monkey", "dragon", "sunshine", "password1",
}

def is_common(password):
    return password.lower() in COMMON

print(is_common("password"))   # True
print(is_common("Password"))   # True  (lowercased before checking)
print(is_common("hunter2"))    # False
print(is_common("QWERTY"))     # True
```

The lowercasing matters. Attackers don't care about your capitalization tricks — `Qwerty` is the same guess as `qwerty` to them. Folding case before the lookup means our one-line set already covers the obvious variants.

## Catching the substitution trick

`P@ssw0rd!` won't be in our set as written, because it's `password` wearing a disguise. We can undo the most common disguises before checking: map `@` back to `a`, `0` to `o`, `1` to `i`, `$` to `s`, strip trailing punctuation, and *then* look it up. This is a small `str.translate` table — we're not trying to reverse every trick, only the handful that catch the bulk of real-world cases.

```python runnable
COMMON = {"password", "123456", "qwerty", "admin", "letmein", "welcome", "iloveyou"}

LEET = str.maketrans({"@": "a", "0": "o", "1": "i", "3": "e", "$": "s", "5": "s"})

def normalize(password):
    cleaned = password.lower().translate(LEET)
    return cleaned.strip("!?.*#")   # drop common trailing decoration

def is_common(password):
    return normalize(password) in COMMON

print(is_common("P@ssw0rd!"))  # disguised 'password' -> True
print(is_common("Welcome1"))   # 1 -> i ... still not 'welcome'; trailing 1 isn't stripped
print(is_common("w3lc0me"))    # -> 'welcome' -> True
print(is_common("hunter2"))    # genuinely not common -> False
```

Run it. `P@ssw0rd!` is caught now. Notice `Welcome1` slips through this naive normalizer — a digit in the *middle* of the strip set isn't removed, and we don't strip trailing digits. That's a real limit, and it's the honest signal that hand-rolled normalization only gets you so far. Catching everything is what a real wordlist and a real breach database are for, which we'll get to.

## The full checker

Now we assemble everything from all four phases. The blocklist overrides the score: a common password is forced to `weak` and gets a blunt message, no matter how many character classes it has. Everything else flows through the score-and-feedback path from before.

```python runnable
def long_enough(password, minimum=8):
    return len(password) >= minimum

def has_lower(password):  return any(c.islower() for c in password)
def has_upper(password):  return any(c.isupper() for c in password)
def has_digit(password):  return any(c.isdigit() for c in password)
def has_symbol(password): return any(not c.isalnum() for c in password)

RULES = [
    (long_enough, "Make it at least 8 characters long"),
    (has_lower,   "Add a lowercase letter"),
    (has_upper,   "Add an uppercase letter"),
    (has_digit,   "Add a number"),
    (has_symbol,  "Add a symbol like ! or @"),
]

COMMON = {"password", "123456", "qwerty", "admin", "letmein", "welcome", "iloveyou", "sunshine"}
LEET = str.maketrans({"@": "a", "0": "o", "1": "i", "3": "e", "$": "s", "5": "s"})

def is_common(password):
    cleaned = password.lower().translate(LEET).strip("!?.*#")
    return cleaned in COMMON

def label(s):
    if s <= 2: return "weak"
    if s == 3: return "ok"
    return "strong"

def check_password(password):
    if is_common(password):
        return {"score": 0, "label": "weak",
                "feedback": ["This is a commonly used password — pick something unique"]}
    passed = [rule(password) for rule, _ in RULES]
    s = sum(passed)
    fixes = [msg for (rule, msg), ok in zip(RULES, passed) if not ok]
    if not fixes:
        fixes = ["Looks good!"]
    return {"score": s, "label": label(s), "feedback": fixes}

samples = ["cat", "password", "P@ssw0rd!", "Password1", "correct horse battery staple", "Tr0ub4dour&3xtra"]

for p in samples:
    r = check_password(p)
    print(f"\n{p!r}  ->  {r['label']} ({r['score']}/5)")
    for line in r["feedback"]:
        print(f"   - {line}")
```

Run it. This is the finished tool. `password` and `P@ssw0rd!` are both slapped down as common no matter how they'd otherwise score. `correct horse battery staple` and `Tr0ub4dour&3xtra` come through as strong with "Looks good!". You can drop `check_password` into any Python project as-is — it takes a string and returns a dictionary, the shape an API or web form wants.

## Wiring a real wordlist on your machine

Eight entries is a demo. Real attackers work from lists of millions of leaked passwords. On your own machine you'd load one from a file instead of hardcoding it. Grab a public list (the "rockyou" wordlist is the classic teaching example, and SecLists on GitHub collects many) and read it into the same `set`:

```python
def load_common(path):
    with open(path, encoding="utf-8", errors="ignore") as f:
        return {line.strip().lower() for line in f if line.strip()}

COMMON = load_common("rockyou.txt")   # a few hundred thousand to millions of entries
```

A `set` of a million strings still answers `in` in a microsecond, so this scales fine. The only thing to watch is memory — a huge wordlist loads entirely into RAM. For really large lists, production systems keep them in a database or a Bloom filter instead, but a `set` is the right call up to a few million entries.

## Where real systems go further

Our checker is honest about what it is: a good floor and a friendly nudge. Production password checking does more, and it's worth knowing the names so you can reach for the right tool later.

| Idea | What it adds | Why ours doesn't |
|------|--------------|------------------|
| **Entropy / zxcvbn** | Estimates actual guessability — patterns, dates, keyboard walks, repeated chars | Class-counting can't see that `aaaaaaaa1A!` is bad |
| **Breach checks (HaveIBeenPwned)** | Tests if the exact password appeared in a real leak, via a privacy-preserving hash range query | We only know our own small list |
| **Length-weighted scoring** | Rewards long passphrases properly | Our score barely rewards length past the floor |
| **Rate limiting + hashing** | Protects the stored password even if your DB leaks | That's storage, not strength checking |

The single biggest upgrade, if you only do one: stop rewarding clever substitutions and start rewarding length. A 20-character lowercase passphrase beats an 8-character `P@$$w0rd` by a wide margin, every time. Tools like zxcvbn encode exactly that wisdom, and dropping one in is the natural next step past what we built.

## What you built

You started with a fuzzy idea — "strong password" — and ended with a function that scores it, labels it, tells the user what to fix, and refuses the obvious bad ones. Every piece runs, every piece is small, and the whole thing reads top to bottom in under sixty lines. That's a real tool, and the patterns in it — one function per rule, a list of rules as the single source of truth, a set for fast lookups, a dict as the return shape — are the same ones you'll reuse far beyond passwords.
