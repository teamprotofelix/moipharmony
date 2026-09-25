/**
 * Client state (plan §5):
 * - sessionStorage: experience state (case, steps, selections, trace, review) —
 *   restored after refresh and across pages; cleared by "초기화/기록 지우기".
 * - localStorage: language and theme ONLY.
 * - Shared URLs carry synthetic case IDs, enum versions and steps only —
 *   never original text, free input or real application numbers.
 */
import type { ReviewDecision } from '../data/types';

export interface ExperienceState {
  caseId: string;
  step: number;
  krVersion: string;
  jpVersion: string;
  comparisonDate: string;
  familyConfidence: number | null; // null = case default
  d1DateOverride: string | null;
  translation: 'verified' | 'uncertain' | 'missing';
  missingDocs: string[];
  challengeSpans: string[];
  familyViewed: boolean;
  citationsConfirmed: boolean;
  d1EvidenceViewed: boolean;
  blindDone: boolean;
  groundsOpened: boolean;
  reviewerDecision: ReviewDecision | null;
  reviewerReason: string;
  role: 'KR' | 'JP' | 'RESEARCHER';
}

const SESSION_KEY = 'kj-eqh.experience';
const WORKSPACE_KEY = 'kj-eqh.workspace';

export function defaultState(caseId = 'H-01'): ExperienceState {
  return {
    caseId,
    step: 1,
    krVersion: '',
    jpVersion: '',
    comparisonDate: '',
    familyConfidence: null,
    d1DateOverride: null,
    translation: 'verified',
    missingDocs: [],
    challengeSpans: [],
    familyViewed: false,
    citationsConfirmed: false,
    d1EvidenceViewed: false,
    blindDone: false,
    groundsOpened: false,
    reviewerDecision: null,
    reviewerReason: '',
    role: 'JP',
  };
}

function readSession(): Partial<ExperienceState> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<ExperienceState>;
    // Data guard: only whitelisted enum values may be restored.
    if (
      parsed.translation !== 'verified' &&
      parsed.translation !== 'uncertain' &&
      parsed.translation !== 'missing'
    ) {
      parsed.translation = 'verified';
    }
    if (!['CONFIRMED_GAP', 'REJECTED', 'LEGAL_DIVERGENCE', 'DEFERRED', null, undefined].includes(parsed.reviewerDecision as never)) {
      parsed.reviewerDecision = null;
    }
    return parsed;
  } catch {
    return {};
  }
}

export function loadState(): ExperienceState {
  return { ...defaultState(), ...readSession() };
}

export function saveState(state: ExperienceState): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch {
    /* sessionStorage blocked — the page still works in-memory */
  }
  // Let the sticky case summary bar (and any trace view) re-render.
  window.dispatchEvent(new CustomEvent('kj-eqh:state'));
}

export function clearState(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(SESSION_KEY);
    window.sessionStorage.removeItem(WORKSPACE_KEY);
  } catch {
    /* blocked */
  }
}

/** Workspace-local state (blind check progress, report drafts). */
export interface WorkspaceState {
  role: 'KR' | 'JP' | 'RESEARCHER' | null;
  blindDone: boolean;
  groundsOpened: boolean;
  decision: ReviewDecision | null;
  reason: string;
}

export function loadWorkspace(): WorkspaceState {
  if (typeof window === 'undefined') return { role: null, blindDone: false, groundsOpened: false, decision: null, reason: '' };
  try {
    const raw = window.sessionStorage.getItem(WORKSPACE_KEY);
    if (!raw) return { role: null, blindDone: false, groundsOpened: false, decision: null, reason: '' };
    return JSON.parse(raw) as WorkspaceState;
  } catch {
    return { role: null, blindDone: false, groundsOpened: false, decision: null, reason: '' };
  }
}

export function saveWorkspace(state: WorkspaceState): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(WORKSPACE_KEY, JSON.stringify(state));
  } catch {
    /* blocked */
  }
}

/** Shared-URL encoder: enum values only, no originals, no free input. */
export function shareableUrl(base: URL, state: ExperienceState): string {
  const u = new URL(base.toString());
  u.searchParams.set('case', state.caseId);
  if (state.step > 1) u.searchParams.set('step', String(state.step));
  if (state.krVersion) u.searchParams.set('kr', state.krVersion);
  if (state.jpVersion) u.searchParams.set('jp', state.jpVersion);
  if (state.comparisonDate) u.searchParams.set('date', state.comparisonDate);
  return u.toString();
}

/** Safe query-param reader for the experience page. */
export function stateFromUrl(url: URL, fallback: ExperienceState): ExperienceState {
  const s = { ...fallback };
  const caseId = url.searchParams.get('case');
  const step = Number(url.searchParams.get('step'));
  const kr = url.searchParams.get('kr');
  const jp = url.searchParams.get('jp');
  const date = url.searchParams.get('date');
  if (caseId && /^H-0[1-8]$/.test(caseId)) s.caseId = caseId;
  if (Number.isInteger(step) && step >= 1 && step <= 8) s.step = step;
  if (kr && /^h\d\d\.(kr|jp)\.v\d$/.test(kr)) s.krVersion = kr;
  if (jp && /^h\d\d\.(kr|jp)\.v\d$/.test(jp)) s.jpVersion = jp;
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) s.comparisonDate = date;
  return s;
}
