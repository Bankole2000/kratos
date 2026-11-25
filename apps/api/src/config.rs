//! Settings read from environment variables. Every variable is listed in `.env.example`.

use std::env;
use std::net::SocketAddr;

#[derive(Debug, Clone)]
pub struct Config {
    /// Address and port the server listens on, from `API_HOST` and `API_PORT`.
    pub addr: SocketAddr,
    /// Log filter, from `RUST_LOG` (for example `info` or `api=debug,info`).
    pub log_filter: String,
}

impl Config {
    /// Reads the configuration. Missing variables use the defaults below; invalid values
    /// are an error so the server refuses to start instead of guessing.
    pub fn from_env() -> Result<Config, String> {
        let host = env_or("API_HOST", "127.0.0.1");
        let port = env_or("API_PORT", "8080");
        let log_filter = env_or("RUST_LOG", "info");

        let addr: SocketAddr = format!("{host}:{port}").parse().map_err(|_| {
            format!("API_HOST and API_PORT do not form a valid address: {host}:{port}")
        })?;

        Ok(Config { addr, log_filter })
    }
}

/// Returns the variable's value, or `default` when it is unset or empty.
fn env_or(name: &str, default: &str) -> String {
    match env::var(name) {
        Ok(value) if !value.trim().is_empty() => value.trim().to_string(),
        _ => default.to_string(),
    }
}
