use super::options::{Options, required};
use crate::core::ResumeProfile;
use crate::core::export::{self, ExportFormat, ResumeTemplate};
use serde::de::DeserializeOwned;
use serde_json::Value;
use std::fs;
use std::path::{Component, Path, PathBuf};

pub const MAX_INPUT_BYTES: u64 = 1_048_576;

#[derive(Clone, Copy, Debug, Default, Eq, PartialEq)]
pub enum ConflictPolicy {
    #[default]
    Error,
    Rename,
    Overwrite,
}

impl ConflictPolicy {
    pub fn parse(value: &str) -> Result<Self, String> {
        match value.trim().to_ascii_lowercase().as_str() {
            "error" | "fail" => Ok(Self::Error),
            "rename" | "unique" => Ok(Self::Rename),
            "overwrite" | "replace" => Ok(Self::Overwrite),
            other => Err(format!(
                "politica de conflito desconhecida: {other}. Use error, rename ou overwrite"
            )),
        }
    }

    pub fn from_options(options: &Options) -> Result<Self, String> {
        options
            .get("on-conflict")
            .map(|value| Self::parse(value))
            .transpose()
            .map(|value| value.unwrap_or_default())
    }
}

pub fn read_limited(path: &Path) -> Result<String, String> {
    let metadata = fs::metadata(path)
        .map_err(|error| format!("nao foi possivel acessar {}: {error}", path.display()))?;
    if !metadata.is_file() {
        return Err(format!("entrada nao e um arquivo: {}", path.display()));
    }
    if metadata.len() > MAX_INPUT_BYTES {
        return Err(format!("entrada excede 1 MiB: {}", path.display()));
    }
    fs::read_to_string(path)
        .map_err(|error| format!("nao foi possivel ler {}: {error}", path.display()))
}

pub fn read_json<T: DeserializeOwned>(path: &Path, label: &str) -> Result<T, String> {
    let raw = read_limited(path)?;
    serde_json::from_str(&raw).map_err(|error| format!("{label} JSON invalido: {error}"))
}

pub fn read_profile(path: &Path) -> Result<ResumeProfile, String> {
    let profile: ResumeProfile = read_json(path, "perfil")?;
    profile.validate()?;
    Ok(profile)
}

pub fn read_job(path: &Path) -> Result<String, String> {
    let raw = read_limited(path)?;
    if path.extension().and_then(|value| value.to_str()) == Some("json") {
        let value: Value =
            serde_json::from_str(&raw).map_err(|error| format!("vaga JSON invalida: {error}"))?;
        for key in [
            "job_description",
            "jobDescription",
            "jd_text",
            "description",
        ] {
            if let Some(text) = value.get(key).and_then(Value::as_str) {
                if text.trim().is_empty() {
                    return Err("a descricao da vaga esta vazia".into());
                }
                return Ok(text.to_string());
            }
        }
        return Err("vaga JSON nao contem job_description, jd_text ou description".into());
    }
    if raw.trim().is_empty() {
        return Err("a descricao da vaga esta vazia".into());
    }
    Ok(raw)
}

pub fn resolve_input_path(base: &Path, value: &str) -> Result<PathBuf, String> {
    let candidate = resolve_path(base, value)?;
    candidate
        .canonicalize()
        .map_err(|error| format!("nao foi possivel resolver {}: {error}", candidate.display()))
}

pub fn resolve_path(base: &Path, value: &str) -> Result<PathBuf, String> {
    if value.trim().is_empty() {
        return Err("caminho vazio nao e permitido".into());
    }
    let path = PathBuf::from(value);
    Ok(if path.is_absolute() {
        path
    } else {
        base.join(path)
    })
}

pub fn output_directory(options: &Options, dry_run: bool) -> Result<PathBuf, String> {
    prepare_output_directory(Path::new(required(options, "out")?), dry_run)
}

pub fn prepare_output_directory(path: &Path, dry_run: bool) -> Result<PathBuf, String> {
    let absolute = if path.is_absolute() {
        path.to_path_buf()
    } else {
        std::env::current_dir()
            .map_err(|error| format!("nao foi possivel identificar o diretorio atual: {error}"))?
            .join(path)
    };
    if dry_run {
        return Ok(absolute);
    }
    fs::create_dir_all(&absolute)
        .map_err(|error| format!("nao foi possivel criar {}: {error}", absolute.display()))?;
    absolute
        .canonicalize()
        .map_err(|error| format!("nao foi possivel resolver {}: {error}", absolute.display()))
}

pub fn append_output_folder(base: &Path, folder: &str) -> Result<PathBuf, String> {
    if folder.trim().is_empty() {
        return Ok(base.to_path_buf());
    }
    let relative = Path::new(folder);
    if relative
        .components()
        .any(|component| !matches!(component, Component::Normal(_)))
    {
        return Err("output.folder deve ser um caminho relativo sem '..'".into());
    }
    Ok(base.join(relative))
}

pub fn validate_output_name(value: &str) -> Result<(), String> {
    let trimmed = value.trim();
    if trimmed.is_empty() || trimmed.chars().count() > 120 {
        return Err("output.name deve ter entre 1 e 120 caracteres".into());
    }
    if trimmed.ends_with('.')
        || trimmed.ends_with(' ')
        || trimmed
            .chars()
            .any(|character| character.is_control() || "\\/:*?\"<>|".contains(character))
    {
        return Err("output.name contem caracteres invalidos para Windows".into());
    }
    Ok(())
}

pub struct WriteRequest<'a> {
    pub profile: &'a ResumeProfile,
    pub formats: &'a [ExportFormat],
    pub output: &'a Path,
    pub basename: Option<&'a str>,
    pub suffix: Option<&'a str>,
    pub template: ResumeTemplate,
    pub conflict: ConflictPolicy,
    pub dry_run: bool,
}

pub fn write_all(request: WriteRequest<'_>) -> Result<Vec<String>, String> {
    let mut base = request
        .basename
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string)
        .unwrap_or_else(|| export::safe_basename(request.profile));
    validate_output_name(&base)?;
    if let Some(suffix) = request.suffix.filter(|value| !value.is_empty()) {
        base.push('_');
        base.push_str(suffix);
    }

    let output = prepare_output_directory(request.output, request.dry_run)?;
    let base = resolve_available_basename(&output, &base, request.formats, request.conflict)?;
    let paths = request
        .formats
        .iter()
        .map(|format| output.join(format!("{base}.{}", format.extension())))
        .collect::<Vec<_>>();
    if let Some(path) = paths.iter().find(|path| path.as_os_str().len() > 4_096) {
        return Err(format!(
            "caminho de saida excede 4.096 caracteres: {}",
            path.display()
        ));
    }

    if !request.dry_run {
        let rendered = request
            .formats
            .iter()
            .map(|format| {
                export::render_with_template(request.profile, *format, request.template)
                    .map(|bytes| (*format, bytes))
            })
            .collect::<Result<Vec<_>, _>>()?;
        for ((_, bytes), path) in rendered.into_iter().zip(paths.iter()) {
            fs::write(path, bytes)
                .map_err(|error| format!("falha ao gravar {}: {error}", path.display()))?;
        }
    }

    Ok(paths
        .into_iter()
        .map(|path| path.display().to_string())
        .collect())
}

fn resolve_available_basename(
    output: &Path,
    base: &str,
    formats: &[ExportFormat],
    conflict: ConflictPolicy,
) -> Result<String, String> {
    let conflicts = |candidate: &str| {
        formats.iter().any(|format| {
            output
                .join(format!("{candidate}.{}", format.extension()))
                .exists()
        })
    };
    if conflict == ConflictPolicy::Overwrite || !conflicts(base) {
        return Ok(base.into());
    }
    if conflict == ConflictPolicy::Error {
        return Err(format!(
            "ja existe uma saida com o nome-base '{base}' em {}. Use --on-conflict rename ou overwrite",
            output.display()
        ));
    }
    for index in 2..=9_999 {
        let candidate = format!("{base}_{index}");
        if !conflicts(&candidate) {
            return Ok(candidate);
        }
    }
    Err("nao foi possivel encontrar um nome de saida livre".into())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_only_safe_relative_output_folders() {
        let base = Path::new("C:\\output");
        assert!(append_output_folder(base, "acme\\frontend").is_ok());
        assert!(append_output_folder(base, "..\\outside").is_err());
        assert!(append_output_folder(base, "C:\\absolute").is_err());
    }

    #[test]
    fn rejects_output_names_that_can_escape_or_break_windows_paths() {
        assert!(validate_output_name("pedro-acme-frontend").is_ok());
        assert!(validate_output_name("../escape").is_err());
        assert!(validate_output_name("arquivo?.pdf").is_err());
    }
}
