use crate::core::list_archetypes;
use serde_json::{Value, json};

const PROFILE_SCHEMA: &str = include_str!("../../../schemas/profile.schema.json");
const JOB_SCHEMA: &str = include_str!("../../../schemas/job.schema.json");
const BATCH_SCHEMA: &str = include_str!("../../../schemas/batch.schema.json");
const MANIFEST_SCHEMA: &str = include_str!("../../../schemas/manifest.schema.json");

pub const TEMPLATE_IDS: [&str; 8] = [
    "classic",
    "clean",
    "compact",
    "executive",
    "tech-minimalist",
    "modern-split",
    "executive-bold",
    "academic",
];

pub fn print_models() -> Result<(), String> {
    print_json(json!({
        "ok": true,
        "command": "models",
        "models": list_archetypes(),
    }))
}

pub fn print_templates() -> Result<(), String> {
    print_json(json!({
        "ok": true,
        "command": "templates",
        "templates": [
            {"id": "classic", "atsRisk": "low", "label": "Classic Reoli"},
            {"id": "clean", "atsRisk": "low", "label": "Clean Slate"},
            {"id": "compact", "atsRisk": "low", "label": "Compact Linear"},
            {"id": "executive", "atsRisk": "low", "label": "Executive Accent"},
            {"id": "tech-minimalist", "atsRisk": "low", "label": "Tech Minimalist"},
            {"id": "modern-split", "atsRisk": "medium", "label": "Modern Split"},
            {"id": "executive-bold", "atsRisk": "low", "label": "Executive Bold"},
            {"id": "academic", "atsRisk": "low", "label": "Academic / Chronological"}
        ],
    }))
}

pub fn print_capabilities() -> Result<(), String> {
    print_json(json!({
        "ok": true,
        "command": "capabilities",
        "program": "reoliresume",
        "version": env!("CARGO_PKG_VERSION"),
        "commands": [
            "ui", "generate", "tailor", "batch", "run", "validate",
            "templates", "models", "schema", "capabilities", "help", "version"
        ],
        "formats": ["pdf", "docx", "json", "md"],
        "templates": TEMPLATE_IDS,
        "limits": {
            "inputBytes": super::files::MAX_INPUT_BYTES,
            "batchJobs": super::manifest::MAX_MANIFEST_JOBS,
        },
        "automation": {
            "stdout": "json",
            "stderr": "json",
            "successExitCode": 0,
            "errorExitCode": 2,
            "interactivePrompts": false
        }
    }))
}

pub fn print_schema(schema_type: &str) -> Result<(), String> {
    let raw = match schema_type {
        "profile" => PROFILE_SCHEMA,
        "job" => JOB_SCHEMA,
        "batch" | "jobs" => BATCH_SCHEMA,
        "manifest" => MANIFEST_SCHEMA,
        other => {
            return Err(format!(
                "schema desconhecido: {other}. Use profile, job, batch ou manifest"
            ));
        }
    };
    let schema: Value = serde_json::from_str(raw)
        .map_err(|error| format!("schema interno {schema_type} invalido: {error}"))?;
    print_json(json!({
        "ok": true,
        "command": "schema",
        "type": schema_type,
        "schema": schema,
    }))
}

pub fn print_json(value: Value) -> Result<(), String> {
    println!(
        "{}",
        serde_json::to_string_pretty(&value).map_err(|error| error.to_string())?
    );
    Ok(())
}
