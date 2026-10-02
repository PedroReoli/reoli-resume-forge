use super::super::model::ResumeProfile;
use super::ResumeTemplate;
use super::palette::{PaletteColors, profile_palette};
use super::zip_store::{self, ZipEntry};
use std::fmt::Write;

pub fn render_with_template(
    profile: &ResumeProfile,
    template: ResumeTemplate,
) -> Result<Vec<u8>, String> {
    let document = document_xml(profile, template);
    let styles = styles_xml(profile, template);
    let relationships = document_relationships(profile);
    let entries = [
        ZipEntry {
            name: "[Content_Types].xml",
            bytes: CONTENT_TYPES.as_bytes(),
        },
        ZipEntry {
            name: "_rels/.rels",
            bytes: ROOT_RELS.as_bytes(),
        },
        ZipEntry {
            name: "docProps/app.xml",
            bytes: APP_PROPERTIES.as_bytes(),
        },
        ZipEntry {
            name: "docProps/core.xml",
            bytes: CORE_PROPERTIES.as_bytes(),
        },
        ZipEntry {
            name: "word/document.xml",
            bytes: document.as_bytes(),
        },
        ZipEntry {
            name: "word/styles.xml",
            bytes: styles.as_bytes(),
        },
        ZipEntry {
            name: "word/_rels/document.xml.rels",
            bytes: relationships.as_bytes(),
        },
    ];
    zip_store::create(&entries)
}

pub(super) fn document_xml(profile: &ResumeProfile, template: ResumeTemplate) -> String {
    let mut body = String::new();
    paragraph(&mut body, "ResumeName", &profile.person.name);
    paragraph(&mut body, "ResumeHeadline", &profile.headline);
    let context = [&profile.person.location, &profile.person.work_preference]
        .into_iter()
        .filter(|value| !value.trim().is_empty())
        .map(String::as_str)
        .collect::<Vec<_>>()
        .join(" | ");
    paragraph(&mut body, "ResumeContact", &context);
    let communication = [&profile.person.phone, &profile.person.email]
        .into_iter()
        .filter(|value| !value.trim().is_empty())
        .map(String::as_str)
        .collect::<Vec<_>>()
        .join(" | ");
    paragraph(&mut body, "ResumeContact", &communication);
    for (index, link) in profile_links(profile).into_iter().enumerate() {
        hyperlink_paragraph(&mut body, &format!("rId{}", index + 2), link);
    }

    for section_id in &profile.layout.section_order {
        if !profile.layout.hidden_sections.contains(section_id) {
            render_section(&mut body, profile, section_id);
        }
    }

    let margin = DocxTheme::for_template(template).margin;
    format!(
        r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>{body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="{margin}" w:right="{margin}" w:bottom="{margin}" w:left="{margin}" w:header="0" w:footer="0" w:gutter="0"/></w:sectPr></w:body></w:document>"#
    )
}

fn render_section(body: &mut String, profile: &ResumeProfile, section_id: &str) {
    match section_id {
        "summary" => {
            section(body, profile.section_name("summary", "Resumo Profissional"));
            paragraph(body, "Normal", &profile.summary);
        }
        "skills" if !profile.skills.is_empty() => {
            section(
                body,
                profile.section_name("skills", "Competências Técnicas"),
            );
            if profile.layout.skills_style == "tags" {
                let values = profile
                    .skills
                    .values()
                    .flat_map(string_list)
                    .collect::<Vec<_>>()
                    .join(" • ");
                paragraph(body, "Normal", &values);
            } else {
                for (label, values) in &profile.skills {
                    labeled_paragraph(body, label, &formatted_skills(profile, values));
                }
            }
        }
        "soft_skills" if !profile.soft_skills.is_empty() => {
            section(
                body,
                profile.section_name("soft_skills", "Competências Comportamentais"),
            );
            paragraph(body, "Normal", &profile.soft_skills.join(" | "));
        }
        "experience" if !profile.experience.is_empty() => render_experience(body, profile),
        "projects" if !profile.projects.is_empty() => render_projects(body, profile),
        "education" if !profile.education.is_empty() => {
            section(
                body,
                profile.section_name("education", "Formação Acadêmica"),
            );
            for item in &profile.education {
                paragraph(
                    body,
                    "Normal",
                    &join_non_empty([&item.degree, &item.institution, &item.dates]),
                );
            }
        }
        "languages" if !profile.languages.is_empty() => {
            section(body, profile.section_name("languages", "Idiomas"));
            let values = profile
                .languages
                .iter()
                .map(|item| format!("{}: {}", item.language, item.level))
                .collect::<Vec<_>>()
                .join(" | ");
            paragraph(body, "Normal", &values);
        }
        "certifications" if !profile.certifications.is_empty() => {
            section(
                body,
                profile.section_name("certifications", "Certificações"),
            );
            for item in &profile.certifications {
                paragraph(
                    body,
                    "Normal",
                    &join_non_empty([&item.name, &item.issuer, &item.date]),
                );
            }
        }
        custom if custom.starts_with("custom:") => {
            let id = custom.trim_start_matches("custom:");
            if let Some(item) = profile.custom_sections.iter().find(|item| item.id == id) {
                section(body, &item.title);
                for value in &item.items {
                    paragraph(body, "ResumeBullet", &format!("• {value}"));
                }
            }
        }
        _ => {}
    }
}

fn render_experience(body: &mut String, profile: &ResumeProfile) {
    section(
        body,
        profile.section_name("experience", "Experiência Profissional"),
    );
    for item in &profile.experience {
        paragraph(body, "ResumeCompany", &item.company);
        paragraph(body, "ResumeRole", &item.role);
        paragraph(
            body,
            "ResumeMeta",
            &join_non_empty([&item.dates, &item.location, &item.work_mode]),
        );
        paragraph(body, "Normal", &item.summary);
        if profile.layout.experience_style == "paragraphs" {
            paragraph(body, "Normal", &item.bullets.join(" "));
        } else {
            for bullet in ordered_metrics(&item.bullets, &profile.layout.experience_style) {
                paragraph(body, "ResumeBullet", &format!("• {bullet}"));
            }
        }
        if !item.technologies.is_empty() {
            labeled_paragraph(body, tech_label(profile), &item.technologies.join(", "));
        }
    }
}

fn render_projects(body: &mut String, profile: &ResumeProfile) {
    section(body, profile.section_name("projects", "Projetos"));
    for item in &profile.projects {
        paragraph(body, "ResumeCompany", &item.name);
        paragraph(body, "Normal", &item.description);
        if profile.layout.projects_style == "paragraphs" {
            paragraph(body, "Normal", &item.metrics.join(" "));
        } else {
            for metric in ordered_metrics(&item.metrics, &profile.layout.projects_style) {
                paragraph(body, "ResumeBullet", &format!("• {metric}"));
            }
        }
        if !item.technologies.is_empty() {
            labeled_paragraph(body, tech_label(profile), &item.technologies.join(", "));
        }
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

fn section(output: &mut String, title: &str) {
    paragraph(output, "ResumeSection", &title.to_uppercase());
}

fn paragraph(output: &mut String, style: &str, text: &str) {
    if text.trim().is_empty() {
        return;
    }
    let _ = write!(
        output,
        "<w:p><w:pPr><w:pStyle w:val=\"{}\"/></w:pPr><w:r><w:t xml:space=\"preserve\">{}</w:t></w:r></w:p>",
        xml_escape(style),
        xml_escape(text.trim())
    );
}

fn labeled_paragraph(output: &mut String, label: &str, value: &str) {
    if value.trim().is_empty() {
        return;
    }
    let _ = write!(
        output,
        "<w:p><w:pPr><w:pStyle w:val=\"ResumeSkill\"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>{}: </w:t></w:r><w:r><w:t xml:space=\"preserve\">{}</w:t></w:r></w:p>",
        xml_escape(label),
        xml_escape(value.trim())
    );
}

fn hyperlink_paragraph(output: &mut String, relationship_id: &str, label: &str) {
    let _ = write!(
        output,
        "<w:p><w:pPr><w:pStyle w:val=\"ResumeContact\"/></w:pPr><w:hyperlink r:id=\"{}\" w:history=\"1\"><w:r><w:rPr><w:color w:val=\"356859\"/><w:u w:val=\"single\"/></w:rPr><w:t>{}</w:t></w:r></w:hyperlink></w:p>",
        xml_escape(relationship_id),
        xml_escape(label)
    );
}

fn document_relationships(profile: &ResumeProfile) -> String {
    let mut relationships = String::from(
        r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>"#,
    );
    for (index, link) in profile_links(profile).into_iter().enumerate() {
        let _ = write!(
            relationships,
            "<Relationship Id=\"rId{}\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink\" Target=\"{}\" TargetMode=\"External\"/>",
            index + 2,
            xml_escape(link)
        );
    }
    relationships.push_str("</Relationships>");
    relationships
}

fn profile_links(profile: &ResumeProfile) -> Vec<&str> {
    [
        &profile.person.linkedin,
        &profile.person.portfolio,
        &profile.person.github,
    ]
    .into_iter()
    .map(String::as_str)
    .filter(|value| value.starts_with("https://") || value.starts_with("http://"))
    .collect()
}

#[derive(Clone, Copy)]
struct DocxTheme {
    font: &'static str,
    body_size: u16,
    line: u16,
    margin: u16,
    alignment: &'static str,
    name_size: u16,
    headline_size: u16,
    section_size: u16,
    section_before: u16,
    company_before: u16,
    accent: &'static str,
    border: &'static str,
}

impl DocxTheme {
    fn for_template(template: ResumeTemplate) -> Self {
        match template {
            ResumeTemplate::Classic => Self {
                font: "Arial",
                body_size: 19,
                line: 235,
                margin: 893,
                alignment: "center",
                name_size: 40,
                headline_size: 21,
                section_size: 22,
                section_before: 110,
                company_before: 75,
                accent: "1F374D",
                border: "D9E0E6",
            },
            ResumeTemplate::Clean => Self {
                font: "Georgia",
                body_size: 19,
                line: 240,
                margin: 893,
                alignment: "center",
                name_size: 40,
                headline_size: 21,
                section_size: 22,
                section_before: 120,
                company_before: 80,
                accent: "1F374D",
                border: "D9E0E6",
            },
            ResumeTemplate::Compact => Self {
                font: "Arial",
                body_size: 17,
                line: 220,
                margin: 720,
                alignment: "left",
                name_size: 36,
                headline_size: 19,
                section_size: 19,
                section_before: 80,
                company_before: 45,
                accent: "252A2D",
                border: "A9AFB2",
            },
            ResumeTemplate::Executive => Self {
                font: "Aptos",
                body_size: 19,
                line: 245,
                margin: 980,
                alignment: "left",
                name_size: 44,
                headline_size: 22,
                section_size: 22,
                section_before: 140,
                company_before: 90,
                accent: "174A3B",
                border: "8FB49F",
            },
            ResumeTemplate::TechMinimalist => Self {
                font: "Consolas",
                body_size: 17,
                line: 220,
                margin: 720,
                alignment: "left",
                name_size: 37,
                headline_size: 19,
                section_size: 19,
                section_before: 80,
                company_before: 45,
                accent: "3178C6",
                border: "8CB7DB",
            },
            ResumeTemplate::ModernSplit => Self {
                font: "Arial",
                body_size: 18,
                line: 232,
                margin: 900,
                alignment: "left",
                name_size: 42,
                headline_size: 21,
                section_size: 21,
                section_before: 110,
                company_before: 70,
                accent: "1C567F",
                border: "73ADBF",
            },
            ResumeTemplate::ExecutiveBold => Self {
                font: "Aptos",
                body_size: 19,
                line: 245,
                margin: 980,
                alignment: "left",
                name_size: 46,
                headline_size: 22,
                section_size: 23,
                section_before: 145,
                company_before: 95,
                accent: "111E2E",
                border: "B3852E",
            },
            ResumeTemplate::Academic => Self {
                font: "Times New Roman",
                body_size: 19,
                line: 250,
                margin: 1020,
                alignment: "center",
                name_size: 39,
                headline_size: 20,
                section_size: 21,
                section_before: 145,
                company_before: 90,
                accent: "592933",
                border: "B28B93",
            },
        }
    }

    fn with_palette(mut self, palette: Option<PaletteColors>) -> Self {
        if let Some(colors) = palette {
            self.accent = colors.accent_hex;
            self.border = colors.divider_hex;
        }
        self
    }
}

fn styles_xml(profile: &ResumeProfile, template: ResumeTemplate) -> String {
    let theme = DocxTheme::for_template(template).with_palette(profile_palette(profile));
    format!(
        r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="{font}" w:hAnsi="{font}"/><w:sz w:val="{body_size}"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="44" w:line="{line}" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="ResumeName"><w:name w:val="Resume Name"/><w:basedOn w:val="Normal"/><w:pPr><w:jc w:val="{alignment}"/><w:spacing w:after="40"/></w:pPr><w:rPr><w:b/><w:color w:val="{accent}"/><w:sz w:val="{name_size}"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="ResumeHeadline"><w:name w:val="Resume Headline"/><w:basedOn w:val="Normal"/><w:pPr><w:jc w:val="{alignment}"/><w:spacing w:after="50"/></w:pPr><w:rPr><w:b/><w:sz w:val="{headline_size}"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="ResumeContact"><w:name w:val="Resume Contact"/><w:basedOn w:val="Normal"/><w:pPr><w:jc w:val="{alignment}"/><w:spacing w:after="20"/></w:pPr><w:rPr><w:color w:val="5A5A5A"/><w:sz w:val="17"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="ResumeSection"><w:name w:val="Resume Section"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="{section_before}" w:after="45"/><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="{border}"/></w:pBdr></w:pPr><w:rPr><w:b/><w:color w:val="{accent}"/><w:sz w:val="{section_size}"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="ResumeCompany"><w:name w:val="Resume Company"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="{company_before}" w:after="0"/></w:pPr><w:rPr><w:b/><w:color w:val="{accent}"/><w:sz w:val="20"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="ResumeRole"><w:name w:val="Resume Role"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:after="10"/></w:pPr><w:rPr><w:b/><w:sz w:val="19"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="ResumeMeta"><w:name w:val="Resume Meta"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:after="30"/></w:pPr><w:rPr><w:color w:val="5A5A5A"/><w:sz w:val="17"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="ResumeBullet"><w:name w:val="Resume Bullet"/><w:basedOn w:val="Normal"/><w:pPr><w:ind w:left="220" w:hanging="160"/><w:spacing w:after="32"/></w:pPr><w:rPr><w:sz w:val="18"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="ResumeSkill"><w:name w:val="Resume Skill"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="30"/></w:pPr></w:style></w:styles>"#,
        font = theme.font,
        body_size = theme.body_size,
        line = theme.line,
        alignment = theme.alignment,
        accent = theme.accent,
        name_size = theme.name_size,
        headline_size = theme.headline_size,
        section_before = theme.section_before,
        border = theme.border,
        section_size = theme.section_size,
        company_before = theme.company_before,
    )
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

fn xml_escape(value: &str) -> String {
    value
        .replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&apos;")
}

const CONTENT_TYPES: &str = r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>"#;
const ROOT_RELS: &str = r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>"#;
const APP_PROPERTIES: &str = r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Reoli Resume Forge</Application><AppVersion>1.0.0</AppVersion></Properties>"#;
const CORE_PROPERTIES: &str = r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>Currículo ATS</dc:title><dc:creator>Reoli Resume Forge</dc:creator></cp:coreProperties>"#;

#[cfg(test)]
mod tests {
    use super::*;
    use crate::core::archetypes::load_archetype;

    #[test]
    fn docx_is_linear_styled_and_contains_clickable_links() {
        let bytes = render_with_template(
            &load_archetype("01_frontend").unwrap(),
            ResumeTemplate::Clean,
        )
        .unwrap();
        assert!(bytes.starts_with(b"PK\x03\x04"));
        assert!(
            bytes
                .windows("word/document.xml".len())
                .any(|part| part == b"word/document.xml")
        );
        assert!(!bytes.windows(5).any(|part| part == b"<w:tbl"));
        assert!(
            bytes
                .windows("relationships/styles".len())
                .any(|part| part == b"relationships/styles")
        );
        assert!(
            bytes
                .windows("relationships/hyperlink".len())
                .any(|part| part == b"relationships/hyperlink")
        );
        assert!(
            bytes
                .windows("TargetMode=\"External\"".len())
                .any(|part| part == b"TargetMode=\"External\"")
        );
    }

    #[test]
    fn applies_profile_palette_to_docx_styles() {
        let mut profile = load_archetype("01_frontend").unwrap();
        profile
            .config
            .extra
            .insert("palette".into(), serde_json::json!("burgundy"));

        let styles = styles_xml(&profile, ResumeTemplate::TechMinimalist);
        assert!(styles.contains(r#"w:color w:val="6B3340""#));
        assert!(styles.contains(r#"w:color="D8BBC2""#));
    }
}
