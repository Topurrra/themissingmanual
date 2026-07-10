---
title: "Class-Based Views & Django REST Framework"
guide: "django-from-zero"
phase: 9
summary: "Views as classes with one method per HTTP verb, Django's ready-made generic views for standard CRUD, and Django REST Framework for building JSON APIs on top of the ORM you already have."
tags: [django, class-based-views, generic-views, django-rest-framework, drf, serializers, api]
difficulty: intermediate
synonyms: ["django class based views", "django generic views listview detailview", "django rest framework tutorial", "drf serializers viewsets", "django api", "function vs class based views django", "drf vs fastapi"]
updated: 2026-07-10
---

# Class-Based Views & Django REST Framework

Back in [Phase 2](02-urls-and-views.md) you learned the whole contract for a view: a function that takes
an `HttpRequest` and returns an `HttpResponse`. That's still true, and it's still a perfectly good way to
write views. But once you've written your tenth "fetch all the posts, render a list" view, you start to
notice you're typing the same shape over and over. Django has two answers to that repetition, and this
phase is about both.

Here's the mental model to carry in before any code. **A view's job is always the same — turn a request
into a response — but most views fall into a handful of standard shapes: list these objects, show one
object, create one, edit one, delete one.** Function views make you write each shape by hand every time.
*Class-based views* let you describe a view as a class and inherit the boilerplate. *Generic views* go
further and hand you the whole shape pre-built. And when the response you want is JSON for another program
instead of HTML for a browser, *Django REST Framework* gives you the same leverage for APIs.

We'll keep building the blog around our `Post` model.

## Class-based views — a view as a class

📝 **A class-based view (CBV) is a view written as a Python class instead of a function.** Django still
calls it for each request, but instead of one function body that has to figure out the HTTP method itself,
you write one *method per HTTP verb*: a `get()` method for `GET` requests, a `post()` method for `POST`,
and so on. Django looks at the incoming request's method and routes to the matching method for you.

The point isn't "classes are nicer than functions." The point is *inheritance*: once a common pattern lives
in a base class, every view that needs that pattern can inherit it instead of repeating it.

Here's a plain function view — the kind you already know:

```python
# blog/views.py
from django.http import HttpResponse


def post_list(request):
    posts = Post.objects.all()
    body = "<br>".join(p.title for p in posts)
    return HttpResponse(body)
```

*What just happened:* a normal function view — fetch all posts, build a tiny HTML string, return it. If you
wanted to also handle `POST` here, you'd write `if request.method == "POST":` branches inside the one
function.

Now the same thing as a class-based view:

```python
# blog/views.py
from django.http import HttpResponse
from django.views import View


class PostListView(View):
    def get(self, request):
        posts = Post.objects.all()
        body = "<br>".join(p.title for p in posts)
        return HttpResponse(body)
```

*What just happened:* we subclassed Django's base `View` and put the GET logic in a `get()` method. There's
no `if request.method ==` branching anymore — Django inspects the method and calls `get()` for a GET
request (and would call `post()` for a POST, if we'd written one). The wiring in `urls.py` changes
slightly, since the URLconf needs a callable, and a class isn't one until you call `.as_view()` on it:

```python
# blog/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path("posts/", views.PostListView.as_view(), name="post_list"),
]
```

*What just happened:* `PostListView.as_view()` returns a function that Django can call like any view — it
builds an instance of your class per request and dispatches to the right method. From the URLconf's
perspective it's still just "a callable that takes a request," exactly like a function view.

⚠️ Honest take, because the hype around CBVs oversells them: a class-based view that just defines one
`get()` method is *more* code than the function version, not less. CBVs pay off only when there's a
pattern worth inheriting, and they have a real cost — when logic lives in a parent class you didn't write,
reading a CBV can mean chasing methods up an inheritance chain. For genuinely custom, one-off logic, a
function view is usually clearer. Don't convert working function views to classes just because you can.

## Generic views — the patterns, pre-built

The CBV above is still doing its own ORM query and its own response-building. But "list all objects of a
model" is such a universal pattern that Django already wrote it for you. 📝 **Generic views are Django's
ready-made class-based views for the common cases** — `ListView`, `DetailView`, `CreateView`, `UpdateView`,
and `DeleteView`. You point one at a model, tell it which template to use, and you get a working
list/detail/create/edit/delete page with almost no code of your own.

Here's a list page and a detail page for `Post`, in their entirety:

```python
# blog/views.py
from django.views.generic import ListView, DetailView
from .models import Post


class PostListView(ListView):
    model = Post
    template_name = "blog/post_list.html"
    context_object_name = "posts"


class PostDetailView(DetailView):
    model = Post
    template_name = "blog/post_detail.html"
    context_object_name = "post"
```

*What just happened:* `ListView` already knows the whole shape — run `Post.objects.all()`, render a
template, and pass the results in. You only had to declare *which* model (`model = Post`), *which*
template, and what name the objects get inside that template (`context_object_name`). `DetailView` does
the same for a single object: it reads the `pk` (or slug) captured from the URL, fetches that one `Post`,
and 404s automatically if it doesn't exist — the `get_object_or_404` logic you wrote by hand in Phase 2 is
baked in. The URLconf uses `.as_view()` just like before:

```python
# blog/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path("posts/", views.PostListView.as_view(), name="post_list"),
    path("posts/<int:pk>/", views.PostDetailView.as_view(), name="post_detail"),
]
```

*What just happened:* `DetailView` expects the URL to capture the primary key as `pk` (the default name it
looks for), so the route is `posts/<int:pk>/`. With those two patterns and the two short classes above,
you have a fully working list-and-detail blog — including pagination support and not-found handling —
without writing a single query or `render()` call.

💡 This is where CBVs earn their keep: the generic views collapse the repetitive CRUD scaffolding down to
a few declarative lines. `CreateView`, `UpdateView`, and `DeleteView` extend the same idea to forms — they
build the form from your model, validate submitted data, save it, and redirect, all from a handful of
attributes.

## When to use which

So you have three tools — function views, hand-written CBVs, and generic CBVs — and the natural question is
which one to reach for. The answer is refreshingly simple, and it's *not* "always use the newest one."

💡 **Use a function view when the logic is custom or one-off.** If a view does something unusual — a weird
multi-step flow, an odd combination of queries, logic that doesn't map cleanly onto "list/detail/create" —
a plain function is the most readable thing you can write, everything right there in one body, top to
bottom, no inheritance to chase.

💡 **Use a generic CBV when the view is standard CRUD.** A plain list page, a plain detail page, a basic
create/edit/delete form over a model — exactly what `ListView` and friends exist for, and writing them as
functions is just re-typing what Django already gave you.

⚠️ The trap to avoid is cargo-culting: converting *every* view to a class because tutorials use them, or
forcing genuinely custom logic into a generic view by overriding six methods until it bends to your will.
At that point the generic view is fighting you, and a function view would have been clearer. Mix both
freely in the same project — pick per view based on how standard the work is, not on dogma.

## Django REST Framework — for building APIs

Everything so far renders **HTML** for a browser. But plenty of the time you're not building a web page at
all — you're building an **API**: endpoints that return **JSON** for a mobile app, a JavaScript front end,
or another service to consume. (If "API," "endpoint," and "JSON over HTTP" aren't second nature yet, read
[REST APIs explained](/guides/rest-apis-explained) alongside this section.)

Plain Django *can* return JSON with `JsonResponse`, but the moment you need validation, authentication,
permissions, and consistent error formats, you'd be rebuilding a lot of machinery. 📝 **Django REST
Framework (DRF) is the de-facto library for building JSON APIs on top of Django.** A separate package you
install (`pip install djangorestframework`) and add to `INSTALLED_APPS`, bringing four big pieces:

- **Serializers** — convert model instances to JSON and validate incoming JSON back into model data. This
  is the same role [Pydantic plays in FastAPI](/guides/fastapi-from-zero): the single place that defines
  what your API accepts and emits.
- **`APIView` / `ViewSet`** — DRF's request handlers, analogous to Django's views but speaking JSON and
  HTTP verbs natively.
- **Routers** — generate the URL patterns for a `ViewSet` automatically, so you don't hand-wire every route.
- **Auth, permissions, and the browsable API** — pluggable authentication and permission classes, plus a
  rendered HTML interface for exploring your API in a browser during development.

Let's expose `Post` as a JSON API. First, a serializer that says what a `Post` looks like over the wire:

```python
# blog/serializers.py
from rest_framework import serializers
from .models import Post


class PostSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = ["id", "title", "body", "created_at"]
```

*What just happened:* `ModelSerializer` is to APIs what `ModelForm` was to HTML forms in
[Phase 6](06-forms-and-validation.md) — it inspects the model and builds the field definitions for you.
You only listed which fields to expose. This one class now does both directions: turning a `Post` object
into `{"id": ..., "title": ..., ...}` JSON on the way out, *and* validating incoming JSON into clean data
on the way in — the single source of truth for the shape of your API.

Now a `ViewSet` that wires the serializer to CRUD operations, plus a router to build the URLs:

```python
# blog/views.py
from rest_framework import viewsets
from .models import Post
from .serializers import PostSerializer


class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
```

```python
# blog/urls.py
from rest_framework.routers import DefaultRouter
from .views import PostViewSet

router = DefaultRouter()
router.register(r"posts", PostViewSet, basename="post")

urlpatterns = router.urls
```

*What just happened:* `ModelViewSet` is the API cousin of the generic CRUD views — from just a `queryset`
and a `serializer_class`, it gives you the full set of endpoints: list all posts, retrieve one, create,
update, delete, each on the correct HTTP verb. `DefaultRouter` then *generates* the URL patterns for that
ViewSet automatically — you didn't write a `path()` per endpoint. A `GET` to `/posts/` now returns
something like:

```json
[
  {
    "id": 1,
    "title": "Hello, world",
    "body": "My first post.",
    "created_at": "2026-06-22T10:30:00Z"
  },
  {
    "id": 2,
    "title": "On generic views",
    "body": "They save real boilerplate.",
    "created_at": "2026-06-22T11:00:00Z"
  }
]
```

*What just happened:* DRF ran the queryset, passed each `Post` through `PostSerializer`, and rendered the
result as a JSON array — a complete, working REST endpoint from a serializer, a ViewSet, and a router. A
`POST` to the same URL with a JSON body runs that body *through* the serializer's validation and saves a
new `Post` if it's valid, or returns a structured error response if it isn't. Visit `/posts/` in a browser
during development and DRF even renders its browsable API: a clickable HTML view of the same endpoint.

## DRF vs FastAPI — the honest comparison

You may have noticed this looks a lot like [FastAPI](/guides/fastapi-from-zero), and that's a fair
observation — both turn typed/declared schemas into validated JSON endpoints. So which do you reach for? The
honest answer is that it's rarely a head-to-head fight; it's about *what else you need*.

💡 **Reach for DRF when you're already in Django.** If your project has the Django ORM, the admin, the auth
system, migrations, and a body of existing models — and now you also need a JSON API over that same data —
DRF lets you reuse *all of it*. Your serializers wrap models you already have; your API endpoints sit
inside the project that already runs your site. This is an extremely common situation (a Django site that
grows a mobile app or a JS front end), which is why "Django + DRF" is one of the most in-demand stacks in
job listings.

💡 **Reach for FastAPI when you want a lean, API-first service** and you *don't* need the rest of Django.
If you're building a standalone JSON service — no server-rendered pages, no Django admin, maybe heavy
async I/O — FastAPI gives you validation and auto-generated docs with far less framework around it.

The decision, boiled down: **pick by whether you want the whole Django stack.** If the API is one feature
of a larger Django application, DRF is the natural fit. If the API *is* the whole application and you'd
otherwise be ignoring most of Django, FastAPI is the leaner choice.

## Recap

1. 📝 A **class-based view** is a view written as a class with one method per HTTP verb (`get()`, `post()`),
   wired into `urls.py` with `.as_view()`. The payoff is inheriting common patterns instead of repeating
   them.
2. ⚠️ CBVs aren't automatically better — a one-method CBV is more code than the function version, and logic
   in a parent class is harder to trace. Function views stay clearer for custom, one-off logic.
3. 📝 **Generic views** (`ListView`, `DetailView`, `CreateView`, `UpdateView`, `DeleteView`) are Django's
   pre-built CBVs for standard CRUD — declare a model and template and get a working page in a few lines.
4. 💡 Choose by the work: **function views for custom logic, generic CBVs for standard CRUD.** Don't
   cargo-cult classes onto everything.
5. 📝 **Django REST Framework** builds JSON APIs on Django: `ModelSerializer` (validation + JSON, like
   Pydantic's role), `ViewSet`/`ModelViewSet`, routers that generate URLs, plus auth, permissions, and a
   browsable API.
6. 💡 **DRF vs FastAPI:** use DRF when the API is part of a Django app and you want to reuse the ORM, admin,
   and auth; use FastAPI when you want a lean, standalone API service without the rest of Django.

You can now serve both halves of the modern web from Django: HTML pages, concisely, via generic views — and
JSON APIs, validated and routed, via DRF. The last phase ties the whole guide together: testing your views
and models, and structuring a Django project so it stays maintainable as it grows.

## Quick check

Three questions on the ideas that have to stick — what CBVs and generic views actually buy you, and where
DRF fits.

```quiz
[
  {
    "q": "What is the defining structural difference between a class-based view and a function view?",
    "choices": [
      "A CBV is a class with one method per HTTP verb (get, post), routed by Django based on the request method",
      "A CBV runs faster because Django compiles it ahead of time",
      "A CBV can return JSON while a function view can only return HTML",
      "A CBV does not need to be referenced in urls.py"
    ],
    "answer": 0,
    "explain": "A CBV organizes view logic as methods named after HTTP verbs (get, post, ...). Django inspects the request method and dispatches to the matching method. It's wired up with .as_view() in urls.py."
  },
  {
    "q": "You need a plain page that lists every Post and a page that shows one Post. What's the most appropriate choice?",
    "choices": [
      "Generic views: ListView and DetailView, each given a model and template",
      "A single function view with many if/else branches on request.method",
      "Django REST Framework, since any list of objects is an API",
      "Hand-written CBVs that re-implement the query and render() yourself"
    ],
    "answer": 0,
    "explain": "List-all and show-one are exactly the standard CRUD shapes ListView and DetailView were built for. You declare the model and template and get the query, rendering, and 404 handling for free — no reason to hand-write it or pull in DRF."
  },
  {
    "q": "When does Django REST Framework make more sense than FastAPI for building a JSON API?",
    "choices": [
      "When the API is part of a Django project and you want to reuse the existing ORM, admin, and auth",
      "Whenever the API must be asynchronous and handle heavy I/O",
      "When you want the absolute minimum framework around a standalone service",
      "Whenever you need automatically generated interactive documentation"
    ],
    "answer": 0,
    "explain": "DRF shines when you're already in Django and want your API to ride on the models, admin, and auth you already have. FastAPI is the leaner pick for a standalone, API-first service that wouldn't use the rest of Django."
  }
]
```

---

[← Phase 8: Users, Auth & Sessions](08-users-auth-and-sessions.md) · [Guide overview](_guide.md) · [Phase 10: Testing & Project Structure →](10-testing-and-project-structure.md)
