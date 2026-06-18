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
    /// Max stored asset size in bytes (`ASSET_MAX_BYTES`, default 5 MiB).
    pub asset_max: usize,
    /// Optional shared secret for `/api/events` (`BEACON_KEY`); None = open.
    pub beacon_key: Option<String>,
    /// Mark the session cookie `Secure` (`COOKIE_SECURE=1`, for HTTPS prod).
    pub cookie_secure: bool,
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
            asset_max: std::env::var("ASSET_MAX_BYTES")
                .ok()
                .and_then(|s| s.parse().ok())
                .filter(|&n| n > 0)
                .unwrap_or(5 * 1024 * 1024),
            beacon_key: std::env::var("BEACON_KEY").ok().filter(|s| !s.is_empty()),
            cookie_secure: matches!(std::env::var("COOKIE_SECURE").as_deref(), Ok("1") | Ok("true")),
        }
    }

    /// Inject an admin password hash (used by tests; production reads the env in `wrap`).
    pub fn with_admin_hash(mut self, hash: Option<String>) -> Self {
        self.admin_hash = hash;
        self
    }

    /// Inject a beacon key (tests; production reads `BEACON_KEY` in `wrap`).
    pub fn with_beacon_key(mut self, key: Option<String>) -> Self {
        self.beacon_key = key;
        self
    }

    /// Inject the max asset size (tests; production reads `ASSET_MAX_BYTES` in `wrap`).
    pub fn with_asset_max(mut self, n: usize) -> Self {
        self.asset_max = n;
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

    /// Periodic upkeep: prune old analytics events and purge expired sessions.
    /// Retention is `EVENTS_RETENTION_DAYS` (default 365).
    pub fn maintenance(&self) -> Result<(), Box<dyn std::error::Error>> {
        let retain: i64 = std::env::var("EVENTS_RETENTION_DAYS")
            .ok()
            .and_then(|s| s.parse().ok())
            .filter(|&d| d > 0)
            .unwrap_or(365);
        let store = self.store.lock().unwrap();
        store.prune_events(retain)?;
        store.purge_expired_sessions()?;
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
