pub mod health;
pub mod vendors;

use axum::{
    routing::get,
    Router,
};
use sqlx::PgPool;

pub fn build_router(pool: PgPool) -> Router {
    Router::new()
        .route("/health", get(health::health))
        .route("/resources/vendors", get(vendors::list_vendors))
        .route("/resources/vendors/:id", get(vendors::get_vendor))
        .with_state(pool)
}
