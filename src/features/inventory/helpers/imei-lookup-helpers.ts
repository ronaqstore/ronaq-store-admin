import type { ImeiSaleInfoDto } from '@/lib/api/types';
import type { ProfitDisplayInfo, WarrantyBadgeInfo } from '@/types/inventory';

export function formatPtaStatusLabel(status?: string | null): string {
  if (!status) return 'Not Specified';
  switch (status.toUpperCase()) {
    case 'PTA_APPROVED':
      return 'PTA Approved';
    case 'NON_PTA':
      return 'Non-PTA';
    case 'CPID':
      return 'CPID Approved';
    case 'VIP':
      return 'VIP Approved';
    case 'JV':
      return 'JV (SIM Lock)';
    default:
      return status.replace(/_/g, ' ');
  }
}

export function formatWarrantyBadge(sale?: ImeiSaleInfoDto | null): WarrantyBadgeInfo {
  if (!sale) {
    return {
      label: 'Not Sold',
      variant: 'secondary',
      isActive: false
    };
  }

  if (sale.warrantyType === 'OFFICIAL_WARRANTY') {
    return {
      label: 'Official Brand Warranty',
      variant: 'default',
      detail: 'Brand/Distributor Coverage',
      isActive: true
    };
  }

  if (sale.warrantyType === 'NO_WARRANTY') {
    return {
      label: 'No Warranty',
      variant: 'outline',
      detail: 'Sold as-is with no checking warranty',
      isActive: false
    };
  }

  if (sale.isWarrantyActive) {
    const daysLeft = sale.warrantyDaysLeft ?? 0;
    const daysText = daysLeft === 1 ? '1 day' : `${daysLeft} days`;
    return {
      label: 'Shop Checking Warranty (Active)',
      variant: 'default',
      detail: `${daysText} left · ends ${sale.warrantyEndsAt ?? 'soon'}`,
      isActive: true
    };
  }

  return {
    label: 'Shop Checking Warranty (Expired)',
    variant: 'secondary',
    detail: sale.warrantyEndsAt ? `Expired on ${sale.warrantyEndsAt}` : 'Expired',
    isActive: false
  };
}

export function calculateProfitDisplay(
  unitCost: number,
  salePrice?: number | null
): ProfitDisplayInfo {
  if (salePrice == null || !Number.isFinite(salePrice)) {
    return {
      hasSold: false,
      profitPaisa: 0,
      marginPercent: 0,
      isProfitable: false
    };
  }

  const safeCost = Number.isFinite(unitCost) ? unitCost : 0;
  const profitPaisa = salePrice - safeCost;
  const marginPercent =
    salePrice > 0 ? Math.round(((salePrice - safeCost) / salePrice) * 1000) / 10 : 0;

  return {
    hasSold: true,
    profitPaisa,
    marginPercent,
    isProfitable: profitPaisa >= 0
  };
}
