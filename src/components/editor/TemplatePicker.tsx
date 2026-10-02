import { Check, Columns2, FileCheck2, LayoutTemplate, X } from 'lucide-react';
import { useEffect } from 'react';
import { TEMPLATE_OPTIONS } from '../../domain/resumeLayout';
import type { ResumeTemplate } from '../../types/resume';

interface TemplatePickerProps {
  open: boolean;
  template: ResumeTemplate;
  onClose: () => void;
  onSelect: (template: ResumeTemplate) => void;
}

export function TemplatePicker({ open, template, onClose, onSelect }: TemplatePickerProps) {
  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="dialog-backdrop template-picker-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="template-picker" role="dialog" aria-modal="true" aria-labelledby="template-picker-title">
        <header>
          <div>
            <span className="picker-kicker"><LayoutTemplate size={14} /> Biblioteca de modelos</span>
            <h2 id="template-picker-title">Escolha a linguagem do currículo</h2>
            <p>Compare estrutura, densidade e compatibilidade antes de decidir.</p>
          </div>
          <button type="button" className="icon-button" aria-label="Fechar modelos" onClick={onClose}><X size={18} /></button>
        </header>

        <div className="template-contact-sheet">
          {TEMPLATE_OPTIONS.map((option) => {
            const selected = option.id === template;
            return (
              <button
                className={`template-choice ${selected ? 'is-selected' : ''}`}
                type="button"
                aria-pressed={selected}
                key={option.id}
                onClick={() => {
                  onSelect(option.id);
                  onClose();
                }}
              >
                <TemplateMiniature template={option.id} />
                <span className="template-choice-copy">
                  <span className="template-choice-title">
                    <strong>{option.label}</strong>
                    {selected ? <span className="selected-mark"><Check size={12} /> Em uso</span> : null}
                  </span>
                  <span className="template-description">{option.description}</span>
                  <span className="template-facts">
                    <span>{option.atsMode === 'linear' ? <FileCheck2 size={12} /> : <Columns2 size={12} />}{option.atsMode === 'linear' ? 'Leitura ATS linear' : 'Layout visual'}</span>
                    <span>{option.bestFor}</span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <footer>
          <p><FileCheck2 size={14} /> Para portais ATS mais antigos, prefira um modelo marcado como leitura linear.</p>
          <button type="button" className="quiet-button" onClick={onClose}>Manter {TEMPLATE_OPTIONS.find((item) => item.id === template)?.label}</button>
        </footer>
      </section>
    </div>
  );
}

function TemplateMiniature({ template }: { template: ResumeTemplate }) {
  return (
    <span className={`template-miniature miniature-${template}`} aria-hidden="true">
      <span className="miniature-accent" />
      <span className="miniature-name" />
      <span className="miniature-headline" />
      <span className="miniature-rule" />
      <span className="miniature-content">
        <i /><i /><i /><i /><i /><i />
      </span>
    </span>
  );
}
