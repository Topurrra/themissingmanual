---
title: "Flask From Zero"
guide: "flask-from-zero"
phase: 0
summary: "Learn the Python micro-framework that teaches you what a framework's minimum really is: routing and views, Jinja2 templates, forms and request data, databases via Flask-SQLAlchemy, blueprints and the app-factory pattern, sessions and auth, building a JSON API, and testing and deployment. Small core, your choices on top."
tags: [flask, python, framework, micro-framework, jinja2, blueprints, web, backend]
category: frameworks
order: 12
group: "Python"
difficulty: intermediate
synonyms: ["learn flask", "flask tutorial", "flask for beginners", "flask routing views", "flask jinja templates", "flask sqlalchemy database", "flask blueprints app factory", "flask vs django fastapi", "flask json api"]
updated: 2026-06-22
---

# Flask From Zero

Flask is the **micro-framework**: where Django hands you a whole workshop and FastAPI hands you a sharp
API tool, Flask hands you a small, clean core - routing, request/response, and templates - and lets *you*
choose everything else (which database library, which auth, which form handling). That minimalism is its
whole personality. It's why Flask is wonderful for small apps, prototypes, and learning, and why so much
of the Python web world runs on it. And because the core is so small, Flask is the best framework for
*seeing what a web framework actually is* underneath the conveniences.

We build that mental model first the whole way: a Flask app is a router that maps URLs to functions, plus
a request object coming in and a response going out, plus Jinja templates for HTML - and everything else
is an **extension** you bolt on. Once you see that, Flask stops being "the small one" and becomes "the one
where nothing is hidden."

> 📝 This teaches the **framework**. It assumes you know **Python** - functions, decorators, classes
> ([Python From Zero](/guides/python-from-zero)). It pairs naturally with
> [What a Framework Even Is](/guides/what-a-framework-even-is), and it's illuminating to compare with
> [Django](/guides/django-from-zero) (batteries-included) and [FastAPI](/guides/fastapi-from-zero) (async APIs).
> Flask needs a dev server to run, so examples here are shown with the commands to run them yourself.

## How to read this

Read in order - it grows one small app (a notes app) from a single file to a structured, tested,
deployable project. Phases carry difficulty badges.

## The phases

**Part 1 - The small core (🟢 Basic)**
1. **[What Flask Is & Your First App](01-what-flask-is.md)** 🟢 - the micro-framework idea, `@app.route`, and a running app in a few lines.
2. **[Routing & Views](02-routing-and-views.md)** 🟢 - dynamic URLs, HTTP methods, the request object, and responses.
3. **[Templates with Jinja2](03-templates-with-jinja.md)** 🟡 - `render_template`, the Jinja language, inheritance, and auto-escaping.

**Part 2 - A real application (🟡 Intermediate → 🔴)**
4. **[Forms & Request Data](04-forms-and-request-data.md)** 🟡 - handling POST, `request.form`, validation, and CSRF.
5. **[Working with a Database](05-database-with-sqlalchemy.md)** 🟡 - Flask-SQLAlchemy, models, and CRUD - the extension model in action.
6. **[Blueprints & the App Factory](06-blueprints-and-app-factory.md)** 🔴 - structuring beyond one file, and the patterns real Flask apps use.
7. **[Sessions, Auth & Extensions](07-sessions-auth-and-extensions.md)** 🟡 - sessions, Flask-Login, and the extension ecosystem that keeps Flask small.

**Part 3 - APIs, testing & production (🟡 → 🟢)**
8. **[Building a JSON API with Flask](08-building-a-json-api.md)** 🟡 - `jsonify`, REST endpoints, and when to reach for FastAPI instead.
9. **[Testing & Production](09-testing-and-production.md)** 🟡 - the test client, pytest, and deploying with a real WSGI server.
10. **[Where to Go Next](10-where-to-go-next.md)** 🟢 - the extension landscape, Flask vs the field, and what to build.

> The throughline: Flask is a small core plus your chosen extensions. That makes it the clearest window
> into what every web framework is doing - and a joy for anything that doesn't need the whole workshop.

---

[Phase 1: What Flask Is & Your First App →](01-what-flask-is.md)
