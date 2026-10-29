mod config;
mod error;
mod routes;

use sqlx::postgres::PgPoolOptions;

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .init();

    let config = config::Config::from_env();

    let pool = PgPoolOptions::new()
        .max_connections(10)
        .connect(&config.database_url)
        .await
        .expect("failed to connect to Postgres");

    tracing::info!("connected to Postgres");

    let app = routes::build_router(pool);

    let listener = tokio::net::TcpListener::bind(("0.0.0.0", config.port))
        .await
        .expect("failed to bind port");

    tracing::info!(port = config.port, "read server listening");

    axum::serve(listener, app)
        .await
        .expect("server error");
}
