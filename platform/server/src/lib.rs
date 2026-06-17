pub mod routes;

/// Router with no state, for early tests (health only).
pub fn app_for_test() -> axum::Router {
    routes::health_router()
}
