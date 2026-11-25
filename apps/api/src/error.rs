//! The standard error response (NFR-001, TECHNICAL.md "Error handling").
//!
//! Every error body looks like:
//! `{ "error": { "code": "not_found", "message": "...", "request_id": "..." } }`
//!
//! A handler returns an [`ApiError`]. It does not know the request ID, so it only attaches
//! the code and message to the response; the request ID middleware (`request_id.rs`) then
//! writes the JSON body with the ID filled in.

use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use serde::Serialize;
use utoipa::ToSchema;

#[derive(Debug, Clone)]
pub struct ApiError {
    pub status: StatusCode,
    /// Stable `snake_case` code that clients can match on.
    pub code: &'static str,
    /// Human-readable message. It may change between versions.
    pub message: String,
}

impl ApiError {
    pub fn new(status: StatusCode, code: &'static str, message: impl Into<String>) -> ApiError {
        ApiError {
            status,
            code,
            message: message.into(),
        }
    }

    pub fn not_found() -> ApiError {
        ApiError::new(
            StatusCode::NOT_FOUND,
            "not_found",
            "The requested resource does not exist.",
        )
    }

    pub fn method_not_allowed() -> ApiError {
        ApiError::new(
            StatusCode::METHOD_NOT_ALLOWED,
            "method_not_allowed",
            "This method is not allowed on this resource.",
        )
    }

    /// For unexpected failures. The message never includes internal details.
    pub fn internal() -> ApiError {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            "internal_error",
            "Something went wrong. Quote the request ID if you report this.",
        )
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let status = self.status;
        // The body is written later by the request ID middleware; see `with_request_id`.
        let mut response = status.into_response();
        response.extensions_mut().insert(self);
        response
    }
}

/// The JSON body of every error response: `{ "error": { "code", "message", "request_id" } }`.
#[derive(Serialize, ToSchema)]
pub struct ErrorBody {
    pub error: ErrorDetails,
}

/// The fields inside `error` in the error body.
#[derive(Serialize, ToSchema)]
pub struct ErrorDetails {
    /// Stable `snake_case` code that clients can match on.
    #[schema(example = "not_found")]
    pub code: String,
    /// Human-readable message. It may change between versions.
    #[schema(example = "The requested resource does not exist.")]
    pub message: String,
    /// The request ID, also sent in the `X-Request-Id` header. Quote it when reporting a problem.
    #[schema(example = "6f1c2a9e-3b7d-4c55-9a4e-2d8f0b1e7c3a")]
    pub request_id: String,
}

impl ApiError {
    /// Builds the final JSON response, including the request ID.
    pub fn with_request_id(&self, request_id: &str) -> Response {
        let body = ErrorBody {
            error: ErrorDetails {
                code: self.code.to_string(),
                message: self.message.clone(),
                request_id: request_id.to_string(),
            },
        };
        (self.status, axum::Json(body)).into_response()
    }
}
