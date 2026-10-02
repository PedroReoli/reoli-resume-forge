import { Check, Columns2, FileCheck2, LayoutTemplate, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { TEMPLATE_OPTIONS } from '../../domain/resumeLayout';
import { useDialogFocus } from '../../hooks/useDialogFocus';
import type { ResumeTemplate } from '../../types/resume';

interface TemplatePickerProps {
  open: boolean;
  template: ResumeTemplate;
  onClose: () => void;
  onSelect: (template: ResumeTemplate) => void;
}

export function TemplatePicker({ open, template, onClose, onSelect }: TemplatePickerProps) {
  const [candidate, setCandidate] = useState(template);

  useEffect(() => {
    if (open) setCandidate(template);
  }, [open, template]);

  const dialogRef = useDialogFocus<HTMLElement>(open, onClose, '[data-template-current="true"]');

  if (!open) return null;

  const candidateOption = TEMPLATE_OPTIONS.find((option) => option.id === candidate)!;
  const changed = candidate !== template;

  const applyCandidate = () => {
    if (!changed) return;
    onSelect(candidate);
    onClose();
  };

  return (
    <div className="dialog-backdrop template-picker-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section
        ref={dialogRef}
        className="template-picker"
        role="dialog"
        aria-modal="true"
        aria-labelledby="template-picker-title"
        aria-describedby="template-picker-description"
      >
        <header>
          <div>
            <span className="picker-kicker"><LayoutTemplate size={14} /> Biblioteca de modelos</span>
            <h2 id="template-picker-title">Escolha a linguagem do currículo</h2>
            <p id="template-picker-description">Compare estrutura, densidade e compatibilidade antes de aplicar.</p>
          </div>
          <button type="button" className="icon-button" aria-label="Fechar modelos" onClick={onClose}><X size={18} /></button>
        </header>

        <div className="template-contact-sheet">
          {TEMPLATE_OPTIONS.map((option) => {
            const selected = option.id === candidate;
            const current = option.id === template;
            return (
              <button
                className={`template-choice ${selected ? 'is-selected' : ''}`}
                type="button"
                aria-pressed={selected}
                data-template-selected={selected || undefined}
                data-template-current={current || undefined}
                key={option.id}
                onClick={() => setCandidate(option.id)}
              >
                <TemplateMiniature template={option.id} />
                <span className="template-choice-copy">
                  <span className="template-choice-title">
                    <strong>{option.label}</strong>
                    {selected ? (
                      <span className="selected-mark"><Check size={12} /> {current ? 'Em uso' : 'Selecionado'}</span>
                    ) : current ? <span className="current-mark">Atual</span> : null}
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
          <div className="template-picker-decision" aria-live="polite">
            <span>{changed ? 'Pronto para aplicar' : 'Modelo atual'}</span>
            <strong>{candidateOption.label}</strong>
            <small>{candidateOption.description}</small>
          </div>
          <div className="template-picker-footer-side">
            <p><FileCheck2 size={14} /> {candidateOption.atsMode === 'linear' ? 'Leitura linear indicada para ATS.' : 'Layout visual indicado para envio direto.'}</p>
            <div className="template-picker-actions">
              <button type="button" className="quiet-button" onClick={onClose}>{changed ? 'Cancelar' : 'Fechar'}</button>
              <button type="button" className="tailor-button template-apply" disabled={!changed} onClick={applyCandidate}>
                <Check size={15} /> {changed ? `Usar ${candidateOption.label}` : 'Modelo em uso'}
              </button>
            </div>
          </div>
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
