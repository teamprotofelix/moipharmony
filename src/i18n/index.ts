/**
 * i18n core — shared between Astro frontmatter (build) and client scripts.
 * Language resolution: explicit ?lang= URL param > saved localStorage choice > ko.
 * Changing the language keeps the same page, case, version and review step
 * (state lives in sessionStorage; the page reloads with the new lang param).
 */
import ko from './ko';
import en from './en';
import ja from './ja';

export type Lang = 'ko' | 'en' | 'ja';
export type Dict = typeof ko;
export type Key = keyof Dict;

export const dicts: Record<Lang, Dict> = { ko, en, ja };
export const LANGS: Lang[] = ['ko', 'en', 'ja'];

const STORAGE_KEY = 'kj-eqh.lang';

export function isLang(v: unknown): v is Lang {
  return v === 'ko' || v === 'en' || v === 'ja';
}

/** Build-time: resolve from URL search params (safe, no window). */
export function langFromUrl(url: URL): Lang {
  const param = url.searchParams.get('lang');
  if (isLang(param)) return param;
  return 'ko';
}

/** Client-time: ?lang= param > localStorage > ko. */
export function resolveLang(): Lang {
  if (typeof window !== 'undefined') {
    const param = new URLSearchParams(window.location.search).get('lang');
    if (isLang(param)) return param;
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (isLang(saved)) return saved;
    } catch {
      /* localStorage blocked — fall through to ko */
    }
  }
  return 'ko';
}

export function saveLang(lang: Lang): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* localStorage blocked — URL param still works */
  }
}

/** Switch language client-side, preserving the current page/state. */
export function switchLang(lang: Lang): void {
  if (typeof window === 'undefined') return;
  saveLang(lang);
  const url = new URL(window.location.href);
  url.searchParams.set('lang', lang);
  window.location.assign(url.toString());
}

/** Look up a key; falls back to ko (typed key, so this is belt & suspenders). */
export function t(lang: Lang, key: Key): string {
  return dicts[lang][key] ?? dicts.ko[key];
}

/** Simple {name} interpolation for the rare parameterised strings. */
export function tf(lang: Lang, key: Key, vars: Record<string, string | number>): string {
  let s = t(lang, key);
  for (const [k, v] of Object.entries(vars)) {
    s = s.replaceAll(`{${k}}`, String(v));
  }
  return s;
}

/** Pick a {ko,en,ja} object from data (element labels, case-local labels). */
export function pick<T extends Record<Lang, string>>(lang: Lang, obj: T): string {
  return obj[lang] ?? obj.ko;
}
