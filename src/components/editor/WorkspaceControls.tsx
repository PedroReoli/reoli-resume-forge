import { ChevronDown, LayoutTemplate } from 'lucide-react';
import { useState } from 'react';
import { TEMPLATE_OPTIONS } from '../../domain/resumeLayout';
import type { ArchetypeMetadata, ResumeTemplate } from '../../types/resume';
import { TemplatePicker } from './TemplatePicker';

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
  const [choosingTemplate, setChoosingTemplate] = useState(false);
  const selectedTemplate = TEMPLATE_OPTIONS.find((option) => option.id === props.template);

  return (
    <>
      <div className="workspace-controls" aria-label="Configuração do currículo">
        <label>
          <span>Ponto de partida</span>
          <span className="select-wrap">
            <select
              value={props.archetypeId}
              disabled={props.disabled}
              onChange={(event) => props.onArchetype(event.target.value)}
            >
              {props.archetypeId === 'custom' ? <option value="custom">Perfil local / personalizado</option> : null}
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
            <select
              value={props.locale}
              title="Localiza rótulos e níveis conhecidos; textos livres são preservados para não alterar fatos."
              onChange={(event) => props.onLocale(event.target.value)}
            >
              <option value="pt-BR">Português (Brasil)</option>
              <option value="en-US">English (US)</option>
              <option value="es-ES">Español</option>
            </select>
            <ChevronDown size={15} aria-hidden="true" />
          </span>
        </label>
        <div className="workspace-control">
          <span>Modelo</span>
          <button
            className="template-trigger"
            type="button"
            aria-haspopup="dialog"
            aria-expanded={choosingTemplate}
            onClick={() => setChoosingTemplate(true)}
          >
            <span className={`template-trigger-swatch swatch-${props.template}`} aria-hidden="true"><i /><i /></span>
            <span><strong>{selectedTemplate?.label ?? props.template}</strong><small>Explorar 8 modelos</small></span>
            <LayoutTemplate size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
      <TemplatePicker
        open={choosingTemplate}
        template={props.template}
        onClose={() => setChoosingTemplate(false)}
        onSelect={props.onTemplate}
      />
    </>
  );
}
