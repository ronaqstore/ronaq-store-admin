import { toast } from 'sonner';

export function toastSuccessAfterClose(message: string, close?: () => void): void {
  close?.();
  window.setTimeout(() => {
    toast.success(message);
  }, 0);
}
