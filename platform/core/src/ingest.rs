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
            store.upsert_guide(&fm.guide, &fm.guide, "")?; // refined when phase 0 (_guide.md) is seen
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
