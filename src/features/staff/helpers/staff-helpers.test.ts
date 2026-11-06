import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  canUserCancelInvoices,
  canUserManageStaff,
  canUserViewCost,
  getRoleBadgeVariant,
  getRoleLabel,
  getStatusBadgeVariant
} from './staff-helpers.ts';

describe('staff-helpers', () => {
  describe('Happy Path', () => {
    it('correctly maps roles, badge variants, and checks permissions for authorized roles', () => {
      assert.equal(getRoleLabel('OWNER'), 'Owner');
      assert.equal(getRoleLabel('MANAGER'), 'Manager');
      assert.equal(getRoleLabel('SALESMAN'), 'Salesman');

      assert.equal(getRoleBadgeVariant('OWNER'), 'default');
      assert.equal(getRoleBadgeVariant('MANAGER'), 'secondary');
      assert.equal(getRoleBadgeVariant('SALESMAN'), 'outline');

      assert.equal(getStatusBadgeVariant('ACTIVE'), 'default');
      assert.equal(getStatusBadgeVariant('SUSPENDED'), 'destructive');

      assert.equal(canUserManageStaff('OWNER'), true);
      assert.equal(canUserManageStaff('MANAGER'), false);

      assert.equal(canUserViewCost('OWNER'), true);
      assert.equal(canUserViewCost('MANAGER'), true);

      assert.equal(canUserCancelInvoices('OWNER'), true);
      assert.equal(canUserCancelInvoices('MANAGER'), true);
    });
  });

  describe('Negative 1: handles undefined, null, and empty string role inputs gracefully', () => {
    it('returns safe fallback defaults for missing or empty roles', () => {
      assert.equal(getRoleLabel(''), 'Staff');
      assert.equal(getRoleBadgeVariant(''), 'outline');
      assert.equal(getStatusBadgeVariant(''), 'outline');

      assert.equal(canUserManageStaff(undefined), false);
      assert.equal(canUserViewCost(undefined), false);
      assert.equal(canUserCancelInvoices(undefined), false);
    });
  });

  describe('Negative 2: strictly blocks SALESMAN from sensitive owner permissions', () => {
    it('ensures counter salesman cannot manage staff, view costs, or cancel invoices', () => {
      assert.equal(canUserManageStaff('SALESMAN'), false);
      assert.equal(canUserViewCost('SALESMAN'), false);
      assert.equal(canUserCancelInvoices('SALESMAN'), false);
    });
  });

  describe('Negative 3: treats unknown or rogue roles as unprivileged', () => {
    it('ensures unexpected roles are not granted cost or cancellation access', () => {
      assert.equal(canUserManageStaff('GUEST'), false);
      assert.equal(canUserViewCost('INTERN'), false);
      assert.equal(canUserCancelInvoices('HACKER'), false);
      assert.equal(getRoleLabel('CUSTOM_ROLE'), 'CUSTOM_ROLE');
    });
  });
});
