'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { applyAppearancePrefs } from './apply';

import type {
  AppearanceDensity,
  AppearanceRadius,
  AppearanceAccent,
  AppearanceDigits,
  AppearanceState
} from '@/types/layout';

export type {
  AppearanceDensity,
  AppearanceRadius,
  AppearanceAccent,
  AppearanceDigits,
  AppearanceState
};

export const DEFAULT_APPEARANCE = {
  density: 'comfortable' as AppearanceDensity,
  radius: 'medium' as AppearanceRadius,
  accent: 'red' as AppearanceAccent,
  digits: 'western' as AppearanceDigits
};

export const useAppearanceStore = create<AppearanceState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_APPEARANCE,
      setDensity: (density) => {
        applyAppearancePrefs({ ...get(), density });
        set({ density });
      },
      setRadius: (radius) => {
        applyAppearancePrefs({ ...get(), radius });
        set({ radius });
      },
      setAccent: (accent) => {
        applyAppearancePrefs({ ...get(), accent });
        set({ accent });
      },
      setDigits: (digits) => {
        applyAppearancePrefs({ ...get(), digits });
        set({ digits });
      },
      resetAll: () => {
        applyAppearancePrefs(DEFAULT_APPEARANCE);
        set({ ...DEFAULT_APPEARANCE });
      }
    }),
    {
      name: 'dukaan-appearance:v2'
    }
  )
);
