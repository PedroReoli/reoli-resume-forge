use super::files::{
    ConflictPolicy, append_output_folder, read_json, read_profile, resolve_input_path,
    resolve_path, validate_output_name,
};
use super::options::parse_formats;
use crate::core::ResumeProfile;
use crate::core::export::{ExportFormat, ResumeTemplate};
use serde::Deserialize;
use std::path::{Path, PathBuf};

pub const MAX_MANIFEST_JOBS: usize = 500;

#[derive(Clone, Debug, Default, Deserialize)]
#[serde(untagged)]
pub enum StringList {
    #[default]
    Empty,
    One(String),
    Many(Vec<String>),
}

impl StringList {
    fn is_empty(&self) -> bool {
        match self {
            Self::Empty => true,
            Self::One(value) => value.trim().is_empty(),
            Self::Many(values) => values.is_empty(),
        }
    }

    fn as_csv(&self) -> String {
        match self {
            Self::Empty => String::new(),
            Self::One(value) => value.clone(),
            Self::Many(values) => values.join(","),
        }
    }
}

#[derive(Clone, Debug, Deserialize)]
#[serde(untagged)]
pub enum ProfileSource {
    Path(String),
    Embedded(Box<ResumeProfile>),
}

#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct OutputSpec {
    #[serde(alias = "out", alias = "output_dir")]
    pub directory: String,
    #[serde(alias = "output_folder")]
    pub folder: String,
    #[serde(alias = "filename", alias = "output_name")]
    pub name: String,
}

impl OutputSpec {
    fn overlay(mut self, other: Self) -> Self {
        replace_when_present(&mut self.directory, other.directory);
        replace_when_present(&mut self.folder, other.folder);
        replace_when_present(&mut self.name, other.name);
        self
    }
}

#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct TaskSpec {
    #[serde(alias = "path", alias = "job_file")]
    pub source: String,
    pub id: String,
    pub company: String,
    #[serde(alias = "jobTitle")]
    pub job_title: String,
    #[serde(alias = "jobDescription", alias = "jd_text", alias = "description")]
    pub job_description: String,
    #[serde(alias = "text", alias = "context")]
    pub extra_text: String,
    #[serde(alias = "model", alias = "baseModel")]
    pub base_model: String,
    pub profile: Option<ProfileSource>,
    pub template: String,
    #[serde(alias = "format")]
    pub formats: StringList,
    #[serde(alias = "confirmedUsOverlap")]
    pub confirmed_us_overlap: Option<bool>,
    pub output: OutputSpec,
    #[serde(alias = "onConflict")]
    pub on_conflict: String,
    pub enabled: Option<bool>,
}

impl TaskSpec {
    fn overlay(mut self, other: Self) -> Self {
        replace_when_present(&mut self.source, other.source);
        replace_when_present(&mut self.id, other.id);
        replace_when_present(&mut self.company, other.company);
        replace_when_present(&mut self.job_title, other.job_title);
        replace_when_present(&mut self.job_description, other.job_description);
        replace_when_present(&mut self.extra_text, other.extra_text);
        replace_when_present(&mut self.base_model, other.base_model);
        if other.profile.is_some() {
            self.profile = other.profile;
        }
        replace_when_present(&mut self.template, other.template);
        if !other.formats.is_empty() {
            self.formats = other.formats;
        }
        if other.confirmed_us_overlap.is_some() {
            self.confirmed_us_overlap = other.confirmed_us_overlap;
        }
        self.output = self.output.overlay(other.output);
        replace_when_present(&mut self.on_conflict, other.on_conflict);
        if other.enabled.is_some() {
            self.enabled = other.enabled;
        }
        self
    }

    fn resolve_paths(mut self, base: &Path) -> Result<Self, String> {
        if let Some(ProfileSource::Path(path)) = &mut self.profile {
            *path = resolve_path(base, path)?.display().to_string();
        }
        if !self.output.directory.trim().is_empty() {
            self.output.directory = resolve_path(base, &self.output.directory)?
                .display()
                .to_string();
        }
        Ok(self)
    }
}

fn replace_when_present(target: &mut String, value: String) {
    if !value.trim().is_empty() {
        *target = value;
    }
}

#[derive(Debug, Deserialize)]
#[serde(default)]
struct ManifestDocument {
    version: u32,
    defaults: TaskSpec,
    jobs: Vec<TaskSpec>,
    continue_on_error: bool,
}

impl Default for ManifestDocument {
    fn default() -> Self {
        Self {
            version: 1,
            defaults: TaskSpec::default(),
            jobs: Vec::new(),
            continue_on_error: true,
        }
    }
}

#[derive(Clone, Debug)]
pub struct ResolvedTask {
    pub index: usize,
    pub id: String,
    pub source: Option<PathBuf>,
    pub company: String,
    pub job_title: String,
    pub job_description: String,
    pub base_model: String,
    pub profile: Option<ProfileSource>,
    pub template: ResumeTemplate,
    pub formats: Vec<ExportFormat>,
    pub confirmed_us_overlap: bool,
    pub output_directory: PathBuf,
    pub output_name: Option<String>,
    pub conflict: ConflictPolicy,
}

impl ResolvedTask {
    pub fn load_profile(&self) -> Result<ResumeProfile, String> {
        match &self.profile {
            Some(ProfileSource::Embedded(profile)) => {
                profile.validate()?;
                Ok(profile.as_ref().clone())
            }
            Some(ProfileSource::Path(path)) => read_profile(Path::new(path)),
            None => crate::core::load_archetype(&self.base_model),
        }
    }
}

#[derive(Debug)]
pub struct LoadedManifest {
    pub path: PathBuf,
    pub continue_on_error: bool,
    pub tasks: Vec<ResolvedTask>,
}

pub struct ManifestOverrides<'a> {
    pub output_root: Option<&'a str>,
    pub profile: Option<&'a str>,
    pub model: Option<&'a str>,
    pub template: Option<&'a str>,
    pub formats: Option<&'a str>,
    pub conflict: Option<&'a str>,
    pub continue_on_error: Option<bool>,
}

pub fn load_manifest(
    manifest_path: &Path,
    overrides: ManifestOverrides<'_>,
) -> Result<LoadedManifest, String> {
    let path = manifest_path.canonicalize().map_err(|error| {
        format!(
            "nao foi possivel resolver {}: {error}",
            manifest_path.display()
        )
    })?;
    let base = path
        .parent()
        .ok_or_else(|| format!("manifesto sem diretorio base: {}", path.display()))?;
    let document: ManifestDocument = read_json(&path, "manifesto")?;
    if document.version != 1 {
        return Err(format!(
            "versao de manifesto nao suportada: {}. Use version 1",
            document.version
        ));
    }
    if document.jobs.is_empty() || document.jobs.len() > MAX_MANIFEST_JOBS {
        return Err(format!(
            "o manifesto deve conter entre 1 e {MAX_MANIFEST_JOBS} jobs"
        ));
    }

    let defaults = document.defaults.resolve_paths(base)?;
    let mut tasks = Vec::with_capacity(document.jobs.len());
    for (index, entry) in document.jobs.into_iter().enumerate() {
        if entry.enabled == Some(false) {
            continue;
        }
        let source_path = if entry.source.trim().is_empty() {
            None
        } else {
            Some(resolve_input_path(base, &entry.source)?)
        };
        let source_spec = match &source_path {
            Some(source) => {
                let mut spec: TaskSpec = read_json(source, "job")?;
                if !spec.source.trim().is_empty() {
                    return Err(format!(
                        "job {} referencia outro source; referencias recursivas nao sao permitidas",
                        index + 1
                    ));
                }
                let source_base = source
                    .parent()
                    .ok_or_else(|| format!("job sem diretorio base: {}", source.display()))?;
                spec = spec.resolve_paths(source_base)?;
                spec
            }
            None => TaskSpec::default(),
        };
        let entry = entry.resolve_paths(base)?;
        let mut merged = defaults.clone().overlay(source_spec).overlay(entry);
        apply_overrides(&mut merged, &overrides, base)?;
        tasks.push(resolve_task(index, source_path, merged, base)?);
    }
    if tasks.is_empty() {
        return Err("o manifesto nao possui jobs habilitados".into());
    }

    Ok(LoadedManifest {
        path,
        continue_on_error: overrides
            .continue_on_error
            .unwrap_or(document.continue_on_error),
        tasks,
    })
}

fn apply_overrides(
    task: &mut TaskSpec,
    overrides: &ManifestOverrides<'_>,
    current_directory: &Path,
) -> Result<(), String> {
    if let Some(path) = overrides.output_root {
        task.output.directory = resolve_path(current_directory, path)?.display().to_string();
    }
    if let Some(path) = overrides.profile {
        task.profile = Some(ProfileSource::Path(
            resolve_path(current_directory, path)?.display().to_string(),
        ));
    }
    if let Some(value) = overrides.model {
        task.base_model = value.into();
    }
    if let Some(value) = overrides.template {
        task.template = value.into();
    }
    if let Some(value) = overrides.formats {
        task.formats = StringList::One(value.into());
    }
    if let Some(value) = overrides.conflict {
        task.on_conflict = value.into();
    }
    Ok(())
}

fn resolve_task(
    index: usize,
    source: Option<PathBuf>,
    task: TaskSpec,
    manifest_base: &Path,
) -> Result<ResolvedTask, String> {
    let mut job_description = task.job_description.trim().to_string();
    if !task.extra_text.trim().is_empty() {
        if !job_description.is_empty() {
            job_description.push_str("\n\n");
        }
        job_description.push_str(task.extra_text.trim());
    }
    if job_description.is_empty() {
        return Err(format!("job {} nao possui job_description", index + 1));
    }
    let base_model = if task.base_model.trim().is_empty() {
        "01_frontend".into()
    } else {
        task.base_model
    };
    let template = if task.template.trim().is_empty() {
        match &task.profile {
            Some(ProfileSource::Embedded(profile)) => {
                ResumeTemplate::from_profile(profile)?.unwrap_or_default()
            }
            Some(ProfileSource::Path(path)) => {
                let profile = read_profile(Path::new(path))?;
                ResumeTemplate::from_profile(&profile)?.unwrap_or_default()
            }
            None => {
                let profile = crate::core::load_archetype(&base_model)?;
                ResumeTemplate::from_profile(&profile)?.unwrap_or_default()
            }
        }
    } else {
        ResumeTemplate::parse(&task.template)?
    };
    let formats = if task.formats.is_empty() {
        vec![ExportFormat::Pdf]
    } else {
        parse_formats(&task.formats.as_csv())?
    };
    let output_root = if task.output.directory.trim().is_empty() {
        manifest_base.join("output")
    } else {
        PathBuf::from(&task.output.directory)
    };
    let output_directory = append_output_folder(&output_root, &task.output.folder)?;
    let output_name =
        (!task.output.name.trim().is_empty()).then(|| task.output.name.trim().to_string());
    if let Some(name) = &output_name {
        validate_output_name(name)?;
    }
    let conflict = if task.on_conflict.trim().is_empty() {
        ConflictPolicy::Error
    } else {
        ConflictPolicy::parse(&task.on_conflict)?
    };
    let id = if task.id.trim().is_empty() {
        format!("job-{:03}", index + 1)
    } else {
        task.id
    };

    Ok(ResolvedTask {
        index,
        id,
        source,
        company: task.company,
        job_title: task.job_title,
        job_description,
        base_model,
        profile: task.profile,
        template,
        formats,
        confirmed_us_overlap: task.confirmed_us_overlap.unwrap_or(false),
        output_directory,
        output_name,
        conflict,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_string_or_array_formats() {
        let one: TaskSpec = serde_json::from_str(r#"{"formats":"pdf,docx"}"#).unwrap();
        let many: TaskSpec = serde_json::from_str(r#"{"formats":["pdf","json"]}"#).unwrap();
        assert_eq!(one.formats.as_csv(), "pdf,docx");
        assert_eq!(many.formats.as_csv(), "pdf,json");
    }

    #[test]
    fn overlays_only_values_explicitly_provided_by_the_job() {
        let defaults: TaskSpec = serde_json::from_str(
            r#"{"base_model":"01_frontend","template":"classic","output":{"directory":"out"}}"#,
        )
        .unwrap();
        let item: TaskSpec =
            serde_json::from_str(r#"{"template":"compact","output":{"folder":"acme"}}"#).unwrap();
        let merged = defaults.overlay(item);
        assert_eq!(merged.base_model, "01_frontend");
        assert_eq!(merged.template, "compact");
        assert_eq!(merged.output.directory, "out");
        assert_eq!(merged.output.folder, "acme");
    }
}
