use serde::{Deserialize, Serialize};

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
