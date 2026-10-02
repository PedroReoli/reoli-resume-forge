import { useCallback, useEffect, useMemo, useState } from 'react';
import { createBlankProfile } from '../data/blankProfile';
import { localizeProfile, normalizeResumeProfile } from '../domain/resumeLayout';
import {
  analyzeMatch,
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

const INITIAL_ARCHETYPE = '01_frontend';

export function useResumeWorkspace() {
  const initialProfile = useMemo(() => createBlankProfile(), []);
  const [archetypes, setArchetypes] = useState<ArchetypeMetadata[]>(fallbackArchetypes);
  const [archetypeId, setArchetypeId] = useState(INITIAL_ARCHETYPE);
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
  const [template, setTemplate] = useState<ResumeTemplate>('classic');
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedArchetype = useMemo(
    () => archetypes.find((item) => item.id === archetypeId),
    [archetypeId, archetypes],
  );

  useEffect(() => {
    let active = true;
    Promise.all([listArchetypes(), loadArchetype(INITIAL_ARCHETYPE)])
      .then(([items, loaded]) => {
        if (!active) return;
        setArchetypes(items);
        replaceProfile(loaded);
      })
      .catch((reason: unknown) => active && setError(messageOf(reason)))
      .finally(() => active && setBusy(false));
    return () => {
      active = false;
    };
  }, [replaceProfile]);

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
    if (canUndo && !window.confirm('Trocar de arquétipo descarta o histórico de edição atual. Continuar?')) return;
    setBusy(true);
    setError(null);
    try {
      replaceProfile(await loadArchetype(id));
      setArchetypeId(id);
    } catch (reason) {
      setError(messageOf(reason));
    } finally {
      setBusy(false);
    }
  }, [canUndo, replaceProfile]);

  const selectLocale = useCallback(
    async (nextLocale: string) => {
      const normalized = nextLocale === 'en-US' || nextLocale === 'es-ES' ? nextLocale : 'pt-BR';
      setProfile((current) => localizeProfile(current, normalized));
      setArchetypeId('custom');
    },
    [],
  );

  const locale = (profile.config.locale as ResumeLocale | undefined) ?? 'pt-BR';

  const newProfile = useCallback(() => {
    if (canUndo && !window.confirm('Criar um novo perfil descarta o histórico de edição atual. Continuar?')) return;
    replaceProfile(createBlankProfile(locale));
    setArchetypeId('custom');
    setJobDescription('');
    setReport(null);
  }, [canUndo, locale, replaceProfile]);

  const importProfile = useCallback((next: ResumeProfile) => {
    if (canUndo && !window.confirm('Importar outro perfil descarta o histórico de edição atual. Continuar?')) return;
    const normalized = normalizeResumeProfile(next);
    assertProfile(normalized);
    replaceProfile(normalized);
    setArchetypeId('custom');
    setReport(null);
  }, [canUndo, replaceProfile]);

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
  }, [archetypeId, jobDescription, profile]);

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
    selectArchetype,
    selectLocale,
    newProfile,
    importProfile,
    applyTailoring,
  };
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
