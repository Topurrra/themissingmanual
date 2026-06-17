use std::path::Path;
use std::sync::Mutex;
use content_core::ingest::ingest_dir;
use content_core::store::Store;
use content_core::index::SearchIndex;

/// Shared application state: the SQLite store (behind a mutex — rusqlite is !Sync)
/// and the Tantivy index (already Send + Sync).
pub struct AppState {
    pub store: Mutex<Store>,
    pub index: SearchIndex,
}

impl AppState {
    /// Build state by ingesting the guides under `repo_root` into memory.
    pub fn build(repo_root: &Path) -> Result<Self, Box<dyn std::error::Error>> {
        let store = Store::open_in_memory()?;
        let index = SearchIndex::create_in_ram()?;
        ingest_dir(repo_root, &store, &index)?;
        Ok(Self { store: Mutex::new(store), index })
    }
}
