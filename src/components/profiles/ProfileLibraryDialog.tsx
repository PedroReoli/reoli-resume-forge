import {
  Copy,
  Download,
  FilePlus2,
  FolderOpen,
  Pencil,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useDialogFocus } from '../../hooks/useDialogFocus';
import type { SavedProfileRecord } from '../../services/profileLibrary';

export type ProfileDialogIntent = 'browse' | 'create' | 'save' | 'duplicate-current';

interface ProfileLibraryDialogProps {
  open: boolean;
  intent: ProfileDialogIntent;
  profiles: SavedProfileRecord[];
  activeId: string | null;
  currentName: string;
  suggestedName: string;
  onClose: () => void;
  onOpenProfile: (id: string) => boolean;
  onCreateProfile: (name: string) => boolean;
  onSaveAs: (name: string) => void;
  onDuplicateProfile: (id: string | null, name: string) => void;
  onRenameProfile: (id: string, name: string) => void;
  onDeleteProfile: (id: string) => void;
  onImportJson: () => void;
  onExportJson: () => void;
}

type FormAction =
  | { kind: 'create' }
  | { kind: 'save' }
  | { kind: 'duplicate'; id: string | null }
  | { kind: 'rename'; id: string }
  | null;

export function ProfileLibraryDialog(props: ProfileLibraryDialogProps) {
  const [action, setAction] = useState<FormAction>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useDialogFocus<HTMLElement>(props.open, props.onClose, '[data-dialog-initial-focus="true"]');
  const activeProfile = useMemo(
    () => props.profiles.find((profile) => profile.id === props.activeId) ?? null,
    [props.activeId, props.profiles],
  );

  useEffect(() => {
    if (!props.open) return;
    setError(null);
    if (props.intent === 'create') beginCreate();
    else if (props.intent === 'save') beginSave();
    else if (props.intent === 'duplicate-current') beginDuplicate(null, props.currentName);
    else setAction(null);
  }, [props.intent, props.open]);

  if (!props.open) return null;

  function beginCreate() {
    setAction({ kind: 'create' });
    setName('Meu currículo');
    setError(null);
  }

  function beginSave() {
    setAction({ kind: 'save' });
    setName(props.suggestedName || 'Meu currículo');
    setError(null);
  }

  function beginDuplicate(id: string | null, sourceName: string) {
    setAction({ kind: 'duplicate', id });
    setName(`${sourceName} — cópia`);
    setError(null);
  }

  function beginRename(profile: SavedProfileRecord) {
    setAction({ kind: 'rename', id: profile.id });
    setName(profile.name);
    setError(null);
  }

  function submit() {
    try {
      const value = name.trim();
      if (!value) throw new Error('Informe um nome para continuar.');
      if (action?.kind === 'create') {
        if (!props.onCreateProfile(value)) return;
      } else if (action?.kind === 'save') {
        props.onSaveAs(value);
      } else if (action?.kind === 'duplicate') {
        props.onDuplicateProfile(action.id, value);
      } else if (action?.kind === 'rename') {
        props.onRenameProfile(action.id, value);
        setAction(null);
        return;
      }
      props.onClose();
    } catch (reason) {
      setError(messageOf(reason));
    }
  }

  function openProfile(id: string) {
    try {
      if (props.onOpenProfile(id)) props.onClose();
    } catch (reason) {
      setError(messageOf(reason));
    }
  }

  return (
    <div className="dialog-backdrop profile-library-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && props.onClose()}>
      <section ref={dialogRef} className="profile-library-dialog" role="dialog" aria-modal="true" aria-labelledby="profile-library-title">
        <header>
          <div className="profile-library-title">
            <span className="profile-library-mark" aria-hidden="true"><FolderOpen size={18} /></span>
            <div>
              <h2 id="profile-library-title">Perfis locais</h2>
              <p>Crie variações independentes sem alterar o exemplo público.</p>
            </div>
          </div>
          <button type="button" className="icon-button" aria-label="Fechar perfis" onClick={props.onClose}><X size={17} /></button>
        </header>

        <div className="profile-library-current">
          <div>
            <span>Em edição</span>
            <strong>{activeProfile?.name ?? props.currentName}</strong>
            <small>{activeProfile ? 'Salvo neste computador' : 'Ainda não salvo na biblioteca local'}</small>
          </div>
          <button type="button" className="tailor-button" onClick={activeProfile ? () => props.onClose() : beginSave}>
            <Save size={15} /> {activeProfile ? 'Perfil salvo' : 'Salvar na biblioteca'}
          </button>
        </div>

        <div className="profile-library-toolbar" aria-label="Ações de perfil">
          <button type="button" onClick={beginCreate}><FilePlus2 size={15} /> Criar perfil</button>
          <button type="button" onClick={() => beginDuplicate(null, props.currentName)}><Copy size={15} /> Duplicar atual</button>
          <button type="button" onClick={props.onImportJson}><Upload size={15} /> Importar JSON</button>
          <button type="button" onClick={props.onExportJson}><Download size={15} /> Exportar JSON</button>
        </div>

        {action ? (
          <form className="profile-library-form" onSubmit={(event) => { event.preventDefault(); submit(); }}>
            <label className="field">
              <span>{formLabel(action)}</span>
              <input
                data-dialog-initial-focus="true"
                value={name}
                maxLength={80}
                autoComplete="off"
                onChange={(event) => setName(event.target.value)}
                onFocus={(event) => event.currentTarget.select()}
              />
            </label>
            <div>
              <button type="button" className="quiet-button" onClick={() => { setAction(null); setError(null); }}>Cancelar</button>
              <button type="submit" className="tailor-button" disabled={!name.trim()}>{formActionLabel(action)}</button>
            </div>
            {error ? <p className="profile-library-error" role="alert">{error}</p> : null}
          </form>
        ) : null}

        <div className="profile-library-list-heading">
          <span>Biblioteca</span>
          <small>{props.profiles.length} {props.profiles.length === 1 ? 'perfil' : 'perfis'}</small>
        </div>

        <div className="profile-library-list">
          {props.profiles.length ? props.profiles.map((profile) => {
            const active = profile.id === props.activeId;
            return (
              <article key={profile.id} className={`profile-library-item ${active ? 'is-active' : ''}`}>
                <button type="button" className="profile-library-open" disabled={active} onClick={() => openProfile(profile.id)}>
                  <span className="profile-library-avatar" aria-hidden="true">{profile.name.slice(0, 1).toLocaleUpperCase('pt-BR')}</span>
                  <span>
                    <strong>{profile.name}</strong>
                    <small>Atualizado {formatDate(profile.updatedAt)}</small>
                  </span>
                  {active ? <em>Em edição</em> : <em>Abrir</em>}
                </button>
                <div className="profile-library-item-actions" aria-label={`Ações de ${profile.name}`}>
                  <button type="button" title="Renomear" aria-label={`Renomear ${profile.name}`} onClick={() => beginRename(profile)}><Pencil size={14} /></button>
                  <button type="button" title="Duplicar" aria-label={`Duplicar ${profile.name}`} onClick={() => beginDuplicate(profile.id, profile.name)}><Copy size={14} /></button>
                  <button type="button" title="Excluir" aria-label={`Excluir ${profile.name}`} onClick={() => props.onDeleteProfile(profile.id)}><Trash2 size={14} /></button>
                </div>
              </article>
            );
          }) : (
            <div className="profile-library-empty">
              <FilePlus2 size={22} />
              <strong>Nenhum perfil local ainda</strong>
              <p>Crie um perfil em branco ou salve o documento em edição.</p>
              <button type="button" className="tailor-button" onClick={beginCreate}>Criar primeiro perfil</button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function formLabel(action: Exclude<FormAction, null>): string {
  if (action.kind === 'rename') return 'Novo nome do perfil';
  if (action.kind === 'duplicate') return 'Nome da cópia';
  if (action.kind === 'save') return 'Nome para salvar';
  return 'Nome do novo perfil';
}

function formActionLabel(action: Exclude<FormAction, null>): string {
  if (action.kind === 'rename') return 'Renomear';
  if (action.kind === 'duplicate') return 'Criar cópia';
  if (action.kind === 'save') return 'Salvar perfil';
  return 'Criar perfil';
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
    .format(new Date(value));
}

function messageOf(reason: unknown): string {
  return reason instanceof Error ? reason.message : String(reason);
}
