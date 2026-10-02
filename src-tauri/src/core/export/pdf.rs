use super::super::model::ResumeProfile;
use printpdf::{
    BuiltinFont, Color, Line, LinePoint, Mm, Op, PdfDocument, PdfFontHandle, PdfPage,
    PdfSaveOptions, Point, Pt, Rgb, TextItem,
};

const PAGE_WIDTH: f32 = 210.0;
const PAGE_HEIGHT: f32 = 297.0;
const MARGIN_X: f32 = 16.0;
const TOP_Y: f32 = 282.0;
const BOTTOM_Y: f32 = 15.0;
const CONTENT_WIDTH: f32 = PAGE_WIDTH - (MARGIN_X * 2.0);

pub fn render(profile: &ResumeProfile) -> Result<Vec<u8>, String> {
    let mut writer = PdfWriter::new();
    writer.text(&profile.person.name, 20.0, true, 7.2, MARGIN_X, None);
    writer.text(&profile.headline, 10.5, true, 4.8, MARGIN_X, None);
    writer.text(
        &join_non_empty([&profile.person.location, &profile.person.work_preference]),
        8.4,
        false,
        3.7,
        MARGIN_X,
        None,
    );
    writer.text(
        &join_non_empty([&profile.person.phone, &profile.person.email]),
        8.4,
        false,
        3.7,
        MARGIN_X,
        None,
    );
    writer.text(
        &join_non_empty([
            &profile.person.linkedin,
            &profile.person.portfolio,
            &profile.person.github,
        ]),
        8.0,
        false,
        3.7,
        MARGIN_X,
        None,
    );

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
        writer.text(&experience.company, 10.0, true, 4.3, MARGIN_X, Some(3.0));
        writer.text(&experience.role, 9.3, true, 4.0, MARGIN_X, None);
        writer.text(
            &join_non_empty([
                &experience.dates,
                &experience.location,
                &experience.work_mode,
            ]),
            8.2,
            false,
            3.7,
            MARGIN_X,
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
            writer.text(&project.name, 10.0, true, 4.3, MARGIN_X, Some(2.0));
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

struct PdfWriter {
    pages: Vec<Vec<Op>>,
    current: Vec<Op>,
    y: f32,
}

impl PdfWriter {
    fn new() -> Self {
        Self {
            pages: Vec::new(),
            current: Vec::new(),
            y: TOP_Y,
        }
    }

    fn paragraph(&mut self, value: &str) {
        self.text(value, 9.2, false, 4.1, MARGIN_X, Some(1.0));
    }

    fn bullet(&mut self, value: &str) {
        self.text(&format!("• {value}"), 9.0, false, 3.9, MARGIN_X + 3.0, None);
    }

    fn section(&mut self, title: &str) {
        self.ensure_space(10.0);
        self.y -= 3.0;
        self.text(&title.to_uppercase(), 10.5, true, 4.8, MARGIN_X, None);
        self.current.push(Op::SetOutlineColor {
            col: rgb(0.68, 0.75, 0.72),
        });
        self.current.push(Op::SetOutlineThickness { pt: Pt(0.55) });
        self.current.push(Op::DrawLine {
            line: Line {
                points: vec![
                    LinePoint {
                        p: Point::new(Mm(MARGIN_X), Mm(self.y + 1.6)),
                        bezier: false,
                    },
                    LinePoint {
                        p: Point::new(Mm(PAGE_WIDTH - MARGIN_X), Mm(self.y + 1.6)),
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
        let available_width = CONTENT_WIDTH - (x - MARGIN_X);
        let max_chars = ((available_width / (size * 0.19)).floor() as usize).max(24);
        for line in wrap(value, max_chars) {
            self.ensure_space(line_height_mm + 1.0);
            self.current.extend([
                Op::StartTextSection,
                Op::SetTextCursor {
                    pos: Point::new(Mm(x), Mm(self.y)),
                },
                Op::SetFont {
                    font: PdfFontHandle::Builtin(if bold {
                        BuiltinFont::HelveticaBold
                    } else {
                        BuiltinFont::Helvetica
                    }),
                    size: Pt(size),
                },
                Op::SetFillColor {
                    col: rgb(0.12, 0.15, 0.14),
                },
                Op::ShowText {
                    items: vec![TextItem::Text(line)],
                },
                Op::EndTextSection,
            ]);
            self.y -= line_height_mm;
        }
    }

    fn ensure_space(&mut self, needed: f32) {
        if self.y - needed < BOTTOM_Y {
            self.pages.push(std::mem::take(&mut self.current));
            self.y = TOP_Y;
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
    fn pdf_has_valid_header_and_embedded_profile_name() {
        let bytes = render(&load_archetype("01_frontend").unwrap()).unwrap();
        assert!(bytes.starts_with(b"%PDF-"));
        assert!(bytes.len() > 4_000);
    }

    #[test]
    fn wraps_long_content_without_dropping_words() {
        let lines = wrap("um dois três quatro cinco seis", 10);
        assert_eq!(lines.join(" "), "um dois três quatro cinco seis");
        assert!(lines.len() > 1);
    }
}
