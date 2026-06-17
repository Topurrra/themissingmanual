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
