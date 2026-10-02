import type { ResumeProfile, ResumeTemplate } from '../../types/resume';
import { InlineEditable } from '../common/InlineEditable';

interface ResumePreviewProps {
  profile: ResumeProfile;
  template: ResumeTemplate;
  onProfile: (profile: ResumeProfile) => void;
}

export function ResumePreview({ profile, template, onProfile }: ResumePreviewProps) {
  const updatePerson = (key: keyof ResumeProfile['person'], value: string) => {
    onProfile({ ...profile, person: { ...profile.person, [key]: value } });
  };
  const updateExperience = (index: number, key: string, value: string) => {
    const experience = profile.experience.map((item, itemIndex) => {
      if (index !== itemIndex) return item;
      if (key === 'bullets') return { ...item, bullets: splitLines(value) };
      if (key === 'technologies') return { ...item, technologies: splitList(value) };
      return { ...item, [key]: value };
    });
    onProfile({ ...profile, experience });
  };

  return (
    <article className={`resume-sheet template-${template}`} aria-label="Pré-visualização A4 editável">
      <header className="resume-header">
        <div className="resume-identity">
          <InlineEditable label="Nome" value={profile.person.name} onChange={(value) => updatePerson('name', value)} className="resume-name" />
          <InlineEditable label="Headline" value={profile.headline} onChange={(headline) => onProfile({ ...profile, headline })} className="resume-headline" />
        </div>
        <div className="resume-contact">
          <InlineEditable label="E-mail" value={profile.person.email} onChange={(value) => updatePerson('email', value)} />
          <InlineEditable label="Telefone" value={profile.person.phone} onChange={(value) => updatePerson('phone', value)} />
          <InlineEditable label="Localização" value={profile.person.location} onChange={(value) => updatePerson('location', value)} />
          <InlineEditable label="LinkedIn" value={profile.person.linkedin} onChange={(value) => updatePerson('linkedin', value)} />
          <InlineEditable label="Portfólio" value={profile.person.portfolio} onChange={(value) => updatePerson('portfolio', value)} />
        </div>
      </header>

      <ResumeSection title={section(profile, 'summary', 'Resumo Profissional')}>
        <InlineEditable multiline label="Resumo profissional" value={profile.summary} onChange={(summary) => onProfile({ ...profile, summary })} className="resume-paragraph" />
      </ResumeSection>

      <ResumeSection title={section(profile, 'skills', 'Competências Técnicas')}>
        <div className="resume-skills">
          {Object.entries(profile.skills).map(([group, raw]) => {
            const value = Array.isArray(raw) ? raw.filter((item): item is string => typeof item === 'string').join(' · ') : String(raw ?? '');
            return (
              <p key={group}>
                <strong>{group}</strong>
                <InlineEditable
                  label={`Competências: ${group}`}
                  value={value}
                  onChange={(next) => onProfile({
                    ...profile,
                    skills: { ...profile.skills, [group]: next.split('·').map((item) => item.trim()).filter(Boolean) },
                  })}
                />
              </p>
            );
          })}
        </div>
      </ResumeSection>

      <ResumeSection title={section(profile, 'experience', 'Experiência Profissional')}>
        <div className="resume-records">
          {profile.experience.map((item, index) => (
            <section className="resume-record" key={`${item.company}-${index}`}>
              <div className="resume-record-heading">
                <div>
                  <InlineEditable label="Empresa" value={item.company} onChange={(value) => updateExperience(index, 'company', value)} className="resume-company" />
                  <InlineEditable label="Cargo" value={item.role} onChange={(value) => updateExperience(index, 'role', value)} className="resume-role" />
                </div>
                <InlineEditable label="Período" value={item.dates} onChange={(value) => updateExperience(index, 'dates', value)} className="resume-date" />
              </div>
              <InlineEditable multiline label="Contexto da experiência" value={item.summary} onChange={(value) => updateExperience(index, 'summary', value)} className="resume-paragraph" />
              {item.bullets.length ? (
                <InlineEditable multiline label="Resultados da experiência" value={item.bullets.join('\n')} onChange={(value) => updateExperience(index, 'bullets', value)} className="resume-bullets" />
              ) : null}
              {item.technologies.length ? (
                <p className="resume-tech"><strong>{profile.config.tech_label || 'Tecnologias'}:</strong> <InlineEditable label="Tecnologias" value={item.technologies.join(', ')} onChange={(value) => updateExperience(index, 'technologies', value)} /></p>
              ) : null}
            </section>
          ))}
        </div>
      </ResumeSection>

      {profile.projects.length ? (
        <ResumeSection title="Projetos">
          {profile.projects.map((project, index) => (
            <div className="resume-record project-record" key={`${project.name}-${index}`}>
              <InlineEditable label="Nome do projeto" value={project.name} onChange={(name) => updateProject(profile, onProfile, index, { name })} className="resume-company" />
              <InlineEditable multiline label="Descrição do projeto" value={project.description} onChange={(description) => updateProject(profile, onProfile, index, { description })} className="resume-paragraph" />
            </div>
          ))}
        </ResumeSection>
      ) : null}

      <ResumeSection title={section(profile, 'education', 'Formação Acadêmica')}>
        {profile.education.map((item, index) => (
          <p className="education-line" key={`${item.degree}-${index}`}>
            <InlineEditable label="Curso" value={item.degree} onChange={(degree) => updateEducation(profile, onProfile, index, { degree })} />
            <span> · </span>
            <InlineEditable label="Instituição" value={item.institution} onChange={(institution) => updateEducation(profile, onProfile, index, { institution })} />
            <span> · </span>
            <InlineEditable label="Período da formação" value={item.dates} onChange={(dates) => updateEducation(profile, onProfile, index, { dates })} />
          </p>
        ))}
      </ResumeSection>

      <div className="resume-tail">
        {profile.languages.length ? <span><strong>{section(profile, 'languages', 'Idiomas')}:</strong> {profile.languages.map((item) => `${item.language} — ${item.level}`).join(' · ')}</span> : null}
        {profile.certifications.length ? <span><strong>{section(profile, 'certifications', 'Certificações')}:</strong> {profile.certifications.map((item) => item.name).join(' · ')}</span> : null}
      </div>
    </article>
  );
}

function ResumeSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="resume-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function section(profile: ResumeProfile, key: string, fallback: string): string {
  return profile.config.section_names[key] || fallback;
}

function splitLines(value: string): string[] {
  return value.split('\n').map((item) => item.trim().replace(/^[-•]\s*/, '')).filter(Boolean);
}

function splitList(value: string): string[] {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function updateProject(
  profile: ResumeProfile,
  onProfile: (profile: ResumeProfile) => void,
  index: number,
  patch: Partial<ResumeProfile['projects'][number]>,
) {
  onProfile({ ...profile, projects: profile.projects.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) });
}

function updateEducation(
  profile: ResumeProfile,
  onProfile: (profile: ResumeProfile) => void,
  index: number,
  patch: Partial<ResumeProfile['education'][number]>,
) {
  onProfile({ ...profile, education: profile.education.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) });
}
