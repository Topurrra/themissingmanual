---
title: "What to Actually Do With One"
guide: "what-an-error-message-tells-you"
phase: 3
summary: "The calm, repeatable method for resolving any error: read it literally top line first, find your line, reproduce it small, search the exact message, and rubber-duck when stuck. With a symptom-to-first-move cheat-card."
tags: [errors, debugging, troubleshooting, rubber-duck, searching-errors, beginner]
difficulty: beginner
synonyms: ["how to fix an error", "how to debug step by step", "how to search an error message", "what is rubber duck debugging", "how to reproduce a bug", "what to do when code throws an error"]
updated: 2026-06-19
---

# What to Actually Do With One

You can now read an error's anatomy and name its family. This phase is the part you'll use every single
day: a calm, repeatable *method* for turning an error into a fix. It's not magic and it's not luck - it's a
short checklist that the most experienced engineers run almost without thinking. The difference between
"stuck for an hour" and "fixed in five minutes" is almost never raw skill. It's having a method instead of
flailing.

## The cheat-card

> **Match what you're feeling or seeing to the row, then read the section under it.**

| The situation | Your first move |
|---|---|
| Wall of red text, panic rising | Find the **bottom line** (Python) or the **type + message** line - that's the headline (§1) |
| You read it but it's still gibberish | Translate it into plain English, one piece at a time (§1) |
| You don't know *where* in your code it is | Find the **first line that names a file you wrote** (§2) |
| The error only happens "sometimes" | **Reproduce it small** - shrink it to the minimum that triggers it (§3) |
| You understand it but don't know the fix | **Search the *exact* message** (minus your personal bits) (§4) |
| Search results are a sea of unrelated posts | Trim the query to the stable core of the message (§4) |
| You've stared for 20 minutes and you're stuck | **Rubber-duck it** - explain it out loud, line by line (§5) |
| The error is a long multi-line trace | That's a stack trace - see [Reading a Stack Trace](/guides/reading-a-stack-trace) |

The rest of this phase is the method behind those moves, in the order you'd actually run them.

## 1. Read it literally - the top line first

The error means *exactly* what it says - not a vague approximation, the literal thing. Your first job is to
read the headline (the type + message; the **bottom** line in a Python traceback, as covered in
[Phase 1](01-information-not-insult.md)) and translate it into a plain sentence, word by word.

```console
TypeError: Cannot read properties of undefined (reading 'price')
```

*What just happened:* Don't skim it as "some type thing." Read it literally: *"I cannot read the property
`price`, because the thing I tried to read it from was `undefined`."* That literal reading already tells you
the whole story - something you expected to be an object was empty, and you reached for `.price` on the
emptiness. The error wasn't being cryptic; you were reading it as a blur instead of as a sentence.

💡 **Key point.** Treat the message as English (or your language), not as noise. Read each word and ask
"what does *this word* mean here?" Half of all "I have no idea what this means" moments dissolve the instant
you read the message slowly instead of glancing at it.

## 2. Find *your* line

The error often lists several files - but many of them belong to libraries you didn't write. The line that
matters most is usually the **first one that points at a file you actually created.**

```console
Traceback (most recent call last):
  File "/usr/lib/python3.11/json/__init__.py", line 346, in loads
    return _default_decoder.decode(s)
  File "/usr/lib/python3.11/json/decoder.py", line 337, in decode
    obj, end = self.raw_decode(s, idx=...)
  File "checkout.py", line 12, in <module>
    data = json.loads(response)
json.decoder.JSONDecodeError: Expecting value: line 1 column 1 (char 0)
```

*What just happened:* The top frames are *inside Python's own `json` library* - that code is fine, you
didn't write it, don't go editing it. The frame that's **yours** is `checkout.py, line 12` - where *you*
called `json.loads(response)`. That's where your investigation starts: `response` apparently wasn't valid
JSON (the message says it expected a value at the very first character and found nothing). The library is
just reporting the problem your data caused.

⚠️ **Don't start debugging inside library code.** Beginners see the topmost file and try to fix code they've
never seen. Almost always, the bug is at *your* line, feeding bad input into code that's working correctly.
Scan down the list for the first file with *your* project's name on it. (When that list is long and tangled,
reading it properly is the skill in [Reading a Stack Trace](/guides/reading-a-stack-trace).)

## 3. Reproduce it small

An error you can trigger *on demand* is an error you can fix. An error that happens "randomly" is one you
don't understand *yet*. So before fixing, make it happen reliably - and as *small* as possible.

**What this means in real life.** Strip away everything that isn't needed to cause the error. Comment out
unrelated code. Replace live data with a hard-coded value that triggers it. Shrink a 200-line script to the
5 lines that still break. Each thing you remove that *doesn't* stop the error is a thing you've ruled out.

```console
$ python -c "print('Age: ' + 30)"
TypeError: can only concatenate str (not "int") to str
```

*What just happened:* Instead of re-running a giant program to study one error, you reproduced the exact
failure in a single line at the terminal (`python -c` runs the code you pass it). Now you can poke at it
freely - try `str(30)`, see it work - without the noise of everything else. Shrinking the problem until
only the broken part remains is, quietly, the core move of all debugging.

💡 **Key point.** "Reproduce it small" does double duty: it confirms you actually understand what triggers
the error, *and* it gives you a fast, isolated place to test your fix. If you can't reproduce it, you can't
be sure you've fixed it - you can only hope.

## 4. Search the *exact* message - and read the results

Most errors you'll hit, thousands of people have hit before you. Searching is a real skill, not cheating -
but *how* you search decides whether you find gold or garbage.

**Search the stable, generic part of the message - strip out your personal bits.** The error names *your*
file, *your* variable, *your* path. Those are unique to you and will wreck the search. Cut them out and keep
the part that's the same for everyone.

```text
   What you got:
     FileNotFoundError: [Errno 2] No such file or directory: 'data/sales_2026.csv'

   What to search (strip YOUR specifics):
     python FileNotFoundError [Errno 2] No such file or directory
                              └──── keep the stable core ────┘
     ✗ don't include  'data/sales_2026.csv'   ← that's yours; nobody else has it
```

*What just happened:* You kept the language (`python`) and the universal part of the error, and dropped your
private file name. Now you're searching for the *category* of problem, which is what other people wrote
about - not your one specific file, which no page on earth mentions.

**How to read a search result** - be a skeptic, in this order:

- **Match the error first.** Does the result's error text actually match yours, including the type? A
  similar-looking message from a different error type is a different problem.
- **Check it's your language/tool and roughly your version.** A fix for an old version, or for a different
  language with the same word, can send you down a rabbit hole.
- **Read the *accepted* / most-upvoted answer, and read *why* it works** - don't just paste the top code
  block. An answer you understand teaches you; an answer you blindly paste breaks again next week and you'll
  be just as lost.
- **Be wary of "just add this flag" with no explanation.** If a fix doesn't say *why*, you can't tell if it
  addresses your cause or merely silences the symptom.

⚠️ **Don't paste fixes you don't understand.** The fastest way to turn one bug into three is to copy a
snippet that "made the error go away" without knowing what it did. If you can't explain why the fix works,
you haven't fixed it - you've hidden it.

## 5. When to rubber-duck

If you've read it literally, found your line, reproduced it, and searched - and you're *still* stuck - the
problem is often that you've stopped actually *thinking* and started staring. The cure is almost silly, and
it genuinely works.

📝 **Terminology.** *Rubber-duck debugging* is explaining your problem, out loud and in full detail, to an
inanimate object (the classic is a rubber duck on your desk). The name is real and old in programming
culture - the point is that forcing yourself to narrate every step makes the gap obvious.

**Why it works.** When you explain your code *line by line, out loud,* you can't skip the step your brain
was silently assuming was fine. The moment you say "...and then this returns the user, and then I read the
name from the user..." you hear yourself and stop: *wait - does it actually return the user? What if the
lookup found nobody?* You just located the bug by being forced to state the thing you'd been taking for
granted. A real person works too, but the duck has no ego and is always free.

🪖 **War story.** Nearly every engineer has walked over to a teammate, said "hey, can I ask you something
about this error," started explaining it from the top - and then stopped mid-sentence with "...oh. Never
mind. I see it." That's rubber-ducking with a human, and the teammate didn't have to say a word. It happens
constantly. It's not embarrassing; it's the method working.

## The whole method, in order

```text
   1. READ it literally        → what does the headline actually say, word by word?
   2. FIND your line           → first file YOU wrote in the list
   3. REPRODUCE it small       → shrink to the minimum that still breaks
   4. SEARCH the exact message → strip your specifics; read results skeptically
   5. RUBBER-DUCK              → explain it out loud, line by line, until the gap shows
```

Run them in that order and most errors fall in minutes. Notice that *fixing* isn't even a separate step -
by the time you've truly read, located, reproduced, and understood the error, the fix is usually obvious.
The work was never the fix. The work was the understanding.

## Recap

1. **Read it literally** - the headline means exactly what it says; translate it word by word.
2. **Find your line** - the first file *you* wrote, not library code.
3. **Reproduce it small** - make it happen on demand, with the least code possible.
4. **Search the exact message** - strip your personal bits, keep the stable core, read results skeptically,
   and never paste a fix you can't explain.
5. **Rubber-duck** - explain it out loud line by line; the gap reveals itself.

You now have the full "A" of debugging: errors are information, they come in a few recognizable families,
and there's a calm method for any of them. The natural next step is the long, multi-line version of an
error - the **stack trace** - which is the same skill, scaled up.

**Where to go next.**
- **[Reading a Stack Trace](/guides/reading-a-stack-trace)** - when one error comes with a whole trail of
  files and line numbers, this is how you read the trail to the real cause.
- **[Reading Logs Without Drowning](/guides/reading-logs-without-drowning)** - when the error is buried in
  thousands of lines of output, how to find the signal in the noise.

---

[← Phase 2: The Common Error Families](02-common-families.md) · [Guide overview](_guide.md)
