use tantivy::{
    collector::TopDocs,
    query::QueryParser,
    schema::{Schema, Field, STORED, STRING, TEXT, Value},
    Index, IndexWriter, TantivyDocument, Term,
};
use crate::models::{Phase, SearchHit};

pub struct Fields {
    pub guide_slug: Field,
    pub phase_no: Field,
    pub title: Field,
    pub summary: Field,
    pub body: Field,
    pub tags: Field,
    pub synonyms: Field,
}

pub struct SearchIndex {
    index: Index,
    fields: Fields,
}

pub struct Writer<'a> {
    writer: IndexWriter,
    fields: &'a Fields,
}

fn build_schema() -> (Schema, Fields) {
    let mut b = Schema::builder();
    let guide_slug = b.add_text_field("guide_slug", STRING | STORED);
    let phase_no = b.add_u64_field("phase_no", STORED);
    let title = b.add_text_field("title", TEXT | STORED);
    let summary = b.add_text_field("summary", TEXT | STORED);
    let body = b.add_text_field("body", TEXT);
    let tags = b.add_text_field("tags", TEXT);
    let synonyms = b.add_text_field("synonyms", TEXT);
    let schema = b.build();
    (schema, Fields { guide_slug, phase_no, title, summary, body, tags, synonyms })
}

impl SearchIndex {
    pub fn create_in_ram() -> tantivy::Result<Self> {
        let (schema, fields) = build_schema();
        Ok(Self { index: Index::create_in_ram(schema), fields })
    }

    pub fn open_or_create(dir: &std::path::Path) -> tantivy::Result<Self> {
        std::fs::create_dir_all(dir).ok();
        let (schema, fields) = build_schema();
        let index = Index::open_in_dir(dir).or_else(|_| Index::create_in_dir(dir, schema))?;
        Ok(Self { index, fields })
    }

    pub fn writer(&self) -> tantivy::Result<Writer<'_>> {
        Ok(Writer { writer: self.index.writer(50_000_000)?, fields: &self.fields })
    }

    /// Lexical search with field boosts (title and tags weigh most).
    pub fn search(&self, query: &str, limit: usize) -> tantivy::Result<Vec<SearchHit>> {
        let reader = self.index.reader()?;
        let searcher = reader.searcher();
        let f = &self.fields;
        let mut parser = QueryParser::for_index(
            &self.index,
            vec![f.title, f.tags, f.summary, f.body, f.synonyms],
        );
        parser.set_field_boost(f.title, 3.0);
        parser.set_field_boost(f.tags, 2.0);
        parser.set_conjunction_by_default();
        // Exact/boosted parse first.
        let exact = parser.parse_query_lenient(query).0;

        // Fuzzy fallback: OR together a Levenshtein query (distance 1) per term,
        // across title/body/tags, so typos still match.
        use tantivy::query::{BooleanQuery, FuzzyTermQuery, Occur, Query};
        let mut clauses: Vec<(Occur, Box<dyn Query>)> = vec![(Occur::Should, exact)];
        for raw in query.split_whitespace() {
            let term_text = raw.to_lowercase();
            for field in [f.title, f.body, f.tags] {
                let term = Term::from_field_text(field, &term_text);
                let fq = FuzzyTermQuery::new(term, 1, true); // distance 1, transposition-aware
                clauses.push((Occur::Should, Box::new(fq)));
            }
        }
        let combined = BooleanQuery::new(clauses);
        let top = searcher.search(&combined, &TopDocs::with_limit(limit))?;

        let mut hits = Vec::new();
        for (score, addr) in top {
            let doc: TantivyDocument = searcher.doc(addr)?;
            hits.push(SearchHit {
                guide_slug: doc.get_first(f.guide_slug).and_then(|v| v.as_str()).unwrap_or("").to_string(),
                phase_no: doc.get_first(f.phase_no).and_then(|v| v.as_u64()).unwrap_or(0) as u32,
                title: doc.get_first(f.title).and_then(|v| v.as_str()).unwrap_or("").to_string(),
                summary: doc.get_first(f.summary).and_then(|v| v.as_str()).unwrap_or("").to_string(),
                score,
            });
        }
        Ok(hits)
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
            guide_slug: "git".into(), phase_no: no, title: title.into(),
            summary: format!("{title} summary"), tags: tags.iter().map(|s| s.to_string()).collect(),
            difficulty: "beginner".into(), synonyms: vec![], html: format!("<p>{body}</p>"),
            updated: "2026-06-17".into(), markdown: body.into(),
        }
    }

    #[test]
    fn finds_phase_by_body_term() {
        let idx = SearchIndex::create_in_ram().unwrap();
        let mut w = idx.writer().unwrap();
        w.add_phase(&phase(1, "The Mental Model", "a branch is a label pointing at a commit", &["git"]), "a branch is a label pointing at a commit").unwrap();
        w.add_phase(&phase(2, "Everyday Commands", "git status shows your working tree", &["git"]), "git status shows your working tree").unwrap();
        w.commit().unwrap();

        let hits = idx.search("branch", 10).unwrap();
        assert_eq!(hits[0].phase_no, 1);
    }

    #[test]
    fn title_match_outranks_body_match() {
        let idx = SearchIndex::create_in_ram().unwrap();
        let mut w = idx.writer().unwrap();
        w.add_phase(&phase(1, "Stash", "shelving changes", &["git"]), "shelving changes").unwrap();
        w.add_phase(&phase(2, "Commands", "you can stash changes too", &["git"]), "you can stash changes too").unwrap();
        w.commit().unwrap();

        let hits = idx.search("stash", 10).unwrap();
        assert_eq!(hits[0].phase_no, 1); // title hit ranks first
    }

    #[test]
    fn fuzzy_matches_a_typo() {
        let idx = SearchIndex::create_in_ram().unwrap();
        let mut w = idx.writer().unwrap();
        w.add_phase(&phase(3, "When It Breaks", "rescuing a botched rebase", &["git", "rebase"]),
                    "rescuing a botched rebase").unwrap();
        w.commit().unwrap();

        // "rebse" is one deletion away from "rebase" -> should still hit.
        let hits = idx.search("rebse", 10).unwrap();
        assert!(!hits.is_empty(), "fuzzy search should tolerate the typo");
        assert_eq!(hits[0].phase_no, 3);
    }
}
