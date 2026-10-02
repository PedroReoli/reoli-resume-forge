use super::model::ResumeProfile;
use serde::Serialize;

const FRONTEND: &str = include_str!("../../../src/data/archetypes/01_frontend.json");
const FULLSTACK_NODE: &str = include_str!("../../../src/data/archetypes/02_fullstack_node.json");
const FULLSTACK_DOTNET: &str =
    include_str!("../../../src/data/archetypes/03_fullstack_dotnet.json");
const TECH_LEAD: &str = include_str!("../../../src/data/archetypes/04_tech_lead.json");
const INTERNATIONAL_EN: &str =
    include_str!("../../../src/data/archetypes/05_internacional_en.json");

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ArchetypeMetadata {
    pub id: &'static str,
    pub label: &'static str,
    pub locale: &'static str,
    pub focus: &'static str,
}

const ARCHETYPES: [ArchetypeMetadata; 5] = [
    ArchetypeMetadata {
        id: "01_frontend",
        label: "Frontend & Design Systems",
        locale: "pt-BR",
        focus: "React, Next.js, TypeScript, Design Systems e Web Performance",
    },
    ArchetypeMetadata {
        id: "02_fullstack_node",
        label: "Full Stack Node.js",
        locale: "pt-BR",
        focus: "Node.js, NestJS, APIs, PostgreSQL e AWS",
    },
    ArchetypeMetadata {
        id: "03_fullstack_dotnet",
        label: "Full Stack .NET",
        locale: "pt-BR",
        focus: "C#, .NET, SQL Server, Clean Architecture e React",
    },
    ArchetypeMetadata {
        id: "04_tech_lead",
        label: "Tech Lead",
        locale: "pt-BR",
        focus: "System Design, liderança, mentoria e governança",
    },
    ArchetypeMetadata {
        id: "05_internacional_en",
        label: "International EN",
        locale: "en-US",
        focus: "Global Full Stack and Frontend Engineering",
    },
];

pub fn list_archetypes() -> Vec<ArchetypeMetadata> {
    ARCHETYPES.to_vec()
}

pub fn load_archetype(id: &str) -> Result<ResumeProfile, String> {
    let raw = match id {
        "01_frontend" => FRONTEND,
        "02_fullstack_node" => FULLSTACK_NODE,
        "03_fullstack_dotnet" => FULLSTACK_DOTNET,
        "04_tech_lead" => TECH_LEAD,
        "05_internacional_en" => INTERNATIONAL_EN,
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
    fn loads_every_embedded_archetype() {
        for item in list_archetypes() {
            let profile = load_archetype(item.id).expect("arquétipo deveria ser válido");
            assert!(!profile.person.name.trim().is_empty());
            assert!(profile.person.portfolio.starts_with("https://"));
        }
    }

    #[test]
    fn rejects_unknown_archetype() {
        assert!(load_archetype("unknown").is_err());
    }
}
