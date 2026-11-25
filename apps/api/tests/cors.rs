//! CORS tests (TASK-015, FR-035). Like `tests/http.rs`, they call the router directly and
//! need no database: the pool points at a closed port and these requests never use it,
//! except `GET /health`, which then reports the database as down.

use axum::Router;
use axum::body::Body;
use axum::http::{HeaderMap, Request, StatusCode};
use tower::ServiceExt;

/// The app with the default allowed origins and a lazy pool pointing at a closed port.
fn app() -> Router {
    let pool = api::db::connect_lazy("postgres://postgres@127.0.0.1:1/unreachable").unwrap();
    api::app(
        api::AppState { db: pool },
        &api::config::default_cors_origins(),
    )
}

/// Sends `request` and returns the status and response headers.
async fn send(request: Request<Body>) -> (StatusCode, HeaderMap) {
    let response = app().oneshot(request).await.unwrap();
    (response.status(), response.headers().clone())
}

/// A browser's preflight: "may `origin` send a GET to /health?"
fn preflight(origin: &str) -> Request<Body> {
    Request::builder()
        .method("OPTIONS")
        .uri("/health")
        .header("origin", origin)
        .header("access-control-request-method", "GET")
        .header(
            "access-control-request-headers",
            "authorization, x-request-id",
        )
        .body(Body::empty())
        .unwrap()
}

fn header<'a>(headers: &'a HeaderMap, name: &str) -> Option<&'a str> {
    headers.get(name).map(|v| v.to_str().unwrap())
}

#[tokio::test]
async fn preflight_from_allowed_origin_is_answered() {
    for origin in ["http://localhost:13000", "tauri://localhost"] {
        let (status, headers) = send(preflight(origin)).await;

        assert_eq!(status, StatusCode::OK);
        assert_eq!(
            header(&headers, "access-control-allow-origin"),
            Some(origin)
        );
        let methods = header(&headers, "access-control-allow-methods").unwrap();
        for method in ["GET", "POST", "PUT", "PATCH", "DELETE"] {
            assert!(methods.contains(method), "{method} missing from {methods}");
        }
        let allowed = header(&headers, "access-control-allow-headers").unwrap();
        for name in ["authorization", "content-type", "x-request-id"] {
            assert!(allowed.contains(name), "{name} missing from {allowed}");
        }
        assert_eq!(header(&headers, "access-control-max-age"), Some("600"));
        assert_eq!(header(&headers, "access-control-allow-credentials"), None);
        assert!(
            headers.contains_key("x-request-id"),
            "preflights carry X-Request-Id too"
        );
    }
}

// tower-http still sends the fixed lists (allowed methods, headers, exposed headers) to any
// origin; they reveal nothing secret. What decides is `Access-Control-Allow-Origin`: without
// it the browser refuses to hand the response to the page.
#[tokio::test]
async fn disallowed_origin_gets_no_allow_origin() {
    let (_, headers) = send(preflight("http://evil.example")).await;
    assert_eq!(header(&headers, "access-control-allow-origin"), None);

    let request = Request::builder()
        .uri("/health")
        .header("origin", "http://evil.example")
        .body(Body::empty())
        .unwrap();
    let (status, headers) = send(request).await;
    assert_eq!(
        status,
        StatusCode::OK,
        "the server answers; the browser blocks"
    );
    assert_eq!(header(&headers, "access-control-allow-origin"), None);
}

#[tokio::test]
async fn simple_get_from_allowed_origin_exposes_request_id() {
    let request = Request::builder()
        .uri("/health")
        .header("origin", "http://127.0.0.1:13000")
        .body(Body::empty())
        .unwrap();
    let (status, headers) = send(request).await;

    assert_eq!(status, StatusCode::OK);
    assert_eq!(
        header(&headers, "access-control-allow-origin"),
        Some("http://127.0.0.1:13000")
    );
    let exposed = header(&headers, "access-control-expose-headers").unwrap();
    assert!(exposed.contains("x-request-id"), "exposed: {exposed}");
    assert!(headers.contains_key("x-request-id"));
}

#[test]
fn origin_list_is_trimmed_and_skips_empty_entries() {
    let origins =
        api::config::parse_cors_origins(" http://localhost:13000 ,, tauri://localhost ,").unwrap();
    assert_eq!(origins, ["http://localhost:13000", "tauri://localhost"]);
}

#[test]
fn default_origins_match_the_dashboards() {
    let origins = api::config::default_cors_origins();
    assert_eq!(
        origins,
        [
            "http://localhost:13000",
            "http://127.0.0.1:13000",
            "http://localhost:1420",
            "tauri://localhost",
            "http://tauri.localhost",
            "https://tauri.localhost",
        ]
    );
}

#[test]
fn invalid_origins_are_rejected() {
    for bad in [
        "*",
        "localhost:13000",
        "http://localhost:13000/",
        "http://localhost:13000/path",
        "http://user@localhost",
        "http://local host",
    ] {
        let result = api::config::parse_cors_origins(bad);
        assert!(result.is_err(), "{bad:?} should be rejected");
    }
    assert!(
        api::config::parse_cors_origins(" , ").is_err(),
        "an empty list"
    );
}
