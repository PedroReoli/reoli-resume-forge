import { FileJson, Plus, ShieldCheck } from 'lucide-react';

interface AppHeaderProps {
  onImport: () => void;
  onNew: () => void;
}

export function AppHeader({ onImport, onNew }: AppHeaderProps) {
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
