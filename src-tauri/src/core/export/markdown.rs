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

    section(
        &mut output,
        profile.section_name("summary", "Resumo Profissional"),
    );
    line(&mut output, &profile.summary);

    section(
        &mut output,
        profile.section_name("skills", "Competências Técnicas"),
    );
    for (label, values) in &profile.skills {
        let values = values
            .as_array()
            .map(|items| {
                items
                    .iter()
                    .filter_map(|item| item.as_str())
                    .collect::<Vec<_>>()
                    .join(", ")
            })
            .unwrap_or_else(|| values.as_str().unwrap_or_default().to_string());
        line(&mut output, &format!("**{label}:** {values}"));
    }
    if !profile.soft_skills.is_empty() {
        section(
            &mut output,
            profile.section_name("soft_skills", "Competências Comportamentais"),
        );
        line(&mut output, &profile.soft_skills.join(" | "));
    }

    section(
        &mut output,
        profile.section_name("experience", "Experiência Profissional"),
    );
    for experience in &profile.experience {
        line(
            &mut output,
            &format!("### {} — {}", experience.company, experience.role),
        );
        let meta = [
            &experience.dates,
            &experience.location,
            &experience.work_mode,
        ]
        .into_iter()
        .filter(|value| !value.trim().is_empty())
        .map(String::as_str)
        .collect::<Vec<_>>()
        .join(" | ");
        line(&mut output, &format!("*{meta}*"));
        line(&mut output, &experience.summary);
        for bullet in &experience.bullets {
            line(&mut output, &format!("- {bullet}"));
        }
        if !experience.technologies.is_empty() {
            line(
                &mut output,
                &format!(
                    "**{}:** {}",
                    tech_label(profile),
                    experience.technologies.join(", ")
                ),
            );
        }
    }

    if !profile.projects.is_empty() {
        section(&mut output, profile.section_name("projects", "Projetos"));
        for project in &profile.projects {
            line(&mut output, &format!("### {}", project.name));
            line(&mut output, &project.description);
            for metric in &project.metrics {
                line(&mut output, &format!("- {metric}"));
            }
        }
    }

    section(
        &mut output,
        profile.section_name("education", "Formação Acadêmica"),
    );
    for item in &profile.education {
        line(
            &mut output,
            &format!("- {} | {} | {}", item.degree, item.institution, item.dates),
        );
    }
    section(&mut output, profile.section_name("languages", "Idiomas"));
    for item in &profile.languages {
        line(&mut output, &format!("- {}: {}", item.language, item.level));
    }
    if !profile.certifications.is_empty() {
        section(
            &mut output,
            profile.section_name("certifications", "Certificações"),
        );
        for item in &profile.certifications {
            line(
                &mut output,
                &format!("- {} | {} | {}", item.name, item.issuer, item.date),
            );
        }
    }
    output.trim().to_string() + "\n"
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
