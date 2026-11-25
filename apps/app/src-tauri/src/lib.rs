//! The Tauri shell of Platform Core. It opens one window showing the Vue app in `apps/app/src`,
//! which renders the shared screens from `packages/ui`. There are no Tauri commands and no
//! plugins yet: the web view talks to the api over HTTP, like the web app does.

/// Builds and runs the app. Desktop calls this from `main.rs`; on Android and iOS,
/// `mobile_entry_point` turns it into the entry point the native project loads.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running the Platform Core app");
}
