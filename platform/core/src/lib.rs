//! content-core: ingest Markdown guides into SQLite + Tantivy and search them.

pub mod models;
pub mod frontmatter;
pub mod render;
pub mod links;
pub mod store;
pub mod index;
pub mod ingest;
pub mod categories;
pub mod audit;
pub mod mermaid_ssr;

pub use models::{Frontmatter, GuideSummary, Phase, PhaseRef, SearchHit};
pub use categories::Category;
