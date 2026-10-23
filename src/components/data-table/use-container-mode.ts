'use client';

import * as React from 'react';

import type { ContainerMode, ContainerModeState } from './types';

export const LIST_MAX = 639;
export const CARDS_MAX = 1023;
const WIDE_COMPACT_MIN = 900;
const SSR_VIEWPORT_FALLBACK = CARDS_MAX + 1;

function modeFromWidth(width: number): ContainerMode {
  if (width <= LIST_MAX) return 'list';
  if (width <= CARDS_MAX) return 'cards';
  return 'full';
}

function subscribeViewport(onChange: () => void) {
  window.addEventListener('resize', onChange);
  return () => window.removeEventListener('resize', onChange);
}

function getViewportWidth() {
  return window.innerWidth;
}

function getServerViewportWidth() {
  return SSR_VIEWPORT_FALLBACK;
}

export function useContainerMode(): ContainerModeState {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const viewportWidth = React.useSyncExternalStore(
    subscribeViewport,
    getViewportWidth,
    getServerViewportWidth
  );
  const [containerWidth, setContainerWidth] = React.useState<number | null>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = (next: number) => {
      setContainerWidth((prev) => (prev === next ? prev : next));
    };

    update(el.getBoundingClientRect().width);

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      update(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const width = containerWidth ?? viewportWidth;
  const mode = modeFromWidth(width);
  const wideCompact = width >= WIDE_COMPACT_MIN && width <= CARDS_MAX;

  return {
    width,
    mode,
    wideCompact,
    measured: containerWidth != null,
    ref
  };
}
