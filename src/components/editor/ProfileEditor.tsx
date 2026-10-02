import { Focus, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { removeCustomSection } from '../../domain/resumeLayout';
import type { Certification, Education, Experience, Language, Project, ResumeProfile } from '../../types/resume';
import { SectionHeading } from '../common/SectionHeading';
import { FocusedEditorModal, type FocusedEditorConfig } from './FocusedEditorModal';
import { LayoutControls } from './LayoutControls';
import { editorSectionId } from './SectionNavigator';

interface ProfileEditorProps {
  profile: ResumeProfile;
  jobDescription: string;
  keywordSuggestions?: string[];
  onProfile: (profile: ResumeProfile) => void;
  onJobDescription: (value: string) => void;
}

export function ProfileEditor({
  profile,
  jobDescription,
  keywordSuggestions = [],
  onProfile,
  onJobDescription,
}: ProfileEditorProps) {
  const [focusedEditor, setFocusedEditor] = useState<FocusedEditorConfig | null>(null);

  const updatePerson = (key: keyof ResumeProfile['person'], value: string) => {
    onProfile({ ...profile, person: { ...profile.person, [key]: value } });
  };
  const updateExperience = (index: number, patch: Partial<Experience>) => {
    const experience = profile.experience.map((item, itemIndex) =>
      itemIndex === index ? { ...item, ...patch } : item,
    );
    onProfile({ ...profile, experience });
  };
  const updateProject = (index: number, patch: Partial<Project>) => {
    onProfile({
      ...profile,
      projects: profile.projects.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item),
    });
  };
  const updateEducation = (index: number, patch: Partial<Education>) => {
    onProfile({
      ...profile,
      education: profile.education.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item),
    });
  };
  const updateCertification = (index: number, patch: Partial<Certification>) => {
    onProfile({
      ...profile,
      certifications: profile.certifications.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item),
    });
  };
  const updateLanguage = (index: number, patch: Partial<Language>) => {
    onProfile({
      ...profile,
      languages: profile.languages.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item),
    });
  };
  const openFocus = (config: FocusedEditorConfig) => setFocusedEditor(config);

  return (
    <div className="profile-editor">
      <LayoutControls profile={profile} onProfile={onProfile} />

      <section className="editor-section" id="editor-identity">
        <SectionHeading
          title="Identidade"
          hint="Dados exibidos no cabeçalho"
          action={<FocusButton label="Editar headline em foco" onClick={() => openFocus({
            title: 'Headline profissional',
            hint: 'Posicionamento direto, área e diferenciais comprováveis.',
            value: profile.headline,
            multiline: false,
            suggestions: keywordSuggestions,
            onSave: (headline) => onProfile({ ...profile, headline }),
          })} />}
        />
        <div className="form-grid two-columns">
          <Field label="Nome" value={profile.person.name} onChange={(value) => updatePerson('name', value)} />
          <Field label="E-mail" value={profile.person.email} onChange={(value) => updatePerson('email', value)} />
          <Field label="Telefone" value={profile.person.phone} onChange={(value) => updatePerson('phone', value)} />
          <Field label="Localização" value={profile.person.location} onChange={(value) => updatePerson('location', value)} />
          <Field label="LinkedIn" value={profile.person.linkedin} onChange={(value) => updatePerson('linkedin', value)} />
          <Field label="Portfólio" value={profile.person.portfolio} onChange={(value) => updatePerson('portfolio', value)} />
          <Field label="GitHub" value={profile.person.github} onChange={(value) => updatePerson('github', value)} />
          <Field label="Preferência de trabalho" value={profile.person.work_preference} onChange={(value) => updatePerson('work_preference', value)} />
        </div>
        <Field label="Headline" value={profile.headline} onChange={(headline) => onProfile({ ...profile, headline })} />
      </section>

      <section className="editor-section" id={editorSectionId('summary')}>
        <SectionHeading
          title="Resumo"
          hint="3–5 linhas, fatos e impacto"
          action={<FocusButton label="Editar resumo em foco" onClick={() => openFocus({
            title: 'Resumo profissional',
            hint: 'Identifique seu posicionamento, evidências e proposta de valor em poucas linhas.',
            value: profile.summary,
            suggestions: keywordSuggestions,
            onSave: (summary) => onProfile({ ...profile, summary }),
          })} />}
        />
        <TextArea label="Resumo profissional" value={profile.summary} rows={5} onChange={(summary) => onProfile({ ...profile, summary })} />
      </section>

      <section className="editor-section" id={editorSectionId('skills')}>
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
                  skills: { ...profile.skills, [group]: splitList(event.target.value) },
                })}
              />
            </div>
          );
        })}
      </section>

      <section className="editor-section" id={editorSectionId('soft_skills')}>
        <SectionHeading title="Pontos fortes" hint="Competências comportamentais sustentadas por exemplos" />
        <Field
          label="Competências comportamentais"
          value={profile.soft_skills.join(', ')}
          onChange={(value) => onProfile({ ...profile, soft_skills: splitList(value) })}
        />
      </section>

      <section className="editor-section" id={editorSectionId('experience')}>
        <SectionHeading
          title="Experiência"
          hint="Verbo + contexto + resultado comprovável"
          action={<IconButton label="Adicionar experiência" onClick={() => onProfile({ ...profile, experience: [...profile.experience, emptyExperience()] })} />}
        />
        {profile.experience.map((item, index) => (
          <div className="record-block" key={`${item.company}-${index}`}>
            <div className="record-index">{String(index + 1).padStart(2, '0')}</div>
            <div className="record-focus-actions">
              <FocusButton label="Editar contexto em foco" onClick={() => openFocus({
                title: `${item.role || 'Experiência'} — contexto`,
                hint: 'Explique escopo, produto, equipe e responsabilidade sem repetir os resultados.',
                value: item.summary,
                suggestions: keywordSuggestions,
                onSave: (summary) => updateExperience(index, { summary }),
              })} />
              <FocusButton label="Editar resultados em foco" onClick={() => openFocus({
                title: `${item.role || 'Experiência'} — resultados`,
                hint: 'Uma evidência por linha. Quantifique somente métricas que você pode comprovar.',
                value: item.bullets.join('\n'),
                suggestions: keywordSuggestions,
                onSave: (value) => updateExperience(index, { bullets: splitLines(value) }),
              })} />
            </div>
            <div className="form-grid two-columns">
              <Field label="Empresa" value={item.company} onChange={(company) => updateExperience(index, { company })} />
              <Field label="Cargo" value={item.role} onChange={(role) => updateExperience(index, { role })} />
              <Field label="Período" value={item.dates} onChange={(dates) => updateExperience(index, { dates })} />
              <Field label="Local" value={item.location} onChange={(location) => updateExperience(index, { location })} />
              <Field label="Regime" value={item.work_mode} onChange={(work_mode) => updateExperience(index, { work_mode })} />
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

      <section className="editor-section" id={editorSectionId('projects')}>
        <SectionHeading
          title="Projetos"
          hint="Nome, descrição, métricas e tecnologias"
          action={<IconButton label="Adicionar projeto" onClick={() => onProfile({ ...profile, projects: [...profile.projects, emptyProject()] })} />}
        />
        {profile.projects.map((item, index) => (
          <div className="record-block" key={`${item.name}-${index}`}>
            <div className="record-index">P{String(index + 1).padStart(2, '0')}</div>
            <div className="record-focus-actions">
              <FocusButton label="Editar métricas em foco" onClick={() => openFocus({
                title: `${item.name || 'Projeto'} — resultados`,
                hint: 'Destaque resultados verificáveis. Nunca invente números para completar o formato.',
                value: item.metrics.join('\n'),
                suggestions: keywordSuggestions,
                onSave: (value) => updateProject(index, { metrics: splitLines(value) }),
              })} />
            </div>
            <Field label="Nome do projeto" value={item.name} onChange={(name) => updateProject(index, { name })} />
            <TextArea label="Descrição" value={item.description} rows={3} onChange={(description) => updateProject(index, { description })} />
            <TextArea label="Métricas (uma linha por item)" value={item.metrics.join('\n')} rows={4} onChange={(value) => updateProject(index, { metrics: splitLines(value) })} />
            <Field label="Tecnologias" value={item.technologies.join(', ')} onChange={(value) => updateProject(index, { technologies: splitList(value) })} />
            <button className="remove-button" type="button" onClick={() => onProfile({ ...profile, projects: profile.projects.filter((_, itemIndex) => itemIndex !== index) })}>
              <Trash2 size={14} /> Remover projeto
            </button>
          </div>
        ))}
        {!profile.projects.length ? <p className="empty-hint">Nenhum projeto adicionado. Use o botão + para criar um bloco.</p> : null}
      </section>

      <section className="editor-section" id={editorSectionId('education')}>
        <SectionHeading
          title="Formação"
          hint="Curso, instituição e período em campos independentes"
          action={<IconButton label="Adicionar formação" onClick={() => onProfile({ ...profile, education: [...profile.education, emptyEducation()] })} />}
        />
        {profile.education.map((item, index) => (
          <div className="record-block compact-record" key={`${item.degree}-${index}`}>
            <div className="record-index">F{String(index + 1).padStart(2, '0')}</div>
            <Field label="Curso ou grau" value={item.degree} onChange={(degree) => updateEducation(index, { degree })} />
            <div className="form-grid two-columns record-meta-grid">
              <Field label="Instituição" value={item.institution} onChange={(institution) => updateEducation(index, { institution })} />
              <Field label="Período" value={item.dates} onChange={(dates) => updateEducation(index, { dates })} />
            </div>
            <button className="remove-button" type="button" onClick={() => onProfile({ ...profile, education: profile.education.filter((_, itemIndex) => itemIndex !== index) })}>
              <Trash2 size={14} /> Remover formação
            </button>
          </div>
        ))}
        {!profile.education.length ? <p className="empty-hint">Nenhuma formação adicionada.</p> : null}
      </section>

      <section className="editor-section" id={editorSectionId('certifications')}>
        <SectionHeading
          title="Certificações"
          hint="Credencial, organização emissora e data"
          action={<IconButton label="Adicionar certificação" onClick={() => onProfile({ ...profile, certifications: [...profile.certifications, emptyCertification()] })} />}
        />
        {profile.certifications.map((item, index) => (
          <div className="record-block compact-record" key={`${item.name}-${index}`}>
            <div className="record-index">C{String(index + 1).padStart(2, '0')}</div>
            <Field label="Certificação" value={item.name} onChange={(name) => updateCertification(index, { name })} />
            <div className="form-grid two-columns record-meta-grid">
              <Field label="Organização emissora" value={item.issuer} onChange={(issuer) => updateCertification(index, { issuer })} />
              <Field label="Data" value={item.date} onChange={(date) => updateCertification(index, { date })} />
            </div>
            <button className="remove-button" type="button" onClick={() => onProfile({ ...profile, certifications: profile.certifications.filter((_, itemIndex) => itemIndex !== index) })}>
              <Trash2 size={14} /> Remover certificação
            </button>
          </div>
        ))}
        {!profile.certifications.length ? <p className="empty-hint">Nenhuma certificação adicionada.</p> : null}
      </section>

      <section className="editor-section" id={editorSectionId('languages')}>
        <SectionHeading
          title="Idiomas"
          hint="Informe somente o nível que consegue sustentar"
          action={<IconButton label="Adicionar idioma" onClick={() => onProfile({ ...profile, languages: [...profile.languages, emptyLanguage()] })} />}
        />
        {profile.languages.map((item, index) => (
          <div className="record-block compact-record language-record" key={`${item.language}-${index}`}>
            <div className="record-index">I{String(index + 1).padStart(2, '0')}</div>
            <div className="form-grid two-columns">
              <Field label="Idioma" value={item.language} onChange={(language) => updateLanguage(index, { language })} />
              <Field label="Nível real" value={item.level} onChange={(level) => updateLanguage(index, { level })} />
            </div>
            <button className="remove-button" type="button" onClick={() => onProfile({ ...profile, languages: profile.languages.filter((_, itemIndex) => itemIndex !== index) })}>
              <Trash2 size={14} /> Remover idioma
            </button>
          </div>
        ))}
        {!profile.languages.length ? <p className="empty-hint">Nenhum idioma adicionado.</p> : null}
      </section>

      {profile.custom_sections.map((section) => (
        <section className="editor-section" id={editorSectionId(`custom:${section.id}`)} key={section.id}>
          <SectionHeading
            title={section.title}
            hint="Uma entrada por linha"
            action={<button className="remove-button" type="button" onClick={() => {
              if (window.confirm(`Remover a seção “${section.title}”?`)) onProfile(removeCustomSection(profile, section.id));
            }}><Trash2 size={13} /> Remover</button>}
          />
          <TextArea
            label="Conteúdo"
            value={section.items.join('\n')}
            rows={5}
            onChange={(value) => onProfile({
              ...profile,
              custom_sections: profile.custom_sections.map((item) => item.id === section.id ? { ...item, items: splitLines(value) } : item),
            })}
          />
        </section>
      ))}

      <section className="editor-section job-section" id="editor-job">
        <SectionHeading title="Descrição da vaga" hint="Cole o anúncio completo; nada sai deste computador" />
        <TextArea
          label="Descrição completa da vaga"
          value={jobDescription}
          rows={9}
          placeholder="Cole aqui os requisitos, responsabilidades e diferenciais da oportunidade…"
          onChange={onJobDescription}
        />
      </section>

      <FocusedEditorModal config={focusedEditor} onClose={() => setFocusedEditor(null)} />
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="field"><span>{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function TextArea({ label, value, rows, placeholder, onChange }: { label: string; value: string; rows: number; placeholder?: string; onChange: (value: string) => void }) {
  return <label className="field"><span>{label}</span><textarea value={value} rows={rows} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /></label>;
}

function IconButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button className="icon-button" type="button" aria-label={label} title={label} onClick={onClick}><Plus size={17} /></button>;
}

function FocusButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button className="focus-button" type="button" title={label} onClick={onClick}><Focus size={14} /><span>{label}</span></button>;
}

function splitList(value: string): string[] {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function splitLines(value: string): string[] {
  return value.split('\n').map((item) => item.trim().replace(/^[-•]\s*/, '')).filter(Boolean);
}

function emptyExperience(): Experience {
  return { company: 'Empresa', role: 'Cargo', dates: '', location: '', work_mode: '', summary: '', bullets: [], technologies: [] };
}

function emptyProject(): Project {
  return { name: 'Novo projeto', description: '', metrics: [], technologies: [] };
}

function emptyEducation(): Education {
  return { degree: '', institution: '', dates: '' };
}

function emptyCertification(): Certification {
  return { name: '', issuer: '', date: '' };
}

function emptyLanguage(): Language {
  return { language: '', level: '' };
}
