//! Structured JSON logging with `tracing`. Each line is one JSON object; fields from the
//! current span (such as `request_id`) are included.
//!
//! Never log full keys or tokens, passwords, session tokens or event properties
//! (TECHNICAL.md, "Logging and observability").

use tracing_subscriber::EnvFilter;

pub fn init(filter: &str) {
    tracing_subscriber::fmt()
        .json()
        .with_env_filter(EnvFilter::new(filter))
        .with_current_span(true)
        .with_span_list(false)
        .init();
}
