//! Checks for the OpenAPI spec (TASK-004, ADR-005). The first test fails when
//! `openapi/openapi.json` was not regenerated after a route or schema changed.

use serde_json::Value;

const SPEC_PATH: &str = concat!(env!("CARGO_MANIFEST_DIR"), "/../../openapi/openapi.json");

const REGENERATE: &str = "cargo run -p api -- openapi > openapi/openapi.json";

#[test]
fn committed_spec_is_up_to_date() {
    let generated = api::openapi::spec_json();
    let committed = std::fs::read_to_string(SPEC_PATH).unwrap_or_else(|error| {
        panic!("could not read {SPEC_PATH} ({error}). Generate it from the repo root with: {REGENERATE}")
    });
    // A Windows checkout may have CRLF line endings; the content is what matters.
    let committed = committed.replace("\r\n", "\n");

    assert!(
        committed == generated,
        "openapi/openapi.json is out of date with the code in apps/api. \
         Regenerate it from the repo root (in a POSIX shell such as Git Bash) with: \
         {REGENERATE}, then commit the result."
    );
}

#[test]
fn spec_is_openapi_3_1_with_health_and_error_body() {
    let spec: Value = serde_json::from_str(&api::openapi::spec_json()).unwrap();

    assert_eq!(spec["openapi"], "3.1.0");
    assert_eq!(spec["info"]["title"], "Platform Core API");
    assert_eq!(spec["info"]["version"], env!("CARGO_PKG_VERSION"));
    assert!(spec["paths"]["/health"]["get"].is_object());

    let error = &spec["components"]["schemas"]["ErrorBody"];
    assert!(error.is_object(), "ErrorBody is a named component schema");
    let details = &spec["components"]["schemas"]["ErrorDetails"];
    for field in ["code", "message", "request_id"] {
        assert!(
            details["properties"][field].is_object(),
            "ErrorDetails has {field}"
        );
    }
}
