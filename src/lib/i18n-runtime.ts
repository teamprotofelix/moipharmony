/**
 * Runtime language layer for the static build.
 *
 * Static Astro builds cannot see the request query string, so every page is
 * pre-rendered in ko. This module, loaded on each page, resolves the language
 * (URL ?lang= > localStorage > ko), then:
 *   1. translates every visible text node whose ko text matches a dictionary
 *      value (reverse lookup), plus explicit [data-i18n="key"] elements and
 *      [data-i18n-aria="key"] labels;
 *   2. rewrites internal links to carry ?lang= so the choice persists;
 *   3. updates <html lang> and the document title / meta description.
 *
 * Subtrees marked [data-no-translate] (the language selector) are skipped.
 * Dynamic UI (labs, steps) renders from the client dictionaries directly.
 */
import { dicts, isLang, resolveLang } from '../i18n';

function buildReverseMap(): Map<string, string> {
  const map = new Map<string, string>();
  for (const [key, value] of Object.entries(dicts.ko as Record<string, string>)) {
    if (!map.has(value)) map.set(value, key);
  }
  return map;
}

export function applyLanguage(): void {
  const lang = resolveLang();
  document.documentElement.lang = lang;
  rewriteLinks(lang);
  translateDocument(lang);
  updateHead(lang);
}

function rewriteLinks(lang: string): void {
  const anchors = document.querySelectorAll<HTMLAnchorElement>('a[href^="/"]');
  for (const a of anchors) {
    try {
      const url = new URL(a.href);
      if (lang === 'ko') {
        url.searchParams.delete('lang');
      } else {
        url.searchParams.set('lang', lang);
      }
      const next = url.pathname + url.search + url.hash;
      if (next !== a.getAttribute('href')) a.setAttribute('href', next);
    } catch {
      /* external-ish or malformed — leave as is */
    }
  }
}

function translateDocument(lang: string): void {
  if (lang === 'ko') return; // ko is the baked-in language
  const target = dicts[lang as 'en' | 'ja'] as Record<string, string>;
  const reverse = buildReverseMap();

  // Explicitly keyed elements (composite or attribute-bearing content).
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n')!;
    if (target[key] !== undefined) el.textContent = target[key];
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-aria]').forEach((el) => {
    const key = el.getAttribute('data-i18n-aria')!;
    if (target[key] !== undefined) el.setAttribute('aria-label', target[key]);
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-title]').forEach((el) => {
    const key = el.getAttribute('data-i18n-title')!;
    if (target[key] !== undefined) el.setAttribute('title', target[key]);
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-alt]').forEach((el) => {
    const key = el.getAttribute('data-i18n-alt')!;
    if (target[key] !== undefined) el.setAttribute('alt', target[key]);
  });
  // Data-localized strings: <span data-i18n-l10n data-l10n-ko=".." data-l10n-en=".." data-l10n-ja="..">
  document.querySelectorAll<HTMLElement>('[data-i18n-l10n]').forEach((el) => {
    const value = el.getAttribute(`data-l10n-${lang}`) ?? el.getAttribute('data-l10n-ko');
    if (value) el.textContent = value;
  });

  // Plain text nodes: exact-match reverse lookup against the ko dictionary.
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node: Text): number {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (parent.closest('script, style, [data-no-translate], [data-i18n]')) {
        return NodeFilter.FILTER_REJECT;
      }
      const value = node.nodeValue?.trim() ?? '';
      return reverse.has(value) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });
  const nodes: Text[] = [];
  let current = walker.nextNode();
  while (current) {
    nodes.push(current as Text);
    current = walker.nextNode();
  }
  for (const node of nodes) {
    const key = reverse.get(node.nodeValue!.trim());
    if (key) {
      node.nodeValue = target[key] ?? node.nodeValue;
    }
  }
}

function updateHead(lang: string): void {
  // Title keys live on <html data-title-keys="a|b"> and are joined with " — ".
  const html = document.documentElement;
  const keys = (html.getAttribute('data-title-keys') ?? '').split('|').filter(Boolean);
  const dict = dicts[lang as 'en' | 'ja'] as Record<string, string> | undefined;
  if (keys.length > 0 && dict) {
    document.title = keys.map((k) => dict[k] ?? '').filter(Boolean).join(' — ');
  }
  const meta = document.querySelector<HTMLMetaElement>('meta[data-i18n-meta]');
  if (meta && dict) {
    const key = meta.getAttribute('data-i18n-meta');
    if (key && dict[key]) meta.setAttribute('content', dict[key]);
  }
}

/** Used by the language selector: switch and reload, keeping state (sessionStorage). */
export function initRuntime(): void {
  if (typeof window === 'undefined') return;
  // Ensure URL param takes precedence over anything else.
  const param = new URLSearchParams(window.location.search).get('lang');
  if (!isLang(param)) {
    // No param: adopt the saved choice (the BaseLayout redirect handles this,
    // but belt & suspenders for pages reached without the redirect).
    const saved = (() => {
      try {
        return window.localStorage.getItem('kj-eqh.lang');
      } catch {
        return null;
      }
    })();
    if (isLang(saved) && saved !== 'ko') {
      const url = new URL(window.location.href);
      url.searchParams.set('lang', saved);
      window.location.replace(url.toString());
      return;
    }
  }
  applyLanguage();
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRuntime, { once: true });
  } else {
    initRuntime();
  }
}
