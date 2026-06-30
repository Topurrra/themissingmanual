---
title: "The everyday core: fixtures, parametrize, and marks"
guide: pytest-from-zero
phase: 2
summary: "Python testing that gets out of your way: plain assert, fixtures for setup and teardown, parametrize for table-driven tests, and a rich plugin ecosystem."
tags: [pytest, python, testing, fixtures, parametrize]
difficulty: intermediate
synonyms: ["pytest tutorial", "pytest fixtures explained", "pytest vs unittest", "pytest parametrize", "conftest.py what is it", "pytest monkeypatch", "how to test python code", "pytest assert introspection"]
updated: 2026-06-30
---

# The everyday core: fixtures, parametrize, and marks

The basics get you writing tests. The day-to-day gets you writing them without repeating yourself. Two patterns show up in almost every test file: "I need the same setup in many tests" and "I need to run the same test against many inputs." Pytest has a clean answer for each — fixtures and `parametrize` — and a third tool, marks, for choosing which tests to run. Learn these three and you have the working vocabulary for real test suites.

## Fixtures: setup and teardown as dependency injection

A fixture is a function that builds something a test needs — a temp file, a database connection, a sample object — and hands it over. You declare it with `@pytest.fixture`. A test asks for it by naming it as a parameter. Pytest sees the parameter name, runs the matching fixture, and passes in whatever the fixture returns.

```python
# test_user.py
import pytest

class User:
    def __init__(self, name):
        self.name = name
        self.active = True

@pytest.fixture
def sample_user():
    return User("Ada")

def test_user_starts_active(sample_user):
    assert sample_user.active is True

def test_user_has_name(sample_user):
    assert sample_user.name == "Ada"
```

*What just happened:* both tests asked for `sample_user` by putting it in their parameter list. Pytest ran the `sample_user` fixture fresh for each test and injected the result. You wrote the setup once and used it twice, and each test got its own clean `User` rather than sharing one. This is dependency injection: the test declares what it needs, and pytest supplies it.

### Teardown with `yield`

Setup is half the job. When a fixture opens something — a file, a connection, a temp directory — you need to close it after the test, pass or fail. Use `yield` instead of `return`: everything before `yield` is setup, everything after is teardown, and pytest runs the teardown even if the test fails.

```python
import pytest

@pytest.fixture
def temp_file(tmp_path):
    path = tmp_path / "data.txt"
    f = open(path, "w")
    yield f                 # hand the open file to the test
    f.close()               # teardown: always runs after the test

def test_write(temp_file):
    temp_file.write("hello")
    assert not temp_file.closed
```

*What just happened:* the fixture opened a file, yielded it to the test, and closed it afterward. The code after `yield` is the cleanup, and pytest guarantees it runs even if the test raises. The `tmp_path` here is a fixture pytest gives you for free — a unique temporary directory per test, cleaned up automatically — so you never write to a real path or collide between tests.

### Scope: how often a fixture runs

By default a fixture runs once per test that uses it (`scope="function"`). For expensive setup you don't want to repeat — a database connection, a large loaded file — you widen the scope so the fixture runs once and is shared.

```python
@pytest.fixture(scope="module")
def db_connection():
    conn = connect_to_test_db()     # expensive: do it once per file
    yield conn
    conn.close()
```

*What just happened:* `scope="module"` means the fixture runs once for the whole file and every test in that file shares the same connection, instead of reconnecting per test. The scopes, from narrowest to widest, are `function` (default), `class`, `module`, `package`, and `session`. Wider scope is faster but riskier: shared state between tests can let one test's leftovers leak into the next, so reserve it for things that are genuinely expensive and safe to share.

> **Mental model for scope:** narrow scope is safe and slow, wide scope is fast and shared. Start at `function`. Widen only when a profiler or the wall clock tells you the setup is the bottleneck — not before.

## Parametrize: one test, many cases

You wrote `test_add_two_positives` and `test_add_with_zero`. They're the same test with different numbers. Copy-pasting a test per case is how test files rot. `@pytest.mark.parametrize` runs one test body against a table of inputs.

```python
import pytest
from calc import add

@pytest.mark.parametrize("a, b, expected", [
    (2, 3, 5),
    (7, 0, 7),
    (-1, 1, 0),
    (-5, -5, -10),
])
def test_add(a, b, expected):
    assert add(a, b) == expected
```

```console
$ pytest -v
test_calc.py::test_add[2-3-5] PASSED
test_calc.py::test_add[7-0-7] PASSED
test_calc.py::test_add[-1-1-0] PASSED
test_calc.py::test_add[-5--5--10] PASSED
```

*What just happened:* one test function became four independent tests, one per row in the table. The first argument is a string naming the parameters; the second is a list of tuples, one per case. Each case shows up as its own line with the values in brackets, so when row three fails you see exactly which inputs broke it — and the other rows still run. This is table-driven testing, and it's the cleanest way to cover edge cases like zero, negatives, and empty inputs.

## Marks: tag and select tests

A mark is a label you attach to a test. Some marks change behavior, some are for selecting what runs. The two you'll use constantly:

```python
import pytest

@pytest.mark.skip(reason="endpoint not built yet")
def test_future_feature():
    assert build_the_future() == 42

@pytest.mark.skipif(sys.version_info < (3, 11), reason="needs 3.11+ syntax")
def test_new_syntax():
    ...

@pytest.mark.slow            # a custom mark you define
def test_full_pipeline():
    ...
```

```bash
pytest -m slow               # run ONLY tests marked slow
pytest -m "not slow"         # run everything EXCEPT slow tests
```

*What just happened:* `skip` always skips with a reason in the report; `skipif` skips only when a condition holds, which is how you handle version- or platform-specific tests. The custom `slow` mark does nothing on its own — it's a tag — but `-m slow` and `-m "not slow"` let you split a fast inner-loop run from the slow full suite. To avoid a warning on custom marks, register them in your config:

```text
# pytest.ini
[pytest]
markers =
    slow: marks tests as slow (deselect with '-m "not slow"')
```

*What just happened:* registering the mark in `pytest.ini` tells pytest the `slow` mark is intentional, so it stops warning about an unknown mark. This is the standard place for project-wide pytest settings; `pyproject.toml` under a `[tool.pytest.ini_options]` table works too.

## In the wild

A mature test suite leans on all three together: fixtures build the world (a logged-in client, a seeded database), `parametrize` hammers each function with its edge cases, and marks split the fast unit tests from the slow integration ones so CI can run `pytest -m "not slow"` on every push and the full suite nightly. For where that unit/integration line actually falls, see [/guides/unit-integration-e2e](/guides/unit-integration-e2e).

```quiz
[
  {
    "q": "In a fixture, what does the code after `yield` do?",
    "choices": ["It runs only if the test passes", "It is the teardown — it runs after the test, pass or fail", "It is dead code; yield ends the fixture", "It runs before the test as extra setup"],
    "answer": 1,
    "explain": "Everything before yield is setup, everything after is teardown, and pytest runs the teardown even when the test fails."
  },
  {
    "q": "What does @pytest.mark.parametrize give you?",
    "choices": ["It runs one test body once against many input rows, each as a separate test", "It marks a test to be skipped", "It runs the test in parallel across CPU cores", "It sets the fixture scope to session"],
    "answer": 0,
    "explain": "Parametrize turns one function into many tests, one per row in the table, each reported and run independently."
  },
  {
    "q": "Why default to scope=\"function\" for fixtures instead of \"session\"?",
    "choices": ["Function scope is the only scope that supports yield teardown", "Function scope gives each test fresh state, avoiding leaks between tests; widen only when setup is genuinely expensive", "Session scope is deprecated", "Function scope runs tests in parallel automatically"],
    "answer": 1,
    "explain": "Narrow scope is safe and isolated but slower; wide scope shares state and risks leaks. Start narrow, widen only for expensive, safe-to-share setup."
  }
]
```

[← Phase 1: The mental model](01-the-mental-model.md) | [Overview](_guide.md) | [Phase 3: Production reality →](03-conftest-monkeypatch-gotchas.md)
