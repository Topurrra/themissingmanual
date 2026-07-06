use serde::{Deserialize, Serialize};
use crate::models::{CategoryRow, GuideSummary};
use crate::store::{Store, StoreError};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Category {
    pub slug: String,
    pub name: String,
    pub icon: String,
    pub blurb: String,
    pub count: usize,
}

struct Def {
    slug: &'static str,
    name: &'static str,
    icon: &'static str,
    blurb: &'static str,
}

// The canonical taxonomy. Array order is the display order (sort_order = index).
// This is the source of truth - edit here to add/rename/reorder categories.
const DEFS: &[Def] = &[
    Def { slug: "logic", name: "Logic", icon: "ti-logic-and", blurb: "Clear reasoning from the ground up - true/false, if-then, proof, and spotting bad arguments. The thinking that sits under all code and math." },
    Def { slug: "mathematics", name: "Mathematics", icon: "ti-math-symbols", blurb: "The language reality is written in - sets, numbers, probability, and more - taught from intuition, for anyone who was told they're 'bad at math'." },
    Def { slug: "physics", name: "Physics", icon: "ti-atom", blurb: "How the physical world really works, in plain language - motion, energy, light, and the genuinely strange rules of the quantum world. The 'why' beneath the machine." },
    Def { slug: "operating-systems", name: "Operating Systems", icon: "ti-device-desktop", blurb: "Windows, macOS, and Linux - what they're really doing under the hood, from first login to power user." },
    Def { slug: "hardware", name: "Hardware", icon: "ti-cpu", blurb: "How the machine is actually built and talks to itself - from the chip to the device on your desk." },
    Def { slug: "networking", name: "Networking", icon: "ti-network", blurb: "How the internet really works, and how to design networks that hold up - from your home router to the enterprise." },
    Def { slug: "programming-concepts", name: "Programming Concepts", icon: "ti-bulb", blurb: "The ideas under every language - how code runs, data structures, async, memory, big-O, and choosing the right tool." },
    Def { slug: "programming-languages", name: "Programming Languages", icon: "ti-code", blurb: "Python, JavaScript, TypeScript, Java, C#, Go, and Rust - each language end to end, from zero to advanced." },
    Def { slug: "web-fundamentals", name: "Web Fundamentals", icon: "ti-world-www", blurb: "HTML, CSS, and how the browser actually works - the web platform itself, learned properly before any framework touches it." },
    Def { slug: "frameworks", name: "Frameworks & Libraries", icon: "ti-stack-2", blurb: "Django, FastAPI, React, Next, Spring Boot, and friends - the big frameworks and libraries, each tied to its language." },
    Def { slug: "version-control", name: "Version Control", icon: "ti-git-branch", blurb: "Git and friends: what they actually do, and how to stay calm when they break." },
    Def { slug: "debugging", name: "Debugging & Troubleshooting", icon: "ti-bug", blurb: "Reading the error, finding the real cause, and fixing it calmly instead of guessing." },
    Def { slug: "testing", name: "Testing", icon: "ti-test-pipe", blurb: "Unit, integration, end-to-end, and load tests - plus TDD/BDD - that actually catch the bug." },
    Def { slug: "databases", name: "Databases", icon: "ti-database", blurb: "Schemas, queries, and the production lessons that come with them." },
    Def { slug: "data-analytics", name: "Data & Analytics", icon: "ti-chart-histogram", blurb: "Data pipelines, engineering, BI, and the ML basics - turning raw data into answers you trust." },
    Def { slug: "apis", name: "APIs & Integration", icon: "ti-plug-connected", blurb: "REST, GraphQL, gRPC, webhooks, and message queues - how systems actually talk to each other." },
    Def { slug: "architecture", name: "Architecture", icon: "ti-sitemap", blurb: "Designing systems that survive contact with real load and real teams." },
    Def { slug: "devops", name: "DevOps", icon: "ti-infinity", blurb: "CI/CD, automation, and infrastructure as code - shipping safely and repeatedly." },
    Def { slug: "infrastructure", name: "Infrastructure & Cloud", icon: "ti-cloud", blurb: "Servers, containers, and cloud platforms - where your code actually runs." },
    Def { slug: "performance", name: "Performance", icon: "ti-gauge", blurb: "Finding the slow thing, and the tools that show you where it hides." },
    Def { slug: "security", name: "Security", icon: "ti-shield-lock", blurb: "The threats, the defaults, and the habits that keep you out of the news." },
    Def { slug: "ai-ml", name: "AI & Machine Learning", icon: "ti-brain", blurb: "Models, training, and putting AI into real products - without the hype or the hand-waving." },
    Def { slug: "working-with-ai", name: "Working with AI", icon: "ti-robot", blurb: "Practical AI for everyone, not just ML engineers - prompting, agents, CLIs, MCP, skills and plugins, context and loop engineering, and getting real work done with AI. The hype-free user's manual." },
    Def { slug: "no-code", name: "No-Code & Automation", icon: "ti-puzzle", blurb: "Build apps and automate work without (much) code - Zapier, Make, n8n, Airtable, Retool, and the enterprise low-code platforms. For founders, ops, analysts, and anyone who'd rather ship than wait for engineering." },
    Def { slug: "tooling", name: "Tools & Workflow", icon: "ti-tools", blurb: "The tools a job expects you to already know - migrations, build systems, message queues, CI/CD, containers, cloud, auth, and observability - each explained for the day you have to use it." },
    Def { slug: "projects", name: "Projects", icon: "ti-rocket", blurb: "Build real things end to end - small projects you follow step by step, with working code you can run in the browser or on your machine. The fastest way to make everything else stick." },
    Def { slug: "working-as-a-developer", name: "Working as a Developer", icon: "ti-briefcase", blurb: "The human side of the job nobody puts in a syllabus - code review, reading someone else's mess, asking good questions, surviving your first on-call, and interviews that don't feel like hazing." },
];

/// Upsert the canonical category taxonomy. `DEFS` is the source of truth, so this runs on every
/// boot/ingest - new categories appear and renames/reorders take effect. Categories created in the
/// admin console that aren't in `DEFS` are left untouched (this only upserts `DEFS` slugs).
pub fn seed_categories(store: &Store) -> Result<(), StoreError> {
    for (i, d) in DEFS.iter().enumerate() {
        store.upsert_category(&CategoryRow {
            slug: d.slug.to_string(),
            name: d.name.to_string(),
            icon: d.icon.to_string(),
            blurb: d.blurb.to_string(),
            sort_order: i as i64,
        })?;
    }
    Ok(())
}

fn row_to_category(row: CategoryRow, count: usize) -> Category {
    Category { slug: row.slug, name: row.name, icon: row.icon, blurb: row.blurb, count }
}

/// All categories from the DB, in display order, with live published-guide counts.
pub fn categories_with_counts(store: &Store) -> Result<Vec<Category>, StoreError> {
    let rows = store.list_categories_rows()?;
    let mut out = Vec::with_capacity(rows.len());
    for r in rows {
        let count = store.count_published_in_category(&r.slug)? as usize;
        out.push(row_to_category(r, count));
    }
    Ok(out)
}

/// One category plus its published guides; `None` if the slug isn't a known category.
pub fn category_with_guides(store: &Store, slug: &str) -> Result<Option<(Category, Vec<GuideSummary>)>, StoreError> {
    let row = match store.list_categories_rows()?.into_iter().find(|c| c.slug == slug) {
        Some(r) => r,
        None => return Ok(None),
    };
    let guides = store.guides_for_category(slug)?;
    let cat = row_to_category(row, guides.len());
    Ok(Some((cat, guides)))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn taxonomy_seeded_in_order() {
        let store = Store::open_in_memory().unwrap();
        seed_categories(&store).unwrap();
        let cats = categories_with_counts(&store).unwrap();
        assert_eq!(cats.len(), 27);
        assert_eq!(cats[0].slug, "logic"); // DEFS array order = display order; foundations lead
        assert_eq!(cats[1].slug, "mathematics");
        assert_eq!(cats[2].slug, "physics");
        assert!(cats.iter().any(|c| c.slug == "working-with-ai")); // practical-AI track (distinct from ai-ml)
        assert!(cats.iter().any(|c| c.slug == "no-code")); // no-code & automation
        assert!(cats.iter().any(|c| c.slug == "projects")); // build-along projects
        assert!(cats.iter().any(|c| c.slug == "working-as-a-developer")); // the human/job-skills shelf, sits last
        assert!(cats.iter().any(|c| c.slug == "version-control"));
        assert!(cats.iter().any(|c| c.slug == "infrastructure")); // the DevOps split
        assert!(cats.iter().any(|c| c.slug == "programming-concepts")); // split out of programming-languages
        assert!(cats.iter().any(|c| c.slug == "frameworks")); // frameworks sit beside the languages
        // concepts display before the languages themselves; the web platform sits
        // between the languages and the frameworks built on top of it
        let pos = |s: &str| cats.iter().position(|c| c.slug == s).unwrap();
        assert!(pos("programming-concepts") < pos("programming-languages"));
        assert!(pos("programming-languages") < pos("web-fundamentals"));
        assert!(pos("web-fundamentals") < pos("frameworks"));
        assert!(cats.iter().all(|c| c.count == 0));
    }

    #[test]
    fn counts_and_lookup() {
        let store = Store::open_in_memory().unwrap();
        seed_categories(&store).unwrap();
        store.upsert_guide("git", "Git", "x", "version-control", "beginner").unwrap();
        let cats = categories_with_counts(&store).unwrap();
        assert_eq!(cats.iter().find(|c| c.slug == "version-control").unwrap().count, 1);

        let (cat, guides) = category_with_guides(&store, "version-control").unwrap().unwrap();
        assert_eq!(cat.count, 1);
        assert_eq!(guides[0].slug, "git");
        assert!(category_with_guides(&store, "nope").unwrap().is_none());
    }

    #[test]
    fn seeding_is_idempotent() {
        let store = Store::open_in_memory().unwrap();
        seed_categories(&store).unwrap();
        seed_categories(&store).unwrap();
        assert_eq!(categories_with_counts(&store).unwrap().len(), 27);
    }

    #[test]
    fn draft_not_counted() {
        let store = Store::open_in_memory().unwrap();
        seed_categories(&store).unwrap();
        store.upsert_guide("d", "Draft", "x", "databases", "beginner").unwrap();
        store.set_guide_status("d", "draft").unwrap();
        let cats = categories_with_counts(&store).unwrap();
        assert_eq!(cats.iter().find(|c| c.slug == "databases").unwrap().count, 0);
    }
}
