---
title: "Sessions, Auth & Extensions"
guide: "flask-from-zero"
phase: 7
summary: "Flask's session is a signed cookie; real login is an extension you add. Wire Flask-Login into the notes app, protect note-creation with @login_required, and see the ecosystem that keeps Flask small."
tags: [flask, sessions, authentication, flask-login, extensions, cookies, login-required]
difficulty: intermediate
synonyms: ["flask sessions", "flask-login authentication", "flask login required", "flask session cookie", "flask extensions ecosystem", "flask user auth", "flask secret key"]
updated: 2026-07-10
---

# Sessions, Auth & Extensions

Right now anyone who can reach your notes app can create notes. There's no "logged in," no "this is *my* note" — the whole concept of a user doesn't exist yet. This phase fixes that the Flask way: a tiny built-in piece (the session) plus an extension you bolt on (Flask-Login).

The mental model: **logging a user in is just remembering, across requests, that this browser belongs to a known person.** HTTP forgets you between requests — that's the bare problem the [Servlet sessions guide](/guides/the-servlet-api) walks through from the ground up. Flask's answer is the trick every framework uses: an id rides along in a cookie, and the server reads it back on the next request. Flask wraps that in an object called `session`.

## The Flask `session`

📝 **`flask.session` is a dict-like object backed by a signed cookie.** You write to it like a dictionary; Flask serializes those values, signs them, and ships them to the browser as a cookie. On the next request the browser sends the cookie back, Flask verifies the signature, and `session` is repopulated. Data you put in it persists across requests *for that one user* — which is exactly what "stay logged in" needs.

It needs one thing to work: a secret key, because that's what the signature is made with.

```python
from flask import Flask, session, redirect, url_for

app = Flask(__name__)
app.secret_key = "change-me-to-a-long-random-value"  # signs the session cookie

@app.route("/visit")
def visit():
    # Read with a default, increment, write back.
    session["visits"] = session.get("visits", 0) + 1
    return f"You've visited {session['visits']} times."
```

*What just happened:* `session` behaves like a normal dict — `session.get("visits", 0)` reads a value (defaulting to 0 the first time), and `session["visits"] = ...` writes it. But it's not stored on the server: Flask packs the whole dict into the signed cookie. Reload the page and the count climbs, since the browser hands the cookie back each time. Without `app.secret_key` set, Flask refuses to use the session at all.

⚠️ **Signed is not encrypted.** The signature makes the cookie *tamper-proof* — change one byte and Flask rejects it — but by default the contents are only base64-encoded, not hidden. Anyone who reads the cookie can read its values. Never put secrets in the session: no passwords, no API keys, no private data. Store a *reference* (like a user id) and look up the sensitive stuff server-side. Same "the cookie is just the key" principle the [Servlet sessions guide](/guides/the-servlet-api) hammers on.

💡 Keep `secret_key` genuinely secret and random in production — load it from an environment variable, never hardcode it. If an attacker learns it, they can forge any session.

## Auth = identity (a quick recap)

Before wiring up login, get one distinction straight — mixing them up is the root of most auth bugs.

📝 **Authentication is *who you are*; authorization is *what you're allowed to do*.** Logging in is authentication — proving you're the owner of an account. Deciding whether you may edit *this particular note* is authorization. This phase is about the first one; the [authentication vs authorization guide](/guides/auth-vs-authz) draws the full line between them.

The other non-negotiable: how you store passwords.

⚠️ **Never store passwords as plain text. Hash them.** When a user signs up you store a one-way *hash* of their password, not the password itself; at login you hash what they typed and compare hashes. Werkzeug (which ships with Flask) gives you exactly the two functions for this:

```python
from werkzeug.security import generate_password_hash, check_password_hash

hashed = generate_password_hash("hunter2")        # store THIS in the database
print(hashed)
# 'scrypt:32768:8:1$k9...': algorithm + parameters + salt + hash, all in one string

check_password_hash(hashed, "hunter2")   # True  — correct password
check_password_hash(hashed, "wrong")     # False — wrong password
```

*What just happened:* `generate_password_hash` runs the password through a deliberately slow, salted hashing algorithm and returns a single string holding the algorithm, its parameters, the random salt, and the hash — that's what goes in your `User` table's `password_hash` column. At login, `check_password_hash` re-hashes the attempt with the stored salt and compares, returning `True` only on a real match. You never store, log, or compare the raw password. The [how passwords are stored guide](/guides/how-passwords-are-stored) explains why hashing-with-salt is the only acceptable approach.

## Flask-Login: the extension

Flask doesn't ship a login system — true to form, you add one. 💡 The standard choice is **Flask-Login**, the extension pattern from [Phase 5](05-database-with-sqlalchemy.md) all over again: a focused library that integrates cleanly into Flask's request lifecycle and the session you just met. It manages the "is this browser logged in, and as whom?" bookkeeping so you don't hand-roll it.

It needs three pieces wired together: a `LoginManager`, a `User` model that mixes in `UserMixin`, and a *user loader* that turns a stored id back into a user object.

```python
from flask_login import LoginManager, UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
# db is the Flask-SQLAlchemy handle from Phase 5

login_manager = LoginManager(app)
login_manager.login_view = "auth.login"   # where @login_required sends anonymous users

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))   # called on every request to restore current_user
```

*What just happened:* `LoginManager(app)` plugs Flask-Login into the app and the session machinery. `login_view` tells it which route to bounce unauthenticated visitors to. The `User` model is an ordinary Flask-SQLAlchemy model — but `UserMixin` adds the properties Flask-Login expects for free (`is_authenticated`, `get_id()`, and friends). The `@login_manager.user_loader` is the linchpin: Flask-Login stores only the user *id* in the session cookie, and on every request it calls `load_user` with that id to fetch the full `User` — the "store a reference, look up the rest server-side" rule made concrete.

Now the login view itself — verify the password, then log the user in:

```python
from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_user, logout_user, login_required

auth = Blueprint("auth", __name__)   # the auth blueprint from Phase 6

@auth.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        user = User.query.filter_by(username=request.form["username"]).first()
        if user and user.check_password(request.form["password"]):
            login_user(user)                      # <-- the session now remembers this user
            return redirect(url_for("notes.list_notes"))
        flash("Invalid username or password.")
    return render_template("login.html")

@auth.route("/logout")
@login_required
def logout():
    logout_user()                                 # forget the user for this session
    return redirect(url_for("auth.login"))
```

*What just happened:* on a POST we look up the user by username and verify the typed password with `check_password` (hash comparison, never plain text). If both check out, `login_user(user)` records the user's id in the session — from here on, every request from this browser is recognized as that user until they log out. We deliberately don't tell the visitor *which* field was wrong. `logout_user()` does the reverse. This all lives in an `auth` blueprint, from [Phase 6](06-blueprints-and-app-factory.md).

## Protecting routes

With login working, you can now demand it. 📝 **`@login_required` is a decorator that gates a view behind authentication.** Stack it on any route and Flask-Login intercepts anonymous visitors before your code runs, redirecting them to `login_view`. Here's the create-note route from [Phase 5](05-database-with-sqlalchemy.md), now protected and stamping each note with its owner:

```python
from flask_login import login_required, current_user

@notes.route("/notes", methods=["POST"])
@login_required                                   # must be logged in to reach this
def create_note():
    note = Note(
        title=request.form["title"],
        content=request.form["content"],
        user_id=current_user.id,                  # who created it
    )
    db.session.add(note)
    db.session.commit()
    return redirect(url_for("notes.list_notes"))
```

*What just happened:* `@login_required` sits between the route and the function. An anonymous visitor never reaches the body — Flask-Login redirects them to the login page and (if configured) remembers where they were headed. Inside the view, `current_user` is the logged-in `User` object Flask-Login restored via your `user_loader`; reading `current_user.id` records who owns the note. (The `user_id` column on `Note` is the relationship plumbing from Phase 5.)

`current_user` is available in templates too, which is how you show different UI to logged-in and logged-out visitors:

```html
{% if current_user.is_authenticated %}
  <p>Signed in as {{ current_user.username }} — <a href="{{ url_for('auth.logout') }}">Log out</a></p>
  <a href="{{ url_for('notes.new_note') }}">New note</a>
{% else %}
  <a href="{{ url_for('auth.login') }}">Log in</a> to create notes.
{% endif %}
```

*What just happened:* `current_user.is_authenticated` is one of the properties `UserMixin` gave the `User` model — `True` for a logged-in user, `False` for an anonymous one. Flask-Login injects `current_user` into every template automatically, so you can branch on it without passing it in. Server-side `@login_required` is the real guard; this template check is just honest UI on top of it.

## The extension ecosystem

Sessions came from Flask's tiny core; *everything else* — the ORM in Phase 5, login here — arrived as an extension you chose and wired in. 💡 **This is how Flask stays small: a rich ecosystem of focused extensions you compose into exactly the app you need.** A few you'll meet constantly:

- **Flask-SQLAlchemy** — the database/ORM layer (Phase 5).
- **Flask-Login** — session-based authentication (this phase).
- **Flask-WTF** — form handling and CSRF protection (Phase 4).
- **Flask-Migrate** — schema migrations via Alembic (Phase 5's gotcha).
- **Flask-Mail** — sending email.
- **Flask-CORS** — cross-origin headers for APIs (handy in Phase 8).

⚠️ **The flip side is real: you assemble and maintain the stack yourself.** Django hands you auth, an ORM, an admin, and forms in one box, version-matched and integrated. Flask hands you a core and a catalog — you pick each piece, wire it in, and keep the versions playing nicely. For a small or focused app that freedom is a gift; for a large team it's overhead Django would have absorbed.

💡 **Sessions plus Flask-Login give you real authentication; the extension model gives you everything else.** You've now seen Flask's whole personality — a small, honest core you grow by deliberate choices. Next we point that app outward and have it speak JSON.

## Recap

1. **`flask.session` is a dict-like store backed by a signed cookie** and needs `app.secret_key`. Write to it like a dict; values persist across requests for that user because the cookie round-trips on every request.
2. ⚠️ **Signed ≠ encrypted.** The session cookie is tamper-proof but readable by default — never put secrets in it. Store a reference (a user id) and look up sensitive data server-side.
3. **Authentication (who you are) is separate from authorization (what you can do)**, and passwords must be hashed — use Werkzeug's `generate_password_hash` / `check_password_hash`, never plain text.
4. **Flask-Login is the standard auth extension**: a `LoginManager`, a `UserMixin` model, a `user_loader` to restore `current_user` from the session, and `login_user` / `logout_user` in your views.
5. **`@login_required` gates a route** behind authentication and redirects anonymous visitors to the login page; `current_user` gives you the logged-in user in views and templates (`current_user.is_authenticated`).
6. 💡 **Flask stays small via its extension ecosystem** (Flask-SQLAlchemy, Flask-WTF, Flask-Login, Flask-Migrate, Flask-Mail, Flask-CORS…) — you compose them yourself, which is freedom for small apps and assembly work versus Django's all-in-one.

## Quick check

Three questions on the ideas that have to stick before Phase 8:

```quiz
[
  {
    "q": "The Flask session cookie is signed. What does that protect against, and what does it NOT protect against?",
    "choices": [
      "It protects against tampering (a forged cookie is rejected) but not against reading — values are not encrypted by default, so don't store secrets there",
      "It encrypts the contents, so it's safe to store passwords and API keys in the session",
      "It protects against the cookie being read by JavaScript, but allows tampering",
      "It hides the cookie from the browser entirely; only the server can see it"
    ],
    "answer": 0,
    "explain": "Signing makes the cookie tamper-proof — Flask rejects any modified cookie — but the values are only encoded, not encrypted. Anyone who reads the cookie reads the data, so store a reference (like a user id), never secrets."
  },
  {
    "q": "In a Flask-Login setup, what is the @login_manager.user_loader function for?",
    "choices": [
      "It takes the user id stored in the session and returns the full User object, so current_user is available on each request",
      "It checks the typed password against the stored hash during login",
      "It decides which routes require authentication",
      "It creates the session cookie and signs it on login"
    ],
    "answer": 0,
    "explain": "Flask-Login stores only the user id in the session. On every request it calls user_loader with that id to fetch the full User from the database and populate current_user — the 'store a reference, look it up server-side' pattern."
  },
  {
    "q": "You put @login_required on the create-note route. An anonymous visitor POSTs to it. What happens?",
    "choices": [
      "Flask-Login intercepts the request before the view body runs and redirects the visitor to the configured login_view",
      "The view runs but current_user is None, so you must check for it manually",
      "Flask returns a 500 error because no user is logged in",
      "The note is created and assigned to a default anonymous user"
    ],
    "answer": 0,
    "explain": "@login_required gates the view: an unauthenticated request never reaches your code. Flask-Login redirects the visitor to login_view (and can remember where they were headed), so the create-note logic only ever runs for a logged-in user."
  }
]
```

---

[← Phase 6: Blueprints & the App Factory](06-blueprints-and-app-factory.md) · [Guide overview](_guide.md) · [Phase 8: Building a JSON API with Flask →](08-building-a-json-api.md)