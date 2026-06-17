# content-core Implementation Plan (Platform — Plan 1 of 3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `content-core`, the reusable Rust engine that ingests the Markdown guides into SQLite + a Tantivy index and answers natural-language searches (with synonyms + Levenshtein typo tolerance).

**Architecture:** A single library crate in a Cargo workspace under `/platform`. Markdown stays the source of truth; `ingest()` parses frontmatter, renders Markdown→HTML (comrak), and populates SQLite (content/metadata) + Tantivy (search). `search()` queries Tantivy; `get_*()` read SQLite. No HTTP — the `server` plan layers that on top. A thin `ingest` binary exposes the pipeline on the CLI.

**Tech Stack:** Rust, comrak (MD→HTML, GFM), rusqlite (SQLite, bundled), tantivy (search), serde + serde_yaml + serde_json (frontmatter/metadata), walkdir, thiserror; tempfile for tests.

**Source spec:** `docs/superpowers/specs/2026-06-17-platform-web-first-design.md`

---

## Conventions

- **TDD:** every task writes a failing test first, then the minimal code to pass. Run `cargo test` (or a focused `cargo test <name>`) at each step.
- **Commits:** conventional (`feat:`, `test:`, `chore:`). Every commit message ends with a second `-m`:
  `-m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"`.
- **Crate versions** below are known-good families; on first build, run `cargo build` and let Cargo resolve patch versions. If a Tantivy API detail drifted, fix against the compiler (the spec's §14 lists this as expected tuning).
- All files are created with the editor/Write tool (creates parent dirs). Shell is used for `cargo` and `git`.

## File Structure

```
/platform/
  Cargo.toml                 workspace manifest (members = ["core"])
  /core/
    Cargo.toml               content-core crate manifest + deps
    src/lib.rs               public API surface: ingest(), search(), get_* re-exports
    src/models.rs            Frontmatter, Phase, GuideSummary, SearchHit
    src/frontmatter.rs       split + parse YAML frontmatter from a Markdown file
    src/render.rs            Markdown -> HTML via comrak
    src/store.rs             SQLite: schema + upserts + reads
    src/index.rs             Tantivy: schema, writer, search (BM25 + boosts + fuzzy)
    src/ingest.rs            walk guides/, parse+render, populate store + index
    src/bin/ingest.rs        CLI wrapper around content_core::ingest
    tests/real_guides.rs     integration test against the repo's real guides/
```

Responsibilities are one-per-file. `models` is shared types; `frontmatter`/`render` are pure transforms; `store` owns SQLite; `index` owns Tantivy; `ingest` orchestrates; `lib` is the public surface.

---

## Task 0: Workspace + crate skeleton

**Files:**
- Create: `platform/Cargo.toml`
- Create: `platform/core/Cargo.toml`
- Create: `platform/core/src/lib.rs`

- [ ] **Step 1: Create the workspace manifest** — `platform/Cargo.toml`

```toml
[workspace]
resolver = "2"
members = ["core"]
```

- [ ] **Step 2: Create the crate manifest** — `platform/core/Cargo.toml`

```toml
[package]
name = "content-core"
version = "0.1.0"
edition = "2021"

[lib]
name = "content_core"
path = "src/lib.rs"

[[bin]]
name = "ingest"
path = "src/bin/ingest.rs"

[dependencies]
comrak = "0.28"
tantivy = "0.22"
rusqlite = { version = "0.32", features = ["bundled"] }
serde = { version = "1", features = ["derive"] }
serde_yaml = "0.9"
serde_json = "1"
walkdir = "2"
thiserror = "1"

[dev-dependencies]
tempfile = "3"
```

- [ ] **Step 3: Minimal lib with a smoke test** — `platform/core/src/lib.rs`

```rust
//! content-core: ingest Markdown guides into SQLite + Tantivy and search them.

#[cfg(test)]
mod smoke {
    #[test]
    fn workspace_builds() {
        assert_eq!(2 + 2, 4);
    }
}
```

- [ ] **Step 4: Verify it builds and the smoke test passes**

Run: `cargo test --manifest-path platform/Cargo.toml`
Expected: compiles; `test smoke::workspace_builds ... ok`.

- [ ] **Step 5: Commit**

```bash
git add platform/ && git commit -m "chore: scaffold platform Cargo workspace + content-core crate" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 1: Domain models + frontmatter parsing

**Files:**
- Create: `platform/core/src/models.rs`
- Create: `platform/core/src/frontmatter.rs`
- Modify: `platform/core/src/lib.rs`

- [ ] **Step 1: Write the failing test** — append to `platform/core/src/frontmatter.rs`

```rust
#[cfg(test)]
mod tests {
    use super::*;

    const SAMPLE: &str = "---\n\
title: \"The Mental Model\"\n\
guide: \"git-explained-like-a-human\"\n\
phase: 1\n\
summary: \"Commits are snapshots.\"\n\
tags: [git, commits]\n\
difficulty: beginner\n\
synonyms: [\"what is a git commit\"]\n\
updated: 2026-06-17\n\
---\n\
# Heading\n\nBody text.\n";

    #[test]
    fn parses_frontmatter_and_returns_body() {
        let (fm, body) = parse_markdown(SAMPLE).unwrap();
        assert_eq!(fm.title, "The Mental Model");
        assert_eq!(fm.guide, "git-explained-like-a-human");
        assert_eq!(fm.phase, 1);
        assert_eq!(fm.tags, vec!["git", "commits"]);
        assert_eq!(fm.synonyms, vec!["what is a git commit"]);
        assert!(body.starts_with("# Heading"));
    }

    #[test]
    fn missing_frontmatter_is_an_error() {
        assert!(parse_markdown("# no frontmatter here").is_err());
    }
}
```

- [ ] **Step 2: Run it to verify failure**

Run: `cargo test --manifest-path platform/Cargo.toml frontmatter`
Expected: FAIL — `parse_markdown` / `Frontmatter` not found.

- [ ] **Step 3: Define the models** — `platform/core/src/models.rs`

```rust
use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
pub struct Frontmatter {
    pub title: String,
    pub guide: String,
    pub phase: u32,
    pub summary: String,
    pub tags: Vec<String>,
    pub difficulty: String,
    pub synonyms: Vec<String>,
    pub updated: String,
}

#[derive(Debug, Clone)]
pub struct Phase {
    pub guide_slug: String,
    pub phase_no: u32,
    pub title: String,
    pub summary: String,
    pub tags: Vec<String>,
    pub difficulty: String,
    pub synonyms: Vec<String>,
    pub html: String,
    pub updated: String,
}

#[derive(Debug, Clone, PartialEq)]
pub struct GuideSummary {
    pub slug: String,
    pub title: String,
    pub summary: String,
}

#[derive(Debug, Clone, PartialEq)]
pub struct SearchHit {
    pub guide_slug: String,
    pub phase_no: u32,
    pub title: String,
    pub summary: String,
    pub score: f32,
}
```

- [ ] **Step 4: Implement frontmatter parsing** — top of `platform/core/src/frontmatter.rs`

```rust
use crate::models::Frontmatter;

#[derive(thiserror::Error, Debug)]
pub enum FrontmatterError {
    #[error("file does not start with a `---` frontmatter block")]
    Missing,
    #[error("frontmatter is not closed with a `---` line")]
    Unterminated,
    #[error("invalid YAML in frontmatter: {0}")]
    Yaml(#[from] serde_yaml::Error),
}

/// Split a Markdown document into its YAML frontmatter and its body.
pub fn parse_markdown(input: &str) -> Result<(Frontmatter, String), FrontmatterError> {
    let rest = input.strip_prefix("---\n").ok_or(FrontmatterError::Missing)?;
    let end = rest.find("\n---").ok_or(FrontmatterError::Unterminated)?;
    let yaml = &rest[..end];
    let body = rest[end + 4..].trim_start_matches('\n').to_string();
    let fm: Frontmatter = serde_yaml::from_str(yaml)?;
    Ok((fm, body))
}
```

- [ ] **Step 5: Wire modules into the lib** — replace `platform/core/src/lib.rs`

```rust
//! content-core: ingest Markdown guides into SQLite + Tantivy and search them.

pub mod models;
pub mod frontmatter;

pub use models::{Frontmatter, GuideSummary, Phase, SearchHit};
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `cargo test --manifest-path platform/Cargo.toml frontmatter`
Expected: both tests PASS.

- [ ] **Step 7: Commit**

```bash
git add platform/ && git commit -m "feat: content-core models + frontmatter parsing" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Markdown → HTML rendering

**Files:**
- Create: `platform/core/src/render.rs`
- Modify: `platform/core/src/lib.rs`

- [ ] **Step 1: Write the failing test** — `platform/core/src/render.rs`

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn renders_headings_tables_and_code() {
        let md = "# Title\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\n```sh\ngit status\n```\n";
        let html = render_markdown(md);
        assert!(html.contains("<h1>"));
        assert!(html.contains("<table>"));
        assert!(html.contains("<code"));
    }
}
```

- [ ] **Step 2: Run it to verify failure**

Run: `cargo test --manifest-path platform/Cargo.toml render`
Expected: FAIL — `render_markdown` not found.

- [ ] **Step 3: Implement with comrak + GFM** — top of `platform/core/src/render.rs`

```rust
use comrak::{markdown_to_html, ComrakOptions};

/// Render CommonMark + GitHub-flavored Markdown to HTML.
pub fn render_markdown(md: &str) -> String {
    let mut opts = ComrakOptions::default();
    opts.extension.table = true;
    opts.extension.strikethrough = true;
    opts.extension.autolink = true;
    markdown_to_html(md, &opts)
}
```

- [ ] **Step 4: Export it** — add to `platform/core/src/lib.rs`

```rust
pub mod render;
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cargo test --manifest-path platform/Cargo.toml render`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add platform/ && git commit -m "feat: Markdown to HTML rendering via comrak (GFM)" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: SQLite store

**Files:**
- Create: `platform/core/src/store.rs`
- Modify: `platform/core/src/lib.rs`

- [ ] **Step 1: Write the failing test** — `platform/core/src/store.rs`

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::Phase;

    fn sample_phase() -> Phase {
        Phase {
            guide_slug: "git".into(),
            phase_no: 1,
            title: "The Mental Model".into(),
            summary: "Commits are snapshots.".into(),
            tags: vec!["git".into(), "commits".into()],
            difficulty: "beginner".into(),
            synonyms: vec!["what is a commit".into()],
            html: "<h1>Hi</h1>".into(),
            updated: "2026-06-17".into(),
        }
    }

    #[test]
    fn upsert_then_read_back() {
        let store = Store::open_in_memory().unwrap();
        store.upsert_guide("git", "Git Guide", "All about git").unwrap();
        store.upsert_phase(&sample_phase()).unwrap();

        let got = store.get_phase("git", 1).unwrap().unwrap();
        assert_eq!(got.title, "The Mental Model");
        assert_eq!(got.tags, vec!["git", "commits"]);

        let guides = store.list_guides().unwrap();
        assert_eq!(guides.len(), 1);
        assert_eq!(guides[0].slug, "git");
    }

    #[test]
    fn upsert_is_idempotent_on_guide_and_phase() {
        let store = Store::open_in_memory().unwrap();
        store.upsert_guide("git", "Git Guide", "x").unwrap();
        store.upsert_phase(&sample_phase()).unwrap();
        store.upsert_phase(&sample_phase()).unwrap(); // same (guide,phase_no)
        assert_eq!(store.list_guides().unwrap().len(), 1);
        assert!(store.get_phase("git", 1).unwrap().is_some());
    }
}
```

- [ ] **Step 2: Run it to verify failure**

Run: `cargo test --manifest-path platform/Cargo.toml store`
Expected: FAIL — `Store` not found.

- [ ] **Step 3: Implement the store** — top of `platform/core/src/store.rs`

```rust
use rusqlite::{params, Connection};
use crate::models::{GuideSummary, Phase};

pub struct Store {
    conn: Connection,
}

#[derive(thiserror::Error, Debug)]
pub enum StoreError {
    #[error(transparent)]
    Sqlite(#[from] rusqlite::Error),
    #[error(transparent)]
    Json(#[from] serde_json::Error),
}

impl Store {
    pub fn open_in_memory() -> Result<Self, StoreError> {
        Self::from_conn(Connection::open_in_memory()?)
    }

    pub fn open(path: &std::path::Path) -> Result<Self, StoreError> {
        Self::from_conn(Connection::open(path)?)
    }

    fn from_conn(conn: Connection) -> Result<Self, StoreError> {
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS guides (
                 slug TEXT PRIMARY KEY,
                 title TEXT NOT NULL,
                 summary TEXT NOT NULL
             );
             CREATE TABLE IF NOT EXISTS phases (
                 guide_slug TEXT NOT NULL,
                 phase_no INTEGER NOT NULL,
                 title TEXT NOT NULL,
                 summary TEXT NOT NULL,
                 tags_json TEXT NOT NULL,
                 difficulty TEXT NOT NULL,
                 synonyms_json TEXT NOT NULL,
                 html TEXT NOT NULL,
                 updated TEXT NOT NULL,
                 PRIMARY KEY (guide_slug, phase_no)
             );",
        )?;
        Ok(Self { conn })
    }

    pub fn upsert_guide(&self, slug: &str, title: &str, summary: &str) -> Result<(), StoreError> {
        self.conn.execute(
            "INSERT INTO guides (slug, title, summary) VALUES (?1, ?2, ?3)
             ON CONFLICT(slug) DO UPDATE SET title = ?2, summary = ?3",
            params![slug, title, summary],
        )?;
        Ok(())
    }

    pub fn upsert_phase(&self, p: &Phase) -> Result<(), StoreError> {
        let tags = serde_json::to_string(&p.tags)?;
        let syns = serde_json::to_string(&p.synonyms)?;
        self.conn.execute(
            "INSERT INTO phases
               (guide_slug, phase_no, title, summary, tags_json, difficulty, synonyms_json, html, updated)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
             ON CONFLICT(guide_slug, phase_no) DO UPDATE SET
               title=?3, summary=?4, tags_json=?5, difficulty=?6, synonyms_json=?7, html=?8, updated=?9",
            params![p.guide_slug, p.phase_no, p.title, p.summary, tags, p.difficulty, syns, p.html, p.updated],
        )?;
        Ok(())
    }

    pub fn get_phase(&self, guide_slug: &str, phase_no: u32) -> Result<Option<Phase>, StoreError> {
        let mut stmt = self.conn.prepare(
            "SELECT guide_slug, phase_no, title, summary, tags_json, difficulty, synonyms_json, html, updated
             FROM phases WHERE guide_slug = ?1 AND phase_no = ?2",
        )?;
        let mut rows = stmt.query(params![guide_slug, phase_no])?;
        match rows.next()? {
            Some(row) => Ok(Some(Phase {
                guide_slug: row.get(0)?,
                phase_no: row.get(1)?,
                title: row.get(2)?,
                summary: row.get(3)?,
                tags: serde_json::from_str(&row.get::<_, String>(4)?)?,
                difficulty: row.get(5)?,
                synonyms: serde_json::from_str(&row.get::<_, String>(6)?)?,
                html: row.get(7)?,
                updated: row.get(8)?,
            })),
            None => Ok(None),
        }
    }

    pub fn list_guides(&self) -> Result<Vec<GuideSummary>, StoreError> {
        let mut stmt = self.conn.prepare("SELECT slug, title, summary FROM guides ORDER BY slug")?;
        let rows = stmt.query_map([], |row| {
            Ok(GuideSummary { slug: row.get(0)?, title: row.get(1)?, summary: row.get(2)? })
        })?;
        Ok(rows.collect::<Result<Vec<_>, _>>()?)
    }
}
```

- [ ] **Step 4: Export it** — add to `platform/core/src/lib.rs`

```rust
pub mod store;
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `cargo test --manifest-path platform/Cargo.toml store`
Expected: both PASS.

- [ ] **Step 6: Commit**

```bash
git add platform/ && git commit -m "feat: SQLite store for guides and phases" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Tantivy index + lexical search

**Files:**
- Create: `platform/core/src/index.rs`
- Modify: `platform/core/src/lib.rs`

- [ ] **Step 1: Write the failing test** — `platform/core/src/index.rs`

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::Phase;

    fn phase(no: u32, title: &str, body: &str, tags: &[&str]) -> Phase {
        Phase {
            guide_slug: "git".into(), phase_no: no, title: title.into(),
            summary: format!("{title} summary"), tags: tags.iter().map(|s| s.to_string()).collect(),
            difficulty: "beginner".into(), synonyms: vec![], html: format!("<p>{body}</p>"),
            updated: "2026-06-17".into(),
        }
    }

    #[test]
    fn finds_phase_by_body_term() {
        let idx = SearchIndex::create_in_ram().unwrap();
        let mut w = idx.writer().unwrap();
        w.add_phase(&phase(1, "The Mental Model", "a branch is a label pointing at a commit", &["git"]), "a branch is a label pointing at a commit").unwrap();
        w.add_phase(&phase(2, "Everyday Commands", "git status shows your working tree", &["git"]), "git status shows your working tree").unwrap();
        w.commit().unwrap();

        let hits = idx.search("branch", 10).unwrap();
        assert_eq!(hits[0].phase_no, 1);
    }

    #[test]
    fn title_match_outranks_body_match() {
        let idx = SearchIndex::create_in_ram().unwrap();
        let mut w = idx.writer().unwrap();
        w.add_phase(&phase(1, "Stash", "shelving changes", &["git"]), "shelving changes").unwrap();
        w.add_phase(&phase(2, "Commands", "you can stash changes too", &["git"]), "you can stash changes too").unwrap();
        w.commit().unwrap();

        let hits = idx.search("stash", 10).unwrap();
        assert_eq!(hits[0].phase_no, 1); // title hit ranks first
    }
}
```

- [ ] **Step 2: Run it to verify failure**

Run: `cargo test --manifest-path platform/Cargo.toml index`
Expected: FAIL — `SearchIndex` not found.

- [ ] **Step 3: Implement the index** — top of `platform/core/src/index.rs`

```rust
use tantivy::{
    collector::TopDocs,
    query::QueryParser,
    schema::{Schema, Field, STORED, STRING, TEXT, Value},
    Index, IndexWriter, TantivyDocument, Term,
};
use crate::models::{Phase, SearchHit};

pub struct Fields {
    pub guide_slug: Field,
    pub phase_no: Field,
    pub title: Field,
    pub summary: Field,
    pub body: Field,
    pub tags: Field,
    pub synonyms: Field,
}

pub struct SearchIndex {
    index: Index,
    fields: Fields,
}

pub struct Writer<'a> {
    writer: IndexWriter,
    fields: &'a Fields,
}

fn build_schema() -> (Schema, Fields) {
    let mut b = Schema::builder();
    let guide_slug = b.add_text_field("guide_slug", STRING | STORED);
    let phase_no = b.add_u64_field("phase_no", STORED);
    let title = b.add_text_field("title", TEXT | STORED);
    let summary = b.add_text_field("summary", TEXT | STORED);
    let body = b.add_text_field("body", TEXT);
    let tags = b.add_text_field("tags", TEXT);
    let synonyms = b.add_text_field("synonyms", TEXT);
    let schema = b.build();
    (schema.clone(), Fields { guide_slug, phase_no, title, summary, body, tags, synonyms })
}

impl SearchIndex {
    pub fn create_in_ram() -> tantivy::Result<Self> {
        let (schema, fields) = build_schema();
        Ok(Self { index: Index::create_in_ram(schema), fields })
    }

    pub fn open_or_create(dir: &std::path::Path) -> tantivy::Result<Self> {
        std::fs::create_dir_all(dir).ok();
        let (schema, fields) = build_schema();
        let index = Index::open_in_dir(dir).or_else(|_| Index::create_in_dir(dir, schema))?;
        Ok(Self { index, fields })
    }

    pub fn writer(&self) -> tantivy::Result<Writer<'_>> {
        Ok(Writer { writer: self.index.writer(50_000_000)?, fields: &self.fields })
    }

    /// Lexical search with field boosts (title and tags weigh most).
    pub fn search(&self, query: &str, limit: usize) -> tantivy::Result<Vec<SearchHit>> {
        let reader = self.index.reader()?;
        let searcher = reader.searcher();
        let f = &self.fields;
        let mut parser = QueryParser::for_index(
            &self.index,
            vec![f.title, f.tags, f.summary, f.body, f.synonyms],
        );
        parser.set_field_boost(f.title, 3.0);
        parser.set_field_boost(f.tags, 2.0);
        parser.set_conjunction_by_default(); // all terms should match when possible
        let parsed = parser.parse_query_lenient(query).0;
        let top = searcher.search(&parsed, &TopDocs::with_limit(limit))?;

        let mut hits = Vec::new();
        for (score, addr) in top {
            let doc: TantivyDocument = searcher.doc(addr)?;
            hits.push(SearchHit {
                guide_slug: doc.get_first(f.guide_slug).and_then(|v| v.as_str()).unwrap_or("").to_string(),
                phase_no: doc.get_first(f.phase_no).and_then(|v| v.as_u64()).unwrap_or(0) as u32,
                title: doc.get_first(f.title).and_then(|v| v.as_str()).unwrap_or("").to_string(),
                summary: doc.get_first(f.summary).and_then(|v| v.as_str()).unwrap_or("").to_string(),
                score,
            });
        }
        Ok(hits)
    }
}

impl<'a> Writer<'a> {
    /// Add one phase as a search document. `plain_text` is the de-HTML'd body for indexing.
    pub fn add_phase(&mut self, p: &Phase, plain_text: &str) -> tantivy::Result<()> {
        let f = self.fields;
        let mut doc = TantivyDocument::new();
        doc.add_text(f.guide_slug, &p.guide_slug);
        doc.add_u64(f.phase_no, p.phase_no as u64);
        doc.add_text(f.title, &p.title);
        doc.add_text(f.summary, &p.summary);
        doc.add_text(f.body, plain_text);
        doc.add_text(f.tags, &p.tags.join(" "));
        doc.add_text(f.synonyms, &p.synonyms.join(" "));
        self.writer.add_document(doc)?;
        Ok(())
    }

    /// Remove any existing docs for a guide_slug before re-adding (idempotent re-ingest).
    pub fn delete_guide(&mut self, guide_slug: &str) {
        let term = Term::from_field_text(self.fields.guide_slug, guide_slug);
        self.writer.delete_term(term);
    }

    pub fn commit(&mut self) -> tantivy::Result<()> {
        self.writer.commit()?;
        Ok(())
    }
}
```

- [ ] **Step 4: Export it** — add to `platform/core/src/lib.rs`

```rust
pub mod index;
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `cargo test --manifest-path platform/Cargo.toml index`
Expected: both PASS. (If a Tantivy 0.22 API name differs — e.g. `as_str`/`Value` import — fix against the compiler error; behavior is unchanged.)

- [ ] **Step 6: Commit**

```bash
git add platform/ && git commit -m "feat: Tantivy index with boosted lexical search" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Levenshtein typo tolerance

**Files:**
- Modify: `platform/core/src/index.rs`

- [ ] **Step 1: Write the failing test** — add to the `tests` mod in `platform/core/src/index.rs`

```rust
    #[test]
    fn fuzzy_matches_a_typo() {
        let idx = SearchIndex::create_in_ram().unwrap();
        let mut w = idx.writer().unwrap();
        w.add_phase(&phase(3, "When It Breaks", "rescuing a botched rebase", &["git", "rebase"]),
                    "rescuing a botched rebase").unwrap();
        w.commit().unwrap();

        // "rebse" is one deletion away from "rebase" -> should still hit.
        let hits = idx.search("rebse", 10).unwrap();
        assert!(!hits.is_empty(), "fuzzy search should tolerate the typo");
        assert_eq!(hits[0].phase_no, 3);
    }
```

- [ ] **Step 2: Run it to verify failure**

Run: `cargo test --manifest-path platform/Cargo.toml index::tests::fuzzy_matches_a_typo`
Expected: FAIL — exact parser returns no hits for "rebse".

- [ ] **Step 3: Add a fuzzy fallback to `search`** — replace the body of `search` after `let parsed = ...` so the query combines exact + fuzzy:

```rust
        // Exact/boosted parse first.
        let exact = parser.parse_query_lenient(query).0;

        // Fuzzy fallback: OR together a Levenshtein query (distance 1) per term,
        // across title/body/tags, so typos still match.
        use tantivy::query::{BooleanQuery, FuzzyTermQuery, Occur, Query};
        let mut clauses: Vec<(Occur, Box<dyn Query>)> = vec![(Occur::Should, exact)];
        for raw in query.split_whitespace() {
            let term_text = raw.to_lowercase();
            for field in [f.title, f.body, f.tags] {
                let term = Term::from_field_text(field, &term_text);
                let fq = FuzzyTermQuery::new(term, 1, true); // distance 1, transposition-aware
                clauses.push((Occur::Should, Box::new(fq)));
            }
        }
        let combined = BooleanQuery::new(clauses);
        let top = searcher.search(&combined, &TopDocs::with_limit(limit))?;
```

(Remove the now-unused `let parsed`/`let top` lines this replaces. Exact matches still score highest via the boosts; fuzzy only fills in when exact misses.)

- [ ] **Step 4: Run the fuzzy test AND the Task 4 tests to verify all pass**

Run: `cargo test --manifest-path platform/Cargo.toml index`
Expected: `finds_phase_by_body_term`, `title_match_outranks_body_match`, and `fuzzy_matches_a_typo` all PASS.

- [ ] **Step 5: Commit**

```bash
git add platform/ && git commit -m "feat: Levenshtein fuzzy fallback for typo-tolerant search" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Ingest pipeline

**Files:**
- Create: `platform/core/src/ingest.rs`
- Modify: `platform/core/src/lib.rs`

- [ ] **Step 1: Write the failing test** — `platform/core/src/ingest.rs`

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn ingests_a_fixture_guide() {
        let dir = tempfile::tempdir().unwrap();
        let guide_dir = dir.path().join("guides/demo");
        fs::create_dir_all(&guide_dir).unwrap();
        fs::write(guide_dir.join("01-intro.md"),
"---\n\
title: \"Intro\"\n\
guide: \"demo\"\n\
phase: 1\n\
summary: \"An intro about branches.\"\n\
tags: [demo]\n\
difficulty: beginner\n\
synonyms: [\"getting started\"]\n\
updated: 2026-06-17\n\
---\n\
# Intro\n\nA branch is a label.\n").unwrap();

        let store = crate::store::Store::open_in_memory().unwrap();
        let index = crate::index::SearchIndex::create_in_ram().unwrap();
        let stats = ingest_dir(dir.path(), &store, &index).unwrap();

        assert_eq!(stats.phases, 1);
        let p = store.get_phase("demo", 1).unwrap().unwrap();
        assert!(p.html.contains("<h1>"));
        let hits = index.search("branch", 10).unwrap();
        assert_eq!(hits[0].guide_slug, "demo");
    }
}
```

- [ ] **Step 2: Run it to verify failure**

Run: `cargo test --manifest-path platform/Cargo.toml ingest`
Expected: FAIL — `ingest_dir` / `Stats` not found.

- [ ] **Step 3: Implement ingest** — top of `platform/core/src/ingest.rs`

```rust
use std::path::Path;
use walkdir::WalkDir;
use crate::frontmatter::parse_markdown;
use crate::models::Phase;
use crate::render::render_markdown;
use crate::store::Store;
use crate::index::SearchIndex;

#[derive(Debug, Default, PartialEq)]
pub struct Stats {
    pub guides: usize,
    pub phases: usize,
}

#[derive(thiserror::Error, Debug)]
pub enum IngestError {
    #[error("reading {0}: {1}")]
    Read(String, std::io::Error),
    #[error("frontmatter in {0}: {1}")]
    Frontmatter(String, crate::frontmatter::FrontmatterError),
    #[error(transparent)]
    Store(#[from] crate::store::StoreError),
    #[error(transparent)]
    Tantivy(#[from] tantivy::TantivyError),
}

/// Strip HTML tags to plain text for indexing the body.
fn html_to_text(html: &str) -> String {
    let mut out = String::with_capacity(html.len());
    let mut in_tag = false;
    for c in html.chars() {
        match c {
            '<' => in_tag = true,
            '>' => in_tag = false,
            _ if !in_tag => out.push(c),
            _ => {}
        }
    }
    out
}

/// Ingest every `guides/<slug>/NN-*.md` under `root` into the store + index.
pub fn ingest_dir(root: &Path, store: &Store, index: &SearchIndex) -> Result<Stats, IngestError> {
    let guides_root = root.join("guides");
    let mut writer = index.writer()?;
    let mut stats = Stats::default();
    let mut seen_guides = std::collections::BTreeSet::new();

    for entry in WalkDir::new(&guides_root).into_iter().filter_map(|e| e.ok()) {
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) != Some("md") {
            continue;
        }
        let raw = std::fs::read_to_string(path)
            .map_err(|e| IngestError::Read(path.display().to_string(), e))?;
        let (fm, body_md) = parse_markdown(&raw)
            .map_err(|e| IngestError::Frontmatter(path.display().to_string(), e))?;

        let html = render_markdown(&body_md);
        let plain = html_to_text(&html);

        if seen_guides.insert(fm.guide.clone()) {
            // First time we see this guide: clear any stale docs and record the guide row.
            writer.delete_guide(&fm.guide);
            store.upsert_guide(&fm.guide, &fm.guide, "")?; // title/summary refined when phase 0 (_guide.md) is seen
            stats.guides += 1;
        }

        // Treat phase 0 (the _guide.md overview) as the guide's title/summary too.
        if fm.phase == 0 {
            store.upsert_guide(&fm.guide, &fm.title, &fm.summary)?;
        }

        let phase = Phase {
            guide_slug: fm.guide.clone(),
            phase_no: fm.phase,
            title: fm.title.clone(),
            summary: fm.summary.clone(),
            tags: fm.tags.clone(),
            difficulty: fm.difficulty.clone(),
            synonyms: fm.synonyms.clone(),
            html,
            updated: fm.updated.clone(),
        };
        store.upsert_phase(&phase)?;
        writer.add_phase(&phase, &format!("{} {}", fm.summary, plain))?;
        stats.phases += 1;
    }

    writer.commit()?;
    Ok(stats)
}
```

- [ ] **Step 4: Export it** — add to `platform/core/src/lib.rs`

```rust
pub mod ingest;
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cargo test --manifest-path platform/Cargo.toml ingest`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add platform/ && git commit -m "feat: ingest pipeline (markdown -> store + index)" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Public API, CLI binary, and a real-guides integration test

**Files:**
- Modify: `platform/core/src/lib.rs`
- Create: `platform/core/src/bin/ingest.rs`
- Create: `platform/core/tests/real_guides.rs`

- [ ] **Step 1: Write the failing integration test** — `platform/core/tests/real_guides.rs`

```rust
//! Proves search quality against the ACTUAL repo guides (../../guides relative to crate).
use content_core::ingest::ingest_dir;
use content_core::store::Store;
use content_core::index::SearchIndex;

fn repo_root() -> std::path::PathBuf {
    // crate dir is platform/core; repo root is two levels up.
    std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../..").canonicalize().unwrap()
}

fn ingested() -> (Store, SearchIndex) {
    let store = Store::open_in_memory().unwrap();
    let index = SearchIndex::create_in_ram().unwrap();
    ingest_dir(&repo_root(), &store, &index).unwrap();
    (store, index)
}

#[test]
fn revert_query_lands_on_when_it_breaks() {
    let (_s, index) = ingested();
    let hits = index.search("how to revert a commit", 5).unwrap();
    assert!(!hits.is_empty());
    assert_eq!(hits[0].phase_no, 3, "expected Phase 3 (When It Breaks)");
}

#[test]
fn head_query_lands_on_mental_model() {
    let (_s, index) = ingested();
    let hits = index.search("what does HEAD mean", 5).unwrap();
    assert_eq!(hits[0].phase_no, 1, "expected Phase 1 (Mental Model)");
}

#[test]
fn typo_still_finds_rebase_content() {
    let (_s, index) = ingested();
    let hits = index.search("rebse", 5).unwrap();
    assert!(!hits.is_empty(), "fuzzy search should find rebase content despite the typo");
}
```

- [ ] **Step 2: Run it to verify failure**

Run: `cargo test --manifest-path platform/Cargo.toml --test real_guides`
Expected: FAIL to compile — `content_core::ingest`/`store`/`index` paths exist, but confirm the public modules are exported (Step 3) before this passes.

- [ ] **Step 3: Confirm the public surface** — ensure `platform/core/src/lib.rs` reads exactly:

```rust
//! content-core: ingest Markdown guides into SQLite + Tantivy and search them.

pub mod models;
pub mod frontmatter;
pub mod render;
pub mod store;
pub mod index;
pub mod ingest;

pub use models::{Frontmatter, GuideSummary, Phase, SearchHit};
```

- [ ] **Step 4: Add the CLI binary** — `platform/core/src/bin/ingest.rs`

```rust
//! CLI: ingest the repo's guides into a SQLite DB + Tantivy index on disk.
//! Usage: ingest <repo_root> <data_dir>
use content_core::ingest::ingest_dir;
use content_core::store::Store;
use content_core::index::SearchIndex;

fn main() {
    let mut args = std::env::args().skip(1);
    let root = args.next().unwrap_or_else(|| ".".into());
    let data = args.next().unwrap_or_else(|| "./data".into());
    let data_dir = std::path::Path::new(&data);

    let store = Store::open(&data_dir.join("content.db")).expect("open db");
    let index = SearchIndex::open_or_create(&data_dir.join("index")).expect("open index");
    match ingest_dir(std::path::Path::new(&root), &store, &index) {
        Ok(stats) => println!("ingested {} guides, {} phases", stats.guides, stats.phases),
        Err(e) => { eprintln!("ingest failed: {e}"); std::process::exit(1); }
    }
}
```

- [ ] **Step 5: Run the full test suite to verify everything passes**

Run: `cargo test --manifest-path platform/Cargo.toml`
Expected: all unit tests + the three `real_guides` integration tests PASS. If `revert_query_lands_on_when_it_breaks` ranks the wrong phase, widen indexed text (already includes summary + synonyms) or bump the title/tags boosts in `index.rs` — do not weaken the assertion.

- [ ] **Step 6: Smoke-test the CLI**

Run: `cargo run --manifest-path platform/Cargo.toml --bin ingest -- . ./platform/.data`
Expected: prints `ingested 1 guides, 4 phases` (the Git guide's `_guide.md` + 3 phases). Add `platform/.data/` to `.gitignore`.

- [ ] **Step 7: Commit**

```bash
git add platform/ .gitignore && git commit -m "feat: public API, ingest CLI, and real-guides search tests" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Definition of Done

- `cargo test --manifest-path platform/Cargo.toml` is green (unit + integration).
- `cargo run --bin ingest -- . ./platform/.data` builds a real SQLite DB + Tantivy index from the guides.
- Search over the real guides returns the right phase for "how to revert a commit" (Phase 3), "what does HEAD mean" (Phase 1), and tolerates the typo "rebse".
- `content-core` exposes a clean public API (`ingest`, `store`, `index`, `models`) ready for the `server` plan to wrap in HTTP.

## Self-Review

**Spec coverage:** content-core covers spec §3 (the core), §4 (SQLite + Tantivy schema), §5 (lexical + synonyms via the `synonyms` field + Levenshtein fuzzy), §7 (ingest flow), §12 (TDD). Server endpoints (§6) and the SvelteKit UI are explicitly Plans 2 & 3. The frecency/recency (§11) is correctly absent (post-accounts).
**Placeholders:** none — every step has real test + implementation code and exact commands.
**Type consistency:** `Phase`, `GuideSummary`, `SearchHit`, `Frontmatter` defined once in `models.rs`; `Store`, `SearchIndex`/`Writer`, `ingest_dir`/`Stats` signatures are reused verbatim across tasks and the integration test.
