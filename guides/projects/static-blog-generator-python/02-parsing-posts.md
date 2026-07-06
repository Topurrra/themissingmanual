---
title: "Parsing Posts: Frontmatter and Markdown"
guide: "static-blog-generator-python"
phase: 2
summary: "Split frontmatter from the post body, parse the key: value metadata by hand, convert Markdown to HTML with the markdown library, and make bad posts fail loudly."
tags: [python, parsing, frontmatter, markdown, datetime]
difficulty: intermediate
synonyms:
  - parse frontmatter python
  - python markdown to html
  - split yaml frontmatter
  - parse markdown metadata
updated: 2026-07-06
---

# Parsing Posts: Frontmatter and Markdown

Your generator can find posts. Now it learns to read one - and "read" means three separate jobs stacked in one file: peel the frontmatter off the top, turn its `key: value` lines into data, and convert the Markdown body to HTML. By the end of this phase, `build.py` turns every post file into a clean Python dictionary with everything later phases need.

## What a post file actually is

Look at one of your posts as a machine would:

```text
---                          <- marker: frontmatter starts
title: Hello, World          <- metadata, key: value per line
date: 2026-06-28
tags: meta
---                          <- marker: frontmatter ends
                             <- everything below: the body, in Markdown
This is the first post...
```

So parsing a post is: split the text at the first two `---` markers, treat the middle as metadata, treat the rest as Markdown. Python's `str.split` can do the splitting in one line - if you know its second argument.

## Splitting on the markers

`text.split("---", 2)` splits on `---` **at most twice**, producing three pieces: whatever is before the first marker (an empty string, since the file starts with it), the frontmatter, and the whole rest of the file.

That `2` is doing quiet, important work. Markdown uses `---` for horizontal rules, so a post body might legitimately contain another `---`. Without the limit, that rule would be treated as a third split point and shred your body. With `maxsplit=2`, the split stops after the frontmatter fence, and any later `---` stays safely inside the body.

⚠️ **Gotcha:** this parser assumes the file *starts with* `---` on the first line. A post that's missing its frontmatter - or has a stray blank line above it - shouldn't limp through and publish a broken page. It should stop the build with a message naming the file. A build tool's job is to fail loudly at build time so nothing fails silently in front of readers.

## Parsing the key: value lines

Frontmatter lines look like `title: Hello, World`. The tempting parse is `line.split(":")` - and it's wrong, because a title like `Docker: A Love Story` contains a colon and would be cut in half. The right tool is `str.partition(":")`, which splits on the **first** colon only and always gives back three pieces: key, the colon, value.

For `tags`, we'll use a comma-separated convention (`tags: meta, web`) and split it into a real Python list.

## Converting the Markdown

The `markdown` library does the body. Watch it work before wiring it in - start a Python session:

```console
(.venv) $ python
>>> import markdown
>>> markdown.markdown("This is **bold** and this is `code`.")
'<p>This is <strong>bold</strong> and this is <code>code</code>.</p>'
>>> exit()
```

*What just happened:* one function call, Markdown in, HTML out. That string of HTML is exactly what we'll pour into a template in phase 3.

⚠️ **Gotcha:** out of the box, the `markdown` library follows the *original* 2004 Markdown spec - which means fenced code blocks (` ``` `) are **not supported by default**. Your second post has one. The fix is one argument: `markdown.markdown(body, extensions=["fenced_code"])`. Forget it, and your code blocks render as garbled paragraphs with backticks in them - a classic first-hour bug with this library.

## The new build.py

Replace the contents of `build.py` with this:

```python
from datetime import datetime
from pathlib import Path

import markdown

POSTS_DIR = Path("posts")


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


def main():
    posts = [parse_post(p) for p in sorted(POSTS_DIR.glob("*.md"))]
    posts.sort(key=lambda p: p["date"], reverse=True)
    for post in posts:
        tags = ", ".join(post["tags"])
        print(f"{post['date']:%Y-%m-%d}  {post['title']}  [{tags}]")


if __name__ == "__main__":
    main()
```

Walk through `parse_post`, because it's the heart of the input side:

- `read_text(encoding="utf-8")` reads the whole file as text. Always name the encoding - on Windows, the default can be something else entirely, and an em-dash in a post becomes mojibake.
- The `startswith` check plus `raise ValueError` is the loud failure from above. The error names the file, so future-you knows which post to fix.
- The metadata loop: `partition(":")` splits each line at the first colon; `.strip()` on both sides forgives stray spaces.
- `meta.get("title", path.stem)` - a missing title falls back to the filename. But `meta["date"]` uses square brackets **on purpose**: a post without a date can't be sorted, so a missing date should crash with a `KeyError` naming the problem, not get silently guessed.
- `datetime.strptime(meta["date"], "%Y-%m-%d")` parses `2026-06-28` into a real `datetime` object. Real dates sort correctly and can be reformatted for display later; strings that merely look like dates eventually betray you.
- `path.stem` is the filename without `.md` - `2026-06-28-hello-world` - and becomes the **slug**, the post's future URL name.
- The tags line splits on commas and drops empties, so `tags: meta, web`, `tags: meta,web`, and no tags line at all are all handled.

📝 **Terminology:** a **slug** is the URL-safe identifier for a piece of content - the `hello-world` part of `/hello-world.html`. Ours comes straight from the filename, so filenames should stay lowercase-with-hyphens.

`main()` now parses every post and sorts by date, newest first - which is exactly the order the index page will want in phase 4.

## Run it

```console
(.venv) $ python build.py
2026-07-02  Why I Went Static  [meta, web]
2026-06-28  Hello, World  [meta]
```

*What just happened:* both files were parsed into dictionaries - real dates, real tag lists, HTML bodies ready and waiting - and printed newest-first. The HTML is in there too; it's simply not printed. If you're curious, add a `print(post["html"][:80])` line for one run and look at it.

Now prove the loud failure works, because untested error handling is decoration. Create `posts/broken.md` containing only the word `oops`, and run the build:

```console
(.venv) $ python build.py
Traceback (most recent call last):
  ...
ValueError: broken.md: no frontmatter block at the top
```

The build refused, and the message names the file. Delete `posts/broken.md` and re-run to see the clean output again.

## What you have now

A generator that reads every post into structured data: title, date, tags, slug, and a converted HTML body - with malformed posts stopped at the door. What it doesn't have is anywhere to *put* that HTML. That's phase 3: templates, and the four-line engine that fills them.

Two of these questions are about the exact bugs this phase defused - worth thirty seconds:

```quiz
[
  {
    "q": "Why does the parser use text.split(\"---\", 2) instead of text.split(\"---\")?",
    "choices": ["It limits splitting to the first two markers, so a --- horizontal rule later in the body is left alone", "It splits the text into exactly two pieces", "It is faster for large files"],
    "answer": 0,
    "explain": "maxsplit=2 yields three pieces: before the frontmatter, the frontmatter, and the entire rest of the file - later --- lines stay in the body."
  },
  {
    "q": "Your posts use fenced code blocks. What does the markdown library need to render them?",
    "choices": ["Nothing - fences work out of the box", "The \"fenced_code\" extension passed to markdown.markdown()", "A separate pip package"],
    "answer": 1,
    "explain": "By default the library follows the original Markdown spec, which predates fences. extensions=[\"fenced_code\"] turns them on."
  },
  {
    "q": "A post is missing its date: line. What does this build do, and why is that the right call?",
    "choices": ["Uses today's date so the build succeeds", "Skips the post silently", "Crashes with a KeyError - a build tool should fail loudly at build time, not publish something wrong"],
    "answer": 2,
    "explain": "meta[\"date\"] uses square brackets deliberately. A guessed date or a silently missing post is a bug you find weeks later; a crash naming the file is one you fix in ten seconds."
  }
]
```
