import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Eye, PencilLine, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActionDock } from '../components/ActionDock';
import { AppHeader } from '../components/AppHeader';
import { DocumentStatusBar, type DocumentSaveState } from '../components/DocumentStatusBar';
import { AtsPanel } from '../components/editor/AtsPanel';
import { ProfileEditor } from '../components/editor/ProfileEditor';
import { SectionNavigator } from '../components/editor/SectionNavigator';
import { WorkspaceControls } from '../components/editor/WorkspaceControls';
import { PreviewPane } from '../components/preview/PreviewPane';
import {
  ProfileLibraryDialog,
  type ProfileDialogIntent,
} from '../components/profiles/ProfileLibraryDialog';
import { useResumeWorkspace } from '../hooks/useResumeWorkspace';
import { exportResume, resumeToMarkdown } from '../services/tauriBridge';
import type { ExportFormat, ResumeProfile } from '../types/resume';

export function App() {
  const workspace = useResumeWorkspace();
  const fileInput = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [profileDialog, setProfileDialog] = useState<{ open: boolean; intent: ProfileDialogIntent }>({
    open: false,
    intent: 'browse',
  });
  const profileFingerprint = useMemo(() => JSON.stringify(workspace.profile), [workspace.profile]);
  const savedFingerprint = useMemo(
    () => workspace.currentSavedProfile ? JSON.stringify(workspace.currentSavedProfile.profile) : null,
    [workspace.currentSavedProfile],
  );
  const hasUnsavedChanges = savedFingerprint
    ? savedFingerprint !== profileFingerprint
    : workspace.canUndo;
  const saveState: DocumentSaveState = hasUnsavedChanges
    ? 'dirty'
    : workspace.currentProfileId ? 'saved' : 'loaded';

  const notify = useCallback((message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 3600);
  }, []);

  const exportFile = useCallback(async (format: ExportFormat) => {
    try {
      const path = await exportResume(workspace.profile, format, workspace.template);
      if (path) {
        notify(exportSuccessMessage(format));
      }
    } catch (reason) {
      workspace.setError(messageOf(reason));
    }
  }, [notify, workspace]);

  const saveLocalProfile = useCallback(() => {
    try {
      if (!workspace.currentProfileId) {
        setProfileDialog({ open: true, intent: 'save' });
        return;
      }
      const saved = workspace.saveCurrentProfile();
      notify(`“${saved.name}” salvo neste computador.`);
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
      if ((!event.ctrlKey && !event.metaKey) || event.altKey) return;
      const key = event.key.toLowerCase();
      const editable = isEditableTarget(event.target);
      if (!editable && (key === 'z' || key === 'y')) {
        event.preventDefault();
        if (key === 'y' || event.shiftKey) workspace.redoProfile();
        else workspace.undoProfile();
        return;
      }
      if (event.shiftKey || !['p', 'd', 'm', 's'].includes(key)) return;
      event.preventDefault();
      if (key === 'p') void exportFile('pdf');
      if (key === 'd') void exportFile('docx');
      if (key === 'm') void copyMarkdown();
      if (key === 's') saveLocalProfile();
    };
    window.addEventListener('keydown', shortcuts);
    return () => window.removeEventListener('keydown', shortcuts);
  }, [copyMarkdown, exportFile, saveLocalProfile, workspace.redoProfile, workspace.undoProfile]);

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
      <AppHeader
        canUndo={workspace.canUndo}
        canRedo={workspace.canRedo}
        hasUnsavedChanges={hasUnsavedChanges}
        onUndo={workspace.undoProfile}
        onRedo={workspace.redoProfile}
        onSave={saveLocalProfile}
        onImport={() => fileInput.current?.click()}
        onNew={() => setProfileDialog({ open: true, intent: 'create' })}
        onManageProfiles={() => setProfileDialog({ open: true, intent: 'browse' })}
        currentProfileName={workspace.currentProfileName}
        savedProfileCount={workspace.savedProfiles.length}
      />
      <input
        ref={fileInput}
        className="visually-hidden"
        type="file"
        accept="application/json,.json"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.currentTarget.value = '';
          void importJson(file);
        }}
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
      <DocumentStatusBar busy={workspace.busy} saveState={saveState} />
      <ProfileLibraryDialog
        open={profileDialog.open}
        intent={profileDialog.intent}
        profiles={workspace.savedProfiles}
        activeId={workspace.currentProfileId}
        currentName={workspace.currentProfileName}
        suggestedName={workspace.profile.person.name}
        onClose={() => setProfileDialog({ open: false, intent: 'browse' })}
        onOpenProfile={(id) => Boolean(workspace.openSavedProfile(id))}
        onCreateProfile={(name) => Boolean(workspace.createProfile(name))}
        onSaveAs={(name) => {
          const saved = workspace.saveCurrentProfile(name);
          notify(`“${saved.name}” salvo neste computador.`);
        }}
        onDuplicateProfile={(id, name) => {
          const saved = workspace.duplicateProfile(id, name);
          notify(`Cópia “${saved.name}” criada.`);
        }}
        onRenameProfile={(id, name) => {
          const saved = workspace.renameProfile(id, name);
          notify(`Perfil renomeado para “${saved.name}”.`);
        }}
        onDeleteProfile={workspace.deleteProfile}
        onImportJson={() => {
          setProfileDialog({ open: false, intent: 'browse' });
          fileInput.current?.click();
        }}
        onExportJson={() => void exportFile('json')}
      />
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

function isEditableTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement
    && (target.matches('input, textarea, select') || target.isContentEditable);
}

function exportSuccessMessage(format: ExportFormat): string {
  if (format === 'json') return 'Perfil exportado como JSON.';
  if (format === 'markdown') return 'Markdown exportado com sucesso.';
  return `${format.toUpperCase()} exportado com sucesso.`;
}
