import { useCallback, useEffect, useMemo, useState } from 'react';
import { createBlankProfile } from '../data/blankProfile';
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
  ResumeTemplate,
} from '../types/resume';

const INITIAL_ARCHETYPE = '01_frontend';

export function useResumeWorkspace() {
  const [archetypes, setArchetypes] = useState<ArchetypeMetadata[]>(fallbackArchetypes);
  const [archetypeId, setArchetypeId] = useState(INITIAL_ARCHETYPE);
  const [profile, setProfile] = useState<ResumeProfile>(() => createBlankProfile());
  const [jobDescription, setJobDescription] = useState('');
  const [report, setReport] = useState<MatchReport | null>(null);
  const [template, setTemplate] = useState<ResumeTemplate>('clean');
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const locale = useMemo(
    () => archetypes.find((item) => item.id === archetypeId)?.locale ?? 'pt-BR',
    [archetypeId, archetypes],
  );

  useEffect(() => {
    let active = true;
    Promise.all([listArchetypes(), loadArchetype(INITIAL_ARCHETYPE)])
      .then(([items, loaded]) => {
        if (!active) return;
        setArchetypes(items);
        setProfile(loaded);
      })
      .catch((reason: unknown) => active && setError(messageOf(reason)))
      .finally(() => active && setBusy(false));
    return () => {
      active = false;
    };
  }, []);

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
    setBusy(true);
    setError(null);
    try {
      setProfile(await loadArchetype(id));
      setArchetypeId(id);
    } catch (reason) {
      setError(messageOf(reason));
    } finally {
      setBusy(false);
    }
  }, []);

  const selectLocale = useCallback(
    async (nextLocale: string) => {
      if (nextLocale.startsWith('en')) {
        await selectArchetype('05_internacional_en');
      } else if (locale.startsWith('en')) {
        await selectArchetype('01_frontend');
      }
    },
    [locale, selectArchetype],
  );

  const newProfile = useCallback(() => {
    setProfile(createBlankProfile(locale));
    setArchetypeId('custom');
    setJobDescription('');
    setReport(null);
  }, [locale]);

  const importProfile = useCallback((next: ResumeProfile) => {
    assertProfile(next);
    setProfile(next);
    setArchetypeId('custom');
    setReport(null);
  }, []);

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
    jobDescription,
    setJobDescription,
    report,
    template,
    setTemplate,
    locale,
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
