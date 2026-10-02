import { ChevronDown } from 'lucide-react';
import type { ArchetypeMetadata, ResumeTemplate } from '../../types/resume';

interface WorkspaceControlsProps {
  archetypes: ArchetypeMetadata[];
  archetypeId: string;
  locale: string;
  template: ResumeTemplate;
  disabled: boolean;
  onArchetype: (id: string) => void;
  onLocale: (locale: string) => void;
  onTemplate: (template: ResumeTemplate) => void;
}

export function WorkspaceControls(props: WorkspaceControlsProps) {
  return (
    <div className="workspace-controls" aria-label="Configuração do currículo">
      <label>
        <span>Arquétipo</span>
        <span className="select-wrap">
          <select
            value={props.archetypeId}
            disabled={props.disabled}
            onChange={(event) => props.onArchetype(event.target.value)}
          >
            {props.archetypeId === 'custom' ? <option value="custom">Perfil personalizado</option> : null}
            {props.archetypes.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
          <ChevronDown size={15} aria-hidden="true" />
        </span>
      </label>
      <label>
        <span>Idioma</span>
        <span className="select-wrap">
          <select value={props.locale} onChange={(event) => props.onLocale(event.target.value)}>
            <option value="pt-BR">Português (Brasil)</option>
            <option value="en-US">English (US)</option>
          </select>
          <ChevronDown size={15} aria-hidden="true" />
        </span>
      </label>
      <label>
        <span>Modelo</span>
        <span className="select-wrap">
          <select
            value={props.template}
            onChange={(event) => props.onTemplate(event.target.value as ResumeTemplate)}
          >
            <option value="clean">Clean Slate</option>
            <option value="compact">Compact Linear</option>
          </select>
          <ChevronDown size={15} aria-hidden="true" />
        </span>
      </label>
    </div>
  );
}
