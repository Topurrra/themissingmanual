---
title: "Extracting Structured Data"
guide: web-scraper-python
phase: 3
summary: "Turn loose page elements into clean dictionaries - one record per item - with tidy text and code that survives a missing field."
tags: [python, data-extraction, dictionaries, text-cleaning, defensive-code]
difficulty: intermediate
synonyms:
  - parse data into dict python
  - clean scraped text
  - handle missing element beautifulsoup
  - structured data extraction
  - strip whitespace python
updated: 2026-06-30
---

# Extracting Structured Data

So far we've printed pieces - a title here, a price there. A real scraper
produces *records*: one structured object per thing, with the same fields every
time, clean enough to drop into a spreadsheet without hand-fixing. This phase
builds that. By the end you'll have a function that turns one book's HTML into
one tidy dictionary, and a loop that gives you a list of them.

The dictionary is our record. Each book becomes
`{"title": ..., "price": ..., "rating": ..., "in_stock": ..., "url": ...}`.
Same keys, every book. That sameness is what makes the next phase - saving -
trivial.

## Extract one book into a dict

Create `extract.py`. We'll write a function that takes a single book element and
returns a dictionary. Look at the page's HTML again: the rating lives in a
class like `star-rating Three`, the stock status is text in a `p.instock`, and
the link is a relative `href` we'll need to fix up.

```python
import requests
from bs4 import BeautifulSoup

BASE = "https://books.toscrape.com/"


def parse_book(book):
    link = book.select_one("h3 a")
    title = link["title"]

    price = book.select_one("p.price_color").text

    # Rating is encoded in the class, e.g. "star-rating Three"
    rating_classes = book.select_one("p.star-rating")["class"]
    rating = rating_classes[1]   # ["star-rating", "Three"] -> "Three"

    in_stock = book.select_one("p.instock.availability").text

    url = BASE + link["href"]

    return {
        "title": title,
        "price": price,
        "rating": rating,
        "in_stock": in_stock,
        "url": url,
    }


response = requests.get(BASE, timeout=10)
response.raise_for_status()
soup = BeautifulSoup(response.text, "html.parser")

first = soup.select("article.product_pod")[0]
print(parse_book(first))
```

Run `python extract.py`. You'll get a dictionary - but a slightly grubby one.
The stock text is wrapped in whitespace and newlines, and the price has a stray
character on the front. Let's clean it.

## Clean the text as you pull it

Raw HTML text is full of indentation, newlines, and the odd encoding artifact.
Clean it at the moment of extraction, so every record downstream is already
tidy. A few moves cover almost everything:

| Problem | Fix |
|---------|-----|
| Leading/trailing whitespace, newlines | `.text.strip()` |
| A currency symbol you want as a number | `.replace("£", "")` then `float(...)` |
| Internal double spaces | `" ".join(text.split())` |

Here's `parse_book` with cleaning built in, turning the price into a real number
we can sort and total later:

```python
def parse_book(book):
    link = book.select_one("h3 a")
    title = link["title"].strip()

    raw_price = book.select_one("p.price_color").text   # e.g. "£51.77"
    price = float(raw_price.replace("£", "").strip())

    rating_classes = book.select_one("p.star-rating")["class"]
    rating = rating_classes[1]

    in_stock = book.select_one("p.instock.availability").text.strip()

    url = BASE + link["href"]

    return {
        "title": title,
        "price": price,
        "rating": rating,
        "in_stock": in_stock,
        "url": url,
    }
```

Now `price` is `51.77`, a float, not a string. Decide on the *type* you want for
each field at extraction time - a scraper that emits clean, typed records is
worth ten that emit strings someone has to scrub later.

## Survive a missing field

Here's the thing that separates a script that works once from a scraper you can
trust: real pages are inconsistent. One book is missing a rating. Another has no
price because it's out of stock. The moment you call `.text` on a
`select_one` that found nothing, you get `AttributeError: 'NoneType' object has
no attribute 'text'` and the whole run dies on item 47 of 1000.

The fix is to check before you reach in. A small helper keeps the main function
readable:

```python
def get_text(element, selector, default=""):
    found = element.select_one(selector)
    return found.text.strip() if found else default
```

`select_one` returns `None` when nothing matches, and `None` is falsy, so the
`if found` guard catches it. When the element is missing you get your default
instead of a crash. Wire it in:

```python
def parse_book(book):
    link = book.select_one("h3 a")
    title = link["title"].strip() if link else "Unknown"

    raw_price = get_text(book, "p.price_color")
    price = float(raw_price.replace("£", "")) if raw_price else None

    rating_el = book.select_one("p.star-rating")
    rating = rating_el["class"][1] if rating_el else None

    in_stock = get_text(book, "p.instock.availability")

    url = BASE + link["href"] if link else None

    return {
        "title": title,
        "price": price,
        "rating": rating,
        "in_stock": in_stock,
        "url": url,
    }
```

Now a missing price becomes `None`, not a stack trace. `None` is a deliberate
"we looked and it wasn't there" - far more useful than an empty string, because
later you can ask "which records are missing a price?" and get a real answer.

## Pull the whole page into records

Put it together: loop every book, build a list of dicts, and report.

```python
import requests
from bs4 import BeautifulSoup

BASE = "https://books.toscrape.com/"


def get_text(element, selector, default=""):
    found = element.select_one(selector)
    return found.text.strip() if found else default


def parse_book(book):
    link = book.select_one("h3 a")
    raw_price = get_text(book, "p.price_color")
    rating_el = book.select_one("p.star-rating")
    return {
        "title": link["title"].strip() if link else "Unknown",
        "price": float(raw_price.replace("£", "")) if raw_price else None,
        "rating": rating_el["class"][1] if rating_el else None,
        "in_stock": get_text(book, "p.instock.availability"),
        "url": BASE + link["href"] if link else None,
    }


response = requests.get(BASE, timeout=10)
response.raise_for_status()
soup = BeautifulSoup(response.text, "html.parser")

records = [parse_book(b) for b in soup.select("article.product_pod")]

print(f"Extracted {len(records)} records")
for r in records[:3]:
    print(r)

cheapest = min(records, key=lambda r: r["price"])
print("Cheapest:", cheapest["title"], "at £", cheapest["price"])
```

Run it. Twenty clean dictionaries, and because the price is a real number, you
can find the cheapest book with one line. That's the payoff of typing your data
as you extract it.

## Where we are

You have a list of clean, structured, typed records, and code that won't fall
over when a page leaves a field blank. One problem remains: this is only the
first 20 books. There are a thousand. Next phase we follow the "next" link
through every page - and we do it without being a nuisance to the server.
