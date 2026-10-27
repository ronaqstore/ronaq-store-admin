import { toPaisa } from '@/lib/dukaan/numbers';
import type { BasePartyFormState, BasePartyPayload, PartyPayloadMode } from '@/types';

export function buildPartyPayload(
  value: BasePartyFormState,
  mode: PartyPayloadMode = 'create',
  showCnic = false
): BasePartyPayload {
  const isEdit = mode === 'edit';
  const cleanString = (val?: string | null) => {
    const trimmed = val?.trim();
    if (trimmed) return trimmed;
    return isEdit ? null : undefined;
  };

  return {
    name: value.name.trim(),
    phone: cleanString(value.phone),
    ...(showCnic ? { cnic: cleanString(value.cnic) } : {}),
    address: cleanString(value.address),
    notes: cleanString(value.notes),
    openingBalance: toPaisa(Number(value.opening_balance || 0)),
    isActive: true
  };
}
