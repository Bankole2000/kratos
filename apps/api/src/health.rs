//! `GET /health` (API-001). No authentication. Used by load balancers, uptime checks and
//! the status screen in web and app.
//!
//! Always answers 200, so a database outage shows up as `"status": "degraded"` instead of
//! the api looking dead.

use axum::Json;
use axum::extract::State;
use serde::Serialize;
use utoipa::ToSchema;

use crate::AppState;
use crate::db;
use crate::error::ErrorBody;

/// The body of `GET /health`.
#[derive(Serialize, ToSchema)]
pub struct Health {
    /// `ok` when everything is up, `degraded` when the database is down.
    pub status: HealthStatus,
    /// The api crate's version from Cargo.toml.
    #[schema(example = "0.1.0")]
    pub version: &'static str,
    /// Whether the database answered.
    pub database: DatabaseStatus,
}

/// Overall health. Written in JSON as `"ok"` or `"degraded"`.
#[derive(Serialize, ToSchema, Debug, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum HealthStatus {
    Ok,
    Degraded,
}

/// Database health. Written in JSON as `"up"` or `"down"`.
#[derive(Serialize, ToSchema, Debug, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum DatabaseStatus {
    Up,
    Down,
}

/// Reports whether the api and its database are up, and the api's version.
#[utoipa::path(
    get,
    path = "/health",
    tag = "health",
    responses(
        (status = 200, description = "The api is running. `status` is `degraded` when the database is down.", body = Health),
        (status = 500, description = "Unexpected failure (`internal_error`).", body = ErrorBody),
    )
)]
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
        status: if database_up {
            HealthStatus::Ok
        } else {
            HealthStatus::Degraded
        },
        version: env!("CARGO_PKG_VERSION"),
        database: if database_up {
            DatabaseStatus::Up
        } else {
            DatabaseStatus::Down
        },
    })
}
