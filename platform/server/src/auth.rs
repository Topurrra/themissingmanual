use std::net::{IpAddr, Ipv4Addr, SocketAddr};
use std::sync::Arc;
use std::time::{Duration, Instant};
use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use axum::{
    extract::{ConnectInfo, Request, State},
    http::StatusCode,
    middleware::Next,
    response::{IntoResponse, Response},
    Json,
};
use axum_extra::extract::cookie::{Cookie, CookieJar, SameSite};
use rand::RngCore;
use serde::Deserialize;
use serde_json::json;
use crate::state::AppState;

const COOKIE: &str = "admin_session";
const RL_WINDOW: Duration = Duration::from_secs(300);
const RL_MAX: u32 = 5;

/// Hash a plaintext password with Argon2 (for `ADMIN_PASSWORD_HASH`).
pub fn hash_password(pw: &str) -> String {
    let salt = SaltString::generate(&mut OsRng);
    Argon2::default()
        .hash_password(pw.as_bytes(), &salt)
        .expect("argon2 hash")
        .to_string()
}

pub fn verify_password(hash: &str, pw: &str) -> bool {
    match PasswordHash::new(hash) {
        Ok(parsed) => Argon2::default().verify_password(pw.as_bytes(), &parsed).is_ok(),
        Err(_) => false,
    }
}

fn new_session_id() -> String {
    let mut b = [0u8; 32];
    rand::thread_rng().fill_bytes(&mut b);
    b.iter().map(|x| format!("{:02x}", x)).collect()
}

fn is_authed(state: &AppState, jar: &CookieJar) -> bool {
    match jar.get(COOKIE) {
        Some(c) => {
            let store = state.store.lock().unwrap();
            store.session_valid(c.value()).unwrap_or(false)
        }
        None => false,
    }
}

fn rate_limited(state: &AppState, ip: IpAddr) -> bool {
    let map = state.login_attempts.lock().unwrap();
    match map.get(&ip) {
        Some((count, when)) => when.elapsed() < RL_WINDOW && *count >= RL_MAX,
        None => false,
    }
}

fn record_fail(state: &AppState, ip: IpAddr) {
    let mut map = state.login_attempts.lock().unwrap();
    let now = Instant::now();
    let e = map.entry(ip).or_insert((0, now));
    if e.1.elapsed() >= RL_WINDOW {
        *e = (0, now);
    }
    e.0 += 1;
}

fn clear_fails(state: &AppState, ip: IpAddr) {
    state.login_attempts.lock().unwrap().remove(&ip);
}

#[derive(Deserialize)]
pub struct LoginReq {
    password: String,
}

pub async fn login(
    State(state): State<Arc<AppState>>,
    jar: CookieJar,
    conn: Option<ConnectInfo<SocketAddr>>,
    Json(body): Json<LoginReq>,
) -> Response {
    let ip = conn.map(|c| c.0.ip()).unwrap_or(IpAddr::V4(Ipv4Addr::UNSPECIFIED));
    if rate_limited(&state, ip) {
        return (StatusCode::TOO_MANY_REQUESTS, Json(json!({ "error": "too many attempts" }))).into_response();
    }
    let hash = {
        let store = state.store.lock().unwrap();
        match store.get_admin_hash() {
            Ok(Some(h)) => h,
            Ok(None) => return (StatusCode::UNAUTHORIZED, Json(json!({ "error": "admin not configured" }))).into_response(),
            Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))).into_response(),
        }
    };
    if !verify_password(&hash, &body.password) {
        record_fail(&state, ip);
        return (StatusCode::UNAUTHORIZED, Json(json!({ "error": "invalid password" }))).into_response();
    }
    clear_fails(&state, ip);
    let id = new_session_id();
    {
        let store = state.store.lock().unwrap();
        if let Err(e) = store.create_session(&id) {
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))).into_response();
        }
    }
    // Session cookie (no Max-Age): the DB session is the real 30-day authority.
    // `cookie_secure` (COOKIE_SECURE=1) marks it Secure for HTTPS production.
    let secure = state.cookie_secure;
    let cookie = Cookie::build((COOKIE, id))
        .http_only(true)
        .same_site(SameSite::Strict)
        .secure(secure)
        .path("/")
        .build();
    (jar.add(cookie), Json(json!({ "ok": true }))).into_response()
}

pub async fn logout(State(state): State<Arc<AppState>>, jar: CookieJar) -> Response {
    if let Some(c) = jar.get(COOKIE) {
        let store = state.store.lock().unwrap();
        let _ = store.delete_session(c.value());
    }
    let removal = Cookie::build((COOKIE, "")).path("/").build();
    (jar.remove(removal), Json(json!({ "ok": true }))).into_response()
}

pub async fn me(State(state): State<Arc<AppState>>, jar: CookieJar) -> Response {
    if is_authed(&state, &jar) {
        Json(json!({ "authed": true })).into_response()
    } else {
        (StatusCode::UNAUTHORIZED, Json(json!({ "authed": false }))).into_response()
    }
}

#[derive(Deserialize)]
pub struct ChangePassword {
    current_password: String,
    new_password: String,
}

/// Change the admin password (behind `require_admin`). Verifies the current password,
/// then stores a new argon2 hash. Takes effect immediately — the DB is authoritative.
pub async fn change_password(State(state): State<Arc<AppState>>, Json(b): Json<ChangePassword>) -> Response {
    if b.new_password.len() < 8 {
        return (StatusCode::BAD_REQUEST, Json(json!({ "error": "new password must be at least 8 characters" }))).into_response();
    }
    let store = state.store.lock().unwrap();
    let current = match store.get_admin_hash() {
        Ok(Some(h)) => h,
        Ok(None) => return (StatusCode::UNAUTHORIZED, Json(json!({ "error": "admin not configured" }))).into_response(),
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))).into_response(),
    };
    if !verify_password(&current, &b.current_password) {
        return (StatusCode::UNAUTHORIZED, Json(json!({ "error": "current password is incorrect" }))).into_response();
    }
    match store.set_admin_hash(&hash_password(&b.new_password)) {
        Ok(_) => Json(json!({ "ok": true })).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))).into_response(),
    }
}

/// Middleware guarding the admin content routes.
pub async fn require_admin(
    State(state): State<Arc<AppState>>,
    jar: CookieJar,
    req: Request,
    next: Next,
) -> Response {
    if is_authed(&state, &jar) {
        next.run(req).await
    } else {
        (StatusCode::UNAUTHORIZED, Json(json!({ "error": "unauthorized" }))).into_response()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn hash_roundtrip() {
        let h = hash_password("correct horse");
        assert!(verify_password(&h, "correct horse"));
        assert!(!verify_password(&h, "wrong"));
        assert!(!verify_password("not-a-hash", "x"));
    }
}
