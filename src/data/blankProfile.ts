import type { ResumeProfile } from '../types/resume';
import { createDefaultLayout } from '../domain/resumeLayout';

export function createBlankProfile(locale = 'pt-BR'): ResumeProfile {
  const english = locale.startsWith('en');
  return {
    config: {
      locale: english ? 'en-US' : 'pt-BR',
      template: 'classic',
      tech_label: english ? 'Technologies' : 'Tecnologias',
      section_names: {
        summary: english ? 'Professional Summary' : 'Resumo Profissional',
        skills: english ? 'Technical Skills' : 'Competências Técnicas',
        soft_skills: english ? 'Core Strengths' : 'Competências Comportamentais',
        experience: english ? 'Professional Experience' : 'Experiência Profissional',
        education: english ? 'Education' : 'Formação Acadêmica',
        languages: english ? 'Languages' : 'Idiomas',
        certifications: english ? 'Certifications' : 'Certificações',
      },
    },
    layout: createDefaultLayout(),
    person: {
      name: english ? 'Your name' : 'Seu nome',
      location: '',
      work_preference: '',
      phone: '',
      email: '',
      linkedin: '',
      portfolio: '',
      github: '',
    },
    headline: english ? 'Professional headline' : 'Título profissional',
    summary: english
      ? 'Write a concise summary grounded in your real experience.'
      : 'Escreva um resumo conciso baseado na sua experiência real.',
    target_keywords: [],
    skills: { [english ? 'Core skills' : 'Competências principais']: [] },
    soft_skills: [],
    experience: [
      {
        company: english ? 'Company' : 'Empresa',
        role: english ? 'Role' : 'Cargo',
        dates: '',
        location: '',
        work_mode: '',
        summary: '',
        bullets: [],
        technologies: [],
      },
    ],
    projects: [],
    education: [],
    languages: [],
    certifications: [],
    custom_sections: [],
  };
}
