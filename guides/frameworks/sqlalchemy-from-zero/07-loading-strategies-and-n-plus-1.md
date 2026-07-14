---
title: "Loading Strategies & the N+1 Trap"
guide: "sqlalchemy-from-zero"
phase: 7
summary: "Why a relationship() fires a query the moment you touch it, how that quietly becomes the N+1 disaster, the DetachedInstanceError it causes, and how selectinload and joinedload collapse the flood back to one or two queries."
tags: [sqlalchemy, lazy-loading, eager-loading, n-plus-one, selectinload, joinedload, performance]
difficulty: advanced
synonyms: ["sqlalchemy n+1 problem", "sqlalchemy lazy vs eager loading", "sqlalchemy selectinload joinedload", "sqlalchemy relationship loading", "sqlalchemy DetachedInstanceError", "sqlalchemy query performance", "sqlalchemy fix n+1"]
updated: 2026-07-10
---

# Loading Strategies & the N+1 Trap

[Phase 6](06-relationships.md) handed you something that feels like magic: write `author.books` and a list of
`Book` objects appears. No JOIN, no `author_id` fiddling, no SQL at all on your screen. That ergonomic win is
real - and it hides the single most important performance question in the whole guide: **when you touch
`author.books`, what does SQLAlchemy actually do behind your back?**

The answer is the difference between a page that loads in 10 milliseconds and one that loads in 10 seconds.
Almost every "SQLAlchemy is slow" complaint you'll ever read traces back to getting this wrong without
noticing. We're going to make it visceral - you're going to *see* the flood of queries - because once
you've watched one loop fire 101 queries, you will never write a blind loop over a relationship again.

## The mental model: a relationship loads when you touch it

📝 **By default, a `relationship()` is *lazy*: it loads nothing until you access the attribute, and at the
exact moment you do, SQLAlchemy fires a query.** The attribute isn't your data sitting there waiting - it's a
trigger. Reading it pulls the trigger.

Hold that one sentence the whole phase: **lazy means the query runs the moment you read the attribute, not
before.** Convenient, because you don't load books for an author whose books you never look at. Dangerous,
because the cost is invisible in the Python - an attribute access looks free, and it isn't.

Watch a single lazy load happen:

```python
author = session.get(Author, 1)     # query #1: load the author row

print(author.name)                  # no query - name came back with the author

for book in author.books:           # 💥 touching .books NOW fires query #2
    print(book.title)
```

The SQL that actually hits the database:

```sql
-- session.get(Author, 1):
SELECT authors.id, authors.name FROM authors WHERE authors.id = 1;

-- ...nothing more until you touch author.books, and THEN:
SELECT books.id, books.title, books.author_id
FROM books WHERE books.author_id = 1;
```

*What just happened:* `session.get` ran exactly **one** query - for the author. `author.name` was already in
hand, so reading it cost nothing. But the line `for book in author.books` is where the second query fires:
that's the lazy relationship "waking up." Lazy isn't *whether* you pay for the books - it's *when*. And that
timing is the root of both problems in this phase.

## DetachedInstanceError: the lazy load that can't fire

📝 A lazy relationship can only run its query while the `Session` is still **open and watching the object**.
Recall from [Phase 4](04-the-session-and-unit-of-work.md): once the Session closes, every object it loaded becomes
**detached** - nobody's tracking it, and there's no live Session to run a query through. So if you touch a
lazy attribute *after* the Session closed, the trigger has nothing to fire into, and SQLAlchemy raises.

This is the classic web-app bug, and the shape is always the same: **load in one place, access in another.**

```python
# --- data layer: the Session opens AND closes here ---
def load_author(author_id):
    with Session(engine) as session:
        author = session.get(Author, author_id)   # .books NOT loaded (lazy)
        return author
    # ← the `with` block exits: Session closed, `author` is now DETACHED

# --- view / template layer: the Session is long gone ---
author = load_author(1)
for book in author.books:        # 💥 the lazy trigger fires into nothing
    print(book.title)
```

```console
sqlalchemy.orm.exc.DetachedInstanceError: Parent instance <Author at 0x...> is not
bound to a Session; lazy load operation of attribute 'books' cannot proceed
```

*What just happened:* `load_author` opened a Session, fetched the author *without* the books, then the `with`
block closed the Session - detaching the author. Back in the view, `author.books` asks the lazy trigger to
load, but its Session is gone: no open Session, no query, no data, exception. ⚠️ The tempting "fix" is to
make the relationship eager so it loads before the Session closes - but that just trades this crash for the
N+1 you're about to meet. The real fix is to **load the books deliberately while the Session is open**, which
is the rest of this phase. This is Phase 4's rule biting: *a detached object can't lazy-load.*

## The N+1 problem: the main event

This is the one. The performance killer that ships to production looking completely innocent, sails through
code review, works flawlessly on your laptop, and then falls over the first time it meets real data. Watch
closely.

You load all your authors - one clean query - then loop over them to print each author's book count. Every
`author.books` access is a lazy load, so every iteration pulls the trigger:

```python
authors = session.scalars(select(Author)).all()   # query #1: all the authors

for author in authors:
    print(f"{author.name}: {len(author.books)} books")
    #                       ↑ each iteration fires ANOTHER query
```

It reads like an ordinary loop. It is a slow-motion disaster. Here's the SQL SQLAlchemy actually emits with,
say, 100 authors:

```sql
SELECT authors.id, authors.name FROM authors;            -- the "1": one query for all authors

SELECT books.id, books.title, books.author_id FROM books WHERE books.author_id = 1;    -- the "N" begins...
SELECT books.id, books.title, books.author_id FROM books WHERE books.author_id = 2;
SELECT books.id, books.title, books.author_id FROM books WHERE books.author_id = 3;
SELECT books.id, books.title, books.author_id FROM books WHERE books.author_id = 4;
-- ... one more SELECT for every single author ...
SELECT books.id, books.title, books.author_id FROM books WHERE books.author_id = 99;
SELECT books.id, books.title, books.author_id FROM books WHERE books.author_id = 100;
```

*What just happened:* **1 query to load the authors, then N more - one per author - to load each one's
books.** That's `1 + N` queries. 100 authors = **101 queries**. A thousand authors = 1001. Each one is a
full round trip to the database: network hop, parse, plan, execute, return. Individually they're quick;
multiplied by N they're a stampede, and your endpoint crawls. This is the **N+1 problem**, and it is the
number-one reason ORMs get blamed for being slow.

⚠️ The cruelty of N+1 is that it's *invisible in the code and scales with your data, not your logic*. The
Python is a clean loop. It works perfectly with 3 authors in your test database. Then it meets 5,000 authors
in production and dies - and nobody changed a line. It passes code review because there's nothing to see; the
query count lives in the data, not the source. The only way to catch it is to *watch the SQL*.

This isn't a SQLAlchemy quirk - it's an ORM-shaped trap that bites every ORM the same way. If you've met it
in Java, [Hibernate & JPA from Zero](/guides/hibernate-and-jpa-from-zero) walks the identical problem with
`JOIN FETCH`; the disease and the cure are the same, only the syntax changes. And when the slow query is one
you *did* write deliberately - not an accidental flood - that's a different skill, measuring and reading query
plans, covered in [Why Is My Query Slow?](/guides/why-is-my-query-slow).

## Eager loading: selectinload vs joinedload

The cure for N+1 is to tell SQLAlchemy up front, *I'm going to need the books - fetch them together.* You do
that per query with `.options(...)` on your `select`, and you have two main tools. They both eliminate the
N+1; they differ in *how* the SQL comes out, and that difference matters.

### selectinload - a second query with IN (best for collections)

`selectinload(Author.books)` issues **one extra query** that loads all the needed books at once, using an
`IN` clause over the author ids it already fetched:

```python
from sqlalchemy.orm import selectinload

authors = session.scalars(
    select(Author).options(selectinload(Author.books))
).all()

for author in authors:
    print(f"{author.name}: {len(author.books)} books")   # no extra queries - already loaded
```

```sql
-- query #1: the authors
SELECT authors.id, authors.name FROM authors;

-- query #2: ALL their books in one shot, via IN
SELECT books.id, books.title, books.author_id
FROM books WHERE books.author_id IN (1, 2, 3, 4, ..., 99, 100);
```

*What just happened:* **101 queries collapsed to 2.** The first loads the authors; the second loads every
one of their books in a single `IN (...)` query, and SQLAlchemy distributes the rows back onto the right
`author.books` collections. The loop now runs without emitting a single extra `SELECT`. Two queries
regardless of whether you have 100 authors or 100,000 - that's the win. (For very large id sets SQLAlchemy
chunks the `IN` list, so it may be 2–3 queries, not literally 2 - still flat, not `1+N`.)

### joinedload - a single JOIN (best for to-one)

`joinedload(Author.books)` instead folds the books into the *same* query with a `LEFT OUTER JOIN`:

```python
from sqlalchemy.orm import joinedload

book = session.scalars(
    select(Book).options(joinedload(Book.author))   # many Books → one Author each
).all()

for b in book:
    print(f"{b.title} by {b.author.name}")          # author already loaded, no extra query
```

```sql
-- ONE query: books and their authors joined together
SELECT books.id, books.title, books.author_id,
       authors.id AS author_id_1, authors.name
FROM books LEFT OUTER JOIN authors ON authors.id = books.author_id;
```

*What just happened:* **one query did the whole job.** The JOIN pulled each book and its author in the same
result set, so `b.author.name` is already in memory - no `1+N`, in fact no second query at all.

💡 **When to use which.** Reach for `selectinload` for **collections / one-to-many** (`Author.books`,
`Book.tags`): a JOIN over a collection multiplies rows (one author row repeated per book), so the separate
`IN` query is leaner and avoids that blow-up. Reach for `joinedload` for **many-to-one / one-to-one**
(`Book.author`): there's exactly one row on the other side, so the JOIN adds no duplication and saves you a
round trip. The rough rule: **collections → `selectinload`, to-one → `joinedload`.** When unsure, default to
`selectinload` - it's the safer choice because it never row-multiplies.

## Choosing your strategy - and the discipline that saves you

You can also set a *default* strategy on the relationship itself with `lazy=`:

```python
class Author(Base):
    __tablename__ = "authors"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]

    # default to selectin loading every time an Author is queried
    books: Mapped[list["Book"]] = relationship(
        back_populates="author",
        lazy="selectin",          # "select" (lazy, the default), "selectin", "joined", "raise"
    )
```

*What just happened:* `lazy="selectin"` makes `Author.books` eager-load by `IN`-query *every* time you fetch
an `Author`, no `.options()` needed. Handy when you essentially always need the books - but it's a blunt
instrument: it loads them on the one endpoint that never touches `author.books` too.

💡 **Prefer per-query `.options()` over a relationship-wide `lazy=`.** Different use-cases need different
data: the list page needs book *counts*, the export needs every book *and* its tags, the search box needs
neither. Baking one strategy into the mapping forces a compromise on all of them. Keeping the default lazy and
eager-loading explicitly per query lets each use-case load exactly what it needs and nothing more. (One sharp
variant of `lazy=` is worth knowing: `lazy="raise"` makes any *accidental* lazy load throw instead of
silently firing SQL - a great way to force every load to be deliberate and catch N+1 at the source.)

⚠️ **The `joinedload` + collection + pagination trap.** If you `joinedload` a *collection* and then add
`.limit()` / `.offset()` for pagination, the JOIN has already multiplied your rows (one author row per book),
so the `LIMIT` chops *rows*, not *authors* - you'll get a wrong, ragged page. SQLAlchemy handles this for you
*only* if you use `selectinload` (it paginates the parents, then loads their children separately). So: paginate
a one-to-many → use `selectinload`, never `joinedload`.

💡 Here's the throughline, the habit that separates people who fight SQLAlchemy from people who command it:
**default to lazy, eager-load explicitly per query with `.options()`, and ALWAYS watch the SQL count.** N+1
never announces itself - the only way to catch it is to *see* the queries. So make them visible while you
develop:

- Run with `create_engine(url, echo=True)` and actually look at the console for one page or endpoint. If a
  single user action prints a column of near-identical `SELECT`s, you've found an N+1.
- Better, add a **query counter** to your tests (a SQLAlchemy event listener on `"before_cursor_execute"`, or
  a library like `nplusone`) that asserts "this endpoint runs at most 3 queries." That turns N+1 from a thing
  you discover in production into a test that fails in CI.

📝 **"SQLAlchemy is slow" is almost always an unnoticed N+1.** SQLAlchemy isn't slow - a loop that secretly
fires 500 queries is slow, and the ORM just made it effortless to write that loop without seeing it.
Counting your queries is how you stay on the fast side of that line.

## Recap

1. A `relationship()` is **lazy by default**: it loads nothing until you access the attribute, and the moment
   you do, SQLAlchemy fires a query. The cost is invisible in the Python.
2. **`DetachedInstanceError`** happens when you touch a lazy relationship after the `Session` closed (the
   object is detached, [Phase 4](04-the-session-and-unit-of-work.md)). The classic web bug: load in the data layer, access in
   the template. Fix it by loading while the Session is open - not by going eager.
3. The **N+1 problem**: load N parents in 1 query, then trigger 1 query per parent by touching its lazy
   collection in a loop = `1 + N` queries. 100 authors → 101. It's invisible in code and scales with your
   *data*, not your logic - so it passes review and dies in production.
4. **`selectinload(Author.books)`** fixes it with one extra `IN` query (best for **collections** - no row
   multiplication); **`joinedload(Book.author)`** fixes it with a single JOIN (best for **to-one** - no
   duplication, one round trip). Pass either via `.options()` on the `select`.
5. **Default lazy, eager-load per query.** Prefer per-query `.options()` over a relationship-wide `lazy=`;
   ⚠️ never `joinedload` a collection you're paginating (use `selectinload`), and consider `lazy="raise"` to
   forbid accidental lazy loads.
6. 💡 The discipline: **watch the query count** with `echo=True` or a query counter in tests. Most
   "SQLAlchemy is slow" is really an unnoticed N+1.

## Quick check

Lock in the one idea that wrecks more SQLAlchemy apps than any other:

```quiz
[
  {
    "q": "You run `select(Author)` to load 100 authors, then loop over them reading `author.books` on each (a default lazy relationship). How many SQL queries does SQLAlchemy run?",
    "choices": [
      "1 - SQLAlchemy loads everything in a single query",
      "2 - one for authors, one for all books",
      "101 - one to load the authors, then one more per author to load its books (the N+1 problem)",
      "100 - one per author"
    ],
    "answer": 2,
    "explain": "This is the textbook N+1: 1 query for the authors, then N=100 lazy loads (one per author the moment you touch author.books in the loop) = 101 total. The loop looks innocent but each iteration pulls a lazy trigger that fires its own SELECT."
  },
  {
    "q": "Your data-layer function loads an Author inside a `with Session(...)` block and returns it, then a template loops over `author.books` and crashes with DetachedInstanceError. What's the correct fix?",
    "choices": [
      "Eager-load the books while the Session is open (e.g. .options(selectinload(Author.books)))",
      "Change the relationship to lazy='joined' so it's always eager everywhere",
      "Catch the exception and return an empty list",
      "Move session.close() to run later, in the template"
    ],
    "answer": 0,
    "explain": "The crash happens because the Session closed (the `with` block exited) and the author is now detached - a lazy trigger can't fire with no live Session. The right fix is to load the books deliberately while the Session is open, via selectinload/joinedload in .options(). Going blanket-eager 'fixes' the crash but reintroduces over-fetching and N+1 risk elsewhere."
  },
  {
    "q": "You need each Author's books (a one-to-many collection) loaded efficiently, and you're paginating the authors with .limit()/.offset(). Which loader should you use, and why?",
    "choices": [
      "joinedload - a single JOIN is always fastest for any relationship",
      "selectinload - it loads the collection in a separate IN query, so pagination correctly limits authors (joinedload's JOIN multiplies rows and breaks the LIMIT)",
      "Either works identically for paginated collections",
      "Neither - you must keep it lazy when paginating"
    ],
    "answer": 1,
    "explain": "For collections, selectinload is the right default: it paginates the parent authors first, then loads their books in one IN query. joinedload on a collection multiplies rows (one author row per book), so .limit() chops rows instead of authors and you get a wrong page. Rule of thumb: collections → selectinload, to-one → joinedload."
  }
]
```

---

[← Phase 6: Relationships](06-relationships.md) · [Guide overview](_guide.md) · [Phase 8: Migrations with Alembic →](08-migrations-with-alembic.md)