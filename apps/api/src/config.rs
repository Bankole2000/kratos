//! Settings read from environment variables. Every variable is listed in `.env.example`.

use std::env;
use std::net::SocketAddr;

// No `Debug` derive: `database_url` may contain a password and must never be printed or logged.
#[derive(Clone)]
pub struct Config {
    /// Address and port the server listens on, from `API_HOST` and `API_PORT`.
    pub addr: SocketAddr,
    /// Log filter, from `RUST_LOG` (for example `info` or `api=debug,info`).
    pub log_filter: String,
    /// Postgres connection string, from `DATABASE_URL`. Required. May contain a password,
    /// so it is never logged.
    pub database_url: String,
}

impl Config {
    /// Reads the configuration. Missing variables use the defaults below; invalid values
    /// are an error so the server refuses to start instead of guessing.
    pub fn from_env() -> Result<Config, String> {
        let host = env_or("API_HOST", "127.0.0.1");
        let port = env_or("API_PORT", "8080");
        let log_filter = env_or("RUST_LOG", "info");
        let database_url = env_or("DATABASE_URL", "");
        if database_url.is_empty() {
            return Err("DATABASE_URL is not set (see apps/api/.env.example)".to_string());
        }

        let addr: SocketAddr = format!("{host}:{port}").parse().map_err(|_| {
            format!("API_HOST and API_PORT do not form a valid address: {host}:{port}")
        })?;

        Ok(Config {
            addr,
            log_filter,
            database_url,
        })
    }
}

/// Returns the variable's value, or `default` when it is unset or empty.
fn env_or(name: &str, default: &str) -> String {
    match env::var(name) {
        Ok(value) if !value.trim().is_empty() => value.trim().to_string(),
        _ => default.to_string(),
    }
}
