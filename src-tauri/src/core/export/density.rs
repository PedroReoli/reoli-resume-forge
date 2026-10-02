use super::super::model::ResumeProfile;

#[derive(Clone, Copy, Debug, Default, Eq, PartialEq)]
pub(super) enum DensityPreset {
    Compact,
    #[default]
    Balanced,
    Relaxed,
}

impl DensityPreset {
    pub fn from_profile(profile: &ResumeProfile) -> Self {
        match profile.layout.density.trim().to_ascii_lowercase().as_str() {
            "compact" => Self::Compact,
            "relaxed" => Self::Relaxed,
            _ => Self::Balanced,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::core::archetypes::load_archetype;

    #[test]
    fn reads_supported_density_and_falls_back_safely() {
        let mut profile = load_archetype("01_frontend").unwrap();

        profile.layout.density = "compact".into();
        assert_eq!(
            DensityPreset::from_profile(&profile),
            DensityPreset::Compact
        );

        profile.layout.density = "relaxed".into();
        assert_eq!(
            DensityPreset::from_profile(&profile),
            DensityPreset::Relaxed
        );

        profile.layout.density = "unexpected".into();
        assert_eq!(
            DensityPreset::from_profile(&profile),
            DensityPreset::Balanced
        );
    }
}
