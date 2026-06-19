//! Content audit: scan stored phase HTML for internal links that point nowhere and asset
//! references with no backing asset, plus assets that no phase references (orphans).

use std::collections::HashSet;
use std::sync::OnceLock;

use regex::Regex;

use crate::models::{BrokenRef, LinkReport};
use crate::store::{Store, StoreError};

fn guide_link_re() -> &'static Regex {
    static RE: OnceLock<Regex> = OnceLock::new();
    // Internal guide/phase links the ingest produces: href="/guides/<slug>[/<phase>]".
    RE.get_or_init(|| Regex::new(r#"href="/guides/([a-z0-9\-]+)(?:/(\d+))?""#).unwrap())
}

fn asset_ref_re() -> &'static Regex {
    static RE: OnceLock<Regex> = OnceLock::new();
    // Asset references: src/href="/assets/<id>".
    RE.get_or_init(|| Regex::new(r#"(?:src|href)="/assets/([A-Za-z0-9\-]+)""#).unwrap())
}

/// Walk every phase's stored HTML and report:
/// - `broken_links`: internal `/guides/...` links whose guide (or phase) doesn't exist,
/// - `missing_assets`: `/assets/<id>` references with no stored asset,
/// - `orphaned_assets`: stored assets that no phase references.
pub fn check_links(store: &Store) -> Result<LinkReport, StoreError> {
    let mut report = LinkReport::default();
    let mut referenced: Vec<(String, String)> = Vec::new(); // (from, asset_id)
    let mut referenced_ids: HashSet<String> = HashSet::new();

    for g in store.list_all_guides()? {
        for pref in store.list_phase_refs(&g.slug)? {
            let phase = match store.get_phase(&g.slug, pref.phase_no)? {
                Some(p) => p,
                None => continue,
            };
            let from = format!("{}/{}", g.slug, pref.phase_no);

            for caps in guide_link_re().captures_iter(&phase.html) {
                let target = &caps[1];
                let ok = match store.get_guide_any_status(target)? {
                    Some(_) => match caps.get(2) {
                        Some(p) => store.get_phase(target, p.as_str().parse().unwrap_or(0))?.is_some(),
                        None => true,
                    },
                    None => false,
                };
                if !ok {
                    report.broken_links.push(BrokenRef {
                        from: from.clone(),
                        href: caps.get(0).map(|m| m.as_str().trim_start_matches("href=").trim_matches('"').to_string()).unwrap_or_default(),
                    });
                }
            }

            for caps in asset_ref_re().captures_iter(&phase.html) {
                let id = caps[1].to_string();
                referenced_ids.insert(id.clone());
                referenced.push((from.clone(), id));
            }
        }
    }

    let stored: HashSet<String> = store.list_asset_ids()?.into_iter().collect();
    for (from, id) in referenced {
        if !stored.contains(&id) {
            report.missing_assets.push(BrokenRef { from, href: format!("/assets/{id}") });
        }
    }
    report.orphaned_assets = stored.into_iter().filter(|id| !referenced_ids.contains(id)).collect();
    report.orphaned_assets.sort();
    Ok(report)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::Phase;

    fn phase(slug: &str, no: u32, html: &str) -> Phase {
        Phase {
            guide_slug: slug.into(),
            phase_no: no,
            title: "T".into(),
            summary: "s".into(),
            tags: vec![],
            difficulty: "beginner".into(),
            synonyms: vec![],
            html: html.into(),
            updated: "2026-06-19".into(),
            markdown: String::new(),
        }
    }

    #[test]
    fn flags_broken_links_missing_and_orphaned_assets() {
        let s = Store::open_in_memory().unwrap();
        s.upsert_guide("real", "Real", "x", "databases", "beginner").unwrap();
        // a good link, a broken guide link, a missing asset, all in one phase
        s.upsert_phase(&phase(
            "real",
            1,
            r#"<a href="/guides/real">ok</a> <a href="/guides/ghost">bad</a> <img src="/assets/missing-1">"#,
        )).unwrap();

        // one stored asset that nobody references → orphan
        s.insert_asset("orphan-1", "a.png", "image/png", b"x").unwrap();

        let r = check_links(&s).unwrap();
        assert_eq!(r.broken_links.len(), 1, "only the ghost guide link is broken: {:?}", r.broken_links);
        assert!(r.broken_links[0].href.contains("ghost"));
        assert_eq!(r.missing_assets.len(), 1);
        assert!(r.missing_assets[0].href.contains("missing-1"));
        assert_eq!(r.orphaned_assets, vec!["orphan-1".to_string()]);
    }

    #[test]
    fn clean_content_reports_nothing() {
        let s = Store::open_in_memory().unwrap();
        s.upsert_guide("g", "G", "x", "databases", "beginner").unwrap();
        s.upsert_phase(&phase("g", 1, r#"<a href="/guides/g/1">self</a>"#)).unwrap();
        let r = check_links(&s).unwrap();
        assert!(r.broken_links.is_empty() && r.missing_assets.is_empty() && r.orphaned_assets.is_empty());
    }
}
