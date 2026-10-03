use super::DetectedDomain;
use serde::Deserialize;
use std::cmp::Reverse;
use std::collections::{BTreeMap, BTreeSet};
use std::sync::OnceLock;

const CATALOG_SOURCE: &str = include_str!("../../../../src/data/ats-keywords.json");
static CATALOG: OnceLock<KeywordCatalog> = OnceLock::new();

#[derive(Debug, Deserialize)]
struct KeywordCatalog {
    version: u16,
    domains: Vec<DomainDefinition>,
    keywords: Vec<KeywordDefinition>,
}

#[derive(Debug, Deserialize)]
struct DomainDefinition {
    id: String,
    label: String,
}

#[derive(Debug, Deserialize)]
pub(super) struct KeywordDefinition {
    pub canonical: String,
    pub aliases: Vec<String>,
    domains: Vec<String>,
}

pub(super) fn keyword_definitions() -> &'static [KeywordDefinition] {
    &catalog().keywords
}

pub(super) fn keyword_definition(canonical: &str) -> Option<&'static KeywordDefinition> {
    keyword_definitions()
        .iter()
        .find(|definition| definition.canonical == canonical)
}

pub(super) fn detect_domains(keywords: &[String]) -> Vec<DetectedDomain> {
    let catalog = catalog();
    let mut detected = catalog
        .domains
        .iter()
        .filter_map(|domain| {
            let matched_keywords = keywords
                .iter()
                .filter(|keyword| {
                    keyword_definition(keyword)
                        .is_some_and(|definition| definition.domains.contains(&domain.id))
                })
                .cloned()
                .collect::<Vec<_>>();
            (!matched_keywords.is_empty()).then(|| DetectedDomain {
                id: domain.id.clone(),
                label: domain.label.clone(),
                matched_keywords,
            })
        })
        .collect::<Vec<_>>();

    let highest_match_count = detected
        .iter()
        .map(|domain| domain.matched_keywords.len())
        .max()
        .unwrap_or_default();
    let minimum_match_count = usize::from(highest_match_count >= 2) + 1;
    detected.retain(|domain| domain.matched_keywords.len() >= minimum_match_count);
    detected.sort_by_key(|domain| (Reverse(domain.matched_keywords.len()), domain.label.clone()));
    detected.truncate(4);
    detected
}

fn catalog() -> &'static KeywordCatalog {
    CATALOG.get_or_init(|| {
        let mut catalog: KeywordCatalog = serde_json::from_str(CATALOG_SOURCE)
            .expect("src/data/ats-keywords.json deve conter JSON válido");
        for keyword in &mut catalog.keywords {
            let canonical = super::normalize(&keyword.canonical);
            if !keyword
                .aliases
                .iter()
                .any(|alias| super::normalize(alias) == canonical)
            {
                keyword.aliases.push(keyword.canonical.clone());
            }
        }
        validate_catalog(&catalog)
            .expect("src/data/ats-keywords.json deve respeitar o contrato do catálogo ATS");
        catalog
    })
}

fn validate_catalog(catalog: &KeywordCatalog) -> Result<(), String> {
    if catalog.version < 2 {
        return Err("a versão do catálogo deve ser 2 ou superior".into());
    }
    if catalog.domains.is_empty() || catalog.keywords.is_empty() {
        return Err("o catálogo deve possuir domínios e keywords".into());
    }

    let mut domain_ids = BTreeSet::new();
    for domain in &catalog.domains {
        if domain.id.trim().is_empty() || domain.label.trim().is_empty() {
            return Err("todo domínio deve possuir id e label".into());
        }
        if !domain_ids.insert(domain.id.as_str()) {
            return Err(format!("domínio duplicado: {}", domain.id));
        }
    }

    let mut canonical_names = BTreeSet::new();
    let mut alias_owners = BTreeMap::new();
    for keyword in &catalog.keywords {
        let canonical = super::normalize(&keyword.canonical);
        if canonical.is_empty() || !canonical_names.insert(canonical) {
            return Err(format!(
                "keyword canônica inválida ou duplicada: {}",
                keyword.canonical
            ));
        }
        if keyword.aliases.is_empty() || keyword.domains.is_empty() {
            return Err(format!(
                "keyword sem aliases ou domínios: {}",
                keyword.canonical
            ));
        }
        for domain in &keyword.domains {
            if !domain_ids.contains(domain.as_str()) {
                return Err(format!(
                    "domínio desconhecido {domain} em {}",
                    keyword.canonical
                ));
            }
        }
        for alias in &keyword.aliases {
            let normalized = super::normalize(alias);
            if normalized.is_empty() {
                return Err(format!("alias vazio em {}", keyword.canonical));
            }
            if let Some(owner) = alias_owners.insert(normalized, keyword.canonical.as_str())
                && owner != keyword.canonical
            {
                return Err(format!(
                    "alias ambíguo entre {owner} e {}",
                    keyword.canonical
                ));
            }
        }
    }

    for domain in &catalog.domains {
        let coverage = catalog
            .keywords
            .iter()
            .filter(|keyword| keyword.domains.contains(&domain.id))
            .count();
        if coverage < 10 {
            return Err(format!("domínio {} possui menos de 10 keywords", domain.id));
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn catalog_is_versioned_valid_and_broad() {
        let catalog = catalog();
        assert!(catalog.version >= 2);
        assert!(catalog.domains.len() >= 12);
        assert!(catalog.keywords.len() >= 250);
        assert!(validate_catalog(catalog).is_ok());
    }

    #[test]
    fn catalog_covers_requested_professional_domains() {
        let ids = catalog()
            .domains
            .iter()
            .map(|domain| domain.id.as_str())
            .collect::<BTreeSet<_>>();
        for required in [
            "software-development",
            "quality-assurance",
            "it-infrastructure",
            "supply-chain",
            "legal",
        ] {
            assert!(
                ids.contains(required),
                "domínio obrigatório ausente: {required}"
            );
        }
    }
}
