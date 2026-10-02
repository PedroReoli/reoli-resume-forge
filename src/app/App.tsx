import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Eye, LoaderCircle, PencilLine, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActionDock } from '../components/ActionDock';
import { AppHeader } from '../components/AppHeader';
import { AtsPanel } from '../components/editor/AtsPanel';
import { ProfileEditor } from '../components/editor/ProfileEditor';
import { SectionNavigator } from '../components/editor/SectionNavigator';
import { WorkspaceControls } from '../components/editor/WorkspaceControls';
import { PreviewPane } from '../components/preview/PreviewPane';
import { useResumeWorkspace } from '../hooks/useResumeWorkspace';
import { exportResume, resumeToMarkdown } from '../services/tauriBridge';
import type { ExportFormat, ResumeProfile } from '../types/resume';

export function App() {
  const workspace = useResumeWorkspace();
  const fileInput = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');
  const [pageCount, setPageCount] = useState<number | null>(null);

  const notify = useCallback((message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 3600);
  }, []);

  const exportFile = useCallback(async (format: ExportFormat) => {
    try {
      const path = await exportResume(workspace.profile, format, workspace.template);
      if (path) notify(`${format.toUpperCase()} exportado com sucesso.`);
    } catch (reason) {
      workspace.setError(messageOf(reason));
    }
  }, [notify, workspace]);

  const copyMarkdown = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(await resumeToMarkdown(workspace.profile));
      notify('Markdown copiado para a área de transferência.');
    } catch (reason) {
      workspace.setError(messageOf(reason));
    }
  }, [notify, workspace]);

  useEffect(() => {
    const shortcuts = (event: KeyboardEvent) => {
      if (!event.ctrlKey || event.altKey || event.shiftKey) return;
      const key = event.key.toLowerCase();
      if (!['p', 'd', 'm'].includes(key)) return;
      event.preventDefault();
      if (key === 'p') void exportFile('pdf');
      if (key === 'd') void exportFile('docx');
      if (key === 'm') void copyMarkdown();
    };
    window.addEventListener('keydown', shortcuts);
    return () => window.removeEventListener('keydown', shortcuts);
  }, [copyMarkdown, exportFile]);

  const importJson = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 1_048_576) {
      workspace.setError('O perfil excede o limite de 1 MiB.');
      return;
    }
    try {
      workspace.importProfile(JSON.parse(await file.text()) as ResumeProfile);
      notify('Perfil importado. Revise os dados antes de exportar.');
    } catch (reason) {
      workspace.setError(messageOf(reason));
    }
  };

  return (
    <main className="app-shell">
      <AppHeader onImport={() => fileInput.current?.click()} onNew={workspace.newProfile} />
      <input
        ref={fileInput}
        className="visually-hidden"
        type="file"
        accept="application/json,.json"
        onChange={(event) => void importJson(event.target.files?.[0])}
      />
      <nav className="mobile-view-toggle" aria-label="Área visível">
        <button type="button" aria-pressed={mobileView === 'editor'} onClick={() => setMobileView('editor')}>
          <PencilLine size={15} /> Editor
        </button>
        <button type="button" aria-pressed={mobileView === 'preview'} onClick={() => setMobileView('preview')}>
          <Eye size={15} /> Preview
        </button>
      </nav>
      <div className={`workspace mobile-${mobileView}`}>
        <aside className="editor-pane">
          <WorkspaceControls
            archetypes={workspace.archetypes}
            archetypeId={workspace.archetypeId}
            locale={workspace.locale}
            template={workspace.template}
            disabled={workspace.busy}
            onArchetype={(id) => void workspace.selectArchetype(id)}
            onLocale={(locale) => void workspace.selectLocale(locale)}
            onTemplate={workspace.setTemplate}
          />
          <div className="editor-workarea">
            <SectionNavigator profile={workspace.profile} onProfile={workspace.setProfile} />
            <div className="editor-content">
          <ProfileEditor
            profile={workspace.profile}
            jobDescription={workspace.jobDescription}
            keywordSuggestions={workspace.report?.missing ?? []}
            onProfile={workspace.setProfile}
            onJobDescription={workspace.setJobDescription}
          />
          <AtsPanel
            report={workspace.report}
            profile={workspace.profile}
            template={workspace.template}
            pageCount={pageCount}
            canTailor={workspace.jobDescription.trim().length >= 20}
            busy={workspace.busy}
            onTailor={() => void workspace.applyTailoring().then(() => notify('Evidências reordenadas conforme a vaga.')).catch((reason: unknown) => workspace.setError(messageOf(reason)))}
          />
            </div>
          </div>
        </aside>
        <div className="preview-column">
          <PreviewPane profile={workspace.profile} template={workspace.template} onTemplate={workspace.setTemplate} onProfile={workspace.setProfile} onPageCount={setPageCount} />
          <ActionDock
            busy={workspace.busy}
            onPdf={() => void exportFile('pdf')}
            onDocx={() => void exportFile('docx')}
            onMarkdown={() => void copyMarkdown()}
          />
        </div>
      </div>
      <footer className="status-bar">
        <span>Reoli Resume Forge <small>v2.0.0</small></span>
        <span>Trabalho melhor. Futuro maior.</span>
        <span className="ready-state">{workspace.busy ? <><LoaderCircle className="spin" size={14} /> Processando</> : <><i /> Pronto</>}</span>
      </footer>
      <AnimatePresence>
        {(workspace.error || notice) ? (
          <motion.div
            className={`toast ${workspace.error ? 'error' : ''}`}
            role="status"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
          >
            {workspace.error ? <X size={18} /> : <CheckCircle2 size={18} />}
            <span>{workspace.error || notice}</span>
            {workspace.error ? <button type="button" aria-label="Fechar aviso" onClick={() => workspace.setError(null)}><X size={15} /></button> : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}

function messageOf(reason: unknown): string {
  return reason instanceof Error ? reason.message : String(reason);
}
