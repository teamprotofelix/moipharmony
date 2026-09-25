// @vitest-environment jsdom
/**
 * Runtime translation layer tests: static pages are baked in ko; the runtime
 * module must switch ?lang=en / ?lang=ja text, links, <html lang>, title,
 * and must never touch the language selector or the originals.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { applyLanguage } from '../src/lib/i18n-runtime';

function seed(langParam: string | null): void {
  document.documentElement.innerHTML = '';
  document.body.innerHTML = '';
  document.documentElement.setAttribute('lang', 'ko');
  document.documentElement.setAttribute('data-title-keys', 'nav.experience|nav.siteName');

  const head = document.createElement('head');
  head.innerHTML = `
    <title>3분 비교 체험 — KJ-EQH 연구 체험</title>
    <meta name="description" data-i18n-meta="exp.sub" content="가상 패밀리 H-01을 7단계로 완주하며 검토 상태가 실제로 바뀌는 것을 확인합니다.">
  `;
  document.documentElement.prepend(head);

  document.body.innerHTML = `
    <nav>
      <a href="/experience/">3분 비교 체험</a>
      <a href="/research/">논문과 연구</a>
    </nav>
    <select data-no-translate><option>한국어</option><option>English</option></select>
    <h1>3분 조율 체험</h1>
    <p>가상 패밀리 H-01을 7단계로 완주하며 검토 상태가 실제로 바뀌는 것을 확인합니다.</p>
    <p><span data-i18n="exp.stepLabel">단계</span> 1</p>
    <p><span data-i18n-l10n data-l10n-ko="관련 사이트" data-l10n-en="Related site" data-l10n-ja="関連サイト">관련 사이트</span></p>
    <p class="orig">生体信号を検知する検知部（합성 원문은 번역하지 않음）</p>
  `;

  if (langParam) {
    window.history.replaceState({}, '', `/?lang=${langParam}`);
  } else {
    window.history.replaceState({}, '', '/');
  }
  vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
}

describe('applyLanguage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('translates visible text, links, lang attr, title and meta for ?lang=en', () => {
    seed('en');
    applyLanguage();
    expect(document.documentElement.lang).toBe('en');
    expect(document.title).toBe('3-minute comparison — KJ-EQH Research Experience');
    expect(document.querySelector('h1')!.textContent).toBe('3-minute harmonization experience');
    const navLink = document.querySelector('nav a')!;
    expect(navLink.getAttribute('href')).toContain('?lang=en');
    expect(navLink.textContent).toBe('3-minute comparison');
    // data-i18n exact-key element
    expect(document.querySelector('[data-i18n="exp.stepLabel"]')!.textContent).toBe('Step');
    // data-i18n-l10n picks the language attribute
    expect(document.querySelector('[data-i18n-l10n]')!.textContent).toBe('Related site');
    // meta description
    expect(document.querySelector('meta[data-i18n-meta]')!.getAttribute('content')).toContain('Complete the fictional family H-01');
  });

  it('works for ja and keeps original-language evidence untouched', () => {
    seed('ja');
    applyLanguage();
    expect(document.documentElement.lang).toBe('ja');
    expect(document.querySelector('h1')!.textContent).toBe('3分調和体験');
    const orig = document.querySelector('.orig')!.textContent;
    expect(orig).toContain('生体信号を検知する検知部');
  });

  it('never translates inside the language selector (data-no-translate)', () => {
    seed('en');
    applyLanguage();
    const options = Array.from(document.querySelectorAll('select option')).map((o) => o.textContent);
    expect(options).toEqual(['한국어', 'English']);
  });

  it('ko mode is a no-op (baked-in language)', () => {
    seed(null);
    applyLanguage();
    expect(document.documentElement.lang).toBe('ko');
    expect(document.querySelector('h1')!.textContent).toBe('3분 조율 체험');
    expect(document.querySelector('a[href="/experience/"]')!.getAttribute('href')).toBe('/experience/');
  });
});
