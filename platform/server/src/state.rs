use std::collections::HashMap;
use std::net::IpAddr;
use std::path::Path;
use std::sync::Mutex;
use std::time::Instant;
use content_core::ingest::{html_to_text, ingest_dir};
use content_core::store::Store;
use content_core::index::SearchIndex;

/// Shared application state: the SQLite store (behind a mutex — rusqlite is !Sync),
/// the Tantivy index (Send + Sync), the admin password hash, and a login rate-limit map.
pub struct AppState {
    pub store: Mutex<Store>,
    pub index: SearchIndex,
    pub admin_hash: Option<String>,
    pub login_attempts: Mutex<HashMap<IpAddr, (u32, Instant)>>,
}

impl AppState {
    /// In-memory build by ingesting `repo_root` — used by tests and the legacy path.
    pub fn build(repo_root: &Path) -> Result<Self, Box<dyn std::error::Error>> {
        let store = Store::open_in_memory()?;
        let index = SearchIndex::create_in_ram()?;
        ingest_dir(repo_root, &store, &index)?;
        Ok(Self::wrap(store, index))
    }

    /// Persistent build: open the on-disk DB, import Markdown once if empty, rebuild the index.
    pub fn build_persistent(db_path: &Path, content_root: Option<&Path>) -> Result<Self, Box<dyn std::error::Error>> {
        let store = Store::open(db_path)?;
        content_core::categories::seed_categories(&store)?;
        let index = SearchIndex::create_in_ram()?;
        let imported = if store.list_all_guides()?.is_empty() {
            match content_root {
                Some(root) => { ingest_dir(root, &store, &index)?; true }
                None => false,
            }
        } else {
            false
        };
        let me = Self::wrap(store, index);
        if !imported {
            me.rebuild_index()?; // DB already had content: the fresh in-RAM index needs filling
        }
        Ok(me)
    }

    fn wrap(store: Store, index: SearchIndex) -> Self {
        Self {
            store: Mutex::new(store),
            index,
            admin_hash: std::env::var("ADMIN_PASSWORD_HASH").ok().filter(|s| !s.is_empty()),
            login_attempts: Mutex::new(HashMap::new()),
        }
    }

    /// Inject an admin password hash (used by tests; production reads the env in `wrap`).
    pub fn with_admin_hash(mut self, hash: Option<String>) -> Self {
        self.admin_hash = hash;
        self
    }

    /// Rebuild the whole search index from the DB (published phases only).
    pub fn rebuild_index(&self) -> Result<(), Box<dyn std::error::Error>> {
        let store = self.store.lock().unwrap();
        let mut w = self.index.writer()?;
        for g in store.list_guides()? {
            for pref in store.list_phase_refs(&g.slug)? {
                if let Some(p) = store.get_phase(&g.slug, pref.phase_no)? {
                    w.add_phase(&p, &format!("{} {}", p.summary, html_to_text(&p.html)))?;
                }
            }
        }
        w.commit()?;
        Ok(())
    }

    /// Re-index a single guide after a content change (drops then re-adds if published).
    pub fn reindex_guide(&self, slug: &str) -> Result<(), Box<dyn std::error::Error>> {
        let store = self.store.lock().unwrap();
        let mut w = self.index.writer()?;
        w.delete_guide(slug);
        if store.guide_status(slug).unwrap_or_default() == "published" {
            for pref in store.list_phase_refs(slug)? {
                if let Some(p) = store.get_phase(slug, pref.phase_no)? {
                    w.add_phase(&p, &format!("{} {}", p.summary, html_to_text(&p.html)))?;
                }
            }
        }
        w.commit()?;
        Ok(())
    }
}
