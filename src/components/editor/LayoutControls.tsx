import { ChevronDown, Gauge, LayoutGrid, Palette, Rows3, SlidersHorizontal, Sparkles, Type } from 'lucide-react';
import type { CSSProperties } from 'react';
import {
  applyResumePalette,
  applyResumeStylePreset,
  applyResumeTypeface,
  profilePalette,
  profileStylePreset,
  profileTypeface,
  RESUME_PALETTES,
  RESUME_STYLE_PRESETS,
  RESUME_TYPEFACES,
} from '../../domain/resumeLayout';
import type {
  NarrativeLayout,
  ResumeDensity,
  ResumePalette,
  ResumeProfile,
  ResumeStylePresetId,
  ResumeTypeface,
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
  const palette = profilePalette(profile);
  const typeface = profileTypeface(profile);
  const stylePreset = profileStylePreset(profile);
  const visualLabel = palette === 'template' && typeface === 'template'
    ? 'Padrão do modelo'
    : `${paletteLabel(palette)} · ${typefaceLabel(typeface)}`;
  const customSummary = `${densityLabel(profile.layout.density)} · ${visualLabel}`;
  const patchLayout = (patch: Partial<ResumeProfile['layout']>) => {
    onProfile({ ...profile, layout: { ...profile.layout, ...patch } });
  };

  return (
    <details className="layout-controls">
      <summary>
        <span><LayoutGrid size={15} /> Formatação do documento</span>
        <small title={stylePreset ? stylePresetLabel(stylePreset) : customSummary}>
          {stylePreset ? stylePresetLabel(stylePreset) : customSummary}
        </small>
      </summary>
      <div className="layout-control-grid">
        <div className="layout-preset-intro">
          <strong>Escolha um ponto de partida</strong>
          <span>Oito composições prontas; conteúdo e ordem permanecem intactos.</span>
        </div>
        <ControlGroup label="Aparências prontas" icon={Sparkles}>
          <StylePresetControl
            value={stylePreset}
            onChange={(value) => onProfile(applyResumeStylePreset(profile, value))}
          />
        </ControlGroup>
        <details className="layout-advanced-controls">
          <summary>
            <span><SlidersHorizontal size={13} /> Ajustes finos</span>
            <small>Cores, tipo e estrutura</small>
            <ChevronDown size={14} aria-hidden="true" />
          </summary>
          <div className="layout-advanced-grid">
            <ControlGroup label="Paleta" icon={Palette}>
              <PaletteControl value={palette} onChange={(value) => onProfile(applyResumePalette(profile, value))} />
            </ControlGroup>
            <ControlGroup label="Tipografia" icon={Type}>
              <TypefaceControl value={typeface} onChange={(value) => onProfile(applyResumeTypeface(profile, value))} />
            </ControlGroup>
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
          </div>
        </details>
      </div>
    </details>
  );
}

function TypefaceControl({ value, onChange }: { value: ResumeTypeface; onChange: (value: ResumeTypeface) => void }) {
  return (
    <div className="typeface-control">
      {RESUME_TYPEFACES.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-label={`${option.label}: ${option.description}`}
          aria-pressed={value === option.id}
          title={option.description}
          onClick={() => onChange(option.id)}
        >
          <span className={`typeface-sample sample-${option.id}`} aria-hidden="true">{option.sample}</span>
          <span>
            <strong>{option.label}</strong>
            <small>{option.description}</small>
          </span>
        </button>
      ))}
    </div>
  );
}

function StylePresetControl({
  value,
  onChange,
}: {
  value: ResumeStylePresetId | null;
  onChange: (value: ResumeStylePresetId) => void;
}) {
  return (
    <div className="style-preset-control">
      {RESUME_STYLE_PRESETS.map((option) => {
        const palette = RESUME_PALETTES.find((item) => item.id === option.palette)!;
        return (
          <button
            key={option.id}
            type="button"
            aria-label={`${option.label}: ${option.description} Indicado para ${option.bestFor}.`}
            aria-pressed={value === option.id}
            title={`${option.description} ${option.bestFor}.`}
            onClick={() => onChange(option.id)}
          >
            <span
              className={`style-preset-preview ${option.template === 'modern-split' ? 'is-split' : ''}`}
              aria-hidden="true"
              style={{
                '--preset-primary': palette.colors?.primary ?? palette.swatches[1],
                '--preset-dark': palette.colors?.dark ?? palette.swatches[0],
                '--preset-soft': palette.colors?.soft ?? '#eef1ef',
              } as CSSProperties}
            ><i /><i /><i /><i /></span>
            <span className="style-preset-copy">
              <strong>{option.label}</strong>
              <small>{option.description}</small>
              <em>{option.bestFor}</em>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function PaletteControl({ value, onChange }: { value: ResumePalette; onChange: (value: ResumePalette) => void }) {
  return (
    <div className="palette-control">
      {RESUME_PALETTES.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-label={`${option.label}: ${option.description}`}
          aria-pressed={value === option.id}
          title={option.description}
          onClick={() => onChange(option.id)}
        >
          <span
            className="palette-swatches"
            aria-hidden="true"
            style={{
              '--swatch-a': option.swatches[0],
              '--swatch-b': option.swatches[1],
              '--swatch-c': option.swatches[2],
            } as CSSProperties}
          ><i /><i /><i /></span>
          <span>{option.label}</span>
        </button>
      ))}
    </div>
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

function paletteLabel(value: ResumePalette): string {
  return RESUME_PALETTES.find((option) => option.id === value)?.label ?? value;
}

function typefaceLabel(value: ResumeTypeface): string {
  return RESUME_TYPEFACES.find((option) => option.id === value)?.label ?? value;
}

function stylePresetLabel(value: ResumeStylePresetId): string {
  return RESUME_STYLE_PRESETS.find((option) => option.id === value)?.label ?? value;
}
