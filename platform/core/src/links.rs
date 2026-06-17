use regex::Regex;

/// Rewrite a guide's internal Markdown links to real web routes:
///   `_guide.md`       -> `/guides/<slug>`
///   `NN-anything.md`  -> `/guides/<slug>/<N>`  (leading zeros stripped)
/// External links (http...) and anything not matching are left untouched.
pub fn rewrite_internal_links(html: &str, guide_slug: &str) -> String {
    let guide_re = Regex::new(r#"href="_guide\.md""#).unwrap();
    let step1 = guide_re.replace_all(html, format!(r#"href="/guides/{guide_slug}""#).as_str());

    let phase_re = Regex::new(r#"href="0*(\d+)-[^"]*\.md""#).unwrap();
    let step2 = phase_re.replace_all(&step1, |caps: &regex::Captures| {
        format!(r#"href="/guides/{}/{}""#, guide_slug, &caps[1])
    });
    step2.into_owned()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rewrites_phase_and_guide_links_leaves_external() {
        let html = r#"<a href="02-everyday-commands.md">Phase 2</a> <a href="_guide.md">overview</a> <a href="https://example.com/x.md">ext</a>"#;
        let out = rewrite_internal_links(html, "git");
        assert!(out.contains(r#"href="/guides/git/2""#));
        assert!(out.contains(r#"href="/guides/git""#));
        assert!(out.contains(r#"href="https://example.com/x.md""#)); // external untouched
    }

    #[test]
    fn strips_leading_zero() {
        let out = rewrite_internal_links(r#"<a href="01-the-mental-model.md">P1</a>"#, "git");
        assert!(out.contains(r#"href="/guides/git/1""#));
    }
}
