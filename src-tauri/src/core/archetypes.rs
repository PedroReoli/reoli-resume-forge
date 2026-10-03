use super::model::ResumeProfile;
use serde::Serialize;

pub const DEFAULT_ARCHETYPE_ID: &str = "fullstack";
const FULLSTACK: &str = include_str!("../../../src/data/archetypes/fullstack.json");

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ArchetypeMetadata {
    pub id: &'static str,
    pub label: &'static str,
    pub locale: &'static str,
    pub focus: &'static str,
}

const ARCHETYPES: [ArchetypeMetadata; 1] = [ArchetypeMetadata {
    id: DEFAULT_ARCHETYPE_ID,
    label: "Exemplo Full Stack",
    locale: "pt-BR",
    focus: "React, TypeScript, Node.js, PostgreSQL e entrega contínua",
}];

pub fn list_archetypes() -> Vec<ArchetypeMetadata> {
    ARCHETYPES.to_vec()
}

pub fn load_archetype(id: &str) -> Result<ResumeProfile, String> {
    let raw = match id {
        DEFAULT_ARCHETYPE_ID => FULLSTACK,
        _ => return Err(format!("arquétipo desconhecido: {id}")),
    };

    let profile: ResumeProfile =
        serde_json::from_str(raw).map_err(|error| format!("arquétipo inválido: {error}"))?;
    profile.validate()?;
    Ok(profile)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn loads_the_single_neutral_public_example() {
        assert_eq!(list_archetypes().len(), 1);
        let profile = load_archetype(DEFAULT_ARCHETYPE_ID).expect("exemplo deveria ser válido");
        assert_eq!(profile.person.name, "Pessoa Exemplo");
        assert!(profile.person.email.ends_with("@example.com"));
        assert!(profile.person.portfolio.starts_with("https://"));
    }

    #[test]
    fn rejects_unknown_archetype() {
        assert!(load_archetype("unknown").is_err());
    }
}
