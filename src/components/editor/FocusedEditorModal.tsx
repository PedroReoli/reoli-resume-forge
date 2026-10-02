import { ArrowUpNarrowWide, List, ListX, Save, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useDialogFocus } from '../../hooks/useDialogFocus';

export interface FocusedEditorConfig {
  title: string;
  hint: string;
  value: string;
  multiline?: boolean;
  suggestions?: string[];
  onSave: (value: string) => void;
}

interface FocusedEditorModalProps {
  config: FocusedEditorConfig | null;
  onClose: () => void;
}

export function FocusedEditorModal({ config, onClose }: FocusedEditorModalProps) {
  const [draft, setDraft] = useState(config?.value ?? '');
  const editor = useRef<HTMLTextAreaElement>(null);
  const dialogRef = useDialogFocus<HTMLElement>(Boolean(config), onClose, '[data-dialog-initial-focus="true"]');

  useEffect(() => setDraft(config?.value ?? ''), [config]);

  if (!config) return null;

  const insertSuggestion = (keyword: string) => {
    const element = editor.current;
    if (!element) return;
    const before = draft.slice(0, element.selectionStart);
    const after = draft.slice(element.selectionEnd);
    const spacer = before && !/\s$/.test(before) ? ' ' : '';
    const next = `${before}${spacer}${keyword}${after}`;
    setDraft(next);
    window.requestAnimationFrame(() => element.focus());
  };

  const save = () => {
    config.onSave(draft.trim());
    onClose();
  };

  return (
    <div className="dialog-backdrop focused-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section ref={dialogRef} className="focused-editor" role="dialog" aria-modal="true" aria-labelledby="focused-editor-title">
        <header>
          <div>
            <h2 id="focused-editor-title">{config.title}</h2>
            <p>{config.hint}</p>
          </div>
          <button type="button" className="icon-button" aria-label="Fechar editor" onClick={onClose}><X size={17} /></button>
        </header>
        <div className="focused-editor-grid">
          <div className="focused-compose">
            <div className="formatting-toolbar" aria-label="Formatação rápida">
              <button type="button" onClick={() => setDraft(addBullets(draft))}><List size={14} /> Bullets</button>
              <button type="button" onClick={() => setDraft(removeBullets(draft))}><ListX size={14} /> Limpar</button>
              <button type="button" onClick={() => setDraft(metricsFirst(draft))}><ArrowUpNarrowWide size={14} /> Métricas primeiro</button>
            </div>
            <textarea
              ref={editor}
              data-dialog-initial-focus="true"
              value={draft}
              rows={config.multiline === false ? 4 : 16}
              maxLength={config.multiline === false ? 320 : 4_000}
              onChange={(event) => setDraft(event.target.value)}
            />
            <div className="editor-counter">
              <span>{draft.length.toLocaleString('pt-BR')} caracteres</span>
              <span>{wordCount(draft)} palavras</span>
            </div>
            {config.suggestions?.length ? (
              <div className="keyword-suggestions">
                <span>Sugestões da vaga</span>
                <div>
                  {config.suggestions.slice(0, 10).map((keyword) => (
                    <button key={keyword} type="button" onClick={() => insertSuggestion(keyword)}>{keyword}</button>
                  ))}
                </div>
                <small>Inclua somente termos sustentados por experiência real.</small>
              </div>
            ) : null}
          </div>
          <aside className="focused-context-preview">
            <span>Preview contextual</span>
            <h3>{config.title}</h3>
            <div>{draft || 'Comece a escrever para visualizar o bloco.'}</div>
            <ol>
              <li><strong>X</strong> — o que você realizou.</li>
              <li><strong>Y</strong> — como o resultado foi medido.</li>
              <li><strong>Z</strong> — tecnologia, método ou contexto.</li>
            </ol>
          </aside>
        </div>
        <footer>
          <span>As alterações só são aplicadas ao salvar.</span>
          <div>
            <button type="button" className="quiet-button" onClick={onClose}>Cancelar</button>
            <button type="button" className="tailor-button" onClick={save}><Save size={15} /> Salvar alterações</button>
          </div>
        </footer>
      </section>
    </div>
  );
}

function addBullets(value: string): string {
  return value.split('\n').map((line) => line.trim() ? `• ${line.replace(/^[-•]\s*/, '')}` : '').join('\n');
}

function removeBullets(value: string): string {
  return value.split('\n').map((line) => line.replace(/^\s*[-•]\s*/, '')).join('\n');
}

function metricsFirst(value: string): string {
  const lines = value.split('\n');
  return [...lines.filter(hasMetric), ...lines.filter((line) => !hasMetric(line))].join('\n');
}

function hasMetric(value: string): boolean {
  return /\b\d+(?:[.,]\d+)?\s*(?:%|x|k|m|h|ms|anos?|meses?|dias?)?\b/i.test(value);
}

function wordCount(value: string): number {
  return value.trim() ? value.trim().split(/\s+/).length : 0;
}
