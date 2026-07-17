---
title: "The Index, Tags, and an RSS Feed"
guide: "static-blog-generator-python"
phase: 4
summary: "Generate a front page listing every post, a page per tag, and a valid RSS feed with escaped titles and RFC 822 dates - the pages that make it a blog."
tags: [python, rss, xml, tags, index-page]
difficulty: intermediate
synonyms:
  - generate rss feed python
  - blog index page generator
  - tag pages static site
  - rss pubdate format
  - xml escape python
updated: 2026-07-16
---

# The Index, Tags, and an RSS Feed

You have pages, but no front door. A visitor landing on your site right now gets a directory listing, which says "file server," not "blog." This phase generates the three kinds of *derived* pages - pages built not from one post but from knowledge of **all** posts: the index, per-tag pages, and an RSS feed. This is also the phase where you'll feel exactly where a four-line template engine stops being enough, which is a lesson worth having in your bones.

## The index - and the wall our engine hits

The front page is a heading plus a list of links, newest first. Create `templates/index.html`:

```html
<h1>{{ heading }}</h1>
<ul class="post-list">
{{ items }}
</ul>
```

Notice what this template *doesn't* do: it doesn't loop over posts. It can't. Our `render()` replaces placeholders; it has no concept of "repeat this bit for each item." A real engine would write `{% for post in posts %}` right in the template - that loop syntax is precisely what Jinja2 sells.

Our no-nonsense workaround: build the repeated part in Python, where loops live, and hand the finished block to the template as one value.

## Your turn: post_list_items

You already have every piece this needs. You built `post["slug"]`, `post["title"]`, and `post["date"]` back in phase 2, and `parse_post`'s tags line already builds-and-joins a list in one f-string loop - this is the same shape.

```python
def post_list_items(posts):
    # your turn: for each post, build one <li> line shaped like
    #   <li><a href="/SLUG.html">TITLE</a> <span class="date">YYYY-MM-DD</span></li>
    # then join them all with newlines
    return ""
```

An `f"..."` per post, `list.append`, and `"\n".join(...)` at the end - nothing new. My version is in the full file below; run the build and open `http://localhost:8000` and the front page's list is exactly what this function generated.

💡 **Key point:** this is the line where you now know *when* to reach for Jinja2 - the moment your templates need repetition or conditionals, not before. Until then, an engine you fully understand beats one you don't. For a blog this size, the workaround costs eight lines.

The template takes a `heading` instead of hardcoding "All posts" for a reason that pays off immediately: tag pages are the *same shape* - a heading and a list of posts - so one template serves both.

## Tag pages

A tag page is "the index, filtered." The build collects a mapping of tag → posts, then renders the index template once per tag into `site/tags/<tag>.html`:

```python
    tags = {}
    for post in posts:
        for tag in post["tags"]:
            tags.setdefault(tag, []).append(post)
```

`setdefault(tag, [])` means "give me the list for this tag, creating an empty one first if it's new" - the standard idiom for building a dict of lists without checking `if tag in tags` every time.

⚠️ **Gotcha:** the tag becomes a *filename*. `tags: web dev` would produce `site/tags/web dev.html` - a URL with a space in it, which works but looks broken and gets percent-encoded into `web%20dev`. Keep tags to single lowercase words (`python`, `web`, `meta`). Slugifying multi-word tags properly is on the extensions list in phase 6.

## The RSS feed

**What RSS actually is.** A machine-readable table of contents for your site: one XML file listing your recent posts with titles, links, and dates. Feed readers and other sites poll it to learn you've published. It's the oldest open "subscribe" mechanism on the web, it never died, and a blog without one is invisible to the people most likely to actually follow you.

An RSS document looks like this - a `<channel>` describing the site, containing `<item>`s describing posts:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>My Blog</title>
  <link>https://example.com</link>
  <description>Posts from my hand-built blog.</description>
  <item>
    <title>Why I Went Static</title>
    <link>https://example.com/2026-07-02-why-static-sites.html</link>
    <guid>https://example.com/2026-07-02-why-static-sites.html</guid>
    <pubDate>Thu, 02 Jul 2026 00:00:00 -0000</pubDate>
  </item>
</channel>
</rss>
```

Two details in there are where hand-rolled feeds usually go wrong, and the standard library has the answer to both:

- **`pubDate` must be RFC 822 format** - `Thu, 02 Jul 2026 00:00:00 -0000`, the ancient email date style. Don't hand-format it; `email.utils.format_datetime()` exists precisely because this format is fussy (English day names, specific ordering, a zone offset).
- **Titles must be XML-escaped.** Browsers forgive broken HTML; XML parsers do not. One post titled `Cats & Dogs` with a raw `&` makes the *entire feed* invalid, and every subscriber's reader silently stops updating. `xml.sax.saxutils.escape()` converts `&`, `<`, and `>` into their safe entities.

📝 **Terminology:** `<guid>` is the item's permanent unique identifier - readers use it to remember which items you've already seen. Using the post's URL as its guid is the standard move.

## The complete build.py

This is the full file as it stands at the end of this phase - everything above `post_list_items` is unchanged from phase 3:

```python
import shutil
from datetime import datetime
from email.utils import format_datetime
from pathlib import Path
from xml.sax.saxutils import escape

import markdown

POSTS_DIR = Path("posts")
TEMPLATES_DIR = Path("templates")
STATIC_DIR = Path("static")
SITE_DIR = Path("site")

SITE_NAME = "My Blog"
SITE_URL = "https://example.com"  # change this when you deploy (phase 6)


def parse_post(path):
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---"):
        raise ValueError(f"{path.name}: no frontmatter block at the top")
    _, front, body = text.split("---", 2)

    meta = {}
    for line in front.strip().splitlines():
        key, _, value = line.partition(":")
        meta[key.strip()] = value.strip()

    return {
        "title": meta.get("title", path.stem),
        "date": datetime.strptime(meta["date"], "%Y-%m-%d"),
        "tags": [t.strip() for t in meta.get("tags", "").split(",") if t.strip()],
        "slug": path.stem,
        "html": markdown.markdown(body, extensions=["fenced_code"]),
    }


def render(template, context):
    out = template
    for key, value in context.items():
        out = out.replace("{{ " + key + " }}", str(value))
    return out


def load_template(name):
    return (TEMPLATES_DIR / name).read_text(encoding="utf-8")


def pretty_date(d):
    return f"{d:%B} {d.day}, {d.year}"


def write_page(relative_path, text):
    out_path = SITE_DIR / relative_path
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(text, encoding="utf-8")
    print(f"built  {out_path.as_posix()}")


def post_list_items(posts):
    items = []
    for post in posts:
        items.append(
            f'<li><a href="/{post["slug"]}.html">{post["title"]}</a>'
            f' <span class="date">{post["date"]:%Y-%m-%d}</span></li>'
        )
    return "\n".join(items)


def build_feed(posts):
    items = []
    for post in posts[:10]:
        url = f"{SITE_URL}/{post['slug']}.html"
        items.append(
            "  <item>\n"
            f"    <title>{escape(post['title'])}</title>\n"
            f"    <link>{url}</link>\n"
            f"    <guid>{url}</guid>\n"
            f"    <pubDate>{format_datetime(post['date'])}</pubDate>\n"
            "  </item>"
        )
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<rss version="2.0">\n'
        "<channel>\n"
        f"  <title>{escape(SITE_NAME)}</title>\n"
        f"  <link>{SITE_URL}</link>\n"
        "  <description>Posts from my hand-built blog.</description>\n"
        + "\n".join(items)
        + "\n</channel>\n</rss>\n"
    )


def build():
    if SITE_DIR.exists():
        shutil.rmtree(SITE_DIR)
    SITE_DIR.mkdir()
    shutil.copy(STATIC_DIR / "style.css", SITE_DIR / "style.css")

    base = load_template("base.html")
    post_template = load_template("post.html")
    index_template = load_template("index.html")

    posts = [parse_post(p) for p in sorted(POSTS_DIR.glob("*.md"))]
    posts.sort(key=lambda p: p["date"], reverse=True)

    # one page per post
    for post in posts:
        article = render(post_template, {
            "title": post["title"],
            "date": pretty_date(post["date"]),
            "tags": ", ".join(post["tags"]),
            "body": post["html"],
        })
        page = render(base, {"title": post["title"], "content": article})
        write_page(f"{post['slug']}.html", page)

    # the front page
    listing = render(index_template, {
        "heading": "All posts",
        "items": post_list_items(posts),
    })
    page = render(base, {"title": SITE_NAME, "content": listing})
    write_page("index.html", page)

    # one page per tag
    tags = {}
    for post in posts:
        for tag in post["tags"]:
            tags.setdefault(tag, []).append(post)
    for tag, tagged in sorted(tags.items()):
        listing = render(index_template, {
            "heading": f'Posts tagged "{tag}"',
            "items": post_list_items(tagged),
        })
        page = render(base, {"title": f"Tag: {tag}", "content": listing})
        write_page(f"tags/{tag}.html", page)

    # the feed
    write_page("feed.xml", build_feed(posts))


if __name__ == "__main__":
    build()
```

A few deliberate choices to notice:

- `posts[:10]` in the feed - RSS convention is recent posts, not your life's work. Readers that want the archive have the site.
- The feed reuses the already-sorted `posts` list, so items come out newest-first, which is what readers expect.
- Tag pages sort alphabetically (`sorted(tags.items())`) so rebuilds are deterministic - the same input always produces byte-identical output, which makes diffs of `site/` meaningful.

## Run it

```console
(.venv) $ python build.py
built  site/2026-07-02-why-static-sites.html
built  site/2026-06-28-hello-world.html
built  site/index.html
built  site/tags/meta.html
built  site/tags/web.html
built  site/feed.xml
```

Serve it again - `python -m http.server 8000 --directory site` - and open `http://localhost:8000`. No more directory listing: your front page lists both posts, newest on top, and each link works. Try `http://localhost:8000/tags/web.html` - only the post tagged `web` appears. And `http://localhost:8000/feed.xml` shows the feed (some browsers render XML as a collapsible tree; that's the browser being helpful, the bytes are yours).

*What just happened:* the build now produces every kind of page a small blog needs - six files from two posts, all derived from the same parsed data, all regenerated from scratch in a fraction of a second.

## What you have now

A complete blog: posts, a front page, tag archives, and a subscribable feed. The remaining friction is workflow - that build-serve-refresh dance every time you edit. Phase 5 collapses it into "save the file, refresh the browser."

Three checks on the load-bearing ideas:

```quiz
[
  {
    "q": "Why is the index's list of <li> lines built in Python instead of in the template?",
    "choices": ["HTML lists cannot be templated", "Our four-line engine has no loops - repetition is exactly the feature real engines like Jinja2 add on top of substitution", "Python string building is faster than templating"],
    "answer": 1,
    "explain": "render() only substitutes placeholders. The moment templates need loops or conditionals is the moment a real template engine earns its dependency."
  },
  {
    "q": "Why must post titles go through escape() in the RSS feed?",
    "choices": ["To convert them to lowercase", "XML parsers are strict - one raw & or < in a title invalidates the whole feed and subscribers silently stop getting updates", "RSS requires base64-encoded titles"],
    "answer": 1,
    "explain": "Browsers forgive malformed HTML; feed readers do not forgive malformed XML. escape() turns &, <, and > into safe entities."
  },
  {
    "q": "What format does RSS's pubDate use, and what produces it here?",
    "choices": ["ISO 8601 (2026-07-02), via datetime.isoformat()", "A Unix timestamp, via time.time()", "RFC 822 style (Thu, 02 Jul 2026 00:00:00 -0000), via email.utils.format_datetime()"],
    "answer": 2,
    "explain": "RSS inherited the old email date format. format_datetime() exists in the standard library precisely so you never hand-build it."
  }
]
```
