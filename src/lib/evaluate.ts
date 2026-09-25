/**
 * evaluateHarmony — the deterministic harmonization evaluator (plan §5, §3.4).
 *
 * Pure function: identical inputs + identical rule version => identical Trace.
 * Processing order (mandated by the paper):
 *   자료등급·접근 가능성 → 패밀리 연결 → 시점·청구항 정렬 → 문헌 관련 날짜
 *   → 요소별 근거·번역 → 법역 프로필 → materiality → 검토 신호
 *
 * TRUE is a review candidate — never "the other office made an error".
 * UNKNOWN is distinct from FALSE and is resolved only when the user adds material.
 */
import type {
  Divergence,
  HarmonyCase,
  HarmonyInputs,
  HarmonyTrace,
  Verdict,
} from '../data/types';
import { docOf, docOfSpan } from '../data';

/** Family-link confidence below which alarm computation stops. */
export const FAMILY_CONFIDENCE_THRESHOLD = 0.7;

/** Explanation keys (UI translates them via expKey.* i18n keys). */
export const EXP_KEYS = {
  UNKNOWN_DATA_RESTRICTED: 'UNKNOWN_DATA_RESTRICTED',
  DATA_MISSING: 'DATA_MISSING',
  UNKNOWN_FAMILY: 'UNKNOWN_FAMILY',
  MIXED_TIMING: 'MIXED_TIMING',
  D1_NOT_AVAILABLE_AT_TIME: 'D1_NOT_AVAILABLE_AT_TIME',
  NO_CITATION_DIFFERENCE: 'NO_CITATION_DIFFERENCE',
  TRANSLATION_UNCERTAIN: 'TRANSLATION_UNCERTAIN',
  TRANSLATION_VERIFICATION_MISSING: 'TRANSLATION_VERIFICATION_MISSING',
  E3_DISCLOSURE_UNCONFIRMED: 'E3_DISCLOSURE_UNCONFIRMED',
  AI_DISCOVERED_REFERENCE: 'AI_DISCOVERED_REFERENCE',
  AI_RULE_CANDIDATE: 'AI_RULE_CANDIDATE',
  LEGAL_DIVERGENCE_JUSTIFIED: 'LEGAL_DIVERGENCE_JUSTIFIED',
} as const;

function baseTrace(inputs: HarmonyInputs): HarmonyTrace {
  const c = inputs.case;
  const rule = c.ruleVersions[0];
  return {
    selectedKrClaimVersionId: inputs.selectedVersions.kr,
    selectedJpClaimVersionId: inputs.selectedVersions.jp,
    comparisonDate: inputs.comparisonDate,
    divergence: [],
    verdict: 'FALSE',
    ruleId: rule?.id ?? 'KJ-HARM-PA-001',
    ruleVersion: rule?.version ?? '',
    usedSourceSpanIds: [],
    missingEvidence: [],
    explanationKeys: [],
  };
}

function finish(
  trace: HarmonyTrace,
  verdict: Verdict,
  divergence: Divergence[],
  explanationKeys: string[] = [],
): HarmonyTrace {
  trace.verdict = verdict;
  // Append, never replace: a human CONFIRMED_GAP (pushed in step 0) must
  // survive the stage that returns the final signal.
  trace.divergence = [...trace.divergence, ...divergence];
  trace.explanationKeys = explanationKeys;
  return trace;
}

/** Materially different element sets (e.g. E1-E3 vs E1-E3+E4) are not comparable. */
function elementSetsDiffer(c: HarmonyCase, krId: string, jpId: string): boolean {
  const kr = c.claimVersions.find((v) => v.id === krId);
  const jp = c.claimVersions.find((v) => v.id === jpId);
  if (!kr || !jp) return true;
  const krSet = kr.elements.map((e) => e.id).sort().join(',');
  const jpSet = jp.elements.map((e) => e.id).sort().join(',');
  return krSet !== jpSet;
}

export function evaluateHarmony(inputs: HarmonyInputs): HarmonyTrace {
  const c = inputs.case;
  const trace = baseTrace(inputs);
  const availability = inputs.documentAvailability ?? {};
  const translation = inputs.translationVerification ?? 'verified';

  // ── 0. Reviewer edits (human decision) ────────────────────
  if (inputs.reviewerEdits?.decision) {
    trace.reviewerDecision = inputs.reviewerEdits.decision;
    // A confirmed gap becomes the quality-defect candidate — decided by a human,
    // never auto-applied by the rule alone.
    if (inputs.reviewerEdits.decision === 'CONFIRMED_GAP') {
      trace.divergence.push('QUALITY_DEFECT_CANDIDATE');
    }
  }

  const kr = c.claimVersions.find((v) => v.id === inputs.selectedVersions.kr);
  const jp = c.claimVersions.find((v) => v.id === inputs.selectedVersions.jp);
  if (!kr || !jp) {
    return finish(trace, 'UNKNOWN', ['UNKNOWN'], [EXP_KEYS.DATA_MISSING]);
  }

  // ── 1. 자료등급·접근 가능성 (data class & availability) ──
  const requiredDocIds = new Set<string>(
    [...kr.originalTextSpanIds, ...jp.originalTextSpanIds]
      .map((sid) => docOfSpan(c, sid)?.id)
      .filter((id): id is string => Boolean(id)),
  );
  // Dossiers of both offices are required to verify citation status.
  for (const d of c.documents) {
    if (d.id.endsWith('.dossier')) requiredDocIds.add(d.id);
  }
  const citedDocIds = c.priorArt
    .filter((p) => p.origin === 'EXAMINER_CITED')
    .flatMap((p) => p.sourceSpanIds.map((sid) => docOfSpan(c, sid)?.id))
    .filter((id): id is string => Boolean(id));
  for (const id of citedDocIds) requiredDocIds.add(id);

  for (const docId of requiredDocIds) {
    const doc = docOf(c, docId);
    if (!doc) {
      trace.missingEvidence.push(docId);
      return finish(trace, 'UNKNOWN', ['DATA_DIVERGENCE'], [EXP_KEYS.DATA_MISSING]);
    }
    if (doc.class !== 'PUBLIC') {
      // Restricted material: never shown, never pretended to be obtained.
      trace.missingEvidence.push(docId);
      return finish(trace, 'UNKNOWN', ['DATA_DIVERGENCE'], [EXP_KEYS.UNKNOWN_DATA_RESTRICTED]);
    }
    if (availability[docId] === 'missing') {
      trace.missingEvidence.push(docId);
      return finish(trace, 'UNKNOWN', ['DATA_DIVERGENCE'], [EXP_KEYS.DATA_MISSING]);
    }
  }

  // ── 2. 패밀리 연결 ────────────────────────────────────────
  const confidence = inputs.familyConfidenceOverride ?? c.familyLink.confidence;
  if (confidence < FAMILY_CONFIDENCE_THRESHOLD) {
    trace.missingEvidence.push('family-link-evidence');
    return finish(trace, 'UNKNOWN', ['UNKNOWN'], [EXP_KEYS.UNKNOWN_FAMILY]);
  }
  trace.usedSourceSpanIds.push(...c.familyLink.sourceSpanIds);

  // ── 3. 시점·청구항 정렬 ───────────────────────────────────
  if (kr.effectiveDate > trace.comparisonDate || jp.effectiveDate > trace.comparisonDate) {
    // Mixing a later claim version with an earlier comparison point.
    return finish(trace, 'NOT_APPLICABLE', ['CLAIM_VERSION_DIVERGENCE'], [EXP_KEYS.MIXED_TIMING]);
  }
  if (elementSetsDiffer(c, kr.id, jp.id)) {
    return finish(trace, 'NOT_APPLICABLE', ['CLAIM_VERSION_DIVERGENCE']);
  }
  trace.usedSourceSpanIds.push(...kr.originalTextSpanIds, ...jp.originalTextSpanIds);
  for (const v of [kr, jp]) {
    for (const el of v.elements) trace.usedSourceSpanIds.push(...el.sourceSpanIds);
  }

  // ── 4. 시나리오 분기 ──────────────────────────────────────
  if (c.scenario === 'TRANSLATION_UNCERTAIN') {
    trace.missingEvidence.push('jp-term-original-confirmation');
    return finish(trace, 'UNKNOWN', ['UNKNOWN'], [EXP_KEYS.TRANSLATION_UNCERTAIN]);
  }

  if (c.scenario === 'LEGAL_DIVERGENCE') {
    // Facts identical; the difference is a justified divergence of legal standards.
    return finish(trace, 'FALSE', ['LEGAL_PROFILE_DIVERGENCE'], [EXP_KEYS.LEGAL_DIVERGENCE_JUSTIFIED]);
  }

  if (c.scenario === 'FACT_DIVERGENCE') {
    // Same D1 cited by both, but the two offices read the passage differently.
    // A material interpretation difference is a review candidate (TRUE).
    const d1 = c.priorArt.find((p) => p.origin === 'EXAMINER_CITED');
    if (d1) trace.usedSourceSpanIds.push(...d1.sourceSpanIds);
    return finish(trace, 'TRUE', ['FACT_DIVERGENCE']);
  }

  if (c.scenario === 'REPEATED_PATTERN') {
    const d1 = c.priorArt.find((p) => p.origin === 'EXAMINER_CITED');
    if (d1) trace.usedSourceSpanIds.push(...d1.sourceSpanIds);
    return finish(trace, 'TRUE', ['SEARCH_DIVERGENCE'], [EXP_KEYS.AI_RULE_CANDIDATE]);
  }

  if (c.scenario === 'AI_DISCOVERED_ONLY') {
    const ai = c.priorArt.find((p) => p.origin === 'AI_DISCOVERED_AFTERWARD');
    if (!ai) {
      return finish(trace, 'UNKNOWN', ['SEARCH_DIVERGENCE'], [EXP_KEYS.DATA_MISSING]);
    }
    const aiDocIds = ai.sourceSpanIds.map((sid) => docOfSpan(c, sid)?.id).filter((x): x is string => Boolean(x));
    if (aiDocIds.some((id) => availability[id] === 'missing') || ai.availability === 'none') {
      trace.missingEvidence.push(...aiDocIds);
      return finish(trace, 'UNKNOWN', ['SEARCH_DIVERGENCE'], [EXP_KEYS.DATA_MISSING]);
    }
    trace.usedSourceSpanIds.push(...ai.sourceSpanIds);
    // The AI-discovered candidate stays AI_DISCOVERED_AFTERWARD — it is never
    // converted into a past examiner citation (plan §3.3).
    return finish(trace, 'TRUE', ['SEARCH_DIVERGENCE'], [EXP_KEYS.AI_DISCOVERED_REFERENCE]);
  }

  // ── 5. ALIGNED: 인용 차이 + 문헌 관련 날짜 ────────────────
  const citedByOne = c.priorArt.find(
    (p) => p.origin === 'EXAMINER_CITED' && p.citedByOffice && p.citedByOffice !== 'BOTH',
  );
  if (!citedByOne) {
    return finish(trace, 'FALSE', [], [EXP_KEYS.NO_CITATION_DIFFERENCE]);
  }
  trace.usedSourceSpanIds.push(...citedByOne.sourceSpanIds);

  // Translation verification of the JP original terms.
  if (translation !== 'verified') {
    trace.missingEvidence.push('jp-term-original-confirmation');
    return finish(
      trace,
      'UNKNOWN',
      ['UNKNOWN'],
      [EXP_KEYS.TRANSLATION_VERIFICATION_MISSING],
    );
  }

  // Challenged spans: the user re-marked a passage as "not E3".
  const challenged = inputs.reviewerEdits?.challengeSpans ?? [];
  if (citedByOne.sourceSpanIds.some((sid) => challenged.includes(sid))) {
    trace.missingEvidence.push(...citedByOne.sourceSpanIds);
    return finish(trace, 'UNKNOWN', ['FACT_DIVERGENCE'], [EXP_KEYS.E3_DISCLOSURE_UNCONFIRMED]);
  }

  // Relevant dates: the document must have been available at the time.
  const pubDate = inputs.priorArtDateOverride?.[citedByOne.id] ?? citedByOne.publicationDate;
  if (pubDate > trace.comparisonDate) {
    // All facts confirmed, but the signal condition is unmet -> FALSE (신호 해제).
    return finish(trace, 'FALSE', ['SEARCH_DIVERGENCE'], [EXP_KEYS.D1_NOT_AVAILABLE_AT_TIME]);
  }

  // ── 6. 검토 신호 (KJ-HARM-PA-001) ─────────────────────────
  // Substantially corresponding claims + an available material D1 + cited on one
  // side and not the other + evidence and comparison point confirmed => TRUE
  // review candidate. This is not a conclusion that the other office erred.
  return finish(trace, 'TRUE', ['SEARCH_DIVERGENCE']);
}
