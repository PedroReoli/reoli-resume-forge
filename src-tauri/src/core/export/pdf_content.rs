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

pub(super) fn join_non_empty<const N: usize>(values: [&String; N]) -> String {
    values
        .into_iter()
        .filter(|value| !value.trim().is_empty())
        .map(String::as_str)
        .collect::<Vec<_>>()
        .join(" | ")
}
