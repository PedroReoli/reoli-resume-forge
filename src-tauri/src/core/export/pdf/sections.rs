use super::super::pdf_content::{formatted_skills, join_non_empty, ordered_metrics, string_list};
use super::super::pdf_theme::PdfTheme;
use super::PdfWriter;
use crate::core::model::ResumeProfile;

pub(super) fn render_section(
    writer: &mut PdfWriter,
    profile: &ResumeProfile,
    section_id: &str,
    theme: PdfTheme,
) {
    match section_id {
        "summary" => {
            writer.section(profile.section_name("summary", "Resumo Profissional"));
            writer.paragraph(&profile.summary);
        }
        "skills" if !profile.skills.is_empty() => {
            writer.section(profile.section_name("skills", "Competências Técnicas"));
            if profile.layout.skills_style == "tags" {
                writer.paragraph(
                    &profile
                        .skills
                        .values()
                        .flat_map(string_list)
                        .collect::<Vec<_>>()
                        .join(" • "),
                );
            } else {
                for (label, values) in &profile.skills {
                    writer.paragraph(&format!("{label}: {}", formatted_skills(profile, values)));
                }
            }
        }
        "soft_skills" if !profile.soft_skills.is_empty() => {
            writer.section(profile.section_name("soft_skills", "Competências Comportamentais"));
            writer.paragraph(&profile.soft_skills.join(" | "));
        }
        "experience" if !profile.experience.is_empty() => render_experience(writer, profile, theme),
        "projects" if !profile.projects.is_empty() => render_projects(writer, profile, theme),
        "education" if !profile.education.is_empty() => {
            writer.section(profile.section_name("education", "Formação Acadêmica"));
            for item in &profile.education {
                writer.paragraph(&join_non_empty([
                    &item.degree,
                    &item.institution,
                    &item.dates,
                ]));
            }
        }
        "certifications" if !profile.certifications.is_empty() => {
            writer.section(profile.section_name("certifications", "Certificações"));
            for item in &profile.certifications {
                writer.paragraph(&join_non_empty([&item.name, &item.issuer, &item.date]));
            }
        }
        "languages" if !profile.languages.is_empty() => {
            writer.section(profile.section_name("languages", "Idiomas"));
            writer.paragraph(
                &profile
                    .languages
                    .iter()
                    .map(|item| format!("{}: {}", item.language, item.level))
                    .collect::<Vec<_>>()
                    .join(" | "),
            );
        }
        custom if custom.starts_with("custom:") => {
            let id = custom.trim_start_matches("custom:");
            if let Some(section) = profile.custom_sections.iter().find(|item| item.id == id) {
                writer.section(&section.title);
                for item in &section.items {
                    writer.bullet(item);
                }
            }
        }
        _ => {}
    }
}

fn render_experience(writer: &mut PdfWriter, profile: &ResumeProfile, theme: PdfTheme) {
    writer.section(profile.section_name("experience", "Experiência Profissional"));
    for experience in &profile.experience {
        let x = writer.content_x;
        writer.text(
            &experience.company,
            theme.company_size,
            true,
            theme.company_line_height,
            x,
            Some(theme.record_spacing),
        );
        writer.text(
            &experience.role,
            theme.role_size,
            true,
            theme.role_line_height,
            x,
            None,
        );
        writer.text(
            &join_non_empty([
                &experience.dates,
                &experience.location,
                &experience.work_mode,
            ]),
            theme.meta_size,
            false,
            theme.meta_line_height,
            x,
            None,
        );
        writer.paragraph(&experience.summary);
        let technology_line = if experience.technologies.is_empty() {
            None
        } else {
            let label = if profile.config.tech_label.trim().is_empty() {
                "Tecnologias"
            } else {
                &profile.config.tech_label
            };
            Some(format!("{label}: {}", experience.technologies.join(", ")))
        };
        if profile.layout.experience_style == "paragraphs" {
            writer.paragraph(&experience.bullets.join(" "));
        } else {
            let bullets = ordered_metrics(&experience.bullets, &profile.layout.experience_style);
            for (index, bullet) in bullets.iter().enumerate() {
                if index + 1 == bullets.len() {
                    if let Some(technologies) = &technology_line {
                        let bullet_line = format!("• {bullet}");
                        let bullet_height = writer.estimated_text_height(
                            &bullet_line,
                            theme.body_size - 0.2,
                            theme.body_line_height - 0.2,
                            writer.content_x + 3.0,
                            None,
                        );
                        let technologies_height = writer.estimated_text_height(
                            technologies,
                            theme.body_size,
                            theme.body_line_height,
                            writer.content_x,
                            Some(1.0),
                        );
                        writer.keep_together_if_possible(bullet_height + technologies_height);
                    }
                }
                writer.bullet(bullet);
            }
        }
        if let Some(technologies) = technology_line {
            writer.paragraph(&technologies);
        }
    }
}

fn render_projects(writer: &mut PdfWriter, profile: &ResumeProfile, theme: PdfTheme) {
    writer.section(profile.section_name("projects", "Projetos"));
    for project in &profile.projects {
        let x = writer.content_x;
        writer.text(
            &project.name,
            theme.company_size,
            true,
            theme.company_line_height,
            x,
            Some(theme.record_spacing),
        );
        writer.paragraph(&project.description);
        if profile.layout.projects_style == "paragraphs" {
            writer.paragraph(&project.metrics.join(" "));
        } else {
            for metric in ordered_metrics(&project.metrics, &profile.layout.projects_style) {
                writer.bullet(metric);
            }
        }
        if !project.technologies.is_empty() {
            writer.paragraph(&project.technologies.join(" | "));
        }
    }
}
