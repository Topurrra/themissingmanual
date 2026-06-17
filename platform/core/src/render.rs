use comrak::{markdown_to_html, ComrakOptions};

/// Render CommonMark + GitHub-flavored Markdown to HTML.
pub fn render_markdown(md: &str) -> String {
    let mut opts = ComrakOptions::default();
    opts.extension.table = true;
    opts.extension.strikethrough = true;
    opts.extension.autolink = true;
    markdown_to_html(md, &opts)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn renders_headings_tables_and_code() {
        let md = "# Title\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\n```sh\ngit status\n```\n";
        let html = render_markdown(md);
        assert!(html.contains("<h1>"));
        assert!(html.contains("<table>"));
        assert!(html.contains("<code"));
    }
}
