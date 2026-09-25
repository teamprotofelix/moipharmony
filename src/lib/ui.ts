/**
 * Small shared DOM helpers used by the experience page and the labs.
 * All dynamic UI is keyboard-accessible (native elements) and text-first.
 */
import type { HarmonyCase, HarmonyTrace, SourceSpan } from '../data/types';
import type { Lang } from '../i18n';
import { dicts } from '../i18n';

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Record<string, unknown> = {},
  children: Array<Node | string | null | undefined | false> = [],
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') el.className = String(v);
    else if (k === 'html') el.innerHTML = String(v);
    else if (k.startsWith('on') && typeof v === 'function') {
      el.addEventListener(k.slice(2).toLowerCase(), v as EventListener);
    } else {
      el.setAttribute(k, String(v));
    }
  }
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue;
    el.append(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return el;
}

export function clear(el: HTMLElement): HTMLElement {
  el.replaceChildren();
  return el;
}

export function spanOfCase(c: HarmonyCase, id: string): SourceSpan | undefined {
  return c.sourceSpans.find((s) => s.id === id);
}

export function docLabel(c: HarmonyCase, spanId: string): string {
  const span = spanOfCase(c, spanId);
  const doc = span ? c.documents.find((d) => d.id === span.documentId) : undefined;
  return doc ? doc.label.ko : spanId;
}

/** "D1 [0012] (p.5)" style location descriptor. */
export function spanLocation(c: HarmonyCase, spanId: string): string {
  const span = spanOfCase(c, spanId);
  if (!span) return spanId;
  const parts = [span.documentId.toUpperCase(), span.paragraph ?? '', span.page ? `p.${span.page}` : ''].filter(Boolean);
  return parts.join(' ');
}

export function verdictLabel(lang: Lang, v: string): string {
  const d = dicts[lang] as Record<string, string>;
  return d[`verdict.${v}`] ?? v;
}

export function clsLabel(lang: Lang, c: string): string {
  const d = dicts[lang] as Record<string, string>;
  return d[`cls.${c}`] ?? c;
}

export function expKeyLabel(lang: Lang, key: string): string {
  const d = dicts[lang] as Record<string, string>;
  return d[`expKey.${key}`] ?? key;
}

export function verdictChip(lang: Lang, verdict: HarmonyTrace['verdict']): HTMLElement {
  const chip = h('span', {
    class: `verdict verdict--${verdict}`,
    role: 'status',
  });
  chip.textContent = verdictLabel(lang, verdict);
  return chip;
}

/**
 * Render an Evidence Trace as a <dl class="trace">. Every field is plain text
 * (the verdict chip is the only styled part) so screen readers get it all.
 */
export function renderTrace(
  lang: Lang,
  c: HarmonyCase,
  trace: HarmonyTrace,
): HTMLElement {
  const d = dicts[lang] as Record<string, string>;
  const dl = h('dl', { class: 'trace' });
  const kv = (k: string, v: string | HTMLElement) => {
    dl.append(h('dt', {}, [d[k] ?? k]));
    const dd = h('dd');
    dd.append(v);
    dl.append(dd);
  };

  const kr = c.claimVersions.find((x) => x.id === trace.selectedKrClaimVersionId);
  const jp = c.claimVersions.find((x) => x.id === trace.selectedJpClaimVersionId);
  kv('labDisc.traceFields.selectedVersions', `${kr?.id ?? trace.selectedKrClaimVersionId} (${kr?.effectiveDate ?? '—'}) · ${jp?.id ?? trace.selectedJpClaimVersionId} (${jp?.effectiveDate ?? '—'})`);
  kv('labDisc.traceFields.comparisonDate', trace.comparisonDate);
  kv('labDisc.traceFields.rule', trace.ruleId);
  kv('labDisc.traceFields.ruleVersion', trace.ruleVersion);

  const clsText = trace.divergence.length > 0 ? trace.divergence.map((x) => clsLabel(lang, x)).join(' · ') : '—';
  kv('labDisc.traceFields.divergence', clsText);
  const verdictDd = h('dd');
  verdictDd.append(verdictChip(lang, trace.verdict));
  dl.append(h('dt', {}, [d['labDisc.traceFields.verdict']]), verdictDd);

  const spansDd = h('dd');
  if (trace.usedSourceSpanIds.length === 0) spansDd.textContent = '—';
  for (const sid of trace.usedSourceSpanIds) {
    spansDd.append(h('span', { class: 'trace__span' }, [spanLocation(c, sid)]));
  }
  dl.append(h('dt', {}, [d['labDisc.traceFields.usedSpans']]), spansDd);

  const missingDd = h('dd');
  missingDd.textContent = trace.missingEvidence.length > 0 ? trace.missingEvidence.join(', ') : '—';
  dl.append(h('dt', {}, [d['labDisc.traceFields.missingEvidence']]), missingDd);

  const explDd = h('dd');
  if (trace.explanationKeys.length === 0) explDd.textContent = '—';
  for (const key of trace.explanationKeys) {
    explDd.append(h('p', { style: 'margin:4px 0' }, [expKeyLabel(lang, key)]));
  }
  dl.append(h('dt', {}, [d['labDisc.traceFields.explanations']]), explDd);

  if (trace.reviewerDecision) {
    kv('labDisc.traceFields.reviewerDecision', trace.reviewerDecision);
  }
  return dl;
}

/** Compose the evaluator inputs from the shared experience state shape. */
export interface EvalInputsLike {
  krVersion: string;
  jpVersion: string;
  comparisonDate: string;
  familyConfidence: number | null;
  d1DateOverride: string | null;
  translation: 'verified' | 'uncertain' | 'missing';
  missingDocs: string[];
  challengeSpans: string[];
  reviewerDecision: string | null;
}
