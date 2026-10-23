export { supplierAsyncFilter } from '@/components/common/supplier-filter';
export {
  firstFilterValue as firstPurchaseFilterValue,
  MONEY_RANGE_RUPEES as PURCHASE_MONEY_RANGE_RUPEES,
  parseRupeeMoneyRange
} from '@/lib/dukaan/money-range-filter';
import { firstFilterValue } from '@/lib/dukaan/money-range-filter';

export function parsePurchasePayStatus(
  value: unknown
): 'PAID' | 'PARTIAL' | 'PAYABLE' | 'CANCELLED' | undefined {
  const raw = firstFilterValue(value);
  if (raw === 'PAID' || raw === 'PARTIAL' || raw === 'PAYABLE' || raw === 'CANCELLED') {
    return raw;
  }
  return undefined;
}
