//! `GET /health` (API-001). No authentication. Used by load balancers, uptime checks and
//! the status screen in web and app.

use axum::Json;
use serde::Serialize;
use utoipa::ToSchema;

use crate::error::ErrorBody;

/// The body of `GET /health`.
#[derive(Serialize, ToSchema)]
pub struct Health {
    /// Always `ok` while the api is running.
    #[schema(example = "ok")]
    pub status: &'static str,
    /// The api crate's version from Cargo.toml.
    #[schema(example = "0.1.0")]
    pub version: &'static str,
}

/// Reports that the api is running, and its version.
#[utoipa::path(
    get,
    path = "/health",
    tag = "health",
    responses(
        (status = 200, description = "The api is running.", body = Health),
        (status = 500, description = "Unexpected failure (`internal_error`).", body = ErrorBody),
    )
)]
pub async fn health() -> Json<Health> {
    Json(Health {
        status: "ok",
        version: env!("CARGO_PKG_VERSION"),
    })
}
