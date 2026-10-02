use crate::core::export::{self, ExportFormat};
use crate::core::{
    ArchetypeMetadata, MatchReport, ResumeProfile, TailorResult, analyze,
    list_archetypes as catalog, load_archetype as load, tailor,
};
use base64::Engine;
use std::path::Path;

#[tauri::command]
pub fn list_archetypes() -> Vec<ArchetypeMetadata> {
    catalog()
}

#[tauri::command]
pub fn load_archetype(id: String) -> Result<ResumeProfile, String> {
    load(&id)
}

#[tauri::command]
pub fn analyze_match(
    profile: ResumeProfile,
    job_description: String,
) -> Result<MatchReport, String> {
    analyze(&profile, &job_description)
}

#[tauri::command]
pub fn tailor_profile(
    profile: ResumeProfile,
    job_description: String,
    model_id: Option<String>,
    confirmed_us_overlap: Option<bool>,
) -> Result<TailorResult, String> {
    tailor(
        &profile,
        &job_description,
        model_id.as_deref(),
        confirmed_us_overlap.unwrap_or(false),
    )
}

#[tauri::command]
pub fn render_pdf_preview(profile: ResumeProfile) -> Result<String, String> {
    let bytes = export::render(&profile, ExportFormat::Pdf)?;
    Ok(base64::engine::general_purpose::STANDARD.encode(bytes))
}

#[tauri::command]
pub fn export_resume(
    profile: ResumeProfile,
    format: String,
    path: String,
) -> Result<String, String> {
    let format = ExportFormat::parse(&format)?;
    export::write(&profile, format, Path::new(&path))?;
    Ok(path)
}

#[tauri::command]
pub fn resume_to_markdown(profile: ResumeProfile) -> Result<String, String> {
    profile.validate()?;
    Ok(export::to_markdown(&profile))
}
