import { invoke } from '@tauri-apps/api/core';
import { save } from '@tauri-apps/plugin-dialog';
import frontend from '../data/archetypes/01_frontend.json';
import node from '../data/archetypes/02_fullstack_node.json';
import dotnet from '../data/archetypes/03_fullstack_dotnet.json';
import lead from '../data/archetypes/04_tech_lead.json';
import international from '../data/archetypes/05_internacional_en.json';
import type {
  ArchetypeMetadata,
  ExportFormat,
  MatchReport,
  ResumeProfile,
  ResumeTemplate,
  TailorResult,
} from '../types/resume';

const profiles: Record<string, ResumeProfile> = {
  '01_frontend': normalizeProfile(frontend),
  '02_fullstack_node': normalizeProfile(node),
  '03_fullstack_dotnet': normalizeProfile(dotnet),
  '04_tech_lead': normalizeProfile(lead),
  '05_internacional_en': normalizeProfile(international),
};

export const fallbackArchetypes: ArchetypeMetadata[] = [
  { id: '01_frontend', label: 'Frontend & Design Systems', locale: 'pt-BR', focus: 'React, Next.js e Design Systems' },
  { id: '02_fullstack_node', label: 'Full Stack Node.js', locale: 'pt-BR', focus: 'Node.js, APIs e PostgreSQL' },
  { id: '03_fullstack_dotnet', label: 'Full Stack .NET', locale: 'pt-BR', focus: 'C#, .NET, SQL Server e React' },
  { id: '04_tech_lead', label: 'Tech Lead', locale: 'pt-BR', focus: 'System Design, liderança e governança' },
  { id: '05_internacional_en', label: 'International EN', locale: 'en-US', focus: 'Global Full Stack Engineering' },
];

export function isDesktop(): boolean {
  return '__TAURI_INTERNALS__' in window;
}

export async function listArchetypes(): Promise<ArchetypeMetadata[]> {
  return isDesktop() ? invoke('list_archetypes') : fallbackArchetypes;
}

export async function loadArchetype(id: string): Promise<ResumeProfile> {
  if (isDesktop()) return invoke('load_archetype', { id });
  const profile = profiles[id];
  if (!profile) throw new Error(`Arquétipo desconhecido: ${id}`);
  return structuredClone(profile);
}

export async function analyzeMatch(
  profile: ResumeProfile,
  jobDescription: string,
): Promise<MatchReport> {
  if (isDesktop()) return invoke('analyze_match', { profile, jobDescription });
  return browserPreviewAnalysis(profile, jobDescription);
}

export async function tailorProfile(
  profile: ResumeProfile,
  jobDescription: string,
  modelId: string,
): Promise<TailorResult> {
  if (isDesktop()) {
    return invoke('tailor_profile', { profile, jobDescription, modelId, confirmedUsOverlap: false });
  }
  return {
    profile: structuredClone(profile),
    report: browserPreviewAnalysis(profile, jobDescription),
    quantifiedPercent: 0,
    provenance: [],
  };
}

export async function exportResume(
  profile: ResumeProfile,
  format: ExportFormat,
  template: ResumeTemplate,
): Promise<string | null> {
  if (!isDesktop()) {
    if (format === 'json' || format === 'markdown') {
      const text = format === 'json' ? JSON.stringify(profile, null, 2) : browserMarkdown(profile);
      downloadText(text, format === 'json' ? 'curriculo.json' : 'curriculo.md');
      return 'download';
    }
    throw new Error('A exportação PDF/DOCX está disponível no aplicativo desktop.');
  }
  const extension = format === 'markdown' ? 'md' : format;
  const path = await save({
    title: `Exportar ${extension.toUpperCase()}`,
    defaultPath: `curriculo.${extension}`,
    filters: [{ name: extension.toUpperCase(), extensions: [extension] }],
  });
  if (!path) return null;
  return invoke('export_resume', { profile, format, template, path });
}

export async function resumeToMarkdown(profile: ResumeProfile): Promise<string> {
  return isDesktop() ? invoke('resume_to_markdown', { profile }) : browserMarkdown(profile);
}

function browserPreviewAnalysis(profile: ResumeProfile, jobDescription: string): MatchReport {
  const job = normalize(jobDescription);
  const candidates = Array.from(
    new Set(
      Object.values(profile.skills)
        .flatMap((value) => (Array.isArray(value) ? value : [value]))
        .filter((value): value is string => typeof value === 'string')
        .concat(profile.target_keywords),
    ),
  );
  const keywords = candidates.filter((keyword) => job.includes(normalize(keyword)));
  const expected = profile.target_keywords.filter((keyword) => job.includes(normalize(keyword)));
  const matched = expected.filter((keyword) => keywords.includes(keyword));
  const missing = expected.filter((keyword) => !matched.includes(keyword));
  return {
    score: expected.length ? Math.round((matched.length / expected.length) * 100) : null,
    scoreKind: 'browser_preview_only',
    matched,
    missing,
    job: { keywords: expected, requiredKeywords: [], seniority: '', requirements: [] },
    warnings: ['PREVIEW: o score definitivo é calculado pelo núcleo Rust no desktop.'],
  };
}

function browserMarkdown(profile: ResumeProfile): string {
  const lines = [`# ${profile.person.name}`, profile.headline, '', `## ${profile.config.section_names.summary}`, profile.summary, ''];
  for (const item of profile.experience) {
    lines.push(`## ${item.company} — ${item.role}`, item.summary, ...item.bullets.map((bullet) => `- ${bullet}`), '');
  }
  return `${lines.join('\n')}\n`;
}

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();
}

function downloadText(content: string, filename: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function normalizeProfile(raw: unknown): ResumeProfile {
  const profile = raw as ResumeProfile;
  return {
    ...profile,
    target_keywords: profile.target_keywords ?? [],
    soft_skills: profile.soft_skills ?? [],
    experience: profile.experience ?? [],
    projects: profile.projects ?? [],
    education: profile.education ?? [],
    languages: profile.languages ?? [],
    certifications: profile.certifications ?? [],
  };
}
