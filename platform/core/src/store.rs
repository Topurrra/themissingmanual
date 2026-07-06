use rusqlite::{params, Connection};
use crate::models::{CategoryRow, FeedbackRow, GuideSummary, Phase, PhaseRef, PhaseRevision, RevisionMeta};

pub struct Store {
    conn: Connection,
}

#[derive(thiserror::Error, Debug)]
pub enum StoreError {
    #[error(transparent)]
    Sqlite(#[from] rusqlite::Error),
    #[error(transparent)]
    Json(#[from] serde_json::Error),
}

impl Store {
    pub fn open_in_memory() -> Result<Self, StoreError> {
        Self::from_conn(Connection::open_in_memory()?)
    }

    pub fn open(path: &std::path::Path) -> Result<Self, StoreError> {
        Self::from_conn(Connection::open(path)?)
    }

    fn from_conn(conn: Connection) -> Result<Self, StoreError> {
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS guides (
                 slug TEXT PRIMARY KEY,
                 title TEXT NOT NULL,
                 summary TEXT NOT NULL,
                 category TEXT NOT NULL DEFAULT '',
                 difficulty TEXT NOT NULL DEFAULT ''
             );
             CREATE TABLE IF NOT EXISTS phases (
                 guide_slug TEXT NOT NULL,
                 phase_no INTEGER NOT NULL,
                 title TEXT NOT NULL,
                 summary TEXT NOT NULL,
                 tags_json TEXT NOT NULL,
                 difficulty TEXT NOT NULL,
                 synonyms_json TEXT NOT NULL,
                 html TEXT NOT NULL,
                 updated TEXT NOT NULL,
                 PRIMARY KEY (guide_slug, phase_no)
             );",
        )?;
        // Additive migrations (ignore "duplicate column name" on re-open).
        for stmt in [
            "ALTER TABLE guides ADD COLUMN status TEXT NOT NULL DEFAULT 'published'",
            "ALTER TABLE guides ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0",
            "ALTER TABLE guides ADD COLUMN created_at TEXT NOT NULL DEFAULT (datetime('now'))",
            "ALTER TABLE guides ADD COLUMN updated_at TEXT NOT NULL DEFAULT (datetime('now'))",
            "ALTER TABLE guides ADD COLUMN group_name TEXT NOT NULL DEFAULT ''",
            "ALTER TABLE phases ADD COLUMN markdown TEXT NOT NULL DEFAULT ''",
        ] {
            let _ = conn.execute(stmt, []);
        }
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS categories (
                 slug TEXT PRIMARY KEY,
                 name TEXT NOT NULL,
                 icon TEXT NOT NULL,
                 blurb TEXT NOT NULL,
                 sort_order INTEGER NOT NULL DEFAULT 0
             );
             CREATE TABLE IF NOT EXISTS assets (
                 id TEXT PRIMARY KEY,
                 filename TEXT,
                 mime TEXT NOT NULL,
                 bytes BLOB NOT NULL,
                 created_at TEXT NOT NULL DEFAULT (datetime('now'))
             );
             CREATE TABLE IF NOT EXISTS sessions (
                 id TEXT PRIMARY KEY,
                 created_at TEXT NOT NULL DEFAULT (datetime('now')),
                 expires_at TEXT NOT NULL
             );
             CREATE TABLE IF NOT EXISTS events (
                 ts TEXT NOT NULL DEFAULT (datetime('now')),
                 kind TEXT NOT NULL,
                 path TEXT NOT NULL,
                 referrer TEXT,
                 visitor TEXT NOT NULL,
                 query TEXT,
                 device TEXT NOT NULL DEFAULT '',
                 source TEXT NOT NULL DEFAULT ''
             );
             CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts);
             CREATE TABLE IF NOT EXISTS settings (
                 key TEXT PRIMARY KEY,
                 value TEXT NOT NULL
             );
             CREATE TABLE IF NOT EXISTS feedback (
                 ts TEXT NOT NULL DEFAULT (datetime('now')),
                 guide_slug TEXT NOT NULL,
                 phase_no INTEGER NOT NULL,
                 vote TEXT NOT NULL,
                 note TEXT NOT NULL DEFAULT '',
                 visitor TEXT NOT NULL DEFAULT ''
             );
             CREATE INDEX IF NOT EXISTS idx_feedback_ts ON feedback(ts);
             CREATE TABLE IF NOT EXISTS backlog_votes (
                 item_key TEXT PRIMARY KEY,
                 votes INTEGER NOT NULL DEFAULT 0
             );
             CREATE TABLE IF NOT EXISTS phase_revisions (
                 id INTEGER PRIMARY KEY AUTOINCREMENT,
                 guide_slug TEXT NOT NULL,
                 phase_no INTEGER NOT NULL,
                 title TEXT NOT NULL,
                 summary TEXT NOT NULL,
                 markdown TEXT NOT NULL,
                 created_at TEXT NOT NULL DEFAULT (datetime('now'))
             );
             CREATE INDEX IF NOT EXISTS idx_revisions_phase ON phase_revisions(guide_slug, phase_no);",
        )?;
        // Additive migrations for pre-existing events tables (no-op once present).
        let _ = conn.execute("ALTER TABLE events ADD COLUMN device TEXT NOT NULL DEFAULT ''", []);
        let _ = conn.execute("ALTER TABLE events ADD COLUMN source TEXT NOT NULL DEFAULT ''", []);
        Ok(Self { conn })
    }

    pub fn upsert_guide(&self, slug: &str, title: &str, summary: &str, category: &str, difficulty: &str) -> Result<(), StoreError> {
        self.conn.execute(
            "INSERT INTO guides (slug, title, summary, category, difficulty) VALUES (?1, ?2, ?3, ?4, ?5)
             ON CONFLICT(slug) DO UPDATE SET title=?2, summary=?3, category=?4, difficulty=?5",
            params![slug, title, summary, category, difficulty],
        )?;
        Ok(())
    }

    /// Set a guide's sub-group (e.g. a language under Frameworks). Empty string = ungrouped.
    pub fn set_guide_group(&self, slug: &str, group: &str) -> Result<(), StoreError> {
        self.conn.execute("UPDATE guides SET group_name=?2 WHERE slug=?1", params![slug, group])?;
        Ok(())
    }

    pub fn upsert_phase(&self, p: &Phase) -> Result<(), StoreError> {
        let tags = serde_json::to_string(&p.tags)?;
        let syns = serde_json::to_string(&p.synonyms)?;
        self.conn.execute(
            "INSERT INTO phases
               (guide_slug, phase_no, title, summary, tags_json, difficulty, synonyms_json, html, updated, markdown)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
             ON CONFLICT(guide_slug, phase_no) DO UPDATE SET
               title=?3, summary=?4, tags_json=?5, difficulty=?6, synonyms_json=?7, html=?8, updated=?9, markdown=?10",
            params![p.guide_slug, p.phase_no, p.title, p.summary, tags, p.difficulty, syns, p.html, p.updated, p.markdown],
        )?;
        Ok(())
    }

    pub fn get_phase(&self, guide_slug: &str, phase_no: u32) -> Result<Option<Phase>, StoreError> {
        let mut stmt = self.conn.prepare(
            "SELECT guide_slug, phase_no, title, summary, tags_json, difficulty, synonyms_json, html, updated, markdown
             FROM phases WHERE guide_slug = ?1 AND phase_no = ?2",
        )?;
        let mut rows = stmt.query(params![guide_slug, phase_no])?;
        match rows.next()? {
            Some(row) => Ok(Some(Phase {
                guide_slug: row.get(0)?,
                phase_no: row.get(1)?,
                title: row.get(2)?,
                summary: row.get(3)?,
                tags: serde_json::from_str(&row.get::<_, String>(4)?)?,
                difficulty: row.get(5)?,
                synonyms: serde_json::from_str(&row.get::<_, String>(6)?)?,
                html: row.get(7)?,
                updated: row.get(8)?,
                markdown: row.get(9)?,
            })),
            None => Ok(None),
        }
    }

    pub fn list_guides(&self) -> Result<Vec<GuideSummary>, StoreError> {
        let mut stmt = self.conn.prepare(
            "SELECT slug, title, summary, category, difficulty, status, group_name, (SELECT MAX(updated) FROM phases WHERE phases.guide_slug = guides.slug) FROM guides WHERE status='published' ORDER BY sort_order, slug",
        )?;
        let rows = stmt.query_map([], Self::row_to_guide)?;
        Ok(rows.collect::<Result<Vec<_>, _>>()?)
    }

    /// Admin listing: every guide regardless of status.
    pub fn list_all_guides(&self) -> Result<Vec<GuideSummary>, StoreError> {
        let mut stmt = self.conn.prepare(
            "SELECT slug, title, summary, category, difficulty, status, group_name, (SELECT MAX(updated) FROM phases WHERE phases.guide_slug = guides.slug) FROM guides ORDER BY sort_order, slug",
        )?;
        let rows = stmt.query_map([], Self::row_to_guide)?;
        Ok(rows.collect::<Result<Vec<_>, _>>()?)
    }

    pub fn get_guide(&self, slug: &str) -> Result<Option<GuideSummary>, StoreError> {
        self.get_guide_inner(slug, true)
    }

    /// Admin fetch: returns the guide even if it's a draft.
    pub fn get_guide_any_status(&self, slug: &str) -> Result<Option<GuideSummary>, StoreError> {
        self.get_guide_inner(slug, false)
    }

    fn get_guide_inner(&self, slug: &str, published_only: bool) -> Result<Option<GuideSummary>, StoreError> {
        let sql = if published_only {
            "SELECT slug, title, summary, category, difficulty, status, group_name, (SELECT MAX(updated) FROM phases WHERE phases.guide_slug = guides.slug) FROM guides WHERE slug = ?1 AND status='published'"
        } else {
            "SELECT slug, title, summary, category, difficulty, status, group_name, (SELECT MAX(updated) FROM phases WHERE phases.guide_slug = guides.slug) FROM guides WHERE slug = ?1"
        };
        let mut stmt = self.conn.prepare(sql)?;
        let mut rows = stmt.query(params![slug])?;
        match rows.next()? {
            Some(row) => Ok(Some(Self::row_to_guide(row)?)),
            None => Ok(None),
        }
    }

    pub fn guides_for_category(&self, category: &str) -> Result<Vec<GuideSummary>, StoreError> {
        let mut stmt = self.conn.prepare(
            "SELECT slug, title, summary, category, difficulty, status, group_name, (SELECT MAX(updated) FROM phases WHERE phases.guide_slug = guides.slug) FROM guides WHERE category = ?1 AND status='published' ORDER BY sort_order, title",
        )?;
        let rows = stmt.query_map(params![category], Self::row_to_guide)?;
        Ok(rows.collect::<Result<Vec<_>, _>>()?)
    }

    fn row_to_guide(row: &rusqlite::Row) -> rusqlite::Result<GuideSummary> {
        Ok(GuideSummary {
            slug: row.get(0)?,
            title: row.get(1)?,
            summary: row.get(2)?,
            category: row.get(3)?,
            difficulty: row.get(4)?,
            status: row.get(5)?,
            group: {
                let g: String = row.get(6)?;
                if g.is_empty() { None } else { Some(g) }
            },
            updated: row.get::<_, Option<String>>(7)?.unwrap_or_default(),
        })
    }

    pub fn list_phase_refs(&self, guide_slug: &str) -> Result<Vec<PhaseRef>, StoreError> {
        let mut stmt = self.conn.prepare(
            "SELECT phase_no, title, summary FROM phases WHERE guide_slug = ?1 ORDER BY phase_no",
        )?;
        let rows = stmt.query_map(params![guide_slug], |row| {
            Ok(PhaseRef {
                phase_no: row.get::<_, i64>(0)? as u32,
                title: row.get(1)?,
                summary: row.get(2)?,
            })
        })?;
        Ok(rows.collect::<Result<Vec<_>, _>>()?)
    }

    // ===== CMS additions (B1) =====

    pub fn set_guide_status(&self, slug: &str, status: &str) -> Result<(), StoreError> {
        self.conn.execute(
            "UPDATE guides SET status=?2, updated_at=datetime('now') WHERE slug=?1",
            params![slug, status],
        )?;
        Ok(())
    }

    pub fn set_guide_sort_order(&self, slug: &str, order: i64) -> Result<(), StoreError> {
        self.conn.execute("UPDATE guides SET sort_order=?2 WHERE slug=?1", params![slug, order])?;
        Ok(())
    }

    /// Persist a drag-reorder: set each guide's `sort_order` to its index in `slugs`
    /// (caller passes one category's guides in the desired order).
    pub fn reorder_guides(&self, slugs: &[String]) -> Result<(), StoreError> {
        for (i, s) in slugs.iter().enumerate() {
            self.conn.execute("UPDATE guides SET sort_order=?2 WHERE slug=?1", params![s, i as i64])?;
        }
        Ok(())
    }

    pub fn guide_status(&self, slug: &str) -> Result<String, StoreError> {
        Ok(self
            .conn
            .query_row("SELECT status FROM guides WHERE slug=?1", params![slug], |r| r.get(0))?)
    }

    pub fn update_guide_meta(&self, slug: &str, title: &str, summary: &str, category: &str, difficulty: &str) -> Result<(), StoreError> {
        self.conn.execute(
            "UPDATE guides SET title=?2, summary=?3, category=?4, difficulty=?5, updated_at=datetime('now') WHERE slug=?1",
            params![slug, title, summary, category, difficulty],
        )?;
        Ok(())
    }

    pub fn delete_guide_row(&self, slug: &str) -> Result<(), StoreError> {
        self.conn.execute("DELETE FROM phases WHERE guide_slug=?1", params![slug])?;
        self.conn.execute("DELETE FROM guides WHERE slug=?1", params![slug])?;
        Ok(())
    }

    /// Set just a guide's category (used by bulk recategorize).
    pub fn set_guide_category(&self, slug: &str, category: &str) -> Result<(), StoreError> {
        self.conn.execute(
            "UPDATE guides SET category=?2, updated_at=datetime('now') WHERE slug=?1",
            params![slug, category],
        )?;
        Ok(())
    }

    /// Set just a guide's difficulty (used by bulk difficulty change).
    pub fn set_guide_difficulty(&self, slug: &str, difficulty: &str) -> Result<(), StoreError> {
        self.conn.execute(
            "UPDATE guides SET difficulty=?2, updated_at=datetime('now') WHERE slug=?1",
            params![slug, difficulty],
        )?;
        Ok(())
    }

    pub fn delete_phase(&self, slug: &str, phase_no: u32) -> Result<(), StoreError> {
        self.conn.execute(
            "DELETE FROM phases WHERE guide_slug=?1 AND phase_no=?2",
            params![slug, phase_no],
        )?;
        Ok(())
    }

    pub fn next_phase_no(&self, slug: &str) -> Result<u32, StoreError> {
        let max: Option<i64> = self.conn.query_row(
            "SELECT MAX(phase_no) FROM phases WHERE guide_slug=?1",
            params![slug],
            |r| r.get(0),
        )?;
        Ok(max.map(|m| (m + 1) as u32).unwrap_or(0))
    }

    /// Remap phase numbers to the given order (two-pass to avoid PK collisions).
    pub fn reorder_phases(&self, slug: &str, order: &[u32]) -> Result<(), StoreError> {
        for (i, no) in order.iter().enumerate() {
            self.conn.execute(
                "UPDATE phases SET phase_no=?3 WHERE guide_slug=?1 AND phase_no=?2",
                params![slug, no, 100_000 + i as i64],
            )?;
        }
        for i in 0..order.len() {
            self.conn.execute(
                "UPDATE phases SET phase_no=?3 WHERE guide_slug=?1 AND phase_no=?2",
                params![slug, 100_000 + i as i64, i as i64],
            )?;
        }
        Ok(())
    }

    // ---- categories ----

    pub fn list_categories_rows(&self) -> Result<Vec<CategoryRow>, StoreError> {
        let mut stmt = self.conn.prepare(
            "SELECT slug, name, icon, blurb, sort_order FROM categories ORDER BY sort_order, name",
        )?;
        let rows = stmt.query_map([], |r| {
            Ok(CategoryRow {
                slug: r.get(0)?,
                name: r.get(1)?,
                icon: r.get(2)?,
                blurb: r.get(3)?,
                sort_order: r.get(4)?,
            })
        })?;
        Ok(rows.collect::<Result<Vec<_>, _>>()?)
    }

    pub fn upsert_category(&self, c: &CategoryRow) -> Result<(), StoreError> {
        self.conn.execute(
            "INSERT INTO categories (slug, name, icon, blurb, sort_order) VALUES (?1,?2,?3,?4,?5)
             ON CONFLICT(slug) DO UPDATE SET name=?2, icon=?3, blurb=?4, sort_order=?5",
            params![c.slug, c.name, c.icon, c.blurb, c.sort_order],
        )?;
        Ok(())
    }

    pub fn delete_category(&self, slug: &str) -> Result<(), StoreError> {
        self.conn.execute("DELETE FROM categories WHERE slug=?1", params![slug])?;
        Ok(())
    }

    pub fn reorder_categories(&self, slugs: &[String]) -> Result<(), StoreError> {
        for (i, s) in slugs.iter().enumerate() {
            self.conn.execute(
                "UPDATE categories SET sort_order=?2 WHERE slug=?1",
                params![s, i as i64],
            )?;
        }
        Ok(())
    }

    pub fn categories_count(&self) -> Result<i64, StoreError> {
        Ok(self.conn.query_row("SELECT COUNT(*) FROM categories", [], |r| r.get(0))?)
    }

    pub fn count_guides_in_category(&self, slug: &str) -> Result<i64, StoreError> {
        Ok(self.conn.query_row(
            "SELECT COUNT(*) FROM guides WHERE category=?1",
            params![slug],
            |r| r.get(0),
        )?)
    }

    pub fn count_published_in_category(&self, slug: &str) -> Result<i64, StoreError> {
        Ok(self.conn.query_row(
            "SELECT COUNT(*) FROM guides WHERE category=?1 AND status='published'",
            params![slug],
            |r| r.get(0),
        )?)
    }

    // ---- assets ----

    pub fn insert_asset(&self, id: &str, filename: &str, mime: &str, bytes: &[u8]) -> Result<(), StoreError> {
        self.conn.execute(
            "INSERT INTO assets (id, filename, mime, bytes) VALUES (?1,?2,?3,?4)",
            params![id, filename, mime, bytes],
        )?;
        Ok(())
    }

    /// Delete a stored asset by id. Returns the number of rows removed (0 if it didn't exist).
    pub fn delete_asset(&self, id: &str) -> Result<usize, StoreError> {
        Ok(self.conn.execute("DELETE FROM assets WHERE id=?1", params![id])?)
    }

    pub fn get_asset(&self, id: &str) -> Result<Option<(String, String, Vec<u8>)>, StoreError> {
        let mut stmt = self.conn.prepare("SELECT mime, filename, bytes FROM assets WHERE id=?1")?;
        let mut rows = stmt.query(params![id])?;
        match rows.next()? {
            Some(row) => Ok(Some((
                row.get(0)?,
                row.get::<_, Option<String>>(1)?.unwrap_or_default(),
                row.get(2)?,
            ))),
            None => Ok(None),
        }
    }

    // ---- sessions ----

    pub fn create_session(&self, id: &str) -> Result<(), StoreError> {
        self.conn.execute(
            "INSERT INTO sessions (id, expires_at) VALUES (?1, datetime('now','+30 days'))",
            params![id],
        )?;
        Ok(())
    }

    pub fn session_valid(&self, id: &str) -> Result<bool, StoreError> {
        let n: i64 = self.conn.query_row(
            "SELECT COUNT(*) FROM sessions WHERE id=?1 AND expires_at > datetime('now')",
            params![id],
            |r| r.get(0),
        )?;
        Ok(n > 0)
    }

    pub fn delete_session(&self, id: &str) -> Result<(), StoreError> {
        self.conn.execute("DELETE FROM sessions WHERE id=?1", params![id])?;
        Ok(())
    }

    pub fn purge_expired_sessions(&self) -> Result<(), StoreError> {
        self.conn.execute("DELETE FROM sessions WHERE expires_at <= datetime('now')", [])?;
        Ok(())
    }

    // ---- settings (generic key/value) ----

    pub fn get_setting(&self, key: &str) -> Result<Option<String>, StoreError> {
        match self.conn.query_row("SELECT value FROM settings WHERE key=?1", params![key], |r| r.get::<_, String>(0)) {
            Ok(v) => Ok(Some(v)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e.into()),
        }
    }

    pub fn set_setting(&self, key: &str, value: &str) -> Result<(), StoreError> {
        self.conn.execute(
            "INSERT INTO settings (key, value) VALUES (?1, ?2) ON CONFLICT(key) DO UPDATE SET value=?2",
            params![key, value],
        )?;
        Ok(())
    }

    /// Total size of the SQLite database file in bytes (for the admin status panel).
    pub fn db_size_bytes(&self) -> Result<i64, StoreError> {
        let pages: i64 = self.conn.query_row("PRAGMA page_count", [], |r| r.get(0))?;
        let page_size: i64 = self.conn.query_row("PRAGMA page_size", [], |r| r.get(0))?;
        Ok(pages * page_size)
    }

    // ---- reader feedback ----

    /// Record one reader 👍/👎 (with optional note) on a guide phase.
    pub fn insert_feedback(&self, guide_slug: &str, phase_no: i64, vote: &str, note: &str, visitor: &str) -> Result<(), StoreError> {
        self.conn.execute(
            "INSERT INTO feedback (guide_slug, phase_no, vote, note, visitor) VALUES (?1,?2,?3,?4,?5)",
            params![guide_slug, phase_no, vote, note, visitor],
        )?;
        Ok(())
    }

    /// Most recent feedback entries for the admin inbox (newest first).
    pub fn list_feedback(&self, limit: i64) -> Result<Vec<FeedbackRow>, StoreError> {
        let mut stmt = self.conn.prepare(
            "SELECT ts, guide_slug, phase_no, vote, note FROM feedback ORDER BY ts DESC LIMIT ?1",
        )?;
        let rows = stmt.query_map(params![limit], |r| {
            Ok(FeedbackRow {
                ts: r.get(0)?,
                guide_slug: r.get(1)?,
                phase_no: r.get(2)?,
                vote: r.get(3)?,
                note: r.get(4)?,
            })
        })?;
        Ok(rows.collect::<Result<Vec<_>, _>>()?)
    }

    /// Reader-submitted "guide requests" (feedback rows sent from /request, tagged with the
    /// guide_slug sentinel) - the public backlog page's second signal, alongside failed searches.
    pub fn list_guide_requests(&self, limit: i64) -> Result<Vec<crate::models::GuideRequest>, StoreError> {
        let mut stmt = self.conn.prepare(
            "SELECT rowid, ts, note FROM feedback WHERE guide_slug = 'guide-request' ORDER BY ts DESC LIMIT ?1",
        )?;
        let rows = stmt.query_map(params![limit], |r| {
            Ok(crate::models::GuideRequest { id: r.get(0)?, ts: r.get(1)?, note: r.get(2)? })
        })?;
        Ok(rows.collect::<Result<Vec<_>, _>>()?)
    }

    // ---- public backlog voting (no accounts - one counter per item key) ----

    /// +1 a backlog item's vote count (upsert), returns the new total. `key` is either
    /// `q:<search query>` or `r:<guide-request rowid>` - see admin::public_backlog.
    pub fn bump_backlog_vote(&self, key: &str) -> Result<i64, StoreError> {
        self.conn.execute(
            "INSERT INTO backlog_votes (item_key, votes) VALUES (?1, 1)
             ON CONFLICT(item_key) DO UPDATE SET votes = votes + 1",
            params![key],
        )?;
        let votes: i64 = self.conn.query_row(
            "SELECT votes FROM backlog_votes WHERE item_key = ?1",
            params![key],
            |r| r.get(0),
        )?;
        Ok(votes)
    }

    /// Current vote counts for every item key that has at least one vote.
    pub fn all_backlog_votes(&self) -> Result<std::collections::HashMap<String, i64>, StoreError> {
        let mut stmt = self.conn.prepare("SELECT item_key, votes FROM backlog_votes")?;
        let rows = stmt.query_map([], |r| Ok((r.get::<_, String>(0)?, r.get::<_, i64>(1)?)))?;
        Ok(rows.collect::<Result<std::collections::HashMap<_, _>, _>>()?)
    }

    // ---- phase edit history (versioning + revert) ----

    /// Snapshot a phase's content into the history. Called from the admin edit path only -
    /// never from ingest, so a boot re-import doesn't flood the history.
    pub fn insert_phase_revision(&self, guide_slug: &str, phase_no: i64, title: &str, summary: &str, markdown: &str) -> Result<(), StoreError> {
        self.conn.execute(
            "INSERT INTO phase_revisions (guide_slug, phase_no, title, summary, markdown) VALUES (?1,?2,?3,?4,?5)",
            params![guide_slug, phase_no, title, summary, markdown],
        )?;
        Ok(())
    }

    /// History entries for one phase, newest first (id + timestamp + title for the list).
    pub fn list_phase_revisions(&self, guide_slug: &str, phase_no: i64) -> Result<Vec<RevisionMeta>, StoreError> {
        let mut stmt = self.conn.prepare(
            "SELECT id, created_at, title FROM phase_revisions WHERE guide_slug=?1 AND phase_no=?2 ORDER BY id DESC",
        )?;
        let rows = stmt.query_map(params![guide_slug, phase_no], |r| {
            Ok(RevisionMeta { id: r.get(0)?, created_at: r.get(1)?, title: r.get(2)? })
        })?;
        Ok(rows.collect::<Result<Vec<_>, _>>()?)
    }

    /// One full revision by id (for diff + revert).
    pub fn get_phase_revision(&self, id: i64) -> Result<Option<PhaseRevision>, StoreError> {
        let mut stmt = self.conn.prepare(
            "SELECT id, guide_slug, phase_no, created_at, title, summary, markdown FROM phase_revisions WHERE id=?1",
        )?;
        let mut rows = stmt.query(params![id])?;
        match rows.next()? {
            Some(r) => Ok(Some(PhaseRevision {
                id: r.get(0)?,
                guide_slug: r.get(1)?,
                phase_no: r.get(2)?,
                created_at: r.get(3)?,
                title: r.get(4)?,
                summary: r.get(5)?,
                markdown: r.get(6)?,
            })),
            None => Ok(None),
        }
    }

    /// All stored asset ids (for the orphaned-asset audit).
    pub fn list_asset_ids(&self) -> Result<Vec<String>, StoreError> {
        let mut stmt = self.conn.prepare("SELECT id FROM assets")?;
        let rows = stmt.query_map([], |r| r.get::<_, String>(0))?;
        Ok(rows.collect::<Result<Vec<_>, _>>()?)
    }

    // ---- admin credential (single admin; the DB is the runtime source of truth) ----

    /// The stored argon2 admin password hash, or None if no admin has been created yet.
    pub fn get_admin_hash(&self) -> Result<Option<String>, StoreError> {
        self.get_setting("admin_password_hash")
    }

    /// Create or replace the admin password hash.
    pub fn set_admin_hash(&self, hash: &str) -> Result<(), StoreError> {
        self.set_setting("admin_password_hash", hash)
    }

    // ---- analytics ----

    pub fn record_event(&self, kind: &str, path: &str, referrer: &str, visitor: &str, query: &str, device: &str, source: &str) -> Result<(), StoreError> {
        self.conn.execute(
            "INSERT INTO events (kind, path, referrer, visitor, query, device, source) VALUES (?1,?2,?3,?4,?5,?6,?7)",
            params![kind, path, referrer, visitor, query, device, source],
        )?;
        Ok(())
    }

    /// Delete analytics events older than `retain_days` (bounds unbounded table growth).
    /// Returns the number of rows removed.
    pub fn prune_events(&self, retain_days: i64) -> Result<usize, StoreError> {
        let cutoff = format!("-{retain_days} days");
        Ok(self
            .conn
            .execute("DELETE FROM events WHERE ts < datetime('now', ?1)", params![cutoff])?)
    }

    pub fn analytics_totals(&self, days: i64) -> Result<(i64, i64, i64), StoreError> {
        let w = format!("-{days} days");
        let views: i64 = self.conn.query_row(
            "SELECT COUNT(*) FROM events WHERE kind='pageview' AND ts>=datetime('now',?1)",
            params![w], |r| r.get(0))?;
        let uniq: i64 = self.conn.query_row(
            "SELECT COUNT(DISTINCT visitor) FROM events WHERE kind='pageview' AND ts>=datetime('now',?1)",
            params![w], |r| r.get(0))?;
        let searches: i64 = self.conn.query_row(
            "SELECT COUNT(*) FROM events WHERE kind='search' AND ts>=datetime('now',?1)",
            params![w], |r| r.get(0))?;
        Ok((views, uniq, searches))
    }

    pub fn views_per_day(&self, days: i64) -> Result<Vec<(String, i64)>, StoreError> {
        let w = format!("-{days} days");
        let mut stmt = self.conn.prepare(
            "SELECT date(ts) d, COUNT(*) FROM events WHERE kind='pageview' AND ts>=datetime('now',?1) GROUP BY d ORDER BY d")?;
        let rows = stmt.query_map(params![w], |r| Ok((r.get::<_, String>(0)?, r.get::<_, i64>(1)?)))?;
        Ok(rows.collect::<Result<Vec<_>, _>>()?)
    }

    // `col` and `where_extra` are fixed internal literals (never user input).
    fn top_by(&self, where_extra: &str, col: &str, days: i64, limit: i64) -> Result<Vec<(String, i64)>, StoreError> {
        let w = format!("-{days} days");
        let sql = format!(
            "SELECT {col} k, COUNT(*) c FROM events WHERE ts>=datetime('now',?1) {where_extra} GROUP BY k ORDER BY c DESC LIMIT ?2");
        let mut stmt = self.conn.prepare(&sql)?;
        let rows = stmt.query_map(params![w, limit], |r| Ok((r.get::<_, String>(0)?, r.get::<_, i64>(1)?)))?;
        Ok(rows.collect::<Result<Vec<_>, _>>()?)
    }

    pub fn top_paths(&self, days: i64, limit: i64) -> Result<Vec<(String, i64)>, StoreError> {
        self.top_by("AND kind='pageview'", "path", days, limit)
    }
    pub fn top_referrers(&self, days: i64, limit: i64) -> Result<Vec<(String, i64)>, StoreError> {
        self.top_by("AND referrer IS NOT NULL AND referrer<>''", "referrer", days, limit)
    }
    pub fn top_searches(&self, days: i64, limit: i64) -> Result<Vec<(String, i64)>, StoreError> {
        self.top_by("AND kind='search' AND query<>''", "query", days, limit)
    }
    pub fn top_guides(&self, days: i64, limit: i64) -> Result<Vec<(String, i64)>, StoreError> {
        self.top_by("AND kind='pageview' AND path LIKE '/guides/%'", "path", days, limit)
    }
    pub fn top_categories(&self, days: i64, limit: i64) -> Result<Vec<(String, i64)>, StoreError> {
        self.top_by("AND kind='pageview' AND path LIKE '/categories/%'", "path", days, limit)
    }
    pub fn top_devices(&self, days: i64, limit: i64) -> Result<Vec<(String, i64)>, StoreError> {
        self.top_by("AND kind='pageview' AND device<>''", "device", days, limit)
    }
    /// Tagged-link sources (utm_source) — "traffic by source" for posted campaign links.
    pub fn top_sources(&self, days: i64, limit: i64) -> Result<Vec<(String, i64)>, StoreError> {
        self.top_by("AND kind='pageview' AND source<>''", "source", days, limit)
    }
    /// Totals for the period before the current window (for trend comparison):
    /// events in [now-2*days, now-days).
    pub fn analytics_totals_prev(&self, days: i64) -> Result<(i64, i64, i64), StoreError> {
        let lo = format!("-{} days", days * 2);
        let hi = format!("-{days} days");
        let count = |kind_clause: &str| -> Result<i64, StoreError> {
            Ok(self.conn.query_row(
                &format!("SELECT COUNT(*) FROM events WHERE {kind_clause} AND ts>=datetime('now',?1) AND ts<datetime('now',?2)"),
                params![lo, hi], |r| r.get(0))?)
        };
        let views = count("kind='pageview'")?;
        let searches = count("kind='search'")?;
        let uniq: i64 = self.conn.query_row(
            "SELECT COUNT(DISTINCT visitor) FROM events WHERE kind='pageview' AND ts>=datetime('now',?1) AND ts<datetime('now',?2)",
            params![lo, hi], |r| r.get(0))?;
        Ok((views, uniq, searches))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::Phase;

    fn sample_phase() -> Phase {
        Phase {
            guide_slug: "git".into(),
            phase_no: 1,
            title: "The Mental Model".into(),
            summary: "Commits are snapshots.".into(),
            tags: vec!["git".into(), "commits".into()],
            difficulty: "beginner".into(),
            synonyms: vec!["what is a commit".into()],
            html: "<h1>Hi</h1>".into(),
            updated: "2026-06-17".into(),
            markdown: "# Hi".into(),
        }
    }

    #[test]
    fn upsert_then_read_back() {
        let store = Store::open_in_memory().unwrap();
        store.upsert_guide("git", "Git Guide", "All about git", "version-control", "beginner").unwrap();
        store.upsert_phase(&sample_phase()).unwrap();

        let got = store.get_phase("git", 1).unwrap().unwrap();
        assert_eq!(got.title, "The Mental Model");
        assert_eq!(got.tags, vec!["git", "commits"]);

        let guides = store.list_guides().unwrap();
        assert_eq!(guides.len(), 1);
        assert_eq!(guides[0].category, "version-control");
        assert_eq!(guides[0].difficulty, "beginner");
    }

    #[test]
    fn upsert_is_idempotent_on_guide_and_phase() {
        let store = Store::open_in_memory().unwrap();
        store.upsert_guide("git", "Git Guide", "x", "version-control", "beginner").unwrap();
        store.upsert_phase(&sample_phase()).unwrap();
        store.upsert_phase(&sample_phase()).unwrap(); // same (guide,phase_no)
        assert_eq!(store.list_guides().unwrap().len(), 1);
        assert!(store.get_phase("git", 1).unwrap().is_some());
    }

    #[test]
    fn get_guide_and_phase_refs() {
        let store = Store::open_in_memory().unwrap();
        store.upsert_guide("git", "Git Guide", "All about git", "version-control", "beginner").unwrap();
        store.upsert_phase(&sample_phase()).unwrap();

        let g = store.get_guide("git").unwrap().unwrap();
        assert_eq!(g.title, "Git Guide");
        assert_eq!(g.category, "version-control");
        assert!(store.get_guide("missing").unwrap().is_none());

        let refs = store.list_phase_refs("git").unwrap();
        assert_eq!(refs.len(), 1);
        assert_eq!(refs[0].phase_no, 1);
        assert_eq!(refs[0].title, "The Mental Model");
    }

    #[test]
    fn guides_for_category_filters_and_orders() {
        let store = Store::open_in_memory().unwrap();
        store.upsert_guide("git", "Git Guide", "x", "version-control", "beginner").unwrap();
        store.upsert_guide("rust", "Rust Guide", "y", "programming-languages", "advanced").unwrap();
        let vc = store.guides_for_category("version-control").unwrap();
        assert_eq!(vc.len(), 1);
        assert_eq!(vc[0].slug, "git");
        assert!(store.guides_for_category("databases").unwrap().is_empty());
    }

    #[test]
    fn migrations_add_columns_and_tables() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("t.db");
        {
            let s = Store::open(&path).unwrap();
            s.upsert_guide("g", "T", "S", "version-control", "beginner").unwrap();
            s.set_guide_status("g", "draft").unwrap();
        }
        let s = Store::open(&path).unwrap(); // reopen - persistence survives
        assert_eq!(s.guide_status("g").unwrap(), "draft");
        assert!(s.list_categories_rows().unwrap().is_empty()); // table exists, empty until seeded
    }

    #[test]
    fn feedback_roundtrip_and_guide_setters() {
        let s = Store::open_in_memory().unwrap();
        s.upsert_guide("g", "T", "S", "databases", "beginner").unwrap();
        s.set_guide_category("g", "apis").unwrap();
        s.set_guide_difficulty("g", "advanced").unwrap();
        let g = s.get_guide_any_status("g").unwrap().unwrap();
        assert_eq!(g.category, "apis");
        assert_eq!(g.difficulty, "advanced");

        s.insert_feedback("g", 2, "down", "this phase confused me", "v1").unwrap();
        s.insert_feedback("g", 1, "up", "", "v2").unwrap();
        let fb = s.list_feedback(10).unwrap();
        assert_eq!(fb.len(), 2);
        assert_eq!(fb[0].vote, "up"); // newest first
        assert!(s.db_size_bytes().unwrap() > 0);
    }

    #[test]
    fn revisions_reorder_and_asset_ids() {
        let s = Store::open_in_memory().unwrap();
        s.insert_phase_revision("g", 1, "v1", "s1", "# one").unwrap();
        s.insert_phase_revision("g", 1, "v2", "s2", "# two").unwrap();
        let revs = s.list_phase_revisions("g", 1).unwrap();
        assert_eq!(revs.len(), 2);
        assert_eq!(revs[0].title, "v2"); // newest first
        let full = s.get_phase_revision(revs[1].id).unwrap().unwrap();
        assert_eq!(full.markdown, "# one");
        assert_eq!(full.guide_slug, "g");

        s.upsert_guide("a", "A", "", "databases", "beginner").unwrap();
        s.upsert_guide("b", "B", "", "databases", "beginner").unwrap();
        s.reorder_guides(&["b".to_string(), "a".to_string()]).unwrap();
        // b should now sort before a (order 0 vs 1)
        let cats = s.guides_for_category("databases").unwrap();
        assert_eq!(cats[0].slug, "b");

        s.insert_asset("id1", "a.png", "image/png", b"x").unwrap();
        assert_eq!(s.list_asset_ids().unwrap(), vec!["id1".to_string()]);
    }

    #[test]
    fn guide_group_roundtrips() {
        let s = Store::open_in_memory().unwrap();
        s.upsert_guide("spring", "Spring", "x", "frameworks", "intermediate").unwrap();
        s.upsert_guide("anchor", "Anchor", "x", "frameworks", "beginner").unwrap();
        s.set_guide_group("spring", "Java").unwrap();
        let g = s.guides_for_category("frameworks").unwrap();
        assert_eq!(g.iter().find(|x| x.slug == "spring").unwrap().group.as_deref(), Some("Java"));
        assert_eq!(g.iter().find(|x| x.slug == "anchor").unwrap().group, None); // ungrouped stays None
    }

    #[test]
    fn drafts_excluded_from_public_list() {
        let s = Store::open_in_memory().unwrap();
        s.upsert_guide("a", "A", "s", "version-control", "beginner").unwrap();
        s.upsert_guide("b", "B", "s", "version-control", "beginner").unwrap();
        s.set_guide_status("b", "draft").unwrap();
        let public: Vec<_> = s.list_guides().unwrap().into_iter().map(|g| g.slug).collect();
        assert!(public.contains(&"a".to_string()));
        assert!(!public.contains(&"b".to_string()));
        assert_eq!(s.list_all_guides().unwrap().len(), 2); // admin sees both
        assert!(s.get_guide("b").unwrap().is_none()); // public fetch hides draft
        assert!(s.get_guide_any_status("b").unwrap().is_some()); // admin fetch shows it
    }

    #[test]
    fn analytics_counts_and_uniques() {
        let s = Store::open_in_memory().unwrap();
        s.record_event("pageview", "/guides/git", "google.com", "vA", "", "", "twitter").unwrap();
        s.record_event("pageview", "/guides/git", "", "vA", "", "", "").unwrap(); // same visitor
        s.record_event("pageview", "/", "reddit.com", "vB", "", "", "").unwrap();
        s.record_event("search", "/search", "", "vB", "rebase", "", "").unwrap();
        let (views, uniq, searches) = s.analytics_totals(30).unwrap();
        assert_eq!(views, 3);
        assert_eq!(uniq, 2);
        assert_eq!(searches, 1);
        assert_eq!(s.top_paths(30, 10).unwrap()[0], ("/guides/git".to_string(), 2));
        assert_eq!(s.top_searches(30, 10).unwrap()[0], ("rebase".to_string(), 1));
        assert!(s.top_referrers(30, 10).unwrap().iter().any(|(r, _)| r == "google.com"));
        assert!(s.top_sources(30, 10).unwrap().iter().any(|(r, c)| r == "twitter" && *c == 1));
        assert_eq!(s.views_per_day(30).unwrap().iter().map(|(_, c)| c).sum::<i64>(), 3);
    }

    #[test]
    fn prune_events_removes_only_old_rows() {
        let s = Store::open_in_memory().unwrap();
        // One old event (400 days ago) and one fresh one.
        s.conn
            .execute(
                "INSERT INTO events (ts, kind, path, referrer, visitor, query)
                 VALUES (datetime('now','-400 days'),'pageview','/old','','v','')",
                [],
            )
            .unwrap();
        s.record_event("pageview", "/new", "", "v", "", "", "").unwrap();

        let removed = s.prune_events(365).unwrap();
        assert_eq!(removed, 1);
        let total: i64 = s.conn.query_row("SELECT COUNT(*) FROM events", [], |r| r.get(0)).unwrap();
        assert_eq!(total, 1); // only the fresh event survives
    }
}
