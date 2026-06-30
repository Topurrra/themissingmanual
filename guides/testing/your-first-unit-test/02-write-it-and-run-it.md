---
title: "Write It and Run It"
guide: "your-first-unit-test"
phase: 2
summary: "Create the test file, run pytest, and read a green pass - then break the code on purpose to see a red failure and learn to read the expected-vs-actual output."
tags: [testing, unit-tests, pytest, python, running-tests, test-failures, beginner-friendly]
difficulty: beginner
synonyms: ["how to run pytest", "how to run a test in python", "reading a test failure", "pytest green pass red fail", "why is my test failing", "how to install pytest"]
updated: 2026-06-19
---

# Write It and Run It

You've seen the shape on paper. Now you'll make it real - a file on disk, a command in your terminal, and
output you can read. This is the part that turns "I sort of get testing" into "I've done it." Type along;
running it once yourself teaches more than reading it ten times.

We'll do the full loop: write the code and the test, run it and read a **green** pass, then deliberately
break the code and read a **red** failure. That last step matters more than it sounds - a test you've only
ever seen pass might be passing for the wrong reason. Watching it fail when the code is wrong is how you
earn the right to trust it.

## Step 1: Install pytest

📝 **Terminology.** **pytest** is a *test runner* - a program that finds your test functions, runs them,
and reports pass or fail. It's the most common test runner in Python and not part of the language itself,
so you install it once:

```console
$ pip install pytest
Collecting pytest
...
Successfully installed pytest-8.2.0 ...
```

*What just happened:* `pip` (Python's package installer) downloaded pytest and put it on your system, so
the `pytest` command now works in your terminal. Your version number may differ from `8.2.0`; that's fine.
If `pip` isn't found, try `python -m pip install pytest` instead - same result, called a slightly
different way.

## Step 2: Put the code and the test in a file

Make a folder, move into it, and create one file. (`mkdir` makes a directory, `cd` moves into it - same
two commands you'd use to start any project.)

```console
$ mkdir tax-test
$ cd tax-test
```

*What just happened:* you're now standing inside an empty folder called `tax-test`. Everything next goes
in here.

Create a file named `test_tax.py` with this content - the function under test *and* the test for it,
together for now so there's nothing to wire up:

```python
def total_with_tax(price, tax_rate):
    return price + (price * tax_rate)


def test_total_with_tax_adds_ten_percent():
    # Arrange
    price = 100
    tax_rate = 0.10
    # Act
    result = total_with_tax(price, tax_rate)
    # Assert
    assert result == 110
```

*What just happened:* you wrote a file with two functions. `total_with_tax` is your real code. The second
one, `test_total_with_tax_adds_ten_percent`, is the test from Phase 1 - Arrange the inputs, Act by calling
the function, Assert the result is `110`.

⚠️ **Gotcha.** The file name and the test function name both need to start with `test`. By default pytest
only looks in files named `test_*.py` (or `*_test.py`) and only runs functions whose names start with
`test`. Name your test `check_tax` instead of `test_tax` and pytest will silently skip it - and a test
that never runs is worse than no test, because you'll *think* you're covered.

## Step 3: Run it and read the green

From inside the `tax-test` folder, run pytest:

```console
$ pytest
========================= test session starts =========================
platform linux -- Python 3.11.4, pytest-8.2.0, pluggy-1.5.0
rootdir: /home/ada/tax-test
collected 1 item

test_tax.py .                                                    [100%]

========================== 1 passed in 0.01s ==========================
```

*What just happened:* pytest searched the folder, **collected 1 item** (your one test), ran it, and it
passed. Two things tell you it's green:

- The single dot after `test_tax.py` - pytest prints one `.` for each passing test.
- The last line: `1 passed`. That's the summary you're looking for.

No assertion failed, so pytest stayed quiet about the details and just reported success. **You've now
written and run a real unit test.** That green line is the whole reward - it means your code did what you
claimed it would.

💡 **Key point.** Green means every assertion held. Red means at least one didn't. You read the *last
line* first - `1 passed` or `1 failed` - then dig into the details only when something's red.

## Step 4: Break the code on purpose

Here's the step beginners skip and seniors never do. A passing test only tells you something if it would
*fail* when the code is wrong. So let's make the code wrong and confirm the test catches it.

Change `total_with_tax` to add the tax twice - a realistic bug, the kind of slip that happens for real:

```python
def total_with_tax(price, tax_rate):
    return price + (price * tax_rate) + (price * tax_rate)
```

*What just happened:* you introduced a bug on purpose. For a price of `100` at `0.10`, this now returns
`120` instead of `110` - it adds the tax twice. The test still expects `110`. Leave the test exactly as it
was.

Now run it again:

```console
$ pytest
========================= test session starts =========================
platform linux -- Python 3.11.4, pytest-8.2.0, pluggy-1.5.0
rootdir: /home/ada/tax-test
collected 1 item

test_tax.py F                                                    [100%]

============================== FAILURES ===============================
________________ test_total_with_tax_adds_ten_percent _________________

    def test_total_with_tax_adds_ten_percent():
        # Arrange
        price = 100
        tax_rate = 0.10
        # Act
        result = total_with_tax(price, tax_rate)
        # Assert
>       assert result == 110
E       assert 120 == 110

test_tax.py:11: AssertionError
========================= 1 failed in 0.02s ===========================
```

*What just happened:* the test caught the bug - exactly as it should. Read the output from the bottom up,
because that's where the answer is:

- The last line is now `1 failed` (and the dot became an `F` up top, for "fail").
- `assert 120 == 110` is pytest showing you the comparison that failed, with the **real values filled in**.
  The `>` marks the line that blew up.
- `E   assert 120 == 110` is the punchline: your code produced **120** (the *actual*), but the test
  expected **110** (the *expected*). That gap - 120 vs. 110 - is the bug, named in numbers.
- `test_tax.py:11` tells you the exact file and line, so you know where to look.

This is what a test failure *is*: a precise report of "you said this should be 110, but it was 120, on this
line." It doesn't just say "something's wrong" - it hands you the expected value, the actual value, and the
location. Reading that report calmly is most of the skill.

⚠️ **Gotcha.** When a test goes red, resist the urge to "fix the test" so it passes again. The test is the
messenger. Nine times out of ten the *code* is wrong, and the test just did its only job. Change the test
only when you've decided the expected behavior itself is genuinely different.

## Step 5: Fix it and go back to green

Put the function back the way it was - one tax, not two:

```python
def total_with_tax(price, tax_rate):
    return price + (price * tax_rate)
```

```console
$ pytest
========================= test session starts =========================
collected 1 item

test_tax.py .                                                    [100%]

========================== 1 passed in 0.01s ==========================
```

*What just happened:* back to green. You've now seen the full lifecycle with your own eyes - a test that
passes when the code is right, *and* fails when the code is wrong. That round trip is what makes the green
mean something. A test you've watched fail is a test you can trust.

## Recap

1. **pytest** is the test runner; install it once with `pip install pytest`.
2. Tests live in files named `test_*.py`; test functions start with `test`. Misname either and pytest
   silently skips it.
3. Run `pytest` from your folder. Read the **last line** first: `1 passed` (green) or `1 failed` (red).
4. On failure, pytest shows you `assert <actual> == <expected>` with real values, plus the file and line.
   Read it bottom-up.
5. Always watch a test fail at least once. A test that can't fail can't protect you.

You can now write a test, run it, and read both outcomes. Next: the difference between a test that protects
you and one that quietly lies - the habits that make a test worth keeping.

---

Run the tests below - then break the function on purpose and watch them turn red:

```playground-unittest
```

[← Phase 1: Arrange, Act, Assert](01-arrange-act-assert.md) · [Guide overview](_guide.md) · [Phase 3: What Makes a Good Test →](03-what-makes-a-good-test.md)
