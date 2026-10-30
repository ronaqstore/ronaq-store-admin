'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { toastSuccessAfterClose } from '@/lib/toast-success';
import { BaseCancelDialog } from '@/components/common/base-cancel-dialog';
import { OverdraftAlert } from '@/components/common/overdraft-alert';
import { formatPkr } from '@/lib/dukaan/numbers';
import { useT } from '@/i18n/use-t';
import type { CancelImpactItem, CancelPurchaseDialogProps, OverdraftPrompt } from '@/types';
import { purchaseCancelImpactQueryOptions } from '../api/queries';
import { cancelPurchaseMutation } from '../api/mutations';
import { invalidateDomains } from '@/lib/query/invalidate-domains';
import { PURCHASE_SYNC_DOMAINS } from '@/lib/query/sync-domains';

export function CancelPurchaseDialog({
  purchase,
  open,
  onOpenChange,
  onSuccess
}: CancelPurchaseDialogProps) {
  const t = useT();
  const qc = useQueryClient();
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [confirmOverdraft, setConfirmOverdraft] = useState(false);
  const [overdraftPrompt, setOverdraftPrompt] = useState<OverdraftPrompt | null>(null);

  const { data: impact, isLoading: impactLoading } = useQuery({
    ...purchaseCancelImpactQueryOptions(purchase.id),
    enabled: open && purchase.status === 'ACTIVE'
  });

  const cancel = useMutation({
    ...cancelPurchaseMutation,
    onSuccess: (res) => {
      if (res && 'confirmOverdraft' in res && res.confirmOverdraft) {
        setOverdraftPrompt({
          shortfall: res.shortfall,
          message: res.message
        });
        setConfirmOverdraft(false);
        toast.warning(
          t('purchases.cancelDialog.overdraftDescription', {
            shortfall: formatPkr(res.shortfall ?? 0)
          })
        );
        return;
      }

      onOpenChange(false);
      invalidateDomains({ queryClient: qc, domains: PURCHASE_SYNC_DOMAINS });
      toastSuccessAfterClose(
        t('purchases.cancelDialog.success', { purchaseNo: purchase.purchaseNo })
      );
      onSuccess?.();
    },
    onError: (err: Error) => {
      toast.error(err.message || t('purchases.cancelDialog.failed'));
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setReasonError(t('purchases.cancelDialog.reasonRequired'));
      return;
    }
    setReasonError('');

    if ((impact?.willCauseOverdraft || !!overdraftPrompt) && !confirmOverdraft) {
      setReasonError(t('purchases.cancelDialog.confirmOverdraftRequired'));
      return;
    }

    cancel.mutate({
      id: purchase.id,
      input: {
        cancelReason: reason.trim(),
        confirmOverdraft: confirmOverdraft ? true : undefined
      }
    });
  };

  const handleReasonChange = (v: string) => {
    setReason(v);
    setReasonError('');
  };

  const impactItems: CancelImpactItem[] = [
    {
      label: t('purchases.cancelDialog.cashReturned'),
      value: `+${formatPkr(impact?.cashReversedAmount ?? 0)}`,
      success: true
    },
    {
      label: t('purchases.cancelDialog.cashDrawerAfter'),
      value: formatPkr(impact?.cashAfter ?? 0)
    }
  ];

  if (impact?.supplierPayableAfter !== null && impact?.supplierPayableAfter !== undefined) {
    impactItems.push({
      label: t('purchases.cancelDialog.supplierPayableAfter'),
      value: formatPkr(impact.supplierPayableAfter)
    });
  }

  const shortfallAmount = formatPkr(
    overdraftPrompt?.shortfall ?? (impact?.cashAfter != null && impact.cashAfter < 0 ? Math.abs(impact.cashAfter) : 0)
  );

  const overdraftSection =
    impact?.willCauseOverdraft || overdraftPrompt ? (
      <OverdraftAlert
        checked={confirmOverdraft}
        onCheckedChange={setConfirmOverdraft}
        title={t('purchases.cancelDialog.overdraftWarning')}
        description={t('purchases.cancelDialog.overdraftDescription', {
          shortfall: shortfallAmount
        })}
        confirmLabel={t('purchases.cancelDialog.confirmOverdraft')}
        id='purchase-confirm-overdraft'
      />
    ) : null;

  return (
    <BaseCancelDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('purchases.cancelDialog.title', { purchaseNo: purchase.purchaseNo })}
      description={t('purchases.cancelDialog.description')}
      isBlocked={impact?.blocked}
      blockedTitle={t('purchases.cancelDialog.cannotCancel')}
      blockedReason={impact?.blockedReason || t('purchases.cancelDialog.defaultBlockedReason')}
      closeLabel={t('purchases.cancelDialog.close')}
      isLoadingImpact={impactLoading}
      loadingImpactText={t('purchases.cancelDialog.calculatingImpact')}
      impactItems={impactItems}
      reason={reason}
      onReasonChange={handleReasonChange}
      reasonError={reasonError}
      reasonLabel={t('purchases.cancelDialog.reasonLabel')}
      reasonPlaceholder={t('purchases.cancelDialog.reasonPlaceholder')}
      reasonId='purchaseCancelReason'
      onSubmit={handleSubmit}
      isSubmitting={cancel.isPending}
      cancelButtonText={t('purchases.cancelDialog.cancel')}
      submitButtonText={t('purchases.cancelDialog.confirm')}
      overdraftAlert={overdraftSection}
    />
  );
}
