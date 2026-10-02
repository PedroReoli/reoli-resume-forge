import type { LucideIcon } from 'lucide-react';
import {
  AlignLeft,
  Award,
  BookOpen,
  BriefcaseBusiness,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  FolderKanban,
  GraduationCap,
  Languages,
  Plus,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  addCustomSection,
  moveSection,
  sectionLabel,
  toggleSectionVisibility,
} from '../../domain/resumeLayout';
import type { CustomSectionKind, ResumeProfile } from '../../types/resume';
import { AddSectionDialog } from './AddSectionDialog';

interface SectionNavigatorProps {
  profile: ResumeProfile;
  onProfile: (profile: ResumeProfile) => void;
}

const ICONS: Record<string, LucideIcon> = {
  summary: AlignLeft,
  skills: Wrench,
  soft_skills: Sparkles,
  experience: BriefcaseBusiness,
  projects: FolderKanban,
  education: GraduationCap,
  certifications: Award,
  languages: Languages,
};

export function SectionNavigator({ profile, onProfile }: SectionNavigatorProps) {
  const [adding, setAdding] = useState(false);
  const [activeSection, setActiveSection] = useState(profile.layout.section_order[0] ?? 'summary');
  const itemRefs = useRef(new Map<string, HTMLDivElement>());
  const hidden = new Set(profile.layout.hidden_sections);

  useEffect(() => {
    const sectionIds = profile.layout.section_order;
    const editorContent = document.querySelector<HTMLElement>('.editor-content');
    const mobileNavigator = document.querySelector<HTMLElement>('.section-navigator');
    let animationFrame = 0;

    const updateActiveSection = () => {
      const anchor = window.matchMedia('(max-width: 1040px)').matches
        ? (mobileNavigator?.getBoundingClientRect().bottom ?? 155) + 20
        : (editorContent?.getBoundingClientRect().top ?? 0) + 24;
      const measured = sectionIds
        .map((sectionId) => ({
          sectionId,
          top: document.getElementById(editorSectionId(sectionId))?.getBoundingClientRect().top,
        }))
        .filter((item): item is { sectionId: string; top: number } => item.top !== undefined);

      if (measured.length === 0) return;
      const passed = measured.filter((item) => item.top <= anchor);
      const next = passed.at(-1) ?? measured.reduce((closest, item) => (
        Math.abs(item.top - anchor) < Math.abs(closest.top - anchor) ? item : closest
      ));
      setActiveSection((current) => current === next.sectionId ? current : next.sectionId);
    };

    const scheduleUpdate = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(updateActiveSection);
    };

    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    editorContent?.addEventListener('scroll', scheduleUpdate, { passive: true });
    scheduleUpdate();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      editorContent?.removeEventListener('scroll', scheduleUpdate);
    };
  }, [profile.layout.section_order]);

  useEffect(() => {
    itemRefs.current.get(activeSection)?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest',
    });
  }, [activeSection]);

  const addSection = (kind: CustomSectionKind, title: string) => {
    const nextProfile = addCustomSection(profile, kind, title);
    const added = nextProfile.custom_sections.at(-1);
    onProfile(nextProfile);
    if (added) window.setTimeout(() => scrollToSection(`custom:${added.id}`), 0);
  };

  return (
    <>
      <nav className="section-navigator" aria-label="Navegação e ordem das seções">
        <div className="navigator-heading">
          <span>Estrutura</span>
          <small>{profile.layout.section_order.length}</small>
        </div>
        <div className="navigator-list">
          {profile.layout.section_order.map((sectionId, index) => {
            const Icon = iconFor(sectionId, profile);
            const isHidden = hidden.has(sectionId);
            return (
              <div
                ref={(node) => {
                  if (node) itemRefs.current.set(sectionId, node);
                  else itemRefs.current.delete(sectionId);
                }}
                className={`navigator-item ${activeSection === sectionId ? 'is-active' : ''} ${isHidden ? 'is-hidden' : ''}`}
                key={sectionId}
              >
                <button
                  className="navigator-jump"
                  type="button"
                  title={`Ir para ${sectionLabel(profile, sectionId)}`}
                  aria-current={activeSection === sectionId ? 'location' : undefined}
                  onClick={() => {
                    setActiveSection(sectionId);
                    scrollToSection(sectionId);
                  }}
                >
                  <Icon size={15} />
                  <span>{sectionLabel(profile, sectionId)}</span>
                </button>
                <div className="navigator-actions">
                  <button type="button" aria-label="Mover seção para cima" disabled={index === 0} onClick={() => onProfile(moveSection(profile, sectionId, -1))}><ChevronUp size={12} /></button>
                  <button type="button" aria-label="Mover seção para baixo" disabled={index === profile.layout.section_order.length - 1} onClick={() => onProfile(moveSection(profile, sectionId, 1))}><ChevronDown size={12} /></button>
                  <button type="button" aria-label={isHidden ? 'Exibir seção' : 'Ocultar seção'} onClick={() => onProfile(toggleSectionVisibility(profile, sectionId))}>
                    {isHidden ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <button className="navigator-add" type="button" onClick={() => setAdding(true)}>
          <Plus size={14} /> <span>Adicionar seção</span>
        </button>
      </nav>
      <AddSectionDialog open={adding} onClose={() => setAdding(false)} onAdd={addSection} />
    </>
  );
}

export function editorSectionId(sectionId: string): string {
  return `editor-${sectionId.replace(/[^a-z0-9_-]/gi, '-')}`;
}

function scrollToSection(sectionId: string) {
  document.getElementById(editorSectionId(sectionId))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function iconFor(sectionId: string, profile: ResumeProfile): LucideIcon {
  if (!sectionId.startsWith('custom:')) return ICONS[sectionId] ?? BookOpen;
  const custom = profile.custom_sections.find((item) => `custom:${item.id}` === sectionId);
  if (custom?.kind === 'publications' || custom?.kind === 'courses') return BookOpen;
  if (custom?.kind === 'awards') return Award;
  return Sparkles;
}
