---
title: "Parsing the HTML"
guide: web-scraper-python
phase: 2
summary: "Load the fetched HTML into BeautifulSoup and locate elements two ways - with the find/find_all methods and with CSS selectors."
tags: [python, beautifulsoup, html-parsing, css-selectors, find]
difficulty: intermediate
synonyms:
  - beautifulsoup find_all
  - css selector python
  - parse html string
  - select elements beautifulsoup
  - navigate dom python
updated: 2026-06-30
---

# Parsing the HTML

Last phase we ended with a giant string of HTML. A string is hard to work with -
you can't ask a string "give me every book title on this page." This phase turns
that string into a tree you *can* ask questions of, using BeautifulSoup, and
shows you the two ways to find things in it.

We're working with `https://books.toscrape.com/` - a fake bookstore made for
practice. Open it in your browser and right-click a book, then choose "Inspect,"
so you can see the HTML we're about to navigate. Scraping is half code, half
reading someone else's markup.

## Load the HTML into BeautifulSoup

Create `parse.py`. We fetch the page (same as before) and hand the body to
BeautifulSoup:

```python
import requests
from bs4 import BeautifulSoup

URL = "https://books.toscrape.com/"

response = requests.get(URL, timeout=10)
response.raise_for_status()

soup = BeautifulSoup(response.text, "html.parser")

print(soup.title)        # the <title> tag
print(soup.title.text)   # just the text inside it
```

Run `python parse.py`. You should see the `<title>` tag and then its text. That
`soup` object is the whole page as a navigable tree. `"html.parser"` is Python's
built-in parser - nothing extra to install. (There are faster parsers like
`lxml`, but the built-in one is right for learning and fine for most jobs.)

## The find family

BeautifulSoup gives you two close cousins: `find` returns the **first** matching
element, and `find_all` returns a **list** of every match. You'll lean on these
constantly.

```python
# The first <h3> on the page
first_h3 = soup.find("h3")
print("First h3:", first_h3.text)

# Every <article> with class "product_pod" - each one is a book
books = soup.find_all("article", class_="product_pod")
print("Books found on this page:", len(books))
```

Two things to notice. You match by tag name (`"h3"`, `"article"`), and you can
narrow by attribute. Class is special: because `class` is a reserved word in
Python, BeautifulSoup spells the keyword `class_` with a trailing underscore.
You'll hit that one a lot.

On this page you should see 20 books - that's how many fit on a page before
pagination kicks in (Phase 4's problem).

## Reach inside a matched element

`find` and `find_all` work on any element, not only the whole soup. So once you
have a single book, you search *within* it for the title and price. Look at the
inspected HTML: the title sits in an `<a>` inside the `<h3>`, and the actual
title is in that link's `title` attribute. The price sits in a `<p>` with class
`price_color`.

```python
first_book = books[0]

# The link inside this book's <h3>
link = first_book.find("h3").find("a")
print("Title:", link["title"])     # read an attribute with [ ]

# The price paragraph
price = first_book.find("p", class_="price_color")
print("Price:", price.text)
```

Reading an attribute uses square brackets, like a dict: `link["title"]`,
`link["href"]`. Reading the visible text uses `.text`. Mixing those two up is
the most common early stumble, so it's worth saying out loud: brackets for
attributes, `.text` for what's between the tags.

## The other way: CSS selectors

There's a second style, and once it clicks many people never go back. If you
know CSS - the selectors you'd write in a stylesheet - you can use the exact same
syntax to find elements, with `select` (returns a list) and `select_one`
(returns the first).

```python
# Every book, via CSS selector
books = soup.select("article.product_pod")
print("Books:", len(books))

# Title link inside the first book
link = soup.select_one("article.product_pod h3 a")
print("Title:", link["title"])

# Price inside the first book
price = soup.select_one("article.product_pod p.price_color")
print("Price:", price.text)
```

Same results, different spelling. `article.product_pod` means "an `<article>`
with class `product_pod`." A space means "descendant of" - so
`article.product_pod h3 a` reads as "an `<a>` somewhere inside an `<h3>` somewhere
inside that article." If you can read CSS, you can read these.

## Which one should you use?

Neither is "correct." Here's how I choose:

| Situation | Reach for |
|-----------|-----------|
| One condition, by tag or class | either; `find` reads plainly |
| Deeply nested path | `select` - one selector beats nested `find` calls |
| Matching by class only | `select(".price_color")` is shorter than `find_all` |
| Logic between steps (loop, branch) | `find` - you stay in Python |
| You already think in CSS | `select` will feel like home |

A handy trick from your browser: inspect an element, right-click it in the
elements panel, and many browsers offer "Copy → Copy selector." That hands you a
CSS selector you can paste straight into `select_one`. Trim it down - the copied
version is often longer than it needs to be - but it's a fast start.

## See the whole page's structure

To get a feel for the tree, print every book's title in one pass:

```python
import requests
from bs4 import BeautifulSoup

response = requests.get("https://books.toscrape.com/", timeout=10)
response.raise_for_status()
soup = BeautifulSoup(response.text, "html.parser")

for book in soup.select("article.product_pod"):
    title = book.select_one("h3 a")["title"]
    print("-", title)
```

Run it. Twenty titles scroll past. You read a real page's worth of data out
of raw HTML - that's the parsing skill, and it's the heart of every scraper.

## Where we are

You can load HTML into a searchable tree and pull out exactly the elements you
want, two different ways, both within the whole page and within a single item.
Right now we're printing loose pieces. Next phase we gather those pieces into
clean, structured records - one tidy dictionary per book - and make the code
survive a page where a field is missing.
