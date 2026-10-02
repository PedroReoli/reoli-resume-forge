use super::super::model::ResumeProfile;

pub fn to_markdown(profile: &ResumeProfile) -> String {
    let mut output = String::new();
    line(&mut output, &format!("# {}", profile.person.name));
    line(&mut output, &format!("**{}**", profile.headline));
    let contact = [
        profile.person.location.as_str(),
        profile.person.work_preference.as_str(),
        profile.person.phone.as_str(),
        profile.person.email.as_str(),
    ]
    .into_iter()
    .filter(|value| !value.trim().is_empty())
    .collect::<Vec<_>>()
    .join(" | ");
    line(&mut output, &contact);
    for link in [
        &profile.person.linkedin,
        &profile.person.portfolio,
        &profile.person.github,
    ] {
        if !link.trim().is_empty() {
            line(&mut output, link);
        }
    }

    for section_id in &profile.layout.section_order {
        if !profile.layout.hidden_sections.contains(section_id) {
            render_section(&mut output, profile, section_id);
        }
    }
    output.trim().to_string() + "\n"
}

fn render_section(output: &mut String, profile: &ResumeProfile, section_id: &str) {
    match section_id {
        "summary" => {
            section(
                output,
                profile.section_name("summary", "Resumo Profissional"),
            );
            line(output, &profile.summary);
        }
        "skills" if !profile.skills.is_empty() => {
            section(
                output,
                profile.section_name("skills", "Competências Técnicas"),
            );
            if profile.layout.skills_style == "tags" {
                line(
                    output,
                    &profile
                        .skills
                        .values()
                        .flat_map(string_list)
                        .collect::<Vec<_>>()
                        .join(" · "),
                );
            } else {
                for (label, values) in &profile.skills {
                    line(
                        output,
                        &format!("**{label}:** {}", formatted_skills(profile, values)),
                    );
                }
            }
        }
        "soft_skills" if !profile.soft_skills.is_empty() => {
            section(
                output,
                profile.section_name("soft_skills", "Competências Comportamentais"),
            );
            line(output, &profile.soft_skills.join(" | "));
        }
        "experience" if !profile.experience.is_empty() => {
            section(
                output,
                profile.section_name("experience", "Experiência Profissional"),
            );
            for item in &profile.experience {
                line(output, &format!("### {} — {}", item.company, item.role));
                line(
                    output,
                    &format!(
                        "*{}*",
                        join_non_empty([&item.dates, &item.location, &item.work_mode])
                    ),
                );
                line(output, &item.summary);
                if profile.layout.experience_style == "paragraphs" {
                    line(output, &item.bullets.join(" "));
                } else {
                    for bullet in ordered_metrics(&item.bullets, &profile.layout.experience_style) {
                        line(output, &format!("- {bullet}"));
                    }
                }
                if !item.technologies.is_empty() {
                    line(
                        output,
                        &format!(
                            "**{}:** {}",
                            tech_label(profile),
                            item.technologies.join(", ")
                        ),
                    );
                }
            }
        }
        "projects" if !profile.projects.is_empty() => {
            section(output, profile.section_name("projects", "Projetos"));
            for item in &profile.projects {
                line(output, &format!("### {}", item.name));
                line(output, &item.description);
                if profile.layout.projects_style == "paragraphs" {
                    line(output, &item.metrics.join(" "));
                } else {
                    for metric in ordered_metrics(&item.metrics, &profile.layout.projects_style) {
                        line(output, &format!("- {metric}"));
                    }
                }
                if !item.technologies.is_empty() {
                    line(
                        output,
                        &format!(
                            "**{}:** {}",
                            tech_label(profile),
                            item.technologies.join(", ")
                        ),
                    );
                }
            }
        }
        "education" if !profile.education.is_empty() => {
            section(
                output,
                profile.section_name("education", "Formação Acadêmica"),
            );
            for item in &profile.education {
                line(
                    output,
                    &format!(
                        "- {}",
                        join_non_empty([&item.degree, &item.institution, &item.dates])
                    ),
                );
            }
        }
        "languages" if !profile.languages.is_empty() => {
            section(output, profile.section_name("languages", "Idiomas"));
            for item in &profile.languages {
                line(output, &format!("- {}: {}", item.language, item.level));
            }
        }
        "certifications" if !profile.certifications.is_empty() => {
            section(
                output,
                profile.section_name("certifications", "Certificações"),
            );
            for item in &profile.certifications {
                line(
                    output,
                    &format!(
                        "- {}",
                        join_non_empty([&item.name, &item.issuer, &item.date])
                    ),
                );
            }
        }
        custom if custom.starts_with("custom:") => {
            let id = custom.trim_start_matches("custom:");
            if let Some(item) = profile.custom_sections.iter().find(|item| item.id == id) {
                section(output, &item.title);
                for value in &item.items {
                    line(output, &format!("- {value}"));
                }
            }
        }
        _ => {}
    }
}

fn string_values(value: &serde_json::Value) -> String {
    value
        .as_array()
        .map(|items| {
            items
                .iter()
                .filter_map(|item| item.as_str())
                .collect::<Vec<_>>()
                .join(", ")
        })
        .unwrap_or_else(|| value.as_str().unwrap_or_default().to_string())
}

fn string_list(value: &serde_json::Value) -> Vec<String> {
    value
        .as_array()
        .map(|items| {
            items
                .iter()
                .filter_map(|item| item.as_str().map(str::to_string))
                .collect()
        })
        .unwrap_or_default()
}

fn formatted_skills(profile: &ResumeProfile, value: &serde_json::Value) -> String {
    if profile.layout.skills_style != "levels" {
        return string_values(value);
    }
    string_list(value)
        .into_iter()
        .map(|skill| {
            let level = profile
                .layout
                .skill_levels
                .get(&skill)
                .and_then(serde_json::Value::as_u64)
                .map(|value| format!("{value}/5"))
                .unwrap_or_else(|| "não definido".into());
            format!("{skill} — {level}")
        })
        .collect::<Vec<_>>()
        .join(", ")
}

fn ordered_metrics<'a>(values: &'a [String], style: &str) -> Vec<&'a str> {
    let mut items = values.iter().map(String::as_str).collect::<Vec<_>>();
    if style == "metrics" {
        items.sort_by_key(|value| !value.chars().any(|character| character.is_ascii_digit()));
    }
    items
}

fn join_non_empty<const N: usize>(values: [&String; N]) -> String {
    values
        .into_iter()
        .filter(|value| !value.trim().is_empty())
        .map(String::as_str)
        .collect::<Vec<_>>()
        .join(" | ")
}

fn tech_label(profile: &ResumeProfile) -> &str {
    if profile.config.tech_label.trim().is_empty() {
        "Tecnologias"
    } else {
        &profile.config.tech_label
    }
}

fn section(output: &mut String, title: &str) {
    output.push_str("\n## ");
    output.push_str(title);
    output.push_str("\n\n");
}

fn line(output: &mut String, value: &str) {
    if !value.trim().is_empty() {
        output.push_str(value.trim());
        output.push_str("\n\n");
    }
}
