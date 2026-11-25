//! Tests that need Postgres (TASK-003). `#[sqlx::test]` creates a fresh database for each
//! test from `DATABASE_URL` (start it with `docker compose up -d`), runs the migrations in
//! `apps/api/migrations` and drops the database afterwards.

use axum::body::Body;
use axum::http::{Request, StatusCode};
use http_body_util::BodyExt;
use serde_json::Value;
use sqlx::PgPool;
use tower::ServiceExt;

// `./` is required: SQLx rejects a bare folder name. The path is relative to apps/api.
#[sqlx::test(migrations = "./migrations")]
async fn migrations_create_the_datasets_table(pool: PgPool) {
    sqlx::query!("INSERT INTO datasets (name) VALUES ($1)", "countries")
        .execute(&pool)
        .await
        .unwrap();

    // Defaults from the migration: version starts at 1 and updated_at is set.
    let row = sqlx::query!(
        r#"SELECT name, version, updated_at IS NOT NULL AS "has_updated_at!" FROM datasets"#
    )
    .fetch_one(&pool)
    .await
    .unwrap();

    assert_eq!(row.name, "countries");
    assert_eq!(row.version, 1);
    assert!(row.has_updated_at);
}

// `./` is required: SQLx rejects a bare folder name. The path is relative to apps/api.
#[sqlx::test(migrations = "./migrations")]
async fn health_reports_database_up(pool: PgPool) {
    let app = api::app(
        api::AppState { db: pool },
        &api::config::default_cors_origins(),
    );
    let request = Request::builder()
        .uri("/health")
        .body(Body::empty())
        .unwrap();

    let response = app.oneshot(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);
    let bytes = response.into_body().collect().await.unwrap().to_bytes();
    let body: Value = serde_json::from_slice(&bytes).unwrap();

    assert_eq!(body["status"], "ok");
    assert_eq!(body["database"], "up");
    assert_eq!(body["version"], env!("CARGO_PKG_VERSION"));
}
