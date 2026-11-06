import type { UserRole, UserStatus } from '@/lib/api/types';
export { canUserManageStaff, canUserViewCost, canUserCancelInvoices } from '@/lib/auth/permissions';

export function getRoleLabel(role: UserRole | string): string {
  switch (role) {
    case 'OWNER':
      return 'Owner';
    case 'MANAGER':
      return 'Manager';
    case 'SALESMAN':
      return 'Salesman';
    default:
      return role || 'Staff';
  }
}

export function getRoleBadgeVariant(role: UserRole | string): 'default' | 'secondary' | 'outline' {
  switch (role) {
    case 'OWNER':
      return 'default';
    case 'MANAGER':
      return 'secondary';
    case 'SALESMAN':
      return 'outline';
    default:
      return 'outline';
  }
}

export function getStatusBadgeVariant(
  status: UserStatus | string
): 'default' | 'destructive' | 'outline' {
  switch (status) {
    case 'ACTIVE':
      return 'default';
    case 'SUSPENDED':
      return 'destructive';
    default:
      return 'outline';
  }
}
