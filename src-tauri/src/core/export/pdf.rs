use super::super::model::ResumeProfile;
use super::ResumeTemplate;
use printpdf::{
    Actions, BorderArray, BuiltinFont, Color, ColorArray, HighlightingMode, Line, LinePoint,
    LinkAnnotation, Mm, Op, PdfDocument, PdfFontHandle, PdfPage, PdfSaveOptions, Point, Pt, Rect,
    Rgb, TextItem,
};

const PAGE_WIDTH: f32 = 210.0;
const PAGE_HEIGHT: f32 = 297.0;

pub fn render_with_template(
    profile: &ResumeProfile,
    template: ResumeTemplate,
) -> Result<Vec<u8>, String> {
    let theme = PdfTheme::for_template(template);
    let mut writer = PdfWriter::new(theme);
    writer.begin_header();
    writer.header(profile, template);
    writer.end_header();

    writer.section(profile.section_name("summary", "Resumo Profissional"));
    writer.paragraph(&profile.summary);
    writer.section(profile.section_name("skills", "Competências Técnicas"));
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
        writer.paragraph(&format!("{label}: {values}"));
    }
    if !profile.soft_skills.is_empty() {
        writer.section(profile.section_name("soft_skills", "Competências Comportamentais"));
        writer.paragraph(&profile.soft_skills.join(" | "));
    }

    writer.section(profile.section_name("experience", "Experiência Profissional"));
    for experience in &profile.experience {
        writer.text(
            &experience.company,
            theme.company_size,
            true,
            theme.company_line_height,
            theme.margin_x,
            Some(theme.record_spacing),
        );
        writer.text(
            &experience.role,
            theme.role_size,
            true,
            theme.role_line_height,
            theme.margin_x,
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
            theme.margin_x,
            None,
        );
        writer.paragraph(&experience.summary);
        for bullet in &experience.bullets {
            writer.bullet(bullet);
        }
        if !experience.technologies.is_empty() {
            let label = if profile.config.tech_label.trim().is_empty() {
                "Tecnologias"
            } else {
                &profile.config.tech_label
            };
            writer.paragraph(&format!("{label}: {}", experience.technologies.join(", ")));
        }
    }

    if !profile.projects.is_empty() {
        writer.section(profile.section_name("projects", "Projetos"));
        for project in &profile.projects {
            writer.text(
                &project.name,
                theme.company_size,
                true,
                theme.company_line_height,
                theme.margin_x,
                Some(theme.record_spacing),
            );
            writer.paragraph(&project.description);
            for metric in &project.metrics {
                writer.bullet(metric);
            }
        }
    }
    writer.section(profile.section_name("education", "Formação Acadêmica"));
    for item in &profile.education {
        writer.paragraph(&join_non_empty([
            &item.degree,
            &item.institution,
            &item.dates,
        ]));
    }
    writer.section(profile.section_name("languages", "Idiomas"));
    writer.paragraph(
        &profile
            .languages
            .iter()
            .map(|item| format!("{}: {}", item.language, item.level))
            .collect::<Vec<_>>()
            .join(" | "),
    );
    if !profile.certifications.is_empty() {
        writer.section(profile.section_name("certifications", "Certificações"));
        for item in &profile.certifications {
            writer.paragraph(&join_non_empty([&item.name, &item.issuer, &item.date]));
        }
    }
    Ok(writer.finish(&profile.person.name))
}

#[derive(Clone, Copy)]
struct PdfTheme {
    margin_x: f32,
    top_y: f32,
    bottom_y: f32,
    name_size: f32,
    name_line_height: f32,
    headline_size: f32,
    headline_line_height: f32,
    meta_size: f32,
    meta_line_height: f32,
    body_size: f32,
    body_line_height: f32,
    section_size: f32,
    section_line_height: f32,
    section_spacing: f32,
    company_size: f32,
    company_line_height: f32,
    role_size: f32,
    role_line_height: f32,
    record_spacing: f32,
    accent: (f32, f32, f32),
    normal_font: BuiltinFont,
    bold_font: BuiltinFont,
    header_band: bool,
}

impl PdfTheme {
    fn for_template(template: ResumeTemplate) -> Self {
        match template {
            ResumeTemplate::Clean => Self {
                margin_x: 16.0,
                top_y: 282.0,
                bottom_y: 15.0,
                name_size: 20.0,
                name_line_height: 7.2,
                headline_size: 10.5,
                headline_line_height: 4.8,
                meta_size: 8.4,
                meta_line_height: 3.7,
                body_size: 9.2,
                body_line_height: 4.1,
                section_size: 10.5,
                section_line_height: 4.8,
                section_spacing: 3.0,
                company_size: 10.0,
                company_line_height: 4.3,
                role_size: 9.3,
                role_line_height: 4.0,
                record_spacing: 3.0,
                accent: (0.12, 0.24, 0.32),
                normal_font: BuiltinFont::TimesRoman,
                bold_font: BuiltinFont::TimesBold,
                header_band: false,
            },
            ResumeTemplate::Compact => Self {
                margin_x: 14.0,
                top_y: 284.0,
                bottom_y: 13.0,
                name_size: 18.0,
                name_line_height: 6.1,
                headline_size: 9.8,
                headline_line_height: 4.2,
                meta_size: 7.9,
                meta_line_height: 3.35,
                body_size: 8.6,
                body_line_height: 3.65,
                section_size: 9.3,
                section_line_height: 4.0,
                section_spacing: 1.8,
                company_size: 9.4,
                company_line_height: 3.85,
                role_size: 8.8,
                role_line_height: 3.6,
                record_spacing: 1.8,
                accent: (0.16, 0.18, 0.20),
                normal_font: BuiltinFont::Helvetica,
                bold_font: BuiltinFont::HelveticaBold,
                header_band: false,
            },
            ResumeTemplate::Executive => Self {
                margin_x: 18.0,
                top_y: 280.0,
                bottom_y: 16.0,
                name_size: 22.0,
                name_line_height: 7.8,
                headline_size: 11.0,
                headline_line_height: 5.0,
                meta_size: 8.3,
                meta_line_height: 3.8,
                body_size: 9.2,
                body_line_height: 4.15,
                section_size: 10.8,
                section_line_height: 4.9,
                section_spacing: 3.8,
                company_size: 10.2,
                company_line_height: 4.4,
                role_size: 9.4,
                role_line_height: 4.0,
                record_spacing: 3.4,
                accent: (0.09, 0.29, 0.23),
                normal_font: BuiltinFont::Helvetica,
                bold_font: BuiltinFont::HelveticaBold,
                header_band: true,
            },
        }
    }
}

struct PdfWriter {
    pages: Vec<Vec<Op>>,
    current: Vec<Op>,
    y: f32,
    theme: PdfTheme,
    text_color: (f32, f32, f32),
}

impl PdfWriter {
    fn new(theme: PdfTheme) -> Self {
        Self {
            pages: Vec::new(),
            current: Vec::new(),
            y: theme.top_y,
            theme,
            text_color: (0.12, 0.15, 0.14),
        }
    }

    fn begin_header(&mut self) {
        if !self.theme.header_band {
            return;
        }
        self.current.extend([
            Op::SetFillColor {
                col: rgb(0.09, 0.21, 0.18),
            },
            Op::DrawPolygon {
                polygon: Rect::from_xywh(
                    Pt::from(Mm(0.0)),
                    Pt::from(Mm(237.0)),
                    Pt::from(Mm(PAGE_WIDTH)),
                    Pt::from(Mm(60.0)),
                )
                .to_polygon(),
            },
            Op::SetFillColor {
                col: rgb(0.56, 0.71, 0.62),
            },
            Op::DrawPolygon {
                polygon: Rect::from_xywh(
                    Pt::from(Mm(0.0)),
                    Pt::from(Mm(237.0)),
                    Pt::from(Mm(PAGE_WIDTH)),
                    Pt::from(Mm(2.0)),
                )
                .to_polygon(),
            },
        ]);
        self.text_color = (0.96, 0.98, 0.97);
    }

    fn header(&mut self, profile: &ResumeProfile, template: ResumeTemplate) {
        if matches!(template, ResumeTemplate::Compact) {
            self.text(
                &profile.person.name,
                self.theme.name_size,
                true,
                self.theme.name_line_height,
                self.theme.margin_x,
                None,
            );
            self.text(
                &profile.headline,
                self.theme.headline_size,
                true,
                self.theme.headline_line_height,
                self.theme.margin_x,
                None,
            );
            self.text(
                &join_non_empty([&profile.person.location, &profile.person.work_preference]),
                self.theme.meta_size,
                false,
                self.theme.meta_line_height,
                self.theme.margin_x,
                None,
            );
            self.text(
                &join_non_empty([&profile.person.phone, &profile.person.email]),
                self.theme.meta_size,
                false,
                self.theme.meta_line_height,
                self.theme.margin_x,
                None,
            );
            for link in [
                &profile.person.linkedin,
                &profile.person.portfolio,
                &profile.person.github,
            ] {
                self.link(link, link);
            }
            return;
        }

        let start_y = self.y;
        let contact_x = if matches!(template, ResumeTemplate::Executive) {
            132.0
        } else {
            130.0
        };
        let identity_width = contact_x - self.theme.margin_x - 10.0;
        let contact_width = PAGE_WIDTH - self.theme.margin_x - contact_x;
        let name_end = self.text_block(
            &profile.person.name,
            self.theme.name_size,
            true,
            self.theme.name_line_height,
            self.theme.margin_x,
            identity_width,
            start_y,
        );
        let identity_end = self.text_block(
            &profile.headline,
            self.theme.headline_size,
            true,
            self.theme.headline_line_height,
            self.theme.margin_x,
            identity_width,
            name_end,
        );

        let mut contact_y = start_y;
        for value in [
            &profile.person.email,
            &profile.person.phone,
            &profile.person.location,
        ] {
            contact_y = self.text_block(
                value,
                self.theme.meta_size,
                false,
                self.theme.meta_line_height,
                contact_x,
                contact_width,
                contact_y,
            );
        }
        for link in [&profile.person.linkedin, &profile.person.portfolio] {
            contact_y = self.link_block(link, link, contact_x, contact_width, contact_y);
        }
        self.y = identity_end.min(contact_y) - 4.0;
    }

    fn end_header(&mut self) {
        if self.theme.header_band {
            self.y = self.y.min(234.0);
            self.text_color = (0.12, 0.15, 0.14);
        }
    }

    fn paragraph(&mut self, value: &str) {
        self.text(
            value,
            self.theme.body_size,
            false,
            self.theme.body_line_height,
            self.theme.margin_x,
            Some(1.0),
        );
    }

    fn bullet(&mut self, value: &str) {
        self.text(
            &format!("• {value}"),
            self.theme.body_size - 0.2,
            false,
            self.theme.body_line_height - 0.2,
            self.theme.margin_x + 3.0,
            None,
        );
    }

    fn section(&mut self, title: &str) {
        self.ensure_space(10.0);
        self.y -= self.theme.section_spacing;
        let previous_color = self.text_color;
        if self.theme.header_band {
            self.text_color = self.theme.accent;
        }
        self.text(
            &title.to_uppercase(),
            self.theme.section_size,
            true,
            self.theme.section_line_height,
            self.theme.margin_x,
            None,
        );
        self.text_color = previous_color;
        self.current.push(Op::SetOutlineColor {
            col: rgb(
                self.theme.accent.0,
                self.theme.accent.1,
                self.theme.accent.2,
            ),
        });
        self.current.push(Op::SetOutlineThickness { pt: Pt(0.55) });
        self.current.push(Op::DrawLine {
            line: Line {
                points: vec![
                    LinePoint {
                        p: Point::new(Mm(self.theme.margin_x), Mm(self.y + 1.6)),
                        bezier: false,
                    },
                    LinePoint {
                        p: Point::new(Mm(PAGE_WIDTH - self.theme.margin_x), Mm(self.y + 1.6)),
                        bezier: false,
                    },
                ],
                is_closed: false,
            },
        });
    }

    fn text(
        &mut self,
        value: &str,
        size: f32,
        bold: bool,
        line_height_mm: f32,
        x: f32,
        before_mm: Option<f32>,
    ) {
        if value.trim().is_empty() {
            return;
        }
        if let Some(spacing) = before_mm {
            self.y -= spacing;
        }
        let content_width = PAGE_WIDTH - (self.theme.margin_x * 2.0);
        let available_width = content_width - (x - self.theme.margin_x);
        let max_chars = ((available_width / (size * 0.19)).floor() as usize).max(24);
        for line in wrap(value, max_chars) {
            self.ensure_space(line_height_mm + 1.0);
            self.text_line(&line, size, bold, x, self.y);
            self.y -= line_height_mm;
        }
    }

    #[allow(clippy::too_many_arguments)]
    fn text_block(
        &mut self,
        value: &str,
        size: f32,
        bold: bool,
        line_height_mm: f32,
        x: f32,
        width: f32,
        mut y: f32,
    ) -> f32 {
        if value.trim().is_empty() {
            return y;
        }
        let max_chars = ((width / (size * 0.19)).floor() as usize).max(12);
        for line in wrap(value, max_chars) {
            self.text_line(&line, size, bold, x, y);
            y -= line_height_mm;
        }
        y
    }

    fn text_line(&mut self, value: &str, size: f32, bold: bool, x: f32, y: f32) {
        self.current.extend([
            Op::StartTextSection,
            Op::SetTextCursor {
                pos: Point::new(Mm(x), Mm(y)),
            },
            Op::SetFont {
                font: PdfFontHandle::Builtin(if bold {
                    self.theme.bold_font
                } else {
                    self.theme.normal_font
                }),
                size: Pt(size),
            },
            Op::SetFillColor {
                col: rgb(self.text_color.0, self.text_color.1, self.text_color.2),
            },
            Op::ShowText {
                items: vec![TextItem::Text(value.to_string())],
            },
            Op::EndTextSection,
        ]);
    }

    fn link_block(&mut self, label: &str, target: &str, x: f32, width: f32, y: f32) -> f32 {
        if label.trim().is_empty() || !is_safe_link(target) {
            return y;
        }
        let end_y = self.text_block(
            label,
            self.theme.meta_size,
            false,
            self.theme.meta_line_height,
            x,
            width,
            y,
        );
        self.current.push(Op::LinkAnnotation {
            link: LinkAnnotation::new(
                Rect::from_xywh(
                    Pt::from(Mm(x)),
                    Pt::from(Mm(end_y)),
                    Pt::from(Mm(width)),
                    Pt::from(Mm(y - end_y + 1.0)),
                ),
                Actions::uri(target.to_string()),
                Some(BorderArray::Solid([0.0, 0.0, 0.0])),
                Some(ColorArray::Transparent),
                Some(HighlightingMode::Outline),
            ),
        });
        end_y
    }

    fn link(&mut self, label: &str, target: &str) {
        if label.trim().is_empty() || !is_safe_link(target) {
            return;
        }
        let size = self.theme.meta_size;
        let line_height = self.theme.meta_line_height;
        self.ensure_space(line_height + 1.0);
        let link_y = self.y;
        self.text(label, size, false, line_height, self.theme.margin_x, None);
        self.current.push(Op::LinkAnnotation {
            link: LinkAnnotation::new(
                Rect::from_xywh(
                    Pt::from(Mm(self.theme.margin_x)),
                    Pt::from(Mm(link_y - 1.0)),
                    Pt::from(Mm(PAGE_WIDTH - (self.theme.margin_x * 2.0))),
                    Pt::from(Mm(line_height)),
                ),
                Actions::uri(target.to_string()),
                Some(BorderArray::Solid([0.0, 0.0, 0.0])),
                Some(ColorArray::Transparent),
                Some(HighlightingMode::Outline),
            ),
        });
    }

    fn ensure_space(&mut self, needed: f32) {
        if self.y - needed < self.theme.bottom_y {
            self.pages.push(std::mem::take(&mut self.current));
            self.y = self.theme.top_y;
        }
    }

    fn finish(mut self, title: &str) -> Vec<u8> {
        if !self.current.is_empty() || self.pages.is_empty() {
            self.pages.push(self.current);
        }
        let pages = self
            .pages
            .into_iter()
            .map(|ops| PdfPage::new(Mm(PAGE_WIDTH), Mm(PAGE_HEIGHT), ops))
            .collect();
        PdfDocument::new(title)
            .with_pages(pages)
            .save(&PdfSaveOptions::default(), &mut Vec::new())
    }
}

fn is_safe_link(value: &str) -> bool {
    value.starts_with("https://") || value.starts_with("http://")
}

fn wrap(value: &str, max_chars: usize) -> Vec<String> {
    let mut lines = Vec::new();
    for paragraph in value.lines() {
        let mut current = String::new();
        for word in paragraph.split_whitespace() {
            if !current.is_empty() && current.chars().count() + word.chars().count() + 1 > max_chars
            {
                lines.push(std::mem::take(&mut current));
            }
            if !current.is_empty() {
                current.push(' ');
            }
            current.push_str(word);
        }
        if !current.is_empty() {
            lines.push(current);
        }
    }
    lines
}

fn join_non_empty<const N: usize>(values: [&String; N]) -> String {
    values
        .into_iter()
        .filter(|value| !value.trim().is_empty())
        .map(String::as_str)
        .collect::<Vec<_>>()
        .join(" | ")
}

fn rgb(r: f32, g: f32, b: f32) -> Color {
    Color::Rgb(Rgb {
        r,
        g,
        b,
        icc_profile: None,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::core::archetypes::load_archetype;

    #[test]
    fn pdf_has_valid_header_and_clickable_links() {
        let bytes = render_with_template(
            &load_archetype("01_frontend").unwrap(),
            ResumeTemplate::Clean,
        )
        .unwrap();
        assert!(bytes.starts_with(b"%PDF-"));
        assert!(bytes.len() > 4_000);
        assert!(bytes.windows(4).any(|part| part == b"/URI"));
    }

    #[test]
    fn wraps_long_content_without_dropping_words() {
        let lines = wrap("um dois três quatro cinco seis", 10);
        assert_eq!(lines.join(" "), "um dois três quatro cinco seis");
        assert!(lines.len() > 1);
    }
}
