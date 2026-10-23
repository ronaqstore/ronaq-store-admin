export { customerAsyncFilter } from '@/components/common/customer-filter';
export {
  firstFilterValue as firstSaleFilterValue,
  MONEY_RANGE_RUPEES as SALE_MONEY_RANGE_RUPEES,
  parseRupeeMoneyRange,
  timestampToYmd
} from '@/lib/dukaan/money-range-filter';
import { firstFilterValue } from '@/lib/dukaan/money-range-filter';

export function parseSalePayStatus(
  value: unknown
): 'PAID' | 'PARTIAL' | 'UDHAR' | 'CANCELLED' | undefined {
  const raw = firstFilterValue(value);
  if (raw === 'PAID' || raw === 'PARTIAL' || raw === 'UDHAR' || raw === 'CANCELLED') {
    return raw;
  }
  return undefined;
}
