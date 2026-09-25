/**
 * Case registry — synthetic cases H-01..H-08, validated against the model.
 * All cases are fictional: public, synthetic material only (plan §2.2).
 */
import type { HarmonyCase, SourceSpan } from './types';
import h01 from './cases/h01.json';
import h02 from './cases/h02.json';
import h03 from './cases/h03.json';
import h04 from './cases/h04.json';
import h05 from './cases/h05.json';
import h06 from './cases/h06.json';
import h07 from './cases/h07.json';
import h08 from './cases/h08.json';

export const cases: Record<string, HarmonyCase> = {
  'H-01': h01 as HarmonyCase,
  'H-02': h02 as HarmonyCase,
  'H-03': h03 as HarmonyCase,
  'H-04': h04 as HarmonyCase,
  'H-05': h05 as HarmonyCase,
  'H-06': h06 as HarmonyCase,
  'H-07': h07 as HarmonyCase,
  'H-08': h08 as HarmonyCase,
};

export const CASE_IDS = ['H-01', 'H-02', 'H-03', 'H-04', 'H-05', 'H-06', 'H-07', 'H-08'] as const;

export function getCase(id: string): HarmonyCase | undefined {
  return cases[id];
}

export function spanOf(c: HarmonyCase, spanId: string): SourceSpan | undefined {
  return c.sourceSpans.find((s) => s.id === spanId);
}

export function claimVersionOf(c: HarmonyCase, versionId: string) {
  return c.claimVersions.find((v) => v.id === versionId);
}

export function docOf(c: HarmonyCase, documentId: string) {
  return c.documents.find((d) => d.id === documentId);
}

export function docOfSpan(c: HarmonyCase, spanId: string) {
  const span = spanOf(c, spanId);
  return span ? docOf(c, span.documentId) : undefined;
}
