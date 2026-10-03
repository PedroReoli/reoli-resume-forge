import { sectionLabel } from '../../domain/resumeLayout';
import type { Experience, Project, ResumeProfile } from '../../types/resume';
import { InlineEditable } from '../common/InlineEditable';

interface ResumeSectionRendererProps {
  profile: ResumeProfile;
  sectionId: string;
  onProfile: (profile: ResumeProfile) => void;
}

export function ResumeSectionRenderer({ profile, sectionId, onProfile }: ResumeSectionRendererProps) {
  if (profile.layout.hidden_sections.includes(sectionId)) return null;

  if (sectionId === 'summary') {
    return (
      <ResumeSection title={sectionLabel(profile, sectionId)} sectionId={sectionId}>
        <InlineEditable multiline label="Resumo profissional" value={profile.summary} onChange={(summary) => onProfile({ ...profile, summary })} className="resume-paragraph" />
      </ResumeSection>
    );
  }

  if (sectionId === 'skills') return <SkillsSection profile={profile} onProfile={onProfile} />;

  if (sectionId === 'soft_skills') {
    if (!profile.soft_skills.length) return null;
    return (
      <ResumeSection title={sectionLabel(profile, sectionId)} sectionId={sectionId}>
        <div className="soft-skill-list">{profile.soft_skills.map((skill) => <span key={skill}>{skill}</span>)}</div>
      </ResumeSection>
    );
  }

  if (sectionId === 'experience') return <ExperienceSection profile={profile} onProfile={onProfile} />;
  if (sectionId === 'projects') return <ProjectsSection profile={profile} onProfile={onProfile} />;

  if (sectionId === 'education') {
    if (!profile.education.length) return null;
    return (
      <ResumeSection title={sectionLabel(profile, sectionId)} sectionId={sectionId}>
        <div className="education-list">
          {profile.education.map((item, index) => (
            <p className="education-line" key={`${item.degree}-${index}`}>
              <InlineEditable label="Curso" value={item.degree} onChange={(degree) => updateCollection(profile, onProfile, 'education', index, { degree })} />
              <span> | </span>
              <InlineEditable label="Instituição" value={item.institution} onChange={(institution) => updateCollection(profile, onProfile, 'education', index, { institution })} />
              <span> | </span>
              <InlineEditable label="Período da formação" value={item.dates} onChange={(dates) => updateCollection(profile, onProfile, 'education', index, { dates })} />
            </p>
          ))}
        </div>
      </ResumeSection>
    );
  }

  if (sectionId === 'certifications') {
    if (!profile.certifications.length) return null;
    return (
      <ResumeSection title={sectionLabel(profile, sectionId)} sectionId={sectionId}>
        <ul className="simple-resume-list">
          {profile.certifications.map((item, index) => <li key={`${item.name}-${index}`}>{[item.name, item.issuer, item.date].filter(Boolean).join(' | ')}</li>)}
        </ul>
      </ResumeSection>
    );
  }

  if (sectionId === 'languages') {
    if (!profile.languages.length) return null;
    return (
      <ResumeSection title={sectionLabel(profile, sectionId)} sectionId={sectionId}>
        <ul className="simple-resume-list inline-list">
          {profile.languages.map((item) => <li key={`${item.language}-${item.level}`}>{item.language}: {item.level}</li>)}
        </ul>
      </ResumeSection>
    );
  }

  if (sectionId.startsWith('custom:')) {
    const id = sectionId.slice('custom:'.length);
    const section = profile.custom_sections.find((item) => item.id === id);
    if (!section?.items.length) return null;
    return (
      <ResumeSection title={section.title} sectionId={sectionId}>
        <ul className="simple-resume-list custom-resume-list">
          {section.items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
        </ul>
      </ResumeSection>
    );
  }

  return null;
}

function SkillsSection({ profile, onProfile }: { profile: ResumeProfile; onProfile: (profile: ResumeProfile) => void }) {
  const groups = Object.entries(profile.skills).map(([group, raw]) => ({
    group,
    values: Array.isArray(raw) ? raw.filter((item): item is string => typeof item === 'string') : [],
  }));
  const update = (group: string, next: string) => onProfile({
    ...profile,
    skills: { ...profile.skills, [group]: splitSkillValues(next) },
  });

  return (
    <ResumeSection title={sectionLabel(profile, 'skills')} sectionId="skills">
      {profile.layout.skills_style === 'table' ? (
        <table className="resume-skill-table">
          <caption className="visually-hidden">Competências técnicas por categoria</caption>
          <tbody>{groups.map(({ group, values }) => <tr key={group}><th scope="row">{group}</th><td>{values.join(' · ')}</td></tr>)}</tbody>
        </table>
      ) : null}
      {profile.layout.skills_style === 'tags' ? (
        <div className="resume-skill-tags">{groups.flatMap(({ values }) => values).map((skill) => <span key={skill}>{skill}</span>)}</div>
      ) : null}
      {profile.layout.skills_style === 'levels' ? (
        <div className="resume-skill-levels">
          {groups.flatMap(({ values }) => values).map((skill) => {
            const level = profile.layout.skill_levels[skill] ?? 0;
            return <div className="skill-level" key={skill} aria-label={`${skill}: nível ${level} de 5`}><span>{skill}</span><i><b style={{ width: `${level * 20}%` }} /></i><small>{level}/5</small></div>;
          })}
        </div>
      ) : null}
      {profile.layout.skills_style === 'categorized' ? (
        <div className="resume-skills">
          {groups.map(({ group, values }) => (
            <p key={group}>
              <strong>{group}:</strong>
              <InlineEditable label={`Competências: ${group}`} value={values.join(', ')} onChange={(next) => update(group, next)} />
            </p>
          ))}
        </div>
      ) : null}
    </ResumeSection>
  );
}

function ExperienceSection({ profile, onProfile }: { profile: ResumeProfile; onProfile: (profile: ResumeProfile) => void }) {
  const update = (index: number, patch: Partial<Experience>) => onProfile({
    ...profile,
    experience: profile.experience.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item),
  });
  return (
    <ResumeSection title={sectionLabel(profile, 'experience')} sectionId="experience">
      <div className="resume-records">
        {profile.experience.map((item, index) => {
          const bullets = profile.layout.experience_style === 'metrics' ? metricsFirst(item.bullets) : item.bullets;
          return (
            <section className="resume-record" key={`${item.company}-${index}`}>
              <div className="resume-record-heading">
                <div>
                  <InlineEditable label="Empresa" value={item.company} onChange={(company) => update(index, { company })} className="resume-company" />
                  <InlineEditable label="Cargo" value={item.role} onChange={(role) => update(index, { role })} className="resume-role" />
                </div>
                <div className="resume-date">
                  <InlineEditable label="Período" value={item.dates} onChange={(dates) => update(index, { dates })} />
                  {[item.location, item.work_mode].filter(Boolean).map((value) => <span key={value}> | {value}</span>)}
                </div>
              </div>
              <InlineEditable multiline label="Contexto da experiência" value={item.summary} onChange={(summary) => update(index, { summary })} className="resume-paragraph" />
              {profile.layout.experience_style === 'paragraphs' ? (
                <InlineEditable multiline label="Resultados da experiência" value={bullets.join(' ')} onChange={(value) => update(index, { bullets: splitSentences(value) })} className="resume-paragraph resume-results-paragraph" />
              ) : (
                <ul className="resume-bullet-list">{bullets.map((bullet, bulletIndex) => <li className={hasMetric(bullet) ? 'has-metric' : ''} key={`${bullet}-${bulletIndex}`}>{bullet}</li>)}</ul>
              )}
              {item.technologies.length ? <p className="resume-tech"><strong>{profile.config.tech_label || 'Tecnologias'}:</strong> {item.technologies.join(', ')}</p> : null}
            </section>
          );
        })}
      </div>
    </ResumeSection>
  );
}

function ProjectsSection({ profile, onProfile }: { profile: ResumeProfile; onProfile: (profile: ResumeProfile) => void }) {
  if (!profile.projects.length) return null;
  const update = (index: number, patch: Partial<Project>) => onProfile({
    ...profile,
    projects: profile.projects.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item),
  });
  return (
    <ResumeSection title={sectionLabel(profile, 'projects')} sectionId="projects">
      <div className="resume-project-grid">
        {profile.projects.map((project, index) => {
          const metrics = profile.layout.projects_style === 'metrics' ? metricsFirst(project.metrics) : project.metrics;
          return (
            <div className="resume-record project-record" key={`${project.name}-${index}`}>
              <InlineEditable label="Nome do projeto" value={project.name} onChange={(name) => update(index, { name })} className="resume-company" />
              <InlineEditable multiline label="Descrição do projeto" value={project.description} onChange={(description) => update(index, { description })} className="resume-paragraph" />
              {profile.layout.projects_style === 'paragraphs' ? (
                <InlineEditable multiline label="Resultados do projeto" value={metrics.join(' ')} onChange={(value) => update(index, { metrics: splitSentences(value) })} className="resume-paragraph resume-results-paragraph" />
              ) : metrics.length ? (
                <ul className="resume-bullet-list">{metrics.map((metric) => <li className={hasMetric(metric) ? 'has-metric' : ''} key={metric}>{metric}</li>)}</ul>
              ) : null}
              {project.technologies.length ? <p className="resume-tech">{project.technologies.join(' · ')}</p> : null}
            </div>
          );
        })}
      </div>
    </ResumeSection>
  );
}

function ResumeSection({ title, sectionId, children }: { title: string; sectionId: string; children: React.ReactNode }) {
  return <section className="resume-section" data-section={sectionId}><h2>{title}</h2>{children}</section>;
}

function updateCollection<K extends 'education'>(profile: ResumeProfile, onProfile: (profile: ResumeProfile) => void, key: K, index: number, patch: Partial<ResumeProfile[K][number]>) {
  onProfile({ ...profile, [key]: profile[key].map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) });
}

function metricsFirst(values: string[]): string[] {
  return [...values.filter(hasMetric), ...values.filter((value) => !hasMetric(value))];
}

function hasMetric(value: string): boolean {
  return /\b\d+(?:[.,]\d+)?\s*(?:%|x|k|m|h|ms|anos?|meses?|dias?)?\b/i.test(value);
}

function splitSentences(value: string): string[] {
  return value.split(/(?<=[.!?])\s+/).map((item) => item.trim()).filter(Boolean);
}

function splitSkillValues(value: string): string[] {
  return value.split(/\s*(?:·|;|\n|,(?=\s))\s*/).map((item) => item.trim()).filter(Boolean);
}
