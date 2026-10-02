import { Gauge, LayoutGrid, Rows3, Sparkles } from 'lucide-react';
import type {
  NarrativeLayout,
  ResumeDensity,
  ResumeProfile,
  SkillsLayout,
} from '../../types/resume';

interface LayoutControlsProps {
  profile: ResumeProfile;
  onProfile: (profile: ResumeProfile) => void;
}

const SKILL_OPTIONS: Array<{ id: SkillsLayout; label: string }> = [
  { id: 'categorized', label: 'Categorias' },
  { id: 'table', label: 'Tabela' },
  { id: 'tags', label: 'Tags' },
  { id: 'levels', label: 'Níveis' },
];

const NARRATIVE_OPTIONS: Array<{ id: NarrativeLayout; label: string }> = [
  { id: 'bullets', label: 'Bullets' },
  { id: 'paragraphs', label: 'Parágrafos' },
  { id: 'metrics', label: 'Métricas primeiro' },
];

const DENSITY_OPTIONS: Array<{ id: ResumeDensity; label: string }> = [
  { id: 'compact', label: 'Compacta' },
  { id: 'balanced', label: 'Equilibrada' },
  { id: 'relaxed', label: 'Confortável' },
];

export function LayoutControls({ profile, onProfile }: LayoutControlsProps) {
  const patchLayout = (patch: Partial<ResumeProfile['layout']>) => {
    onProfile({ ...profile, layout: { ...profile.layout, ...patch } });
  };

  return (
    <details className="layout-controls">
      <summary>
        <span><LayoutGrid size={15} /> Formatação do documento</span>
        <small>{densityLabel(profile.layout.density)}</small>
      </summary>
      <div className="layout-control-grid">
        <ControlGroup label="Competências" icon={LayoutGrid}>
          <Segmented
            value={profile.layout.skills_style}
            options={SKILL_OPTIONS}
            onChange={(value) => patchLayout({ skills_style: value as SkillsLayout })}
          />
        </ControlGroup>
        <ControlGroup label="Experiências" icon={Rows3}>
          <Segmented
            value={profile.layout.experience_style}
            options={NARRATIVE_OPTIONS}
            onChange={(value) => patchLayout({ experience_style: value as NarrativeLayout })}
          />
        </ControlGroup>
        <ControlGroup label="Projetos" icon={Rows3}>
          <Segmented
            value={profile.layout.projects_style}
            options={NARRATIVE_OPTIONS}
            onChange={(value) => patchLayout({ projects_style: value as NarrativeLayout })}
          />
        </ControlGroup>
        <ControlGroup label="Densidade" icon={Gauge}>
          <Segmented
            value={profile.layout.density}
            options={DENSITY_OPTIONS}
            onChange={(value) => patchLayout({ density: value as ResumeDensity })}
          />
        </ControlGroup>
      </div>
      <label className="metric-toggle">
        <input
          type="checkbox"
          checked={profile.layout.emphasize_metrics}
          onChange={(event) => patchLayout({ emphasize_metrics: event.target.checked })}
        />
        <Sparkles size={14} />
        <span>Destacar métricas e tecnologias no preview</span>
      </label>
      {profile.layout.skills_style === 'levels' ? (
        <div className="skill-level-editor">
          <p>Níveis definidos manualmente; o sistema não presume proficiência.</p>
          {skillNames(profile).map((skill) => (
            <label key={skill}>
              <span>{skill}</span>
              <input
                type="range"
                min="0"
                max="5"
                value={profile.layout.skill_levels[skill] ?? 0}
                onChange={(event) => patchLayout({
                  skill_levels: {
                    ...profile.layout.skill_levels,
                    [skill]: Number(event.target.value),
                  },
                })}
              />
              <output>{profile.layout.skill_levels[skill] ?? 0}/5</output>
            </label>
          ))}
        </div>
      ) : null}
    </details>
  );
}

function ControlGroup({ label, icon: Icon, children }: { label: string; icon: typeof Gauge; children: React.ReactNode }) {
  return (
    <div className="layout-control-group">
      <span><Icon size={13} /> {label}</span>
      {children}
    </div>
  );
}

function Segmented({
  value,
  options,
  onChange,
}: {
  value: string;
  options: Array<{ id: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="segmented-control">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={value === option.id}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function skillNames(profile: ResumeProfile): string[] {
  return Array.from(new Set(
    Object.values(profile.skills)
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .filter((value): value is string => typeof value === 'string' && Boolean(value.trim())),
  )).slice(0, 18);
}

function densityLabel(value: ResumeDensity): string {
  return DENSITY_OPTIONS.find((option) => option.id === value)?.label ?? value;
}
