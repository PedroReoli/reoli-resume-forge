use crate::core::export::{self, ExportFormat, ResumeTemplate};
use crate::core::{ResumeProfile, load_archetype, tailor};
use serde::Deserialize;
use serde_json::{Value, json};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};

const MAX_INPUT_BYTES: u64 = 1_048_576;

#[derive(Debug, Deserialize)]
struct BatchJob {
    #[serde(default)]
    company: String,
    #[serde(default)]
    job_title: String,
    #[serde(
        default,
        alias = "jobDescription",
        alias = "jd_text",
        alias = "description"
    )]
    job_description: String,
    #[serde(default, alias = "baseModel")]
    base_model: String,
    #[serde(default)]
    profile: Option<ResumeProfile>,
    #[serde(default, alias = "confirmedUsOverlap")]
    confirmed_us_overlap: bool,
    #[serde(default)]
    template: String,
}

pub fn is_ui_request(args: &[String]) -> bool {
    args.is_empty() || args.first().is_some_and(|value| value == "ui")
}

pub fn run(args: &[String]) -> Result<(), String> {
    let command = args.first().map(String::as_str).unwrap_or("help");
    let options = parse_options(&args[1..])?;
    match command {
        "generate" => generate(&options),
        "tailor" => tailor_one(&options),
        "batch" => batch(&options),
        "help" | "--help" | "-h" => {
            print_help();
            Ok(())
        }
        "version" | "--version" | "-V" => {
            println!("reoli-cv {}", env!("CARGO_PKG_VERSION"));
            Ok(())
        }
        other => Err(format!(
            "comando desconhecido: {other}. Execute `reoli-cv help` para ver o uso."
        )),
    }
}

fn generate(options: &HashMap<String, String>) -> Result<(), String> {
    let model = required(options, "model")?;
    let profile = load_archetype(model)?;
    let formats = formats(options)?;
    let template = resolve_template(options, &profile)?;
    let output = output_directory(options)?;
    let files = write_all(&profile, &formats, &output, None, template)?;
    print_success("generate", files);
    Ok(())
}

fn tailor_one(options: &HashMap<String, String>) -> Result<(), String> {
    let job_path = required(options, "job")?;
    let job_description = read_job(Path::new(job_path))?;
    let (profile, model_id) = load_source_profile(options)?;
    let result = tailor(
        &profile,
        &job_description,
        model_id.as_deref(),
        parse_bool(options.get("confirmed-us-overlap"))?,
    )?;
    let formats = formats(options)?;
    let template = resolve_template(options, &result.profile)?;
    let output = output_directory(options)?;
    let files = write_all(&result.profile, &formats, &output, None, template)?;
    println!(
        "{}",
        serde_json::to_string_pretty(&json!({
            "ok": true,
            "command": "tailor",
            "score": result.report.score,
            "matched": result.report.matched,
            "missing": result.report.missing,
            "detectedDomains": result.report.job.detected_domains,
            "files": files,
        }))
        .map_err(|error| error.to_string())?
    );
    Ok(())
}

fn batch(options: &HashMap<String, String>) -> Result<(), String> {
    let jobs_path = required(options, "jobs")?;
    let raw = read_limited(Path::new(jobs_path))?;
    let jobs: Vec<BatchJob> =
        serde_json::from_str(&raw).map_err(|error| format!("lote JSON inválido: {error}"))?;
    if jobs.is_empty() || jobs.len() > 500 {
        return Err("o lote deve conter entre 1 e 500 vagas".into());
    }
    let default_model = options
        .get("model")
        .cloned()
        .unwrap_or_else(|| "01_frontend".into());
    let formats = formats(options)?;
    let default_template = template_option(options)?;
    let output = output_directory(options)?;
    let mut results = Vec::with_capacity(jobs.len());

    for (index, job) in jobs.into_iter().enumerate() {
        if job.job_description.trim().is_empty() {
            return Err(format!("vaga {} não possui descrição", index + 1));
        }
        let model = if job.base_model.trim().is_empty() {
            default_model.as_str()
        } else {
            job.base_model.as_str()
        };
        let profile = match job.profile {
            Some(profile) => profile,
            None => load_archetype(model)?,
        };
        let tailored = tailor(
            &profile,
            &job.job_description,
            Some(model),
            job.confirmed_us_overlap,
        )?;
        let suffix = safe_suffix(&format!("{} {}", job.company, job.job_title));
        let job_template = if job.template.trim().is_empty() {
            match default_template {
                Some(template) => template,
                None => ResumeTemplate::from_profile(&tailored.profile)?.unwrap_or_default(),
            }
        } else {
            ResumeTemplate::parse(&job.template)?
        };
        let files = write_all(
            &tailored.profile,
            &formats,
            &output,
            Some(&suffix),
            job_template,
        )?;
        results.push(json!({
            "index": index + 1,
            "company": job.company,
            "jobTitle": job.job_title,
            "score": tailored.report.score,
            "detectedDomains": tailored.report.job.detected_domains,
            "files": files,
        }));
    }
    println!(
        "{}",
        serde_json::to_string_pretty(&json!({
            "ok": true,
            "command": "batch",
            "count": results.len(),
            "results": results,
        }))
        .map_err(|error| error.to_string())?
    );
    Ok(())
}

fn load_source_profile(
    options: &HashMap<String, String>,
) -> Result<(ResumeProfile, Option<String>), String> {
    if let Some(path) = options.get("profile") {
        let raw = read_limited(Path::new(path))?;
        let profile: ResumeProfile =
            serde_json::from_str(&raw).map_err(|error| format!("perfil JSON inválido: {error}"))?;
        profile.validate()?;
        return Ok((profile, options.get("model").cloned()));
    }
    let model = options
        .get("model")
        .cloned()
        .unwrap_or_else(|| "01_frontend".into());
    Ok((load_archetype(&model)?, Some(model)))
}

fn read_job(path: &Path) -> Result<String, String> {
    let raw = read_limited(path)?;
    if path.extension().and_then(|value| value.to_str()) == Some("json") {
        let value: Value =
            serde_json::from_str(&raw).map_err(|error| format!("vaga JSON inválida: {error}"))?;
        for key in [
            "job_description",
            "jobDescription",
            "jd_text",
            "description",
        ] {
            if let Some(text) = value.get(key).and_then(Value::as_str) {
                return Ok(text.to_string());
            }
        }
        return Err("vaga JSON não contém job_description, jd_text ou description".into());
    }
    Ok(raw)
}

fn read_limited(path: &Path) -> Result<String, String> {
    let metadata = fs::metadata(path)
        .map_err(|error| format!("não foi possível acessar {}: {error}", path.display()))?;
    if !metadata.is_file() {
        return Err(format!("entrada não é um arquivo: {}", path.display()));
    }
    if metadata.len() > MAX_INPUT_BYTES {
        return Err(format!("entrada excede 1 MiB: {}", path.display()));
    }
    fs::read_to_string(path)
        .map_err(|error| format!("não foi possível ler {}: {error}", path.display()))
}

fn formats(options: &HashMap<String, String>) -> Result<Vec<ExportFormat>, String> {
    let raw = options.get("format").map(String::as_str).unwrap_or("pdf");
    let mut result = Vec::new();
    for value in raw.split(',') {
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

fn template_option(options: &HashMap<String, String>) -> Result<Option<ResumeTemplate>, String> {
    options
        .get("template")
        .map(|value| ResumeTemplate::parse(value))
        .transpose()
}

fn resolve_template(
    options: &HashMap<String, String>,
    profile: &ResumeProfile,
) -> Result<ResumeTemplate, String> {
    if let Some(template) = template_option(options)? {
        return Ok(template);
    }
    Ok(ResumeTemplate::from_profile(profile)?.unwrap_or_default())
}

fn output_directory(options: &HashMap<String, String>) -> Result<PathBuf, String> {
    let path = PathBuf::from(required(options, "out")?);
    fs::create_dir_all(&path)
        .map_err(|error| format!("não foi possível criar {}: {error}", path.display()))?;
    path.canonicalize()
        .map_err(|error| format!("não foi possível resolver {}: {error}", path.display()))
}

fn write_all(
    profile: &ResumeProfile,
    formats: &[ExportFormat],
    output: &Path,
    suffix: Option<&str>,
    template: ResumeTemplate,
) -> Result<Vec<String>, String> {
    let base = export::safe_basename(profile);
    let suffix = suffix.filter(|value| !value.is_empty());
    let mut files = Vec::with_capacity(formats.len());
    for format in formats {
        let filename = match suffix {
            Some(suffix) => format!("{base}_{suffix}.{}", format.extension()),
            None => format!("{base}.{}", format.extension()),
        };
        let path = output.join(filename);
        export::write_with_template(profile, *format, &path, template)?;
        files.push(path.display().to_string());
    }
    Ok(files)
}

fn parse_options(args: &[String]) -> Result<HashMap<String, String>, String> {
    let mut options = HashMap::new();
    let mut index = 0;
    while index < args.len() {
        let key = args[index]
            .strip_prefix("--")
            .ok_or_else(|| format!("argumento inesperado: {}", args[index]))?;
        if key == "confirmed-us-overlap" {
            let value = args
                .get(index + 1)
                .filter(|value| !value.starts_with("--"))
                .cloned()
                .unwrap_or_else(|| "true".into());
            let consumed = usize::from(args.get(index + 1).is_some_and(|v| !v.starts_with("--")));
            options.insert(key.into(), value);
            index += 1 + consumed;
            continue;
        }
        let value = args
            .get(index + 1)
            .filter(|value| !value.starts_with("--"))
            .ok_or_else(|| format!("valor ausente para --{key}"))?;
        if options.insert(key.into(), value.clone()).is_some() {
            return Err(format!("opção repetida: --{key}"));
        }
        index += 2;
    }
    Ok(options)
}

fn required<'a>(options: &'a HashMap<String, String>, key: &str) -> Result<&'a str, String> {
    options
        .get(key)
        .map(String::as_str)
        .filter(|value| !value.trim().is_empty())
        .ok_or_else(|| format!("opção obrigatória ausente: --{key}"))
}

fn parse_bool(value: Option<&String>) -> Result<bool, String> {
    match value.map(|item| item.as_str()).unwrap_or("false") {
        "true" | "1" | "yes" => Ok(true),
        "false" | "0" | "no" => Ok(false),
        other => Err(format!("valor booleano inválido: {other}")),
    }
}

fn safe_suffix(value: &str) -> String {
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
        .take(8)
        .collect::<Vec<_>>()
        .join("_")
}

fn print_success(command: &str, files: Vec<String>) {
    println!(
        "{}",
        serde_json::to_string_pretty(&json!({
            "ok": true,
            "command": command,
            "files": files,
        }))
        .expect("serialização de caminhos deve ser válida")
    );
}

fn print_help() {
    println!(
        "Reoli Resume Forge v{}\n\n\
Uso:\n  reoli-cv.exe ui\n  reoli-cv.exe generate --model ID --template classic --format pdf,docx --out DIRETORIO\n  \
reoli-cv.exe tailor --job VAGA.json [--profile PERFIL.json | --model ID] [--template compact] --format pdf,docx --out DIRETORIO\n  \
reoli-cv.exe batch --jobs VAGAS.json [--model ID] [--template executive] --format pdf --out DIRETORIO\n\n\
Modelos: 01_frontend, 02_fullstack_node, 03_fullstack_dotnet, 04_tech_lead, 05_internacional_en\n\
Templates: classic, clean, compact, executive, tech-minimalist, modern-split, executive-bold, academic\n\
Formatos: pdf, docx, json, md",
        env!("CARGO_PKG_VERSION")
    );
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn recognizes_ui_mode_without_arguments() {
        assert!(is_ui_request(&[]));
        assert!(is_ui_request(&["ui".into()]));
        assert!(!is_ui_request(&["generate".into()]));
    }

    #[test]
    fn parses_repeated_formats_without_duplicates() {
        let options = HashMap::from([("format".into(), "pdf,docx,pdf".into())]);
        assert_eq!(
            formats(&options).unwrap(),
            vec![ExportFormat::Pdf, ExportFormat::Docx]
        );
    }

    #[test]
    fn sanitizes_batch_filename_suffix() {
        assert_eq!(safe_suffix("ACME / Senior React"), "acme_senior_react");
    }

    #[test]
    fn parses_every_public_template() {
        for name in [
            "classic",
            "clean",
            "compact",
            "executive",
            "tech-minimalist",
            "modern-split",
            "executive-bold",
            "academic",
        ] {
            let options = HashMap::from([("template".into(), name.into())]);
            assert!(template_option(&options).is_ok());
        }
    }

    #[test]
    fn resolves_template_from_profile_with_classic_fallback() {
        let options = HashMap::new();
        let mut profile = load_archetype("01_frontend").unwrap();

        assert_eq!(
            resolve_template(&options, &profile).unwrap(),
            ResumeTemplate::Classic
        );

        profile
            .config
            .extra
            .insert("template".into(), json!("modern-split"));
        assert_eq!(
            resolve_template(&options, &profile).unwrap(),
            ResumeTemplate::ModernSplit
        );
    }

    #[test]
    fn explicit_template_overrides_the_profile_variant() {
        let options = HashMap::from([("template".into(), "compact".into())]);
        let mut profile = load_archetype("01_frontend").unwrap();
        profile
            .config
            .extra
            .insert("template".into(), json!("modern-split"));

        assert_eq!(
            resolve_template(&options, &profile).unwrap(),
            ResumeTemplate::Compact
        );
    }
}
