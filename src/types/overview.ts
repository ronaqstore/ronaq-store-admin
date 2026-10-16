import type { ReactNode } from 'react';

export interface StatsErrorAlertProps {
  message: string;
  action: ReactNode;
}

export interface StatsErrorFallbackProps {
  error: Error;
  reset: () => void;
  message: string;
}
