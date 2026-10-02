import { CircleAlert, FileCheck2, LoaderCircle } from 'lucide-react';

export type DocumentSaveState = 'loaded' | 'saved' | 'dirty';

interface DocumentStatusBarProps {
  busy: boolean;
  saveState: DocumentSaveState;
}

const SAVE_LABELS: Record<DocumentSaveState, string> = {
  loaded: 'Perfil carregado',
  saved: 'Perfil salvo em JSON',
  dirty: 'Alterações não salvas',
};

export function DocumentStatusBar({ busy, saveState }: DocumentStatusBarProps) {
  const SaveIcon = saveState === 'dirty' ? CircleAlert : FileCheck2;
  return (
    <footer className="status-bar">
      <span>Reoli Resume Forge <small>v2.0.0</small></span>
      <span className={`document-save-state is-${saveState}`}>
        <SaveIcon size={13} />
        <span>{SAVE_LABELS[saveState]}</span>
        {saveState === 'dirty' ? <small>Ctrl+S para salvar</small> : null}
      </span>
      <span className="ready-state">
        {busy ? <><LoaderCircle className="spin" size={14} /> Processando</> : <><i /> Pronto</>}
      </span>
    </footer>
  );
}
