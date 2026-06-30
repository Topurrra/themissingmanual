---
title: "Pytest, From Zero"
guide: pytest-from-zero
phase: 1
summary: "Python testing that gets out of your way: plain assert, fixtures for setup and teardown, parametrize for table-driven tests, and a rich plugin ecosystem."
tags: [pytest, python, testing, fixtures, parametrize]
difficulty: intermediate
synonyms: ["pytest tutorial", "pytest fixtures explained", "pytest vs unittest", "pytest parametrize", "conftest.py what is it", "pytest monkeypatch", "how to test python code", "pytest assert introspection"]
updated: 2026-06-30
---

# The mental model: plain assert and zero-config discovery

You have a function. You believe it works. The trouble is that "I believe it works" is not something you can run, and six months from now when you change one line, your belief won't tell you what you broke. A test is the part where you write down what "works" means in code, so the machine can check it for you forever.

Pytest exists to make that step cheap enough that you actually do it. The whole pitch fits in one idea: **a test is a function whose name starts with `test_`, and inside it you write a plain `assert`.** If the assert holds, the test passes. If it fails, pytest tells you why in detail. That's the model. Everything else in this guide is convenience layered on top.

## What a test looks like

Say you have a tiny module. Here it is, and the test next to it.

```python
# calc.py
def add(a, b):
    return a + b
```

```python
# test_calc.py
from calc import add

def test_add_two_positives():
    assert add(2, 3) == 5

def test_add_with_zero():
    assert add(7, 0) == 7
```

You run the test runner from the project folder:

```console
$ pytest
========================= test session starts =========================
collected 2 items

test_calc.py ..                                                  [100%]

========================== 2 passed in 0.01s ==========================
```

*What just happened:* pytest found `test_calc.py` on its own, ran both `test_` functions, and each dot is one passing test. You never registered the file, named a test suite, or wrote a `main`. You wrote two functions and ran one command.

## Why plain `assert` is the whole point

The standard library ships `unittest`, and it works, but it makes you say things like `self.assertEqual(add(2, 3), 5)` inside a class that inherits from `TestCase`. There's a method for every comparison: `assertEqual`, `assertTrue`, `assertIn`, `assertGreater`, on and on. You have to remember which one, and you have to wrap every test in a class.

Pytest throws all of that out. You use Python's own `assert`. The reason this works so well is **assertion introspection**: when an `assert` fails, pytest rewrites it behind the scenes to capture both sides of the comparison and print them. Watch what a failure looks like.

```python
# test_calc.py
from calc import add

def test_add_is_wrong_on_purpose():
    assert add(2, 3) == 6
```

```console
$ pytest
========================= test session starts =========================
collected 1 item

test_calc.py F                                                   [100%]

============================== FAILURES ===============================
____________________ test_add_is_wrong_on_purpose _____________________

    def test_add_is_wrong_on_purpose():
>       assert add(2, 3) == 6
E       assert 5 == 6
E        +  where 5 = add(2, 3)

test_calc.py:4: AssertionError
======================== 1 short test in 0.01s ========================
```

*What just happened:* the failure didn't say "AssertionError" and stop. It showed `assert 5 == 6` and told you that the `5` came from `add(2, 3)`. You can see the actual value, the expected value, and where the actual one came from, all without writing a single extra word. That introspection is what makes plain `assert` better than a dozen named assertion methods.

## How pytest finds your tests

Pytest discovers tests by convention, so you spend zero effort wiring them up. The default rules are worth memorizing because they explain "why isn't my test running":

- Files named `test_*.py` or `*_test.py`.
- Functions named `test_*` inside those files.
- Methods named `test_*` inside classes named `Test*` (and the class must have no `__init__`).

```text
myproject/
├── calc.py
├── shop/
│   └── cart.py
└── tests/
    ├── test_calc.py        ← discovered
    ├── test_cart.py        ← discovered
    └── helpers.py          ← NOT discovered (no test_ prefix)
```

*What just happened:* pytest walks the directory tree from where you ran it, collects every file matching the naming pattern, and runs the matching functions. The `helpers.py` file is ignored as a test file, which is exactly what you want for shared helper code. A common first confusion is naming a file `calc_test.py` but the function `check_add` instead of `test_add` — the file is found, but the function silently never runs because it lacks the `test_` prefix.

> **The one early gotcha:** if you have two test files with the same name in different folders and no `__init__.py` or package layout, pytest can collide on the module name and error out. The simplest fix early on is to keep test filenames unique, or add a `conftest.py` at the project root (an empty file works) so pytest treats the root as the base for imports. More on `conftest.py` in phase 3.

## Installing and running it

Pytest is not in the standard library; you install it. Inside a virtual environment:

```bash
pip install pytest
pytest                      # run everything it can discover
pytest test_calc.py        # run one file
pytest test_calc.py::test_add_two_positives   # run one test
pytest -v                  # verbose: one line per test, with names
pytest -k "add and not zero"   # run tests whose name matches the expression
```

*What just happened:* `pytest` with no arguments is the everyday command. The rest narrow the run: a file, a single test with the `::` separator, verbose output for readable names, and `-k` to filter by a substring expression on the test name. When you're chasing one failing test, `pytest path::test_name -v` is the loop you'll live in.

If you've never written a unit test before, the companion guide [/guides/your-first-unit-test](/guides/your-first-unit-test) walks through the mindset of what to test and why before you worry about the tool.

## For builders

Reach for pytest on any new Python project unless you have a specific reason not to. It runs `unittest`-style `TestCase` classes too, so adopting it on a legacy codebase doesn't mean rewriting old tests — pytest discovers and runs them as-is, and you write new tests the pytest way alongside them. There's almost no migration cost, which is a big part of why it became the default.

```quiz
[
  {
    "q": "What two things does pytest need to recognize and run a test by default?",
    "choices": ["A class inheriting from TestCase and a setUp method", "A file matching test_*.py (or *_test.py) and a function named test_*", "A pytest.ini file and an explicit test registry", "A @test decorator on every function"],
    "answer": 1,
    "explain": "Discovery is by naming convention: a test_*.py / *_test.py file and a test_* function inside it. No registration or base class required."
  },
  {
    "q": "Why does pytest let you use plain `assert` instead of methods like assertEqual?",
    "choices": ["It silently skips failed asserts", "Assertion introspection rewrites the assert to show both sides of the comparison and where each value came from", "Python's assert is faster than method calls", "It disables Python's -O optimization flag globally"],
    "answer": 1,
    "explain": "Pytest rewrites assert statements so a failure prints the actual and expected values and their source, giving rich output from a plain assert."
  },
  {
    "q": "You named a file test_cart.py but the function check_total. It never runs. Why?",
    "choices": ["The file name is wrong", "Functions must be inside a Test class", "The function lacks the test_ prefix, so pytest doesn't collect it", "You must register it in conftest.py"],
    "answer": 2,
    "explain": "Pytest only collects functions whose names start with test_. The file is discovered, but check_total is ignored."
  }
]
```

[← Overview](_guide.md) | [Phase 2: The everyday core: fixtures, parametrize, and marks →](02-fixtures-parametrize-marks.md)
