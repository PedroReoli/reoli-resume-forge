use super::*;
use crate::core::archetypes::load_archetype;
use crate::core::model::Project;

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
        courier.max_chars_for_width(180.0, 9.0, 12) < helvetica.max_chars_for_width(180.0, 9.0, 12)
    );
}

#[test]
fn classic_section_rule_uses_the_vault_visual_metrics() {
    let theme = PdfTheme::for_template(ResumeTemplate::Classic);
    let offset = theme.section_line_height * SECTION_RULE_LINE_HEIGHT_RATIO;

    assert!((theme.margin_x - 15.75).abs() < f32::EPSILON);
    assert!((offset - 2.88).abs() < 0.01);
    assert_eq!(
        theme.band_rule,
        (217.0 / 255.0, 224.0 / 255.0, 230.0 / 255.0)
    );
}

#[test]
fn dense_templates_keep_a_readable_body_size() {
    for template in [ResumeTemplate::Compact, ResumeTemplate::TechMinimalist] {
        let theme = PdfTheme::for_template(template);
        assert!(
            theme.body_size >= 9.0,
            "{template:?} usa fonte pequena demais"
        );
        assert!(
            theme.meta_size >= 8.0,
            "{template:?} usa metadados pequenos demais"
        );
    }
}

#[test]
fn wrapped_bullets_reserve_the_same_height_the_renderer_uses() {
    let theme = PdfTheme::for_template(ResumeTemplate::Classic);
    let writer = PdfWriter::new(theme);
    let value = "Resultado longo com contexto, métrica e implementação suficiente para ocupar mais de uma linha no currículo";
    let height = writer.estimated_bullet_height(value);
    let text_x = writer.content_x + BULLET_TEXT_INDENT_MM;
    let max_chars =
        writer.max_chars_for_width(writer.content_right - text_x, theme.body_size - 0.2, 24);
    let expected_lines = wrap(value, max_chars).len() as f32;

    assert_eq!(
        height,
        expected_lines * (theme.body_line_height - 0.2) + 1.0
    );
}

#[test]
fn continuation_pages_do_not_start_with_orphan_experience_content() {
    let profile = load_archetype("01_frontend").unwrap();
    for template in [
        ResumeTemplate::Classic,
        ResumeTemplate::Clean,
        ResumeTemplate::Compact,
        ResumeTemplate::Executive,
        ResumeTemplate::TechMinimalist,
        ResumeTemplate::ModernSplit,
        ResumeTemplate::ExecutiveBold,
        ResumeTemplate::Academic,
    ] {
        let theme = PdfTheme::for_template(template);
        let mut writer = PdfWriter::new(theme);
        writer.begin_header();
        writer.header(&profile, template);
        writer.end_header();
        let split = matches!(template, ResumeTemplate::ModernSplit);
        if split {
            writer.enable_split_layout(&profile);
        }
        for section_id in &profile.layout.section_order {
            if profile.layout.hidden_sections.contains(section_id)
                || (split && is_split_sidebar_section(section_id))
            {
                continue;
            }
            render_section(&mut writer, &profile, section_id, theme);
        }

        assert_eq!(
            writer.pages.len() + 1,
            2,
            "{template:?} deve permanecer em duas páginas"
        );
        for ops in writer.pages.iter().skip(1).chain([&writer.current]) {
            let first = first_page_text(ops).expect("página de continuação deve conter texto");
            assert!(
                !first.starts_with('•') && !first.starts_with("Tecnologias:"),
                "{template:?} iniciou uma página com conteúdo órfão: {first}"
            );
        }
    }
}

#[test]
fn modern_split_keeps_primary_content_before_sidebar_content_for_text_extraction() {
    let profile = load_archetype("01_frontend").unwrap();
    let theme = PdfTheme::for_template(ResumeTemplate::ModernSplit);
    let mut writer = PdfWriter::new(theme);
    writer.begin_header();
    writer.header(&profile, ResumeTemplate::ModernSplit);
    writer.end_header();
    writer.enable_split_layout(&profile);
    for section_id in &profile.layout.section_order {
        if profile.layout.hidden_sections.contains(section_id)
            || is_split_sidebar_section(section_id)
        {
            continue;
        }
        render_section(&mut writer, &profile, section_id, theme);
    }

    let first_page = writer
        .pages
        .first()
        .expect("o perfil deve ocupar duas páginas");
    let texts = page_texts(first_page);
    let summary = texts
        .iter()
        .position(|text| *text == "RESUMO PROFISSIONAL")
        .expect("resumo ausente");
    let skills = texts
        .iter()
        .position(|text| *text == "COMPETÊNCIAS TÉCNICAS")
        .expect("competências ausentes");

    assert!(summary < skills);
    assert!(
        !writer
            .current
            .iter()
            .any(|op| matches!(op, Op::DrawPolygon { .. }))
    );
}

#[test]
fn project_continuation_repeats_its_name_on_the_new_page() {
    let theme = PdfTheme::for_template(ResumeTemplate::Classic);
    let mut writer = PdfWriter::new(theme);
    writer.text_line("conteúdo anterior", theme.body_size, false, 16.0, 20.0);
    writer.y = theme.bottom_y + 4.0;
    let project = Project {
        name: "Projeto Atlas".into(),
        ..Project::default()
    };

    sections::ensure_project_continuation(&mut writer, &project, 10.0, theme);

    assert_eq!(writer.pages.len(), 1);
    assert_eq!(first_page_text(&writer.current), Some("Projeto Atlas"));
}

fn first_page_text(ops: &[Op]) -> Option<&str> {
    ops.iter().find_map(|op| match op {
        Op::ShowText { items } => items.iter().find_map(|item| match item {
            TextItem::Text(text) => Some(text.as_str()),
            _ => None,
        }),
        _ => None,
    })
}

fn page_texts(ops: &[Op]) -> Vec<&str> {
    ops.iter()
        .filter_map(|op| match op {
            Op::ShowText { items } => items.iter().find_map(|item| match item {
                TextItem::Text(text) => Some(text.as_str()),
                _ => None,
            }),
            _ => None,
        })
        .collect()
}
