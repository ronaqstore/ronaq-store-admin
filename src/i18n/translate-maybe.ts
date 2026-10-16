import { t as staticT } from './static-t';
import type { TranslateMaybeFn } from '@/types';

export function translateMaybe(keyOrText: string, t?: TranslateMaybeFn): string {
  if (!keyOrText) return '';

  if (t) {
    try {
      if (typeof t.has === 'function' && t.has(keyOrText)) {
        const translated = t(keyOrText);
        if (translated != null && translated !== keyOrText) return String(translated);
      }
      if (!keyOrText.includes('.')) {
        const commonKey = `common.${keyOrText}`;
        if (typeof t.has === 'function' && t.has(commonKey)) {
          const translated = t(commonKey);
          if (translated != null && translated !== commonKey) return String(translated);
        }
      }
    } catch {
      return staticT(keyOrText) || keyOrText;
    }
  }

  const fallback = staticT(keyOrText);
  if (fallback && fallback !== keyOrText) {
    return fallback;
  }

  if (keyOrText.startsWith('common.')) {
    const seg = keyOrText.slice(7);
    return seg.charAt(0).toUpperCase() + seg.slice(1);
  }

  return keyOrText;
}
