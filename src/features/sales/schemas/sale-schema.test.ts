import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createSaleFormSchema } from './sale-schema.ts';

type Translator = Parameters<typeof createSaleFormSchema>[0];
const t = ((key: string) => key) as unknown as Translator;
const schema = createSaleFormSchema(t);

describe('createSaleFormSchema', () => {
  const baseLinePhone = {
    product_id: 'prod-1',
    quantity: 1,
    unit_price: 50000,
    inventory_unit_id: 'unit-1',
    tracking_type: 'SERIALIZED' as const,
    unit_condition: 'NEW' as const
  };

  const baseLineAccessory = {
    product_id: 'prod-2',
    quantity: 2,
    unit_price: 1500,
    tracking_type: 'QUANTITY' as const
  };

  it('allows walk-in customer for full-cash phone sale', () => {
    const result = schema.safeParse({
      customer_id: '__walkin__',
      discount: 0,
      paid_now: 50000,
      notes: '',
      lines: [baseLinePhone]
    });

    assert.equal(result.success, true);
  });

  it('allows walk-in customer for full-cash accessory sale', () => {
    const result = schema.safeParse({
      customer_id: '__walkin__',
      discount: 0,
      paid_now: 3000,
      notes: '',
      lines: [baseLineAccessory]
    });

    assert.equal(result.success, true);
  });

  it('rejects walk-in phone sale when paid_now is less than total (Udhar)', () => {
    const result = schema.safeParse({
      customer_id: '__walkin__',
      discount: 0,
      paid_now: 20000,
      notes: '',
      lines: [baseLinePhone]
    });

    assert.equal(result.success, false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes('customer_id'));
      assert.ok(issue);
      assert.equal(issue.message, 'validation.customerForUdhar');
    }
  });

  it('rejects walk-in phone sale when paid_now is 0 (full Udhar)', () => {
    const result = schema.safeParse({
      customer_id: '__walkin__',
      discount: 0,
      paid_now: 0,
      notes: '',
      lines: [baseLinePhone]
    });

    assert.equal(result.success, false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes('customer_id'));
      assert.ok(issue);
      assert.equal(issue.message, 'validation.customerForUdhar');
    }
  });

  it('allows phone sale with Udhar when customer is selected', () => {
    const result = schema.safeParse({
      customer_id: 'cust-uuid-1',
      discount: 0,
      paid_now: 20000,
      notes: '',
      lines: [baseLinePhone]
    });

    assert.equal(result.success, true);
  });

  it('rejects discount exceeding subtotal', () => {
    const result = schema.safeParse({
      customer_id: 'cust-uuid-1',
      discount: 60000,
      paid_now: 0,
      notes: '',
      lines: [baseLinePhone]
    });

    assert.equal(result.success, false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes('discount'));
      assert.ok(issue);
      assert.equal(issue.message, 'validation.discountExceedsSubtotal');
    }
  });

  it('rejects paid_now exceeding total', () => {
    const result = schema.safeParse({
      customer_id: '__walkin__',
      discount: 0,
      paid_now: 60000,
      notes: '',
      lines: [baseLinePhone]
    });

    assert.equal(result.success, false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes('paid_now'));
      assert.ok(issue);
      assert.equal(issue.message, 'validation.paidExceedsTotal');
    }
  });
});
