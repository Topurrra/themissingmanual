---
title: "The Rules"
guide: password-strength-checker-python
phase: 1
summary: "Write one small function per password rule - length and the four character classes - and test them on sample passwords."
tags: [python, validation, security, functions, beginner]
difficulty: beginner
synonyms:
  - password rules
  - character classes
  - check password requirements
  - validate password
  - password conditions
updated: 2026-07-16
---

# The Rules

Before we can score a password we have to decide what we're even measuring. "Strong" is a feeling. Code can't act on a feeling. So we turn it into a handful of yes/no questions, one function each:

- Is it long enough?
- Does it contain a lowercase letter?
- An uppercase letter?
- A digit?
- A symbol (anything that isn't a letter or digit)?

Five questions. Five tiny functions. Each one takes a password and returns `True` or `False`. That's the whole phase. Keeping them separate matters - later we'll count how many passed, and we'll tell the user which one failed. If we mashed them into one big check we couldn't do either.

## One rule at a time

Start with length. Pick a minimum and compare. People love arguing about the number; we'll use 8, because it's the lowest bar most real systems accept. You can change it later in one place.

```python runnable
def long_enough(password, minimum=8):
    return len(password) >= minimum

print(long_enough("cat"))          # too short
print(long_enough("correcthorse")) # plenty long
print(long_enough("12345678"))     # exactly 8 -> True
```

See how the function says nothing about whether `12345678` is a *good* password? It only answers the one question it was asked. That's deliberate. Each rule stays dumb and plain; the smarts come from combining them.

## Checking for a kind of character

Now the character classes. We need to know if a password contains *at least one* lowercase letter, uppercase letter, and digit. Python strings have methods that test a single character: `"a".islower()`, `"A".isupper()`, `"5".isdigit()`. We loop over the password and ask if *any* character passes.

`any(...)` is the right tool here. It walks a sequence and returns `True` the moment one item is true, `False` if none are. Compare that to writing a loop with a flag variable - `any` says what we mean in one line.

```python runnable
def has_lower(password):
    return any(c.islower() for c in password)

def has_upper(password):
    return any(c.isupper() for c in password)

def has_digit(password):
    return any(c.isdigit() for c in password)

print(has_lower("ABC123"))  # no lowercase -> False
print(has_upper("ABC123"))  # has A B C    -> True
print(has_digit("ABC123"))  # has 1 2 3    -> True
print(has_digit("abcdef"))  # no digits    -> False
```

## The tricky one: symbols

A symbol is "not a letter, not a digit". You could try to list every symbol - `!@#$%...` - but you'll forget some, and different keyboards have different ones. Don't enumerate.

**Your turn.** Write `has_symbol` yourself: it should return `True` if the password has at least one character that is neither a letter nor a digit. Fill in the function and hit Run - the checks underneath tell you whether it works. My version is in the next block whenever you want it.

```python runnable
def has_symbol(password):
    # Return True if `password` has at least one character that is
    # neither a letter nor a digit (that's a "symbol", including
    # punctuation and spaces).
    pass


# --- checks: fix your function until this prints "All good." ---
assert has_symbol("abc123") == False, f"'abc123' has no symbols, got {has_symbol('abc123')}"
assert has_symbol("abc-123") == True, f"the dash is a symbol, got {has_symbol('abc-123')}"
assert has_symbol("hi there") == True, f"the space counts as a symbol, got {has_symbol('hi there')}"
assert has_symbol("p@ssw0rd") == True, f"the @ is a symbol, got {has_symbol('p@ssw0rd')}"
print("All good.")
```

Stuck? Python has one string method that tells you if a character IS a letter-or-digit, in one shot. Negate it and you never have to list a single symbol.

### One way to write it

```python runnable
def has_symbol(password):
    return any(not c.isalnum() for c in password)

print(has_symbol("abc123"))    # all letters/digits -> False
print(has_symbol("abc-123"))   # the dash           -> True
print(has_symbol("hi there"))  # the space counts    -> True
print(has_symbol("p@ssw0rd"))  # the @              -> True
```

Define a symbol as *the absence of letter-and-digit-ness*. A character is a symbol if it isn't alphanumeric: `not c.isalnum()`.

One catch: a space is also "not alphanumeric", and so is a tab. For a password checker that's fine - a space is a perfectly good password character and many people use passphrases with spaces. So we'll count anything non-alphanumeric, including spaces, as a symbol. If you ever want to exclude spaces, that's a one-line change you can see in the code.

## All five rules together

Here's everything from this phase in one block, run against a small set of sample passwords so you can see the rules light up differently for each. This is the first time you'll feel the whole picture: weak passwords fail most rules, strong ones pass most.

Before you run this, guess which sample fails the most rules and which one fails none. Then check.

```python runnable
def long_enough(password, minimum=8):
    return len(password) >= minimum

def has_lower(password):
    return any(c.islower() for c in password)

def has_upper(password):
    return any(c.isupper() for c in password)

def has_digit(password):
    return any(c.isdigit() for c in password)

def has_symbol(password):
    return any(not c.isalnum() for c in password)

samples = ["cat", "password", "Password1", "P@ssw0rd!", "correct horse battery"]

for p in samples:
    print(f"{p!r:26}  long={long_enough(p)!s:5} lower={has_lower(p)!s:5} "
          f"upper={has_upper(p)!s:5} digit={has_digit(p)!s:5} symbol={has_symbol(p)}")
```

Run it. Look at the table. `"cat"` fails almost everything. `"P@ssw0rd!"` passes everything - even though, as we'll see in the last phase, it's a terrible password that any cracking tool guesses in seconds. That gap is the lesson of this whole project: passing the rules and being safe are not the same thing. The rules are a floor, not a guarantee.

## Try it yourself

Edit the `samples` list. Add your own passwords (don't use real ones). Watch which rules pass. A few things worth poking at:

- Add `"12345678"`. It's long but fails every character class except `digit`. The rules already tell you it's lopsided.
- Lower the `minimum` to 6 in `long_enough` and notice nothing else has to change - that's the payoff of one function per rule.

Next phase we stop reading a table of booleans by eye and let the code do the judging: we'll turn these five `True`/`False` answers into a single score and a label.
