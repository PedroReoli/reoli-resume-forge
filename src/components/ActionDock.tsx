import { Clipboard, FileDown, FileText } from 'lucide-react';

interface ActionDockProps {
  busy: boolean;
  onPdf: () => void;
  onDocx: () => void;
  onMarkdown: () => void;
}

export function ActionDock({ busy, onPdf, onDocx, onMarkdown }: ActionDockProps) {
  return (
    <div className="action-dock" aria-label="Ações de exportação">
      <button className="primary-action" type="button" disabled={busy} onClick={onPdf}>
        <FileDown size={21} /><span>Exportar PDF</span><kbd>Ctrl+P</kbd>
      </button>
      <button type="button" disabled={busy} onClick={onDocx}>
        <FileText size={21} /><span>Exportar DOCX</span><kbd>Ctrl+D</kbd>
      </button>
      <button type="button" disabled={busy} onClick={onMarkdown}>
        <Clipboard size={20} /><span>Copiar Markdown</span><kbd>Ctrl+M</kbd>
      </button>
    </div>
  );
}
