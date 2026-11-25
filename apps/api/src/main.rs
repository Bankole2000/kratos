use std::process::ExitCode;

use api::AppState;
use api::config::Config;

#[tokio::main]
async fn main() -> ExitCode {
    // Load apps/api/.env (or .env in the current folder) if present. Real environment
    // variables win over the file. A missing file is fine.
    let _ = dotenvy::from_path(concat!(env!("CARGO_MANIFEST_DIR"), "/.env"));
    let _ = dotenvy::dotenv();

    let config = match Config::from_env() {
        Ok(config) => config,
        Err(message) => {
            eprintln!("configuration error: {message}");
            return ExitCode::FAILURE;
        }
    };

    api::logging::init(&config.log_filter);

    // The pool connects lazily, so the api starts even if Postgres is down; `/health` then
    // reports the database as down. Migrations are not run here (docs/DEPLOYMENT.md).
    let db = match api::db::connect_lazy(&config.database_url) {
        Ok(pool) => pool,
        Err(error) => {
            // Log the error only, never the URL: it may contain a password.
            tracing::error!(%error, "DATABASE_URL is not a valid Postgres URL");
            return ExitCode::FAILURE;
        }
    };

    let listener = match tokio::net::TcpListener::bind(config.addr).await {
        Ok(listener) => listener,
        Err(error) => {
            tracing::error!(addr = %config.addr, %error, "could not bind");
            return ExitCode::FAILURE;
        }
    };
    tracing::info!(addr = %config.addr, version = env!("CARGO_PKG_VERSION"), "api listening");

    let result = axum::serve(listener, api::app(AppState { db }))
        .with_graceful_shutdown(shutdown_signal())
        .await;
    match result {
        Ok(()) => {
            tracing::info!("api stopped");
            ExitCode::SUCCESS
        }
        Err(error) => {
            tracing::error!(%error, "server error");
            ExitCode::FAILURE
        }
    }
}

/// Resolves on Ctrl+C, or on SIGTERM (sent by container platforms) on Unix.
async fn shutdown_signal() {
    let ctrl_c = async {
        let _ = tokio::signal::ctrl_c().await;
    };

    #[cfg(unix)]
    let terminate = async {
        match tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate()) {
            Ok(mut signal) => {
                signal.recv().await;
            }
            Err(_) => std::future::pending::<()>().await,
        }
    };
    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {},
        _ = terminate => {},
    }
    tracing::info!("shutdown signal received");
}
