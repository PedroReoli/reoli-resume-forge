mod docx;
mod markdown;
mod pdf;
mod zip_store;

use super::model::ResumeProfile;
use serde::Serialize;
use std::path::Path;

pub use markdown::to_markdown;

#[derive(Clone, Copy, Debug, Eq, PartialEq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum ExportFormat {
    Pdf,
    Docx,
    Json,
    Markdown,
}

impl ExportFormat {
    pub fn parse(value: &str) -> Result<Self, String> {
        match value.trim().to_ascii_lowercase().as_str() {
            "pdf" => Ok(Self::Pdf),
            "docx" => Ok(Self::Docx),
            "json" => Ok(Self::Json),
            "md" | "markdown" => Ok(Self::Markdown),
            other => Err(format!("formato desconhecido: {other}")),
        }
    }

    pub fn extension(self) -> &'static str {
        match self {
            Self::Pdf => "pdf",
            Self::Docx => "docx",
            Self::Json => "json",
            Self::Markdown => "md",
        }
    }
}

pub fn render(profile: &ResumeProfile, format: ExportFormat) -> Result<Vec<u8>, String> {
    profile.validate()?;
    match format {
        ExportFormat::Pdf => pdf::render(profile),
        ExportFormat::Docx => docx::render(profile),
        ExportFormat::Json => serde_json::to_vec_pretty(profile).map_err(|error| error.to_string()),
        ExportFormat::Markdown => Ok(markdown::to_markdown(profile).into_bytes()),
    }
}

pub fn write(profile: &ResumeProfile, format: ExportFormat, path: &Path) -> Result<(), String> {
    validate_output_path(path, format)?;
    let bytes = render(profile, format)?;
    std::fs::write(path, bytes)
        .map_err(|error| format!("falha ao gravar {}: {error}", path.display()))
}

pub fn safe_basename(profile: &ResumeProfile) -> String {
    let name = profile.person.name.trim();
    let mut result = String::with_capacity(name.len());
    let mut pending_separator = false;
    for character in name.chars() {
        if character.is_alphanumeric() {
            if pending_separator && !result.is_empty() {
                result.push('_');
            }
            result.extend(character.to_lowercase());
            pending_separator = false;
        } else {
            pending_separator = true;
        }
    }
    let normalized = result.trim_matches('_');
    if normalized.is_empty() {
        "curriculo".into()
    } else {
        format!("curriculo_{normalized}")
    }
}

fn validate_output_path(path: &Path, format: ExportFormat) -> Result<(), String> {
    if path.as_os_str().len() > 4_096 {
        return Err("caminho de saída excede 4.096 caracteres".into());
    }
    let expected = format.extension();
    let extension = path
        .extension()
        .and_then(|value| value.to_str())
        .unwrap_or_default();
    if !extension.eq_ignore_ascii_case(expected) {
        return Err(format!("a saída deve usar a extensão .{expected}"));
    }
    let parent = path.parent().ok_or("diretório de saída ausente")?;
    if !parent.is_dir() {
        return Err(format!(
            "diretório de saída não existe: {}",
            parent.display()
        ));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::core::archetypes::load_archetype;

    #[test]
    fn derives_filename_from_current_profile_instead_of_fixed_identity() {
        let mut profile = load_archetype("01_frontend").unwrap();
        profile.person.name = "Ada Lovelace".into();
        assert_eq!(safe_basename(&profile), "curriculo_ada_lovelace");
    }

    #[test]
    fn every_format_renders_non_empty_bytes() {
        let profile = load_archetype("01_frontend").unwrap();
        for format in [
            ExportFormat::Pdf,
            ExportFormat::Docx,
            ExportFormat::Json,
            ExportFormat::Markdown,
        ] {
            assert!(!render(&profile, format).unwrap().is_empty());
        }
    }
}
