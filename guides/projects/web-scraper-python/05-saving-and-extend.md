---
title: "Saving the Data, and Where to Take It"
guide: web-scraper-python
phase: 5
summary: "Write your collected records to CSV and JSON to finish the working scraper, then map the upgrades — a database, scheduling, and headless browsers for JavaScript-heavy sites."
tags: [python, csv, json, persistence, next-steps]
difficulty: intermediate
synonyms:
  - write csv python
  - save json python
  - persist scraped data
  - scheduling a scraper
  - headless browser scraping
updated: 2026-06-30
---

# Saving the Data, and Where to Take It

We've got a thousand clean records sitting in memory. The moment the program
ends, they're gone. This phase fixes that — we write them to CSV and JSON — and
then turns the finished scraper into one complete script. After that, the fun
part: a tour of where you'd take this when a weekend project meets a real need.

Both file formats ship with Python. No installs. `csv` for the spreadsheet
people, `json` for the program-talking-to-program people. We'll write both,
because they answer different questions and cost nothing extra.

## Write to CSV

CSV opens in Excel, Numbers, Google Sheets, and every data tool on earth. Our
records are a list of dicts with identical keys, which is exactly what
`csv.DictWriter` is built for.

```python
import csv


def save_csv(records, filename="books.csv"):
    if not records:
        print("Nothing to save")
        return
    fieldnames = records[0].keys()
    with open(filename, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(records)
    print(f"Wrote {len(records)} rows to {filename}")
```

Two details that save you grief. `newline=""` stops Python from adding blank
lines between every row on Windows — leave it off and your CSV looks
double-spaced in Excel. And `encoding="utf-8"` makes sure titles with accents or
symbols survive instead of turning into garbage. Always pass both when writing
CSV.

## Write to JSON

JSON keeps your data's *shape* — nested structures, real numbers, `None` as
`null`. It's the format you'd hand to another program or a web front-end.

```python
import json


def save_json(records, filename="books.json"):
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2, ensure_ascii=False)
    print(f"Wrote {len(records)} records to {filename}")
```

`indent=2` makes the file human-readable instead of one giant line.
`ensure_ascii=False` lets real characters (£, é, —) appear as themselves rather
than `\u` escapes. Drop both and JSON still works, but you'll thank yourself for
the readable version when you open it to debug.

## The whole thing, in one file

Here's the complete scraper — fetch, parse, extract defensively, paginate
politely, save both formats. This is the program the project was building toward.
Save it as `scraper.py`.

```python
import csv
import json
import time
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

START = "https://books.toscrape.com/catalogue/page-1.html"
DELAY = 1.0

session = requests.Session()
session.headers.update({
    "User-Agent": "weekend-book-scraper/1.0 (you@example.com)"
})


def parse_book(book):
    link = book.select_one("h3 a")
    raw_price = book.select_one("p.price_color")
    rating_el = book.select_one("p.star-rating")
    stock_el = book.select_one("p.instock.availability")
    return {
        "title": link["title"].strip() if link else "Unknown",
        "price": float(raw_price.text.replace("£", "")) if raw_price else None,
        "rating": rating_el["class"][1] if rating_el else None,
        "in_stock": stock_el.text.strip() if stock_el else "",
        "url": urljoin(START, link["href"]) if link else None,
    }


def scrape_all(start_url):
    records = []
    url = start_url
    page = 1
    while url:
        print(f"Fetching page {page}: {url}")
        response = session.get(url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        for book in soup.select("article.product_pod"):
            records.append(parse_book(book))
        next_link = soup.select_one("li.next a")
        url = urljoin(url, next_link["href"]) if next_link else None
        page += 1
        time.sleep(DELAY)
    return records


def save_csv(records, filename="books.csv"):
    if not records:
        return
    with open(filename, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=records[0].keys())
        writer.writeheader()
        writer.writerows(records)


def save_json(records, filename="books.json"):
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2, ensure_ascii=False)


if __name__ == "__main__":
    books = scrape_all(START)
    save_csv(books)
    save_json(books)
    print(f"Done. Saved {len(books)} books to books.csv and books.json")
```

Run it:

```bash
python scraper.py
```

Watch it walk the pages, then open `books.csv` in a spreadsheet. There's your
weekend's work: a thousand books with titles, prices, ratings, stock, and links —
sortable, filterable, yours. That's a finished, working scraper.

## Where to take it next

You've got the core skill. Here's the map of what's past the edge of this
project, roughly in order of effort.

| Upgrade | What it buys you | First tool to look at |
|---------|------------------|------------------------|
| A database | Query, dedupe, update over time | `sqlite3` (built in) |
| Scheduling | Runs itself on a timer | cron, Task Scheduler |
| Concurrency | Many pages at once, faster | `httpx` + `asyncio` |
| Headless browser | Scrape JS-built pages | Playwright |
| A framework | Big crawls, built-in plumbing | Scrapy |

A few of those deserve a sentence.

**A database.** When you scrape the same site repeatedly, a CSV per run gets
messy fast. SQLite — which ships with Python as `sqlite3` — lets you store
records in a real table, ask questions with SQL, and update yesterday's data
instead of duplicating it. It's the natural next step when "save a file" stops
being enough.

**Scheduling.** A scraper that runs itself is worth ten you have to remember to
run. On macOS or Linux, cron fires your script on a schedule; on Windows, Task
Scheduler does the same. Point it at `python scraper.py` nightly and wake up to
fresh data.

**Headless browsers, for the sites that fight back.** Here's the wall you'll hit
eventually: some pages arrive nearly empty and build their content with
JavaScript *after* loading. `requests` only sees that empty shell — it doesn't
run JavaScript. When `response.text` is missing data you can plainly see in your
browser, that's the symptom. The cure is a headless browser like Playwright,
which drives a real (invisible) browser, lets the JavaScript run, and *then*
hands you the finished HTML to feed into the very same BeautifulSoup code you
wrote this weekend. Everything you learned still applies — you've upgraded the
fetch step, nothing else.

**Scrapy.** When a one-file script grows into a serious crawler — many sites,
retries, pipelines, politeness baked in — Scrapy is the framework built for it.
It's more to learn, so reach for it when you've outgrown a script, not before.

## Where we are

You built a real web scraper this weekend. It fetches pages, parses messy HTML,
extracts clean and typed records, walks an entire catalog at a respectful pace,
and saves the results to formats you can actually use. Every piece is code you
understand, because you wrote it one phase at a time.

The same five-box loop — fetch, parse, extract, next, save — scales from this
practice site to almost anything you'll want to point it at. Swap the selectors
for a new site's HTML, keep the politeness, and you're scraping. Go find some
public data worth having, and treat the servers kindly while you get it.
