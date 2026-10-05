use super::super::pdf_content::{formatted_skills, join_non_empty, ordered_metrics, string_list};
use super::super::pdf_theme::PdfTheme;
use super::PdfWriter;
use crate::core::model::{Experience, Project, ResumeProfile};

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
                    writer.paragraph(&format!("**{label}:** {}", formatted_skills(profile, values)));
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
    if let Some(first) = profile.experience.first() {
        writer.keep_together_if_possible(
            theme.section_spacing
                + theme.section_line_height
                + experience_header_height(writer, first, theme),
        );
    }
    writer.section(profile.section_name("experience", "Experiência Profissional"));
    for experience in &profile.experience {
        let technology_line = experience_technology_line(profile, experience);
        writer.keep_together_if_possible(experience_header_height(writer, experience, theme));
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
        if profile.layout.experience_style == "paragraphs" {
            let body = experience.bullets.join(" ");
            let mut needed = writer.estimated_text_height(
                &body,
                theme.body_size,
                theme.body_line_height,
                writer.content_x,
                Some(1.0),
            );
            if let Some(technologies) = &technology_line {
                needed += writer.estimated_text_height(
                    technologies,
                    theme.body_size,
                    theme.body_line_height,
                    writer.content_x,
                    Some(1.0),
                );
            }
            ensure_experience_continuation(writer, experience, needed, theme);
            writer.paragraph(&body);
        } else {
            let bullets = ordered_metrics(&experience.bullets, &profile.layout.experience_style);
            for (index, bullet) in bullets.iter().enumerate() {
                let mut needed = writer.estimated_bullet_height(bullet);
                if index + 1 == bullets.len()
                    && let Some(technologies) = &technology_line
                {
                    needed += writer.estimated_text_height(
                        technologies,
                        theme.body_size,
                        theme.body_line_height,
                        writer.content_x,
                        Some(1.0),
                    );
                }
                ensure_experience_continuation(writer, experience, needed, theme);
                writer.bullet(bullet);
            }
        }
        if let Some(technologies) = technology_line {
            let needed = writer.estimated_text_height(
                &technologies,
                theme.body_size,
                theme.body_line_height,
                writer.content_x,
                Some(1.0),
            );
            ensure_experience_continuation(writer, experience, needed, theme);
            writer.paragraph(&technologies);
        }
    }
}

fn experience_technology_line(profile: &ResumeProfile, experience: &Experience) -> Option<String> {
    if experience.technologies.is_empty() {
        return None;
    }
    let label = if profile.config.tech_label.trim().is_empty() {
        "Tecnologias"
    } else {
        &profile.config.tech_label
    };
    Some(format!("**{label}:** {}", experience.technologies.join(", ")))
}

fn ensure_experience_continuation(
    writer: &mut PdfWriter,
    experience: &Experience,
    needed: f32,
    theme: PdfTheme,
) {
    if !writer.block_needs_fresh_page(needed) {
        return;
    }
    writer.new_page();
    let x = writer.content_x;
    writer.text(
        &experience.company,
        theme.company_size,
        true,
        theme.company_line_height,
        x,
        None,
    );
}

fn experience_header_height(writer: &PdfWriter, experience: &Experience, theme: PdfTheme) -> f32 {
    let x = writer.content_x;
    writer.estimated_text_height(
        &experience.company,
        theme.company_size,
        theme.company_line_height,
        x,
        Some(theme.record_spacing),
    ) + writer.estimated_text_height(
        &experience.role,
        theme.role_size,
        theme.role_line_height,
        x,
        None,
    ) + writer.estimated_text_height(
        &join_non_empty([
            &experience.dates,
            &experience.location,
            &experience.work_mode,
        ]),
        theme.meta_size,
        theme.meta_line_height,
        x,
        None,
    ) + writer.estimated_text_height(
        &experience.summary,
        theme.body_size,
        theme.body_line_height,
        x,
        Some(1.0),
    )
}

fn render_projects(writer: &mut PdfWriter, profile: &ResumeProfile, theme: PdfTheme) {
    if let Some(first) = profile.projects.first() {
        writer.keep_together_if_possible(
            theme.section_spacing
                + theme.section_line_height
                + project_header_height(writer, first, theme),
        );
    }
    writer.section(profile.section_name("projects", "Projetos"));
    for project in &profile.projects {
        writer.keep_together_if_possible(project_header_height(writer, project, theme));
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
            let metrics = project.metrics.join(" ");
            let needed = writer.estimated_text_height(
                &metrics,
                theme.body_size,
                theme.body_line_height,
                writer.content_x,
                Some(1.0),
            );
            ensure_project_continuation(writer, project, needed, theme);
            writer.paragraph(&metrics);
        } else {
            for metric in ordered_metrics(&project.metrics, &profile.layout.projects_style) {
                let needed = writer.estimated_bullet_height(metric);
                ensure_project_continuation(writer, project, needed, theme);
                writer.bullet(metric);
            }
        }
        if !project.technologies.is_empty() {
            let label = if profile.config.tech_label.trim().is_empty() {
                "Tecnologias"
            } else {
                &profile.config.tech_label
            };
            let technologies = format!("**{label}:** {}", project.technologies.join(", "));
            let needed = writer.estimated_text_height(
                &technologies,
                theme.body_size,
                theme.body_line_height,
                writer.content_x,
                Some(1.0),
            );
            ensure_project_continuation(writer, project, needed, theme);
            writer.paragraph(&technologies);
        }
    }
}

fn project_header_height(writer: &PdfWriter, project: &Project, theme: PdfTheme) -> f32 {
    let x = writer.content_x;
    writer.estimated_text_height(
        &project.name,
        theme.company_size,
        theme.company_line_height,
        x,
        Some(theme.record_spacing),
    ) + writer.estimated_text_height(
        &project.description,
        theme.body_size,
        theme.body_line_height,
        x,
        Some(1.0),
    )
}

pub(super) fn ensure_project_continuation(
    writer: &mut PdfWriter,
    project: &Project,
    needed: f32,
    theme: PdfTheme,
) {
    if !writer.block_needs_fresh_page(needed) {
        return;
    }
    writer.new_page();
    writer.text(
        &project.name,
        theme.company_size,
        true,
        theme.company_line_height,
        writer.content_x,
        None,
    );
}
