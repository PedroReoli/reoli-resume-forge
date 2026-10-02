import { Plus, Trash2 } from 'lucide-react';
import type { Experience, ResumeProfile } from '../../types/resume';
import { SectionHeading } from '../common/SectionHeading';

interface ProfileEditorProps {
  profile: ResumeProfile;
  jobDescription: string;
  onProfile: (profile: ResumeProfile) => void;
  onJobDescription: (value: string) => void;
}

export function ProfileEditor({ profile, jobDescription, onProfile, onJobDescription }: ProfileEditorProps) {
  const updatePerson = (key: keyof ResumeProfile['person'], value: string) => {
    onProfile({ ...profile, person: { ...profile.person, [key]: value } });
  };
  const updateExperience = (index: number, patch: Partial<Experience>) => {
    const experience = profile.experience.map((item, itemIndex) =>
      itemIndex === index ? { ...item, ...patch } : item,
    );
    onProfile({ ...profile, experience });
  };

  return (
    <div className="profile-editor">
      <section className="editor-section">
        <SectionHeading title="Identidade" hint="Dados exibidos no cabeçalho" />
        <div className="form-grid two-columns">
          <Field label="Nome" value={profile.person.name} onChange={(value) => updatePerson('name', value)} />
          <Field label="E-mail" value={profile.person.email} onChange={(value) => updatePerson('email', value)} />
          <Field label="Telefone" value={profile.person.phone} onChange={(value) => updatePerson('phone', value)} />
          <Field label="Localização" value={profile.person.location} onChange={(value) => updatePerson('location', value)} />
          <Field label="LinkedIn" value={profile.person.linkedin} onChange={(value) => updatePerson('linkedin', value)} />
          <Field label="Portfólio" value={profile.person.portfolio} onChange={(value) => updatePerson('portfolio', value)} />
        </div>
        <Field label="Headline" value={profile.headline} onChange={(headline) => onProfile({ ...profile, headline })} />
      </section>

      <section className="editor-section">
        <SectionHeading title="Resumo" hint="3–5 linhas, fatos e impacto" />
        <TextArea label="Resumo profissional" value={profile.summary} rows={5} onChange={(summary) => onProfile({ ...profile, summary })} />
      </section>

      <section className="editor-section">
        <SectionHeading title="Competências" hint="Separe os itens por vírgula" />
        {Object.entries(profile.skills).map(([group, raw]) => {
          const values = Array.isArray(raw) ? raw.filter((item): item is string => typeof item === 'string') : [];
          return (
            <div className="skill-group" key={group}>
              <label>{group}</label>
              <input
                value={values.join(', ')}
                onChange={(event) => onProfile({
                  ...profile,
                  skills: {
                    ...profile.skills,
                    [group]: splitList(event.target.value),
                  },
                })}
              />
            </div>
          );
        })}
        <Field
          label="Competências comportamentais"
          value={profile.soft_skills.join(', ')}
          onChange={(value) => onProfile({ ...profile, soft_skills: splitList(value) })}
        />
      </section>

      <section className="editor-section">
        <SectionHeading
          title="Experiência"
          hint="Responsabilidades objetivas e resultados mensuráveis"
          action={<IconButton label="Adicionar experiência" onClick={() => onProfile({ ...profile, experience: [...profile.experience, emptyExperience()] })} />}
        />
        {profile.experience.map((item, index) => (
          <div className="record-block" key={`${item.company}-${index}`}>
            <div className="record-index">{String(index + 1).padStart(2, '0')}</div>
            <div className="form-grid two-columns">
              <Field label="Empresa" value={item.company} onChange={(company) => updateExperience(index, { company })} />
              <Field label="Cargo" value={item.role} onChange={(role) => updateExperience(index, { role })} />
              <Field label="Período" value={item.dates} onChange={(dates) => updateExperience(index, { dates })} />
              <Field label="Local / regime" value={[item.location, item.work_mode].filter(Boolean).join(' | ')} onChange={(value) => updateExperience(index, { location: value, work_mode: '' })} />
            </div>
            <TextArea label="Contexto" value={item.summary} rows={3} onChange={(summary) => updateExperience(index, { summary })} />
            <TextArea label="Resultados (uma linha por item)" value={item.bullets.join('\n')} rows={5} onChange={(value) => updateExperience(index, { bullets: splitLines(value) })} />
            <Field label="Tecnologias" value={item.technologies.join(', ')} onChange={(value) => updateExperience(index, { technologies: splitList(value) })} />
            {profile.experience.length > 1 ? (
              <button className="remove-button" type="button" onClick={() => onProfile({ ...profile, experience: profile.experience.filter((_, itemIndex) => itemIndex !== index) })}>
                <Trash2 size={14} /> Remover experiência
              </button>
            ) : null}
          </div>
        ))}
      </section>

      <section className="editor-section">
        <SectionHeading title="Projetos e formação" hint="Um item por linha nos campos compostos" />
        <TextArea
          label="Projetos — Nome | Descrição | Tecnologias"
          value={profile.projects.map((item) => `${item.name} | ${item.description} | ${item.technologies.join(', ')}`).join('\n')}
          rows={4}
          onChange={(value) => onProfile({ ...profile, projects: parseProjects(value) })}
        />
        <TextArea
          label="Formação — Curso | Instituição | Período"
          value={profile.education.map((item) => `${item.degree} | ${item.institution} | ${item.dates}`).join('\n')}
          rows={3}
          onChange={(value) => onProfile({ ...profile, education: parseEducation(value) })}
        />
      </section>

      <section className="editor-section job-section">
        <SectionHeading title="Descrição da vaga" hint="Cole o anúncio completo; nada sai deste computador" />
        <TextArea
          label="Descrição completa da vaga"
          value={jobDescription}
          rows={9}
          placeholder="Cole aqui os requisitos, responsabilidades e diferenciais da oportunidade…"
          onChange={onJobDescription}
        />
      </section>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function TextArea({
  label,
  value,
  rows,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  rows: number;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea value={value} rows={rows} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function IconButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button className="icon-button" type="button" aria-label={label} title={label} onClick={onClick}><Plus size={17} /></button>;
}

function splitList(value: string): string[] {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function splitLines(value: string): string[] {
  return value.split('\n').map((item) => item.trim()).filter(Boolean);
}

function parseProjects(value: string): ResumeProfile['projects'] {
  return splitLines(value).map((line) => {
    const [name = '', description = '', technologies = ''] = line.split('|').map((item) => item.trim());
    return { name, description, metrics: [], technologies: splitList(technologies) };
  });
}

function parseEducation(value: string): ResumeProfile['education'] {
  return splitLines(value).map((line) => {
    const [degree = '', institution = '', dates = ''] = line.split('|').map((item) => item.trim());
    return { degree, institution, dates };
  });
}

function emptyExperience(): Experience {
  return { company: 'Empresa', role: 'Cargo', dates: '', location: '', work_mode: '', summary: '', bullets: [], technologies: [] };
}
