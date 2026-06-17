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

const DEFS: &[Def] = &[
    Def { slug: "programming-languages", name: "Programming Languages", icon: "ti-code", blurb: "Languages and their features, explained the way they should have been." },
    Def { slug: "version-control", name: "Version Control", icon: "ti-git-branch", blurb: "Git and friends: what they actually do, and how to stay calm when they break." },
    Def { slug: "devops", name: "DevOps & Infra", icon: "ti-server", blurb: "Containers, CI/CD, servers, and the tools nobody hands you a map for." },
    Def { slug: "databases", name: "Databases", icon: "ti-database", blurb: "Schemas, queries, and the production lessons that come with them." },
    Def { slug: "architecture", name: "Architecture", icon: "ti-sitemap", blurb: "Designing systems that survive contact with real load and real teams." },
    Def { slug: "performance", name: "Performance", icon: "ti-gauge", blurb: "Finding the slow thing, and the tools that show you where it hides." },
    Def { slug: "security", name: "Security", icon: "ti-shield-lock", blurb: "The threats, the defaults, and the habits that keep you out of the news." },
];

/// Seed the canonical categories on first run. No-op if any category already exists.
pub fn seed_categories(store: &Store) -> Result<(), StoreError> {
    if store.categories_count()? > 0 {
        return Ok(());
    }
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
    fn seven_categories_in_order() {
        let store = Store::open_in_memory().unwrap();
        seed_categories(&store).unwrap();
        let cats = categories_with_counts(&store).unwrap();
        assert_eq!(cats.len(), 7);
        assert_eq!(cats[1].slug, "version-control");
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
        assert_eq!(categories_with_counts(&store).unwrap().len(), 7);
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
