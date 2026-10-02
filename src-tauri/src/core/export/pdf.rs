use super::super::model::ResumeProfile;
use super::ResumeTemplate;
use super::pdf_content::{
    estimate_text_width, is_safe_link, is_split_sidebar_section, join_non_empty, string_values,
    wrap,
};
use super::pdf_theme::PdfTheme;
use printpdf::{
    Actions, BorderArray, BuiltinFont, Color, ColorArray, HighlightingMode, Line, LinePoint,
    LinkAnnotation, Mm, Op, PdfDocument, PdfFontHandle, PdfPage, PdfSaveOptions, Point, Pt, Rect,
    Rgb, TextItem,
};

const PAGE_WIDTH: f32 = 210.0;
const PAGE_HEIGHT: f32 = 297.0;

mod sections;
use sections::render_section;

pub fn render_with_template(
    profile: &ResumeProfile,
    template: ResumeTemplate,
) -> Result<Vec<u8>, String> {
    let theme = PdfTheme::for_template(template);
    let mut writer = PdfWriter::new(theme);
    writer.begin_header();
    writer.header(profile, template);
    writer.end_header();
    let split = matches!(template, ResumeTemplate::ModernSplit);
    if split {
        writer.enable_split_layout(profile);
    }
    for section_id in &profile.layout.section_order {
        if profile.layout.hidden_sections.contains(section_id)
            || (split && is_split_sidebar_section(section_id))
        {
            continue;
        }
        render_section(&mut writer, profile, section_id, theme);
    }
    Ok(writer.finish(&profile.person.name))
}

struct PdfWriter {
    pages: Vec<Vec<Op>>,
    current: Vec<Op>,
    y: f32,
    content_x: f32,
    content_right: f32,
    split_layout: bool,
    split_first_page: bool,
    theme: PdfTheme,
    text_color: (f32, f32, f32),
}

impl PdfWriter {
    fn new(theme: PdfTheme) -> Self {
        Self {
            pages: Vec::new(),
            current: Vec::new(),
            y: theme.top_y,
            content_x: theme.margin_x,
            content_right: PAGE_WIDTH - theme.margin_x,
            split_layout: false,
            split_first_page: false,
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
                col: rgb(
                    self.theme.band_color.0,
                    self.theme.band_color.1,
                    self.theme.band_color.2,
                ),
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
                col: rgb(
                    self.theme.band_rule.0,
                    self.theme.band_rule.1,
                    self.theme.band_rule.2,
                ),
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
        if self.theme.centered_header {
            self.centered_text(
                &profile.person.name,
                self.theme.name_size,
                true,
                self.theme.name_line_height,
            );
            self.centered_text(
                &profile.headline,
                self.theme.headline_size,
                true,
                self.theme.headline_line_height,
            );
            self.centered_text(
                &join_non_empty([&profile.person.location, &profile.person.work_preference]),
                self.theme.meta_size,
                false,
                self.theme.meta_line_height,
            );
            self.centered_text(
                &join_non_empty([&profile.person.phone, &profile.person.email]),
                self.theme.meta_size,
                false,
                self.theme.meta_line_height,
            );
            self.centered_links([
                &profile.person.linkedin,
                &profile.person.portfolio,
                &profile.person.github,
            ]);
            self.y -= 2.0;
            return;
        }

        if self.theme.compact_header {
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
        let contact_x = if matches!(
            template,
            ResumeTemplate::Executive | ResumeTemplate::ExecutiveBold
        ) {
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
        for link in [
            &profile.person.linkedin,
            &profile.person.portfolio,
            &profile.person.github,
        ] {
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

    fn enable_split_layout(&mut self, profile: &ResumeProfile) {
        self.current.extend([
            Op::SetFillColor {
                col: rgb(0.11, 0.34, 0.50),
            },
            Op::DrawPolygon {
                polygon: Rect::from_xywh(
                    Pt::from(Mm(0.0)),
                    Pt::from(Mm(0.0)),
                    Pt::from(Mm(68.0)),
                    Pt::from(Mm(237.0)),
                )
                .to_polygon(),
            },
        ]);

        let previous_color = self.text_color;
        self.text_color = (0.95, 0.98, 1.0);
        let mut sidebar_y = 227.0;
        let hidden = &profile.layout.hidden_sections;

        if !hidden.iter().any(|id| id == "skills") && !profile.skills.is_empty() {
            sidebar_y =
                self.sidebar_title(profile.section_name("skills", "Competências"), sidebar_y);
            for (label, values) in &profile.skills {
                sidebar_y =
                    self.sidebar_value(&format!("{label}: {}", string_values(values)), sidebar_y);
            }
        }
        if !hidden.iter().any(|id| id == "soft_skills") && !profile.soft_skills.is_empty() {
            sidebar_y = self.sidebar_title(
                profile.section_name("soft_skills", "Comportamentais"),
                sidebar_y,
            );
            sidebar_y = self.sidebar_value(&profile.soft_skills.join(" · "), sidebar_y);
        }
        if !hidden.iter().any(|id| id == "education") && !profile.education.is_empty() {
            sidebar_y =
                self.sidebar_title(profile.section_name("education", "Formação"), sidebar_y);
            for item in &profile.education {
                sidebar_y = self.sidebar_value(
                    &join_non_empty([&item.degree, &item.institution, &item.dates]),
                    sidebar_y,
                );
            }
        }
        if !hidden.iter().any(|id| id == "certifications") && !profile.certifications.is_empty() {
            sidebar_y = self.sidebar_title(
                profile.section_name("certifications", "Certificações"),
                sidebar_y,
            );
            for item in profile.certifications.iter().take(6) {
                sidebar_y = self.sidebar_value(
                    &join_non_empty([&item.name, &item.issuer, &item.date]),
                    sidebar_y,
                );
            }
        }
        if !hidden.iter().any(|id| id == "languages") && !profile.languages.is_empty() {
            sidebar_y = self.sidebar_title(profile.section_name("languages", "Idiomas"), sidebar_y);
            for item in &profile.languages {
                sidebar_y =
                    self.sidebar_value(&format!("{}: {}", item.language, item.level), sidebar_y);
            }
        }

        self.text_color = previous_color;
        self.content_x = 76.0;
        self.content_right = 194.0;
        self.y = self.y.min(229.0);
        self.split_layout = true;
        self.split_first_page = true;
    }

    fn sidebar_title(&mut self, title: &str, mut y: f32) -> f32 {
        if y < 24.0 {
            return y;
        }
        y -= 3.0;
        self.text_block(&title.to_uppercase(), 8.5, true, 4.0, 11.0, 48.0, y) - 1.0
    }

    fn sidebar_value(&mut self, value: &str, y: f32) -> f32 {
        if y < 18.0 {
            return y;
        }
        self.text_block(value, 7.5, false, 3.4, 11.0, 48.0, y) - 1.0
    }

    fn centered_text(&mut self, value: &str, size: f32, bold: bool, line_height_mm: f32) {
        if value.trim().is_empty() {
            return;
        }
        let width = PAGE_WIDTH - (self.theme.margin_x * 2.0);
        let max_chars = self.max_chars_for_width(width, size, 24);
        for line in wrap(value, max_chars) {
            self.ensure_space(line_height_mm + 1.0);
            let estimated_width = estimate_text_width(&line, size).min(width);
            let x = ((PAGE_WIDTH - estimated_width) / 2.0).max(self.theme.margin_x);
            self.text_line(&line, size, bold, x, self.y);
            self.y -= line_height_mm;
        }
    }

    fn centered_links<const N: usize>(&mut self, values: [&String; N]) {
        let links = values
            .into_iter()
            .map(String::as_str)
            .filter(|value| !value.trim().is_empty() && is_safe_link(value))
            .collect::<Vec<_>>();
        if links.is_empty() {
            return;
        }
        let label = links.join(" | ");
        let size = self.theme.meta_size;
        let line_height = self.theme.meta_line_height;
        self.ensure_space(line_height + 1.0);
        let width = estimate_text_width(&label, size).min(PAGE_WIDTH - (self.theme.margin_x * 2.0));
        let x = ((PAGE_WIDTH - width) / 2.0).max(self.theme.margin_x);
        let y = self.y;
        self.text_line(&label, size, false, x, y);
        self.y -= line_height;
        let mut link_x = x;
        for target in links {
            let link_width = estimate_text_width(target, size);
            self.current.push(Op::LinkAnnotation {
                link: LinkAnnotation::new(
                    Rect::from_xywh(
                        Pt::from(Mm(link_x)),
                        Pt::from(Mm(y - 1.0)),
                        Pt::from(Mm(link_width)),
                        Pt::from(Mm(line_height)),
                    ),
                    Actions::uri(target.to_string()),
                    Some(BorderArray::Solid([0.0, 0.0, 0.0])),
                    Some(ColorArray::Transparent),
                    Some(HighlightingMode::Outline),
                ),
            });
            link_x += link_width + estimate_text_width(" | ", size);
        }
    }

    fn paragraph(&mut self, value: &str) {
        let needed = self.estimated_text_height(
            value,
            self.theme.body_size,
            self.theme.body_line_height,
            self.content_x,
            Some(1.0),
        );
        self.keep_together_if_possible(needed);
        self.text(
            value,
            self.theme.body_size,
            false,
            self.theme.body_line_height,
            self.content_x,
            Some(1.0),
        );
    }

    fn estimated_text_height(
        &self,
        value: &str,
        size: f32,
        line_height_mm: f32,
        x: f32,
        before_mm: Option<f32>,
    ) -> f32 {
        if value.trim().is_empty() {
            return 0.0;
        }
        let available_width = self.content_right - x;
        let max_chars = self.max_chars_for_width(available_width, size, 24);
        before_mm.unwrap_or_default() + wrap(value, max_chars).len() as f32 * line_height_mm
    }

    fn max_chars_for_width(&self, width: f32, size: f32, minimum: usize) -> usize {
        let width_factor = if matches!(self.theme.normal_font, BuiltinFont::Courier) {
            0.22
        } else {
            0.19
        };
        ((width / (size * width_factor)).floor() as usize).max(minimum)
    }

    fn keep_together_if_possible(&mut self, needed: f32) {
        let page_capacity = self.theme.top_y - self.theme.bottom_y;
        if needed <= page_capacity && self.y - needed < self.theme.bottom_y {
            self.new_page();
        }
    }

    fn bullet(&mut self, value: &str) {
        let bullet = format!("• {value}");
        let needed = self.estimated_text_height(
            &bullet,
            self.theme.body_size - 0.2,
            self.theme.body_line_height - 0.2,
            self.content_x + 3.0,
            None,
        );
        self.keep_together_if_possible(needed);
        self.text(
            &bullet,
            self.theme.body_size - 0.2,
            false,
            self.theme.body_line_height - 0.2,
            self.content_x + 3.0,
            None,
        );
    }

    fn section(&mut self, title: &str) {
        let title_height = self.estimated_text_height(
            &title.to_uppercase(),
            self.theme.section_size,
            self.theme.section_line_height,
            self.content_x,
            None,
        );
        self.ensure_space(
            self.theme.section_spacing + title_height + (self.theme.body_line_height * 2.0),
        );
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
            self.content_x,
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
                        p: Point::new(Mm(self.content_x), Mm(self.y + 1.6)),
                        bezier: false,
                    },
                    LinePoint {
                        p: Point::new(Mm(self.content_right), Mm(self.y + 1.6)),
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
        let available_width = self.content_right - x;
        let max_chars = self.max_chars_for_width(available_width, size, 24);
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
        let max_chars = self.max_chars_for_width(width, size, 12);
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
        self.text(label, size, false, line_height, self.content_x, None);
        self.current.push(Op::LinkAnnotation {
            link: LinkAnnotation::new(
                Rect::from_xywh(
                    Pt::from(Mm(self.content_x)),
                    Pt::from(Mm(link_y - 1.0)),
                    Pt::from(Mm(self.content_right - self.content_x)),
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
            self.new_page();
        }
    }

    fn new_page(&mut self) {
        self.pages.push(std::mem::take(&mut self.current));
        self.y = self.theme.top_y;
        if self.split_first_page {
            self.content_x = self.theme.margin_x;
            self.content_right = PAGE_WIDTH - self.theme.margin_x;
            self.split_first_page = false;
        }
        if self.split_layout {
            self.draw_split_continuation_mark();
        }
    }

    fn draw_split_continuation_mark(&mut self) {
        self.current.extend([
            Op::SetFillColor {
                col: rgb(
                    self.theme.band_color.0,
                    self.theme.band_color.1,
                    self.theme.band_color.2,
                ),
            },
            Op::DrawPolygon {
                polygon: Rect::from_xywh(
                    Pt::from(Mm(0.0)),
                    Pt::from(Mm(0.0)),
                    Pt::from(Mm(6.0)),
                    Pt::from(Mm(PAGE_HEIGHT)),
                )
                .to_polygon(),
            },
        ]);
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

    #[test]
    fn moves_a_complete_block_to_the_next_page_when_it_fits_there() {
        let theme = PdfTheme::for_template(ResumeTemplate::Classic);
        let mut writer = PdfWriter::new(theme);
        writer.text_line(
            "conteudo",
            theme.body_size,
            false,
            theme.margin_x,
            theme.top_y,
        );
        writer.y = theme.bottom_y + 20.0;

        writer.keep_together_if_possible(40.0);

        assert_eq!(writer.pages.len(), 1);
        assert_eq!(writer.y, theme.top_y);
    }

    #[test]
    fn courier_reserves_more_width_per_character_than_proportional_fonts() {
        let courier = PdfWriter::new(PdfTheme::for_template(ResumeTemplate::TechMinimalist));
        let helvetica = PdfWriter::new(PdfTheme::for_template(ResumeTemplate::Classic));

        assert!(
            courier.max_chars_for_width(180.0, 9.0, 12)
                < helvetica.max_chars_for_width(180.0, 9.0, 12)
        );
    }
}
