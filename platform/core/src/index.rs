use tantivy::{
    collector::TopDocs,
    query::{BooleanQuery, BoostQuery, FuzzyTermQuery, Occur, Query, TermQuery},
    schema::{Field, IndexRecordOption, Schema, TextFieldIndexing, TextOptions, Value, STORED, STRING},
    snippet::SnippetGenerator,
    tokenizer::{LowerCaser, RemoveLongFilter, SimpleTokenizer, Stemmer, StopWordFilter, TextAnalyzer, Language},
    Index, IndexWriter, TantivyDocument, Term,
};
use crate::models::{Phase, SearchHit, SearchResults};

/// Name of our custom analyzer: lowercase → drop stop words → English stemmer.
const ANALYZER: &str = "en_stem";
/// Lowercase-only analyzer (no stemming) for the `raw` field — fuzzy matches whole words.
const LOWER: &str = "lower";

pub struct Fields {
    pub guide_slug: Field,
    pub phase_no: Field,
    pub title: Field,
    pub summary: Field,
    pub body: Field,
    pub tags: Field,
    pub synonyms: Field,
    pub raw: Field,
}

pub struct SearchIndex {
    index: Index,
    fields: Fields,
}

pub struct Writer<'a> {
    writer: IndexWriter,
    fields: &'a Fields,
}

/// Stemming + stop-word analyzer applied to every text field (index and query side),
/// so "commits" matches "commit" and filler words ("how/do/the") don't dilute the query.
fn en_stem_analyzer() -> TextAnalyzer {
    let stop: Vec<String> = [
        "a", "an", "the", "is", "are", "was", "were", "be", "to", "of", "in", "on", "for", "and",
        "or", "how", "do", "does", "did", "i", "you", "my", "your", "what", "why", "when", "which",
        "that", "this", "with", "it", "its", "as", "at", "by", "from",
    ]
    .iter()
    .map(|s| s.to_string())
    .collect();
    TextAnalyzer::builder(SimpleTokenizer::default())
        .filter(RemoveLongFilter::limit(40))
        .filter(LowerCaser)
        .filter(StopWordFilter::remove(stop))
        .filter(Stemmer::new(Language::English))
        .build()
}

fn text() -> TextOptions {
    TextOptions::default().set_indexing_options(
        TextFieldIndexing::default()
            .set_tokenizer(ANALYZER)
            .set_index_option(IndexRecordOption::WithFreqsAndPositions),
    )
}
fn text_stored() -> TextOptions {
    text().set_stored()
}
fn lower_analyzer() -> TextAnalyzer {
    TextAnalyzer::builder(SimpleTokenizer::default()).filter(LowerCaser).build()
}
fn raw_text() -> TextOptions {
    TextOptions::default().set_indexing_options(
        TextFieldIndexing::default().set_tokenizer(LOWER).set_index_option(IndexRecordOption::WithFreqs),
    )
}

fn build_schema() -> (Schema, Fields) {
    let mut b = Schema::builder();
    let guide_slug = b.add_text_field("guide_slug", STRING | STORED);
    let phase_no = b.add_u64_field("phase_no", STORED);
    let title = b.add_text_field("title", text_stored());
    let summary = b.add_text_field("summary", text_stored());
    let body = b.add_text_field("body", text_stored()); // STORED so snippets can quote it
    let tags = b.add_text_field("tags", text());
    let synonyms = b.add_text_field("synonyms", text());
    let raw = b.add_text_field("raw", raw_text());
    let schema = b.build();
    (schema, Fields { guide_slug, phase_no, title, summary, body, tags, synonyms, raw })
}

fn register(index: &Index) {
    index.tokenizers().register(ANALYZER, en_stem_analyzer());
    index.tokenizers().register(LOWER, lower_analyzer());
}

/// Levenshtein distance allowed for a term, scaled to its length (short words stay strict).
fn fuzzy_distance(term: &str) -> u8 {
    match term.chars().count() {
        0..=4 => 0,
        5..=7 => 1,
        _ => 2,
    }
}

fn levenshtein(a: &str, b: &str) -> usize {
    let a: Vec<char> = a.chars().collect();
    let b: Vec<char> = b.chars().collect();
    let mut prev: Vec<usize> = (0..=b.len()).collect();
    let mut cur = vec![0usize; b.len() + 1];
    for (i, ca) in a.iter().enumerate() {
        cur[0] = i + 1;
        for (j, cb) in b.iter().enumerate() {
            let cost = if ca == cb { 0 } else { 1 };
            cur[j + 1] = (prev[j + 1] + 1).min(cur[j] + 1).min(prev[j] + cost);
        }
        std::mem::swap(&mut prev, &mut cur);
    }
    prev[b.len()]
}

impl SearchIndex {
    pub fn create_in_ram() -> tantivy::Result<Self> {
        let (schema, fields) = build_schema();
        let index = Index::create_in_ram(schema);
        register(&index);
        Ok(Self { index, fields })
    }

    pub fn open_or_create(dir: &std::path::Path) -> tantivy::Result<Self> {
        std::fs::create_dir_all(dir).ok();
        let (schema, fields) = build_schema();
        let index = Index::open_in_dir(dir).or_else(|_| Index::create_in_dir(dir, schema))?;
        register(&index);
        Ok(Self { index, fields })
    }

    pub fn writer(&self) -> tantivy::Result<Writer<'_>> {
        Ok(Writer { writer: self.index.writer(50_000_000)?, fields: &self.fields })
    }

    /// Tokenize text the same way the index does (lowercase, drop stop words, stem).
    fn analyze(&self, text: &str) -> Vec<String> {
        let mut out = Vec::new();
        if let Some(mut an) = self.index.tokenizers().get(ANALYZER) {
            let mut ts = an.token_stream(text);
            while ts.advance() {
                out.push(ts.token().text.clone());
            }
        }
        out
    }

    /// Lexical search: stemmed + stop-word-aware, relaxed for full sentences, typo-tolerant,
    /// per-guide de-duplicated, with a highlighted snippet and an optional "did you mean".
    pub fn search(&self, query: &str, limit: usize) -> tantivy::Result<SearchResults> {
        let reader = self.index.reader()?;
        let searcher = reader.searcher();
        let f = &self.fields;

        let terms = self.analyze(query);
        if terms.is_empty() {
            return Ok(SearchResults { hits: vec![], suggestion: None });
        }
        // Raw (un-stemmed) words drive fuzzy/typo matching against the `raw` field, so a typo
        // is measured against whole words instead of stems.
        let raw_words: Vec<String> = query
            .split_whitespace()
            .map(|w| w.to_lowercase())
            .filter(|w| w.chars().count() >= 3)
            .collect();

        // A term matches in ANY field, with title/tags weighted up.
        let field_boosts = [(f.title, 3.0f32), (f.tags, 2.0), (f.summary, 1.5), (f.body, 1.0), (f.synonyms, 1.0)];
        let term_subquery = |t: &str| -> Box<dyn Query> {
            let cl: Vec<(Occur, Box<dyn Query>)> = field_boosts
                .iter()
                .map(|&(field, boost)| {
                    let tq = TermQuery::new(Term::from_field_text(field, t), IndexRecordOption::WithFreqs);
                    (Occur::Should, Box::new(BoostQuery::new(Box::new(tq), boost)) as Box<dyn Query>)
                })
                .collect();
            Box::new(BooleanQuery::new(cl))
        };
        let fuzzy_subquery = |w: &str| -> Option<Box<dyn Query>> {
            let d = fuzzy_distance(w);
            if d == 0 {
                return None;
            }
            let fq = FuzzyTermQuery::new(Term::from_field_text(f.raw, w), d, true);
            Some(Box::new(BoostQuery::new(Box::new(fq), 0.5)) as Box<dyn Query>)
        };

        // Strict = all terms required (precise). Relaxed = any term or fuzzy (recall).
        let strict = BooleanQuery::new(terms.iter().map(|t| (Occur::Must, term_subquery(t))).collect());
        let mut should: Vec<(Occur, Box<dyn Query>)> = Vec::new();
        for t in &terms {
            should.push((Occur::Should, term_subquery(t)));
        }
        for w in &raw_words {
            if let Some(fz) = fuzzy_subquery(w) {
                should.push((Occur::Should, fz));
            }
        }
        let relaxed = BooleanQuery::new(should);
        // Reward docs that match all terms (rank them up) but keep partial/fuzzy hits for recall.
        let combined = BooleanQuery::new(vec![
            (Occur::Should, Box::new(BoostQuery::new(Box::new(strict), 2.0)) as Box<dyn Query>),
            (Occur::Should, Box::new(relaxed) as Box<dyn Query>),
        ]);

        // Over-fetch so the per-guide dedup still fills `limit`.
        let fetch = (limit * 4).max(limit);
        let top = searcher.search(&combined, &TopDocs::with_limit(fetch))?;

        let mut snip = SnippetGenerator::create(&searcher, &combined, f.body)?;
        snip.set_max_num_chars(170);

        let mut hits = Vec::new();
        let mut seen = std::collections::HashSet::new();
        for (score, addr) in top {
            let doc: TantivyDocument = searcher.doc(addr)?;
            let slug = doc.get_first(f.guide_slug).and_then(|v| v.as_str()).unwrap_or("").to_string();
            if !seen.insert(slug.clone()) {
                continue; // one result per guide — show its best phase
            }
            let snippet = snip.snippet_from_doc(&doc).to_html();
            hits.push(SearchHit {
                guide_slug: slug,
                phase_no: doc.get_first(f.phase_no).and_then(|v| v.as_u64()).unwrap_or(0) as u32,
                title: doc.get_first(f.title).and_then(|v| v.as_str()).unwrap_or("").to_string(),
                summary: doc.get_first(f.summary).and_then(|v| v.as_str()).unwrap_or("").to_string(),
                snippet,
                score,
            });
            if hits.len() >= limit {
                break;
            }
        }

        // Only bother suggesting when results are thin.
        let suggestion = if hits.len() < 2 { self.suggest(&searcher, query) } else { None };
        Ok(SearchResults { hits, suggestion })
    }

    /// Best-effort "did you mean": for each query word with no exact term in the index,
    /// find the nearest indexed term (Levenshtein ≤ 2). Returns the corrected query if anything changed.
    fn suggest(&self, searcher: &tantivy::Searcher, query: &str) -> Option<String> {
        let vocab = self.vocab(searcher);
        if vocab.is_empty() {
            return None;
        }
        let mut changed = false;
        let mut out: Vec<String> = Vec::new();
        for word in query.split_whitespace() {
            let w = word.to_lowercase();
            if w.chars().count() < 4 || vocab.contains_key(&w) {
                out.push(word.to_string());
                continue;
            }
            let max = if w.chars().count() >= 7 { 2 } else { 1 };
            // Within the edit-distance budget, prefer the smallest distance, then the most
            // frequent term, then lexicographic order — so ties are deterministic regardless of
            // map iteration order (the bug that let a growing index land "mrge" on "urge").
            let best = vocab
                .iter()
                .map(|(t, &freq)| (levenshtein(&w, t), freq, t))
                .filter(|&(d, _, _)| d <= max)
                .min_by(|a, b| {
                    a.0.cmp(&b.0)
                        .then_with(|| b.1.cmp(&a.1))
                        .then_with(|| a.2.cmp(b.2))
                });
            match best {
                Some((_, _, t)) => {
                    changed = true;
                    out.push(t.clone());
                }
                None => out.push(word.to_string()),
            }
        }
        let s = out.join(" ");
        if changed && !s.eq_ignore_ascii_case(query) {
            Some(s)
        } else {
            None
        }
    }

    /// All indexed terms (over the un-stemmed `raw` field) with their document frequency,
    /// summed across segments. Frequency is the tie-breaker for "did you mean": among
    /// equally-close candidates, the word that actually appears more in the corpus wins
    /// ("mrge" -> "merge", not the rarer "urge"). Only used on the thin-results path.
    fn vocab(&self, searcher: &tantivy::Searcher) -> std::collections::HashMap<String, u64> {
        let mut v: std::collections::HashMap<String, u64> = std::collections::HashMap::new();
        for seg in searcher.segment_readers() {
            if let Ok(inv) = seg.inverted_index(self.fields.raw) {
                if let Ok(mut stream) = inv.terms().stream() {
                    while stream.advance() {
                        if let Ok(s) = std::str::from_utf8(stream.key()) {
                            *v.entry(s.to_string()).or_insert(0) += stream.value().doc_freq as u64;
                        }
                    }
                }
            }
        }
        v
    }
}

impl<'a> Writer<'a> {
    /// Add one phase as a search document. `plain_text` is the de-HTML'd body for indexing.
    pub fn add_phase(&mut self, p: &Phase, plain_text: &str) -> tantivy::Result<()> {
        let f = self.fields;
        let mut doc = TantivyDocument::new();
        doc.add_text(f.guide_slug, &p.guide_slug);
        doc.add_u64(f.phase_no, p.phase_no as u64);
        doc.add_text(f.title, &p.title);
        doc.add_text(f.summary, &p.summary);
        doc.add_text(f.body, plain_text);
        doc.add_text(f.tags, &p.tags.join(" "));
        doc.add_text(f.synonyms, &p.synonyms.join(" "));
        doc.add_text(f.raw, &format!("{} {} {}", p.title, plain_text, p.tags.join(" ")));
        self.writer.add_document(doc)?;
        Ok(())
    }

    /// Remove any existing docs for a guide_slug before re-adding (idempotent re-ingest).
    pub fn delete_guide(&mut self, guide_slug: &str) {
        let term = Term::from_field_text(self.fields.guide_slug, guide_slug);
        self.writer.delete_term(term);
    }

    pub fn commit(&mut self) -> tantivy::Result<()> {
        self.writer.commit()?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::Phase;

    fn phase(no: u32, title: &str, body: &str, tags: &[&str]) -> Phase {
        Phase {
            guide_slug: format!("g{no}"),
            phase_no: no,
            title: title.into(),
            summary: format!("{title} summary"),
            tags: tags.iter().map(|s| s.to_string()).collect(),
            difficulty: "beginner".into(),
            synonyms: vec![],
            html: format!("<p>{body}</p>"),
            updated: "2026-06-17".into(),
            markdown: body.into(),
        }
    }

    fn idx_with(phases: &[Phase]) -> SearchIndex {
        let idx = SearchIndex::create_in_ram().unwrap();
        let mut w = idx.writer().unwrap();
        for p in phases {
            w.add_phase(p, &p.markdown).unwrap();
        }
        w.commit().unwrap();
        idx
    }

    #[test]
    fn finds_phase_by_body_term() {
        let idx = idx_with(&[
            phase(1, "The Mental Model", "a branch is a label pointing at a commit", &["git"]),
            phase(2, "Everyday Commands", "git status shows your working tree", &["git"]),
        ]);
        let r = idx.search("branch", 10).unwrap();
        assert_eq!(r.hits[0].phase_no, 1);
    }

    #[test]
    fn title_match_outranks_body_match() {
        let idx = idx_with(&[
            phase(1, "Stash", "shelving changes", &["git"]),
            phase(2, "Commands", "you can stash changes too", &["git"]),
        ]);
        let r = idx.search("stash", 10).unwrap();
        assert_eq!(r.hits[0].phase_no, 1); // title hit ranks first
    }

    #[test]
    fn fuzzy_matches_a_typo() {
        let idx = idx_with(&[phase(3, "When It Breaks", "rescuing a botched rebase", &["git", "rebase"])]);
        // "rebse" is one deletion from "rebase" -> should still hit.
        let r = idx.search("rebse", 10).unwrap();
        assert!(!r.hits.is_empty(), "fuzzy search should tolerate the typo");
        assert_eq!(r.hits[0].phase_no, 3);
    }

    #[test]
    fn stemming_matches_plural_and_inflections() {
        let idx = idx_with(&[phase(1, "Snapshots", "a commit is a snapshot of your project", &["git"])]);
        // "commits" should match the stemmed "commit"; "snapshots" matches "snapshot".
        assert!(!idx.search("commits", 10).unwrap().hits.is_empty(), "plural should stem to singular");
        assert!(!idx.search("snapshots", 10).unwrap().hits.is_empty());
    }

    #[test]
    fn full_sentence_query_still_lands() {
        let idx = idx_with(&[
            phase(1, "Undoing a Commit", "how to undo your last commit but keep the work", &["git", "undo"]),
            phase(2, "Branching", "a branch is a movable label", &["git"]),
        ]);
        // Stop words dropped, terms relaxed -> the relevant phase still comes back.
        let r = idx.search("how do i undo my last commit", 10).unwrap();
        assert!(!r.hits.is_empty(), "a natural-language question should return results");
        assert_eq!(r.hits[0].guide_slug, "g1");
    }

    #[test]
    fn results_are_deduped_per_guide() {
        let mut p1 = phase(1, "Commit Basics", "make a commit", &["git"]);
        let mut p2 = phase(2, "Commit Again", "another commit here", &["git"]);
        p1.guide_slug = "samezzz".into();
        p2.guide_slug = "samezzz".into();
        let idx = idx_with(&[p1, p2]);
        let r = idx.search("commit", 10).unwrap();
        assert_eq!(r.hits.len(), 1, "one result per guide");
        assert_eq!(r.hits[0].guide_slug, "samezzz");
    }

    #[test]
    fn hit_has_a_snippet() {
        let idx = idx_with(&[phase(1, "Branches", "a branch is a sticky note on one commit", &["git"])]);
        let r = idx.search("branch", 10).unwrap();
        assert!(r.hits[0].snippet.to_lowercase().contains("branch"), "snippet quotes the match");
    }

    #[test]
    fn suggests_a_correction_for_a_typo() {
        let idx = idx_with(&[phase(1, "Rebasing", "rescuing a botched rebase operation", &["git"])]);
        // A clear misspelling with no exact term -> "did you mean" should offer the real word.
        let r = idx.search("rebasng", 10).unwrap();
        assert!(r.suggestion.is_some(), "a misspelling should produce a suggestion");
    }

    #[test]
    fn suggestion_prefers_the_more_common_word() {
        // "mrge" is edit-distance 1 from both "merge" and "urge"; the word that's common in the
        // corpus must win the tie (regression: a growing index used to surface the rarer "urge").
        let idx = idx_with(&[
            phase(1, "Merging branches", "how to merge a branch", &["git"]),
            phase(2, "More merging", "you merge again then merge once more", &["git"]),
            phase(3, "An urge", "a sudden urge appears", &["misc"]),
        ]);
        let r = idx.search("mrge", 10).unwrap();
        assert_eq!(
            r.suggestion.as_deref(),
            Some("merge"),
            "common word wins the tie, not 'urge'"
        );
    }
}
