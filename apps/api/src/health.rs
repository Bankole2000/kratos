//! `GET /health` (API-001). No authentication. Used by load balancers, uptime checks and
//! the status screen in web and app.

use axum::Json;
use serde::Serialize;

#[derive(Serialize)]
pub struct Health {
    pub status: &'static str,
    /// The api crate's version from Cargo.toml.
    pub version: &'static str,
}

pub async fn health() -> Json<Health> {
    Json(Health {
        status: "ok",
        version: env!("CARGO_PKG_VERSION"),
    })
}
