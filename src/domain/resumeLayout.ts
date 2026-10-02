import type {
  CustomSection,
  CustomSectionKind,
  ResumeLayoutConfig,
  ResumeLocale,
  ResumeProfile,
  ResumeTemplate,
} from '../types/resume';

export const DEFAULT_RESUME_TEMPLATE: ResumeTemplate = 'classic';

export const RESUME_TEMPLATE_IDS: readonly ResumeTemplate[] = [
  'classic',
  'clean',
  'compact',
  'executive',
  'tech-minimalist',
  'modern-split',
  'executive-bold',
  'academic',
];

export const DEFAULT_SECTION_ORDER = [
  'summary',
  'skills',
  'soft_skills',
  'experience',
  'projects',
  'education',
  'certifications',
  'languages',
] as const;

export const TEMPLATE_OPTIONS: Array<{
  id: ResumeTemplate;
  label: string;
  description: string;
  bestFor: string;
  atsMode: 'linear' | 'visual';
}> = [
  { id: 'classic', label: 'Classic Reoli', description: 'A estética corporativa do gerador original do Vault.', bestFor: 'Tecnologia e produto', atsMode: 'linear' },
  { id: 'tech-minimalist', label: 'Tech Minimalist', description: 'Stack, métricas e links com alta densidade.', bestFor: 'Engenharia e DevOps', atsMode: 'linear' },
  { id: 'modern-split', label: 'Modern Split', description: 'Sidebar visual e narrativa profissional em duas colunas.', bestFor: 'Envio direto e portfólio', atsMode: 'visual' },
  { id: 'executive-bold', label: 'Executive Bold', description: 'Hierarquia forte para liderança e arquitetura.', bestFor: 'Liderança e gestão', atsMode: 'linear' },
  { id: 'academic', label: 'Academic', description: 'Cronologia, formação, cursos e publicações.', bestFor: 'Pesquisa e educação', atsMode: 'linear' },
  { id: 'clean', label: 'Clean Slate', description: 'Editorial equilibrado e discreto.', bestFor: 'Uso geral', atsMode: 'linear' },
  { id: 'compact', label: 'Compact Linear', description: 'Máximo conteúdo com leitura linear para ATS.', bestFor: 'Carreiras extensas', atsMode: 'linear' },
  { id: 'executive', label: 'Executive Accent', description: 'Faixa executiva e contraste institucional.', bestFor: 'Consultoria e direção', atsMode: 'linear' },
];

export const SECTION_LABELS: Record<string, string> = {
  summary: 'Resumo',
  skills: 'Competências',
  soft_skills: 'Pontos fortes',
  experience: 'Experiência',
  projects: 'Projetos',
  education: 'Formação',
  certifications: 'Certificações',
  languages: 'Idiomas',
};

export function createDefaultLayout(): ResumeLayoutConfig {
  return {
    section_order: [...DEFAULT_SECTION_ORDER],
    hidden_sections: [],
    skills_style: 'categorized',
    experience_style: 'bullets',
    projects_style: 'bullets',
    density: 'balanced',
    emphasize_metrics: true,
    skill_levels: {},
  };
}

export function normalizeResumeProfile(raw: ResumeProfile): ResumeProfile {
  const customSections = Array.isArray(raw.custom_sections) ? raw.custom_sections : [];
  const layout = normalizeLayout(raw.layout, customSections);
  return {
    ...raw,
    config: {
      ...raw.config,
      locale: normalizeLocale(raw.config?.locale),
      template: normalizeResumeTemplate(raw.config?.template),
      section_names: raw.config?.section_names ?? {},
      tech_label: raw.config?.tech_label ?? 'Tecnologias',
    },
    layout,
    target_keywords: raw.target_keywords ?? [],
    soft_skills: raw.soft_skills ?? [],
    experience: raw.experience ?? [],
    projects: raw.projects ?? [],
    education: raw.education ?? [],
    languages: raw.languages ?? [],
    certifications: raw.certifications ?? [],
    custom_sections: customSections,
  };
}

export function isResumeTemplate(value: unknown): value is ResumeTemplate {
  return typeof value === 'string' && RESUME_TEMPLATE_IDS.includes(value as ResumeTemplate);
}

export function normalizeResumeTemplate(value: unknown): ResumeTemplate {
  return isResumeTemplate(value) ? value : DEFAULT_RESUME_TEMPLATE;
}

export function profileTemplate(profile: ResumeProfile): ResumeTemplate {
  return normalizeResumeTemplate(profile.config?.template);
}

export function applyResumeTemplate(
  profile: ResumeProfile,
  template: ResumeTemplate,
): ResumeProfile {
  if (profileTemplate(profile) === template && profile.config.template === template) return profile;
  return {
    ...profile,
    config: {
      ...profile.config,
      template,
    },
  };
}

export function moveSection(profile: ResumeProfile, sectionId: string, direction: -1 | 1): ResumeProfile {
  const order = [...profile.layout.section_order];
  const index = order.indexOf(sectionId);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= order.length) return profile;
  [order[index], order[target]] = [order[target], order[index]];
  return { ...profile, layout: { ...profile.layout, section_order: order } };
}

export function toggleSectionVisibility(profile: ResumeProfile, sectionId: string): ResumeProfile {
  const hidden = new Set(profile.layout.hidden_sections);
  if (hidden.has(sectionId)) hidden.delete(sectionId);
  else hidden.add(sectionId);
  return { ...profile, layout: { ...profile.layout, hidden_sections: [...hidden] } };
}

export function addCustomSection(
  profile: ResumeProfile,
  kind: CustomSectionKind,
  title: string,
): ResumeProfile {
  const id = createSectionId(title, profile.custom_sections);
  const section: CustomSection = { id, title: title.trim(), kind, items: [] };
  return {
    ...profile,
    custom_sections: [...profile.custom_sections, section],
    layout: {
      ...profile.layout,
      section_order: [...profile.layout.section_order, `custom:${id}`],
    },
  };
}

export function removeCustomSection(profile: ResumeProfile, sectionId: string): ResumeProfile {
  return {
    ...profile,
    custom_sections: profile.custom_sections.filter((item) => item.id !== sectionId),
    layout: {
      ...profile.layout,
      section_order: profile.layout.section_order.filter((item) => item !== `custom:${sectionId}`),
      hidden_sections: profile.layout.hidden_sections.filter((item) => item !== `custom:${sectionId}`),
    },
  };
}

export function localizeProfile(profile: ResumeProfile, locale: ResumeLocale): ResumeProfile {
  const labels = localizedLabels(locale);
  const levelMap = localeLevels(locale);
  return {
    ...profile,
    config: {
      ...profile.config,
      locale,
      tech_label: labels.tech,
      section_names: {
        ...profile.config.section_names,
        ...labels.sections,
      },
    },
    languages: profile.languages.map((item) => ({
      ...item,
      level: levelMap[normalizeText(item.level)] ?? item.level,
    })),
  };
}

export function sectionLabel(profile: ResumeProfile, sectionId: string): string {
  if (sectionId.startsWith('custom:')) {
    const id = sectionId.slice('custom:'.length);
    return profile.custom_sections.find((item) => item.id === id)?.title ?? 'Seção personalizada';
  }
  return profile.config.section_names[sectionId] || SECTION_LABELS[sectionId] || sectionId;
}

function normalizeLayout(
  layout: ResumeLayoutConfig | undefined,
  customSections: CustomSection[],
): ResumeLayoutConfig {
  const fallback = createDefaultLayout();
  const validCustomIds = new Set(customSections.map((item) => `custom:${item.id}`));
  const incoming = Array.isArray(layout?.section_order) ? layout.section_order : [];
  const order = Array.from(new Set([
    ...incoming.filter((item) => DEFAULT_SECTION_ORDER.includes(item as typeof DEFAULT_SECTION_ORDER[number]) || validCustomIds.has(item)),
    ...DEFAULT_SECTION_ORDER,
    ...validCustomIds,
  ]));
  return {
    ...fallback,
    ...layout,
    section_order: order,
    hidden_sections: Array.isArray(layout?.hidden_sections) ? [...new Set(layout.hidden_sections)] : [],
    skill_levels: layout?.skill_levels ?? {},
  };
}

function normalizeLocale(value: unknown): ResumeLocale {
  if (value === 'en-US' || value === 'es-ES') return value;
  return 'pt-BR';
}

function createSectionId(title: string, existing: CustomSection[]): string {
  const base = normalizeText(title).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'secao';
  const used = new Set(existing.map((item) => item.id));
  if (!used.has(base)) return base;
  let suffix = 2;
  while (used.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

function normalizeText(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function localizedLabels(locale: ResumeLocale) {
  if (locale === 'en-US') {
    return {
      tech: 'Technologies',
      sections: {
        summary: 'Professional Summary', skills: 'Technical Skills', soft_skills: 'Core Strengths',
        experience: 'Professional Experience', projects: 'Projects', education: 'Education',
        certifications: 'Certifications', languages: 'Languages',
      },
    };
  }
  if (locale === 'es-ES') {
    return {
      tech: 'Tecnologías',
      sections: {
        summary: 'Perfil Profesional', skills: 'Competencias Técnicas', soft_skills: 'Fortalezas',
        experience: 'Experiencia Profesional', projects: 'Proyectos', education: 'Formación Académica',
        certifications: 'Certificaciones', languages: 'Idiomas',
      },
    };
  }
  return {
    tech: 'Tecnologias',
    sections: {
      summary: 'Resumo Profissional', skills: 'Competências Técnicas', soft_skills: 'Competências Comportamentais',
      experience: 'Experiência Profissional', projects: 'Projetos', education: 'Formação Acadêmica',
      certifications: 'Certificações', languages: 'Idiomas',
    },
  };
}

function localeLevels(locale: ResumeLocale): Record<string, string> {
  if (locale === 'en-US') return { avancado: 'Advanced', intermediario: 'Intermediate', basico: 'Basic', nativo: 'Native' };
  if (locale === 'es-ES') return { advanced: 'Avanzado', intermediate: 'Intermedio', basic: 'Básico', native: 'Nativo' };
  return { advanced: 'Avançado', intermediate: 'Intermediário', basic: 'Básico', native: 'Nativo' };
}
