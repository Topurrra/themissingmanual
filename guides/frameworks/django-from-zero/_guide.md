---
title: "Django From Zero"
guide: "django-from-zero"
phase: 0
summary: "Learn the batteries-included Python web framework: the project/app structure and MTV pattern, URLs and views, the ORM and migrations, the famous auto-admin, templates, forms and CSRF, the ORM in depth (and the N+1 trap), the built-in auth system, class-based views and Django REST Framework, testing, and production. The framework that ships with everything, explained."
tags: [django, python, framework, web, orm, admin, mtv, drf, backend]
category: frameworks
order: 9
group: "Python"
difficulty: intermediate
synonyms: ["learn django", "django tutorial", "django for beginners", "django orm migrations", "django admin", "django templates mtv", "django forms csrf", "django rest framework", "django vs fastapi flask"]
updated: 2026-06-22
---

# Django From Zero

Django's pitch is "the web framework for perfectionists with deadlines," and it earns it by shipping with
*everything*: an ORM, a database migration system, a templating engine, a forms library, a full
authentication system, and - its most famous trick - an automatic admin interface generated from your
data models. Where [FastAPI](/guides/fastapi-from-zero) hands you a sharp tool for APIs and lets you
assemble the rest, Django hands you a whole workshop with strong opinions about where each tool goes.
That "batteries-included, conventions everywhere" philosophy is the thing to understand first - once you
think in Django's structure, the framework stops feeling enormous and starts feeling guided.

We build the mental model first the whole way: the project/app layout, the **MTV** request flow (Model →
View → Template), the ORM that turns classes into tables, and the conventions that make the admin and
auth "just appear." By the end you'll build a real, database-backed, authenticated web app and understand
the structure holding it together.

> 📝 This teaches the **framework**. It assumes you know **Python** - classes, functions, decorators
> ([Python From Zero](/guides/python-from-zero)). Helpful background:
> [What a Database Is](/guides/what-a-database-is) and [What a Framework Even Is](/guides/what-a-framework-even-is).
> Django code needs a project + database to run, so examples here are shown with the commands to run them
> yourself rather than executed on the page.

## How to read this

Read in order - it builds one app (a small blog with posts and comments) and adds a Django subsystem per
phase. Phases carry difficulty badges.

## The phases

**Part 1 - The Django way (🟢 Basic)**
1. **[What Django Is & Your First Project](01-what-django-is.md)** 🟢 - batteries-included, the MTV pattern, projects vs apps, `manage.py`.
2. **[URLs & Views](02-urls-and-views.md)** 🟢 - the URLconf, views, and how a request becomes a response.
3. **[Models & the ORM](03-models-and-the-orm.md)** 🟢 - defining models, migrations, and querying without SQL.

**Part 2 - Batteries included (🟡 Intermediate)**
4. **[The Django Admin](04-the-django-admin.md)** 🟡 - the auto-generated back-office that's Django's killer feature.
5. **[Templates & the MTV Pattern](05-templates-and-mtv.md)** 🟡 - the template language, context, and inheritance.
6. **[Forms & Validation](06-forms-and-validation.md)** 🟡 - `Form`/`ModelForm`, validation, and CSRF protection.
7. **[The ORM, Deeper](07-the-orm-deeper.md)** 🔴 - lazy QuerySets, relationships, the N+1 trap, and aggregation.
8. **[Users, Auth & Sessions](08-users-auth-and-sessions.md)** 🔴 - the built-in auth system, login, permissions, and sessions.

**Part 3 - APIs, testing & production (🟡 → 🟢)**
9. **[Class-Based Views & Django REST Framework](09-class-based-views-and-drf.md)** 🟡 - CBVs, generic views, and building APIs with DRF.
10. **[Testing & Project Structure](10-testing-and-project-structure.md)** 🟡 - Django's test framework, app organization, and settings.
11. **[Production & Where to Go Next](11-where-to-go-next.md)** 🟢 - deployment, static files, the security checklist, and what to build.

> Django and FastAPI aren't rivals so much as different bets: Django for full web apps with an admin and
> server-rendered pages; FastAPI for lean, async APIs. Knowing both means picking the right one on purpose.

---

[Phase 1: What Django Is & Your First Project →](01-what-django-is.md)
