import { useCallback, useEffect, useMemo, useState } from 'react';
import { createBlankProfile } from '../data/blankProfile';
import {
  applyResumeTemplate,
  localizeProfile,
  normalizeResumeProfile,
  profileTemplate,
} from '../domain/resumeLayout';
import {
  createSavedProfile,
  duplicateSavedProfile,
  loadProfileLibrary,
  persistProfileLibrary,
  removeSavedProfile,
  renameSavedProfile,
  setActiveSavedProfile,
  updateSavedProfile,
  type ProfileLibraryState,
  type SavedProfileRecord,
} from '../services/profileLibrary';
import {
  analyzeMatch,
  DEFAULT_ARCHETYPE_ID,
  fallbackArchetypes,
  listArchetypes,
  loadArchetype,
  tailorProfile,
} from '../services/tauriBridge';
import type {
  ArchetypeMetadata,
  MatchReport,
  ResumeProfile,
  ResumeLocale,
  ResumeTemplate,
} from '../types/resume';
import { useProfileHistory } from './useProfileHistory';

export function useResumeWorkspace() {
  const initialLibrary = useMemo(() => loadProfileLibrary(), []);
  const initialSavedProfile = activeRecord(initialLibrary);
  const initialProfile = useMemo(
    () => initialSavedProfile?.profile ?? createBlankProfile(),
    [initialSavedProfile],
  );
  const [library, setLibrary] = useState(initialLibrary);
  const [archetypes, setArchetypes] = useState<ArchetypeMetadata[]>(fallbackArchetypes);
  const [archetypeId, setArchetypeId] = useState(
    initialSavedProfile ? 'custom' : DEFAULT_ARCHETYPE_ID,
  );
  const {
    profile,
    setProfile,
    replaceProfile,
    undo,
    redo,
    canUndo,
    canRedo,
    profileGeneration,
  } = useProfileHistory(initialProfile);
  const [jobDescription, setJobDescription] = useState('');
  const [report, setReport] = useState<MatchReport | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedArchetype = useMemo(
    () => archetypes.find((item) => item.id === archetypeId),
    [archetypeId, archetypes],
  );
  const currentSavedProfile = useMemo(
    () => library.profiles.find((item) => item.id === library.activeId) ?? null,
    [library],
  );
  const template = profileTemplate(profile);

  const commitLibrary = useCallback((nextLibrary: ProfileLibraryState) => {
    persistProfileLibrary(nextLibrary);
    setLibrary(nextLibrary);
  }, []);

  const setTemplate = useCallback((nextTemplate: ResumeTemplate) => {
    setProfile((current) => applyResumeTemplate(current, nextTemplate));
  }, [setProfile]);

  useEffect(() => {
    let active = true;
    const profilePromise = initialSavedProfile
      ? Promise.resolve(initialSavedProfile.profile)
      : loadArchetype(DEFAULT_ARCHETYPE_ID);
    Promise.all([listArchetypes(), profilePromise])
      .then(([items, loaded]) => {
        if (!active) return;
        setArchetypes(items);
        if (!initialSavedProfile) replaceProfile(loaded);
      })
      .catch((reason: unknown) => active && setError(messageOf(reason)))
      .finally(() => active && setBusy(false));
    return () => {
      active = false;
    };
  }, [initialSavedProfile, replaceProfile]);

  useEffect(() => {
    if (jobDescription.trim().length < 20) {
      setReport(null);
      return;
    }
    const timer = window.setTimeout(() => {
      analyzeMatch(profile, jobDescription)
        .then(setReport)
        .catch((reason: unknown) => setError(messageOf(reason)));
    }, 420);
    return () => window.clearTimeout(timer);
  }, [jobDescription, profile]);

  const selectArchetype = useCallback(async (id: string) => {
    if (!confirmProfileReplacement(canUndo, 'Carregar o exemplo público')) return;
    setBusy(true);
    setError(null);
    try {
      replaceProfile(await loadArchetype(id));
      commitLibrary(setActiveSavedProfile(library, null));
      setArchetypeId(id);
      setJobDescription('');
      setReport(null);
    } catch (reason) {
      setError(messageOf(reason));
    } finally {
      setBusy(false);
    }
  }, [canUndo, commitLibrary, library, replaceProfile]);

  const selectLocale = useCallback(
    async (nextLocale: string) => {
      const normalized = nextLocale === 'en-US' || nextLocale === 'es-ES' ? nextLocale : 'pt-BR';
      setProfile((current) => localizeProfile(current, normalized));
      setArchetypeId('custom');
    },
    [setProfile],
  );

  const locale = (profile.config.locale as ResumeLocale | undefined) ?? 'pt-BR';

  const saveCurrentProfile = useCallback((name?: string): SavedProfileRecord => {
    if (library.activeId) {
      const nextLibrary = updateSavedProfile(library, library.activeId, profile);
      commitLibrary(nextLibrary);
      return nextLibrary.profiles.find((record) => record.id === library.activeId)!;
    }
    if (!name) throw new Error('Escolha um nome antes de salvar este perfil.');
    const created = createSavedProfile(library, name, profile);
    commitLibrary(created.library);
    setArchetypeId('custom');
    return created.record;
  }, [commitLibrary, library, profile]);

  const createProfile = useCallback((name: string): SavedProfileRecord | null => {
    if (!confirmProfileReplacement(canUndo, 'Criar outro perfil')) return null;
    const created = createSavedProfile(library, name, createBlankProfile(locale));
    commitLibrary(created.library);
    replaceProfile(created.record.profile);
    setArchetypeId('custom');
    setJobDescription('');
    setReport(null);
    return created.record;
  }, [canUndo, commitLibrary, library, locale, replaceProfile]);

  const openSavedProfile = useCallback((id: string): SavedProfileRecord | null => {
    const record = library.profiles.find((item) => item.id === id);
    if (!record) throw new Error('O perfil salvo não foi encontrado.');
    if (id === library.activeId) return record;
    if (!confirmProfileReplacement(canUndo, `Abrir “${record.name}”`)) return null;
    commitLibrary(setActiveSavedProfile(library, id));
    replaceProfile(structuredClone(record.profile));
    setArchetypeId('custom');
    setJobDescription('');
    setReport(null);
    return record;
  }, [canUndo, commitLibrary, library, replaceProfile]);

  const duplicateProfile = useCallback((id: string | null, name?: string): SavedProfileRecord => {
    const source = id
      ? library.profiles.find((record) => record.id === id)
      : { name: currentSavedProfile?.name ?? profile.person.name ?? 'Perfil', profile };
    if (!source) throw new Error('O perfil que seria duplicado não foi encontrado.');
    const created = duplicateSavedProfile(library, source, name);
    commitLibrary(created.library);
    replaceProfile(created.record.profile);
    setArchetypeId('custom');
    setJobDescription('');
    setReport(null);
    return created.record;
  }, [commitLibrary, currentSavedProfile, library, profile, replaceProfile]);

  const renameProfile = useCallback((id: string, name: string): SavedProfileRecord => {
    const nextLibrary = renameSavedProfile(library, id, name);
    commitLibrary(nextLibrary);
    return nextLibrary.profiles.find((record) => record.id === id)!;
  }, [commitLibrary, library]);

  const deleteProfile = useCallback((id: string): void => {
    const record = library.profiles.find((item) => item.id === id);
    if (!record) return;
    if (!window.confirm(`Excluir “${record.name}” deste computador? O arquivo JSON exportado não será afetado.`)) return;
    commitLibrary(removeSavedProfile(library, id));
  }, [commitLibrary, library]);

  const importProfile = useCallback((next: ResumeProfile) => {
    if (!confirmProfileReplacement(canUndo, 'Importar outro perfil')) return;
    const normalized = normalizeResumeProfile(next);
    assertProfile(normalized);
    replaceProfile(normalized);
    commitLibrary(setActiveSavedProfile(library, null));
    setArchetypeId('custom');
    setReport(null);
  }, [canUndo, commitLibrary, library, replaceProfile]);

  const applyTailoring = useCallback(async () => {
    if (jobDescription.trim().length < 20) {
      throw new Error('Cole uma descrição de vaga com pelo menos 20 caracteres.');
    }
    setBusy(true);
    try {
      const result = await tailorProfile(profile, jobDescription, archetypeId);
      setProfile(result.profile);
      setReport(result.report);
      return result;
    } finally {
      setBusy(false);
    }
  }, [archetypeId, jobDescription, profile, setProfile]);

  return {
    archetypes,
    archetypeId,
    profile,
    setProfile,
    undoProfile: undo,
    redoProfile: redo,
    canUndo,
    canRedo,
    profileGeneration,
    jobDescription,
    setJobDescription,
    report,
    template,
    setTemplate,
    locale,
    selectedArchetype,
    busy,
    error,
    setError,
    savedProfiles: library.profiles,
    currentProfileId: library.activeId,
    currentSavedProfile,
    currentProfileName: currentSavedProfile?.name ?? selectedArchetype?.label ?? profile.person.name,
    selectArchetype,
    selectLocale,
    saveCurrentProfile,
    createProfile,
    openSavedProfile,
    duplicateProfile,
    renameProfile,
    deleteProfile,
    importProfile,
    applyTailoring,
  };
}

function activeRecord(library: ProfileLibraryState): SavedProfileRecord | null {
  return library.profiles.find((record) => record.id === library.activeId) ?? null;
}

function confirmProfileReplacement(hasEdits: boolean, action: string): boolean {
  return !hasEdits || window.confirm(`${action} descarta o histórico de edição atual. Continuar?`);
}

function assertProfile(value: ResumeProfile): void {
  if (!value || typeof value !== 'object' || !value.person || !value.config) {
    throw new Error('O JSON não possui a estrutura de um perfil do Resume Forge.');
  }
  if (!value.person.name || !value.headline || !value.summary) {
    throw new Error('O perfil deve conter nome, headline e resumo.');
  }
  if (!Array.isArray(value.experience)) {
    throw new Error('O campo experience deve ser uma lista.');
  }
}

function messageOf(reason: unknown): string {
  return reason instanceof Error ? reason.message : String(reason);
}
