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
