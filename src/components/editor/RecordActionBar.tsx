import { ChevronDown, ChevronUp, CopyPlus, Trash2 } from 'lucide-react';

interface RecordActionBarProps {
  itemLabel: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  canRemove?: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
}

export function RecordActionBar({
  itemLabel,
  canMoveUp,
  canMoveDown,
  canRemove = true,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onRemove,
}: RecordActionBarProps) {
  return (
    <div className="record-action-bar" aria-label={`Ações para ${itemLabel}`}>
      <span>Organizar ficha</span>
      <div>
        <button type="button" disabled={!canMoveUp} aria-label={`Mover ${itemLabel} para cima`} onClick={onMoveUp}>
          <ChevronUp size={13} /> <span>Subir</span>
        </button>
        <button type="button" disabled={!canMoveDown} aria-label={`Mover ${itemLabel} para baixo`} onClick={onMoveDown}>
          <ChevronDown size={13} /> <span>Descer</span>
        </button>
        <button type="button" aria-label={`Duplicar ${itemLabel}`} onClick={onDuplicate}>
          <CopyPlus size={13} /> <span>Duplicar</span>
        </button>
        <button
          className="danger-action"
          type="button"
          disabled={!canRemove}
          aria-label={`Remover ${itemLabel}`}
          title={canRemove ? `Remover ${itemLabel}` : 'Mantenha pelo menos uma ficha'}
          onClick={onRemove}
        >
          <Trash2 size={13} /> <span>Remover</span>
        </button>
      </div>
    </div>
  );
}
