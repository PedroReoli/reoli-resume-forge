use crate::core::ResumeProfile;
use crate::core::export::{ExportFormat, ResumeTemplate};
use std::collections::HashMap;

pub type Options = HashMap<String, String>;

const BOOLEAN_OPTIONS: [&str; 7] = [
    "confirmed-us-overlap",
    "continue-on-error",
    "dry-run",
    "json",
    "doc",
    "docs",
    "help",
];

pub fn parse_options(args: &[String]) -> Result<Options, String> {
    let mut options = HashMap::new();
    let mut index = 0;
    while index < args.len() {
        let argument = &args[index];
        let raw = argument
            .strip_prefix("--")
            .ok_or_else(|| format!("argumento inesperado: {argument}"))?;
        if raw.is_empty() {
            return Err("opcao vazia nao e permitida".into());
        }

        if let Some((key, value)) = raw.split_once('=') {
            insert_option(&mut options, key, value)?;
            index += 1;
            continue;
        }

        if BOOLEAN_OPTIONS.contains(&raw) {
            let next = args.get(index + 1).filter(|value| !value.starts_with("--"));
            let (value, consumed) = match next {
                Some(value) if is_boolean_literal(value) => (value.clone(), 1),
                _ => ("true".into(), 0),
            };
            insert_option(&mut options, raw, &value)?;
            index += 1 + consumed;
            continue;
        }

        let value = args
            .get(index + 1)
            .filter(|value| !value.starts_with("--"))
            .ok_or_else(|| format!("valor ausente para --{raw}"))?;
        insert_option(&mut options, raw, value)?;
        index += 2;
    }
    Ok(options)
}

fn insert_option(options: &mut Options, key: &str, value: &str) -> Result<(), String> {
    if key.trim().is_empty() {
        return Err("opcao vazia nao e permitida".into());
    }
    if options.insert(key.into(), value.into()).is_some() {
        return Err(format!("opcao repetida: --{key}"));
    }
    Ok(())
}

pub fn required<'a>(options: &'a Options, key: &str) -> Result<&'a str, String> {
    options
        .get(key)
        .map(String::as_str)
        .filter(|value| !value.trim().is_empty())
        .ok_or_else(|| format!("opcao obrigatoria ausente: --{key}"))
}

pub fn parse_bool(value: Option<&String>) -> Result<bool, String> {
    match value.map(|item| item.as_str()).unwrap_or("false") {
        "true" | "1" | "yes" | "sim" => Ok(true),
        "false" | "0" | "no" | "nao" => Ok(false),
        other => Err(format!("valor booleano invalido: {other}")),
    }
}

fn is_boolean_literal(value: &str) -> bool {
    matches!(
        value,
        "true" | "1" | "yes" | "sim" | "false" | "0" | "no" | "nao"
    )
}

pub fn formats(options: &Options) -> Result<Vec<ExportFormat>, String> {
    parse_formats(options.get("format").map(String::as_str).unwrap_or("pdf"))
}

pub fn parse_formats(raw: &str) -> Result<Vec<ExportFormat>, String> {
    let mut result = Vec::new();
    for value in raw
        .split(',')
        .map(str::trim)
        .filter(|value| !value.is_empty())
    {
        let format = ExportFormat::parse(value)?;
        if !result.contains(&format) {
            result.push(format);
        }
    }
    if result.is_empty() {
        return Err("informe ao menos um formato".into());
    }
    Ok(result)
}

pub fn template_option(options: &Options) -> Result<Option<ResumeTemplate>, String> {
    options
        .get("template")
        .map(|value| ResumeTemplate::parse(value))
        .transpose()
}

pub fn resolve_template(
    options: &Options,
    profile: &ResumeProfile,
) -> Result<ResumeTemplate, String> {
    if let Some(template) = template_option(options)? {
        return Ok(template);
    }
    Ok(ResumeTemplate::from_profile(profile)?.unwrap_or_default())
}

pub fn safe_label(value: &str) -> String {
    value
        .trim()
        .chars()
        .map(|character| {
            if character.is_ascii_alphanumeric() {
                character.to_ascii_lowercase()
            } else {
                '_'
            }
        })
        .collect::<String>()
        .split('_')
        .filter(|part| !part.is_empty())
        .take(12)
        .collect::<Vec<_>>()
        .join("_")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_flags_and_equals_syntax() {
        let args = vec![
            "--dry-run".into(),
            "--format=pdf,docx".into(),
            "--json=false".into(),
        ];
        let options = parse_options(&args).unwrap();
        assert_eq!(options["dry-run"], "true");
        assert_eq!(options["format"], "pdf,docx");
        assert_eq!(options["json"], "false");
    }

    #[test]
    fn rejects_duplicate_options() {
        let args = vec!["--out=a".into(), "--out".into(), "b".into()];
        assert!(parse_options(&args).unwrap_err().contains("repetida"));
    }

    #[test]
    fn parses_formats_without_duplicates() {
        assert_eq!(
            parse_formats("pdf,docx,pdf").unwrap(),
            vec![ExportFormat::Pdf, ExportFormat::Docx]
        );
    }
}
