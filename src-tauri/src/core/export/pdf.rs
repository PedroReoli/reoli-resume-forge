use super::super::model::ResumeProfile;
use super::ResumeTemplate;
use super::density::DensityPreset;
use super::palette::profile_palette;
use super::pdf_content::{
    estimate_text_width, is_safe_link, is_split_sidebar_section, join_non_empty, string_values,
    wrap_styled_to_width, wrap_to_width, TextSpan,
};
use super::pdf_theme::PdfTheme;
use super::typeface::profile_typeface;
use printpdf::{
    Actions, BorderArray, BuiltinFont, Color, ColorArray, HighlightingMode, Line, LinePoint,
    LinkAnnotation, Mm, Op, PdfDocument, PdfFontHandle, PdfPage, PdfSaveOptions, Point, Pt, Rect,
    Rgb, TextItem,
};

const PAGE_WIDTH: f32 = 210.0;
const PAGE_HEIGHT: f32 = 297.0;
const SECTION_RULE_THICKNESS_PT: f32 = 0.75;
const SECTION_RULE_LINE_HEIGHT_RATIO: f32 = 0.60;
const BULLET_MARKER_INDENT_MM: f32 = 1.0;
const BULLET_TEXT_INDENT_MM: f32 = 4.0;

mod sections;
use sections::render_section;

pub fn render_with_template(
    profile: &ResumeProfile,
    template: ResumeTemplate,
) -> Result<Vec<u8>, String> {
    let theme = PdfTheme::for_template(template)
        .with_palette(profile_palette(profile))
        .with_typeface(profile_typeface(profile))
        .with_density(DensityPreset::from_profile(profile));
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
    split_sidebar_ops: Vec<Op>,
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
            split_sidebar_ops: Vec::new(),
            theme,
            text_color: (34.0 / 255.0, 34.0 / 255.0, 34.0 / 255.0),
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
            self.text_color = (34.0 / 255.0, 34.0 / 255.0, 34.0 / 255.0);
        }
    }

    fn enable_split_layout(&mut self, profile: &ResumeProfile) {
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
                    Pt::from(Mm(68.0)),
                    Pt::from(Mm(237.0)),
                )
                .to_polygon(),
            },
        ]);

        let page_ops = std::mem::take(&mut self.current);

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

        self.split_sidebar_ops = std::mem::take(&mut self.current);
        self.current = page_ops;
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
        let lines = wrap_styled_to_width(
            value,
            bold,
            width,
            size,
            self.theme.normal_font,
            self.theme.bold_font,
        );
        for line in lines {
            self.ensure_space(line_height_mm + 1.0);
            let line_width = line
                .iter()
                .map(|span| {
                    let font = if span.bold {
                        self.theme.bold_font
                    } else {
                        self.theme.normal_font
                    };
                    estimate_text_width(&span.text, size, font)
                })
                .sum::<f32>()
                .min(width);
            let x = ((PAGE_WIDTH - line_width) / 2.0).max(self.theme.margin_x);
            self.render_styled_line(&line, size, x, self.y);
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
        let width = estimate_text_width(&label, size, self.theme.normal_font)
            .min(PAGE_WIDTH - (self.theme.margin_x * 2.0));
        let x = ((PAGE_WIDTH - width) / 2.0).max(self.theme.margin_x);
        let y = self.y;
        self.text_line(&label, size, false, x, y);
        self.y -= line_height;
        let mut link_x = x;
        for target in links {
            let link_width = estimate_text_width(target, size, self.theme.normal_font);
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
            link_x += link_width + estimate_text_width(" | ", size, self.theme.normal_font);
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
        let lines = wrap_styled_to_width(
            value,
            false,
            available_width,
            size,
            self.theme.normal_font,
            self.theme.bold_font,
        );
        before_mm.unwrap_or_default() + lines.len() as f32 * line_height_mm
    }

    #[cfg(test)]
    fn max_chars_for_width(&self, width: f32, size: f32, minimum: usize) -> usize {
        let width_factor = if matches!(self.theme.normal_font, BuiltinFont::Courier) {
            0.22
        } else {
            0.143
        };
        ((width / (size * width_factor)).floor() as usize).max(minimum)
    }

    fn keep_together_if_possible(&mut self, needed: f32) {
        if self.block_needs_fresh_page(needed) {
            self.new_page();
        }
    }

    fn block_needs_fresh_page(&self, needed: f32) -> bool {
        let page_capacity = self.theme.top_y - self.theme.bottom_y;
        needed <= page_capacity && self.y - needed < self.theme.bottom_y
    }

    fn bullet(&mut self, value: &str) {
        if value.trim().is_empty() {
            return;
        }
        let size = self.theme.body_size - 0.2;
        let line_height = self.theme.body_line_height - 0.2;
        let text_x = self.content_x + BULLET_TEXT_INDENT_MM;
        let available_width = self.content_right - text_x;
        let lines = wrap_styled_to_width(
            value,
            false,
            available_width,
            size,
            self.theme.normal_font,
            self.theme.bold_font,
        );
        let needed = lines.len() as f32 * line_height + 1.0;
        self.keep_together_if_possible(needed);
        for (index, line) in lines.into_iter().enumerate() {
            self.ensure_space(line_height + 1.0);
            if index == 0 {
                self.text_line(
                    "•",
                    size,
                    false,
                    self.content_x + BULLET_MARKER_INDENT_MM,
                    self.y,
                );
            }
            self.render_styled_line(&line, size, text_x, self.y);
            self.y -= line_height;
        }
    }

    fn estimated_bullet_height(&self, value: &str) -> f32 {
        if value.trim().is_empty() {
            return 0.0;
        }
        let size = self.theme.body_size - 0.2;
        let line_height = self.theme.body_line_height - 0.2;
        let text_x = self.content_x + BULLET_TEXT_INDENT_MM;
        let available_width = self.content_right - text_x;
        let lines = wrap_styled_to_width(
            value,
            false,
            available_width,
            size,
            self.theme.normal_font,
            self.theme.bold_font,
        );
        lines.len() as f32 * line_height + 1.0
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
        self.text_color = self.theme.accent;
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
                self.theme.band_rule.0,
                self.theme.band_rule.1,
                self.theme.band_rule.2,
            ),
        });
        self.current.push(Op::SetOutlineThickness {
            pt: Pt(SECTION_RULE_THICKNESS_PT),
        });
        let rule_y = self.y + self.theme.section_line_height * SECTION_RULE_LINE_HEIGHT_RATIO;
        self.current.push(Op::DrawLine {
            line: Line {
                points: vec![
                    LinePoint {
                        p: Point::new(Mm(self.content_x), Mm(rule_y)),
                        bezier: false,
                    },
                    LinePoint {
                        p: Point::new(Mm(self.content_right), Mm(rule_y)),
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
        let lines = wrap_styled_to_width(
            value,
            bold,
            available_width,
            size,
            self.theme.normal_font,
            self.theme.bold_font,
        );
        for line in lines {
            self.ensure_space(line_height_mm + 1.0);
            self.render_styled_line(&line, size, x, self.y);
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
        let lines = wrap_styled_to_width(
            value,
            bold,
            width,
            size,
            self.theme.normal_font,
            self.theme.bold_font,
        );
        for line in lines {
            self.render_styled_line(&line, size, x, y);
            y -= line_height_mm;
        }
        y
    }

    fn render_styled_line(&mut self, spans: &[TextSpan], size: f32, x: f32, y: f32) {
        let mut current_x = x;
        for span in spans {
            if span.text.is_empty() {
                continue;
            }
            let font = if span.bold {
                self.theme.bold_font
            } else {
                self.theme.normal_font
            };
            self.text_span(&span.text, size, font, current_x, y);
            current_x += estimate_text_width(&span.text, size, font);
        }
    }

    fn text_span(&mut self, value: &str, size: f32, font: BuiltinFont, x: f32, y: f32) {
        self.current.extend([
            Op::StartTextSection,
            Op::SetTextCursor {
                pos: Point::new(Mm(x), Mm(y)),
            },
            Op::SetFont {
                font: PdfFontHandle::Builtin(font),
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

    fn text_line(&mut self, value: &str, size: f32, bold: bool, x: f32, y: f32) {
        let font = if bold {
            self.theme.bold_font
        } else {
            self.theme.normal_font
        };
        self.text_span(value, size, font, x, y);
    }

    fn link_block(&mut self, label: &str, target: &str, x: f32, width: f32, y: f32) -> f32 {
        if label.trim().is_empty() || !is_safe_link(target) {
            return y;
        }
        let mut end_y = y;
        for line in wrap_to_width(label, width, self.theme.meta_size, self.theme.normal_font) {
            self.text_line(&line, self.theme.meta_size, false, x, end_y);
            end_y -= self.theme.meta_line_height;
        }
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
        if self.split_first_page {
            self.current.append(&mut self.split_sidebar_ops);
        }
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
            Op::SetOutlineColor {
                col: rgb(
                    self.theme.band_rule.0,
                    self.theme.band_rule.1,
                    self.theme.band_rule.2,
                ),
            },
            Op::SetOutlineThickness {
                pt: Pt(SECTION_RULE_THICKNESS_PT),
            },
            Op::DrawLine {
                line: Line {
                    points: vec![
                        LinePoint {
                            p: Point::new(Mm(self.content_x), Mm(PAGE_HEIGHT - 10.0)),
                            bezier: false,
                        },
                        LinePoint {
                            p: Point::new(Mm(self.content_right), Mm(PAGE_HEIGHT - 10.0)),
                            bezier: false,
                        },
                    ],
                    is_closed: false,
                },
            },
        ]);
    }

    fn finish(mut self, title: &str) -> Vec<u8> {
        if self.split_first_page {
            self.current.append(&mut self.split_sidebar_ops);
        }
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
mod tests;
