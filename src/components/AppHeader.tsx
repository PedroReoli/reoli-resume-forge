import { FileJson, Plus, Redo2, ShieldCheck, Undo2 } from 'lucide-react';

interface AppHeaderProps {
  onImport: () => void;
  onNew: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export function AppHeader({ onImport, onNew, canUndo, canRedo, onUndo, onRedo }: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="brand-lockup">
        <span className="brand-mark" aria-hidden="true">R</span>
        <div>
          <strong>Reoli Resume Forge</strong>
          <span>Resumes verdadeiros para oportunidades reais.</span>
        </div>
      </div>
      <div className="header-actions">
        <span className="privacy-note"><ShieldCheck size={15} /> Local e privado</span>
        <div className="history-actions" aria-label="Histórico de edição">
          <button type="button" aria-label="Desfazer alteração" title="Desfazer (Ctrl+Z)" disabled={!canUndo} onClick={onUndo}><Undo2 size={15} /></button>
          <button type="button" aria-label="Refazer alteração" title="Refazer (Ctrl+Y)" disabled={!canRedo} onClick={onRedo}><Redo2 size={15} /></button>
        </div>
        <button className="quiet-button" type="button" onClick={onImport}>
          <FileJson size={16} /> Importar JSON
        </button>
        <button className="quiet-button" type="button" onClick={onNew}>
          <Plus size={16} /> Novo perfil
        </button>
      </div>
    </header>
  );
}
