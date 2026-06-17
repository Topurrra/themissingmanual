//! CLI: ingest the repo's guides into a SQLite DB + Tantivy index on disk.
//! Usage: ingest <repo_root> <data_dir>
use content_core::ingest::ingest_dir;
use content_core::store::Store;
use content_core::index::SearchIndex;

fn main() {
    let mut args = std::env::args().skip(1);
    let root = args.next().unwrap_or_else(|| ".".into());
    let data = args.next().unwrap_or_else(|| "./data".into());
    let data_dir = std::path::Path::new(&data);
    std::fs::create_dir_all(data_dir).expect("create data dir");

    let store = Store::open(&data_dir.join("content.db")).expect("open db");
    let index = SearchIndex::open_or_create(&data_dir.join("index")).expect("open index");
    match ingest_dir(std::path::Path::new(&root), &store, &index) {
        Ok(stats) => println!("ingested {} guides, {} phases", stats.guides, stats.phases),
        Err(e) => {
            eprintln!("ingest failed: {e}");
            std::process::exit(1);
        }
    }
}
