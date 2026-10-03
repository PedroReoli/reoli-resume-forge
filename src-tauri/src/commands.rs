use crate::core::export::{self, ExportFormat, ResumeTemplate};
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
pub fn render_pdf_preview(
    profile: ResumeProfile,
    template: Option<String>,
) -> Result<String, String> {
    let template = parse_template(template.as_deref(), &profile)?;
    let bytes = export::render_with_template(&profile, ExportFormat::Pdf, template)?;
    Ok(base64::engine::general_purpose::STANDARD.encode(bytes))
}

#[tauri::command]
pub fn export_resume(
    profile: ResumeProfile,
    format: String,
    template: Option<String>,
    path: String,
) -> Result<String, String> {
    let format = ExportFormat::parse(&format)?;
    let template = parse_template(template.as_deref(), &profile)?;
    export::write_with_template(&profile, format, Path::new(&path), template)?;
    Ok(path)
}

fn parse_template(value: Option<&str>, profile: &ResumeProfile) -> Result<ResumeTemplate, String> {
    match value {
        Some(value) => ResumeTemplate::parse(value),
        None => Ok(ResumeTemplate::from_profile(profile)?.unwrap_or_default()),
    }
}

#[tauri::command]
pub fn resume_to_markdown(profile: ResumeProfile) -> Result<String, String> {
    profile.validate()?;
    Ok(export::to_markdown(&profile))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn pdf_preview_uses_the_exact_export_bytes() {
        let profile = crate::core::load_archetype(crate::core::DEFAULT_ARCHETYPE_ID).unwrap();
        let expected =
            export::render_with_template(&profile, ExportFormat::Pdf, ResumeTemplate::Classic)
                .unwrap();
        let encoded = render_pdf_preview(profile, Some("classic".into())).unwrap();
        let preview = base64::engine::general_purpose::STANDARD
            .decode(encoded)
            .unwrap();

        assert!(preview.starts_with(b"%PDF-"));
        assert_eq!(
            without_document_id(&preview),
            without_document_id(&expected)
        );
    }

    fn without_document_id(bytes: &[u8]) -> Vec<u8> {
        let start = bytes
            .windows(4)
            .position(|window| window == b"/ID[")
            .expect("PDF deve conter identificador no trailer");
        let end = bytes[start..]
            .windows(6)
            .position(|window| window == b"]/Size")
            .map(|offset| start + offset + 1)
            .expect("PDF deve encerrar identificador antes de /Size");
        let mut normalized = Vec::with_capacity(bytes.len());
        normalized.extend_from_slice(&bytes[..start]);
        normalized.extend_from_slice(&bytes[end..]);
        normalized
    }
}
