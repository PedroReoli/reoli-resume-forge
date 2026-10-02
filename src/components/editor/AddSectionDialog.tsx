import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { useDialogFocus } from '../../hooks/useDialogFocus';
import type { CustomSectionKind } from '../../types/resume';

interface AddSectionDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (kind: CustomSectionKind, title: string) => void;
}

const SECTION_TYPES: Array<{ kind: CustomSectionKind; label: string; defaultTitle: string }> = [
  { kind: 'volunteering', label: 'Voluntariado', defaultTitle: 'Voluntariado' },
  { kind: 'courses', label: 'Cursos', defaultTitle: 'Cursos e Aperfeiçoamento' },
  { kind: 'publications', label: 'Publicações', defaultTitle: 'Publicações' },
  { kind: 'awards', label: 'Prêmios', defaultTitle: 'Prêmios e Reconhecimentos' },
  { kind: 'custom', label: 'Personalizada', defaultTitle: 'Nova seção' },
];

export function AddSectionDialog({ open, onClose, onAdd }: AddSectionDialogProps) {
  const [kind, setKind] = useState<CustomSectionKind>('volunteering');
  const [title, setTitle] = useState('Voluntariado');
  const dialogRef = useDialogFocus<HTMLElement>(open, onClose, '[data-dialog-initial-focus="true"]');
  if (!open) return null;

  const selectKind = (nextKind: CustomSectionKind) => {
    setKind(nextKind);
    setTitle(SECTION_TYPES.find((item) => item.kind === nextKind)?.defaultTitle ?? 'Nova seção');
  };

  const submit = () => {
    if (!title.trim()) return;
    onAdd(kind, title.trim());
    onClose();
  };

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section ref={dialogRef} className="section-dialog" role="dialog" aria-modal="true" aria-labelledby="add-section-title">
        <header>
          <div>
            <h2 id="add-section-title">Adicionar seção</h2>
            <p>O bloco entra no fim do documento e pode ser reordenado.</p>
          </div>
          <button type="button" className="icon-button" aria-label="Fechar" onClick={onClose}><X size={17} /></button>
        </header>
        <div className="section-kind-grid" role="radiogroup" aria-label="Tipo da nova seção">
          {SECTION_TYPES.map((item) => (
            <button
              key={item.kind}
              type="button"
              role="radio"
              aria-checked={kind === item.kind}
              onClick={() => selectKind(item.kind)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <label className="field">
          <span>Título exibido</span>
          <input data-dialog-initial-focus="true" value={title} maxLength={120} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <footer>
          <button type="button" className="quiet-button" onClick={onClose}>Cancelar</button>
          <button type="button" className="tailor-button" disabled={!title.trim()} onClick={submit}>
            <Plus size={16} /> Adicionar
          </button>
        </footer>
      </section>
    </div>
  );
}
