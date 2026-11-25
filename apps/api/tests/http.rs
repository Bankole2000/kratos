//! Integration tests for the api skeleton (TASK-002, TC-036 in part). They call the router
//! directly, without opening a port.

use axum::Router;
use axum::body::Body;
use axum::http::{Request, StatusCode};
use axum::routing::get;
use http_body_util::BodyExt;
use serde_json::Value;
use tower::ServiceExt;

async fn send(app: Router, request: Request<Body>) -> (StatusCode, Option<String>, Value) {
    let response = app.oneshot(request).await.unwrap();
    let status = response.status();
    let request_id = response
        .headers()
        .get("x-request-id")
        .map(|v| v.to_str().unwrap().to_string());
    let bytes = response.into_body().collect().await.unwrap().to_bytes();
    let body = if bytes.is_empty() {
        Value::Null
    } else {
        serde_json::from_slice(&bytes).unwrap()
    };
    (status, request_id, body)
}

fn get_request(path: &str) -> Request<Body> {
    Request::builder().uri(path).body(Body::empty()).unwrap()
}

#[tokio::test]
async fn health_returns_ok_and_version() {
    let (status, request_id, body) = send(api::app(), get_request("/health")).await;

    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["status"], "ok");
    assert_eq!(body["version"], env!("CARGO_PKG_VERSION"));
    assert!(request_id.is_some(), "every response carries X-Request-Id");
}

#[tokio::test]
async fn incoming_request_id_is_returned() {
    let request = Request::builder()
        .uri("/health")
        .header("x-request-id", "abc-123")
        .body(Body::empty());
    let (_, request_id, _) = send(api::app(), request.unwrap()).await;

    assert_eq!(request_id.as_deref(), Some("abc-123"));
}

#[tokio::test]
async fn invalid_incoming_request_id_is_replaced() {
    let too_long = "a".repeat(200);
    let request = Request::builder()
        .uri("/health")
        .header("x-request-id", &too_long)
        .body(Body::empty());
    let (_, request_id, _) = send(api::app(), request.unwrap()).await;

    let request_id = request_id.unwrap();
    assert_ne!(request_id, too_long);
    assert_eq!(request_id.len(), 36, "a generated UUID");
}

#[tokio::test]
async fn unknown_route_returns_standard_404_body() {
    let (status, request_id, body) = send(api::app(), get_request("/nope")).await;

    assert_eq!(status, StatusCode::NOT_FOUND);
    assert_eq!(body["error"]["code"], "not_found");
    assert!(body["error"]["message"].is_string());
    assert_eq!(body["error"]["request_id"].as_str(), request_id.as_deref());
}

#[tokio::test]
async fn unknown_v1_route_returns_standard_404_body() {
    let (status, _, body) = send(api::app(), get_request("/v1/projects")).await;

    assert_eq!(status, StatusCode::NOT_FOUND);
    assert_eq!(body["error"]["code"], "not_found");
}

#[tokio::test]
async fn wrong_method_returns_standard_405_body() {
    let request = Request::builder()
        .method("POST")
        .uri("/health")
        .body(Body::empty())
        .unwrap();
    let (status, request_id, body) = send(api::app(), request).await;

    assert_eq!(status, StatusCode::METHOD_NOT_ALLOWED);
    assert_eq!(body["error"]["code"], "method_not_allowed");
    assert_eq!(body["error"]["request_id"].as_str(), request_id.as_deref());
}

#[tokio::test]
async fn panic_returns_500_without_internal_details() {
    // Same layers as the real app, plus a route that panics.
    async fn boom() -> &'static str {
        panic!("secret internal detail")
    }
    let app = api::with_layers(api::routes().route("/boom", get(boom)));

    let (status, request_id, body) = send(app, get_request("/boom")).await;

    assert_eq!(status, StatusCode::INTERNAL_SERVER_ERROR);
    assert_eq!(body["error"]["code"], "internal_error");
    assert_eq!(body["error"]["request_id"].as_str(), request_id.as_deref());
    assert!(!body.to_string().contains("secret internal detail"));
}
