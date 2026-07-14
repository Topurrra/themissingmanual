---
title: "Testing & Project Structure"
guide: "django-from-zero"
phase: 10
summary: "Test Django for real - the TestCase test runner with its throwaway database, the in-process test Client for views, fixtures and setUpTestData, plus how to structure apps and keep settings (and secrets) sane."
tags: [django, testing, testcase, client, settings, project-structure, apps]
difficulty: intermediate
synonyms: ["django testing testcase", "django test client", "django test database", "django settings organization", "django project structure apps", "django pytest", "django reusable apps"]
updated: 2026-07-10
---

# Testing & Project Structure

You've built a working blog: models, an admin, forms, class-based views, an API. It runs. But "it runs when I click around" and "it keeps working after I change something" are two very different guarantees - and the gap between them is where production bugs live. This phase is about closing that gap, and about arranging your code so it stays workable as it grows.

Here's the mental model to hold first. A test is just code that runs *your* code and checks the answer - that's the whole idea, and [Your First Unit Test](/guides/your-first-unit-test) walks through the universal Arrange-Act-Assert shape if it's new to you. What makes testing a *Django* skill is everything Django does *around* your test so you don't have to: it spins up a throwaway database, loads your whole project, and gives you a fake browser that calls your views without a running server. You write the "check the answer" part; Django handles the messy setup.

## Django's test framework

📝 **`django.test.TestCase` is `unittest.TestCase` with a database safety net bolted on.** It's the ordinary Python testing base class you already know (methods named `test_*`, `self.assertEqual`, the works), but Django wraps each test in machinery that makes touching the database painless and *safe*.

Two things happen automatically, and they're the reason Django testing feels different from testing plain functions:

- **A separate test database.** When you run the test suite, Django creates a brand-new database (named `test_<yourdb>`), runs your migrations into it, and points your code at it for the duration. Your real development data is never touched. When the run finishes, the test database is destroyed.
- **A transaction around every test, rolled back at the end.** Each `test_*` method runs inside a database transaction that Django rolls back the moment the method returns. So a `Post` you create in one test does not exist in the next - every test starts from the same clean slate, no manual cleanup required.

Tests live in your app's `tests.py` (or a `tests/` package once there are many). Here's a real one against the `Post` model from [Phase 3](03-models-and-the-orm.md):

```python
from django.test import TestCase
from blog.models import Post


class PostModelTests(TestCase):
    def test_post_is_created_with_its_fields(self):
        post = Post.objects.create(title="Hello world", body="My first post.")
        self.assertEqual(post.title, "Hello world")
        self.assertIsNotNone(post.created)

    def test_str_returns_the_title(self):
        post = Post.objects.create(title="Readable", body="...")
        self.assertEqual(str(post), "Readable")
```

*What just happened:* two tests, each one Arrange-Act-Assert. The first creates a `Post` and checks its fields landed correctly (including that `created` got auto-stamped). The second pins down the `__str__` behavior you added in Phase 3 - a tiny test, but it locks in the contract that a post prints as its title, so a future refactor can't silently break the admin. Both tests called `Post.objects.create`, which hit a real database - the test database Django built and threw away for you. Run the whole suite with one command:

```bash
python manage.py test
```

```console
$ python manage.py test
Creating test database for alias 'default'...
System check identified no issues (0 silenced).
..
----------------------------------------------------------------------
Ran 2 tests in 0.012s

OK
Destroying test database for alias 'default'...
```

*What just happened:* the output bookends tell the whole story - `Creating test database` at the top, `Destroying test database` at the bottom, your two tests (the two dots) passing in between. You never created or cleaned a database yourself; Django did it around your tests. 💡 Because the test DB is automatic and disposable, testing database code in Django is genuinely *easy and safe* - no "test data polluting my real DB" worry to talk yourself out of writing the test.

## The test `Client`

Model tests check your data. But most of a web app's behavior lives in *views* - and you want to test those without booting a server, opening a browser, or making real HTTP calls. That's exactly what the test `Client` is for.

📝 **`self.client` is a fake browser that calls your views in-process.** Every `TestCase` hands you a `self.client` with methods like `.get()` and `.post()`. They take a URL, run it through your full URL routing and view logic *inside the test process* (no network, no live server), and hand back the response object - so you can assert on its status code, its rendered content, and where it redirected.

```python
from django.test import TestCase
from django.urls import reverse
from blog.models import Post


class PostViewTests(TestCase):
    def test_post_list_shows_published_posts(self):
        Post.objects.create(title="On the homepage", body="...")

        response = self.client.get(reverse("post_list"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "On the homepage")

    def test_creating_a_post_requires_login(self):
        response = self.client.get(reverse("post_create"))

        # A login-required view bounces anonymous users to the login page.
        self.assertEqual(response.status_code, 302)
        self.assertIn("/login", response.url)
```

*What just happened:* two view tests, no server in sight. The first creates a post, then `self.client.get(...)` calls the list view and returns the response; `assertContains` checks the status is 200 *and* the post's title actually appears in the rendered HTML - testing routing, the view, and the template together. The second confirms a protected view (the `LoginRequiredMixin` create view from [Phase 9](09-class-based-views-and-drf.md)) redirects an anonymous visitor: status `302` and a `Location` pointing at the login page. `reverse("post_list")` instead of a hard-coded `"/posts/"` looks the URL up by name, so the test survives a URL-path change.

💡 Where does this sit on the testing pyramid? A model test that hits one method is a unit test; a `Client` test that exercises URL → view → template → database in one shot is closer to an **integration test**. [Unit, Integration, E2E](/guides/unit-integration-e2e) lays out the trade-offs (speed and isolation vs. realism).

## Test data & fixtures

Most tests need some data to exist first. Django gives you a few ways to arrange it, ordered from simplest to most efficient.

The plainest is `setUp` - a method that runs *before every test method*, so each test gets its own fresh objects:

```python
class CommentTests(TestCase):
    def setUp(self):
        self.post = Post.objects.create(title="Discussed", body="...")

    def test_comment_attaches_to_its_post(self):
        comment = self.post.comments.create(author="Sam", body="Nice!")
        self.assertEqual(comment.post, self.post)

    def test_a_post_starts_with_no_comments(self):
        self.assertEqual(self.post.comments.count(), 0)
```

*What just happened:* `setUp` created a `Post` before each test, and both tests reached it via `self.post`. Because the per-test transaction rolls back between them, the comment created in the first test is gone before the second runs - why `test_a_post_starts_with_no_comments` reliably sees zero. As your needs grow, wrap creation in small **factory-style** helpers (a `make_post(**overrides)` function, or the popular `factory_boy` library) so a test needing "a post with a comment" reads as one line instead of five.

⚠️ `setUp` runs again for *every single test*, which gets slow when the setup is heavy. The fix is **`setUpTestData`** - a classmethod that builds shared, read-only data **once for the whole test class**:

```python
class PostListTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.posts = [Post.objects.create(title=f"Post {i}", body="...") for i in range(3)]

    def test_all_three_show_up(self):
        response = self.client.get(reverse("post_list"))
        self.assertEqual(response.content.count(b"Post"), 3)
```

*What just happened:* `setUpTestData` created three posts a single time, and Django makes them visible (via a savepoint) to each test in the class while still rolling back any changes a test makes. For data you only *read*, this is markedly faster than recreating it in `setUp` per test. (Django also supports loading data from JSON/YAML **fixture** files via `fixtures = [...]`, but inline creation or factories are usually clearer.)

💡 Many Django teams run their tests with **`pytest-django`** instead of `manage.py test`. It keeps Django's test-database machinery but swaps in pytest's nicer style: plain `assert` statements, function-style tests, and powerful fixtures. The concepts carry over unchanged - only the spelling of the runner differs.

## Project structure that scales

A blog with one `tests.py` is fine. A real product grows features - accounts, payments, notifications - and the question becomes *where does all this code go?* Django's answer is one it's had since day one: organize by **app**.

📝 **An app is a self-contained Django feature: its own models, views, URLs, templates, and tests.** Your *project* is the thin outer shell - it owns settings and the root URL config and ties the apps together. Each app is a focused unit you can reason about (and test) on its own. A blog that's outgrown its single app might look like this:

```text
myblog/                  ← the project (repo root)
├── manage.py
├── myblog/              ← project package: the "shell"
│   ├── settings.py      ← configuration (or a settings/ package - see below)
│   ├── urls.py          ← root URL config: includes each app's urls
│   └── wsgi.py
├── blog/                ← app: posts & comments
│   ├── models.py
│   ├── views.py
│   ├── urls.py
│   └── tests.py
├── accounts/            ← app: signup, login, profiles
│   ├── models.py
│   ├── views.py
│   └── tests.py
└── api/                 ← app: the DRF endpoints
    ├── serializers.py
    ├── views.py
    └── tests.py
```

*What just happened:* the project package (`myblog/`) holds only the cross-cutting wiring - settings and the root `urls.py` that `include()`s each app's URLs. Everything feature-specific lives in its own app folder: `blog` knows about posts and comments, `accounts` knows about users, `api` knows about serializers. Each app carries its *own* `tests.py`, so a feature's code and its tests sit together. 💡 Apps are deliberately designed to be self-contained - a well-isolated app (think Django's own `auth`, or `django-allauth`) can be **reused across entirely different projects** by listing it in `INSTALLED_APPS`.

## Settings management

This is the one that ends careers if you get it wrong, so read it twice. Your `settings.py` holds all your configuration - and configuration includes **secrets**.

⚠️ **Never commit secrets to version control.** `settings.py` ships with a `SECRET_KEY` (Django uses it to sign sessions and password-reset tokens), and you'll add database passwords, API keys, and email credentials. The instant any land in a git commit, treat them as compromised - git history is forever, and public repos are scraped for keys within *minutes*. The fix is to read secrets from the **environment** at runtime instead of hard-coding them:

```python
import os

SECRET_KEY = os.environ["DJANGO_SECRET_KEY"]
DEBUG = os.environ.get("DJANGO_DEBUG", "false").lower() == "true"
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ["DB_NAME"],
        "USER": os.environ["DB_USER"],
        "PASSWORD": os.environ["DB_PASSWORD"],
        "HOST": os.environ.get("DB_HOST", "localhost"),
    }
}
```

*What just happened:* not one secret value appears in the file - `SECRET_KEY`, the DB password, and friends are all pulled from environment variables. The committed code is now safe to push anywhere; the actual secrets live outside the repo (in your shell, a gitignored `.env` file, or your host's secret store). The popular `django-environ` package smooths this over (typed parsing, `.env` loading, a one-line `DATABASE_URL`), and the broader patterns are covered in [Secrets Management](/guides/secrets-management).

The other half of settings hygiene is that **dev and prod need different config**. Two common approaches:

- **Split settings into a package** - `settings/base.py` with everything shared, then `settings/dev.py` and `settings/prod.py` that each `from .base import *` and override what differs (database, allowed hosts, debug). You select one with `DJANGO_SETTINGS_MODULE=myblog.settings.prod`.
- **One settings file driven entirely by env vars** - a single `settings.py` whose every environment-specific value comes from the environment (as above). Same file everywhere; the *environment* differs.

⚠️ Whichever you pick, **`DEBUG` must be `False` in production.** With `DEBUG=True`, Django returns a full traceback page - complete with your source code, local variables, and settings - to anyone who triggers an error. That's a gift to an attacker, and turning it off is non-negotiable before you go live (why the example above defaults `DEBUG` to `false`).

💡 Step back and the shape of a healthy Django project is clear: **focused apps** so code stays reasoned-about and testable, an **automatic test database** so you actually write the tests, and **env-driven settings** so the same code runs safely from your laptop to production.

## Recap

1. **`django.test.TestCase` extends `unittest.TestCase`** and adds a safety net: it creates a *separate test database*, wraps each test in a transaction it *rolls back* afterward, and resets state - so DB tests are easy and safe and never touch your real data.
2. **The test `Client` (`self.client`) is an in-process fake browser**: `.get()`/`.post()` run a URL through your full routing and view logic with no server, returning a response you can assert on - status codes, content (`assertContains`), and login-required redirects (`302`).
3. **Arrange test data with `setUp` (per test), factory helpers, or `setUpTestData` (once per class)** for shared read-only data; `pytest-django` is a popular alternative runner that keeps the test DB machinery but uses plain `assert`.
4. **Structure by app**: each app (`blog`, `accounts`, `api`) is a self-contained feature with its own models/views/urls/tests; the project package holds only settings and root URLs. Well-isolated apps are even reusable across projects.
5. ⚠️ **Settings hold config *and* secrets - never commit `SECRET_KEY` or DB passwords.** Read them from the environment (env vars / `django-environ`) and split config per environment (base/dev/prod or env-driven).
6. ⚠️ **`DEBUG=True` must be off in production** - it leaks tracebacks, source, and settings to anyone who hits an error. A testable, well-structured Django app = focused apps + an automatic test DB + env-driven settings.

## Quick check

Three questions on the ideas that matter most before you ship in Phase 11:

```quiz
[
  {
    "q": "What does Django's TestCase do with the database when you run your tests?",
    "choices": [
      "Creates a separate test database, wraps each test in a transaction, and rolls it back after each test - leaving your real data untouched",
      "Runs the tests directly against your development database and deletes any rows the tests created at the end",
      "Refuses to let tests touch the database at all; you must mock every query",
      "Makes a one-time copy of your production database and runs tests against the copy"
    ],
    "answer": 0,
    "explain": "TestCase builds a throwaway test database (test_<yourdb>), runs each test method inside a transaction, and rolls that transaction back when the method returns. Each test starts clean and your real data is never affected - which is why DB tests in Django are safe and easy."
  },
  {
    "q": "You want to test that GET /posts/ returns 200 and shows a post's title, without starting a server. What do you use?",
    "choices": [
      "self.client.get(...) - the test Client calls the view in-process and returns the response to assert on",
      "requests.get('http://localhost:8000/posts/') after manually launching runserver in another terminal",
      "Selenium driving a real Chrome browser against a live deployment",
      "Reading views.py as a string and checking it mentions the word 'Post'"
    ],
    "answer": 0,
    "explain": "The test Client (self.client) runs the URL through your full routing and view logic inside the test process - no network, no live server. You then assert on the returned response's status_code and content (e.g. assertContains)."
  },
  {
    "q": "Which is a genuine production risk in Django settings?",
    "choices": [
      "Leaving DEBUG=True in production, because Django then serves full tracebacks with source code and settings to anyone who triggers an error",
      "Splitting settings into base/dev/prod files, because Django can only read a single settings.py",
      "Reading the SECRET_KEY from an environment variable, because Django requires it to be hard-coded",
      "Putting each feature in its own app, because apps cannot be reused across projects"
    ],
    "answer": 0,
    "explain": "DEBUG=True must be off in production: the debug error page exposes tracebacks, local variables, source, and settings - a serious information leak. Splitting settings, reading secrets from the environment, and one-app-per-feature are all good practices, not risks."
  }
]
```

---

[← Phase 9: Class-Based Views & Django REST Framework](09-class-based-views-and-drf.md) · [Guide overview](_guide.md) · [Phase 11: Production & Where to Go Next →](11-where-to-go-next.md)