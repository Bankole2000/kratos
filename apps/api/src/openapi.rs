//! The OpenAPI 3.1 spec (ADR-005). `openapi/openapi.json` at the repo root is generated from
//! [`ApiDoc`] with `cargo run -p api -- openapi > openapi/openapi.json`, and
//! `tests/openapi.rs` fails when the committed file is out of date.
//!
//! Every handler gets a `#[utoipa::path]` annotation and is listed in `paths(...)` below.
//! Types used in request or response bodies derive `ToSchema`; utoipa adds the ones a path
//! refers to, and shared ones such as `ErrorBody` are also listed in `components(...)`.

use utoipa::OpenApi;

use crate::error::{ErrorBody, ErrorDetails};
use crate::health;

#[derive(OpenApi)]
#[openapi(
    info(
        title = "Platform Core API",
        version = env!("CARGO_PKG_VERSION"),
        description = "The HTTP API for Platform Core. Every error response uses the `ErrorBody` schema.",
        license(name = "MIT", identifier = "MIT"),
    ),
    paths(health::health),
    components(schemas(ErrorBody, ErrorDetails)),
    tags((name = "health", description = "Liveness and version")),
)]
pub struct ApiDoc;

/// The spec as pretty-printed JSON with a trailing newline: exactly the content of
/// `openapi/openapi.json`. Used by `main.rs` and by the check in `tests/openapi.rs`.
pub fn spec_json() -> String {
    let mut json = ApiDoc::openapi()
        .to_pretty_json()
        .expect("the OpenAPI spec is always serializable");
    json.push('\n');
    json
}
