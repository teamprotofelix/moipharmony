/**
 * Acceptance-scenario tests for the deterministic evaluator (plan §11):
 * H-01 base TRUE → version divergence → date moved → UNKNOWN, H-05 legal
 * divergence never mistaken for a defect, H-07 restricted data stays
 * UNKNOWN_DATA_RESTRICTED, determinism, and the data-protection guard.
 */
import { describe, expect, it } from 'vitest';
import { cases } from '../src/data';
import { evaluateHarmony, EXP_KEYS } from '../src/lib/evaluate';
import type { HarmonyInputs } from '../src/data/types';

function inputs(caseId: string, overrides: Partial<HarmonyInputs> = {}): HarmonyInputs {
  const c = cases[caseId];
  const kr = c.claimVersions.find((v) => v.office === 'KR')!;
  const jp = c.claimVersions.find((v) => v.office === 'JP')!;
  const retrieval = c.events.KR.find((e) => e.type === 'retrieval')!;
  return {
    case: c,
    selectedVersions: { kr: kr.id, jp: jp.id },
    comparisonDate: retrieval.date,
    documentAvailability: {},
    translationVerification: 'verified',
    reviewerEdits: {},
    ...overrides,
  };
}

describe('H-01 baseline (D1 cited on one side)', () => {
  it('produces the TRUE review signal for KJ-HARM-PA-001', () => {
    const trace = evaluateHarmony(inputs('H-01'));
    expect(trace.verdict).toBe('TRUE');
    expect(trace.divergence).toEqual(['SEARCH_DIVERGENCE']);
    expect(trace.ruleId).toBe('KJ-HARM-PA-001');
    expect(trace.usedSourceSpanIds).toContain('h01.d1.p0012');
    // TRUE is a review candidate — never an error confirmation.
    expect(trace.explanationKeys).not.toContain('QUALITY_DEFECT_CANDIDATE');
  });

  it('switching to the E4 version shows CLAIM_VERSION_DIVERGENCE first and invalidates the alarm', () => {
    const trace = evaluateHarmony(
      inputs('H-01', {
        selectedVersions: { kr: 'h01.kr.v3', jp: 'h01.jp.v1' },
        comparisonDate: '2022-12-01',
      }),
    );
    expect(trace.divergence).toEqual(['CLAIM_VERSION_DIVERGENCE']);
    expect(trace.verdict).toBe('NOT_APPLICABLE');
    expect(trace.divergence).not.toContain('SEARCH_DIVERGENCE');
  });

  it('mixing a later version with an earlier comparison date flags MIXED_TIMING', () => {
    const trace = evaluateHarmony(
      inputs('H-01', {
        selectedVersions: { kr: 'h01.kr.v3', jp: 'h01.jp.v1' },
        comparisonDate: '2022-06-01',
      }),
    );
    expect(trace.verdict).toBe('NOT_APPLICABLE');
    expect(trace.explanationKeys).toContain(EXP_KEYS.MIXED_TIMING);
  });

  it('moving D1 after the comparison date clears the signal (FALSE)', () => {
    const trace = evaluateHarmony(
      inputs('H-01', { priorArtDateOverride: { D1: '2022-09-01' } }),
    );
    expect(trace.verdict).toBe('FALSE');
    expect(trace.explanationKeys).toContain(EXP_KEYS.D1_NOT_AVAILABLE_AT_TIME);
  });

  it('uncertain translation yields UNKNOWN with the specific missing verification', () => {
    const trace = evaluateHarmony(inputs('H-01', { translationVerification: 'uncertain' }));
    expect(trace.verdict).toBe('UNKNOWN');
    expect(trace.missingEvidence).toContain('jp-term-original-confirmation');
  });

  it('missing JP dossier yields UNKNOWN (never FALSE)', () => {
    const trace = evaluateHarmony(
      inputs('H-01', { documentAvailability: { 'h01.jp.dossier': 'missing' } }),
    );
    expect(trace.verdict).toBe('UNKNOWN');
    expect(trace.explanationKeys).toContain(EXP_KEYS.DATA_MISSING);
    expect(trace.missingEvidence).toContain('h01.jp.dossier');
  });

  it('low family confidence stops computation at UNKNOWN_FAMILY', () => {
    const trace = evaluateHarmony(inputs('H-01', { familyConfidenceOverride: 0.4 }));
    expect(trace.verdict).toBe('UNKNOWN');
    expect(trace.explanationKeys).toContain(EXP_KEYS.UNKNOWN_FAMILY);
  });

  it('challenged span ("this is not E3") recomputes to UNKNOWN with the fact edit key', () => {
    const trace = evaluateHarmony(
      inputs('H-01', { reviewerEdits: { challengeSpans: ['h01.d1.p0012'] } }),
    );
    expect(trace.verdict).toBe('UNKNOWN');
    expect(trace.explanationKeys).toContain(EXP_KEYS.E3_DISCLOSURE_UNCONFIRMED);
  });

  it('human CONFIRMED_GAP adds QUALITY_DEFECT_CANDIDATE and records the decision', () => {
    const trace = evaluateHarmony(
      inputs('H-01', { reviewerEdits: { decision: 'CONFIRMED_GAP' } }),
    );
    expect(trace.reviewerDecision).toBe('CONFIRMED_GAP');
    expect(trace.divergence).toContain('QUALITY_DEFECT_CANDIDATE');
  });
});

describe('H-02..H-08 scenarios', () => {
  it('H-02: AI-discovered reference stays AI_DISCOVERED_AFTERWARD and is a review candidate', () => {
    const c = cases['H-02'];
    expect(c.priorArt[0].origin).toBe('AI_DISCOVERED_AFTERWARD');
    const trace = evaluateHarmony(inputs('H-02'));
    expect(trace.verdict).toBe('TRUE');
    expect(trace.explanationKeys).toContain(EXP_KEYS.AI_DISCOVERED_REFERENCE);
  });

  it('H-03: same D1, different readings -> FACT_DIVERGENCE review candidate', () => {
    const trace = evaluateHarmony(inputs('H-03'));
    expect(trace.verdict).toBe('TRUE');
    expect(trace.divergence).toEqual(['FACT_DIVERGENCE']);
  });

  it('H-04: different claim scopes -> CLAIM_VERSION_DIVERGENCE, no quality defect claim', () => {
    const trace = evaluateHarmony(inputs('H-04', { comparisonDate: '2023-03-01' }));
    expect(trace.verdict).toBe('NOT_APPLICABLE');
    expect(trace.divergence).toEqual(['CLAIM_VERSION_DIVERGENCE']);
    expect(trace.divergence).not.toContain('QUALITY_DEFECT_CANDIDATE');
  });

  it('H-05: justified legal divergence is NOT an error (no TRUE, no defect candidate)', () => {
    const trace = evaluateHarmony(inputs('H-05'));
    expect(trace.divergence).toEqual(['LEGAL_PROFILE_DIVERGENCE']);
    expect(trace.verdict).toBe('FALSE');
    expect(trace.divergence).not.toContain('QUALITY_DEFECT_CANDIDATE');
  });

  it('H-06: uncertain term translation -> UNKNOWN with confirmation request', () => {
    const trace = evaluateHarmony(inputs('H-06'));
    expect(trace.verdict).toBe('UNKNOWN');
    expect(trace.explanationKeys).toContain(EXP_KEYS.TRANSLATION_UNCERTAIN);
  });

  it('H-07: restricted record -> UNKNOWN_DATA_RESTRICTED, never pretended access', () => {
    const trace = evaluateHarmony(inputs('H-07'));
    expect(trace.verdict).toBe('UNKNOWN');
    expect(trace.explanationKeys).toContain(EXP_KEYS.UNKNOWN_DATA_RESTRICTED);
    expect(trace.missingEvidence).toContain('h07.jp.dossier');
  });

  it('H-08: repeated omission pattern -> AI rule candidate signal', () => {
    const trace = evaluateHarmony(inputs('H-08'));
    expect(trace.verdict).toBe('TRUE');
    expect(trace.explanationKeys).toContain(EXP_KEYS.AI_RULE_CANDIDATE);
    expect(cases['H-08'].ruleCandidate?.lifecycle).toBe('DRAFT');
  });
});

describe('determinism and data protection', () => {
  it('identical inputs + identical rule version regenerate the identical trace', () => {
    const a = evaluateHarmony(inputs('H-01'));
    const b = evaluateHarmony(inputs('H-01'));
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('restricted documents carry no original text anywhere in the bundle', () => {
    const c = cases['H-07'];
    const restrictedDoc = c.documents.find((d) => d.class === 'RESTRICTED_DERIVED')!;
    expect(restrictedDoc).toBeDefined();
    const spansOfRestricted = c.sourceSpans.filter((s) => s.documentId === restrictedDoc.id);
    expect(spansOfRestricted).toHaveLength(0);
  });

  it('every referenced span id exists and every case is fictional', () => {
    for (const c of Object.values(cases)) {
      expect(c.fictional).toBe(true);
      const ids = new Set(c.sourceSpans.map((s) => s.id));
      for (const v of c.claimVersions) {
        for (const sid of [...v.originalTextSpanIds, ...v.elements.flatMap((e) => e.sourceSpanIds)]) {
          expect(ids.has(sid), `${c.id}: missing span ${sid}`).toBe(true);
        }
      }
      for (const p of c.priorArt) {
        for (const sid of p.sourceSpanIds) expect(ids.has(sid), `${c.id}: missing span ${sid}`).toBe(true);
      }
      for (const sid of c.familyLink.sourceSpanIds) {
        expect(ids.has(sid), `${c.id}: missing family span ${sid}`).toBe(true);
      }
    }
  });
});
