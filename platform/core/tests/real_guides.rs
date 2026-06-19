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
    let hits = index.search("how to revert a commit", 5).unwrap().hits;
    assert!(!hits.is_empty());
    assert!(hits.iter().any(|h| h.guide_slug.starts_with("git")), "a Git guide should match");
}

#[test]
fn head_query_lands_on_mental_model() {
    let (_s, index) = ingested();
    let hits = index.search("what does HEAD mean", 5).unwrap().hits;
    assert!(!hits.is_empty() && hits[0].guide_slug.starts_with("git"), "HEAD query should surface a Git guide");
}

#[test]
fn typo_still_finds_rebase_content() {
    let (_s, index) = ingested();
    let hits = index.search("rebse", 5).unwrap().hits;
    assert!(!hits.is_empty(), "fuzzy search should find rebase content despite the typo");
}

#[test]
fn internal_links_rewritten_to_web_routes() {
    let (store, _index) = ingested();
    let p1 = store.get_phase("git-explained-like-a-human", 1).unwrap().unwrap();
    assert!(!p1.html.contains(".md\""), "internal .md links should be rewritten to web routes");
    assert!(p1.html.contains("/guides/git-explained-like-a-human/"), "should contain a rewritten web route");
}

#[test]
fn real_guides_categorized() {
    let (store, _index) = ingested();
    let cats = content_core::categories::categories_with_counts(&store).unwrap();
    let vc = cats.iter().find(|c| c.slug == "version-control").unwrap();
    assert_eq!(vc.count, 4, "the Git track guides should be in version-control");
    let (_cat, guides) = content_core::categories::category_with_guides(&store, "version-control").unwrap().unwrap();
    let slugs: Vec<&str> = guides.iter().map(|g| g.slug.as_str()).collect();
    assert!(slugs.contains(&"git-explained-like-a-human"), "flagship guide present");
    assert!(slugs.contains(&"git-from-zero"), "from-zero guide present");
    assert!(slugs.contains(&"git-with-other-people"), "team guide present");
    assert!(slugs.contains(&"git-disaster-recovery"), "recovery guide present");
}
