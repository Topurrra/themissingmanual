---
title: "Turning Rules into a Score"
guide: password-strength-checker-python
phase: 2
summary: "Combine the five rule results into a single 0–5 score and a weak/ok/strong label that a person can read at a glance."
tags: [python, scoring, validation, security, beginner]
difficulty: beginner
synonyms:
  - password score
  - strength score
  - password rating
  - score password
  - password label
updated: 2026-07-16
---

# Turning Rules into a Score

Last phase left us reading a row of `True`/`False` by eye. That's fine for five passwords and useless for a real form. We need one number that sums it all up, and one word that tells a tired user where they stand.

The plan is small: run all five rules, count how many passed, and call that count the score. Five rules means a score from 0 to 5. Then map ranges of that score to a label - `weak`, `ok`, `strong` - so the number means something without explanation.

## Counting the passes

Bring the rules along (every runnable block here starts fresh, so we redefine them - that's normal). Now write `score`: run all five rules against the password and return how many of them passed.

**Your turn.** This is the point of the phase, so have a go before you read on. Fill it in and hit Run: the checks underneath tell you whether it works. My version is in the next block whenever you want it.

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

def score(password):
    # Run all five rules against `password` and return how many
    # of them passed, as an integer from 0 to 5.
    pass


# --- checks: fix your function until this prints "All good." ---
assert score("cat") == 1, f"'cat' should score 1, got {score('cat')}"
assert score("password") == 2, f"'password' should score 2, got {score('password')}"
assert score("Password1") == 4, f"'Password1' should score 4, got {score('Password1')}"
assert score("P@ssw0rd!") == 5, f"'P@ssw0rd!' should score 5, got {score('P@ssw0rd!')}"
print("All good.")
```

Stuck? `True` and `False` are numbers in Python (`1` and `0`). There's a built-in that adds up a sequence of numbers without a loop or a counter variable.

### One way to write it

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

def score(password):
    rules = [long_enough, has_lower, has_upper, has_digit, has_symbol]
    return sum(rule(password) for rule in rules)

print(score("cat"))         # only lower passes -> 1
print(score("password"))    # long + lower      -> 2
print(score("Password1"))   # long+lower+upper+digit -> 4
print(score("P@ssw0rd!"))   # all five          -> 5
```

The trick is that `True` is `1` and `False` is `0` in Python, so you can `sum()` a list of booleans and get the count of true ones for free. No counter variable, no loop with `+= 1`. If you wrote a `for` loop with a counter that goes up by one each time a rule passes, that works exactly as well - `sum` just gets there in one line instead of four.

Putting the rules in a list and looping over them is what keeps `score` short. Want a sixth rule someday? Add it to the list. The `sum` line never changes. That's the difference between code that grows cleanly and code that turns into a wall of `if`.

## From number to word

A 0-to-5 number is precise but cold. People want a verdict. So we slice the range: 0–2 is `weak`, 3 is `ok`, 4–5 is `strong`. Where you draw those lines is a judgment call - this split says "you need more than the bare basics to be ok, and you need length plus variety to be strong". Adjust to taste; it's three numbers in one function.

Before you run this, guess which score is the first one to earn "strong". Then check.

```python runnable
def label(score_value):
    if score_value <= 2:
        return "weak"
    if score_value == 3:
        return "ok"
    return "strong"

for s in range(6):           # try every possible score 0..5
    print(s, "->", label(s))
```

Notice we looped `range(6)` instead of hand-checking each case. When a function maps inputs to outputs, the fastest way to trust it is to feed it every input it can ever get and read the whole table at once. Here there are only six, so we see all of them.

## Score and label together

Now the two halves meet. We compute the score, hand it to `label`, and print both for each sample. This is the heart of any password meter - the colored bar you've seen is doing exactly this underneath.

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

def score(password):
    rules = [long_enough, has_lower, has_upper, has_digit, has_symbol]
    return sum(rule(password) for rule in rules)

def label(score_value):
    if score_value <= 2:
        return "weak"
    if score_value == 3:
        return "ok"
    return "strong"

samples = ["cat", "password", "sunshine", "Password1", "P@ssw0rd!", "correct horse battery staple"]

for p in samples:
    s = score(p)
    bar = "#" * s + "." * (5 - s)   # a tiny text strength bar
    print(f"{p!r:32} [{bar}] {s}/5  {label(p) if False else label(s)}")
```

Run it. You get a little ASCII strength bar plus the verdict - the same information a real signup form shows, drawn in characters instead of pixels.

## A wrinkle worth seeing

Look closely at the output and something should bug you. `"correct horse battery staple"` - a long, memorable passphrase that's genuinely hard to crack - scores lower than `"P@ssw0rd!"`, a short string a cracking tool guesses fast. Our score rewards *variety of character types* and barely rewards *length*. Real cracking difficulty depends far more on length and unpredictability than on whether you remembered to add a `$`.

We won't rebuild the whole scoring model here - for a beginner checker, "more character classes plus a length floor" is a straightforward, common heuristic, and it's what most forms actually do. But keep that wrinkle in mind. In the final phase we'll add the one thing that fixes the worst false-positives: catching passwords that are common no matter how they score.

## Try it yourself

- Add `"aB3"` to the samples - short but uses three classes. Watch it score 3 (`ok`) despite being three characters. That's a real flaw in pure class-counting, and it's why the length rule is a *floor* you should weight heavily.
- Change `label` so 5 returns `"excellent"` and 4 returns `"strong"`. One edit, and every sample re-grades. That's the value of keeping the label logic in its own function.

Next phase: instead of a label, we tell the user what to actually *do* - "add a number", "make it longer" - built straight from the rules that failed.
