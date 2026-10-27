import type { ComponentType } from 'react';

export interface RowAction {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: ComponentType<{ className?: string }>;
  variant?: 'default' | 'destructive';
  className?: string;
  disabled?: boolean;
}

export interface RowActionsMenuProps {
  actions: RowAction[];
}
