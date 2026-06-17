//! content-core: ingest Markdown guides into SQLite + Tantivy and search them.

pub mod models;
pub mod frontmatter;
pub mod render;
pub mod store;
pub mod index;
pub mod ingest;

pub use models::{Frontmatter, GuideSummary, Phase, SearchHit};
