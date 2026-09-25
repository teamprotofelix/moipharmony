/**
 * Core data model — follows the paper's distinctions (plan §5).
 * Original-language evidence lives in SourceSpan.originalText and is never
 * translated; explanatory glosses (gloss.{ko,en,ja}) are shown alongside.
 */

export type Office = 'KR' | 'JP';
export type DataClass = 'PUBLIC' | 'OFFICE_SHARED' | 'RESTRICTED_DERIVED' | 'CONFIDENTIAL_RAW';
export type Verdict = 'TRUE' | 'FALSE' | 'UNKNOWN' | 'NOT_APPLICABLE';
export type Divergence =
  | 'DATA_DIVERGENCE'
  | 'CLAIM_VERSION_DIVERGENCE'
  | 'SEARCH_DIVERGENCE'
  | 'FACT_DIVERGENCE'
  | 'LEGAL_PROFILE_DIVERGENCE'
  | 'QUALITY_DEFECT_CANDIDATE'
  | 'UNKNOWN';
export type ReferenceOrigin = 'EXAMINER_CITED' | 'AI_DISCOVERED_AFTERWARD';
export type Availability = 'available' | 'partial' | 'none';
export type ReviewDecision = 'CONFIRMED_GAP' | 'REJECTED' | 'LEGAL_DIVERGENCE' | 'DEFERRED';

/** Synthetic scenario flag steering the deterministic evaluator. */
export type ScenarioFlag =
  | 'ALIGNED' // H-01 baseline: examiner-cited on one side only, facts aligned
  | 'AI_DISCOVERED_ONLY' // H-02
  | 'FACT_DIVERGENCE' // H-03
  | 'LEGAL_DIVERGENCE' // H-05
  | 'TRANSLATION_UNCERTAIN' // H-06
  | 'REPEATED_PATTERN'; // H-08

export interface Localized {
  ko: string;
  en: string;
  ja: string;
}

export interface SourceSpan {
  id: string;
  documentId: string;
  office: Office;
  originalLanguage: 'ko' | 'ja' | 'en';
  /** Original text — kept verbatim in its own language. */
  originalText: string;
  /** Explanatory translation (separate layer, never a replacement). */
  gloss: Localized;
  page?: number;
  paragraph?: string;
  start?: number;
  end?: number;
  retrievedAt: string;
  contentHash: string;
}

export interface ElementDef {
  id: string;
  label: Localized;
  /** Phrase spans of the claim text (and, for D1 mapping, of the document). */
  sourceSpanIds: string[];
}

export interface ClaimVersion {
  id: string;
  office: Office;
  claimNumber: number;
  effectiveDate: string;
  versionHash: string;
  originalTextSpanIds: string[];
  elements: ElementDef[];
}

export interface PriorArtRecord {
  id: string;
  title: Localized;
  publicationDate: string;
  priorityDate: string;
  family: string;
  origin: ReferenceOrigin;
  citedByOffice?: Office | 'BOTH';
  /** Which claim elements this document is mapped to (with its own spans). */
  elementMappings: Array<{ elementId: string; sourceSpanIds: string[] }>;
  /** Optional per-office mapping views (H-03 fact divergence: different readings). */
  officeMappingViews?: Record<Office, Array<{ elementId: string; sourceSpanIds: string[] }>>;
  sourceSpanIds: string[];
  retrievedAt: string;
  availability: Availability;
}

export interface CaseDocument {
  id: string;
  office: Office;
  class: DataClass;
  label: Localized;
}

export interface TimelineEvent {
  type: 'filing' | 'publication' | 'amendment' | 'oa' | 'citation' | 'retrieval';
  date: string;
  /** Optional label detail (e.g. amendment to E1-E3 wording). */
  detail?: Localized;
}

export interface RuleCandidate {
  id: string;
  version: string;
  lifecycle: 'DRAFT' | 'REVIEW' | 'REGRESSION' | 'SHADOW' | 'APPROVED';
  proposedAt: string;
  patternEvidence: string[];
}

export interface HarmonyCase {
  id: string;
  fictional: true;
  scenario: ScenarioFlag;
  familyLink: { confidence: number; priorityDate: string; sourceSpanIds: string[] };
  documentClass: DataClass;
  claimVersions: ClaimVersion[];
  priorArt: PriorArtRecord[];
  sourceSpans: SourceSpan[];
  documents: CaseDocument[];
  events: Record<Office, TimelineEvent[]>;
  ruleVersions: Array<{ id: string; version: string; effectiveFrom: string }>;
  /** H-08: AI-proposed rule candidate that must pass the lifecycle. */
  ruleCandidate?: RuleCandidate;
}

export interface HarmonyInputs {
  case: HarmonyCase;
  selectedVersions: { kr: string; jp: string };
  comparisonDate: string;
  /** Per-document availability overrides (dossier missing etc.). */
  documentAvailability?: Record<string, 'available' | 'missing'>;
  /** Translation verification status of the JP original terms. */
  translationVerification?: 'verified' | 'uncertain' | 'missing';
  /** What-if experiment: override a prior-art publication date (H-01 step 6). */
  priorArtDateOverride?: Record<string, string>;
  reviewerEdits?: {
    decision?: ReviewDecision;
    /** Spans the user re-marked as "not E3" (fact edit). */
    challengeSpans?: string[];
  };
  /** Family-lab slider override. */
  familyConfidenceOverride?: number;
}

export interface HarmonyTrace {
  selectedKrClaimVersionId: string;
  selectedJpClaimVersionId: string;
  comparisonDate: string;
  divergence: Divergence[];
  verdict: Verdict;
  ruleId: string;
  ruleVersion: string;
  usedSourceSpanIds: string[];
  missingEvidence: string[];
  explanationKeys: string[];
  reviewerDecision?: ReviewDecision;
}

/** Default evaluation inputs (all material present, translations verified). */
export function defaultInputs(c: HarmonyCase): HarmonyInputs {
  const kr = c.claimVersions.find((v) => v.office === 'KR');
  const jp = c.claimVersions.find((v) => v.office === 'JP');
  return {
    case: c,
    selectedVersions: { kr: kr?.id ?? '', jp: jp?.id ?? '' },
    comparisonDate: c.events.KR.find((e) => e.type === 'retrieval')?.date ?? '',
    documentAvailability: {},
    translationVerification: 'verified',
    reviewerEdits: {},
  };
}
