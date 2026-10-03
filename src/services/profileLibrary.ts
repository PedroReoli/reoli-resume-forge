import { normalizeResumeProfile } from '../domain/resumeLayout';
import type { ResumeProfile } from '../types/resume';

const STORAGE_KEY = 'reoli-resume.profile-library.v1';
const LIBRARY_VERSION = 1;

export interface SavedProfileRecord {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  profile: ResumeProfile;
}

export interface ProfileLibraryState {
  version: 1;
  activeId: string | null;
  profiles: SavedProfileRecord[];
}

export function emptyProfileLibrary(): ProfileLibraryState {
  return { version: LIBRARY_VERSION, activeId: null, profiles: [] };
}

export function loadProfileLibrary(): ProfileLibraryState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProfileLibrary();
    return normalizeLibrary(JSON.parse(raw));
  } catch {
    return emptyProfileLibrary();
  }
}

export function persistProfileLibrary(library: ProfileLibraryState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
  } catch (reason) {
    throw new Error(
      `Não foi possível salvar os perfis neste computador: ${messageOf(reason)}`,
      { cause: reason },
    );
  }
}

export function createSavedProfile(
  library: ProfileLibraryState,
  requestedName: string,
  profile: ResumeProfile,
): { library: ProfileLibraryState; record: SavedProfileRecord } {
  const timestamp = new Date().toISOString();
  const record: SavedProfileRecord = {
    id: createProfileId(),
    name: uniqueProfileName(library.profiles, requestedName),
    createdAt: timestamp,
    updatedAt: timestamp,
    profile: cloneProfile(profile),
  };
  return {
    record,
    library: {
      ...library,
      activeId: record.id,
      profiles: [record, ...library.profiles],
    },
  };
}

export function updateSavedProfile(
  library: ProfileLibraryState,
  id: string,
  profile: ResumeProfile,
): ProfileLibraryState {
  const timestamp = new Date().toISOString();
  let found = false;
  const profiles = library.profiles.map((record) => {
    if (record.id !== id) return record;
    found = true;
    return { ...record, updatedAt: timestamp, profile: cloneProfile(profile) };
  });
  if (!found) throw new Error('O perfil salvo não foi encontrado.');
  return { ...library, activeId: id, profiles: sortProfiles(profiles) };
}

export function renameSavedProfile(
  library: ProfileLibraryState,
  id: string,
  requestedName: string,
): ProfileLibraryState {
  const current = library.profiles.find((record) => record.id === id);
  if (!current) throw new Error('O perfil salvo não foi encontrado.');
  const peers = library.profiles.filter((record) => record.id !== id);
  const name = uniqueProfileName(peers, requestedName);
  const profiles = library.profiles.map((record) => record.id === id
    ? { ...record, name, updatedAt: new Date().toISOString() }
    : record);
  return { ...library, profiles: sortProfiles(profiles) };
}

export function duplicateSavedProfile(
  library: ProfileLibraryState,
  source: SavedProfileRecord | { name: string; profile: ResumeProfile },
  requestedName?: string,
): { library: ProfileLibraryState; record: SavedProfileRecord } {
  return createSavedProfile(
    library,
    requestedName || `${source.name} — cópia`,
    source.profile,
  );
}

export function removeSavedProfile(library: ProfileLibraryState, id: string): ProfileLibraryState {
  const profiles = library.profiles.filter((record) => record.id !== id);
  if (profiles.length === library.profiles.length) return library;
  return {
    ...library,
    activeId: library.activeId === id ? null : library.activeId,
    profiles,
  };
}

export function setActiveSavedProfile(library: ProfileLibraryState, id: string | null): ProfileLibraryState {
  if (id !== null && !library.profiles.some((record) => record.id === id)) {
    throw new Error('O perfil salvo não foi encontrado.');
  }
  return { ...library, activeId: id };
}

export function uniqueProfileName(profiles: SavedProfileRecord[], requestedName: string): string {
  const base = normalizeProfileName(requestedName);
  const names = new Set(profiles.map((record) => record.name.toLocaleLowerCase('pt-BR')));
  if (!names.has(base.toLocaleLowerCase('pt-BR'))) return base;
  let index = 2;
  while (names.has(`${base} (${index})`.toLocaleLowerCase('pt-BR'))) index += 1;
  return `${base} (${index})`;
}

export function normalizeProfileName(value: string): string {
  const name = value.trim().replace(/\s+/g, ' ').slice(0, 80);
  if (!name) throw new Error('Informe um nome para o perfil.');
  return name;
}

function normalizeLibrary(raw: unknown): ProfileLibraryState {
  if (!raw || typeof raw !== 'object') return emptyProfileLibrary();
  const candidate = raw as Partial<ProfileLibraryState>;
  const profiles = Array.isArray(candidate.profiles)
    ? candidate.profiles.flatMap((value) => normalizeRecord(value))
    : [];
  const activeId = typeof candidate.activeId === 'string'
    && profiles.some((record) => record.id === candidate.activeId)
    ? candidate.activeId
    : null;
  return { version: LIBRARY_VERSION, activeId, profiles: sortProfiles(profiles) };
}

function normalizeRecord(raw: unknown): SavedProfileRecord[] {
  if (!raw || typeof raw !== 'object') return [];
  const value = raw as Partial<SavedProfileRecord>;
  if (typeof value.id !== 'string' || typeof value.name !== 'string' || !value.profile) return [];
  try {
    return [{
      id: value.id,
      name: normalizeProfileName(value.name),
      createdAt: validTimestamp(value.createdAt),
      updatedAt: validTimestamp(value.updatedAt),
      profile: normalizeResumeProfile(value.profile),
    }];
  } catch {
    return [];
  }
}

function validTimestamp(value: unknown): string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
    ? value
    : new Date(0).toISOString();
}

function sortProfiles(profiles: SavedProfileRecord[]): SavedProfileRecord[] {
  return [...profiles].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

function createProfileId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `profile-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function cloneProfile(profile: ResumeProfile): ResumeProfile {
  return structuredClone(normalizeResumeProfile(profile));
}

function messageOf(reason: unknown): string {
  return reason instanceof Error ? reason.message : String(reason);
}
