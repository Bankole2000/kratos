//! Settings read from environment variables. Every variable is listed in `.env.example`.

use std::env;
use std::net::SocketAddr;

use axum::http::{HeaderValue, Uri};

/// Origins allowed to call the api from a browser or WebView when `API_CORS_ORIGINS` is not
/// set: the web dashboard's dev server, the Tauri dev server and the Tauri production app.
pub const DEFAULT_CORS_ORIGINS: &str = "http://localhost:13000,http://127.0.0.1:13000,http://localhost:1420,tauri://localhost,http://tauri.localhost,https://tauri.localhost";

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
    /// Origins allowed by CORS, from `API_CORS_ORIGINS` (comma-separated). Never `*`.
    pub cors_origins: Vec<HeaderValue>,
}

impl Config {
    /// Reads the configuration. Missing variables use the defaults below; invalid values
    /// are an error so the server refuses to start instead of guessing.
    pub fn from_env() -> Result<Config, String> {
        let host = env_or("API_HOST", "127.0.0.1");
        let port = env_or("API_PORT", "18080");
        let log_filter = env_or("RUST_LOG", "info");
        let database_url = env_or("DATABASE_URL", "");
        let cors_origins = parse_cors_origins(&env_or("API_CORS_ORIGINS", DEFAULT_CORS_ORIGINS))?;
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
            cors_origins,
        })
    }
}

/// The parsed [`DEFAULT_CORS_ORIGINS`]. Used by tests that build the app without a `Config`.
pub fn default_cors_origins() -> Vec<HeaderValue> {
    parse_cors_origins(DEFAULT_CORS_ORIGINS).expect("the default origins are valid")
}

/// Parses a comma-separated list of origins such as `http://localhost:13000,tauri://localhost`.
/// Spaces around each entry are trimmed and empty entries are skipped. Each origin must be
/// exactly `scheme://host` or `scheme://host:port`, as browsers send it in the `Origin`
/// header: no path, no trailing slash and no `*`. Anything else is an error, so a typo stops
/// the server at startup instead of silently blocking the dashboard.
pub fn parse_cors_origins(list: &str) -> Result<Vec<HeaderValue>, String> {
    let mut origins = Vec::new();
    for entry in list.split(',') {
        let entry = entry.trim();
        if entry.is_empty() {
            continue;
        }
        if !is_valid_origin(entry) {
            return Err(format!(
                "API_CORS_ORIGINS contains an invalid origin: {entry:?} (expected scheme://host or scheme://host:port, without a path or `*`)"
            ));
        }
        // `is_valid_origin` only accepts visible ASCII, so this always succeeds.
        let value = HeaderValue::from_str(entry)
            .map_err(|_| format!("API_CORS_ORIGINS contains an invalid origin: {entry:?}"))?;
        origins.push(value);
    }
    if origins.is_empty() {
        return Err("API_CORS_ORIGINS has no origins (see apps/api/.env.example)".to_string());
    }
    Ok(origins)
}

/// True when `entry` is a bare origin: it parses as a URI with a scheme and a host, and
/// rebuilding it from those two parts gives back exactly the same text.
fn is_valid_origin(entry: &str) -> bool {
    if !entry.chars().all(|c| c.is_ascii_graphic()) || entry.contains('@') {
        return false;
    }
    let Ok(uri) = entry.parse::<Uri>() else {
        return false;
    };
    match (uri.scheme_str(), uri.authority()) {
        (Some(scheme), Some(authority)) => format!("{scheme}://{authority}") == entry,
        _ => false,
    }
}

/// Returns the variable's value, or `default` when it is unset or empty.
fn env_or(name: &str, default: &str) -> String {
    match env::var(name) {
        Ok(value) if !value.trim().is_empty() => value.trim().to_string(),
        _ => default.to_string(),
    }
}
