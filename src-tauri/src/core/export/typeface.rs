use crate::core::model::ResumeProfile;
use printpdf::BuiltinFont;

#[derive(Clone, Copy, Debug, PartialEq)]
pub(super) struct TypefacePreset {
    pub pdf_normal: BuiltinFont,
    pub pdf_bold: BuiltinFont,
    pub docx_font: &'static str,
}

pub(super) fn profile_typeface(profile: &ResumeProfile) -> Option<TypefacePreset> {
    match profile
        .config
        .extra
        .get("typeface")
        .and_then(serde_json::Value::as_str)
    {
        Some("modern-sans") => Some(TypefacePreset {
            pdf_normal: BuiltinFont::Helvetica,
            pdf_bold: BuiltinFont::HelveticaBold,
            docx_font: "Arial",
        }),
        Some("editorial-serif") => Some(TypefacePreset {
            pdf_normal: BuiltinFont::TimesRoman,
            pdf_bold: BuiltinFont::TimesBold,
            docx_font: "Georgia",
        }),
        Some("technical-mono") => Some(TypefacePreset {
            pdf_normal: BuiltinFont::Courier,
            pdf_bold: BuiltinFont::CourierBold,
            docx_font: "Consolas",
        }),
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::core::archetypes::load_archetype;

    #[test]
    fn reads_only_supported_typeface_presets() {
        let mut profile = load_archetype("01_frontend").unwrap();
        assert_eq!(profile_typeface(&profile), None);

        profile
            .config
            .extra
            .insert("typeface".into(), serde_json::json!("editorial-serif"));
        let preset = profile_typeface(&profile).unwrap();
        assert_eq!(preset.pdf_normal, BuiltinFont::TimesRoman);
        assert_eq!(preset.docx_font, "Georgia");

        profile
            .config
            .extra
            .insert("typeface".into(), serde_json::json!("unsafe-font"));
        assert_eq!(profile_typeface(&profile), None);
    }
}
