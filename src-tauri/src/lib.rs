pub mod cli;
mod commands;
pub mod core;

#[tauri::command]
fn app_version() -> &'static str {
    env!("CARGO_PKG_VERSION")
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            app_version,
            commands::list_archetypes,
            commands::load_archetype,
            commands::analyze_match,
            commands::tailor_profile,
            commands::render_pdf_preview,
            commands::export_resume,
            commands::resume_to_markdown,
        ])
        .run(tauri::generate_context!())
        .expect("falha ao iniciar o Reoli Resume Forge");
}
