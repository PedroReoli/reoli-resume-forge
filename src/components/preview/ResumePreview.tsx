import type { ResumeProfile, ResumeTemplate } from '../../types/resume';
import { profilePalette } from '../../domain/resumeLayout';
import { InlineEditable } from '../common/InlineEditable';
import { ResumeSectionRenderer } from './ResumeSectionRenderer';

interface ResumePreviewProps {
  profile: ResumeProfile;
  template: ResumeTemplate;
  onProfile: (profile: ResumeProfile) => void;
}

const SPLIT_SIDEBAR_SECTIONS = new Set(['skills', 'soft_skills', 'education', 'certifications', 'languages']);

export function ResumePreview({ profile, template, onProfile }: ResumePreviewProps) {
  const updatePerson = (key: keyof ResumeProfile['person'], value: string) => {
    onProfile({ ...profile, person: { ...profile.person, [key]: value } });
  };
  const visibleOrder = profile.layout.section_order.filter((sectionId) => !profile.layout.hidden_sections.includes(sectionId));
  const sidebarSections = visibleOrder.filter((sectionId) => SPLIT_SIDEBAR_SECTIONS.has(sectionId));
  const mainSections = visibleOrder.filter((sectionId) => !SPLIT_SIDEBAR_SECTIONS.has(sectionId));

  return (
    <article
      className={`resume-sheet template-${template} palette-${profilePalette(profile)} density-${profile.layout.density} ${profile.layout.emphasize_metrics ? 'emphasize-metrics' : ''}`}
      aria-label="Pré-visualização A4 editável"
    >
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
          <InlineEditable label="GitHub" value={profile.person.github} onChange={(value) => updatePerson('github', value)} />
        </div>
      </header>

      {template === 'modern-split' ? (
        <div className="resume-split-layout">
          <aside>{sidebarSections.map((sectionId) => <ResumeSectionRenderer key={sectionId} profile={profile} sectionId={sectionId} onProfile={onProfile} />)}</aside>
          <main>{mainSections.map((sectionId) => <ResumeSectionRenderer key={sectionId} profile={profile} sectionId={sectionId} onProfile={onProfile} />)}</main>
        </div>
      ) : (
        <div className="resume-content">
          {visibleOrder.map((sectionId) => <ResumeSectionRenderer key={sectionId} profile={profile} sectionId={sectionId} onProfile={onProfile} />)}
        </div>
      )}
    </article>
  );
}
