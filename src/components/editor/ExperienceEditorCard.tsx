import { Trash2 } from 'lucide-react';
import type { Experience } from '../../types/resume';
import { EditorField, EditorTextArea, FocusButton } from './EditorFields';
import type { FocusedEditorConfig } from './FocusedEditorModal';
import { RecordEditorCard } from './RecordEditorCard';
import { splitLines, splitList } from './editorText';

interface ExperienceEditorCardProps {
  item: Experience;
  index: number;
  total: number;
  expanded: boolean;
  keywordSuggestions: string[];
  onToggle: () => void;
  onUpdate: (patch: Partial<Experience>) => void;
  onRemove: () => void;
  onOpenFocus: (config: FocusedEditorConfig) => void;
}

export function ExperienceEditorCard({
  item,
  index,
  total,
  expanded,
  keywordSuggestions,
  onToggle,
  onUpdate,
  onRemove,
  onOpenFocus,
}: ExperienceEditorCardProps) {
  const completed = [
    item.company,
    item.role,
    item.dates,
    item.summary,
    item.bullets.length,
    item.technologies.length,
  ].filter(Boolean).length;
  const title = item.company.trim() || 'Nova experiência';
  const subtitle = [item.role, item.dates].filter((value) => value.trim()).join(' · ') || 'Cargo e período ainda não informados';

  return (
    <RecordEditorCard
      id={`experience-record-${index}`}
      indexLabel={String(index + 1).padStart(2, '0')}
      title={title}
      subtitle={subtitle}
      details={[`${item.bullets.length} resultados`, `${item.technologies.length} tecnologias`]}
      completed={completed}
      total={6}
      expanded={expanded}
      onToggle={onToggle}
    >
      <div className="record-focus-actions">
        <FocusButton label="Editar contexto em foco" onClick={() => onOpenFocus({
          title: `${item.role || 'Experiência'} — contexto`,
          hint: 'Explique escopo, produto, equipe e responsabilidade sem repetir os resultados.',
          value: item.summary,
          suggestions: keywordSuggestions,
          onSave: (summary) => onUpdate({ summary }),
        })} />
        <FocusButton label="Editar resultados em foco" onClick={() => onOpenFocus({
          title: `${item.role || 'Experiência'} — resultados`,
          hint: 'Uma evidência por linha. Quantifique somente métricas que você pode comprovar.',
          value: item.bullets.join('\n'),
          suggestions: keywordSuggestions,
          onSave: (value) => onUpdate({ bullets: splitLines(value) }),
        })} />
      </div>
      <div className="form-grid two-columns">
        <EditorField label="Empresa" value={item.company} onChange={(company) => onUpdate({ company })} />
        <EditorField label="Cargo" value={item.role} onChange={(role) => onUpdate({ role })} />
        <EditorField label="Período" value={item.dates} onChange={(dates) => onUpdate({ dates })} />
        <EditorField label="Local" value={item.location} onChange={(location) => onUpdate({ location })} />
        <EditorField label="Regime" value={item.work_mode} onChange={(work_mode) => onUpdate({ work_mode })} />
      </div>
      <EditorTextArea label="Contexto" value={item.summary} rows={3} onChange={(summary) => onUpdate({ summary })} />
      <EditorTextArea label="Resultados (uma linha por item)" value={item.bullets.join('\n')} rows={5} onChange={(value) => onUpdate({ bullets: splitLines(value) })} />
      <EditorField label="Tecnologias" value={item.technologies.join(', ')} onChange={(value) => onUpdate({ technologies: splitList(value) })} />
      {total > 1 ? (
        <button className="remove-button" type="button" onClick={onRemove}>
          <Trash2 size={14} /> Remover experiência
        </button>
      ) : null}
    </RecordEditorCard>
  );
}
