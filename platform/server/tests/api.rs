use axum::body::Body;
use axum::http::{Request, StatusCode};
use tower::ServiceExt; // for `oneshot`
use content_core::{GuideSummary, SearchHit};

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
    assert_eq!(hits[0].phase_no, 3);

    let empty = app
        .oneshot(Request::builder().uri("/api/search?q=").body(Body::empty()).unwrap())
        .await.unwrap();
    assert_eq!(empty.status(), StatusCode::BAD_REQUEST);
}
