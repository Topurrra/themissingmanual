pub mod routes;
pub mod state;

pub use routes::{app, health_router};
pub use state::AppState;

/// Router with no state, for early tests (health only).
pub fn app_for_test() -> axum::Router {
    routes::health_router()
}
