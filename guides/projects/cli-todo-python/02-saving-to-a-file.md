---
title: "Saving to a File"
guide: cli-todo-python
phase: 2
summary: "Use the json module to write your task list to a text file and load it back, so tasks survive after the program ends."
tags: [python, json, file-io, persistence, beginner]
difficulty: beginner
synonyms:
  - python json dump load
  - save data to file python
  - persist list to disk
  - read write json file
  - python file storage
updated: 2026-06-30
---

# Saving to a File

Last phase ended on a sour note: the moment the program stops, your tasks are gone. Memory is temporary by design. To make a to-do app worth using, the list has to outlive a single run — you add a task today and it's still there tomorrow. That means writing it to a file and reading it back. Let's do exactly that.

## Why JSON

Our task list is a list of dicts. We need to turn that into text we can save, then turn the text back into a list of dicts later. Python has a module built for precisely this: `json`.

JSON is a text format that looks almost identical to Python lists and dicts. That's not a coincidence — it was designed to carry data like ours. The `json` module gives us two pairs of functions:

| Function | Direction | What it does |
|----------|-----------|--------------|
| `json.dumps` | object → text | turns a list/dict into a JSON string |
| `json.loads` | text → object | turns a JSON string back into a list/dict |
| `json.dump` | object → file | writes a list/dict straight to an open file |
| `json.load` | text → file | reads a list/dict straight from an open file |

The ones without the `s` work with files; the ones with the `s` work with strings (`s` for *string*). We'll use both.

## Seeing the conversion

Before touching files, let's watch the round trip in pure memory. Take a list of tasks, turn it into a JSON string, then turn that string back into Python:

```python runnable
import json

tasks = [
    {"id": 1, "text": "buy milk", "done": False},
    {"id": 2, "text": "call the bank", "done": True},
]

text = json.dumps(tasks, indent=2)
print("As JSON text:")
print(text)

restored = json.loads(text)
print("\nBack to Python:")
print(restored[0]["text"], "- done?", restored[0]["done"])
```

Run it. The middle is a clean JSON string — `indent=2` makes it readable with line breaks and spacing instead of one long line. Then `json.loads` reads that string and hands you back a real Python list you can index into. Out and back, no data lost. `False` came back as `False`, the text came back as text. That round trip is the whole idea behind saving.

## Writing to a file and reading it back

Now the real thing. In your browser, we'll use a temporary file so the code runs in isolation — and the file path stays the same when you move to your own machine.

```python runnable
import json
import tempfile, os

# A file path. On your machine this would simply be "tasks.json".
path = os.path.join(tempfile.gettempdir(), "tasks.json")

tasks = [
    {"id": 1, "text": "buy milk", "done": False},
    {"id": 2, "text": "call the bank", "done": True},
]

# Save: open the file for writing, dump the list into it.
with open(path, "w") as f:
    json.dump(tasks, f, indent=2)
print("Saved", len(tasks), "tasks to", path)

# Load: open the file for reading, load the list back out.
with open(path, "r") as f:
    loaded = json.load(f)

print("Loaded back:")
for task in loaded:
    print(task["id"], "-", task["text"])
```

The `with open(...)` block opens the file and closes it automatically when the block ends, even if something goes wrong inside — that's why we use `with` rather than opening and closing by hand. The `"w"` means write (and replace whatever was there); `"r"` means read.

This block proves the loop that matters: data went to disk, the program could have ended right there, and we still read every task back. That's persistence.

## The first-run problem

There's a trap waiting. The very first time someone runs the app, `tasks.json` doesn't exist yet. Try to open a missing file for reading and Python raises `FileNotFoundError` and crashes. Not the welcome we want.

The fix is to expect it: if the file isn't there, start with an empty list. Let's wrap loading in a function that handles both the happy path and the first run.

```python runnable
import json
import tempfile, os

path = os.path.join(tempfile.gettempdir(), "todo_demo.json")

def load_tasks(path):
    try:
        with open(path, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return []

def save_tasks(path, tasks):
    with open(path, "w") as f:
        json.dump(tasks, f, indent=2)

# Make sure we're starting fresh for this demo.
if os.path.exists(path):
    os.remove(path)

# First run: no file yet, so we get an empty list — no crash.
tasks = load_tasks(path)
print("First run, tasks:", tasks)

# Add one and save.
tasks.append({"id": 1, "text": "buy milk", "done": False})
save_tasks(path, tasks)

# Second run: load again, the task is there.
tasks_again = load_tasks(path)
print("Second run, tasks:", tasks_again)
```

Look at the two prints. The first is `[]` — an empty list, because the file didn't exist and `load_tasks` caught the `FileNotFoundError` and returned `[]` instead of crashing. Then we add a task, save, and "run again" by calling `load_tasks` a second time. This time the task comes back. That's the full life cycle of saved data, handled cleanly.

The `try/except` here is the kind of error handling worth keeping. It's not guarding against something impossible — a missing file on first run is *guaranteed* to happen. Catching it turns a crash into a sensible default.

## Where we are

You've got `load_tasks` and `save_tasks`, and together they make the list permanent. Add a task, save, quit, come back, load — it's still there. These two functions are the storage layer of the app, and we won't change them again. On your own machine you'd point `path` at `"tasks.json"` and it would behave exactly as you saw here.

Next we make the list do more than grow: marking tasks done, deleting them, and filtering open from finished.
