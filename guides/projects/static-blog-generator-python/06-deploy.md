---
title: "Deploying, and Where to Take It"
guide: "static-blog-generator-python"
phase: 6
summary: "Put the generated site on the internet for free with Netlify Drop or GitHub Pages - including the subpath gotcha that breaks root-relative links - then the honest list of what to build next."
tags: [deployment, github-pages, netlify, static-hosting, python]
difficulty: intermediate
synonyms:
  - deploy static site free
  - github pages python blog
  - netlify drop folder
  - github pages css not loading
  - static site next steps
updated: 2026-07-06
---

# Deploying, and Where to Take It

Here's the payoff of the build-time mental model from phase 1: your entire blog is the `site/` folder. Not "the app plus a database plus environment variables" - a folder of files. Deploying means getting that folder onto any computer that hands files out over HTTP, and because that's the cheapest thing a host can possibly do, several companies do it for free.

Two good routes below. The first takes two minutes; the second is the one you'll keep.

## Route one: Netlify Drop (two minutes, zero tools)

Netlify's "Drop" page deploys a folder you drag onto it.

1. Run a fresh build so `site/` is current: `python build.py`.
2. Go to `app.netlify.com/drop` and sign in (free account).
3. Drag the `site/` folder from your file manager onto the page.

That's the deploy. Netlify uploads the files and gives you a live URL like `https://amazing-curie-1a2b3c.netlify.app` - open it on your phone, send it to a friend. Root-relative links work unchanged, because your site sits at the root of that domain.

One follow-up worth doing: your feed still says `https://example.com`. Set `SITE_URL` in `build.py` to your real URL, rebuild, and drag the folder in again. Every future deploy is that same motion - build, drag. Fine for a while; annoying forever. Hence route two.

## Route two: GitHub Pages (the durable setup)

GitHub Pages serves a folder straight out of a Git repository - push to deploy, history included, free. Getting there involves two adjustments to the project and one warning that saves you a bad evening.

⚠️ **Gotcha - the subpath problem, read before creating the repo.** A GitHub Pages site for a repo named `myblog` lives at `https://<username>.github.io/myblog/` - in a *subfolder* of the domain. Your links are root-relative, so `/style.css` would resolve to `https://<username>.github.io/style.css` - above your site, where nothing exists. Unstyled pages, dead links, and the classic "works locally, broken on Pages" report. The clean escape: **name the repository `<username>.github.io`** (your actual GitHub username). That special name serves the site at the domain root, `https://<username>.github.io/`, and every link keeps working exactly as it does locally. Supporting arbitrary repo names needs a configurable base-URL prefix on every link - a real feature, listed under extensions below.

**Adjustment one: output to `docs/`.** Pages can serve from a folder named `docs` on your main branch - which lets one repository hold both your source *and* your published site. One line in `build.py`:

```python
SITE_DIR = Path("docs")
```

**Adjustment two: tell Pages not to run Jekyll.** GitHub Pages runs every site through Jekyll (its own static site generator - a colleague of the one you wrote) unless told otherwise, and Jekyll skips files and folders starting with underscores. Yours has none today, but the standard opt-out is an empty file named `.nojekyll` in the output, and having the build create it means you never think about this again. Add one line at the end of `build()`, next to the feed line:

```python
    (SITE_DIR / ".nojekyll").write_text("")
```

Also set `SITE_URL` to `https://<username>.github.io` while you're in the file, then rebuild:

```console
(.venv) $ python build.py
built  docs/2026-07-02-why-static-sites.html
built  docs/2026-06-28-hello-world.html
built  docs/index.html
built  docs/tags/meta.html
built  docs/tags/web.html
built  docs/feed.xml
```

Everything now lands in `docs/`, because every write in `build()` routes through `SITE_DIR` - one constant changed, the whole build followed. That's the payoff of never hardcoding a path twice.

**Now ship it.** Create a `.gitignore` so the environment stays out of the repo:

```text
.venv/
__pycache__/
```

Then the usual motions - create the empty repo named `<username>.github.io` on GitHub first, then:

```console
$ git init
$ git add .
$ git commit -m "A blog, and the generator that builds it"
$ git remote add origin https://github.com/<username>/<username>.github.io.git
$ git push -u origin main
```

On GitHub: **Settings → Pages → Build and deployment → Deploy from a branch**, pick `main` and `/docs`, save. A minute or two later, `https://<username>.github.io` is your blog. From now on, publishing a post is: write the Markdown, `python build.py`, commit, push.

Notice what you're committing: source *and* output, together. Some people find committing generated files inelegant; the trade is that your repo needs no build step on GitHub's side - no Actions workflow, no CI configuration. For a personal blog built by a script you own, boring wins. When that bothers you enough, "build in CI" is on the list below.

## Where to take it next

The core is done, and it's genuinely yours. The honest extension list, roughly in the order people want them:

| Want | What it takes |
|------|--------------|
| **Drafts** | A `draft: true` frontmatter key, and one `if` in `build()` that skips those posts. Ten minutes, very satisfying. |
| **Prettier URLs** | `/hello-world/` instead of `/2026-06-28-hello-world.html`: strip the date prefix from the slug and write each post as `slug/index.html` - `write_page` already creates folders. |
| **A base URL** | The fix for the subpath gotcha: a `BASE_URL` constant prefixed onto every generated link, so the site works under `/myblog/` too. |
| **Syntax highlighting** | Add `"codehilite"` to the extensions list and `pip install pygments`, then generate the highlight CSS with `pygmentize -S default -f html`. Your code blocks get real coloring at build time - no JavaScript. |
| **A sitemap** | `sitemap.xml` is a sibling of the RSS feed - same "loop posts, emit XML" shape. Search engines read it; `build_feed` is your template. |
| **Jinja2** | When templates need loops and conditionals badly enough, `pip install jinja2` and delete `render()`. You'll learn it in an hour, because you already know what it's doing underneath. |
| **Build in CI** | A GitHub Actions workflow that runs `build.py` on push, so the repo holds only source. The Pages docs cover the deploy action; your build stays one command. |
| **Incremental builds** | Only rebuild changed pages. Real complexity (dependency tracking - a template edit invalidates *everything*) for speed you won't need below hundreds of posts. Know it exists; skip it until it hurts. |

## What you built

A static site generator, from an empty folder: a frontmatter parser that fails loudly, a Markdown pipeline, a template engine you wrote in four lines and understand completely, an index, tag archives, a standards-compliant RSS feed, a dev server with an auto-rebuild loop, and a deployed site with a URL.

More than the blog, you built the mental model. Build time versus request time. Source versus artifact. Templates as substitution. Feeds as contracts strict enough to escape for. The next time you open a Hugo project or a `_config.yml`, you won't be reading incantations - you'll be reading design decisions by people who solved the same problems you solved this weekend, and you'll know why.
