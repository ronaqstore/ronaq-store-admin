import type { ApiError } from '@/lib/api/types';
import type { MappedPartyApiError, PartyErrorTranslator } from '@/types/party';

const PHONE_ALREADY_TAKEN = 'PHONE_ALREADY_TAKEN';
const SUPPLIER_CNIC_DUPLICATE = 'SUPPLIER_CNIC_DUPLICATE';

export function mapPartyApiError(
  error: ApiError,
  t: PartyErrorTranslator
): MappedPartyApiError {
  const code = error.details?.code;
  const raw = Array.isArray(error.details?.message)
    ? error.details.message.join(' ')
    : error.message;

  if (code === PHONE_ALREADY_TAKEN) {
    return { field: 'phone', message: t('validation.phoneAlreadyTaken') };
  }
  if (code === SUPPLIER_CNIC_DUPLICATE) {
    return { field: 'cnic', message: t('validation.cnicAlreadyTaken') };
  }

  const lower = raw.toLowerCase();
  if (
    lower.includes('already in use') ||
    lower.includes('already used') ||
    lower.includes('already has a ronaq store account')
  ) {
    return { field: 'phone', message: t('validation.phoneAlreadyTaken') };
  }
  if (
    lower.includes('already uses this cnic') ||
    (lower.includes('cnic') && lower.includes('already exists'))
  ) {
    return { field: 'cnic', message: t('validation.cnicAlreadyTaken') };
  }
  if (lower.includes('pakistani mobile') || lower.includes('03xxxxxxxx')) {
    return { field: 'phone', message: t('validation.phoneInvalidPk') };
  }
  if (lower.includes('cnic') && (lower.includes('valid') || lower.includes('area code'))) {
    return { field: 'cnic', message: t('validation.cnicInvalid') };
  }

  return { message: error.message };
}
