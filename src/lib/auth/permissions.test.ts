import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  canUserManageStaff,
  canUserViewCost,
  canUserCancelInvoices,
  canUserViewFinancialDashboard
} from './permissions.ts';

describe('permissions helper', () => {
  describe('canUserManageStaff', () => {
    it('allows OWNER to manage staff', () => {
      assert.equal(canUserManageStaff('OWNER'), true);
    });

    it('forbids MANAGER from managing staff', () => {
      assert.equal(canUserManageStaff('MANAGER'), false);
    });

    it('forbids SALESMAN from managing staff', () => {
      assert.equal(canUserManageStaff('SALESMAN'), false);
    });

    it('handles undefined and invalid roles gracefully', () => {
      assert.equal(canUserManageStaff(undefined), false);
      assert.equal(canUserManageStaff('UNKNOWN'), false);
    });
  });

  describe('canUserViewCost', () => {
    it('allows OWNER to view cost', () => {
      assert.equal(canUserViewCost('OWNER'), true);
    });

    it('allows MANAGER to view cost', () => {
      assert.equal(canUserViewCost('MANAGER'), true);
    });

    it('forbids SALESMAN from viewing cost', () => {
      assert.equal(canUserViewCost('SALESMAN'), false);
    });

    it('forbids undefined or unknown role from viewing cost', () => {
      assert.equal(canUserViewCost(undefined), false);
      assert.equal(canUserViewCost('GUEST'), false);
    });
  });

  describe('canUserCancelInvoices', () => {
    it('allows OWNER and MANAGER to cancel invoices', () => {
      assert.equal(canUserCancelInvoices('OWNER'), true);
      assert.equal(canUserCancelInvoices('MANAGER'), true);
    });

    it('forbids SALESMAN from cancelling invoices', () => {
      assert.equal(canUserCancelInvoices('SALESMAN'), false);
    });

    it('forbids undefined role from cancelling invoices', () => {
      assert.equal(canUserCancelInvoices(undefined), false);
    });

    it('forbids unknown role from cancelling invoices', () => {
      assert.equal(canUserCancelInvoices('RANDOM'), false);
    });
  });

  describe('canUserViewFinancialDashboard', () => {
    it('allows OWNER and MANAGER to view financial dashboard', () => {
      assert.equal(canUserViewFinancialDashboard('OWNER'), true);
      assert.equal(canUserViewFinancialDashboard('MANAGER'), true);
    });

    it('forbids SALESMAN from viewing financial dashboard', () => {
      assert.equal(canUserViewFinancialDashboard('SALESMAN'), false);
    });

    it('forbids undefined role from viewing financial dashboard', () => {
      assert.equal(canUserViewFinancialDashboard(undefined), false);
    });

    it('forbids unknown role from viewing financial dashboard', () => {
      assert.equal(canUserViewFinancialDashboard('ANONYMOUS'), false);
    });
  });
});
