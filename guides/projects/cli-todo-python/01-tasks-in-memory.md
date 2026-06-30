---
title: "Tasks in Memory"
guide: cli-todo-python
phase: 1
summary: "Model each task as a dictionary, collect them in a list, and write add and list functions you can watch grow."
tags: [python, list, dict, data-model, beginner]
difficulty: beginner
synonyms:
  - list of dictionaries python
  - model data with dicts
  - python append to list
  - in-memory task storage
  - build a todo list structure
updated: 2026-06-30
---

# Tasks in Memory

Before a to-do app can save anything or take commands, it needs one thing: a way to hold a task in the program's memory. Get the shape of the data right and everything after this gets shorter. So that's where we start - no files, no commands yet, only tasks living in a list while the program runs.

## What is a task, really?

A task isn't one value. It has a few parts: the text of the thing to do, whether it's finished, and an id so we can point at it later ("mark task 2 done"). When you have a bundle of named values like that, a Python **dictionary** is the natural fit.

Here's one task as a dict:

```python runnable
task = {"id": 1, "text": "buy milk", "done": False}
print(task)
print("The text is:", task["text"])
print("Done yet?", task["done"])
```

Run that. You get the whole dict, then two values pulled out by name. The keys - `id`, `text`, `done` - are how we reach inside. That's the entire data model for one task. No class, no library. A dict is plenty.

## Many tasks: a list of dicts

One task is a dict. A to-do **list** is, fittingly, a Python list of those dicts:

```python runnable
tasks = [
    {"id": 1, "text": "buy milk", "done": False},
    {"id": 2, "text": "call the bank", "done": False},
    {"id": 3, "text": "water the plants", "done": True},
]

print("You have", len(tasks), "tasks.")
for task in tasks:
    print(task["id"], "-", task["text"])
```

A list of dictionaries is one of the most common shapes in all of Python. Rows from a database, items in a shopping cart, results from an API - they almost always arrive looking like this. Learn it here and you'll recognize it everywhere.

## Adding a task

Right now we typed the tasks by hand. The app needs to *add* them on demand. We'll write a function that takes the current list, the new text, and appends a fresh dict to the end.

The one wrinkle is the id. Each task needs a number nobody else has. The reliable trick: look at the biggest id already in the list and add one. If the list is empty, start at 1.

```python runnable
def add_task(tasks, text):
    if tasks:
        new_id = max(task["id"] for task in tasks) + 1
    else:
        new_id = 1
    tasks.append({"id": new_id, "text": text, "done": False})

tasks = []
add_task(tasks, "buy milk")
add_task(tasks, "call the bank")
add_task(tasks, "water the plants")

for task in tasks:
    print(task["id"], "-", task["text"])
```

Walk through it. We start with an empty list. The first `add_task` sees no tasks, so `new_id` is 1. The next sees a max id of 1, so it picks 2. Then 3. The list grew from nothing to three tasks, each with its own id, and we never had to track a counter ourselves.

Why `max` instead of `len(tasks) + 1`? Because later we'll delete tasks. If you delete task 2 from a list of three, `len` is now 2 - and `len + 1` would hand the next task an id of 3, which already exists. Reading the actual max id keeps every id unique no matter what you've removed. It's a small choice now that saves a real bug later.

## Listing what you have

Adding is half of it. The other half is showing the list back in a way a human wants to read. Let's make a `list_tasks` function that prints each task with its id and a marker for whether it's done.

```python runnable
def add_task(tasks, text):
    new_id = max((task["id"] for task in tasks), default=0) + 1
    tasks.append({"id": new_id, "text": text, "done": False})

def list_tasks(tasks):
    if not tasks:
        print("No tasks yet. Add one!")
        return
    for task in tasks:
        mark = "x" if task["done"] else " "
        print(f"[{mark}] {task['id']}. {task['text']}")

tasks = []
add_task(tasks, "buy milk")
add_task(tasks, "call the bank")
tasks[0]["done"] = True   # pretend we finished the first one

list_tasks(tasks)
```

A couple of things to notice. We tightened `add_task` using `max(..., default=0)` - the `default` kicks in when the list is empty, so the `if/else` disappears and the function is one line of logic. Same behavior, less code.

In `list_tasks`, the `mark` line is a small conditional: `"x"` if the task is done, a space if not. The `f"..."` string drops the values straight into the text. The result reads like an actual checklist:

```
[x] 1. buy milk
[ ] 2. call the bank
```

That bracket-and-number format is something you can scan in a real terminal. We set `tasks[0]["done"] = True` by hand here only to show the marker working - in Phase 3 we'll write a proper function for it.

## Where we are

You now have the spine of the app: a task is a dict, the list is a list of dicts, `add_task` grows it, and `list_tasks` shows it. Everything from here builds on this shape.

The catch - and you may have felt it - is that the moment the program ends, the list vanishes. Run it again and you're back to empty. That's the next problem to solve: making your tasks stick around. On to saving them to a file.
