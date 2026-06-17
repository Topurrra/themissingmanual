//! content-core: ingest Markdown guides into SQLite + Tantivy and search them.

pub mod models;
pub mod frontmatter;
pub mod render;

pub use models::{Frontmatter, GuideSummary, Phase, SearchHit};
