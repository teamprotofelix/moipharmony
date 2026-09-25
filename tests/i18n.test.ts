/**
 * i18n guards (plan §8.2):
 * - ko / en / ja key sets must be identical (a missing key is a build error via
 *   TS types; this runtime check is the belt & suspenders for CI)
 * - banned phrasing guard: the site must never phrase TRUE as "the other office
 *   made an error" or present the proposal as an official joint project.
 */
import { describe, expect, it } from 'vitest';
import { dicts, LANGS } from '../src/i18n';

const sortedKeys = (obj: Record<string, unknown>): string[] => Object.keys(obj).sort();

describe('translation completeness', () => {
  it('ko/en/ja dictionaries expose exactly the same key set', () => {
    const koKeys = sortedKeys(dicts.ko as never);
    expect(koKeys.length).toBeGreaterThan(500);
    for (const lang of LANGS) {
      expect(sortedKeys(dicts[lang] as never)).toEqual(koKeys);
    }
  });

  it('no value is empty in any language', () => {
    for (const lang of LANGS) {
      for (const [k, v] of Object.entries(dicts[lang] as Record<string, string>)) {
        expect(v.trim().length, `${lang}.${k} is empty`).toBeGreaterThan(0);
      }
    }
  });

  it('ko value duplicates translate identically in en/ja (reverse lookup stays correct)', () => {
    const ko = dicts.ko as Record<string, string>;
    const en = dicts.en as Record<string, string>;
    const ja = dicts.ja as Record<string, string>;
    const seen = new Map<string, string[]>();
    for (const [k, v] of Object.entries(ko)) {
      if (!seen.has(v)) seen.set(v, []);
      seen.get(v)!.push(k);
    }
    for (const [v, keys] of seen) {
      if (keys.length < 2) continue;
      const enVals = new Set(keys.map((k) => en[k]));
      const jaVals = new Set(keys.map((k) => ja[k]));
      expect(
        enVals.size === 1 && jaVals.size === 1,
        `ko value "${v}" (${keys.join(',')}) must translate identically in en/ja`,
      ).toBe(true);
    }
  });
});

describe('phrasing guard rails', () => {
  // TRUE must never confirm the other office's error, and the site must never
  // claim an official joint project — these phrases may appear ONLY inside
  // negations ("...이 아니라 ...", "not ...", "...ではなく...").
  const banned = ['심사 오류 확정', '오류를 확정', '公式共同事業', 'official joint project'];
  const negators = /아니|않|없|ない|なく|ません|not|never/i;

  it('banned absolute phrasing appears only inside negations', () => {
    for (const lang of LANGS) {
      for (const [k, v] of Object.entries(dicts[lang] as Record<string, string>)) {
        for (const phrase of banned) {
          if (v.includes(phrase)) {
            expect(v, `${lang}.${k} uses "${phrase}" without a negation`).toMatch(negators);
          }
        }
      }
    }
  });
});
