import { Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { insertRecord, moveRecord } from '../../domain/recordCollection';
import { removeCustomSection } from '../../domain/resumeLayout';
import type { Certification, Education, Experience, Language, Project, ResumeProfile } from '../../types/resume';
import { SectionHeading } from '../common/SectionHeading';
import { AddButton as IconButton, EditorField as Field, EditorTextArea as TextArea, FocusButton } from './EditorFields';
import { ExperienceEditorCard } from './ExperienceEditorCard';
import { FocusedEditorModal, type FocusedEditorConfig } from './FocusedEditorModal';
import { LayoutControls } from './LayoutControls';
import { ProjectEditorCard } from './ProjectEditorCard';
import { editorSectionId } from './SectionNavigator';
import { splitLines, splitList } from './editorText';

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
  const [expandedExperience, setExpandedExperience] = useState<number | null>(0);
  const [expandedProject, setExpandedProject] = useState<number | null>(profile.projects.length ? 0 : null);

  useEffect(() => {
    setExpandedExperience((current) => current !== null && current >= profile.experience.length
      ? (profile.experience.length ? 0 : null)
      : current);
    setExpandedProject((current) => current !== null && current >= profile.projects.length
      ? (profile.projects.length ? 0 : null)
      : current);
  }, [profile.experience.length, profile.projects.length]);

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
  const addExperience = () => {
    const nextIndex = profile.experience.length;
    setExpandedExperience(nextIndex);
    onProfile({ ...profile, experience: [...profile.experience, emptyExperience()] });
  };
  const removeExperience = (index: number) => {
    setExpandedExperience((current) => {
      if (current === null) return null;
      if (current > index) return current - 1;
      if (current === index) return Math.max(0, Math.min(index, profile.experience.length - 2));
      return current;
    });
    onProfile({ ...profile, experience: profile.experience.filter((_, itemIndex) => itemIndex !== index) });
  };
  const moveExperience = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= profile.experience.length) return;
    setExpandedExperience(target);
    onProfile({ ...profile, experience: moveRecord(profile.experience, index, target) });
  };
  const duplicateExperience = (index: number) => {
    const target = index + 1;
    const source = profile.experience[index];
    const duplicate = { ...source, bullets: [...source.bullets], technologies: [...source.technologies] };
    setExpandedExperience(target);
    onProfile({ ...profile, experience: insertRecord(profile.experience, target, duplicate) });
  };
  const addProject = () => {
    const nextIndex = profile.projects.length;
    setExpandedProject(nextIndex);
    onProfile({ ...profile, projects: [...profile.projects, emptyProject()] });
  };
  const removeProject = (index: number) => {
    setExpandedProject((current) => {
      if (profile.projects.length <= 1) return null;
      if (current === null) return null;
      if (current > index) return current - 1;
      if (current === index) return Math.min(index, profile.projects.length - 2);
      return current;
    });
    onProfile({ ...profile, projects: profile.projects.filter((_, itemIndex) => itemIndex !== index) });
  };
  const moveProject = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= profile.projects.length) return;
    setExpandedProject(target);
    onProfile({ ...profile, projects: moveRecord(profile.projects, index, target) });
  };
  const duplicateProject = (index: number) => {
    const target = index + 1;
    const source = profile.projects[index];
    const duplicate = { ...source, metrics: [...source.metrics], technologies: [...source.technologies] };
    setExpandedProject(target);
    onProfile({ ...profile, projects: insertRecord(profile.projects, target, duplicate) });
  };

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
          action={<IconButton label="Adicionar experiência" onClick={addExperience} />}
        />
        {profile.experience.map((item, index) => (
          <ExperienceEditorCard
            key={index}
            item={item}
            index={index}
            total={profile.experience.length}
            expanded={expandedExperience === index}
            keywordSuggestions={keywordSuggestions}
            onToggle={() => setExpandedExperience((current) => current === index ? null : index)}
            onUpdate={(patch) => updateExperience(index, patch)}
            onMove={(direction) => moveExperience(index, direction)}
            onDuplicate={() => duplicateExperience(index)}
            onRemove={() => removeExperience(index)}
            onOpenFocus={openFocus}
          />
        ))}
      </section>

      <section className="editor-section" id={editorSectionId('projects')}>
        <SectionHeading
          title="Projetos"
          hint="Nome, descrição, métricas e tecnologias"
          action={<IconButton label="Adicionar projeto" onClick={addProject} />}
        />
        {profile.projects.map((item, index) => (
          <ProjectEditorCard
            key={index}
            item={item}
            index={index}
            total={profile.projects.length}
            expanded={expandedProject === index}
            keywordSuggestions={keywordSuggestions}
            onToggle={() => setExpandedProject((current) => current === index ? null : index)}
            onUpdate={(patch) => updateProject(index, patch)}
            onMove={(direction) => moveProject(index, direction)}
            onDuplicate={() => duplicateProject(index)}
            onRemove={() => removeProject(index)}
            onOpenFocus={openFocus}
          />
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

function emptyExperience(): Experience {
  return { company: '', role: '', dates: '', location: '', work_mode: '', summary: '', bullets: [], technologies: [] };
}

function emptyProject(): Project {
  return { name: '', description: '', metrics: [], technologies: [] };
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
