mod density;
mod docx;
mod markdown;
mod palette;
mod pdf;
mod pdf_content;
mod pdf_theme;
mod typeface;
mod zip_store;

use super::model::ResumeProfile;
use serde::Serialize;
use std::path::Path;

pub use markdown::to_markdown;

#[derive(Clone, Copy, Debug, Default, Eq, PartialEq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum ResumeTemplate {
    #[default]
    Classic,
    Clean,
    Compact,
    Executive,
    TechMinimalist,
    ModernSplit,
    ExecutiveBold,
    Academic,
}

impl ResumeTemplate {
    pub fn parse(value: &str) -> Result<Self, String> {
        match value.trim().to_ascii_lowercase().as_str() {
            "classic" | "classic-reoli" => Ok(Self::Classic),
            "clean" | "clean-slate" => Ok(Self::Clean),
            "compact" | "compact-linear" => Ok(Self::Compact),
            "executive" | "executive-accent" => Ok(Self::Executive),
            "tech-minimalist" | "tech" => Ok(Self::TechMinimalist),
            "modern-split" | "split" => Ok(Self::ModernSplit),
            "executive-bold" | "bold" => Ok(Self::ExecutiveBold),
            "academic" | "chronological" => Ok(Self::Academic),
            other => Err(format!(
                "template desconhecido: {other}. Use classic, clean, compact, executive, tech-minimalist, modern-split, executive-bold ou academic"
            )),
        }
    }

    pub fn from_profile(profile: &ResumeProfile) -> Result<Option<Self>, String> {
        let Some(value) = profile.config.extra.get("template") else {
            return Ok(None);
        };
        let template = value.as_str().ok_or("config.template deve ser um texto")?;
        Self::parse(template).map(Some)
    }
}

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
    render_with_template(profile, format, ResumeTemplate::Classic)
}

pub fn render_with_template(
    profile: &ResumeProfile,
    format: ExportFormat,
    template: ResumeTemplate,
) -> Result<Vec<u8>, String> {
    profile.validate()?;
    match format {
        ExportFormat::Pdf => pdf::render_with_template(profile, template),
        ExportFormat::Docx => docx::render_with_template(profile, template),
        ExportFormat::Json => serde_json::to_vec_pretty(profile).map_err(|error| error.to_string()),
        ExportFormat::Markdown => Ok(markdown::to_markdown(profile).into_bytes()),
    }
}

pub fn write(profile: &ResumeProfile, format: ExportFormat, path: &Path) -> Result<(), String> {
    write_with_template(profile, format, path, ResumeTemplate::Classic)
}

pub fn write_with_template(
    profile: &ResumeProfile,
    format: ExportFormat,
    path: &Path,
    template: ResumeTemplate,
) -> Result<(), String> {
    validate_output_path(path, format)?;
    let bytes = render_with_template(profile, format, template)?;
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
        let mut profile = load_archetype(crate::core::DEFAULT_ARCHETYPE_ID).unwrap();
        profile.person.name = "Ada Lovelace".into();
        assert_eq!(safe_basename(&profile), "curriculo_ada_lovelace");
    }

    #[test]
    fn every_format_renders_non_empty_bytes() {
        let profile = load_archetype(crate::core::DEFAULT_ARCHETYPE_ID).unwrap();
        for format in [
            ExportFormat::Pdf,
            ExportFormat::Docx,
            ExportFormat::Json,
            ExportFormat::Markdown,
        ] {
            assert!(!render(&profile, format).unwrap().is_empty());
        }
    }

    #[test]
    fn accepts_every_public_template() {
        let profile = load_archetype(crate::core::DEFAULT_ARCHETYPE_ID).unwrap();
        for template in [
            ResumeTemplate::Classic,
            ResumeTemplate::Clean,
            ResumeTemplate::Compact,
            ResumeTemplate::Executive,
            ResumeTemplate::TechMinimalist,
            ResumeTemplate::ModernSplit,
            ResumeTemplate::ExecutiveBold,
            ResumeTemplate::Academic,
        ] {
            assert!(
                !render_with_template(&profile, ExportFormat::Pdf, template)
                    .unwrap()
                    .is_empty()
            );
            assert!(
                !render_with_template(&profile, ExportFormat::Docx, template)
                    .unwrap()
                    .is_empty()
            );
        }
    }

    #[test]
    fn reads_the_template_stored_in_a_profile() {
        let mut profile = load_archetype(crate::core::DEFAULT_ARCHETYPE_ID).unwrap();
        profile
            .config
            .extra
            .insert("template".into(), serde_json::json!("modern-split"));

        assert_eq!(
            ResumeTemplate::from_profile(&profile).unwrap(),
            Some(ResumeTemplate::ModernSplit)
        );
    }

    #[test]
    fn preserves_visual_settings_in_editable_json_variants() {
        let mut profile = load_archetype(crate::core::DEFAULT_ARCHETYPE_ID).unwrap();
        profile
            .config
            .extra
            .insert("palette".into(), serde_json::json!("forest"));
        profile
            .config
            .extra
            .insert("typeface".into(), serde_json::json!("modern-sans"));

        let json =
            render_with_template(&profile, ExportFormat::Json, ResumeTemplate::Classic).unwrap();
        let document: serde_json::Value = serde_json::from_slice(&json).unwrap();
        assert_eq!(document["config"]["palette"], "forest");
        assert_eq!(document["config"]["typeface"], "modern-sans");
    }

    #[test]
    fn section_order_visibility_and_custom_content_reach_text_exports() {
        let mut profile = load_archetype(crate::core::DEFAULT_ARCHETYPE_ID).unwrap();
        profile
            .custom_sections
            .push(crate::core::model::CustomSection {
                id: "publicacoes".into(),
                title: "Publicações".into(),
                kind: "publications".into(),
                items: vec!["Artigo sobre arquitetura modular".into()],
            });
        profile.layout.section_order = vec![
            "custom:publicacoes".into(),
            "summary".into(),
            "experience".into(),
        ];
        profile.layout.hidden_sections = vec!["summary".into()];

        let markdown = to_markdown(&profile);
        assert!(markdown.contains("## Publicações"));
        assert!(markdown.contains("Artigo sobre arquitetura modular"));
        assert!(!markdown.contains("## Resumo Profissional"));
        assert!(markdown.find("## Publicações") < markdown.find("## Experiência Profissional"));

        let document = docx::document_xml(&profile, ResumeTemplate::Classic);
        assert!(document.contains("PUBLICAÇÕES"));
        assert!(!document.contains("RESUMO PROFISSIONAL"));
    }
}
