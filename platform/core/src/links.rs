use regex::Regex;

/// Rewrite a guide's internal Markdown links to real web routes:
///   `_guide.md`       -> `/guides/<slug>`
///   `NN-anything.md`  -> `/guides/<slug>/<N>`  (leading zeros stripped)
/// Internal links (now root-relative `/...`) stay in the same tab; **external links**
/// (`http(s)://...` - to another site) get `target="_blank" rel="noopener noreferrer"`
/// so they open in a new tab and can't reach back into our page via `window.opener`.
pub fn rewrite_internal_links(html: &str, guide_slug: &str) -> String {
    let guide_re = Regex::new(r#"href="_guide\.md""#).unwrap();
    let step1 = guide_re.replace_all(html, format!(r#"href="/guides/{guide_slug}""#).as_str());

    let phase_re = Regex::new(r#"href="0*(\d+)-[^"]*\.md""#).unwrap();
    let step2 = phase_re.replace_all(&step1, |caps: &regex::Captures| {
        format!(r#"href="/guides/{}/{}""#, guide_slug, &caps[1])
    });

    // Open off-site links in a new tab. Runs last, after internal links are already
    // rewritten to root-relative `/...` (so only genuine external `http(s)://` hrefs
    // match). Heading-anchor (`#id`) and internal links are left in the same tab.
    let ext_re = Regex::new(r#"<a href="(https?://[^"]+)""#).unwrap();
    let step3 = ext_re.replace_all(&step2, r#"<a href="${1}" target="_blank" rel="noopener noreferrer""#);
    step3.into_owned()
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

    #[test]
    fn external_links_open_in_new_tab_internal_do_not() {
        // r## delimiters because the anchor href contains a `#`.
        let html = r##"<a href="https://wokwi.com">sim</a> <a href="02-x.md">P2</a> <a href="#the-heading" class="anchor">h</a>"##;
        let out = rewrite_internal_links(html, "embedded-c-from-zero");
        // external -> new tab, safe rel
        assert!(out.contains(r#"<a href="https://wokwi.com" target="_blank" rel="noopener noreferrer">"#));
        // internal phase link -> rewritten, same tab (no target)
        assert!(out.contains(r#"href="/guides/embedded-c-from-zero/2""#));
        assert!(!out.contains(r#"/guides/embedded-c-from-zero/2" target"#));
        // heading anchor -> untouched
        assert!(out.contains(r##"<a href="#the-heading" class="anchor">"##));
    }
}
