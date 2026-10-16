'use client';

import { useTranslations } from 'next-intl';

export { translateMaybe } from './translate-maybe';

export function useT() {
  return useTranslations();
}
