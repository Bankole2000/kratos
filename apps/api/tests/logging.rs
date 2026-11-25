//! Checks that the request ID appears in the request log line (NFR-001, TC-036).
//!
//! This test lives in its own file, so it runs in its own process: `tracing` caches per log
//! statement whether anyone is listening, and other tests running in parallel without a
//! subscriber would make that cache race with the subscriber this test installs.

use std::io::Write;
use std::sync::{Arc, Mutex};

use axum::body::Body;
use axum::http::{Request, StatusCode};
use serde_json::Value;
use tower::ServiceExt;

/// Collects log output in memory so a test can read it.
#[derive(Clone, Default)]
struct LogBuffer(Arc<Mutex<Vec<u8>>>);

impl Write for LogBuffer {
    fn write(&mut self, bytes: &[u8]) -> std::io::Result<usize> {
        self.0.lock().unwrap().extend_from_slice(bytes);
        Ok(bytes.len())
    }
    fn flush(&mut self) -> std::io::Result<()> {
        Ok(())
    }
}

#[tokio::test]
async fn request_id_appears_in_the_log_line() {
    let logs = LogBuffer::default();
    let writer = logs.clone();
    let subscriber = tracing_subscriber::fmt()
        .json()
        .with_writer(move || writer.clone())
        .with_current_span(true)
        .finish();
    // Applies to this thread only; #[tokio::test] runs the test on one thread.
    let _guard = tracing::subscriber::set_default(subscriber);

    let request = Request::builder()
        .uri("/nope")
        .header("x-request-id", "log-test-42");
    // No database needed: the pool is lazy and `/nope` never uses it.
    let pool = api::db::connect_lazy("postgres://postgres@127.0.0.1:1/unreachable").unwrap();
    let response = api::app(
        api::AppState { db: pool },
        &api::config::default_cors_origins(),
    )
    .oneshot(request.body(Body::empty()).unwrap())
    .await
    .unwrap();
    assert_eq!(response.status(), StatusCode::NOT_FOUND);

    let output = String::from_utf8(logs.0.lock().unwrap().clone()).unwrap();
    let line = output
        .lines()
        .find(|line| line.contains("request finished"))
        .unwrap_or_else(|| panic!("no request finished line in: {output}"));
    let entry: Value = serde_json::from_str(line).unwrap();
    assert_eq!(entry["fields"]["request_id"], "log-test-42");
    assert_eq!(entry["fields"]["status"], 404);
}
