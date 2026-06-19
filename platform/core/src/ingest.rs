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
pub fn html_to_text(html: &str) -> String {
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

/// A content signature of every `guides/**/*.md` under `root`, for cheap change detection.
/// Hashes each file's relative path + bytes (sorted), so any add, edit, or removal changes it.
pub fn content_signature(root: &Path) -> u64 {
    use std::hash::{Hash, Hasher};
    let guides_root = root.join("guides");
    let mut entries: Vec<(String, Vec<u8>)> = Vec::new();
    for entry in WalkDir::new(&guides_root).into_iter().filter_map(|e| e.ok()) {
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) != Some("md") {
            continue;
        }
        if let Ok(bytes) = std::fs::read(path) {
            let rel = path
                .strip_prefix(&guides_root)
                .unwrap_or(path)
                .to_string_lossy()
                .replace('\\', "/");
            entries.push((rel, bytes));
        }
    }
    entries.sort_by(|a, b| a.0.cmp(&b.0)); // WalkDir order isn't guaranteed; sort for determinism
    let mut h = std::collections::hash_map::DefaultHasher::new();
    for (rel, bytes) in &entries {
        rel.hash(&mut h);
        bytes.hash(&mut h);
    }
    h.finish()
}

/// Ingest every `guides/<slug>/NN-*.md` under `root` into the store + index.
pub fn ingest_dir(root: &Path, store: &Store, index: &SearchIndex) -> Result<Stats, IngestError> {
    let guides_root = root.join("guides");
    crate::categories::seed_categories(store)?;
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

        let html = crate::links::rewrite_internal_links(&render_markdown(&body_md), &fm.guide);
        let plain = html_to_text(&html);

        if seen_guides.insert(fm.guide.clone()) {
            // First time we see this guide: clear any stale docs and record the guide row.
            writer.delete_guide(&fm.guide);
            store.upsert_guide(&fm.guide, &fm.guide, "", "", "")?; // refined when phase 0 (_guide.md) is seen
            stats.guides += 1;
        }

        // Treat phase 0 (the _guide.md overview) as the guide's title/summary/category/difficulty.
        if fm.phase == 0 {
            store.upsert_guide(
                &fm.guide,
                &fm.title,
                &fm.summary,
                fm.category.as_deref().unwrap_or(""),
                &fm.difficulty,
            )?;
            store.set_guide_sort_order(&fm.guide, fm.order)?;
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
            markdown: body_md,
        };
        store.upsert_phase(&phase)?;
        writer.add_phase(&phase, &format!("{} {}", fm.summary, plain))?;
        stats.phases += 1;
    }

    writer.commit()?;
    Ok(stats)
}

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
        assert!(p.markdown.contains("branch"), "markdown source kept for editing");
        let hits = index.search("branch", 10).unwrap().hits;
        assert_eq!(hits[0].guide_slug, "demo");
    }

    #[test]
    fn frontmatter_order_controls_listing() {
        let dir = tempfile::tempdir().unwrap();
        let mk = |slug: &str, order: i64| {
            let d = dir.path().join("guides").join(slug);
            fs::create_dir_all(&d).unwrap();
            fs::write(
                d.join("_guide.md"),
                format!(
"---\ntitle: \"{slug}\"\nguide: \"{slug}\"\nphase: 0\nsummary: \"s\"\ntags: [t]\ncategory: version-control\ndifficulty: beginner\nsynonyms: []\nupdated: 2026-06-18\norder: {order}\n---\n# {slug}\n"
                ),
            )
            .unwrap();
        };
        // "aaa" sorts first alphabetically, but a higher order pushes it after "zzz".
        mk("aaa-guide", 2);
        mk("zzz-guide", 1);

        let store = crate::store::Store::open_in_memory().unwrap();
        let index = crate::index::SearchIndex::create_in_ram().unwrap();
        ingest_dir(dir.path(), &store, &index).unwrap();

        let slugs: Vec<String> = store.list_guides().unwrap().into_iter().map(|g| g.slug).collect();
        assert_eq!(slugs, vec!["zzz-guide".to_string(), "aaa-guide".to_string()], "order overrides slug");
    }
}
