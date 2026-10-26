export type TurnstileWidgetId = string;

export type TurnstileRenderOptions = {
  sitekey: string;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact' | 'flexible';
  appearance?: 'always' | 'execute' | 'interaction-only';
  callback?: (token: string) => void;
  'expired-callback'?: () => void;
  'error-callback'?: () => void;
  'timeout-callback'?: () => void;
};

export type TurnstileApi = {
  render: (
    container: HTMLElement | string,
    options: TurnstileRenderOptions
  ) => TurnstileWidgetId;
  reset: (widgetId?: TurnstileWidgetId) => void;
  remove: (widgetId?: TurnstileWidgetId) => void;
};

export type TurnstileWidgetProps = {
  onTokenChange: (token: string | null) => void;
  className?: string;
};

export type TurnstileSiteverifyResponse = {
  success?: boolean;
};

export type TurnstileWindow = Window & {
  turnstile?: TurnstileApi;
};
