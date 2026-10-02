import { Trash2 } from 'lucide-react';
import type { Project } from '../../types/resume';
import { EditorField, EditorTextArea, FocusButton } from './EditorFields';
import type { FocusedEditorConfig } from './FocusedEditorModal';
import { RecordEditorCard } from './RecordEditorCard';
import { splitLines, splitList } from './editorText';

interface ProjectEditorCardProps {
  item: Project;
  index: number;
  expanded: boolean;
  keywordSuggestions: string[];
  onToggle: () => void;
  onUpdate: (patch: Partial<Project>) => void;
  onRemove: () => void;
  onOpenFocus: (config: FocusedEditorConfig) => void;
}

export function ProjectEditorCard({
  item,
  index,
  expanded,
  keywordSuggestions,
  onToggle,
  onUpdate,
  onRemove,
  onOpenFocus,
}: ProjectEditorCardProps) {
  const completed = [item.name, item.description, item.metrics.length, item.technologies.length].filter(Boolean).length;
  const title = item.name.trim() || 'Novo projeto';
  const subtitle = item.description.trim() || 'Descrição ainda não informada';

  return (
    <RecordEditorCard
      id={`project-record-${index}`}
      indexLabel={`P${String(index + 1).padStart(2, '0')}`}
      title={title}
      subtitle={subtitle}
      details={[`${item.metrics.length} métricas`, `${item.technologies.length} tecnologias`]}
      completed={completed}
      total={4}
      expanded={expanded}
      onToggle={onToggle}
    >
      <div className="record-focus-actions">
        <FocusButton label="Editar métricas em foco" onClick={() => onOpenFocus({
          title: `${item.name || 'Projeto'} — resultados`,
          hint: 'Destaque resultados verificáveis. Nunca invente números para completar o formato.',
          value: item.metrics.join('\n'),
          suggestions: keywordSuggestions,
          onSave: (value) => onUpdate({ metrics: splitLines(value) }),
        })} />
      </div>
      <EditorField label="Nome do projeto" value={item.name} onChange={(name) => onUpdate({ name })} />
      <EditorTextArea label="Descrição" value={item.description} rows={3} onChange={(description) => onUpdate({ description })} />
      <EditorTextArea label="Métricas (uma linha por item)" value={item.metrics.join('\n')} rows={4} onChange={(value) => onUpdate({ metrics: splitLines(value) })} />
      <EditorField label="Tecnologias" value={item.technologies.join(', ')} onChange={(value) => onUpdate({ technologies: splitList(value) })} />
      <button className="remove-button" type="button" onClick={onRemove}>
        <Trash2 size={14} /> Remover projeto
      </button>
    </RecordEditorCard>
  );
}
