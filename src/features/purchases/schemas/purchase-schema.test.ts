import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createPurchaseFormSchema } from './purchase-schema.ts';

type Translator = Parameters<typeof createPurchaseFormSchema>[0];
const t = ((key: string) => key) as unknown as Translator;
const schema = createPurchaseFormSchema(t);

describe('createPurchaseFormSchema — IMEI rules', () => {
  const baseSerializedLine = {
    product_id: 'prod-phone-1',
    quantity: 1,
    unit_cost: 50000,
    tracking_type: 'SERIALIZED' as const,
    condition: 'NEW' as const,
    phone_units: [
      {
        imei1: '123456789012345',
        imei2: '',
        condition: 'NEW' as const
      }
    ]
  };

  it('allows purchase with empty imei2', () => {
    const result = schema.safeParse({
      supplier_id: 'supp-1',
      supplier_invoice_ref: '',
      is_opening_stock: false,
      paid_now: 50000,
      lines: [baseSerializedLine]
    });

    assert.equal(result.success, true);
  });

  it('allows purchase with valid distinct imei2', () => {
    const result = schema.safeParse({
      supplier_id: 'supp-1',
      supplier_invoice_ref: '',
      is_opening_stock: false,
      paid_now: 50000,
      lines: [
        {
          ...baseSerializedLine,
          phone_units: [
            {
              imei1: '123456789012345',
              imei2: '123456789012346',
              condition: 'NEW' as const
            }
          ]
        }
      ]
    });

    assert.equal(result.success, true);
  });

  it('rejects purchase when imei2 has invalid format (not 15 digits)', () => {
    const result = schema.safeParse({
      supplier_id: 'supp-1',
      supplier_invoice_ref: '',
      is_opening_stock: false,
      paid_now: 50000,
      lines: [
        {
          ...baseSerializedLine,
          phone_units: [
            {
              imei1: '123456789012345',
              imei2: '12345',
              condition: 'NEW' as const
            }
          ]
        }
      ]
    });

    assert.equal(result.success, false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes('imei2'));
      assert.ok(issue);
      assert.equal(issue.message, 'validation.imeiInvalidFormat');
    }
  });

  it('rejects purchase when imei2 equals imei1', () => {
    const result = schema.safeParse({
      supplier_id: 'supp-1',
      supplier_invoice_ref: '',
      is_opening_stock: false,
      paid_now: 50000,
      lines: [
        {
          ...baseSerializedLine,
          phone_units: [
            {
              imei1: '123456789012345',
              imei2: '123456789012345',
              condition: 'NEW' as const
            }
          ]
        }
      ]
    });

    assert.equal(result.success, false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes('imei2'));
      assert.ok(issue);
      assert.equal(issue.message, 'validation.imeiPairMustDiffer');
    }
  });

  it('rejects purchase when imei1 is empty', () => {
    const result = schema.safeParse({
      supplier_id: 'supp-1',
      supplier_invoice_ref: '',
      is_opening_stock: false,
      paid_now: 50000,
      lines: [
        {
          ...baseSerializedLine,
          phone_units: [
            {
              imei1: '',
              imei2: '',
              condition: 'NEW' as const
            }
          ]
        }
      ]
    });

    assert.equal(result.success, false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes('imei1'));
      assert.ok(issue);
      assert.equal(issue.message, 'validation.imeiRequired');
    }
  });
});
