//! `GET /health` (API-001). No authentication. Used by load balancers, uptime checks and
//! the status screen in web and app.
//!
//! Always answers 200, so a database outage shows up as `"status": "degraded"` instead of
//! the api looking dead.

use axum::Json;
use axum::extract::State;
use serde::Serialize;

use crate::AppState;
use crate::db;

#[derive(Serialize)]
pub struct Health {
    /// `"ok"` when everything is up, `"degraded"` when the database is down.
    pub status: &'static str,
    /// The api crate's version from Cargo.toml.
    pub version: &'static str,
    /// `"up"` or `"down"`.
    pub database: &'static str,
}

pub async fn health(State(state): State<AppState>) -> Json<Health> {
    let database_up = match db::ping(&state.db).await {
        Ok(()) => true,
        Err(error) => {
            // The error never contains the connection string.
            tracing::warn!(%error, "database health check failed");
            false
        }
    };

    Json(Health {
        status: if database_up { "ok" } else { "degraded" },
        version: env!("CARGO_PKG_VERSION"),
        database: if database_up { "up" } else { "down" },
    })
}
