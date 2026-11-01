import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createConsignmentFormSchema,
  returnConsignmentFormSchema,
  settleConsignmentFormSchema,
  cancelConsignmentFormSchema
} from './consignment-schema';

const mockTranslator = ((key: string) => key) as unknown as Parameters<
  typeof createConsignmentFormSchema
>[0];

describe('consignment-schema', () => {
  describe('createConsignmentFormSchema', () => {
    it('accepts valid consignment intake data', () => {
      const schema = createConsignmentFormSchema(mockTranslator);
      const res = schema.safeParse({
        consignorName: 'Muhammad Ali',
        consignorPhone: '03001234567',
        consignorCnic: '17301-1234567-1',
        productId: '01924f0a-0000-7000-8000-000000000001',
        imei1: '356938035643803',
        imei2: '356938035643804',
        condition: 'USED',
        batteryHealth: 88,
        agreedPayoutRupees: 50000,
        targetSellingPriceRupees: 55000,
        intakeDate: '2026-11-01',
        defectNotes: 'Minor scratch'
      });
      assert.equal(res.success, true);
    });

    it('rejects invalid Pakistani phone number', () => {
      const schema = createConsignmentFormSchema(mockTranslator);
      const res = schema.safeParse({
        consignorName: 'Muhammad Ali',
        consignorPhone: '12345',
        productId: '01924f0a-0000-7000-8000-000000000001',
        imei1: '356938035643803',
        condition: 'USED',
        agreedPayoutRupees: 50000,
        intakeDate: '2026-11-01'
      });
      assert.equal(res.success, false);
      if (!res.success) {
        assert.ok(res.error.issues.some((i) => i.path.includes('consignorPhone')));
      }
    });

    it('rejects invalid IMEI1 format', () => {
      const schema = createConsignmentFormSchema(mockTranslator);
      const res = schema.safeParse({
        consignorName: 'Muhammad Ali',
        consignorPhone: '03001234567',
        productId: '01924f0a-0000-7000-8000-000000000001',
        imei1: '12345abc',
        condition: 'USED',
        agreedPayoutRupees: 50000,
        intakeDate: '2026-11-01'
      });
      assert.equal(res.success, false);
      if (!res.success) {
        assert.ok(res.error.issues.some((i) => i.path.includes('imei1')));
      }
    });

    it('rejects identical IMEI1 and IMEI2', () => {
      const schema = createConsignmentFormSchema(mockTranslator);
      const res = schema.safeParse({
        consignorName: 'Muhammad Ali',
        consignorPhone: '03001234567',
        productId: '01924f0a-0000-7000-8000-000000000001',
        imei1: '356938035643803',
        imei2: '356938035643803',
        condition: 'USED',
        agreedPayoutRupees: 50000,
        intakeDate: '2026-11-01'
      });
      assert.equal(res.success, false);
      if (!res.success) {
        assert.ok(res.error.issues.some((i) => i.path.includes('imei2')));
      }
    });

    it('rejects target selling price less than agreed payout', () => {
      const schema = createConsignmentFormSchema(mockTranslator);
      const res = schema.safeParse({
        consignorName: 'Muhammad Ali',
        consignorPhone: '03001234567',
        productId: '01924f0a-0000-7000-8000-000000000001',
        imei1: '356938035643803',
        condition: 'USED',
        agreedPayoutRupees: 50000,
        targetSellingPriceRupees: 45000,
        intakeDate: '2026-11-01'
      });
      assert.equal(res.success, false);
      if (!res.success) {
        assert.ok(res.error.issues.some((i) => i.path.includes('targetSellingPriceRupees')));
      }
    });

    it('rejects non-positive agreed payout', () => {
      const schema = createConsignmentFormSchema(mockTranslator);
      const res = schema.safeParse({
        consignorName: 'Muhammad Ali',
        consignorPhone: '03001234567',
        productId: '01924f0a-0000-7000-8000-000000000001',
        imei1: '356938035643803',
        condition: 'USED',
        agreedPayoutRupees: 0,
        intakeDate: '2026-11-01'
      });
      assert.equal(res.success, false);
    });
  });

  describe('settleConsignmentFormSchema', () => {
    it('accepts valid settlement data', () => {
      const schema = settleConsignmentFormSchema(mockTranslator);
      const res = schema.safeParse({
        settledAmountRupees: 50000,
        payoutMethod: 'CASH',
        notes: 'Paid in full cash'
      });
      assert.equal(res.success, true);
    });

    it('rejects non-positive settlement amount', () => {
      const schema = settleConsignmentFormSchema(mockTranslator);
      const res = schema.safeParse({
        settledAmountRupees: -100,
        payoutMethod: 'CASH'
      });
      assert.equal(res.success, false);
    });
  });

  describe('returnConsignmentFormSchema', () => {
    it('requires a return reason', () => {
      const schema = returnConsignmentFormSchema(mockTranslator);
      assert.equal(schema.safeParse({ returnReason: '' }).success, false);
      assert.equal(schema.safeParse({ returnReason: 'Owner requested phone back' }).success, true);
    });
  });

  describe('cancelConsignmentFormSchema', () => {
    it('requires a cancel reason', () => {
      const schema = cancelConsignmentFormSchema(mockTranslator);
      assert.equal(schema.safeParse({ cancelReason: '' }).success, false);
      assert.equal(schema.safeParse({ cancelReason: 'Entered by mistake' }).success, true);
    });
  });
});
