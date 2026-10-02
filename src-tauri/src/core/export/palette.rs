use crate::core::model::ResumeProfile;

#[derive(Clone, Copy, Debug, PartialEq)]
pub(super) struct PaletteColors {
    pub accent: (f32, f32, f32),
    pub dark: (f32, f32, f32),
    pub divider: (f32, f32, f32),
    pub accent_hex: &'static str,
    pub divider_hex: &'static str,
}

pub(super) fn profile_palette(profile: &ResumeProfile) -> Option<PaletteColors> {
    match profile
        .config
        .extra
        .get("palette")
        .and_then(serde_json::Value::as_str)
    {
        Some("reoli-navy") => Some(PaletteColors {
            accent: rgb(31, 55, 77),
            dark: rgb(20, 38, 54),
            divider: rgb(203, 213, 221),
            accent_hex: "1F374D",
            divider_hex: "CBD5DD",
        }),
        Some("forest") => Some(PaletteColors {
            accent: rgb(23, 74, 59),
            dark: rgb(16, 47, 39),
            divider: rgb(184, 204, 193),
            accent_hex: "174A3B",
            divider_hex: "B8CCC1",
        }),
        Some("cobalt") => Some(PaletteColors {
            accent: rgb(36, 95, 158),
            dark: rgb(23, 60, 101),
            divider: rgb(184, 204, 225),
            accent_hex: "245F9E",
            divider_hex: "B8CCE1",
        }),
        Some("burgundy") => Some(PaletteColors {
            accent: rgb(107, 51, 64),
            dark: rgb(69, 32, 42),
            divider: rgb(216, 187, 194),
            accent_hex: "6B3340",
            divider_hex: "D8BBC2",
        }),
        Some("graphite") => Some(PaletteColors {
            accent: rgb(52, 58, 64),
            dark: rgb(32, 36, 41),
            divider: rgb(200, 205, 209),
            accent_hex: "343A40",
            divider_hex: "C8CDD1",
        }),
        _ => None,
    }
}

const fn rgb(red: u8, green: u8, blue: u8) -> (f32, f32, f32) {
    (
        red as f32 / 255.0,
        green as f32 / 255.0,
        blue as f32 / 255.0,
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::core::archetypes::load_archetype;

    #[test]
    fn reads_only_supported_palette_presets() {
        let mut profile = load_archetype("01_frontend").unwrap();
        assert_eq!(profile_palette(&profile), None);

        profile
            .config
            .extra
            .insert("palette".into(), serde_json::json!("burgundy"));
        assert_eq!(profile_palette(&profile).unwrap().accent_hex, "6B3340");

        profile
            .config
            .extra
            .insert("palette".into(), serde_json::json!("custom-unsafe"));
        assert_eq!(profile_palette(&profile), None);
    }
}
