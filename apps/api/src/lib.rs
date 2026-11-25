//! Platform Core API. `main.rs` starts the server; everything else lives in this library so
//! integration tests in `tests/` can build the same router without opening a port.

pub mod config;
pub mod db;
pub mod error;
pub mod health;
pub mod logging;
pub mod openapi;
pub mod request_id;

// Shared domain types (packages/types), re-exported so handlers and tests use `api::types::...`.
pub use types;

use std::any::Any;

use axum::Router;
use axum::middleware;
use axum::response::{IntoResponse, Response};
use axum::routing::get;
use sqlx::PgPool;
use tower_http::catch_panic::CatchPanicLayer;

use crate::error::ApiError;

/// Shared state handed to handlers through Axum's `State` extractor. Cloning is cheap:
/// `PgPool` is a handle to one shared pool.
#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
}

/// Builds the full router: the routes plus the shared layers.
pub fn app(state: AppState) -> Router {
    with_layers(routes(state))
}

/// Every route the api serves. Unversioned routes (only `/health`) sit at the top level;
/// everything else goes under `/v1`. `with_state` gives every handler access to `state`.
pub fn routes(state: AppState) -> Router {
    Router::new()
        .route("/health", get(health::health))
        .nest("/v1", v1_routes())
        .with_state(state)
}

/// Adds the error fallbacks and middleware to `router`. Layers run outside-in: the request
/// ID middleware is outermost, so it sees every response, including 404s and panics turned
/// into 500s. Tests use this to wrap extra routes exactly as the real app does.
pub fn with_layers(router: Router) -> Router {
    router
        .fallback(not_found)
        .method_not_allowed_fallback(method_not_allowed)
        .layer(CatchPanicLayer::custom(panic_to_error))
        .layer(middleware::from_fn(request_id::request_id))
}

/// Every versioned endpoint is added here. Empty until the first feature task.
fn v1_routes() -> Router<AppState> {
    Router::new()
}

async fn not_found() -> ApiError {
    ApiError::not_found()
}

async fn method_not_allowed() -> ApiError {
    ApiError::method_not_allowed()
}

/// A panic in a handler becomes a 500 with no internal details. The panic message is logged.
fn panic_to_error(panic: Box<dyn Any + Send + 'static>) -> Response {
    let detail = if let Some(text) = panic.downcast_ref::<&str>() {
        text.to_string()
    } else if let Some(text) = panic.downcast_ref::<String>() {
        text.clone()
    } else {
        "unknown panic".to_string()
    };
    tracing::error!(panic = %detail, "handler panicked");
    ApiError::internal().into_response()
}
