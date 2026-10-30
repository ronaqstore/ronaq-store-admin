import type { InventoryUnitDTO } from '@/lib/api/types';
import type { SerializedUnitsFilterOptions } from '@/types/inventory';

export function filterSerializedUnits(
  units: InventoryUnitDTO[],
  opts: SerializedUnitsFilterOptions
): InventoryUnitDTO[] {
  const minBattery = opts.batteryMin.trim() ? Number(opts.batteryMin) : null;
  return units.filter((unit) => {
    if (opts.statusFilter === 'IN_STOCK' && unit.status !== 'IN_STOCK') return false;
    if (opts.statusFilter === 'SOLD' && unit.status !== 'SOLD') return false;
    if (
      opts.statusFilter === 'DAMAGED_LOST' &&
      unit.status !== 'DAMAGED' &&
      unit.status !== 'LOST'
    ) {
      return false;
    }
    if (opts.conditionFilter !== 'ALL' && unit.condition !== opts.conditionFilter) return false;
    if (
      minBattery != null &&
      !Number.isNaN(minBattery) &&
      (unit.batteryHealth == null || unit.batteryHealth < minBattery)
    ) {
      return false;
    }
    if (!opts.search.trim()) return true;
    const query = opts.search.trim().toLowerCase();
    return (
      unit.imei1.toLowerCase().includes(query) ||
      (unit.imei2?.toLowerCase().includes(query) ?? false) ||
      (unit.supplierName?.toLowerCase().includes(query) ?? false) ||
      (unit.customerName?.toLowerCase().includes(query) ?? false) ||
      (unit.purchaseNo?.toLowerCase().includes(query) ?? false) ||
      (unit.saleNo?.toLowerCase().includes(query) ?? false)
    );
  });
}

export function averageSerializedUnitCost(
  inStockUnits: InventoryUnitDTO[],
  units: InventoryUnitDTO[],
  totalStockValue: number
): number {
  if (inStockUnits.length > 0) return Math.round(totalStockValue / inStockUnits.length);
  if (units.length > 0) {
    const sum = units.reduce((acc, u) => acc + (u.unitCost ?? 0), 0);
    return Math.round(sum / units.length);
  }
  return 0;
}
