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

The good news that nobody tells beginners: you are not facing infinite different errors. You're facing a
small number of *families*, dressed in slightly different words each time. Once you can recognize the
family from the error's type and message, you already know roughly what went wrong and where to look -
before you understand the specific case.

Think of it like a doctor hearing symptoms. "Sharp pain when you breathe in" points to a category long
before the exact diagnosis. Error families work the same way. Here are the ones you'll meet again and
again.

## The first fork: syntax errors vs runtime errors

Before the specific families, there's one big split that tells you *when* things went wrong - and that
changes how you hunt.

**Syntax errors - "I can't even read this."**

**What it actually is.** A syntax error means you wrote something the language *cannot parse* - a missing
bracket, a stray comma, a misspelled keyword. The language tried to *read* your code and the grammar
didn't make sense, so it gave up **before running a single line.**

**What it does in real life.** Nothing runs at all. The program doesn't start. This is actually the
*friendly* kind of failure: it's caught instantly, and it's almost always a small typo near the spot it
names.

```console
$ python app.py
  File "app.py", line 4
    if user == "admin"
                      ^
SyntaxError: expected ':'
```

*What just happened:* Python read line 4, expected a colon after the `if` condition (that's the grammar
rule for an `if`), didn't find one, and refused to go further. The `^` points at where it gave up
expecting. The fix is to add the `:` - `if user == "admin":`. Notice it never *ran* your program; it
couldn't get past reading it.

**Runtime errors - "I read it fine, but then something went wrong while doing it."**

**What it actually is.** A runtime error happens *while the program is running.* The grammar was valid, so
it started executing - and then hit something impossible partway through: a value that was missing, a file
that wasn't there, a number divided by zero.

**What it does in real life.** Your program *starts*, does some work, then crashes at the bad moment. The
output you got *before* the crash is a clue about how far it got.

```console
$ python app.py
Starting up...
Traceback (most recent call last):
  File "app.py", line 8, in <module>
    average = total / count
              ~~~~~~^~~~~~~
ZeroDivisionError: division by zero
```

*What just happened:* The code was grammatically fine, so it ran - it even printed `Starting up...`. Then
at line 8 it tried to divide by `count`, which happened to be `0` this time, and dividing by zero is
undefined, so it stopped. The `Starting up...` line tells you it got past the early code; the crash is
specifically about the *data* it met along the way.

💡 **Key point.** Syntax error = the language couldn't *read* your code (nothing ran; look for a typo near
the named line). Runtime error = it read fine but something went wrong *while running* (look at the data
and conditions at that line). This single distinction tells you whether you're hunting a typo or hunting a
bad value.

Now, the runtime families you'll meet most.

## Family 1: null / undefined - "nothing where I expected something"

**What it actually is.** This is the most common runtime error in the world. You asked for something -
a property, a value, an item - and what was actually there was *nothing*: `null`, `None`, `undefined`,
`nil`, depending on the language. Then you tried to *use* that nothing as if it were a real thing, and it
fell over.

**What it does in real life.** You expected, say, a user object, but the variable held nothing, and the
moment you reached for `user.name`, the program crashed because nothing has no `.name`.

```console
TypeError: Cannot read properties of null (reading 'name')
```
```console
AttributeError: 'NoneType' object has no attribute 'name'
```

*What just happened:* Both lines (the first JavaScript, the second Python) are saying the identical thing:
*the value you reached into was empty, so the thing you asked it for doesn't exist.* The fix is rarely at
the crash line itself - it's *upstream*: figure out **why** that value was empty when you expected it to be
filled. (Did a lookup fail? Did a function return nothing? Did the data never arrive?)

⚠️ **The crash location is the symptom, not the cause.** Null/undefined errors point at where you *used*
the emptiness, but the real bug is wherever the value *became* empty. Train yourself to ask "why was this
nothing?" rather than just guarding the crash line.

## Family 2: type mismatches - "that's the wrong kind of thing"

**What it actually is.** You gave an operation a value of a type it can't work with: adding a number to
text, calling something that isn't a function, indexing into something that isn't a list. The types don't
line up with what the operation needs.

**What it does in real life.** Often it's data arriving in a shape you didn't expect - a number that came
in as text from a form or a file, for instance.

```console
$ node total.js
TypeError: amount.toFixed is not a function
```

*What just happened:* `.toFixed()` is a method that *numbers* have, but `amount` wasn't a number here - it
was probably a string like `"19.99"` read from somewhere, and strings don't have `.toFixed`. The message
`is not a function` is the classic tell that you called a method on a value that doesn't have it. The fix
is to make the value the right type first (convert the string to a number).

📝 **Terminology.** A *type* is the kind of value something is - a number, a string (text), a list, a
true/false (boolean), and so on. Type mismatches are the computer enforcing that you don't accidentally
treat one kind as another.

## Family 3: not-found - "I looked for it and it isn't there"

**What it actually is.** You referred to something by name or path, and it doesn't exist where you pointed.
This family is huge because "something" can be a *file*, a *module/package*, a *key* in a dictionary, a
*variable*, a *column* in a database - anything you address by name.

**What it does in real life.** Usually one of three things: a typo in the name, a wrong path or working
directory, or a thing you forgot to create/install.

```console
$ python report.py
FileNotFoundError: [Errno 2] No such file or directory: 'data/sales.csv'
```

*What just happened:* The program tried to open `data/sales.csv` and there's no such file *at the place it
looked*. Often the file exists but you're running the command from a different folder than you think, so
the relative path `data/sales.csv` points somewhere empty. First check: does the file exist, and are you
in the directory you expect? (Run `ls` / `dir` to see what's actually around you.)

Here's the same family wearing a different costume - a missing *package* instead of a missing file:

```console
$ python app.py
ModuleNotFoundError: No module named 'requests'
```

*What just happened:* Your code said `import requests`, but the `requests` package isn't installed in this
environment. Same family - "looked for it by name, not there" - different fix: install it
(`pip install requests`). And one more flavor, a missing *key*:

```console
KeyError: 'email'
```

*What just happened:* You asked a dictionary for the value at key `'email'`, and there's no such key in it.
Maybe the data didn't include an email, or maybe it's spelled `'e-mail'` or `'Email'`. The family is the
same: *named thing, not present.*

⚠️ **"Not found" almost always means one of: typo, wrong location, or not-yet-created.** Run through those
three before assuming anything deeper is wrong. Nine times out of ten it's one of them.

## Family 4: permission denied - "you're not allowed to do that"

**What it actually is.** The thing *exists* and your request *makes sense* - but the operating system (or a
service) refused to let you do it. You don't have the rights: to write to that folder, to open that file,
to bind to that network port, to access that resource.

**What it does in real life.** Common on shared machines, system folders, protected files, or when a port
is reserved.

```console
$ ./deploy.sh
bash: ./deploy.sh: Permission denied
```

*What just happened:* The file `deploy.sh` is there and the path is right - but it isn't marked as
*executable*, so the system won't run it. This is a *permissions* problem, not a *not-found* problem, and
the message says so directly. (The fix here is to mark it runnable with `chmod +x deploy.sh`, but the
important skill is reading "Permission denied" and knowing it's a *rights* issue, not a typo.)

💡 **Key point.** "Permission denied" is fundamentally different from "not found." Not-found means *the
thing isn't there*; permission-denied means *the thing is there but you can't touch it that way.* Reading
which one you got saves you from fixing the wrong problem - don't go hunting for a missing file when the
file is sitting right there and the real issue is access.

## How the families connect to the anatomy

Notice what just happened across this whole phase: the **error type** (from
[Phase 1](01-information-not-insult.md)) told you the family, and the **message** told you the specifics.
`FileNotFoundError` → not-found family → "which file? where am I running from?" `TypeError: ... not a
function` → type-mismatch family → "what type is this value really?" The three-part anatomy and the
families are the same tool, used together: *type names the family, message names the case.*

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

Now you can read an error and recognize its anatomy and its family. The last phase is the calm,
repeatable *method* for actually resolving one - including what to do when the family alone isn't enough.

---

[← Phase 1: An Error Is Information](01-information-not-insult.md) · [Phase 3: What to Actually Do With One →](03-what-to-do.md)
