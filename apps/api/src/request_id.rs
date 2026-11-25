//! Request ID middleware. It runs around every request and:
//! 1. takes the ID from the `X-Request-Id` header, or generates one;
//! 2. runs the request inside a tracing span carrying the ID, so every log line has it;
//! 3. writes the standard error body when a handler returned an [`ApiError`];
//! 4. returns the ID in the `X-Request-Id` response header;
//! 5. logs one line per request with method, path, status and duration.

use std::time::Instant;

use axum::extract::Request;
use axum::http::HeaderValue;
use axum::middleware::Next;
use axum::response::Response;
use tracing::Instrument;
use uuid::Uuid;

use crate::error::ApiError;

pub const REQUEST_ID_HEADER: &str = "x-request-id";

/// Incoming IDs longer than this are ignored and a new one is generated.
const MAX_INCOMING_ID_LEN: usize = 128;

pub async fn request_id(request: Request, next: Next) -> Response {
    let id = incoming_id(&request).unwrap_or_else(|| Uuid::new_v4().to_string());
    let method = request.method().clone();
    let path = request.uri().path().to_string();
    let started = Instant::now();

    let span = tracing::info_span!("request", request_id = %id, %method, %path);
    let mut response = next.run(request).instrument(span).await;

    // A handler returned an ApiError: replace the empty body with the standard error body.
    if let Some(error) = response.extensions_mut().remove::<ApiError>() {
        response = error.with_request_id(&id);
    }

    // `id` is either a UUID or an incoming value already checked to be a valid header.
    if let Ok(value) = HeaderValue::from_str(&id) {
        response.headers_mut().insert(REQUEST_ID_HEADER, value);
    }

    tracing::info!(
        request_id = %id,
        %method,
        %path,
        status = response.status().as_u16(),
        duration_ms = started.elapsed().as_millis() as u64,
        "request finished"
    );
    response
}

/// Uses the caller's ID only if it is short and made of visible ASCII characters, so it is
/// safe to put in logs and headers.
fn incoming_id(request: &Request) -> Option<String> {
    let value = request
        .headers()
        .get(REQUEST_ID_HEADER)?
        .to_str()
        .ok()?
        .trim();
    let valid = !value.is_empty()
        && value.len() <= MAX_INCOMING_ID_LEN
        && value.chars().all(|c| c.is_ascii_graphic());
    if valid { Some(value.to_string()) } else { None }
}
