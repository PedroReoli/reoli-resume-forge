import { FolderOpen, Plus, Redo2, Save, ShieldCheck, Undo2, Upload } from 'lucide-react';

interface AppHeaderProps {
  onImport: () => void;
  onSave: () => void;
  onNew: () => void;
  onManageProfiles: () => void;
  currentProfileName: string;
  savedProfileCount: number;
  hasUnsavedChanges: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export function AppHeader({
  onImport,
  onSave,
  onNew,
  onManageProfiles,
  currentProfileName,
  savedProfileCount,
  hasUnsavedChanges,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="brand-lockup">
        <span className="brand-mark" aria-hidden="true">R</span>
        <div>
          <strong>
            <span className="brand-name-full">Reoli Resume Forge</span>
            <span className="brand-name-compact">Reoli Forge</span>
          </strong>
          <span className="brand-tagline">Resumes verdadeiros para oportunidades reais.</span>
        </div>
      </div>
      <div className="header-actions">
        <span className="privacy-note"><ShieldCheck size={15} /> Local e privado</span>
        <button className="profile-library-trigger" type="button" onClick={onManageProfiles}>
          <FolderOpen size={16} />
          <span><small>Perfil</small><strong>{currentProfileName}</strong></span>
          <em>{savedProfileCount}</em>
        </button>
        <div className="history-actions" aria-label="Histórico de edição">
          <button type="button" aria-label="Desfazer alteração" title="Desfazer (Ctrl+Z)" disabled={!canUndo} onClick={onUndo}><Undo2 size={15} /></button>
          <button type="button" aria-label="Refazer alteração" title="Refazer (Ctrl+Y)" disabled={!canRedo} onClick={onRedo}><Redo2 size={15} /></button>
        </div>
        <button
          className={`quiet-button save-profile-button ${hasUnsavedChanges ? 'has-unsaved-changes' : ''}`}
          type="button"
          aria-label={hasUnsavedChanges ? 'Salvar perfil, há alterações não salvas' : 'Salvar perfil'}
          title="Salvar na biblioteca local (Ctrl+S)"
          onClick={onSave}
        >
          <Save size={16} /> Salvar perfil
        </button>
        <button className="quiet-button" type="button" onClick={onImport}>
          <Upload size={16} /> Importar JSON
        </button>
        <button className="quiet-button" type="button" onClick={onNew}>
          <Plus size={16} /> Novo perfil
        </button>
      </div>
    </header>
  );
}
