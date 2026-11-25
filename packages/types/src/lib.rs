//! Domain types shared by the Rust parts of Platform Core: the api now, later the desktop and
//! mobile app's `src-tauri` and the Rust SDK. Types only: no database, HTTP or I/O code.

mod project_status;

pub use project_status::{ParseProjectStatusError, ProjectStatus};
