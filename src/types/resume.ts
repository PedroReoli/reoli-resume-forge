export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export interface ResumeConfig {
  tech_label: string;
  section_names: Record<string, string>;
  [key: string]: JsonValue | Record<string, string>;
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

export interface ResumeProfile {
  config: ResumeConfig;
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

export type ResumeTemplate = 'clean' | 'compact' | 'executive';
export type ExportFormat = 'pdf' | 'docx' | 'json' | 'markdown';
