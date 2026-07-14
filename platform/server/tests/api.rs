use axum::body::Body;
use axum::http::{Request, StatusCode};
use tower::ServiceExt; // for `oneshot`
use content_core::{Category, GuideSummary, SearchHit};

fn repo_root() -> std::path::PathBuf {
    std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../..").canonicalize().unwrap()
}

#[tokio::test]
async fn health_returns_ok() {
    let app = server::app_for_test();
    let res = app
        .oneshot(Request::builder().uri("/api/health").body(Body::empty()).unwrap())
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    let bytes = axum::body::to_bytes(res.into_body(), usize::MAX).await.unwrap();
    assert_eq!(&bytes[..], b"ok");
}

#[tokio::test]
async fn lists_guides() {
    let app = server::app(std::sync::Arc::new(server::AppState::build(&repo_root()).unwrap()));
    let res = app
        .oneshot(Request::builder().uri("/api/guides").body(Body::empty()).unwrap())
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    let bytes = axum::body::to_bytes(res.into_body(), usize::MAX).await.unwrap();
    let guides: Vec<GuideSummary> = serde_json::from_slice(&bytes).unwrap();
    assert!(guides.iter().any(|g| g.slug == "git-explained-like-a-human"));
}

#[tokio::test]
async fn guide_detail_and_404() {
    let state = std::sync::Arc::new(server::AppState::build(&repo_root()).unwrap());
    let app = server::app(state);

    let ok = app.clone()
        .oneshot(Request::builder().uri("/api/guides/git-explained-like-a-human").body(Body::empty()).unwrap())
        .await.unwrap();
    assert_eq!(ok.status(), StatusCode::OK);
    let bytes = axum::body::to_bytes(ok.into_body(), usize::MAX).await.unwrap();
    let v: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
    assert!(v["phases"].as_array().unwrap().len() >= 3);

    let missing = app
        .oneshot(Request::builder().uri("/api/guides/nope").body(Body::empty()).unwrap())
        .await.unwrap();
    assert_eq!(missing.status(), StatusCode::NOT_FOUND);
}

#[tokio::test]
async fn phase_detail_and_404() {
    let state = std::sync::Arc::new(server::AppState::build(&repo_root()).unwrap());
    let app = server::app(state);

    let ok = app.clone()
        .oneshot(Request::builder().uri("/api/guides/git-explained-like-a-human/1").body(Body::empty()).unwrap())
        .await.unwrap();
    assert_eq!(ok.status(), StatusCode::OK);
    let bytes = axum::body::to_bytes(ok.into_body(), usize::MAX).await.unwrap();
    let v: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
    assert!(v["html"].as_str().unwrap().contains("<"));

    let missing = app
        .oneshot(Request::builder().uri("/api/guides/git-explained-like-a-human/99").body(Body::empty()).unwrap())
        .await.unwrap();
    assert_eq!(missing.status(), StatusCode::NOT_FOUND);
}

#[tokio::test]
async fn search_returns_hits_and_rejects_empty() {
    let state = std::sync::Arc::new(server::AppState::build(&repo_root()).unwrap());
    let app = server::app(state);

    let res = app.clone()
        .oneshot(Request::builder().uri("/api/search?q=how%20to%20revert%20a%20commit").body(Body::empty()).unwrap())
        .await.unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    let bytes = axum::body::to_bytes(res.into_body(), usize::MAX).await.unwrap();
    let hits: Vec<SearchHit> = serde_json::from_slice(&bytes).unwrap();
    // A revert query must surface git-related content as the top hit (a git-* guide
    // or the practice-git module). Asserting an exact phase_no was too brittle -
    // content edits legitimately reorder near-ties among several git resources; this
    // invariant still fails if search actually regresses to something irrelevant.
    assert!(!hits.is_empty(), "revert query should return hits");
    assert!(
        hits[0].guide_slug.contains("git"),
        "top hit for a revert query should be git-related, got {} (phase {})",
        hits[0].guide_slug,
        hits[0].phase_no
    );

    let empty = app
        .oneshot(Request::builder().uri("/api/search?q=").body(Body::empty()).unwrap())
        .await.unwrap();
    assert_eq!(empty.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn lists_categories_with_counts() {
    let app = server::app(std::sync::Arc::new(server::AppState::build(&repo_root()).unwrap()));
    let res = app.oneshot(Request::builder().uri("/api/categories").body(Body::empty()).unwrap()).await.unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    let bytes = axum::body::to_bytes(res.into_body(), usize::MAX).await.unwrap();
    let cats: Vec<Category> = serde_json::from_slice(&bytes).unwrap();
    assert_eq!(cats.len(), 28); // DEFS taxonomy count (see categories.rs)
    assert!(cats.iter().find(|c| c.slug == "version-control").unwrap().count >= 1);
}

#[tokio::test]
async fn category_detail_and_404() {
    let state = std::sync::Arc::new(server::AppState::build(&repo_root()).unwrap());
    let app = server::app(state);
    let ok = app.clone().oneshot(Request::builder().uri("/api/categories/version-control").body(Body::empty()).unwrap()).await.unwrap();
    assert_eq!(ok.status(), StatusCode::OK);
    let bytes = axum::body::to_bytes(ok.into_body(), usize::MAX).await.unwrap();
    let v: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
    assert_eq!(v["category"]["slug"], "version-control");
    assert!(v["guides"].as_array().unwrap().len() >= 1);

    let missing = app.oneshot(Request::builder().uri("/api/categories/nope").body(Body::empty()).unwrap()).await.unwrap();
    assert_eq!(missing.status(), StatusCode::NOT_FOUND);
}

// ===== admin (B1) =====

fn admin_state() -> std::sync::Arc<server::AppState> {
    let hash = server::auth::hash_password("secret");
    std::sync::Arc::new(server::AppState::build(&repo_root()).unwrap().with_admin_hash(Some(hash)))
}

fn get(uri: &str) -> Request<Body> {
    Request::builder().uri(uri).body(Body::empty()).unwrap()
}
fn get_auth(uri: &str, cookie: &str) -> Request<Body> {
    Request::builder().uri(uri).header("cookie", cookie).body(Body::empty()).unwrap()
}
fn post_json(uri: &str, body: &str) -> Request<Body> {
    Request::builder().method("POST").uri(uri).header("content-type", "application/json").body(Body::from(body.to_string())).unwrap()
}
fn post_json_auth(uri: &str, body: &str, cookie: &str) -> Request<Body> {
    Request::builder().method("POST").uri(uri).header("content-type", "application/json").header("cookie", cookie).body(Body::from(body.to_string())).unwrap()
}
fn patch_json_auth(uri: &str, body: &str, cookie: &str) -> Request<Body> {
    Request::builder().method("PATCH").uri(uri).header("content-type", "application/json").header("cookie", cookie).body(Body::from(body.to_string())).unwrap()
}
fn put_json_auth(uri: &str, body: &str, cookie: &str) -> Request<Body> {
    Request::builder().method("PUT").uri(uri).header("content-type", "application/json").header("cookie", cookie).body(Body::from(body.to_string())).unwrap()
}
fn delete_auth(uri: &str, cookie: &str) -> Request<Body> {
    Request::builder().method("DELETE").uri(uri).header("cookie", cookie).body(Body::empty()).unwrap()
}

async fn login(app: &axum::Router) -> String {
    let r = app.clone().oneshot(post_json("/api/admin/login", r#"{"password":"secret"}"#)).await.unwrap();
    assert_eq!(r.status(), StatusCode::OK);
    r.headers().get("set-cookie").unwrap().to_str().unwrap().split(';').next().unwrap().to_string()
}
async fn public_guide_slugs(app: &axum::Router) -> Vec<String> {
    let r = app.clone().oneshot(get("/api/guides")).await.unwrap();
    let bytes = axum::body::to_bytes(r.into_body(), usize::MAX).await.unwrap();
    let gs: Vec<GuideSummary> = serde_json::from_slice(&bytes).unwrap();
    gs.into_iter().map(|g| g.slug).collect()
}
async fn search_count(app: &axum::Router, q: &str) -> usize {
    let r = app.clone().oneshot(get(&format!("/api/search?q={q}"))).await.unwrap();
    let bytes = axum::body::to_bytes(r.into_body(), usize::MAX).await.unwrap();
    let hits: Vec<SearchHit> = serde_json::from_slice(&bytes).unwrap();
    hits.len()
}

#[tokio::test]
async fn admin_auth_flow() {
    let app = server::app(admin_state());
    assert_eq!(app.clone().oneshot(get("/api/admin/me")).await.unwrap().status(), StatusCode::UNAUTHORIZED);
    assert_eq!(
        app.clone().oneshot(post_json("/api/admin/login", r#"{"password":"nope"}"#)).await.unwrap().status(),
        StatusCode::UNAUTHORIZED
    );
    let cookie = login(&app).await;
    assert_eq!(app.clone().oneshot(get_auth("/api/admin/me", &cookie)).await.unwrap().status(), StatusCode::OK);
    let logout = Request::builder().method("POST").uri("/api/admin/logout").header("cookie", &cookie).body(Body::empty()).unwrap();
    assert_eq!(app.oneshot(logout).await.unwrap().status(), StatusCode::OK);
}

#[tokio::test]
async fn admin_routes_require_auth() {
    let app = server::app(admin_state());
    let r = app
        .oneshot(post_json("/api/admin/guides", r#"{"slug":"x","title":"X","summary":"s","category":"databases","difficulty":"beginner"}"#))
        .await
        .unwrap();
    assert_eq!(r.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn admin_create_draft_then_publish() {
    let app = server::app(admin_state());
    let cookie = login(&app).await;
    let created = app
        .clone()
        .oneshot(post_json_auth(
            "/api/admin/guides",
            r#"{"slug":"new-topic","title":"New Topic","summary":"s","category":"databases","difficulty":"beginner"}"#,
            &cookie,
        ))
        .await
        .unwrap();
    assert_eq!(created.status(), StatusCode::CREATED);
    assert!(!public_guide_slugs(&app).await.contains(&"new-topic".to_string()), "draft hidden from public");

    let published = app
        .clone()
        .oneshot(patch_json_auth(
            "/api/admin/guides/new-topic",
            r#"{"title":"New Topic","summary":"s","category":"databases","difficulty":"beginner","status":"published"}"#,
            &cookie,
        ))
        .await
        .unwrap();
    assert_eq!(published.status(), StatusCode::OK);
    assert!(public_guide_slugs(&app).await.contains(&"new-topic".to_string()), "published guide is public");
}

#[tokio::test]
async fn admin_phase_create_and_search() {
    let app = server::app(admin_state());
    let cookie = login(&app).await;
    app.clone()
        .oneshot(post_json_auth(
            "/api/admin/guides",
            r#"{"slug":"zebras","title":"Zebras","summary":"about zebras","category":"databases","difficulty":"beginner"}"#,
            &cookie,
        ))
        .await
        .unwrap();
    let phase = app
        .clone()
        .oneshot(post_json_auth(
            "/api/admin/guides/zebras/phases",
            "{\"title\":\"Stripes\",\"summary\":\"about stripes\",\"markdown\":\"## Stripes\\n\\nZebras have unique quagga stripes.\"}",
            &cookie,
        ))
        .await
        .unwrap();
    assert_eq!(phase.status(), StatusCode::CREATED);
    assert_eq!(search_count(&app, "quagga").await, 0, "draft content must not be searchable");

    app.clone()
        .oneshot(patch_json_auth(
            "/api/admin/guides/zebras",
            r#"{"title":"Zebras","summary":"about zebras","category":"databases","difficulty":"beginner","status":"published"}"#,
            &cookie,
        ))
        .await
        .unwrap();
    assert!(search_count(&app, "quagga").await >= 1, "published content is searchable");
}

#[tokio::test]
async fn admin_preview_renders_markdown() {
    let app = server::app(admin_state());
    let cookie = login(&app).await;
    let r = app
        .oneshot(post_json_auth("/api/admin/preview", "{\"markdown\":\"## Hi\\n\\nsome code\"}", &cookie))
        .await
        .unwrap();
    assert_eq!(r.status(), StatusCode::OK);
    let bytes = axum::body::to_bytes(r.into_body(), usize::MAX).await.unwrap();
    let v: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
    assert!(v["html"].as_str().unwrap().contains("<h2>"));
}

#[tokio::test]
async fn admin_asset_roundtrip() {
    let app = server::app(admin_state());
    let cookie = login(&app).await;
    let boundary = "XBOUNDARY";
    let body = format!(
        "--{b}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"a.png\"\r\nContent-Type: image/png\r\n\r\nPNGDATA\r\n--{b}--\r\n",
        b = boundary
    );
    let upload = Request::builder()
        .method("POST")
        .uri("/api/admin/assets")
        .header("content-type", format!("multipart/form-data; boundary={boundary}"))
        .header("cookie", &cookie)
        .body(Body::from(body))
        .unwrap();
    let r = app.clone().oneshot(upload).await.unwrap();
    assert_eq!(r.status(), StatusCode::OK);
    let bytes = axum::body::to_bytes(r.into_body(), usize::MAX).await.unwrap();
    let v: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
    let url = v["url"].as_str().unwrap().to_string();

    let fetched = app.oneshot(get(&url)).await.unwrap();
    assert_eq!(fetched.status(), StatusCode::OK);
    assert_eq!(fetched.headers().get("content-type").unwrap(), "image/png");
    let bytes = axum::body::to_bytes(fetched.into_body(), usize::MAX).await.unwrap();
    assert_eq!(&bytes[..], b"PNGDATA");
}

#[tokio::test]
async fn events_ingest_and_validation() {
    let app = server::app(admin_state());
    let ok = app
        .clone()
        .oneshot(post_json("/api/events", r#"{"kind":"pageview","path":"/guides/x","visitor":"v1"}"#))
        .await
        .unwrap();
    assert_eq!(ok.status(), StatusCode::NO_CONTENT);
    let bad = app
        .oneshot(post_json("/api/events", r#"{"kind":"nope","path":"/","visitor":"v1"}"#))
        .await
        .unwrap();
    assert_eq!(bad.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn analytics_requires_auth_and_returns_shape() {
    let app = server::app(admin_state());
    assert_eq!(app.clone().oneshot(get("/api/admin/analytics")).await.unwrap().status(), StatusCode::UNAUTHORIZED);
    let cookie = login(&app).await;
    app.clone()
        .oneshot(post_json("/api/events", r#"{"kind":"pageview","path":"/","visitor":"vz"}"#))
        .await
        .unwrap();
    let res = app.oneshot(get_auth("/api/admin/analytics?days=30", &cookie)).await.unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    let bytes = axum::body::to_bytes(res.into_body(), usize::MAX).await.unwrap();
    let v: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
    assert!(v["views"].as_i64().unwrap() >= 1);
    assert!(v["topPaths"].is_array());
}

// (The learning-path "tracks" API was removed; /paths is now generated client-side
// from categories + guides, so there's no /api/tracks endpoint to test.)

// ===== hardening guards =====

#[tokio::test]
async fn events_require_beacon_key_when_configured() {
    let state = std::sync::Arc::new(
        server::AppState::build(&repo_root()).unwrap().with_beacon_key(Some("k".to_string())),
    );
    let app = server::app(state);

    // No key header → rejected.
    let no_key = app
        .clone()
        .oneshot(post_json("/api/events", r#"{"kind":"pageview","path":"/","visitor":"v"}"#))
        .await
        .unwrap();
    assert_eq!(no_key.status(), StatusCode::UNAUTHORIZED);

    // Correct key header → accepted.
    let with_key = Request::builder()
        .method("POST")
        .uri("/api/events")
        .header("content-type", "application/json")
        .header("x-beacon-key", "k")
        .body(Body::from(r#"{"kind":"pageview","path":"/","visitor":"v"}"#.to_string()))
        .unwrap();
    assert_eq!(app.oneshot(with_key).await.unwrap().status(), StatusCode::NO_CONTENT);
}

#[tokio::test]
async fn oversized_asset_is_rejected() {
    let hash = server::auth::hash_password("secret");
    let state = std::sync::Arc::new(
        server::AppState::build(&repo_root()).unwrap().with_admin_hash(Some(hash)).with_asset_max(4),
    );
    let app = server::app(state);
    let cookie = login(&app).await;

    let boundary = "XB";
    let body = format!(
        "--{b}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"a.png\"\r\nContent-Type: image/png\r\n\r\nPNGDATA\r\n--{b}--\r\n",
        b = boundary
    );
    let upload = Request::builder()
        .method("POST")
        .uri("/api/admin/assets")
        .header("content-type", format!("multipart/form-data; boundary={boundary}"))
        .header("cookie", &cookie)
        .body(Body::from(body))
        .unwrap();
    // "PNGDATA" is 7 bytes > the 4-byte cap.
    assert_eq!(app.oneshot(upload).await.unwrap().status(), StatusCode::PAYLOAD_TOO_LARGE);
}

#[tokio::test]
async fn admin_change_password_takes_effect() {
    let app = server::app(admin_state()); // initial admin password is "secret"
    let cookie = login(&app).await;

    // Wrong current password → rejected.
    let wrong = app
        .clone()
        .oneshot(post_json_auth(
            "/api/admin/password",
            r#"{"current_password":"nope","new_password":"newsecret1"}"#,
            &cookie,
        ))
        .await
        .unwrap();
    assert_eq!(wrong.status(), StatusCode::UNAUTHORIZED);

    // Correct current password → changed.
    let ok = app
        .clone()
        .oneshot(post_json_auth(
            "/api/admin/password",
            r#"{"current_password":"secret","new_password":"newsecret1"}"#,
            &cookie,
        ))
        .await
        .unwrap();
    assert_eq!(ok.status(), StatusCode::OK);

    // Old password no longer logs in; the new one does.
    let old = app
        .clone()
        .oneshot(post_json("/api/admin/login", r#"{"password":"secret"}"#))
        .await
        .unwrap();
    assert_eq!(old.status(), StatusCode::UNAUTHORIZED);
    let new = app
        .oneshot(post_json("/api/admin/login", r#"{"password":"newsecret1"}"#))
        .await
        .unwrap();
    assert_eq!(new.status(), StatusCode::OK);
}

#[tokio::test]
async fn rss_feed_lists_published_guides() {
    let app = server::app(std::sync::Arc::new(server::AppState::build(&repo_root()).unwrap()));
    let res = app.oneshot(get("/api/rss")).await.unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    assert_eq!(
        res.headers().get("content-type").unwrap(),
        "application/rss+xml; charset=utf-8"
    );
    let bytes = axum::body::to_bytes(res.into_body(), usize::MAX).await.unwrap();
    let xml = String::from_utf8(bytes.to_vec()).unwrap();
    assert!(xml.contains("<rss version=\"2.0\""));
    assert!(xml.contains("/guides/git-explained-like-a-human"));
    assert!(xml.contains("<pubDate>")); // feed carries dates now
}

// ===== admin console - first wave (bulk · settings · feedback · status · backlog) =====

#[tokio::test]
async fn bulk_recategorize_and_guards() {
    let app = server::app(admin_state());
    let cookie = login(&app).await;

    // auth required
    let unauth = app.clone().oneshot(post_json("/api/admin/guides/bulk", r#"{"action":"publish","slugs":["git-from-zero"]}"#)).await.unwrap();
    assert_eq!(unauth.status(), StatusCode::UNAUTHORIZED);

    // unknown action + missing value → 400
    let bad = app.clone().oneshot(post_json_auth("/api/admin/guides/bulk", r#"{"action":"frobnicate","slugs":["git-from-zero"]}"#, &cookie)).await.unwrap();
    assert_eq!(bad.status(), StatusCode::BAD_REQUEST);
    let noval = app.clone().oneshot(post_json_auth("/api/admin/guides/bulk", r#"{"action":"recategorize","slugs":["git-from-zero"]}"#, &cookie)).await.unwrap();
    assert_eq!(noval.status(), StatusCode::BAD_REQUEST);

    // recategorize one guide and confirm it stuck
    let ok = app.clone().oneshot(post_json_auth("/api/admin/guides/bulk", r#"{"action":"recategorize","slugs":["git-from-zero"],"value":"apis"}"#, &cookie)).await.unwrap();
    assert_eq!(ok.status(), StatusCode::OK);
    let bytes = axum::body::to_bytes(ok.into_body(), usize::MAX).await.unwrap();
    let v: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
    assert_eq!(v["affected"], 1);
    let g = app.oneshot(get_auth("/api/admin/guides/git-from-zero", &cookie)).await.unwrap();
    let bytes = axum::body::to_bytes(g.into_body(), usize::MAX).await.unwrap();
    let v: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
    assert_eq!(v["guide"]["category"], "apis");
}

#[tokio::test]
async fn settings_whitelist_and_public_config() {
    let app = server::app(admin_state());
    let cookie = login(&app).await;

    // PUT a whitelisted key + an attempt to overwrite the admin hash (must be ignored)
    let put = app.clone().oneshot(put_json_auth("/api/admin/settings", r#"{"site_name":"TMM","flag_lofi":"1","admin_password_hash":"hacked"}"#, &cookie)).await.unwrap();
    assert_eq!(put.status(), StatusCode::OK);
    let bytes = axum::body::to_bytes(put.into_body(), usize::MAX).await.unwrap();
    let v: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
    let updated: Vec<String> = serde_json::from_value(v["updated"].clone()).unwrap();
    assert!(updated.contains(&"site_name".to_string()));
    assert!(!updated.contains(&"admin_password_hash".to_string()), "credentials are not editable via settings");

    // public site-config reflects it and never exposes the hash
    let cfg = app.clone().oneshot(get("/api/site-config")).await.unwrap();
    assert_eq!(cfg.status(), StatusCode::OK);
    let bytes = axum::body::to_bytes(cfg.into_body(), usize::MAX).await.unwrap();
    let v: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
    assert_eq!(v["site_name"], "TMM");
    assert!(v.get("admin_password_hash").is_none());

    // the admin password was untouched → original login still works
    assert_eq!(app.oneshot(post_json("/api/admin/login", r#"{"password":"secret"}"#)).await.unwrap().status(), StatusCode::OK);
}

#[tokio::test]
async fn feedback_submit_and_inbox() {
    let app = server::app(admin_state());

    // bad vote → 400
    let bad = app.clone().oneshot(post_json("/api/feedback", r#"{"guide_slug":"git-from-zero","phase_no":1,"vote":"meh"}"#)).await.unwrap();
    assert_eq!(bad.status(), StatusCode::BAD_REQUEST);

    // public submit → 204
    let ok = app.clone().oneshot(post_json("/api/feedback", r#"{"guide_slug":"git-from-zero","phase_no":1,"vote":"up","note":"clear!"}"#)).await.unwrap();
    assert_eq!(ok.status(), StatusCode::NO_CONTENT);

    // admin inbox needs auth and shows the entry
    assert_eq!(app.clone().oneshot(get("/api/admin/feedback")).await.unwrap().status(), StatusCode::UNAUTHORIZED);
    let cookie = login(&app).await;
    let inbox = app.oneshot(get_auth("/api/admin/feedback", &cookie)).await.unwrap();
    assert_eq!(inbox.status(), StatusCode::OK);
    let bytes = axum::body::to_bytes(inbox.into_body(), usize::MAX).await.unwrap();
    let v: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
    assert_eq!(v[0]["vote"], "up");
    assert_eq!(v[0]["guide_slug"], "git-from-zero");
}

#[tokio::test]
async fn status_and_backlog_endpoints() {
    let app = server::app(admin_state());
    assert_eq!(app.clone().oneshot(get("/api/admin/status")).await.unwrap().status(), StatusCode::UNAUTHORIZED);
    let cookie = login(&app).await;

    let st = app.clone().oneshot(get_auth("/api/admin/status", &cookie)).await.unwrap();
    assert_eq!(st.status(), StatusCode::OK);
    let bytes = axum::body::to_bytes(st.into_body(), usize::MAX).await.unwrap();
    let v: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
    assert!(v["version"].is_string());
    assert!(v["guides"]["total"].as_i64().unwrap() > 0);
    assert!(v["dbSizeBytes"].as_i64().unwrap() > 0);

    let bl = app.oneshot(get_auth("/api/admin/backlog?days=30", &cookie)).await.unwrap();
    assert_eq!(bl.status(), StatusCode::OK);
    let bytes = axum::body::to_bytes(bl.into_body(), usize::MAX).await.unwrap();
    let v: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
    assert!(v["items"].is_array());
}

// ===== admin console - second wave (revisions/revert · reorder · link audit) =====

#[tokio::test]
async fn phase_revisions_and_revert() {
    let app = server::app(admin_state());
    let cookie = login(&app).await;

    // original markdown of git-from-zero phase 1
    let orig = app.clone().oneshot(get_auth("/api/admin/guides/git-from-zero/phases/1", &cookie)).await.unwrap();
    let bytes = axum::body::to_bytes(orig.into_body(), usize::MAX).await.unwrap();
    let ov: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
    let orig_md = ov["markdown"].as_str().unwrap().to_string();

    // edit it (snapshots the pre-edit version)
    let edit = app.clone().oneshot(patch_json_auth(
        "/api/admin/guides/git-from-zero/phases/1",
        r##"{"title":"Edited","summary":"edited","markdown":"# Edited body"}"##,
        &cookie,
    )).await.unwrap();
    assert_eq!(edit.status(), StatusCode::OK);

    // history now lists the pre-edit revision
    let hist = app.clone().oneshot(get_auth("/api/admin/guides/git-from-zero/phases/1/revisions", &cookie)).await.unwrap();
    assert_eq!(hist.status(), StatusCode::OK);
    let bytes = axum::body::to_bytes(hist.into_body(), usize::MAX).await.unwrap();
    let revs: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
    let rev_id = revs[0]["id"].as_i64().unwrap();

    // revert restores the original markdown
    let revert = app.clone().oneshot(post_json_auth(&format!("/api/admin/revisions/{rev_id}/revert"), "{}", &cookie)).await.unwrap();
    assert_eq!(revert.status(), StatusCode::OK);
    let now = app.oneshot(get_auth("/api/admin/guides/git-from-zero/phases/1", &cookie)).await.unwrap();
    let bytes = axum::body::to_bytes(now.into_body(), usize::MAX).await.unwrap();
    let nv: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
    assert_eq!(nv["markdown"].as_str().unwrap(), orig_md);
}

#[tokio::test]
async fn reorder_guides_persists() {
    let app = server::app(admin_state());
    let cookie = login(&app).await;
    let r = app.clone().oneshot(post_json_auth(
        "/api/admin/guides/reorder",
        r#"{"order":["git-from-zero","git-explained-like-a-human"]}"#,
        &cookie,
    )).await.unwrap();
    assert_eq!(r.status(), StatusCode::OK);
    // version-control category now lists git-from-zero first (sort_order 0)
    let cat = app.oneshot(get("/api/categories/version-control")).await.unwrap();
    let bytes = axum::body::to_bytes(cat.into_body(), usize::MAX).await.unwrap();
    let v: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
    assert_eq!(v["guides"][0]["slug"], "git-from-zero");
}

#[tokio::test]
async fn link_audit_runs() {
    let app = server::app(admin_state());
    assert_eq!(app.clone().oneshot(get("/api/admin/health-check")).await.unwrap().status(), StatusCode::UNAUTHORIZED);
    let cookie = login(&app).await;
    let r = app.oneshot(get_auth("/api/admin/health-check", &cookie)).await.unwrap();
    assert_eq!(r.status(), StatusCode::OK);
    let bytes = axum::body::to_bytes(r.into_body(), usize::MAX).await.unwrap();
    let v: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
    assert!(v["broken_links"].is_array());
    assert!(v["missing_assets"].is_array());
    assert!(v["orphaned_assets"].is_array());
}

#[tokio::test]
async fn delete_orphaned_assets_removes_unreferenced() {
    let app = server::app(admin_state());
    assert_eq!(
        app.clone().oneshot(delete_auth("/api/admin/orphaned-assets", "")).await.unwrap().status(),
        StatusCode::UNAUTHORIZED
    );
    let cookie = login(&app).await;

    // Upload an asset no phase references → it's an orphan.
    let boundary = "XORPHAN";
    let body = format!(
        "--{b}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"a.png\"\r\nContent-Type: image/png\r\n\r\nPNGDATA\r\n--{b}--\r\n",
        b = boundary
    );
    let upload = Request::builder()
        .method("POST")
        .uri("/api/admin/assets")
        .header("content-type", format!("multipart/form-data; boundary={boundary}"))
        .header("cookie", &cookie)
        .body(Body::from(body))
        .unwrap();
    let r = app.clone().oneshot(upload).await.unwrap();
    assert_eq!(r.status(), StatusCode::OK);
    let bytes = axum::body::to_bytes(r.into_body(), usize::MAX).await.unwrap();
    let url = serde_json::from_slice::<serde_json::Value>(&bytes).unwrap()["url"].as_str().unwrap().to_string();

    // The audit now reports exactly this orphan.
    let r = app.clone().oneshot(get_auth("/api/admin/health-check", &cookie)).await.unwrap();
    let bytes = axum::body::to_bytes(r.into_body(), usize::MAX).await.unwrap();
    let v: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
    assert_eq!(v["orphaned_assets"].as_array().unwrap().len(), 1);

    // Delete orphans → reports one removed.
    let r = app.clone().oneshot(delete_auth("/api/admin/orphaned-assets", &cookie)).await.unwrap();
    assert_eq!(r.status(), StatusCode::OK);
    let bytes = axum::body::to_bytes(r.into_body(), usize::MAX).await.unwrap();
    let v: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
    assert_eq!(v["deleted"], 1);

    // Asset is gone and the audit is clean.
    assert_eq!(app.clone().oneshot(get(&url)).await.unwrap().status(), StatusCode::NOT_FOUND);
    let r = app.oneshot(get_auth("/api/admin/health-check", &cookie)).await.unwrap();
    let bytes = axum::body::to_bytes(r.into_body(), usize::MAX).await.unwrap();
    let v: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
    assert_eq!(v["orphaned_assets"].as_array().unwrap().len(), 0);
}

#[test]
fn content_sync_reimports_only_when_files_change() {
    let dir = tempfile::tempdir().unwrap();
    let write_guide = |slug: &str| {
        let g = dir.path().join("guides").join(slug);
        std::fs::create_dir_all(&g).unwrap();
        std::fs::write(
            g.join("_guide.md"),
            format!("---\ntitle: \"{slug}\"\nguide: \"{slug}\"\nphase: 0\nsummary: \"s\"\ntags: [demo]\ncategory: databases\ndifficulty: beginner\nsynonyms: []\nupdated: 2026-06-18\n---\n# {slug}\n"),
        )
        .unwrap();
    };
    write_guide("demo");

    let state = server::AppState::build(dir.path()).unwrap();
    // First sync establishes the baseline signature (re-imports once).
    assert!(state.sync_content(false).unwrap().is_some());
    // Nothing changed on disk → no re-import.
    assert!(state.sync_content(false).unwrap().is_none());
    // force=true re-imports even when the files are unchanged (boot / manual sync).
    assert!(state.sync_content(true).unwrap().is_some());
    // A new guide folder appears → the sync imports it.
    write_guide("demo2");
    assert!(state.sync_content(false).unwrap().is_some());
    let slugs: Vec<String> = state
        .store
        .lock()
        .unwrap()
        .list_all_guides()
        .unwrap()
        .into_iter()
        .map(|g| g.slug)
        .collect();
    assert!(slugs.contains(&"demo2".to_string()), "new guide synced from files");
}

#[tokio::test]
async fn admin_sync_requires_auth() {
    let app = server::app(admin_state());
    assert_eq!(
        app.clone().oneshot(post_json("/api/admin/sync", "{}")).await.unwrap().status(),
        StatusCode::UNAUTHORIZED
    );
    let cookie = login(&app).await;
    let r = app.oneshot(post_json_auth("/api/admin/sync", "{}", &cookie)).await.unwrap();
    assert_eq!(r.status(), StatusCode::OK);
}
