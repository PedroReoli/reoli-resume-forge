use super::super::model::ResumeProfile;
use printpdf::BuiltinFont;

pub(super) fn string_values(value: &serde_json::Value) -> String {
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

pub(super) fn string_list(value: &serde_json::Value) -> Vec<String> {
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

pub(super) fn formatted_skills(profile: &ResumeProfile, value: &serde_json::Value) -> String {
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

pub(super) fn ordered_metrics<'a>(values: &'a [String], style: &str) -> Vec<&'a str> {
    let mut items = values.iter().map(String::as_str).collect::<Vec<_>>();
    if style == "metrics" {
        items.sort_by_key(|value| !value.chars().any(|character| character.is_ascii_digit()));
    }
    items
}

pub(super) fn is_split_sidebar_section(section_id: &str) -> bool {
    matches!(
        section_id,
        "skills" | "soft_skills" | "education" | "certifications" | "languages"
    )
}

pub(super) fn is_safe_link(value: &str) -> bool {
    value.starts_with("https://") || value.starts_with("http://")
}

pub(super) fn estimate_text_width(value: &str, size: f32, font: BuiltinFont) -> f32 {
    let em_width = value
        .chars()
        .map(|character| glyph_width_em(character, font))
        .sum::<f32>();
    (em_width * size * 0.352_778).max(1.0)
}

fn glyph_width_em(character: char, font: BuiltinFont) -> f32 {
    if matches!(
        font,
        BuiltinFont::Courier
            | BuiltinFont::CourierBold
            | BuiltinFont::CourierOblique
            | BuiltinFont::CourierBoldOblique
    ) {
        return 0.6;
    }

    match character {
        ' ' => 0.278,
        'i' | 'l' | 'I' | '.' | ',' | ':' | ';' | '!' | '|' | '\'' => 0.278,
        'f' | 'j' | 'r' | 't' | '(' | ')' | '[' | ']' => 0.35,
        '-' | '/' | '\\' => 0.333,
        'm' | 'w' | 'M' | 'W' | '@' | '%' => 0.85,
        character if character.is_ascii_digit() => 0.556,
        character if character.is_uppercase() => 0.667,
        character if character.is_lowercase() => 0.5,
        _ => 0.556,
    }
}

#[cfg(test)]
pub(super) fn wrap(value: &str, max_chars: usize) -> Vec<String> {
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

#[derive(Debug, Clone, PartialEq, Eq)]
pub(super) struct TextSpan {
    pub text: String,
    pub bold: bool,
}

pub(super) fn parse_markdown_spans(input: &str, default_bold: bool) -> Vec<TextSpan> {
    let mut spans = Vec::new();
    let mut rest = input;
    let mut current_bold = default_bold;

    while let Some(pos) = rest.find("**") {
        let before = &rest[..pos];
        if !before.is_empty() {
            spans.push(TextSpan {
                text: before.to_string(),
                bold: current_bold,
            });
        }
        current_bold = !current_bold;
        rest = &rest[pos + 2..];
    }
    if !rest.is_empty() {
        spans.push(TextSpan {
            text: rest.to_string(),
            bold: current_bold,
        });
    }
    spans
}

#[derive(Debug, Clone)]
pub(super) struct StyledWord {
    pub parts: Vec<TextSpan>,
}

impl StyledWord {
    pub fn estimate_width(
        &self,
        size: f32,
        normal_font: BuiltinFont,
        bold_font: BuiltinFont,
    ) -> f32 {
        self.parts
            .iter()
            .map(|part| {
                let font = if part.bold { bold_font } else { normal_font };
                estimate_text_width(&part.text, size, font)
            })
            .sum()
    }
}

pub(super) fn tokenize_styled_words(spans: &[TextSpan]) -> Vec<StyledWord> {
    let mut words: Vec<StyledWord> = Vec::new();
    let mut current_parts: Vec<TextSpan> = Vec::new();

    for span in spans {
        let mut part_start = 0;
        let chars: Vec<(usize, char)> = span.text.char_indices().collect();
        let mut i = 0;
        while i < chars.len() {
            let (byte_idx, ch) = chars[i];
            if ch.is_whitespace() {
                if byte_idx > part_start {
                    let chunk = &span.text[part_start..byte_idx];
                    current_parts.push(TextSpan {
                        text: chunk.to_string(),
                        bold: span.bold,
                    });
                }
                if !current_parts.is_empty() {
                    words.push(StyledWord {
                        parts: std::mem::take(&mut current_parts),
                    });
                }
                while i < chars.len() && chars[i].1.is_whitespace() {
                    i += 1;
                }
                part_start = if i < chars.len() {
                    chars[i].0
                } else {
                    span.text.len()
                };
            } else {
                i += 1;
            }
        }
        if part_start < span.text.len() {
            let chunk = &span.text[part_start..];
            current_parts.push(TextSpan {
                text: chunk.to_string(),
                bold: span.bold,
            });
        }
    }
    if !current_parts.is_empty() {
        words.push(StyledWord {
            parts: current_parts,
        });
    }
    words
}

fn append_to_line(line: &mut Vec<TextSpan>, text: &str, bold: bool) {
    if text.is_empty() {
        return;
    }
    if let Some(last) = line.last_mut() {
        if last.bold == bold {
            last.text.push_str(text);
            return;
        }
    }
    line.push(TextSpan {
        text: text.to_string(),
        bold,
    });
}

pub(super) fn wrap_styled_to_width(
    value: &str,
    default_bold: bool,
    max_width: f32,
    size: f32,
    normal_font: BuiltinFont,
    bold_font: BuiltinFont,
) -> Vec<Vec<TextSpan>> {
    let mut lines = Vec::new();
    for paragraph in value.lines() {
        let spans = parse_markdown_spans(paragraph, default_bold);
        let words = tokenize_styled_words(&spans);
        if words.is_empty() {
            continue;
        }

        let mut current_line: Vec<TextSpan> = Vec::new();
        let mut current_width: f32 = 0.0;

        for word in words {
            let word_width = word.estimate_width(size, normal_font, bold_font);
            let first_bold = word.parts.first().map(|p| p.bold).unwrap_or(default_bold);
            let last_line_bold = current_line
                .last()
                .map(|p| p.bold)
                .unwrap_or(default_bold);
            let space_bold = last_line_bold && first_bold;
            let space_font = if space_bold { bold_font } else { normal_font };
            let space_width = estimate_text_width(" ", size, space_font);

            if !current_line.is_empty() {
                if current_width + space_width + word_width <= max_width {
                    append_to_line(&mut current_line, " ", space_bold);
                    for part in word.parts {
                        append_to_line(&mut current_line, &part.text, part.bold);
                    }
                    current_width += space_width + word_width;
                    continue;
                } else {
                    lines.push(std::mem::take(&mut current_line));
                    current_width = 0.0;
                }
            }

            if word_width <= max_width {
                for part in word.parts {
                    append_to_line(&mut current_line, &part.text, part.bold);
                }
                current_width = word_width;
            } else {
                for part in word.parts {
                    let font = if part.bold { bold_font } else { normal_font };
                    for ch in part.text.chars() {
                        let ch_str = ch.to_string();
                        let ch_width = estimate_text_width(&ch_str, size, font);
                        if !current_line.is_empty() && current_width + ch_width > max_width {
                            lines.push(std::mem::take(&mut current_line));
                            current_width = 0.0;
                        }
                        append_to_line(&mut current_line, &ch_str, part.bold);
                        current_width += ch_width;
                    }
                }
            }
        }

        if !current_line.is_empty() {
            lines.push(current_line);
        }
    }
    lines
}

pub(super) fn wrap_to_width(
    value: &str,
    max_width: f32,
    size: f32,
    font: BuiltinFont,
) -> Vec<String> {
    let mut lines = Vec::new();
    for paragraph in value.lines() {
        let mut current = String::new();
        for word in paragraph.split_whitespace() {
            let candidate = if current.is_empty() {
                word.to_string()
            } else {
                format!("{current} {word}")
            };
            if estimate_text_width(&candidate, size, font) <= max_width {
                current = candidate;
                continue;
            }
            if !current.is_empty() {
                lines.push(std::mem::take(&mut current));
            }
            for character in word.chars() {
                let candidate = format!("{current}{character}");
                if !current.is_empty() && estimate_text_width(&candidate, size, font) > max_width {
                    lines.push(std::mem::take(&mut current));
                }
                current.push(character);
            }
        }
        if !current.is_empty() {
            lines.push(current);
        }
    }
    lines
}

pub(super) fn join_non_empty<const N: usize>(values: [&String; N]) -> String {
    values
        .into_iter()
        .filter(|value| !value.trim().is_empty())
        .map(String::as_str)
        .collect::<Vec<_>>()
        .join(" | ")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn width_wrapping_keeps_long_urls_inside_the_requested_width() {
        let width = 54.0;
        let lines = wrap_to_width(
            "https://www.linkedin.com/in/pessoa-exemplo-com-url-longa/",
            width,
            8.3,
            BuiltinFont::Helvetica,
        );

        assert!(lines.len() > 1);
        assert!(
            lines
                .iter()
                .all(|line| estimate_text_width(line, 8.3, BuiltinFont::Helvetica) <= width)
        );
        assert_eq!(
            lines.join(""),
            "https://www.linkedin.com/in/pessoa-exemplo-com-url-longa/"
        );
    }

    #[test]
    fn parses_inline_markdown_bold_spans() {
        let spans = parse_markdown_spans("**Tecnologias:** React, **TypeScript** e Node.js", false);
        assert_eq!(
            spans,
            vec![
                TextSpan {
                    text: "Tecnologias:".into(),
                    bold: true
                },
                TextSpan {
                    text: " React, ".into(),
                    bold: false
                },
                TextSpan {
                    text: "TypeScript".into(),
                    bold: true
                },
                TextSpan {
                    text: " e Node.js".into(),
                    bold: false
                },
            ]
        );
    }

    #[test]
    fn wraps_styled_spans_within_target_width() {
        let width = 60.0;
        let lines = wrap_styled_to_width(
            "**Tecnologias:** React, TypeScript, Tailwind CSS, PostgreSQL e Docker para microsserviços.",
            false,
            width,
            9.0,
            BuiltinFont::Helvetica,
            BuiltinFont::HelveticaBold,
        );
        assert!(lines.len() > 1);
        for line in &lines {
            let line_width = line
                .iter()
                .map(|span| {
                    let font = if span.bold {
                        BuiltinFont::HelveticaBold
                    } else {
                        BuiltinFont::Helvetica
                    };
                    estimate_text_width(&span.text, 9.0, font)
                })
                .sum::<f32>();
            assert!(line_width <= width);
        }
        assert_eq!(lines[0][0].text, "Tecnologias:");
        assert!(lines[0][0].bold);
    }
}
