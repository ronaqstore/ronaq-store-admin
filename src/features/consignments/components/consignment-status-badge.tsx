'use client';

import { StatusBadge, type StatusTone } from '@/components/data-table';
import { useT } from '@/i18n/use-t';
import type { ConsignmentStatus } from '@/lib/api/types';

interface ConsignmentStatusBadgeProps {
  status: ConsignmentStatus;
}

export function ConsignmentStatusBadge({ status }: ConsignmentStatusBadgeProps) {
  const t = useT();

  const config: Record<ConsignmentStatus, { tone: StatusTone; label: string }> = {
    IN_CUSTODY: {
      tone: 'warning',
      label: t('consignments.statusInCustody')
    },
    SOLD: {
      tone: 'neutral',
      label: t('consignments.statusSold')
    },
    SETTLED: {
      tone: 'success',
      label: t('consignments.statusSettled')
    },
    RETURNED_TO_OWNER: {
      tone: 'neutral',
      label: t('consignments.statusReturned')
    },
    CANCELLED: {
      tone: 'danger',
      label: t('consignments.statusCancelled')
    }
  };

  const item = config[status] ?? { tone: 'neutral', label: status };

  return <StatusBadge status={status} tone={item.tone} label={item.label} />;
}
