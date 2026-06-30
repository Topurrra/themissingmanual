use serde::{Deserialize, Serialize};

/// One reader-feedback entry (👍/👎 + optional note) for the admin inbox.
#[derive(Debug, Clone, Serialize)]
pub struct FeedbackRow {
    pub ts: String,
    pub guide_slug: String,
    pub phase_no: i64,
    pub vote: String,
    pub note: String,
}

/// Lightweight entry for the phase edit-history list.
#[derive(Debug, Clone, Serialize)]
pub struct RevisionMeta {
    pub id: i64,
    pub created_at: String,
    pub title: String,
}

/// A full stored snapshot of a phase (for diff + revert).
#[derive(Debug, Clone, Serialize)]
pub struct PhaseRevision {
    pub id: i64,
    pub guide_slug: String,
    pub phase_no: i64,
    pub created_at: String,
    pub title: String,
    pub summary: String,
    pub markdown: String,
}

/// One bad reference found by the link/asset audit (`from` = "<guide>/<phase>").
#[derive(Debug, Clone, Serialize)]
pub struct BrokenRef {
    pub from: String,
    pub href: String,
}

/// Result of the broken-link / orphaned-asset audit.
#[derive(Debug, Clone, Serialize, Default)]
pub struct LinkReport {
    pub broken_links: Vec<BrokenRef>,
    pub missing_assets: Vec<BrokenRef>,
    pub orphaned_assets: Vec<String>,
}

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
    #[serde(default)]
    pub category: Option<String>,
    /// Sidebar/listing order within a category (lower = earlier; default 0). Set on `_guide.md`.
    #[serde(default)]
    pub order: i64,
    /// Optional sub-group within a category for sidebar nesting (e.g. a language like
    /// "Java" under Frameworks). Set on `_guide.md`; absent = ungrouped (rendered flat).
    #[serde(default)]
    pub group: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
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
    #[serde(default)]
    pub markdown: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct GuideSummary {
    pub slug: String,
    pub title: String,
    pub summary: String,
    pub category: String,
    pub difficulty: String,
    #[serde(default)]
    pub status: String,
    /// Optional sub-group within the category for sidebar nesting (e.g. "Java"). None = ungrouped.
    #[serde(default)]
    pub group: Option<String>,
    /// Most recent `updated` across the guide's phases (ISO date), for recency sorting. "" if none.
    #[serde(default)]
    pub updated: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct PhaseRef {
    pub phase_no: u32,
    pub title: String,
    pub summary: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct CategoryRow {
    pub slug: String,
    pub name: String,
    pub icon: String,
    pub blurb: String,
    pub sort_order: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct SearchHit {
    pub guide_slug: String,
    pub phase_no: u32,
    pub title: String,
    pub summary: String,
    /// Highlighted passage from the body showing why this matched (HTML with `<b>` marks).
    #[serde(default)]
    pub snippet: String,
    pub score: f32,
}

/// Search response: the ranked hits plus an optional "did you mean" correction.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResults {
    pub hits: Vec<SearchHit>,
    pub suggestion: Option<String>,
}
