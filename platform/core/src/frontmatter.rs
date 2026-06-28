use crate::models::Frontmatter;

#[derive(thiserror::Error, Debug)]
pub enum FrontmatterError {
    #[error("file does not start with a `---` frontmatter block")]
    Missing,
    #[error("frontmatter is not closed with a `---` line")]
    Unterminated,
    #[error("invalid YAML in frontmatter: {0}")]
    Yaml(#[from] serde_yaml::Error),
}

/// Split a Markdown document into its YAML frontmatter and its body.
/// Accepts both LF (`\n`) and CRLF (`\r\n`) line endings.
pub fn parse_markdown(input: &str) -> Result<(Frontmatter, String), FrontmatterError> {
    let normalized = input.replace("\r\n", "\n");
    let rest = normalized.strip_prefix("---\n").ok_or(FrontmatterError::Missing)?;
    let end = rest.find("\n---").ok_or(FrontmatterError::Unterminated)?;
    let yaml = &rest[..end];
    let body = rest[end + 4..].trim_start_matches('\n').to_string();
    let fm: Frontmatter = serde_yaml::from_str(yaml)?;
    Ok((fm, body))
}

#[cfg(test)]
mod tests {
    use super::*;

    const SAMPLE: &str = "---\n\
title: \"The Mental Model\"\n\
guide: \"git-explained-like-a-human\"\n\
phase: 1\n\
summary: \"Commits are snapshots.\"\n\
tags: [git, commits]\n\
difficulty: beginner\n\
synonyms: [\"what is a git commit\"]\n\
updated: 2026-06-17\n\
---\n\
# Heading\n\nBody text.\n";

    #[test]
    fn parses_frontmatter_and_returns_body() {
        let (fm, body) = parse_markdown(SAMPLE).unwrap();
        assert_eq!(fm.title, "The Mental Model");
        assert_eq!(fm.guide, "git-explained-like-a-human");
        assert_eq!(fm.phase, 1);
        assert_eq!(fm.tags, vec!["git", "commits"]);
        assert_eq!(fm.synonyms, vec!["what is a git commit"]);
        assert!(body.starts_with("# Heading"));
    }

    #[test]
    fn missing_frontmatter_is_an_error() {
        assert!(parse_markdown("# no frontmatter here").is_err());
    }
}
