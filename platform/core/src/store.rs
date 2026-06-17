use rusqlite::{params, Connection};
use crate::models::{GuideSummary, Phase, PhaseRef};

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
                 summary TEXT NOT NULL
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
        Ok(Self { conn })
    }

    pub fn upsert_guide(&self, slug: &str, title: &str, summary: &str) -> Result<(), StoreError> {
        self.conn.execute(
            "INSERT INTO guides (slug, title, summary) VALUES (?1, ?2, ?3)
             ON CONFLICT(slug) DO UPDATE SET title = ?2, summary = ?3",
            params![slug, title, summary],
        )?;
        Ok(())
    }

    pub fn upsert_phase(&self, p: &Phase) -> Result<(), StoreError> {
        let tags = serde_json::to_string(&p.tags)?;
        let syns = serde_json::to_string(&p.synonyms)?;
        self.conn.execute(
            "INSERT INTO phases
               (guide_slug, phase_no, title, summary, tags_json, difficulty, synonyms_json, html, updated)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
             ON CONFLICT(guide_slug, phase_no) DO UPDATE SET
               title=?3, summary=?4, tags_json=?5, difficulty=?6, synonyms_json=?7, html=?8, updated=?9",
            params![p.guide_slug, p.phase_no, p.title, p.summary, tags, p.difficulty, syns, p.html, p.updated],
        )?;
        Ok(())
    }

    pub fn get_phase(&self, guide_slug: &str, phase_no: u32) -> Result<Option<Phase>, StoreError> {
        let mut stmt = self.conn.prepare(
            "SELECT guide_slug, phase_no, title, summary, tags_json, difficulty, synonyms_json, html, updated
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
            })),
            None => Ok(None),
        }
    }

    pub fn list_guides(&self) -> Result<Vec<GuideSummary>, StoreError> {
        let mut stmt = self.conn.prepare("SELECT slug, title, summary FROM guides ORDER BY slug")?;
        let rows = stmt.query_map([], |row| {
            Ok(GuideSummary { slug: row.get(0)?, title: row.get(1)?, summary: row.get(2)? })
        })?;
        Ok(rows.collect::<Result<Vec<_>, _>>()?)
    }

    pub fn get_guide(&self, slug: &str) -> Result<Option<GuideSummary>, StoreError> {
        let mut stmt = self.conn.prepare("SELECT slug, title, summary FROM guides WHERE slug = ?1")?;
        let mut rows = stmt.query(params![slug])?;
        match rows.next()? {
            Some(row) => Ok(Some(GuideSummary {
                slug: row.get(0)?,
                title: row.get(1)?,
                summary: row.get(2)?,
            })),
            None => Ok(None),
        }
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
        }
    }

    #[test]
    fn upsert_then_read_back() {
        let store = Store::open_in_memory().unwrap();
        store.upsert_guide("git", "Git Guide", "All about git").unwrap();
        store.upsert_phase(&sample_phase()).unwrap();

        let got = store.get_phase("git", 1).unwrap().unwrap();
        assert_eq!(got.title, "The Mental Model");
        assert_eq!(got.tags, vec!["git", "commits"]);

        let guides = store.list_guides().unwrap();
        assert_eq!(guides.len(), 1);
        assert_eq!(guides[0].slug, "git");
    }

    #[test]
    fn upsert_is_idempotent_on_guide_and_phase() {
        let store = Store::open_in_memory().unwrap();
        store.upsert_guide("git", "Git Guide", "x").unwrap();
        store.upsert_phase(&sample_phase()).unwrap();
        store.upsert_phase(&sample_phase()).unwrap(); // same (guide,phase_no)
        assert_eq!(store.list_guides().unwrap().len(), 1);
        assert!(store.get_phase("git", 1).unwrap().is_some());
    }

    #[test]
    fn get_guide_and_phase_refs() {
        let store = Store::open_in_memory().unwrap();
        store.upsert_guide("git", "Git Guide", "All about git").unwrap();
        store.upsert_phase(&sample_phase()).unwrap();

        let g = store.get_guide("git").unwrap().unwrap();
        assert_eq!(g.title, "Git Guide");
        assert!(store.get_guide("missing").unwrap().is_none());

        let refs = store.list_phase_refs("git").unwrap();
        assert_eq!(refs.len(), 1);
        assert_eq!(refs[0].phase_no, 1);
        assert_eq!(refs[0].title, "The Mental Model");
    }
}
