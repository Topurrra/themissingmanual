---
title: "Useful Feedback"
guide: password-strength-checker-python
phase: 3
summary: "Turn the failed rules into a short list of plain-language fixes - \"add a symbol\", \"make it longer\" - instead of a bare score."
tags: [python, feedback, validation, security, beginner]
difficulty: beginner
synonyms:
  - password feedback
  - password suggestions
  - what to fix password
  - password hints
  - improve password
updated: 2026-06-30
---

# Useful Feedback

A score tells someone *where they are*. It doesn't tell them *what to do next*. "Your password is weak (2/5)" is the digital equivalent of a shrug. The useful version is: "Make it longer. Add an uppercase letter. Add a symbol." Three concrete actions, and the user is unstuck.

Good news - we already did the hard part. Each failed rule maps to exactly one fix. The length rule failed? "Make it longer." The symbol rule failed? "Add a symbol." This phase is mostly bookkeeping: pair every rule with the sentence the user should see when that rule fails, then collect the sentences for the rules that didn't pass.

## Pairing rules with advice

The clean way to do this is a list of `(rule_function, message)` pairs. We walk the list, run each rule, and whenever a rule returns `False` we keep its message. The result is a list of fixes - empty if the password passed everything.

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

def feedback(password):
    checks = [
        (long_enough, "Make it at least 8 characters long"),
        (has_lower,   "Add a lowercase letter"),
        (has_upper,   "Add an uppercase letter"),
        (has_digit,   "Add a number"),
        (has_symbol,  "Add a symbol like ! or @"),
    ]
    return [message for rule, message in checks if not rule(password)]

print(feedback("PASSWORD"))     # missing lower, digit, symbol
print(feedback("Password1!"))   # passes everything -> []
```

Read the `feedback` function once and the whole design clicks. It's a list comprehension that keeps a message only when its rule fails (`if not rule(password)`). One pass, no flags, no nested `if`. Add a rule to the `checks` list and its advice shows up automatically - same pattern as the score in the last phase, which is the point: the rules are the single source of truth and everything hangs off them.

## When there's nothing to fix

Notice `feedback("Password1!")` returns an empty list. That's not a bug, it's information: an empty list means "nothing to fix". When we print results we'll translate that into a friendly "Looks good!" rather than showing the user a blank space. Handling the empty case on purpose is the difference between code that feels finished and code that feels half-done.

## Feedback for every sample

Let's run it over a spread of passwords and print each one's fixes as a tidy list. This is what you'd render under a password field as the user types.

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

def feedback(password):
    checks = [
        (long_enough, "Make it at least 8 characters long"),
        (has_lower,   "Add a lowercase letter"),
        (has_upper,   "Add an uppercase letter"),
        (has_digit,   "Add a number"),
        (has_symbol,  "Add a symbol like ! or @"),
    ]
    return [message for rule, message in checks if not rule(password)]

samples = ["cat", "password", "PASSWORD", "Password1", "P@ssw0rd!", "correct horse battery staple"]

for p in samples:
    fixes = feedback(p)
    print(f"\n{p!r}")
    if not fixes:
        print("  Looks good!")
    else:
        for fix in fixes:
            print(f"  - {fix}")
```

Run it. Each password gets a little checklist. `"cat"` gets a stack of fixes; `"correct horse battery staple"` gets "Looks good!" because a long lowercase passphrase clears the length floor and the lowercase class - which matters more than scattering symbols around. The feedback is now something a real human can act on in five seconds.

## Folding score, label, and feedback together

We now have all three outputs - score, label, feedback. Here's a preview of the combined result, the shape we'll finish in the last phase. We return a dictionary so a caller (a web form, an API) can pick out whatever piece it needs.

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

def label(score_value):
    if score_value <= 2: return "weak"
    if score_value == 3: return "ok"
    return "strong"

def check_password(password):
    passed = [rule(password) for rule, _ in RULES]
    s = sum(passed)
    fixes = [msg for (rule, msg), ok in zip(RULES, passed) if not ok]
    return {"score": s, "label": label(s), "feedback": fixes}

for p in ["password", "Password1", "P@ssw0rd!"]:
    print(p, "->", check_password(p))
```

We pulled the rule list out to a module-level `RULES` so both the score and the feedback read from the same source - no chance of them disagreeing. We run each rule once into `passed`, then reuse that list for both the count and the messages. Running the rules twice would be wasteful and, worse, a place for the score and the advice to drift apart.

## Try it yourself

- Reword a message. Change "Add a number" to "Throw in a digit or two". The fix flows straight to the output - copy lives in one place.
- Add a password with a leading space like `" hunter2"`. It passes `has_symbol` (the space) - a reminder that our symbol rule is permissive on purpose.

There's still a hole, and it's a big one. `"P@ssw0rd!"` scores 5 and gets "Looks good!" - but it's one of the most-guessed passwords on earth. No rule we've written can catch it, because it genuinely passes all of them. The fix isn't another rule; it's a blocklist. That's the final phase.
