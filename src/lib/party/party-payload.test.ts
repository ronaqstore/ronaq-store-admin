import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildPartyPayload } from './party-payload.ts';
import type { BasePartyFormState } from '@/types';

const baseForm: BasePartyFormState = {
  name: 'Ali Raza',
  phone: '03001234567',
  cnic: '17301-1234567-1',
  address: 'Hall Road, Lahore',
  notes: 'VIP customer',
  opening_balance: 50000
};

describe('buildPartyPayload', () => {
  describe('create mode', () => {
    it('omits empty optional fields as undefined', () => {
      const payload = buildPartyPayload(
        {
          name: 'Ali Raza',
          phone: '',
          address: '   ',
          notes: '',
          opening_balance: ''
        },
        'create'
      );

      assert.equal(payload.name, 'Ali Raza');
      assert.equal(payload.phone, undefined);
      assert.equal(payload.address, undefined);
      assert.equal(payload.notes, undefined);
      assert.equal(payload.cnic, undefined);
      assert.equal(payload.openingBalance, 0);
      assert.equal(payload.isActive, true);
    });

    it('keeps trimmed non-empty fields and excludes cnic when showCnic is false', () => {
      const payload = buildPartyPayload(baseForm, 'create', false);

      assert.equal(payload.name, 'Ali Raza');
      assert.equal(payload.phone, '03001234567');
      assert.equal(payload.address, 'Hall Road, Lahore');
      assert.equal(payload.notes, 'VIP customer');
      assert.equal(payload.cnic, undefined);
      assert.equal(payload.openingBalance, 5000000);
      assert.equal(payload.isActive, true);
    });

    it('includes trimmed cnic when showCnic is true', () => {
      const payload = buildPartyPayload(baseForm, 'create', true);

      assert.equal(payload.cnic, '17301-1234567-1');
    });
  });

  describe('edit mode', () => {
    it('converts emptied optional fields to null', () => {
      const payload = buildPartyPayload(
        {
          name: 'Ali Raza Updated',
          phone: '',
          cnic: '   ',
          address: '',
          notes: '',
          opening_balance: 1000
        },
        'edit',
        true
      );

      assert.equal(payload.name, 'Ali Raza Updated');
      assert.equal(payload.phone, null);
      assert.equal(payload.cnic, null);
      assert.equal(payload.address, null);
      assert.equal(payload.notes, null);
      assert.equal(payload.openingBalance, 100000);
      assert.equal(payload.isActive, true);
    });

    it('preserves non-empty fields while clearing only specified emptied fields', () => {
      const payload = buildPartyPayload(
        {
          name: 'Ali Raza',
          phone: null as unknown as string,
          address: 'New Address, Lahore',
          notes: '',
          opening_balance: 500
        },
        'edit',
        false
      );

      assert.equal(payload.name, 'Ali Raza');
      assert.equal(payload.phone, null);
      assert.equal(payload.address, 'New Address, Lahore');
      assert.equal(payload.notes, null);
      assert.equal(payload.cnic, undefined);
    });

    it('omits openingBalance on edit when unchanged from original', () => {
      const payload = buildPartyPayload(baseForm, 'edit', false, 5000000);

      assert.equal(payload.openingBalance, undefined);
    });
  });
});
