import { useCallback, useReducer } from 'react';
import type { ResumeProfile } from '../types/resume';

const HISTORY_LIMIT = 80;
const CHANGE_BURST_MS = 850;

type ProfileUpdater = ResumeProfile | ((current: ResumeProfile) => ResumeProfile);

interface HistoryState {
  past: ResumeProfile[];
  present: ResumeProfile;
  future: ResumeProfile[];
  generation: number;
  lastChangeKey: string | null;
  lastChangeAt: number;
}

type HistoryAction =
  | { type: 'set'; updater: ProfileUpdater; at: number }
  | { type: 'replace'; profile: ResumeProfile }
  | { type: 'undo' }
  | { type: 'redo' };

export function useProfileHistory(initialProfile: ResumeProfile) {
  const [history, dispatch] = useReducer(historyReducer, initialProfile, createHistory);

  const setProfile = useCallback((updater: ProfileUpdater) => {
    dispatch({ type: 'set', updater, at: Date.now() });
  }, []);
  const replaceProfile = useCallback((profile: ResumeProfile) => {
    dispatch({ type: 'replace', profile });
  }, []);
  const undo = useCallback(() => dispatch({ type: 'undo' }), []);
  const redo = useCallback(() => dispatch({ type: 'redo' }), []);

  return {
    profile: history.present,
    setProfile,
    replaceProfile,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    profileGeneration: history.generation,
  };
}

function createHistory(profile: ResumeProfile, generation = 0): HistoryState {
  return {
    past: [],
    present: profile,
    future: [],
    generation,
    lastChangeKey: null,
    lastChangeAt: 0,
  };
}

function historyReducer(state: HistoryState, action: HistoryAction): HistoryState {
  if (action.type === 'replace') return createHistory(action.profile, state.generation + 1);

  if (action.type === 'undo') {
    const previous = state.past.at(-1);
    if (!previous) return state;
    return {
      past: state.past.slice(0, -1),
      present: previous,
      future: [state.present, ...state.future].slice(0, HISTORY_LIMIT),
      generation: state.generation,
      lastChangeKey: null,
      lastChangeAt: 0,
    };
  }

  if (action.type === 'redo') {
    const [next, ...future] = state.future;
    if (!next) return state;
    return {
      past: [...state.past, state.present].slice(-HISTORY_LIMIT),
      present: next,
      future,
      generation: state.generation,
      lastChangeKey: null,
      lastChangeAt: 0,
    };
  }

  const next = typeof action.updater === 'function' ? action.updater(state.present) : action.updater;
  if (next === state.present) return state;
  const changeKey = changedPath(state.present, next);
  const coalesces = state.future.length === 0
    && state.lastChangeKey === changeKey
    && action.at - state.lastChangeAt <= CHANGE_BURST_MS;

  return {
    past: coalesces ? state.past : [...state.past, state.present].slice(-HISTORY_LIMIT),
    present: next,
    future: [],
    generation: state.generation,
    lastChangeKey: changeKey,
    lastChangeAt: action.at,
  };
}

function changedPath(before: unknown, after: unknown, path = 'profile'): string {
  if (Object.is(before, after)) return path;
  if (!isObject(before) || !isObject(after)) return path;

  if (Array.isArray(before) || Array.isArray(after)) {
    if (!Array.isArray(before) || !Array.isArray(after) || before.length !== after.length) return path;
    const changedIndexes = before.flatMap((value, index) => Object.is(value, after[index]) ? [] : [index]);
    return changedIndexes.length === 1
      ? changedPath(before[changedIndexes[0]], after[changedIndexes[0]], `${path}.${changedIndexes[0]}`)
      : path;
  }

  const beforeRecord = before as Record<string, unknown>;
  const afterRecord = after as Record<string, unknown>;
  const keys = Array.from(new Set([...Object.keys(beforeRecord), ...Object.keys(afterRecord)]));
  const changedKeys = keys.filter((key) => !Object.is(beforeRecord[key], afterRecord[key]));
  return changedKeys.length === 1
    ? changedPath(beforeRecord[changedKeys[0]], afterRecord[changedKeys[0]], `${path}.${changedKeys[0]}`)
    : path;
}

function isObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null;
}
