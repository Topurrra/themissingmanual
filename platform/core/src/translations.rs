//! Human-written guide translations, read from `translations/<locale>/<category>/<slug>/<file>.md`
//! (same filenames as the English guide). File-only: every sync rebuilds a locale's rows and
//! search index from disk. A translated guide publishes only when it covers exactly the English
//! guide's phases and every file parses; otherwise it is skipped and recorded as an issue.

use std::collections::{BTreeMap, BTreeSet, HashSet};
use std::path::Path;
use walkdir::WalkDir;
use crate::frontmatter::parse_translation;
use crate::index::SearchIndex;
use crate::ingest::{html_to_index_text, IngestError};
use crate::locales::{Locale, LOCALES};
use crate::models::{GuideTranslation, Phase, PhaseTranslation, TranslationFrontmatter, TranslationIssue};
use crate::store::Store;

/// One search index per registered locale.
pub struct LocaleIndexes(Vec<(&'static Locale, SearchIndex)>);

impl LocaleIndexes {
    pub fn create_in_ram() -> tantivy::Result<Self> {
        let mut v = Vec::new();
        for l in LOCALES {
            v.push((l, SearchIndex::create_in_ram_for(l)?));
        }
        Ok(Self(v))
    }

    pub fn get(&self, code: &str) -> Option<&SearchIndex> {
        self.0.iter().find(|(l, _)| l.code == code).map(|(_, i)| i)
    }
}

#[derive(Debug, Default, PartialEq)]
pub struct TranslationStats {
    pub published: usize,
    pub issues: usize,
}

/// In a translated page, point absolute `/guides/<slug>...` links at `/<code>/guides/<slug>...`,
/// but only for guides published in that locale - links to untranslated guides stay English.
pub fn prefix_locale_links(html: &str, code: &str, published: &HashSet<String>) -> String {
    use std::sync::OnceLock;
    static RE: OnceLock<regex::Regex> = OnceLock::new();
    let re = RE.get_or_init(|| regex::Regex::new(r##"href="/guides/([^"/#?]+)([/"#?])"##).unwrap());
    re.replace_all(html, |c: &regex::Captures| {
        if published.contains(&c[1]) {
            format!(r#"href="/{code}/guides/{}{}"#, &c[1], &c[2])
        } else {
            c[0].to_string()
        }
    })
    .into_owned()
}

fn is_iso_date(s: &str) -> bool {
    let b = s.as_bytes();
    b.len() == 10
        && b.iter().enumerate().all(|(i, c)| if i == 4 || i == 7 { *c == b'-' } else { c.is_ascii_digit() })
}

struct Parsed {
    fm: TranslationFrontmatter,
    body: String,
    source_file: String,
}

#[derive(Default)]
struct Group {
    files: Vec<Parsed>,
    problems: Vec<String>,
}

/// Rebuild every registered locale's translations (store rows + search index) from disk.
/// Call after the English ingest, under the same store lock.
pub fn ingest_translations(root: &Path, store: &Store, indexes: &LocaleIndexes) -> Result<TranslationStats, IngestError> {
    let mut stats = TranslationStats::default();
    for locale in LOCALES {
        let dir = root.join("translations").join(locale.code);
        // Group by the `<slug>` folder; only `<category>/<slug>/<file>.md` is read.
        let mut groups: BTreeMap<String, Group> = BTreeMap::new();
        for entry in WalkDir::new(&dir).min_depth(3).max_depth(3).into_iter().filter_map(|e| e.ok()) {
            let path = entry.path();
            if path.extension().and_then(|e| e.to_str()) != Some("md") {
                continue;
            }
            let slug = path
                .parent()
                .and_then(|p| p.file_name())
                .map(|n| n.to_string_lossy().into_owned())
                .unwrap_or_default();
            let source_file = path.strip_prefix(root).unwrap_or(path).to_string_lossy().replace('\\', "/");
            let group = groups.entry(slug.clone()).or_default();
            let raw = match std::fs::read_to_string(path) {
                Ok(r) => r,
                Err(e) => {
                    group.problems.push(format!("{source_file}: {e}"));
                    continue;
                }
            };
            match parse_translation(&raw) {
                Ok((fm, body)) => {
                    if fm.guide != slug {
                        group.problems.push(format!("{source_file}: guide `{}` does not match folder `{slug}`", fm.guide));
                    } else if !is_iso_date(&fm.source_updated) {
                        group.problems.push(format!("{source_file}: source_updated `{}` is not YYYY-MM-DD", fm.source_updated));
                    } else {
                        group.files.push(Parsed { fm, body, source_file });
                    }
                }
                Err(e) => group.problems.push(format!("{source_file}: {e}")),
            }
        }

        // Pass 1: decide which guides publish, so pass 2 can prefix links to them.
        let mut ready: Vec<(String, Vec<Parsed>)> = Vec::new();
        let mut issues: Vec<TranslationIssue> = Vec::new();
        for (slug, group) in groups {
            let mut problems = group.problems;
            let mut missing = Vec::new();
            if store.get_guide(&slug)?.is_none() {
                problems.push(format!("English guide `{slug}` does not exist or is not published"));
            } else {
                let english: BTreeSet<u32> = store.list_phase_refs(&slug)?.into_iter().map(|p| p.phase_no).collect();
                let mut translated = BTreeSet::new();
                for f in &group.files {
                    if !translated.insert(f.fm.phase) {
                        problems.push(format!("phase {} is translated more than once", f.fm.phase));
                    }
                    if !english.contains(&f.fm.phase) {
                        problems.push(format!("phase {} has no English counterpart ({})", f.fm.phase, f.source_file));
                    }
                }
                missing = english.difference(&translated).copied().collect();
            }
            if problems.is_empty() && missing.is_empty() {
                ready.push((slug, group.files));
            } else {
                issues.push(TranslationIssue { guide_slug: slug, problems, missing_phases: missing });
            }
        }
        let published: HashSet<String> = ready.iter().map(|(s, _)| s.clone()).collect();

        // Pass 2: render through the English pipeline, then locale-prefix internal links.
        let mut guides = Vec::new();
        for (slug, mut files) in ready {
            files.sort_by_key(|f| f.fm.phase);
            let head = &files[0].fm; // phase 0 (`_guide.md`) when the English guide has an overview
            let guide = GuideTranslation {
                slug: slug.clone(),
                lang: locale.code.to_string(),
                title: head.title.clone(),
                summary: head.summary.clone(),
                translators: head.translators.clone(),
            };
            let phases = files
                .into_iter()
                .map(|f| {
                    let html = crate::links::rewrite_internal_links(&crate::render::render_markdown(&f.body), &slug);
                    PhaseTranslation {
                        guide_slug: slug.clone(),
                        lang: locale.code.to_string(),
                        phase_no: f.fm.phase,
                        title: f.fm.title,
                        summary: f.fm.summary,
                        synonyms: f.fm.synonyms,
                        html: prefix_locale_links(&html, locale.code, &published),
                        markdown: f.body,
                        source_updated: f.fm.source_updated,
                        source_file: f.source_file,
                    }
                })
                .collect();
            guides.push((guide, phases));
        }
        stats.published += guides.len();
        stats.issues += issues.len();
        store.replace_translations(locale.code, &guides, &issues)?;
        if let Some(index) = indexes.get(locale.code) {
            index_locale(store, locale.code, index)?;
        }
    }
    Ok(stats)
}

/// Rebuild one locale's search index from the store (published translated guides only).
/// Tags/difficulty/updated are inherited from the English phase.
pub fn index_locale(store: &Store, code: &str, index: &SearchIndex) -> Result<(), IngestError> {
    let mut w = index.writer()?;
    w.clear()?;
    for slug in store.translated_slugs(code)? {
        for pref in store.list_phase_translation_refs(&slug, code)? {
            let (Some(t), Some(en)) = (
                store.get_phase_translation(&slug, code, pref.phase_no)?,
                store.get_phase(&slug, pref.phase_no)?,
            ) else {
                continue;
            };
            let plain = html_to_index_text(&t.html);
            let p = Phase {
                guide_slug: t.guide_slug,
                phase_no: t.phase_no,
                title: t.title,
                summary: t.summary,
                tags: en.tags,
                difficulty: en.difficulty,
                synonyms: t.synonyms,
                html: String::new(),
                updated: en.updated,
                markdown: String::new(),
                source_file: String::new(),
            };
            w.add_phase(&p, &format!("{} {}", p.summary, plain))?;
        }
    }
    w.commit()?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    fn en(root: &Path, slug: &str, file: &str, phase: u32, updated: &str, body: &str) {
        let d = root.join("guides/version-control").join(slug);
        fs::create_dir_all(&d).unwrap();
        fs::write(
            d.join(file),
            format!("---\ntitle: \"{slug} {phase}\"\nguide: \"{slug}\"\nphase: {phase}\nsummary: \"s\"\ntags: [git]\ncategory: version-control\ndifficulty: beginner\nsynonyms: []\nupdated: {updated}\n---\n{body}\n"),
        )
        .unwrap();
    }

    fn pt(root: &Path, slug: &str, file: &str, phase: u32, source_updated: &str, body: &str) {
        let d = root.join("translations/pt-br/version-control").join(slug);
        fs::create_dir_all(&d).unwrap();
        let extra = if phase == 0 { "translators: [\"gmm-tech\"]\n" } else { "" };
        fs::write(
            d.join(file),
            format!("---\nguide: \"{slug}\"\nphase: {phase}\ntitle: \"Título {phase}\"\nsummary: \"Resumo\"\nsynonyms: [\"ramo\"]\nsource_updated: \"{source_updated}\"\n{extra}---\n{body}\n"),
        )
        .unwrap();
    }

    fn run(root: &Path) -> (Store, LocaleIndexes, TranslationStats) {
        let store = Store::open_in_memory().unwrap();
        let index = SearchIndex::create_in_ram().unwrap();
        crate::ingest::ingest_dir(root, &store, &index).unwrap();
        let li = LocaleIndexes::create_in_ram().unwrap();
        let stats = ingest_translations(root, &store, &li).unwrap();
        (store, li, stats)
    }

    #[test]
    fn complete_translation_publishes_and_is_searchable() {
        let dir = tempfile::tempdir().unwrap();
        let r = dir.path();
        en(r, "git", "_guide.md", 0, "2026-06-01", "# Git");
        en(r, "git", "01-branches.md", 1, "2026-06-01", "# Branches\n\nA branch is a label.");
        pt(r, "git", "_guide.md", 0, "2026-06-01", "# Título 0");
        pt(r, "git", "01-branches.md", 1, "2026-06-01", "# Título 1\n\nUm ramo é um rótulo para ramificações.");
        fs::write(r.join("translations/README.md"), "ignored").unwrap();

        let (store, li, stats) = run(r);
        assert_eq!(stats, TranslationStats { published: 1, issues: 0 });
        assert_eq!(store.translated_slugs("pt-br").unwrap(), vec!["git".to_string()]);
        let g = store.get_guide_translation("git", "pt-br").unwrap().unwrap();
        assert_eq!(g.translators, vec!["gmm-tech".to_string()]);
        let p = store.get_phase_translation("git", "pt-br", 1).unwrap().unwrap();
        assert!(p.html.contains("<h1"));
        assert_eq!(p.source_file, "translations/pt-br/version-control/git/01-branches.md");
        let hits = li.get("pt-br").unwrap().search("ramificação", 10).unwrap().hits;
        assert_eq!(hits[0].guide_slug, "git");
        assert_eq!(hits[0].title, "Título 1");
    }

    #[test]
    fn missing_phase_is_not_published_and_recorded() {
        let dir = tempfile::tempdir().unwrap();
        let r = dir.path();
        en(r, "git", "_guide.md", 0, "2026-06-01", "# Git");
        en(r, "git", "01-branches.md", 1, "2026-06-01", "# Branches");
        pt(r, "git", "_guide.md", 0, "2026-06-01", "# Título 0");

        let (store, li, stats) = run(r);
        assert_eq!(stats, TranslationStats { published: 0, issues: 1 });
        assert!(store.translated_slugs("pt-br").unwrap().is_empty());
        assert!(store.get_phase_translation("git", "pt-br", 0).unwrap().is_none());
        let issues = store.translation_issues("pt-br").unwrap();
        assert_eq!(issues[0].guide_slug, "git");
        assert_eq!(issues[0].missing_phases, vec![1]);
        assert!(li.get("pt-br").unwrap().search("título", 10).unwrap().hits.is_empty());
    }

    #[test]
    fn extra_phase_and_bad_frontmatter_are_issues() {
        let dir = tempfile::tempdir().unwrap();
        let r = dir.path();
        en(r, "git", "_guide.md", 0, "2026-06-01", "# Git");
        pt(r, "git", "_guide.md", 0, "2026-06-01", "# Título 0");
        pt(r, "git", "05-extra.md", 5, "2026-06-01", "# Título 5");
        en(r, "sql", "_guide.md", 0, "2026-06-01", "# SQL");
        let d = r.join("translations/pt-br/version-control/sql");
        fs::create_dir_all(&d).unwrap();
        fs::write(d.join("_guide.md"), "---\nguide: \"sql\"\nphase: 0\n---\n# sem campos\n").unwrap();

        let (store, _li, stats) = run(r);
        assert_eq!(stats.published, 0);
        let issues = store.translation_issues("pt-br").unwrap();
        assert_eq!(issues.len(), 2);
        assert!(issues[0].problems.iter().any(|p| p.contains("phase 5 has no English counterpart")));
        assert_eq!(issues[1].guide_slug, "sql");
        assert!(issues[1].missing_phases == vec![0] && !issues[1].problems.is_empty());
    }

    #[test]
    fn links_prefixed_only_for_published_targets() {
        let dir = tempfile::tempdir().unwrap();
        let r = dir.path();
        en(r, "git", "_guide.md", 0, "2026-06-01", "# Git");
        en(r, "sql", "_guide.md", 0, "2026-06-01", "# SQL");
        pt(
            r,
            "git",
            "_guide.md",
            0,
            "2026-06-01",
            "# Título 0\n\n[self](/guides/git/1) [own](_guide.md) [sql](/guides/sql) [x](https://example.com/guides/git)",
        );
        let (store, _li, _) = run(r);
        let html = store.get_phase_translation("git", "pt-br", 0).unwrap().unwrap().html;
        assert!(html.contains(r#"href="/pt-br/guides/git/1""#), "{html}");
        assert!(html.contains(r#"href="/pt-br/guides/git""#), "{html}");
        assert!(html.contains(r#"href="/guides/sql""#), "untranslated target stays English: {html}");
        assert!(html.contains(r#"href="https://example.com/guides/git""#), "{html}");
    }

    #[test]
    fn stale_is_computed_from_english_updated() {
        let dir = tempfile::tempdir().unwrap();
        let r = dir.path();
        en(r, "git", "_guide.md", 0, "2026-06-01", "# Git");
        en(r, "git", "01-branches.md", 1, "2026-07-10", "# Branches");
        pt(r, "git", "_guide.md", 0, "2026-06-01", "# Título 0");
        pt(r, "git", "01-branches.md", 1, "2026-06-01", "# Título 1");
        let (store, _li, _) = run(r);
        let stale = store.stale_translations("pt-br").unwrap();
        assert_eq!(stale.len(), 1);
        assert_eq!(stale[0].phase_no, 1);
        assert_eq!(stale[0].english_updated, "2026-07-10");
        assert_eq!(stale[0].source_updated, "2026-06-01");
    }

    #[test]
    fn resync_replaces_rows_from_disk() {
        let dir = tempfile::tempdir().unwrap();
        let r = dir.path();
        en(r, "git", "_guide.md", 0, "2026-06-01", "# Git");
        pt(r, "git", "_guide.md", 0, "2026-06-01", "# Título 0");
        let (store, li, _) = run(r);
        assert_eq!(store.translated_slugs("pt-br").unwrap().len(), 1);
        fs::remove_dir_all(r.join("translations/pt-br")).unwrap();
        ingest_translations(r, &store, &li).unwrap();
        assert!(store.translated_slugs("pt-br").unwrap().is_empty());
        assert!(li.get("pt-br").unwrap().search("título", 10).unwrap().hits.is_empty());
    }
}
