# Translating The Missing Manual

This is the guide for adding translations to The Missing Manual: translating a guide into a language the
site already supports, and adding a new language. Translations are written by people, live as Markdown
files in this repo, and go through normal pull requests. There is no CMS and no machine translation.

## How it works

- The English guides in `guides/` are the source of truth. A translation is a copy of a guide's files,
  translated, placed under `translations/<locale>/`.
- Translated guides are served at `/<locale>/guides/<slug>` and `/<locale>/guides/<slug>/<phase>`, for
  example `/pt-br/guides/git-from-zero/1`. The English slug stays in the URL.
- Category, order, difficulty, and tags always come from the English guide, so a translation only carries
  the text.
- A guide appears in a language only once **all** of its phases are translated (see below).
- Supported languages are the folders listed in `platform/core/src/locales.rs`. Today: `pt-br`
  (Brazilian Portuguese).

## Before you start

Open an issue (or comment on an existing one) saying which language and which guide you are taking, so two
people don't translate the same guide. Start with one small guide; it is the fastest way to get feedback on
tone and terminology before doing more.

If your language is not supported yet, say so in the issue. See [Adding a new language](#adding-a-new-language).

## 1. Where files go

Mirror the English files exactly, with the same category folder, guide folder, and file names:

```
guides/<category>/<slug>/<file>.md                  <- English
translations/<locale>/<category>/<slug>/<file>.md   <- translation
```

Example:

```
guides/version-control/git-from-zero/01-what-is-version-control.md
translations/pt-br/version-control/git-from-zero/01-what-is-version-control.md
```

Translate `_guide.md` (the overview, phase 0) and every `NN-*.md` phase of the guide. Only
`translations/<supported-locale>/**` is read; anything else under `translations/` is ignored.

## 2. Frontmatter

Every file starts with this header. Leave out category, order, difficulty, group, and tags; they are taken
from the English guide.

```yaml
---
title: "<translated phase title>"
guide: "git-from-zero"
phase: 1
summary: "<translated one-sentence summary>"
synonyms: ["<search phrase>", "<another search phrase>"]
source_updated: "2026-06-18"
---
```

- `guide` and `phase` must match the English file exactly.
- `title` is the translated title, and the first `# ` heading in the body must be the same text.
- `synonyms` are phrases a reader in your language would type into search.
- `source_updated` is the English file's `updated:` date **at the moment you translated it**.
- Quote `title`, `summary`, and `source_updated`. A colon inside an unquoted value breaks the file.
- On `_guide.md` only, credit yourself with your GitHub handle:
  `translators: ["your-github-handle"]`. It shows as a "Translated by @handle" line on the guide page.

## 3. What to translate, what never to touch

Translate: prose, headings, summaries, quiz questions, choices, and explanations, Mermaid diagram labels, and
code comments when that helps the reader.

Never change: code, commands, program output, quiz `"answer"` indexes, the info string of a code fence
(`console`, `python runnable`, `quiz`, `mermaid`...), link targets (`/guides/...`), slugs, and file names.
Do not add, remove, or reorder code blocks, quizzes, or diagrams. A quiz keeps the same questions, the same
number of choices, and the right answer in the same position.

Links to other guides stay as English paths (`/guides/<slug>`). The site points them at the translated
version automatically when that guide exists in your language.

## 4. Publish rule: all phases or nothing

A translated guide goes live only when **every** English phase (0..N) has a translation file and there is
no file for a phase the English guide doesn't have. If anything is missing, the whole guide stays hidden
and the admin console lists what is missing. You can open a draft PR early for feedback; it just won't
appear on the site until the guide is complete.

## 5. Keeping translations up to date

When an English phase changes after its translation's `source_updated` date, the translated page shows a
banner saying the English version is newer, with a link to it. To clear it: read what changed in English
(`git log -p` on the English file), update the translation, and set `source_updated` to the English
`updated:` date you worked from. Updating stale translations is as valuable as translating new guides.

## 6. Writing quality

The bar is the same as the English guides: accurate, current, and easy for a beginner to follow.

- Write natural language, adapted rather than literal. If a sentence reads like a translation, rewrite it.
- Keep the friendly, plain voice of the original, with the same examples and the same level of detail.
- Keep the English term when that is what developers in your language actually say (for example `commit`,
  `branch`, `pull request`), and explain it the first time it appears.
- Don't "fix" the technical content while translating. If you find an error in the English, open a
  separate issue or PR for the English guide.
- Project style rules apply in every language: no em dashes (use " - "), and no sincerity filler
  ("frankly", "to be fair", "truthfully" and their equivalents in your language).
- Save files with LF line endings (not CRLF). Most editors have a setting for this.

## 7. Check your work

From `platform/web`, run the validator:

```bash
npm run validate:translations
```

Or check one language only:

```bash
node scripts/validate-translations.mjs --locale pt-br
```

It checks file paths, frontmatter, the H1, line endings, em dashes, code fences, quiz structure and answer
indexes, `/guides/` links, and Mermaid blocks, and reports which guides are still incomplete. Errors fail
the run. Warnings (such as a code block whose comments you translated) do not.

To preview locally, start the API from the repo root, then the web app:

```bash
cargo run --manifest-path platform/Cargo.toml -p server
```

```bash
cd platform/web && npm install && npm run dev
```

Then open `http://localhost:5173/<locale>/guides/<slug>`. Restart the API after editing translation files
so it picks them up.

## 8. Pull request checklist

- [ ] Every phase of the guide is translated (`_guide.md` plus all `NN-*.md`)
- [ ] `source_updated` matches the English `updated:` date you worked from
- [ ] `translators:` is set on `_guide.md`
- [ ] `npm run validate:translations` passes with no errors
- [ ] You read the whole guide in the browser at `/<locale>/guides/<slug>`
- [ ] No em dashes and no sincerity filler

## Adding a new language

Adding a language touches code, so it is done in a separate PR, reviewed by a maintainer. Open an issue
first. The locale code is lowercase, either a language (`es`) or a language plus region (`pt-br`).

1. **Register the locale in the API:** add an entry to `LOCALES` in `platform/core/src/locales.rs`
   with `code`, `hreflang` (the BCP 47 tag, e.g. `pt-BR`), `name` (the language's own name, e.g.
   "Português (Brasil)"), and `stemmer` (the search stemmer).
2. **Search stop words (optional):** add a list for the language in `locale_stem_analyzer` in
   `platform/core/src/index.rs`. Without one, search still works, just slightly less precisely.
3. **Register the locale in the web app:** add the same `code`, `hreflang`, and `name` to `LOCALES` in
   `platform/web/src/lib/i18n/locales.js`. The two lists must match.
4. **Translate the interface text:** copy `platform/web/src/lib/i18n/en.js` to `<code>.js`, translate
   the values (never the keys), and add it to `CATALOGS` in `platform/web/src/lib/i18n/index.js`. Any key
   you leave out falls back to English.
5. **Verify:** run `cargo test --manifest-path platform/Cargo.toml` and
   `(cd platform/web && npm run build)`, then preview one translated guide.

Search stemmers exist for Arabic, Danish, Dutch, English, Finnish, French, German, Greek, Hungarian,
Italian, Norwegian, Portuguese, Romanian, Russian, Spanish, Swedish, Tamil, and Turkish. For any other
language the locale cannot be registered yet; say so in the issue, and support for languages without a
stemmer will be added first.
