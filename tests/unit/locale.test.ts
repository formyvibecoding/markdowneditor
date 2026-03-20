import { describe, expect, it } from 'vitest';
import { resolveLocaleFromPreferences } from '@/locale';

describe('resolveLocaleFromPreferences', () => {
  it('maps major G7 browser languages directly', () => {
    expect(resolveLocaleFromPreferences(['fr-CA', 'en-US'])).toBe('fr');
    expect(resolveLocaleFromPreferences(['de-DE'])).toBe('de');
    expect(resolveLocaleFromPreferences(['it-IT'])).toBe('it');
    expect(resolveLocaleFromPreferences(['ja-JP'])).toBe('ja');
    expect(resolveLocaleFromPreferences(['en-GB'])).toBe('en');
  });

  it('distinguishes simplified and traditional Chinese', () => {
    expect(resolveLocaleFromPreferences(['zh-CN'])).toBe('zh-CN');
    expect(resolveLocaleFromPreferences(['zh-TW'])).toBe('zh-TW');
    expect(resolveLocaleFromPreferences(['zh-HK'])).toBe('zh-TW');
    expect(resolveLocaleFromPreferences(['zh-Hans'])).toBe('zh-CN');
  });

  it('uses timezone as a tiebreaker for generic Chinese', () => {
    expect(resolveLocaleFromPreferences(['zh'], 'Asia/Taipei')).toBe('zh-TW');
    expect(resolveLocaleFromPreferences(['zh'], 'Asia/Shanghai')).toBe('zh-CN');
  });

  it('falls back to English for unsupported languages', () => {
    expect(resolveLocaleFromPreferences(['ko-KR'])).toBe('en');
    expect(resolveLocaleFromPreferences(['es-ES', 'pt-BR'])).toBe('en');
  });
});
