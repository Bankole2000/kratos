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
use std::time::Duration;

use axum::Router;
use axum::http::{HeaderName, HeaderValue, Method, header};
use axum::middleware;
use axum::response::{IntoResponse, Response};
use axum::routing::get;
use sqlx::PgPool;
use tower_http::catch_panic::CatchPanicLayer;
use tower_http::cors::{AllowOrigin, CorsLayer};

use crate::error::ApiError;

/// Shared state handed to handlers through Axum's `State` extractor. Cloning is cheap:
/// `PgPool` is a handle to one shared pool.
#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
}

/// Builds the full router: the routes plus the shared layers. `cors_origins` are the origins
/// allowed to call the api from a browser or WebView (`Config::cors_origins`).
pub fn app(state: AppState, cors_origins: &[HeaderValue]) -> Router {
    with_layers(routes(state), cors_origins)
}

/// Every route the api serves. Unversioned routes (only `/health`) sit at the top level;
/// everything else goes under `/v1`. `with_state` gives every handler access to `state`.
pub fn routes(state: AppState) -> Router {
    Router::new()
        .route("/health", get(health::health))
        .nest("/v1", v1_routes())
        .with_state(state)
}

/// Adds the error fallbacks and middleware to `router`. Each `.layer` wraps everything above
/// it, so the last one is outermost and runs first. The request ID middleware is outermost,
/// so it sees every response, including CORS preflights, 404s and panics turned into 500s.
/// Tests use this to wrap extra routes exactly as the real app does.
pub fn with_layers(router: Router, cors_origins: &[HeaderValue]) -> Router {
    router
        .fallback(not_found)
        .method_not_allowed_fallback(method_not_allowed)
        .layer(CatchPanicLayer::custom(panic_to_error))
        .layer(cors(cors_origins))
        .layer(middleware::from_fn(request_id::request_id))
}

/// CORS (FR-035): lets the web dashboard and the Tauri app, which run on other origins, call
/// the api. Only the listed origins are allowed, never `*`. The layer answers preflight
/// (`OPTIONS`) requests itself, without calling a handler. A request from an unlisted origin gets no
/// `Access-Control-Allow-Origin` header, so the browser blocks it. Credentials (cookies) are
/// not allowed; ADR-008 decides that in M1.
fn cors(origins: &[HeaderValue]) -> CorsLayer {
    CorsLayer::new()
        .allow_origin(AllowOrigin::list(origins.iter().cloned()))
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PUT,
            Method::PATCH,
            Method::DELETE,
        ])
        .allow_headers([
            header::AUTHORIZATION,
            header::CONTENT_TYPE,
            HeaderName::from_static(request_id::REQUEST_ID_HEADER),
        ])
        // Lets browser scripts read `X-Request-Id`, e.g. to show it in an error message.
        .expose_headers([HeaderName::from_static(request_id::REQUEST_ID_HEADER)])
        // Browsers may cache a preflight answer for this long (10 minutes).
        .max_age(Duration::from_secs(600))
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
