# Marketing Post Brief: The Missing Manual

Paste this whole file to any AI agent (Grok, Cline, ChatGPT, Claude, etc.) and ask it to
write posts for **x.com** or **dev.to**. It contains everything the agent needs: what the
product is, the tone to match, the hard rules, and the exact link format.

---

## What The Missing Manual is

A free, text-first library of real-world developer knowledge. Plain-language guides to how
software actually works: from how a computer boots, to networking, databases, Git, and AI.
No signup, no paywall, no ads. Read it at https://themissingmanual.dev

**The one-line pitch:** "Everything you were supposed to already know."

**Why it exists (the selling point):** tutorials stop at "hello world" and official docs
assume you already understand the thing you came to learn. The Missing Manual fills that gap.
It explains the *why* and the mental model first, then the commands, the way a senior who
actually cares would explain it to you.

---

## The tone (this is the trade point, match it exactly)

Write like a **battle-hardened friend** who has been paged at 3am and wants to save you the
same pain. Calm, honest, plain-spoken, a little dry. Never a hype machine.

Do:
- Lead with a real pain the reader recognizes ("the first time a rebase goes sideways...").
- Be concrete. Name the actual thing, show the actual command or idea.
- Be humble and honest. It is fine to say something is a hack or has a catch.
- Sound human. Short sentences. A dry joke is fine if it earns its place.

Do not:
- No hype words: "revolutionary", "game-changer", "unlock", "supercharge", "10x", "dive in".
- No emoji spam, no hashtag stuffing, no clickbait, no fake urgency.
- No corporate voice, no "we are excited to announce".
- Do not oversell. The calm, honest tone *is* the differentiator. Keep it.

---

## Hard rules (apply to every single post)

1. **No em dashes.** Do not use `—` or `–`. Use a period, a comma, parentheses, or just
   rewrite the sentence. (Em dashes are a dead giveaway that a bot wrote it.)
2. **One link per post**, pointing to a real guide or topic, in the exact UTM format below.
3. **Keep it tight.** Max reading time 2 to 3 minutes. See per-platform limits.
4. **Never invent** guide titles, slugs, or URLs. Use a real one (see "Finding a real link").
5. **Match the tone above.** If it reads like an ad, rewrite it.
6. Plain ASCII quotes and hyphens. No smart quotes.

---

## The link format (copy exactly)

Take the real page URL, then append the campaign query string. Set `utm_source` to the
platform you are posting on. Keep `utm_medium=social` and `utm_campaign=launch`.

```
<page-url>?utm_source=<PLATFORM>&utm_medium=social&utm_campaign=launch
```

- On **x.com**, use `utm_source=x.com`
- On **dev.to**, use `utm_source=dev.to`

**Full examples:**

- A specific guide, on X:
  `https://themissingmanual.dev/guides/git-from-zero?utm_source=x.com&utm_medium=social&utm_campaign=launch`
- The same guide, on dev.to:
  `https://themissingmanual.dev/guides/git-from-zero?utm_source=dev.to&utm_medium=social&utm_campaign=launch`
- A topic/category, on X:
  `https://themissingmanual.dev/categories/databases?utm_source=x.com&utm_medium=social&utm_campaign=launch`
- The whole site (only when the post is about the project as a whole), on X:
  `https://themissingmanual.dev/?utm_source=x.com&utm_medium=social&utm_campaign=launch`

Rules for the link:
- Prefer a **specific guide or topic** over the homepage. A post about Git links the Git guide.
- The `?` goes right after the path. Do not add a trailing slash before it on guide URLs.
- Do not shorten the URL. Post the full link so the UTM tags survive.

---

## Finding a real link

- **The current list of every guide and its URL is at:** https://themissingmanual.dev/llms.txt
  Pull from there so you only ever link to pages that exist.
- Guide URL shape: `https://themissingmanual.dev/guides/<slug>`
- Topic URL shape: `https://themissingmanual.dev/categories/<slug>`
- A few real ones to start with:
  - `guides/git-from-zero`
  - `guides/python-from-zero`
  - `guides/javascript-from-zero`
  - `guides/go-from-zero`
  - `guides/rust-from-zero`
  - `guides/flyway-database-migrations`
  - `guides/deploying-to-a-vps`
  - `guides/ship-your-side-project`
  - topics: `categories/programming-languages`, `categories/databases`, `categories/networking`, `categories/security`

If you are unsure a slug is real, fetch `llms.txt` and pick from it.

---

## X (x.com) posts

- One post: under 280 characters including the link. A short thread (2 to 4 posts) is fine for
  a bigger topic; only the first or last post carries the link.
- Open with the pain or the surprising fact. End with the link. No hashtags, or one at most.
- No thread-bait ("a 🧵 that will change how you..."). Just say the useful thing.

**Example (copy this style):**

```
Most Git tutorials teach you commands. None of them teach you what a branch actually is,
so the first time a rebase goes sideways you are stuck.

Git From Zero explains the model first, then the commands. Free, no signup.

https://themissingmanual.dev/guides/git-from-zero?utm_source=x.com&utm_medium=social&utm_campaign=launch
```

---

## dev.to posts

- 2 to 3 minute read (roughly 350 to 600 words). Short intro, 2 to 4 small sections, a close.
- Give real value in the post itself. The link is a "go deeper", not the whole point.
- Format: a plain title, a one-line hook, the body, then the link near the end.
- Tags: 3 to 4 relevant dev.to tags (e.g. `git`, `beginners`, `webdev`, `career`). Lowercase.

**Example skeleton (fill with one real topic):**

```
Title: What nobody tells you about <topic>

<One or two sentences naming the exact pain a developer hits with this topic.>

## The part the tutorials skip
<The mental model or the "why" in plain language. One concrete example.>

## What to actually do
<2 to 4 practical points or a short, real command/snippet. Honest about the catches.>

## Go deeper
The full walkthrough, free and no signup, is here:
https://themissingmanual.dev/guides/<slug>?utm_source=dev.to&utm_medium=social&utm_campaign=launch

Tags: <tag1>, <tag2>, <tag3>
```

---

## Before you post, check:

- [ ] No em dashes anywhere.
- [ ] Exactly one link, real URL, correct `utm_source` for the platform, `utm_medium=social`, `utm_campaign=launch`.
- [ ] Under the length limit (X: 280 chars; dev.to: 2 to 3 min read).
- [ ] Reads like the battle-hardened friend, not an ad. No hype words, no emoji spam.
- [ ] Links to a specific guide or topic, not the homepage (unless the post is about the whole project).
