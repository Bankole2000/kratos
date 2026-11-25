//! The Postgres connection pool (SQLx, ADR-004).
//!
//! Migrations are not run here: they run as a separate release step
//! (`sqlx migrate run`, docs/DEPLOYMENT.md), before the new version starts.

use std::time::Duration;

use sqlx::PgPool;
use sqlx::postgres::PgPoolOptions;

/// How long a request waits for a database connection before giving up. Short, so
/// `/health` answers quickly when Postgres is down.
const ACQUIRE_TIMEOUT: Duration = Duration::from_secs(3);

/// Creates the pool without connecting. Connections are opened on first use, so the api
/// starts (and `/health` reports the database as down) even when Postgres is not running.
/// Fails only if `database_url` is not a valid Postgres URL.
pub fn connect_lazy(database_url: &str) -> Result<PgPool, sqlx::Error> {
    PgPoolOptions::new()
        .acquire_timeout(ACQUIRE_TIMEOUT)
        .connect_lazy(database_url)
}

/// Runs a trivial query to check that the database answers.
pub async fn ping(pool: &PgPool) -> Result<(), sqlx::Error> {
    // `"one!"` tells SQLx the column is never null, so the result is an `i32`.
    sqlx::query_scalar!(r#"SELECT 1 AS "one!""#)
        .fetch_one(pool)
        .await?;
    Ok(())
}
