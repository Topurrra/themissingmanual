use serde::Serialize;
use std::collections::HashMap;
use crate::models::GuideSummary;
use crate::store::{Store, StoreError};

#[derive(Debug, Clone, Serialize)]
pub struct ChoiceOption {
    pub value: String,
    pub label: String,
    pub guide_slug: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct ChoiceDimension {
    pub id: String,
    pub label: String,
    pub options: Vec<ChoiceOption>,
}

struct StepDef {
    id: &'static str,
    title: &'static str,
    category: &'static str,
    choice: Option<&'static str>,
    guide_slug: Option<&'static str>,
    note: Option<&'static str>,
}

struct TrackDef {
    slug: &'static str,
    name: &'static str,
    blurb: &'static str,
    choices: &'static [&'static str],
    steps: &'static [StepDef],
}

#[derive(Debug, Clone, Serialize)]
pub struct TrackSummary {
    pub slug: String,
    pub name: String,
    pub blurb: String,
    pub step_count: usize,
    pub categories: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct ResolvedStep {
    pub id: String,
    pub title: String,
    pub category: String,
    pub note: Option<String>,
    pub choice: Option<String>, // the chosen option's label, if a choice was made
    pub guide: Option<GuideSummary>,
    pub coming_soon: bool,
}

// ---- curated config ----

fn opt(value: &str, label: &str, guide: Option<&str>) -> ChoiceOption {
    ChoiceOption { value: value.into(), label: label.into(), guide_slug: guide.map(|s| s.into()) }
}

/// The global choice-dimension registry. An option maps to a guide slug only once that guide exists.
pub fn dimension(id: &str) -> Option<ChoiceDimension> {
    let (label, options) = match id {
        "version-control" => ("Version control", vec![opt("git", "Git", Some("git-from-zero"))]),
        "language" => ("Language", vec![opt("go", "Go", None), opt("rust", "Rust", None), opt("python", "Python", None), opt("node", "Node.js", None)]),
        "database" => ("Database", vec![opt("postgresql", "PostgreSQL", None), opt("mysql", "MySQL", None), opt("mongodb", "MongoDB", None), opt("sqlite", "SQLite", None)]),
        "api-style" => ("API style", vec![opt("rest", "REST", None), opt("graphql", "GraphQL", None), opt("grpc", "gRPC", None)]),
        "deployment" => ("Deployment", vec![opt("docker", "Docker", None), opt("kubernetes", "Kubernetes", None), opt("vps", "VPS", None)]),
        "testing" => ("Testing", vec![opt("unit", "Unit-first", None), opt("e2e", "End-to-end-first", None)]),
        _ => return None,
    };
    Some(ChoiceDimension { id: id.into(), label: label.into(), options })
}

const TRACKS: &[TrackDef] = &[
    TrackDef {
        slug: "backend-developer",
        name: "Backend Developer",
        blurb: "From version control to a deployed, tested service — the path a backend dev actually walks.",
        choices: &["language", "database", "api-style", "deployment", "testing"],
        steps: &[
            StepDef { id: "vcs", title: "Version control", category: "version-control", choice: None, guide_slug: Some("git-from-zero"), note: None },
            StepDef { id: "lang", title: "Your language", category: "programming-languages", choice: Some("language"), guide_slug: None, note: None },
            StepDef { id: "db", title: "Your database", category: "databases", choice: Some("database"), guide_slug: None, note: None },
            StepDef { id: "api", title: "API style", category: "architecture", choice: Some("api-style"), guide_slug: None, note: None },
            StepDef { id: "deploy", title: "Deployment", category: "devops", choice: Some("deployment"), guide_slug: None, note: None },
            StepDef { id: "test", title: "Testing", category: "architecture", choice: Some("testing"), guide_slug: None, note: None },
        ],
    },
    TrackDef {
        slug: "devops-engineer",
        name: "DevOps Engineer",
        blurb: "Ship and run other people's code: containers, pipelines, and keeping the lights on.",
        choices: &["deployment"],
        steps: &[
            StepDef { id: "vcs", title: "Version control", category: "version-control", choice: None, guide_slug: Some("git-from-zero"), note: None },
            StepDef { id: "deploy", title: "Containers & deployment", category: "devops", choice: Some("deployment"), guide_slug: None, note: None },
            StepDef { id: "cicd", title: "CI/CD pipelines", category: "devops", choice: None, guide_slug: None, note: Some("Automate build, test, and deploy.") },
            StepDef { id: "obs", title: "Observability", category: "performance", choice: None, guide_slug: None, note: Some("Logs, metrics, and traces for when it breaks.") },
        ],
    },
];

fn track_to_summary(t: &TrackDef) -> TrackSummary {
    let mut categories: Vec<String> = Vec::new();
    for st in t.steps {
        if !categories.iter().any(|c| c == st.category) {
            categories.push(st.category.to_string());
        }
    }
    TrackSummary {
        slug: t.slug.into(),
        name: t.name.into(),
        blurb: t.blurb.into(),
        step_count: t.steps.len(),
        categories,
    }
}

pub fn list_tracks() -> Vec<TrackSummary> {
    TRACKS.iter().map(track_to_summary).collect()
}

pub fn track_meta(slug: &str) -> Option<TrackSummary> {
    TRACKS.iter().find(|t| t.slug == slug).map(track_to_summary)
}

/// The choice dimensions a track declares (for its choice form).
pub fn dimensions_for(slug: &str) -> Option<Vec<ChoiceDimension>> {
    let t = TRACKS.iter().find(|t| t.slug == slug)?;
    Some(t.choices.iter().filter_map(|id| dimension(id)).collect())
}

/// Resolve a track into an ordered roadmap given the user's choices. `None` if the track is unknown.
pub fn resolve_roadmap(slug: &str, choices: &HashMap<String, String>, store: &Store) -> Result<Option<Vec<ResolvedStep>>, StoreError> {
    let track = match TRACKS.iter().find(|t| t.slug == slug) {
        Some(t) => t,
        None => return Ok(None),
    };
    let mut out = Vec::with_capacity(track.steps.len());
    for st in track.steps {
        let mut chosen_label: Option<String> = None;
        let guide_slug: Option<String> = if let Some(gs) = st.guide_slug {
            Some(gs.to_string())
        } else if let Some(dim_id) = st.choice {
            match choices.get(dim_id) {
                Some(val) => {
                    let dim = dimension(dim_id);
                    let chosen = dim.as_ref().and_then(|d| d.options.iter().find(|o| &o.value == val));
                    if let Some(o) = chosen {
                        chosen_label = Some(o.label.clone());
                        o.guide_slug.clone()
                    } else {
                        None
                    }
                }
                None => None,
            }
        } else {
            None
        };
        let guide = match &guide_slug {
            Some(s) => store.get_guide(s)?,
            None => None,
        };
        out.push(ResolvedStep {
            id: st.id.to_string(),
            title: st.title.to_string(),
            category: st.category.to_string(),
            note: st.note.map(|s| s.to_string()),
            choice: chosen_label,
            coming_soon: guide.is_none(),
            guide,
        });
    }
    Ok(Some(out))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn backend_track_resolves_git_and_marks_rest_coming_soon() {
        let s = Store::open_in_memory().unwrap();
        s.upsert_guide("git-from-zero", "Git", "x", "version-control", "beginner").unwrap();
        let mut choices = HashMap::new();
        choices.insert("language".to_string(), "go".to_string());
        let road = resolve_roadmap("backend-developer", &choices, &s).unwrap().unwrap();
        assert!(road[0].guide.is_some()); // version control → live git guide
        assert!(!road[0].coming_soon);
        assert!(road.iter().any(|st| st.coming_soon)); // language=go has no guide yet
        assert!(list_tracks().iter().any(|t| t.slug == "backend-developer"));
        assert!(resolve_roadmap("nope", &choices, &s).unwrap().is_none());
    }

    #[test]
    fn dimensions_and_summary() {
        assert_eq!(dimensions_for("backend-developer").unwrap().len(), 5);
        assert!(dimensions_for("nope").is_none());
        let t = track_meta("devops-engineer").unwrap();
        assert_eq!(t.name, "DevOps Engineer");
        assert!(t.categories.contains(&"devops".to_string()));
    }
}
