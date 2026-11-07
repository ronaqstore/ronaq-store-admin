import type { SessionRole } from '@/lib/dukaan/types';

export function canUserManageStaff(role?: SessionRole | string): boolean {
  return role === 'OWNER';
}

export function canUserViewCost(role?: SessionRole | string): boolean {
  if (!role) return false;
  return role === 'OWNER' || role === 'MANAGER';
}

export function canUserCancelInvoices(role?: SessionRole | string): boolean {
  if (!role) return false;
  return role === 'OWNER' || role === 'MANAGER';
}

export function canUserViewFinancialDashboard(role?: SessionRole | string): boolean {
  if (!role) return false;
  return role === 'OWNER' || role === 'MANAGER';
}
