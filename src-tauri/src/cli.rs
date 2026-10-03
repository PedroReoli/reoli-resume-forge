mod discovery;
mod files;
mod manifest;
mod options;

use crate::core::export::ResumeTemplate;
use crate::core::{DEFAULT_ARCHETYPE_ID, ResumeProfile, load_archetype, tailor};
use discovery::print_json;
use files::{ConflictPolicy, WriteRequest};
use manifest::{ManifestOverrides, ResolvedTask};
use options::Options;
use serde::Deserialize;
use serde_json::json;
use std::path::{Path, PathBuf};

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
    let options = options::parse_options(&args[1..])?;
    match command {
        "generate" => generate(&options),
        "tailor" => tailor_one(&options),
        "batch" => batch(&options),
        "run" | "manifest" => run_manifest(&options),
        "validate" => validate(&options),
        "templates" => discovery::print_templates(),
        "models" => discovery::print_models(),
        "schema" => discovery::print_schema(options::required(&options, "type")?),
        "capabilities" => discovery::print_capabilities(),
        "help" | "--help" | "-h" => {
            print_help();
            Ok(())
        }
        "version" | "--version" | "-V" => print_json(json!({
            "ok": true,
            "command": "version",
            "program": "reoliresume",
            "version": env!("CARGO_PKG_VERSION"),
        })),
        other => Err(format!(
            "comando desconhecido: {other}. Execute `reoliresume help` para ver o uso"
        )),
    }
}

fn generate(options: &Options) -> Result<(), String> {
    let (profile, _) = load_source_profile(options)?;
    let formats = options::formats(options)?;
    let template = options::resolve_template(options, &profile)?;
    let dry_run = options::parse_bool(options.get("dry-run"))?;
    let output = files::output_directory(options, dry_run)?;
    let files = files::write_all(WriteRequest {
        profile: &profile,
        formats: &formats,
        output: &output,
        basename: options.get("name").map(String::as_str),
        suffix: None,
        template,
        conflict: ConflictPolicy::from_options(options)?,
        dry_run,
    })?;
    print_json(json!({
        "ok": true,
        "command": "generate",
        "dryRun": dry_run,
        "files": files,
    }))
}

fn tailor_one(options: &Options) -> Result<(), String> {
    let job_path = options::required(options, "job")?;
    let job_description = files::read_job(Path::new(job_path))?;
    let (profile, model_id) = load_source_profile(options)?;
    let result = tailor(
        &profile,
        &job_description,
        model_id.as_deref(),
        options::parse_bool(options.get("confirmed-us-overlap"))?,
    )?;
    let formats = options::formats(options)?;
    let template = options::resolve_template(options, &result.profile)?;
    let dry_run = options::parse_bool(options.get("dry-run"))?;
    let output = files::output_directory(options, dry_run)?;
    let files = files::write_all(WriteRequest {
        profile: &result.profile,
        formats: &formats,
        output: &output,
        basename: options.get("name").map(String::as_str),
        suffix: None,
        template,
        conflict: ConflictPolicy::from_options(options)?,
        dry_run,
    })?;
    print_json(json!({
        "ok": true,
        "command": "tailor",
        "dryRun": dry_run,
        "score": result.report.score,
        "matched": result.report.matched,
        "missing": result.report.missing,
        "detectedDomains": result.report.job.detected_domains,
        "files": files,
    }))
}

fn batch(options: &Options) -> Result<(), String> {
    let jobs_path = options::required(options, "jobs")?;
    let jobs: Vec<BatchJob> = files::read_json(Path::new(jobs_path), "lote")?;
    validate_batch_jobs(&jobs)?;
    let default_model = options
        .get("model")
        .cloned()
        .unwrap_or_else(|| DEFAULT_ARCHETYPE_ID.into());
    let formats = options::formats(options)?;
    let default_template = options::template_option(options)?;
    let dry_run = options::parse_bool(options.get("dry-run"))?;
    let output = files::output_directory(options, dry_run)?;
    let conflict = ConflictPolicy::from_options(options)?;
    let mut results = Vec::with_capacity(jobs.len());

    for (index, job) in jobs.into_iter().enumerate() {
        let model = if job.base_model.trim().is_empty() {
            default_model.as_str()
        } else {
            job.base_model.as_str()
        };
        let profile = match job.profile {
            Some(profile) => {
                profile.validate()?;
                profile
            }
            None => load_archetype(model)?,
        };
        let tailored = tailor(
            &profile,
            &job.job_description,
            Some(model),
            job.confirmed_us_overlap,
        )?;
        let suffix = batch_suffix(index, &job.company, &job.job_title);
        let template = if job.template.trim().is_empty() {
            match default_template {
                Some(template) => template,
                None => ResumeTemplate::from_profile(&tailored.profile)?.unwrap_or_default(),
            }
        } else {
            ResumeTemplate::parse(&job.template)?
        };
        let files = files::write_all(WriteRequest {
            profile: &tailored.profile,
            formats: &formats,
            output: &output,
            basename: None,
            suffix: Some(&suffix),
            template,
            conflict,
            dry_run,
        })?;
        results.push(json!({
            "index": index + 1,
            "company": job.company,
            "jobTitle": job.job_title,
            "score": tailored.report.score,
            "detectedDomains": tailored.report.job.detected_domains,
            "matched": tailored.report.matched,
            "missing": tailored.report.missing,
            "files": files,
        }));
    }
    print_json(json!({
        "ok": true,
        "command": "batch",
        "dryRun": dry_run,
        "count": results.len(),
        "results": results,
    }))
}

fn run_manifest(options: &Options) -> Result<(), String> {
    let manifest_path = PathBuf::from(options::required(options, "manifest")?);
    let current_directory = std::env::current_dir()
        .map_err(|error| format!("nao foi possivel identificar o diretorio atual: {error}"))?;
    let manifest_path = if manifest_path.is_absolute() {
        manifest_path
    } else {
        current_directory.join(manifest_path)
    };
    let continue_on_error = options
        .get("continue-on-error")
        .map(|_| options::parse_bool(options.get("continue-on-error")))
        .transpose()?;
    let output_override = options
        .get("out")
        .map(|value| files::resolve_path(&current_directory, value))
        .transpose()?
        .map(|path| path.display().to_string());
    let profile_override = options
        .get("profile")
        .map(|value| files::resolve_path(&current_directory, value))
        .transpose()?
        .map(|path| path.display().to_string());
    let loaded = manifest::load_manifest(
        &manifest_path,
        ManifestOverrides {
            output_root: output_override.as_deref(),
            profile: profile_override.as_deref(),
            model: options.get("model").map(String::as_str),
            template: options.get("template").map(String::as_str),
            formats: options.get("format").map(String::as_str),
            conflict: options.get("on-conflict").map(String::as_str),
            continue_on_error,
        },
    )?;
    let dry_run = options::parse_bool(options.get("dry-run"))?;
    let mut results = Vec::with_capacity(loaded.tasks.len());
    let mut failed = 0_usize;
    for task in &loaded.tasks {
        match execute_manifest_task(task, dry_run) {
            Ok(result) => results.push(result),
            Err(error) => {
                failed += 1;
                results.push(json!({
                    "ok": false,
                    "index": task.index + 1,
                    "id": task.id,
                    "source": task.source,
                    "error": error,
                }));
                if !loaded.continue_on_error {
                    break;
                }
            }
        }
    }
    let succeeded = results.len() - failed;
    print_json(json!({
        "ok": failed == 0,
        "command": "run",
        "manifest": loaded.path,
        "dryRun": dry_run,
        "requested": loaded.tasks.len(),
        "processed": results.len(),
        "succeeded": succeeded,
        "failed": failed,
        "results": results,
    }))?;
    if failed > 0 {
        return Err(format!("{failed} job(s) do manifesto falharam"));
    }
    Ok(())
}

fn execute_manifest_task(task: &ResolvedTask, dry_run: bool) -> Result<serde_json::Value, String> {
    let profile = task.load_profile()?;
    let tailored = tailor(
        &profile,
        &task.job_description,
        Some(&task.base_model),
        task.confirmed_us_overlap,
    )?;
    let suffix = if task.output_name.is_some() {
        None
    } else {
        Some(batch_suffix(task.index, &task.company, &task.job_title))
    };
    let files = files::write_all(WriteRequest {
        profile: &tailored.profile,
        formats: &task.formats,
        output: &task.output_directory,
        basename: task.output_name.as_deref(),
        suffix: suffix.as_deref(),
        template: task.template,
        conflict: task.conflict,
        dry_run,
    })?;
    Ok(json!({
        "ok": true,
        "index": task.index + 1,
        "id": task.id,
        "source": task.source,
        "company": task.company,
        "jobTitle": task.job_title,
        "template": task.template,
        "formats": task.formats,
        "score": tailored.report.score,
        "matched": tailored.report.matched,
        "missing": tailored.report.missing,
        "detectedDomains": tailored.report.job.detected_domains,
        "files": files,
    }))
}

fn validate(options: &Options) -> Result<(), String> {
    let supplied = ["profile", "job", "jobs", "manifest"]
        .into_iter()
        .filter(|key| options.contains_key(*key))
        .collect::<Vec<_>>();
    if supplied.len() != 1 {
        return Err(
            "validate exige exatamente uma entrada: --profile, --job, --jobs ou --manifest".into(),
        );
    }
    let (kind, count) = match supplied[0] {
        "profile" => {
            files::read_profile(Path::new(options::required(options, "profile")?))?;
            ("profile", 1)
        }
        "job" => {
            files::read_job(Path::new(options::required(options, "job")?))?;
            ("job", 1)
        }
        "jobs" => {
            let jobs: Vec<BatchJob> =
                files::read_json(Path::new(options::required(options, "jobs")?), "lote")?;
            validate_batch_jobs(&jobs)?;
            ("batch", jobs.len())
        }
        "manifest" => {
            let path = Path::new(options::required(options, "manifest")?);
            let loaded = manifest::load_manifest(
                path,
                ManifestOverrides {
                    output_root: None,
                    profile: None,
                    model: None,
                    template: None,
                    formats: None,
                    conflict: None,
                    continue_on_error: None,
                },
            )?;
            for task in &loaded.tasks {
                task.load_profile()?;
            }
            ("manifest", loaded.tasks.len())
        }
        _ => unreachable!(),
    };
    print_json(json!({
        "ok": true,
        "command": "validate",
        "type": kind,
        "count": count,
    }))
}

fn validate_batch_jobs(jobs: &[BatchJob]) -> Result<(), String> {
    if jobs.is_empty() || jobs.len() > manifest::MAX_MANIFEST_JOBS {
        return Err(format!(
            "o lote deve conter entre 1 e {} vagas",
            manifest::MAX_MANIFEST_JOBS
        ));
    }
    for (index, job) in jobs.iter().enumerate() {
        if job.job_description.trim().is_empty() {
            return Err(format!("vaga {} nao possui descricao", index + 1));
        }
        if let Some(profile) = &job.profile {
            profile.validate()?;
        }
        if !job.template.trim().is_empty() {
            ResumeTemplate::parse(&job.template)?;
        }
    }
    Ok(())
}

fn load_source_profile(options: &Options) -> Result<(ResumeProfile, Option<String>), String> {
    if let Some(path) = options.get("profile") {
        let profile = files::read_profile(Path::new(path))?;
        return Ok((profile, options.get("model").cloned()));
    }
    let model = options
        .get("model")
        .cloned()
        .unwrap_or_else(|| DEFAULT_ARCHETYPE_ID.into());
    Ok((load_archetype(&model)?, Some(model)))
}

fn batch_suffix(index: usize, company: &str, job_title: &str) -> String {
    let label = options::safe_label(&format!("{company} {job_title}"));
    if label.is_empty() {
        format!("{:03}", index + 1)
    } else {
        format!("{:03}_{label}", index + 1)
    }
}

fn print_help() {
    println!(
        "Reoli Resume Forge v{}\n\n\
Uso:\n  reoliresume\n  reoliresume ui\n  \
reoliresume generate [--profile PERFIL.json | --model ID] --template classic --format pdf,docx --out DIRETORIO\n  \
reoliresume tailor --job VAGA.json [--profile PERFIL.json | --model ID] [--template compact] --format pdf,docx --out DIRETORIO\n  \
reoliresume batch --jobs VAGAS.json [--model ID] [--template executive] --format pdf --out DIRETORIO\n  \
reoliresume run --manifest AUTOMACAO.json [--dry-run] [--out DIRETORIO]\n  \
reoliresume validate (--profile ARQUIVO | --job ARQUIVO | --jobs ARQUIVO | --manifest ARQUIVO)\n  \
reoliresume templates | models | capabilities\n  \
reoliresume schema --type profile|job|batch|manifest\n\n\
Opcoes de saida:\n  --name NOME_BASE\n  --on-conflict error|rename|overwrite\n  --dry-run\n\n\
Modelo de dados incluído: fullstack (exemplo público e fictício)\n\
Templates: classic, clean, compact, executive, tech-minimalist, modern-split, executive-bold, academic\n\
Formatos: pdf, docx, json, md",
        env!("CARGO_PKG_VERSION")
    );
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::core::export::ExportFormat;
    use manifest::ProfileSource;

    #[test]
    fn recognizes_ui_mode_without_arguments() {
        assert!(is_ui_request(&[]));
        assert!(is_ui_request(&["ui".into()]));
        assert!(!is_ui_request(&["generate".into()]));
    }

    #[test]
    fn prefixes_batch_filenames_with_a_stable_unique_index() {
        assert_eq!(
            batch_suffix(0, "ACME", "Senior React"),
            "001_acme_senior_react"
        );
        assert_eq!(
            batch_suffix(1, "ACME", "Senior React"),
            "002_acme_senior_react"
        );
        assert_eq!(batch_suffix(2, "", ""), "003");
    }

    #[test]
    fn resolves_template_from_profile_with_classic_fallback() {
        let options = Options::new();
        let mut profile = load_archetype(DEFAULT_ARCHETYPE_ID).unwrap();
        assert_eq!(
            options::resolve_template(&options, &profile).unwrap(),
            ResumeTemplate::Classic
        );
        profile
            .config
            .extra
            .insert("template".into(), json!("modern-split"));
        assert_eq!(
            options::resolve_template(&options, &profile).unwrap(),
            ResumeTemplate::ModernSplit
        );
    }

    #[test]
    fn every_public_template_is_discoverable_and_parseable() {
        for name in discovery::TEMPLATE_IDS {
            assert!(ResumeTemplate::parse(name).is_ok());
        }
    }

    #[test]
    fn embedded_and_path_profiles_have_distinct_manifest_contracts() {
        let embedded: ProfileSource = serde_json::from_value(json!({
            "person": {"name": "Ada"},
            "headline": "Engineer",
            "summary": "Resumo",
            "experience": [{"company": "Analytical Engines"}]
        }))
        .unwrap();
        let path: ProfileSource = serde_json::from_value(json!("./profile.json")).unwrap();
        assert!(matches!(embedded, ProfileSource::Embedded(_)));
        assert!(matches!(path, ProfileSource::Path(_)));
    }

    #[test]
    fn export_formats_remain_serializable_for_machine_output() {
        assert_eq!(
            serde_json::to_value(ExportFormat::Markdown).unwrap(),
            "markdown"
        );
    }
}
