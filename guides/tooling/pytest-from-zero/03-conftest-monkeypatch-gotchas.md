---
title: "Production reality: conftest, monkeypatch, and the gotchas"
guide: pytest-from-zero
phase: 3
summary: "Python testing that gets out of your way: plain assert, fixtures for setup and teardown, parametrize for table-driven tests, and a rich plugin ecosystem."
tags: [pytest, python, testing, fixtures, parametrize]
difficulty: intermediate
synonyms: ["pytest tutorial", "pytest fixtures explained", "pytest vs unittest", "pytest parametrize", "conftest.py what is it", "pytest monkeypatch", "how to test python code", "pytest assert introspection"]
updated: 2026-06-30
---

# Production reality: conftest, monkeypatch, and the gotchas

Your test suite grows. The same fixture gets copy-pasted into five files. A test needs to call a real API, or read the system clock, or hit a paid service - none of which you want happening during a test run. And every so often a test passes when the code is broken, or fails for a reason that has nothing to do with your code. This phase covers the three things that turn a toy test suite into one you trust: sharing fixtures with `conftest.py`, faking the outside world with `monkeypatch`, and the gotchas that waste an afternoon.

## conftest.py: fixtures every test can see

When a fixture is useful in more than one file, you don't import it - you move it to a file named `conftest.py`, and pytest makes it available to every test in that directory and below, automatically, with no import.

```text
tests/
├── conftest.py          ← fixtures here are visible to everything below
├── test_orders.py       ← can use fixtures from conftest.py
└── api/
    ├── conftest.py       ← extra fixtures just for api/ tests
    └── test_endpoints.py ← sees BOTH conftest.py files
```

```python
# tests/conftest.py
import pytest

@pytest.fixture
def db():
    conn = connect_to_test_db()
    yield conn
    conn.rollback()       # undo any writes so tests don't pollute each other
    conn.close()
```

```python
# tests/test_orders.py  - no import needed
def test_order_saves(db):
    save_order(db, item="book")
    assert count_orders(db) == 1
```

*What just happened:* `test_orders.py` used the `db` fixture without importing it, because pytest auto-discovers fixtures from any `conftest.py` up the directory tree. The nearer `conftest.py` wins on name conflicts, so you can override a shared fixture for one subfolder. This is also the file where project-wide hooks and plugin config live. A `conftest.py` is magic in the literal sense - pytest loads it implicitly - which is convenient and occasionally confusing, so keep it for genuinely shared things.

## monkeypatch: faking the outside world

A good unit test doesn't call the real payment API, doesn't depend on today's date, and doesn't read your actual environment variables. The built-in `monkeypatch` fixture lets you replace an attribute, a function, an environment variable, or a dict entry for the duration of one test - and pytest puts the original back automatically when the test ends.

```python
# weather.py
import requests

def temperature(city):
    resp = requests.get(f"https://api.example.com/temp/{city}")
    return resp.json()["celsius"]
```

```python
# test_weather.py
import weather

class FakeResponse:
    def json(self):
        return {"celsius": 21}

def test_temperature(monkeypatch):
    def fake_get(url):
        return FakeResponse()
    monkeypatch.setattr(weather.requests, "get", fake_get)

    assert weather.temperature("oslo") == 21
```

*What just happened:* the test replaced `requests.get` inside the `weather` module with a fake that returns canned data, so no real network call happened. The test is fast, deterministic, and runs offline. When the test finishes, pytest restores the real `requests.get` - you never have to undo the patch yourself, which is the whole reason to use `monkeypatch` over manually swapping attributes.

The same fixture handles environment and dicts:

```python
def test_uses_api_key(monkeypatch):
    monkeypatch.setenv("API_KEY", "test-key-123")
    monkeypatch.delenv("PROXY", raising=False)
    assert load_config()["api_key"] == "test-key-123"
```

*What just happened:* `setenv` set an environment variable for this test only, `delenv` removed one (`raising=False` means "don't error if it's already absent"), and both are reverted after the test. This keeps your real shell environment out of the test and the test's fake values out of the next test.

> **Patch where it's looked up, not where it's defined.** The single most common monkeypatch mistake: if `weather.py` does `from requests import get` and then calls `get(...)`, patching `requests.get` does nothing - `weather` already holds its own reference named `get`. You must patch `weather.get`. The rule: replace the name in the module that *uses* it, not the module that *defines* it.

## The gotchas that waste an afternoon

**Tests share state through wide-scope fixtures.** A `scope="session"` fixture that returns a mutable object - a list, a dict, a connection with uncommitted writes - leaks between tests. Test A appends to it, test B sees A's leftovers, and now your tests pass or fail depending on order. If you see a test that passes alone but fails in the suite (or vice versa), suspect shared mutable state first. Narrow the scope or reset the object in teardown.

**The import that isn't your code.** If your test file imports a module that doesn't exist or has a syntax error, pytest reports a *collection error*, not a test failure - the test never ran. Read the top of the output, not the bottom: collection errors appear before the test results.

**Assertions that always pass.** `assert (x == y)` is fine, but `assert(x == y, "message")` is a trap - that's asserting a two-element tuple, which is always truthy, so the test can never fail. If you want a message, use `assert x == y, "message"` with a comma, no parentheses around the pair.

```console
$ pytest
=========================== warnings summary ===========================
test_calc.py:4: PytestAssertRewriteWarning: assertion is always true,
  perhaps remove parentheses?
```

*What just happened:* pytest noticed the parenthesized assert-with-tuple and warned you, because that pattern silently disables the test. Treat this warning as an error - it means a test you thought was guarding something is guarding nothing.

**Disappearing output.** `print()` inside a passing test shows nothing by default - pytest captures stdout and only shows it for failing tests. Pass `-s` to see prints live, or `--capture=no`, when you're debugging. And when a test fails and you want to drop into a debugger at the failure, `pytest --pdb` opens `pdb` right at the assertion that blew up.

## For builders

The plugin ecosystem is the other half of pytest's pull. A few you'll meet on real projects: `pytest-cov` for coverage reports (`pytest --cov=myapp`), `pytest-xdist` to run tests across multiple cores (`pytest -n auto`), and `pytest-mock` which wraps the standard library's `unittest.mock` in a fixture if you outgrow `monkeypatch`. You don't need any of them to start - plain pytest plus `monkeypatch` covers most of what you'll write - but it's good to know the escape hatches exist before you need them.

```quiz
[
  {
    "q": "What makes conftest.py special?",
    "choices": ["It must be imported at the top of every test file", "Fixtures defined in it are auto-available to all tests in its directory and below, with no import", "It is the only place you can write assertions", "It runs your tests in a separate process"],
    "answer": 1,
    "explain": "pytest auto-discovers fixtures from conftest.py files up the directory tree, so tests use them without importing anything."
  },
  {
    "q": "Your module does `from requests import get` then calls `get(...)`. To fake it in a test, what do you patch?",
    "choices": ["requests.get, where it is defined", "The name in the module that uses it, e.g. mymodule.get", "Nothing - monkeypatch can't reach imported names", "Python's builtins.get"],
    "answer": 1,
    "explain": "The using module already bound its own reference named get. Patch where it is looked up (mymodule.get), not where it is defined."
  },
  {
    "q": "Why is `assert(x == y, \"oops\")` a dangerous test bug?",
    "choices": ["It raises a SyntaxError", "It asserts a non-empty tuple, which is always truthy, so the test can never fail", "It only works in Python 2", "It silently skips the test"],
    "answer": 1,
    "explain": "The parentheses make it a 2-tuple, which is always truthy. The assert always passes and guards nothing. Use a comma with no parens: assert x == y, \"oops\"."
  }
]
```

[← Phase 2: The everyday core](02-fixtures-parametrize-marks.md) | [Overview](_guide.md)
