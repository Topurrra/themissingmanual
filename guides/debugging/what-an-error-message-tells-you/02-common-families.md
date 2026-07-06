---
title: "The Common Error Families"
guide: "what-an-error-message-tells-you"
phase: 2
summary: "Most errors you'll meet belong to a handful of families: syntax vs runtime errors, null/undefined, type mismatches, not-found, and permission denied. Recognize the family and you're halfway to the fix."
tags: [errors, debugging, syntax-error, runtime-error, null, type-error, beginner]
difficulty: beginner
synonyms: ["types of programming errors", "syntax error vs runtime error", "what is a null pointer error", "what does undefined mean", "file not found error", "permission denied error", "what is a type error"]
updated: 2026-06-19
---

# The Common Error Families

You're not facing infinite different errors - just a small number of *families*, dressed in different words
each time. Recognize the family from the type and message, and you already know roughly what went wrong
and where to look, like a doctor hearing "sharp pain when you breathe in" pointing to a category before the
exact diagnosis.

## The first fork: syntax errors vs runtime errors

One big split tells you *when* things went wrong, which changes how you hunt.

**Syntax errors - "I can't even read this."** You wrote something the language *cannot parse* - a missing
bracket, a stray comma, a misspelled keyword. The grammar didn't make sense, so it gave up **before running
a single line.** Nothing runs. The *friendly* kind of failure: caught instantly, almost always a small typo
near the spot it names.

```console
$ python app.py
  File "app.py", line 4
    if user == "admin"
                      ^
SyntaxError: expected ':'
```

*What just happened:* Python expected a colon after the `if` condition, didn't find one, and refused to go
further - `^` points at where it gave up. Fix: add the `:` - `if user == "admin":`. It never *ran* your
program; it couldn't get past reading it.

**Runtime errors - "I read it fine, but then something went wrong while doing it."** Grammar valid, so it
started executing - then hit something impossible partway through: a missing value, a missing file, a
number divided by zero. It starts, does some work, then crashes at the bad moment; the output before the
crash shows how far it got.

```console
$ python app.py
Starting up...
Traceback (most recent call last):
  File "app.py", line 8, in <module>
    average = total / count
              ~~~~~~^~~~~~~
ZeroDivisionError: division by zero
```

*What just happened:* The code ran fine, even printing `Starting up...`, until line 8 divided by `count`,
which was `0` this time - and dividing by zero is undefined. The crash is about the *data* it met along the
way, not the grammar.

💡 **Key point.** Syntax error = couldn't *read* your code (nothing ran; look for a typo near the named
line). Runtime error = read fine, went wrong *while running* (look at the data and conditions at that
line). This tells you whether you're hunting a typo or a bad value.

The runtime families you'll meet most.

## Family 1: null / undefined - "nothing where I expected something"

The most common runtime error in the world. You asked for something - a property, a value, an item - and
what was actually there was *nothing*: `null`, `None`, `undefined`, `nil`, depending on the language. You
used that nothing as if it were real: expected a user object, but the variable held nothing, and reaching
for `user.name` crashed because nothing has no `.name`.

```console
TypeError: Cannot read properties of null (reading 'name')
```
```console
AttributeError: 'NoneType' object has no attribute 'name'
```

*What just happened:* Both lines (JavaScript, then Python) say the same thing: the value you reached into
was empty. The fix is rarely at the crash line - it's *upstream*: figure out **why** the value was empty
(a failed lookup? a function returning nothing? data that never arrived?).

⚠️ **The crash location is the symptom, not the cause.** Null/undefined errors point at where you *used*
the emptiness, but the real bug is wherever the value *became* empty. Ask "why was this nothing?" rather
than just guarding the crash line.

## Family 2: type mismatches - "that's the wrong kind of thing"

You gave an operation a value of a type it can't work with: adding a number to text, calling something
that isn't a function, indexing into something that isn't a list. Often the data arrived in an unexpected
shape - like a number that came in as text from a form or file.

```console
$ node total.js
TypeError: amount.toFixed is not a function
```

*What just happened:* `.toFixed()` is a method *numbers* have, but `amount` was probably a string like
`"19.99"`, and strings don't have `.toFixed`. `is not a function` is the classic tell you called a method
on a value that doesn't have it. Fix: convert the value to the right type first.

📝 **Terminology.** A *type* is the kind of value something is - number, string, list, boolean. Type
mismatches are the computer enforcing that you don't accidentally treat one kind as another.

## Family 3: not-found - "I looked for it and it isn't there"

You referred to something by name or path, and it doesn't exist where you pointed. "Something" can be a
*file*, a *module/package*, a *key*, a *variable*, a *column* - anything addressed by name. Usually the
cause is one of three things: a typo, a wrong path or working directory, or a thing you forgot to
create/install.

```console
$ python report.py
FileNotFoundError: [Errno 2] No such file or directory: 'data/sales.csv'
```

*What just happened:* The program tried to open `data/sales.csv` and there's no such file *at the place it
looked*. Often the file exists but you're running from a different folder, so the relative path points
somewhere empty. First check: does the file exist, and are you in the directory you expect? (`ls` / `dir`
shows what's actually around you.)

Same family, different costume - a missing *package*:

```console
$ python app.py
ModuleNotFoundError: No module named 'requests'
```

*What just happened:* Your code said `import requests`, but the package isn't installed. Same family,
different fix: `pip install requests`. One more flavor, a missing *key*:

```console
KeyError: 'email'
```

*What just happened:* You asked a dictionary for key `'email'`, and there's no such key - maybe the data
lacked an email, or it's spelled `'e-mail'` or `'Email'`. Same family: *named thing, not present.*

⚠️ **"Not found" almost always means one of: typo, wrong location, or not-yet-created.** Run through those
three before assuming anything deeper is wrong - nine times out of ten it's one of them.

## Family 4: permission denied - "you're not allowed to do that"

The thing *exists* and your request *makes sense* - but the OS (or a service) refused to let you do it:
write to that folder, open that file, bind to that port, access that resource. Common on shared machines,
system folders, protected files, or reserved ports.

```console
$ ./deploy.sh
bash: ./deploy.sh: Permission denied
```

*What just happened:* `deploy.sh` is there and the path is right - but it isn't marked *executable*, so it
won't run. A *permissions* problem, not a *not-found* one. (Fix: `chmod +x deploy.sh` - the real skill is
knowing "Permission denied" is a *rights* issue, not a typo.)

💡 **Key point.** "Permission denied" differs fundamentally from "not found." Not-found means *the thing
isn't there*; permission-denied means *it's there but you can't touch it that way.* Knowing which one you
got saves you hunting for a missing file when the real issue is access.

## How the families connect to the anatomy

The **error type** (from [Phase 1](01-information-not-insult.md)) told you the family; the **message** told
you the specifics: `FileNotFoundError` → not-found → "which file? where am I running from?"
`TypeError: ... not a function` → type-mismatch → "what type is this really?" Type names the family,
message names the case.

## Recap

1. **First fork:** syntax error (couldn't *read* your code - nothing ran, look for a typo) vs runtime error
   (ran fine, then hit bad data or a missing thing).
2. **Null/undefined** - nothing where you expected something; the cause is *upstream* of the crash line.
3. **Type mismatch** - the wrong *kind* of value for the operation; usually data arrived in an unexpected
   shape.
4. **Not-found** - a named thing (file, module, key, variable) isn't there; check typo, location,
   not-yet-created.
5. **Permission denied** - the thing exists but you're not *allowed*; an access problem, not a missing one.
6. The **type names the family; the message names the case.** Recognize the family first.

Now you can read an error and recognize its anatomy and its family. The last phase covers the calm,
repeatable *method* for resolving one.

---

[← Phase 1: An Error Is Information](01-information-not-insult.md) · [Phase 3: What to Actually Do With One →](03-what-to-do.md)
