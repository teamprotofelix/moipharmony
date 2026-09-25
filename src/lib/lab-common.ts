/**
 * Shared scaffolding for the five labs: case selector, state bootstrap,
 * deterministic evaluation from the shared experience state, trace panel.
 */
import type { HarmonyCase, HarmonyTrace } from '../data/types';
import type { Lang } from '../i18n';
import { dicts } from '../i18n';
import { cases, CASE_IDS } from '../data';
import { evaluateHarmony } from './evaluate';
import { h, clear, renderTrace } from './ui';
import { loadState, saveState, defaultState, type ExperienceState } from './state';

export interface LabCtx {
  lang: Lang;
  d: Record<string, string>;
  t: (k: string) => string;
  state: ExperienceState;
  c: HarmonyCase;
  evalNow: () => HarmonyTrace;
  persist: () => void;
}

export function initLab(): LabCtx {
  const lang = (new URLSearchParams(location.search).get('lang') || 'ko') as Lang;
  const d = dicts[lang] as Record<string, string>;
  const t = (k: string): string => d[k] ?? k;

  const saved = loadState();
  const state: ExperienceState = saved.caseId && cases[saved.caseId] ? saved : defaultState();
  if (!cases[state.caseId]) state.caseId = 'H-01';
  const c = cases[state.caseId];

  // Ensure valid selections exist for the loaded case.
  const kr = c.claimVersions.find((v) => v.office === 'KR');
  const jp = c.claimVersions.find((v) => v.office === 'JP');
  const krIds = c.claimVersions.filter((v) => v.office === 'KR').map((v) => v.id);
  const jpIds = c.claimVersions.filter((v) => v.office === 'JP').map((v) => v.id);
  if (!krIds.includes(state.krVersion)) state.krVersion = kr?.id ?? '';
  if (!jpIds.includes(state.jpVersion)) state.jpVersion = jp?.id ?? '';
  const retrieval = c.events.KR.find((e) => e.type === 'retrieval');
  if (!state.comparisonDate || state.comparisonDate < (jp?.effectiveDate ?? '')) {
    state.comparisonDate = retrieval?.date ?? '';
  }
  if (!kr || !jp) state.comparisonDate = retrieval?.date ?? '';

  const persist = () => saveState(state);

  const evalNow = (): HarmonyTrace =>
    evaluateHarmony({
      case: c,
      selectedVersions: { kr: state.krVersion, jp: state.jpVersion },
      comparisonDate: state.comparisonDate,
      documentAvailability: Object.fromEntries(state.missingDocs.map((x) => [x, 'missing' as const])),
      translationVerification: state.translation,
      priorArtDateOverride: state.d1DateOverride ? { D1: state.d1DateOverride } : undefined,
      reviewerEdits: {
        decision: state.reviewerDecision ?? undefined,
        challengeSpans: state.challengeSpans,
      },
      familyConfidenceOverride: state.familyConfidence ?? undefined,
    });

  return { lang, d, t, state, c, evalNow, persist };
}

/** Case selector + scenario / expectation / point cards. */
export function renderCaseSelector(
  ctx: LabCtx,
  onChange: () => void,
): HTMLElement {
  const { lang, d, t, state } = ctx;
  const wrap = h('div', { class: 'card' });
  const select = h('select', { style: 'font:inherit;padding:6px 10px', 'aria-label': t('labCase.select') });
  for (const id of CASE_IDS) {
    select.append(h('option', { value: id, selected: id === state.caseId ? 'true' : undefined }, [t(`cases.${id.toLowerCase()}.title`)]));
  }
  select.addEventListener('change', () => {
    // Switching cases resets to that case's defaults; the reload restores
    // the new state from sessionStorage (same page, same language).
    const fresh = defaultState(select.value);
    saveState(fresh);
    onChange();
  });

  const c = cases[state.caseId];
  wrap.append(
    h('p', { style: 'margin:0 0 8px' }, [h('strong', {}, [t('labCase.select')]), ' ']),
    select,
    h('p', { style: 'margin:8px 0 0' }, [
      h('span', { class: 'badge badge--fictional' }, [t('labCase.synthetic')]),
      ' ',
      h('strong', {}, [t('labCase.scenario')]),
      ': ',
      t(`cases.${state.caseId.toLowerCase()}.scenario`),
    ]),
    h('p', { class: 'small', style: 'margin:4px 0 0' }, [
      h('strong', {}, [t('labCase.expectation')]),
      ': ',
      t(`cases.${state.caseId.toLowerCase()}.expectation`),
    ]),
    h('p', { class: 'small', style: 'margin:4px 0 0' }, [
      t(`cases.${state.caseId.toLowerCase()}.point`),
    ]),
    h('p', { class: 'callout callout--sim', style: 'margin:10px 0 0' }, [t('labCase.syntheticHint')]),
  );
  return wrap;
}

/** Trace panel with the two expansion questions. */
export function renderLabTraceCard(ctx: LabCtx): HTMLElement {
  const { lang, d, t, c, evalNow } = ctx;
  const card = h('section', { class: 'card' });
  card.append(
    h('h2', { class: 'mt-0' }, ['Evidence Trace']),
    renderTrace(lang, c, evalNow()),
    h('details', { class: 'expander' }, [
      h('summary', {}, [t('common.whySignal')]),
      h('div', { class: 'expander__body' }, [h('p', {}, [t('labDisc.whyBody')])]),
    ]),
    h('details', { class: 'expander' }, [
      h('summary', {}, [t('common.whatChange')]),
      h('div', { class: 'expander__body' }, [h('p', {}, [t('labDisc.whatBody')])]),
    ]),
  );
  return card;
}

/** Mount helper: replace the target region with freshly rendered content. */
export function mount(id: string, node: Node): void {
  const el = document.getElementById(id);
  if (el) clear(el).append(node);
}
