export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type ResumeTemplate =
  | 'classic'
  | 'clean'
  | 'compact'
  | 'executive'
  | 'tech-minimalist'
  | 'modern-split'
  | 'executive-bold'
  | 'academic';

export type ResumePalette =
  | 'template'
  | 'reoli-navy'
  | 'forest'
  | 'cobalt'
  | 'burgundy'
  | 'graphite';

export interface ResumeColors {
  primary: string;
  dark: string;
  soft: string;
  divider: string;
}

export interface ResumeConfig {
  tech_label: string;
  section_names: Record<string, string>;
  locale?: ResumeLocale;
  template?: ResumeTemplate;
  palette?: ResumePalette;
  colors?: ResumeColors;
  [key: string]: JsonValue | Record<string, string> | ResumeColors | undefined;
}

export interface Person {
  name: string;
  location: string;
  work_preference: string;
  phone: string;
  email: string;
  linkedin: string;
  portfolio: string;
  github: string;
}

export interface Experience {
  company: string;
  role: string;
  dates: string;
  location: string;
  work_mode: string;
  summary: string;
  bullets: string[];
  technologies: string[];
}

export interface Project {
  name: string;
  description: string;
  metrics: string[];
  technologies: string[];
}

export interface Education {
  degree: string;
  institution: string;
  dates: string;
}

export interface Language {
  language: string;
  level: string;
}

export interface Certification {
  name: string;
  issuer: string;
  date: string;
}

export type ResumeLocale = 'pt-BR' | 'en-US' | 'es-ES';
export type SkillsLayout = 'categorized' | 'table' | 'tags' | 'levels';
export type NarrativeLayout = 'bullets' | 'paragraphs' | 'metrics';
export type ResumeDensity = 'compact' | 'balanced' | 'relaxed';

export interface ResumeLayoutConfig {
  section_order: string[];
  hidden_sections: string[];
  skills_style: SkillsLayout;
  experience_style: NarrativeLayout;
  projects_style: NarrativeLayout;
  density: ResumeDensity;
  emphasize_metrics: boolean;
  skill_levels: Record<string, number>;
}

export type CustomSectionKind =
  | 'volunteering'
  | 'courses'
  | 'publications'
  | 'awards'
  | 'custom';

export interface CustomSection {
  id: string;
  title: string;
  kind: CustomSectionKind;
  items: string[];
}

export interface ResumeProfile {
  config: ResumeConfig;
  layout: ResumeLayoutConfig;
  person: Person;
  headline: string;
  summary: string;
  target_keywords: string[];
  skills: Record<string, JsonValue>;
  soft_skills: string[];
  experience: Experience[];
  projects: Project[];
  education: Education[];
  languages: Language[];
  certifications: Certification[];
  custom_sections: CustomSection[];
}

export interface ArchetypeMetadata {
  id: string;
  label: string;
  locale: string;
  focus: string;
}

export interface JobRequirement {
  text: string;
  level: 'required' | 'preferred' | 'unspecified';
  keywords: string[];
}

export interface JobAnalysis {
  keywords: string[];
  requiredKeywords: string[];
  seniority: string;
  requirements: JobRequirement[];
}

export interface MatchReport {
  score: number | null;
  scoreKind: string;
  matched: string[];
  missing: string[];
  job: JobAnalysis;
  warnings: string[];
}

export interface TailorResult {
  profile: ResumeProfile;
  report: MatchReport;
  quantifiedPercent: number;
  provenance: Array<{
    experience: number;
    sourceBullet: number;
    quantified: boolean;
  }>;
}

export type ExportFormat = 'pdf' | 'docx' | 'json' | 'markdown';
