---
title: "Complete, Delete, and Filter"
guide: cli-todo-python
phase: 3
summary: "Write functions to mark a task done, remove one by id, and split the list into open and finished tasks."
tags: [python, list, filter, functions, beginner]
difficulty: beginner
synonyms:
  - mark task complete python
  - remove item from list by id
  - filter list comprehension
  - update dict in list
  - python find by id
updated: 2026-06-30
---

# Complete, Delete, and Filter

A to-do app you can only add to isn't a to-do app - it's a notepad that fills up forever. The whole point is finishing things and clearing them out. This phase gives the list its verbs: mark a task done, delete one, and show open and finished tasks apart from each other. Three small functions, each one a feature you'd actually use.

## Finding a task by id

Every operation here starts the same way: "find the task with this id." Marking done, deleting - both need to locate the right task first. So let's write that once.

Tasks are a list of dicts, and we want the one whose `id` matches. A loop does it: walk the list, return the task when the id matches, return `None` if we reach the end without finding it.

```python runnable
def find_task(tasks, task_id):
    for task in tasks:
        if task["id"] == task_id:
            return task
    return None

tasks = [
    {"id": 1, "text": "buy milk", "done": False},
    {"id": 2, "text": "call the bank", "done": False},
]

print(find_task(tasks, 2))
print(find_task(tasks, 99))   # no such task
```

The first call finds task 2 and returns the whole dict. The second asks for id 99, which doesn't exist, so the loop finishes and we return `None`. Returning `None` for "not found" is a common Python convention - the caller checks for it and can show a helpful message instead of crashing.

## Marking a task done

Now `complete_task`. It finds the task and flips its `done` flag to `True`. If there's no such task, it says so and changes nothing.

Here's the part that surprises people new to Python: when `find_task` returns the dict, it returns the **same** dict that's sitting in the list - not a copy. Change it and the list sees the change. That's exactly what we want.

```python runnable
def find_task(tasks, task_id):
    for task in tasks:
        if task["id"] == task_id:
            return task
    return None

def complete_task(tasks, task_id):
    task = find_task(tasks, task_id)
    if task is None:
        print(f"No task with id {task_id}")
        return
    task["done"] = True
    print(f"Marked done: {task['text']}")

tasks = [
    {"id": 1, "text": "buy milk", "done": False},
    {"id": 2, "text": "call the bank", "done": False},
]

complete_task(tasks, 1)
complete_task(tasks, 99)   # doesn't exist

print("\nFull list now:")
for task in tasks:
    print(task["id"], task["text"], "->", task["done"])
```

Run it. Task 1 gets marked done and the message confirms it. The call for id 99 prints "No task with id 99" and leaves everything alone. Then the full list shows task 1 with `done` now `True` - proof that editing the dict we found really did update the list. We never had to reach back into `tasks` by index. Finding the dict and changing it was enough.

## Deleting a task

Deleting is the one place we *don't* edit in place - we build a new list with the unwanted task left out. The cleanest way in Python is a **list comprehension** that keeps every task whose id is not the one we're removing.

```python runnable
def delete_task(tasks, task_id):
    before = len(tasks)
    tasks = [task for task in tasks if task["id"] != task_id]
    if len(tasks) == before:
        print(f"No task with id {task_id}")
    else:
        print(f"Deleted task {task_id}")
    return tasks

tasks = [
    {"id": 1, "text": "buy milk", "done": False},
    {"id": 2, "text": "call the bank", "done": False},
    {"id": 3, "text": "water the plants", "done": False},
]

tasks = delete_task(tasks, 2)

print("\nRemaining:")
for task in tasks:
    print(task["id"], "-", task["text"])
```

Read the comprehension out loud: "keep each task where the id is not 2." Task 2 is the only one excluded, so the result has 1 and 3. We compare the length before and after - if nothing got removed, the id wasn't there, and we say so.

One important detail: `delete_task` **returns** the new list, and the caller writes `tasks = delete_task(...)`. Because we built a fresh list rather than editing the old one, we have to hand it back and reassign. Forget the `tasks =` and your deletion quietly does nothing. This is a real gotcha - when a function replaces a list instead of mutating it, you must capture what it returns.

## Filtering: open vs done

Last piece. Once you've finished some tasks, you want to see what's left without the clutter - and sometimes review what you've completed. That's filtering, and it's the same comprehension trick keyed on `done`.

```python runnable
def open_tasks(tasks):
    return [task for task in tasks if not task["done"]]

def done_tasks(tasks):
    return [task for task in tasks if task["done"]]

tasks = [
    {"id": 1, "text": "buy milk", "done": True},
    {"id": 2, "text": "call the bank", "done": False},
    {"id": 3, "text": "water the plants", "done": False},
    {"id": 4, "text": "pay rent", "done": True},
]

print("Still to do:")
for task in open_tasks(tasks):
    print(" -", task["text"])

print("\nDone:")
for task in done_tasks(tasks):
    print(" -", task["text"])
```

Two one-line functions, mirror images of each other: `open_tasks` keeps the ones that aren't done, `done_tasks` keeps the ones that are. The output splits your list cleanly into "still to do" and "finished." This is the same list-comprehension pattern as delete - once you see how filtering works, you reach for it constantly.

## Where we are

The list now has all its verbs. You can add (Phase 1), save and load (Phase 2), and as of now complete, delete, and filter. Every behavior the app needs exists as a small, tested-by-eye function.

What's missing is the front door. Right now we call these functions by hand inside the code. A real tool reads what you typed - `add`, `list`, `done` - and runs the matching function. That's the final phase: turning this pile of functions into a command you run from your terminal.
