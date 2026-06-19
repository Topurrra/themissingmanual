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
        "language" => (
            "Language",
            vec![
                opt("python", "Python", Some("python-from-zero")),
                opt("javascript", "JavaScript / Node.js", Some("javascript-from-zero")),
                opt("go", "Go", Some("go-from-zero")),
                opt("rust", "Rust", Some("rust-from-zero")),
            ],
        ),
        // Per-database guides don't exist yet; options stay coming-soon until they do.
        "database" => ("Database", vec![opt("postgresql", "PostgreSQL", None), opt("mysql", "MySQL", None), opt("mongodb", "MongoDB", None), opt("sqlite", "SQLite", None)]),
        "api-style" => (
            "API style",
            vec![
                opt("rest", "REST", Some("rest-apis-explained")),
                opt("graphql", "GraphQL", Some("graphql-explained")),
                opt("grpc", "gRPC", Some("grpc-explained")),
            ],
        ),
        "deployment" => (
            "Deployment",
            vec![
                opt("docker", "Docker", Some("docker-without-the-magic")),
                opt("kubernetes", "Kubernetes", Some("kubernetes-without-the-hype")),
                opt("vps", "VPS", Some("deploying-to-a-vps")),
            ],
        ),
        "testing" => (
            "Testing",
            vec![
                opt("unit", "Unit-first", Some("your-first-unit-test")),
                opt("e2e", "End-to-end", Some("unit-integration-e2e")),
            ],
        ),
        _ => return None,
    };
    Some(ChoiceDimension { id: id.into(), label: label.into(), options })
}

const TRACKS: &[TrackDef] = &[
    TrackDef {
        slug: "backend-developer",
        name: "Backend Developer",
        blurb: "From version control to a deployed, tested service — the path a backend dev actually walks.",
        choices: &["language", "api-style", "deployment", "testing"],
        steps: &[
            StepDef { id: "vcs", title: "Version control", category: "version-control", choice: None, guide_slug: Some("git-from-zero"), note: None },
            StepDef { id: "lang", title: "Your language", category: "programming-languages", choice: Some("language"), guide_slug: None, note: None },
            StepDef { id: "db", title: "Databases", category: "databases", choice: None, guide_slug: Some("what-a-database-is"), note: None },
            StepDef { id: "api", title: "API style", category: "apis", choice: Some("api-style"), guide_slug: None, note: None },
            StepDef { id: "deploy", title: "Deployment", category: "infrastructure", choice: Some("deployment"), guide_slug: None, note: None },
            StepDef { id: "test", title: "Testing", category: "testing", choice: Some("testing"), guide_slug: None, note: None },
        ],
    },
    TrackDef {
        slug: "devops-engineer",
        name: "DevOps Engineer",
        blurb: "Ship and run other people's code: Linux, containers, pipelines, and keeping the lights on.",
        choices: &["deployment"],
        steps: &[
            StepDef { id: "vcs", title: "Version control", category: "version-control", choice: None, guide_slug: Some("git-from-zero"), note: None },
            StepDef { id: "linux", title: "Linux for servers", category: "operating-systems", choice: None, guide_slug: Some("linux-for-servers"), note: None },
            StepDef { id: "deploy", title: "Containers & deployment", category: "infrastructure", choice: Some("deployment"), guide_slug: None, note: None },
            StepDef { id: "cicd", title: "CI/CD pipelines", category: "devops", choice: None, guide_slug: Some("what-cicd-does"), note: None },
            StepDef { id: "obs", title: "Observability", category: "performance", choice: None, guide_slug: Some("observability-logs-metrics-traces"), note: None },
        ],
    },
    TrackDef {
        slug: "computer-foundations",
        name: "Computer Foundations",
        blurb: "How the machine actually works, bottom to top — hardware, the OS, networking, and the terminal.",
        choices: &[],
        steps: &[
            StepDef { id: "hardware", title: "How a computer works", category: "hardware", choice: None, guide_slug: Some("how-a-computer-works"), note: None },
            StepDef { id: "os", title: "What an operating system is", category: "operating-systems", choice: None, guide_slug: Some("what-an-operating-system-is"), note: None },
            StepDef { id: "net", title: "How the internet works", category: "networking", choice: None, guide_slug: Some("how-the-internet-works"), note: None },
            StepDef { id: "terminal", title: "The terminal & shell", category: "operating-systems", choice: None, guide_slug: Some("the-terminal-and-shell"), note: None },
        ],
    },
    TrackDef {
        slug: "observability-on-call",
        name: "Observability & On-Call",
        blurb: "Know what your system is doing — and stay calm when the pager goes off.",
        choices: &[],
        steps: &[
            StepDef { id: "logs", title: "Reading logs", category: "debugging", choice: None, guide_slug: Some("reading-logs-without-drowning"), note: None },
            StepDef { id: "obs", title: "Logs, metrics & traces", category: "performance", choice: None, guide_slug: Some("observability-logs-metrics-traces"), note: None },
            StepDef { id: "dashboards", title: "Dashboards & alerts", category: "performance", choice: None, guide_slug: Some("prometheus-and-grafana"), note: None },
            StepDef { id: "apm", title: "Reading an APM (Dynatrace)", category: "performance", choice: None, guide_slug: Some("reading-dynatrace"), note: None },
            StepDef { id: "incident", title: "When prod is down", category: "debugging", choice: None, guide_slug: Some("when-prod-is-down"), note: None },
        ],
    },
    TrackDef {
        slug: "data-engineer",
        name: "Data Engineer",
        blurb: "From spreadsheets to pipelines: move, store, and trust data at scale.",
        choices: &[],
        steps: &[
            StepDef { id: "intro", title: "What data engineering is", category: "data-analytics", choice: None, guide_slug: Some("what-is-data-engineering"), note: None },
            StepDef { id: "pipelines", title: "ETL & ELT pipelines", category: "data-analytics", choice: None, guide_slug: Some("etl-elt-pipelines"), note: None },
            StepDef { id: "storage", title: "Warehouses vs lakes", category: "data-analytics", choice: None, guide_slug: Some("warehouses-vs-lakes"), note: None },
            StepDef { id: "practice", title: "Spreadsheets → SQL → pipelines", category: "data-analytics", choice: None, guide_slug: Some("spreadsheets-to-sql-to-pipelines"), note: None },
            StepDef { id: "quality", title: "Data quality & observability", category: "data-analytics", choice: None, guide_slug: Some("data-quality-and-observability"), note: None },
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
        assert_eq!(dimensions_for("backend-developer").unwrap().len(), 4);
        assert!(dimensions_for("nope").is_none());
        let t = track_meta("devops-engineer").unwrap();
        assert_eq!(t.name, "DevOps Engineer");
        assert!(t.categories.contains(&"devops".to_string()));
    }

    #[test]
    fn language_choice_resolves_to_a_live_guide() {
        let s = Store::open_in_memory().unwrap();
        s.upsert_guide("python-from-zero", "Python", "x", "programming-languages", "beginner").unwrap();
        let mut choices = HashMap::new();
        choices.insert("language".to_string(), "python".to_string());
        let road = resolve_roadmap("backend-developer", &choices, &s).unwrap().unwrap();
        let lang = road.iter().find(|st| st.id == "lang").expect("language step");
        assert!(!lang.coming_soon, "the chosen language resolves to its live guide");
        assert_eq!(lang.choice.as_deref(), Some("Python"));
    }

    #[test]
    fn computer_foundations_is_fully_live() {
        let s = Store::open_in_memory().unwrap();
        for slug in ["how-a-computer-works", "what-an-operating-system-is", "how-the-internet-works", "the-terminal-and-shell"] {
            s.upsert_guide(slug, slug, "x", "hardware", "beginner").unwrap();
        }
        let road = resolve_roadmap("computer-foundations", &HashMap::new(), &s).unwrap().unwrap();
        assert_eq!(road.len(), 4);
        assert!(road.iter().all(|st| !st.coming_soon), "every foundations step is a live guide");
        assert!(list_tracks().iter().any(|t| t.slug == "computer-foundations"));
        assert_eq!(list_tracks().len(), 5, "two original + three new tracks");
    }
}
