use super::model::ResumeProfile;
use serde::Serialize;
use serde_json::Value;
use std::cmp::Reverse;

mod catalog;

#[derive(Clone, Debug, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct JobRequirement {
    pub text: String,
    pub level: RequirementLevel,
    pub keywords: Vec<String>,
}

#[derive(Clone, Copy, Debug, PartialEq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum RequirementLevel {
    Required,
    Preferred,
    Unspecified,
}

#[derive(Clone, Debug, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DetectedDomain {
    pub id: String,
    pub label: String,
    pub matched_keywords: Vec<String>,
}

#[derive(Clone, Debug, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct JobAnalysis {
    pub keywords: Vec<String>,
    pub required_keywords: Vec<String>,
    pub seniority: String,
    pub detected_domains: Vec<DetectedDomain>,
    pub requirements: Vec<JobRequirement>,
}

#[derive(Clone, Debug, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MatchReport {
    pub score: Option<f64>,
    pub score_kind: &'static str,
    pub matched: Vec<String>,
    pub missing: Vec<String>,
    pub job: JobAnalysis,
    pub warnings: Vec<String>,
}

#[derive(Clone, Debug, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BulletProvenance {
    pub experience: usize,
    pub source_bullet: usize,
    pub quantified: bool,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TailorResult {
    pub profile: ResumeProfile,
    pub report: MatchReport,
    pub quantified_percent: f64,
    pub provenance: Vec<BulletProvenance>,
}

pub fn analyze(profile: &ResumeProfile, job_description: &str) -> Result<MatchReport, String> {
    profile.validate()?;
    let job = parse_job_description(job_description)?;
    let evidence = evidence_text(profile)?;
    let matched: Vec<String> = job
        .keywords
        .iter()
        .filter(|keyword| profile_supports(&evidence, keyword))
        .cloned()
        .collect();
    let missing = job
        .keywords
        .iter()
        .filter(|keyword| !matched.contains(keyword))
        .cloned()
        .collect::<Vec<_>>();
    let total_weight = job
        .keywords
        .iter()
        .map(|keyword| keyword_weight(keyword, &job.required_keywords))
        .sum::<u32>();
    let matched_weight = matched
        .iter()
        .map(|keyword| keyword_weight(keyword, &job.required_keywords))
        .sum::<u32>();
    let score = (total_weight > 0)
        .then(|| round_one(100.0 * f64::from(matched_weight) / f64::from(total_weight)));
    let mut warnings = Vec::new();
    if job.keywords.is_empty() {
        warnings.push("NO_KNOWN_KEYWORDS: requisitos exigem revisão manual".into());
    }

    Ok(MatchReport {
        score,
        score_kind: "weighted_keyword_coverage",
        matched,
        missing,
        job,
        warnings,
    })
}

pub fn tailor(
    source: &ResumeProfile,
    job_description: &str,
    model_id: Option<&str>,
    confirmed_us_overlap: bool,
) -> Result<TailorResult, String> {
    let mut profile = source.clone();
    let mut report = analyze(source, job_description)?;
    let required = report.job.required_keywords.clone();
    let matched = report.matched.clone();
    let mut provenance = Vec::new();

    for (experience_index, experience) in profile.experience.iter_mut().enumerate() {
        let mut ranked = experience
            .bullets
            .iter()
            .cloned()
            .enumerate()
            .collect::<Vec<_>>();
        ranked.sort_by_key(|(_, text)| Reverse(relevance(text, &matched, &required)));
        let count = ranked.len().min(5);
        let metric_target = ((count as f64) * 0.6).round() as usize;
        let mut selected = ranked
            .iter()
            .filter(|(_, text)| is_quantified(text))
            .take(metric_target)
            .cloned()
            .collect::<Vec<_>>();
        let remaining = count.saturating_sub(selected.len());
        selected.extend(
            ranked
                .iter()
                .filter(|(_, text)| !is_quantified(text))
                .take(remaining)
                .cloned(),
        );
        for candidate in &ranked {
            if selected.len() == count {
                break;
            }
            if !selected.contains(candidate) {
                selected.push(candidate.clone());
            }
        }
        selected.sort_by_key(|(_, text)| Reverse(relevance(text, &matched, &required)));
        experience.bullets = selected.iter().map(|(_, text)| text.clone()).collect();
        experience
            .technologies
            .sort_by_key(|item| Reverse(relevance(item, &matched, &required)));
        provenance.extend(
            selected
                .into_iter()
                .map(|(source_bullet, text)| BulletProvenance {
                    experience: experience_index,
                    source_bullet,
                    quantified: is_quantified(&text),
                }),
        );
    }

    for skills in profile.skills.values_mut() {
        if let Some(items) = skills.as_array_mut() {
            items.sort_by_key(|item| {
                Reverse(relevance(
                    item.as_str().unwrap_or_default(),
                    &matched,
                    &required,
                ))
            });
        }
    }
    if !matched.is_empty() {
        let label = if model_id == Some("05_internacional_en") {
            "Relevant expertise"
        } else {
            "Competências alinhadas"
        };
        profile.skills.insert(
            label.into(),
            Value::Array(matched.iter().cloned().map(Value::String).collect()),
        );
    }
    profile.target_keywords = matched;
    apply_international_copy(&mut profile, model_id, confirmed_us_overlap);

    let quantified_percent = if provenance.is_empty() {
        0.0
    } else {
        round_one(
            100.0 * provenance.iter().filter(|item| item.quantified).count() as f64
                / provenance.len() as f64,
        )
    };
    if !(50.0..=70.0).contains(&quantified_percent) {
        report
            .warnings
            .push("METRIC_RATIO_OUTSIDE_TARGET: preservadas apenas métricas existentes".into());
    }
    if model_id == Some("05_internacional_en") && !confirmed_us_overlap {
        report
            .warnings
            .push("US_OVERLAP_UNCONFIRMED: disponibilidade não incluída".into());
    }

    Ok(TailorResult {
        profile,
        report,
        quantified_percent,
        provenance,
    })
}

fn parse_job_description(text: &str) -> Result<JobAnalysis, String> {
    let length = text.trim().chars().count();
    if !(20..=50_000).contains(&length) {
        return Err("a descrição deve conter entre 20 e 50.000 caracteres".into());
    }
    let mut requirements = Vec::new();
    let mut section = RequirementLevel::Unspecified;
    for line in split_requirements(text) {
        let mandatory = contains_any(
            &line,
            &[
                "required",
                "must",
                "mandatory",
                "obrigatorio",
                "obrigatorios",
                "requisitos",
                "requirements",
            ],
        );
        let optional = contains_any(
            &line,
            &[
                "preferred",
                "nice to have",
                "diferencial",
                "desejavel",
                "optional",
            ],
        );
        if line.ends_with(':') {
            section = if optional {
                RequirementLevel::Preferred
            } else if mandatory {
                RequirementLevel::Required
            } else {
                RequirementLevel::Unspecified
            };
        }
        let level = if optional {
            RequirementLevel::Preferred
        } else if mandatory {
            RequirementLevel::Required
        } else {
            section
        };
        let mut positioned_keywords = catalog::keyword_definitions()
            .iter()
            .filter_map(|definition| {
                first_alias_position(&line, &definition.aliases)
                    .map(|position| (position, definition.canonical.clone()))
            })
            .collect::<Vec<_>>();
        positioned_keywords.sort_by_key(|(position, _)| *position);
        let keywords = positioned_keywords
            .into_iter()
            .map(|(_, canonical)| canonical)
            .collect();
        requirements.push(JobRequirement {
            text: line,
            level,
            keywords,
        });
    }
    let mut keywords = unique(
        requirements
            .iter()
            .flat_map(|requirement| requirement.keywords.iter().cloned()),
    );
    let required_keywords = unique(
        requirements
            .iter()
            .filter(|requirement| requirement.level == RequirementLevel::Required)
            .flat_map(|requirement| requirement.keywords.iter().cloned()),
    );
    keywords.sort_by_key(|keyword| !required_keywords.contains(keyword));
    let detected_domains = catalog::detect_domains(&keywords);
    let seniority = [
        (
            "lead",
            &["lead", "lider", "lideranca", "staff", "principal"][..],
        ),
        ("senior", &["senior", "sr"][..]),
        ("mid", &["pleno", "mid"][..]),
        ("junior", &["junior", "jr"][..]),
    ]
    .into_iter()
    .find(|(_, aliases)| contains_any(text, aliases))
    .map(|(level, _)| level)
    .unwrap_or("unspecified")
    .to_string();

    Ok(JobAnalysis {
        keywords,
        required_keywords,
        seniority,
        detected_domains,
        requirements,
    })
}

fn split_requirements(text: &str) -> Vec<String> {
    let mut result = Vec::new();
    let mut current = String::new();
    let mut characters = text.chars().peekable();
    while let Some(character) = characters.next() {
        let sentence_period =
            character == '.' && characters.peek().is_none_or(|next| next.is_whitespace());
        if matches!(character, '\n' | ';' | '!' | '?') || sentence_period {
            let value = current.trim();
            if !value.is_empty() {
                result.push(value.to_string());
            }
            current.clear();
        } else {
            current.push(character);
        }
    }
    let value = current.trim();
    if !value.is_empty() {
        result.push(value.to_string());
    }
    result
}

fn evidence_text(profile: &ResumeProfile) -> Result<String, String> {
    let mut value = serde_json::to_value(profile).map_err(|error| error.to_string())?;
    if let Some(object) = value.as_object_mut() {
        object.remove("config");
        object.remove("target_keywords");
    }
    serde_json::to_string(&value).map_err(|error| error.to_string())
}

fn profile_supports(evidence: &str, canonical: &str) -> bool {
    catalog::keyword_definition(canonical)
        .is_some_and(|definition| matches_aliases(evidence, &definition.aliases))
}

fn relevance(text: &str, matched: &[String], required: &[String]) -> u32 {
    matched
        .iter()
        .filter(|keyword| profile_supports(text, keyword))
        .map(|keyword| keyword_weight(keyword, required))
        .sum()
}

fn keyword_weight(keyword: &str, required: &[String]) -> u32 {
    if required.iter().any(|item| item == keyword) {
        3
    } else {
        1
    }
}

fn matches_aliases(text: &str, aliases: &[String]) -> bool {
    aliases.iter().any(|alias| contains_term(text, alias))
}

fn first_alias_position(text: &str, aliases: &[String]) -> Option<usize> {
    aliases
        .iter()
        .filter_map(|alias| term_position(text, alias))
        .min()
}

fn contains_any(text: &str, aliases: &[&str]) -> bool {
    aliases.iter().any(|alias| contains_term(text, alias))
}

fn contains_term(text: &str, term: &str) -> bool {
    term_position(text, term).is_some()
}

fn term_position(text: &str, term: &str) -> Option<usize> {
    let haystack = normalize(text);
    let needle = normalize(term);
    haystack.match_indices(&needle).find_map(|(index, _)| {
        let before = haystack[..index].chars().next_back();
        let after = haystack[index + needle.len()..].chars().next();
        (!before.is_some_and(is_word_character) && !after.is_some_and(is_word_character))
            .then_some(index)
    })
}

fn is_word_character(character: char) -> bool {
    character.is_alphanumeric() || character == '_'
}

fn normalize(value: &str) -> String {
    value
        .chars()
        .map(|character| match character {
            'á' | 'à' | 'â' | 'ã' | 'ä' | 'Á' | 'À' | 'Â' | 'Ã' | 'Ä' => 'a',
            'é' | 'è' | 'ê' | 'ë' | 'É' | 'È' | 'Ê' | 'Ë' => 'e',
            'í' | 'ì' | 'î' | 'ï' | 'Í' | 'Ì' | 'Î' | 'Ï' => 'i',
            'ó' | 'ò' | 'ô' | 'õ' | 'ö' | 'Ó' | 'Ò' | 'Ô' | 'Õ' | 'Ö' => 'o',
            'ú' | 'ù' | 'û' | 'ü' | 'Ú' | 'Ù' | 'Û' | 'Ü' => 'u',
            'ç' | 'Ç' => 'c',
            character => character.to_ascii_lowercase(),
        })
        .collect::<String>()
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
}

fn is_quantified(text: &str) -> bool {
    let normalized = normalize(text);
    normalized
        .chars()
        .any(|character| character.is_ascii_digit())
        && [
            "%",
            "+",
            "organiza",
            "component",
            "paginas",
            "pages",
            "integra",
            "hours",
            "horas",
            "users",
            "usuarios",
        ]
        .iter()
        .any(|marker| normalized.contains(marker))
}

fn unique(values: impl IntoIterator<Item = String>) -> Vec<String> {
    let mut result = Vec::new();
    for value in values {
        if !result.contains(&value) {
            result.push(value);
        }
    }
    result
}

fn round_one(value: f64) -> f64 {
    (value * 10.0).round() / 10.0
}

fn apply_international_copy(
    profile: &mut ResumeProfile,
    model_id: Option<&str>,
    confirmed_us_overlap: bool,
) {
    if model_id != Some("05_internacional_en") {
        return;
    }
    if confirmed_us_overlap && !profile.summary.contains("US Eastern and Pacific") {
        profile.summary.push_str(" Available for asynchronous collaboration and agreed working-hour overlap with US Eastern and Pacific teams.");
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::core::archetypes::load_archetype;

    #[test]
    fn weights_required_keywords_more_than_preferred() {
        let profile = load_archetype("01_frontend").unwrap();
        let report = analyze(
            &profile,
            "Requirements: React is required. Nice to have: Kubernetes and Redis.",
        )
        .unwrap();
        assert_eq!(report.matched, vec!["React"]);
        assert_eq!(report.missing, vec!["Kubernetes", "Redis"]);
        assert_eq!(report.score, Some(60.0));
    }

    #[test]
    fn rejects_job_description_outside_limits() {
        let profile = load_archetype("01_frontend").unwrap();
        assert!(analyze(&profile, "React").is_err());
    }

    #[test]
    fn metadata_keywords_are_not_evidence() {
        let mut profile = load_archetype("01_frontend").unwrap();
        profile.target_keywords = vec!["Kubernetes".into()];
        let report = analyze(
            &profile,
            "Requirements: Kubernetes is mandatory for production operations.",
        )
        .unwrap();
        assert!(report.matched.is_empty());
        assert_eq!(report.missing, vec!["Kubernetes"]);
    }

    #[test]
    fn tailoring_never_invents_missing_keyword() {
        let profile = load_archetype("01_frontend").unwrap();
        let result = tailor(
            &profile,
            "Requirements: React and Kubernetes are mandatory for this senior role.",
            Some("01_frontend"),
            false,
        )
        .unwrap();
        assert!(result.profile.target_keywords.contains(&"React".into()));
        assert!(
            !result
                .profile
                .target_keywords
                .contains(&"Kubernetes".into())
        );
        assert_eq!(result.profile.experience.len(), profile.experience.len());
    }

    #[test]
    fn detects_supply_chain_and_legal_domains_in_portuguese() {
        let supply_chain = parse_job_description(
            "Requisitos: experiência com S&OP, planejamento de demanda, MRP, gestão de estoques e OTIF.",
        )
        .unwrap();
        assert_eq!(supply_chain.detected_domains[0].id, "supply-chain");
        assert!(supply_chain.keywords.contains(&"Demand Planning".into()));
        assert!(
            supply_chain
                .keywords
                .contains(&"Inventory Management".into())
        );

        let legal = parse_job_description(
            "Advogado com OAB ativa, experiência em contratos empresariais, due diligence, LGPD e contencioso.",
        )
        .unwrap();
        assert_eq!(legal.detected_domains[0].id, "legal");
        assert!(legal.keywords.contains(&"OAB".into()));
        assert!(legal.keywords.contains(&"Contract Law".into()));
    }

    #[test]
    fn detects_qa_and_it_infrastructure_domains() {
        let qa = parse_job_description(
            "QA Engineer responsável por automação de testes com Playwright, Cypress, testes de API e regressão.",
        )
        .unwrap();
        assert_eq!(qa.detected_domains[0].id, "quality-assurance");
        assert!(qa.keywords.contains(&"Test Automation".into()));

        let it = parse_job_description(
            "Analista de tecnologia da informação com Active Directory, Microsoft 365, ITIL, gestão de incidentes e redes.",
        )
        .unwrap();
        assert_eq!(it.detected_domains[0].id, "it-infrastructure");
        assert!(it.keywords.contains(&"Active Directory".into()));
    }

    #[test]
    fn preserves_dotted_technology_names_when_splitting_requirements() {
        let analysis = parse_job_description(
            "Obrigatório: Next.js e .NET para APIs. Desejável: Node.js e React.",
        )
        .unwrap();
        assert!(analysis.keywords.contains(&"Next.js".into()));
        assert!(analysis.keywords.contains(&".NET".into()));
        assert!(analysis.keywords.contains(&"Node.js".into()));
    }

    #[test]
    fn short_terms_respect_word_boundaries() {
        assert!(!contains_term("integração com Google Workspace", "go"));
        assert!(!contains_term("perfil participativo", "ti"));
        assert!(contains_term("desenvolvimento em Go", "go"));
        assert!(contains_term("operação de TI", "ti"));
    }

    #[test]
    fn canonical_names_are_always_searchable() {
        let analysis = parse_job_description(
            "Conhecimentos desejáveis em SAP, Scrum, NPS, CAD e Statistics para atuação multidisciplinar.",
        )
        .unwrap();
        for keyword in ["SAP", "Scrum", "NPS", "CAD", "Statistics"] {
            assert!(
                analysis.keywords.contains(&keyword.into()),
                "ausente: {keyword}"
            );
        }
    }
}
