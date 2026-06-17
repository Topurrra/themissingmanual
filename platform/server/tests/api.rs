use axum::body::Body;
use axum::http::{Request, StatusCode};
use tower::ServiceExt; // for `oneshot`

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
