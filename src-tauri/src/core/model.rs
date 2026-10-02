use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};

#[derive(Clone, Debug, Default, Deserialize, PartialEq, Serialize)]
pub struct ResumeProfile {
    #[serde(default)]
    pub config: ResumeConfig,
    pub person: Person,
    #[serde(default)]
    pub headline: String,
    #[serde(default)]
    pub summary: String,
    #[serde(default)]
    pub target_keywords: Vec<String>,
    #[serde(default)]
    pub skills: Map<String, Value>,
    #[serde(default)]
    pub soft_skills: Vec<String>,
    #[serde(default)]
    pub experience: Vec<Experience>,
    #[serde(default)]
    pub projects: Vec<Project>,
    #[serde(default)]
    pub education: Vec<Education>,
    #[serde(default)]
    pub languages: Vec<Language>,
    #[serde(default)]
    pub certifications: Vec<Certification>,
}

#[derive(Clone, Debug, Default, Deserialize, PartialEq, Serialize)]
pub struct ResumeConfig {
    #[serde(default)]
    pub tech_label: String,
    #[serde(default)]
    pub section_names: Map<String, Value>,
    #[serde(flatten)]
    pub extra: Map<String, Value>,
}

#[derive(Clone, Debug, Default, Deserialize, PartialEq, Serialize)]
pub struct Person {
    #[serde(default)]
    pub name: String,
    #[serde(default)]
    pub location: String,
    #[serde(default)]
    pub work_preference: String,
    #[serde(default)]
    pub phone: String,
    #[serde(default)]
    pub email: String,
    #[serde(default)]
    pub linkedin: String,
    #[serde(default)]
    pub portfolio: String,
    #[serde(default)]
    pub github: String,
}

#[derive(Clone, Debug, Default, Deserialize, PartialEq, Serialize)]
pub struct Experience {
    #[serde(default)]
    pub company: String,
    #[serde(default)]
    pub role: String,
    #[serde(default)]
    pub dates: String,
    #[serde(default)]
    pub location: String,
    #[serde(default)]
    pub work_mode: String,
    #[serde(default)]
    pub summary: String,
    #[serde(default)]
    pub bullets: Vec<String>,
    #[serde(default)]
    pub technologies: Vec<String>,
}

#[derive(Clone, Debug, Default, Deserialize, PartialEq, Serialize)]
pub struct Project {
    #[serde(default)]
    pub name: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub metrics: Vec<String>,
    #[serde(default)]
    pub technologies: Vec<String>,
}

#[derive(Clone, Debug, Default, Deserialize, PartialEq, Serialize)]
pub struct Education {
    #[serde(default)]
    pub degree: String,
    #[serde(default)]
    pub institution: String,
    #[serde(default)]
    pub dates: String,
}

#[derive(Clone, Debug, Default, Deserialize, PartialEq, Serialize)]
pub struct Language {
    #[serde(default)]
    pub language: String,
    #[serde(default)]
    pub level: String,
}

#[derive(Clone, Debug, Default, Deserialize, PartialEq, Serialize)]
pub struct Certification {
    #[serde(default)]
    pub name: String,
    #[serde(default)]
    pub issuer: String,
    #[serde(default)]
    pub date: String,
}

impl ResumeProfile {
    pub fn section_name<'a>(&'a self, key: &str, fallback: &'a str) -> &'a str {
        self.config
            .section_names
            .get(key)
            .and_then(Value::as_str)
            .unwrap_or(fallback)
    }

    pub fn validate(&self) -> Result<(), String> {
        if self.person.name.trim().is_empty() {
            return Err("person.name é obrigatório".into());
        }
        if self.headline.trim().is_empty() {
            return Err("headline é obrigatória".into());
        }
        if self.summary.trim().is_empty() {
            return Err("summary é obrigatório".into());
        }
        if self.experience.is_empty() {
            return Err("ao menos uma experiência é obrigatória".into());
        }
        if self.summary.chars().count() > 4_000 {
            return Err("summary excede 4.000 caracteres".into());
        }
        if self.experience.len() > 30 || self.projects.len() > 30 {
            return Err("perfil excede o limite de 30 experiências ou projetos".into());
        }
        Ok(())
    }
}
