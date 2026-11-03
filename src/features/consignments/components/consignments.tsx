'use client';

import { useState } from 'react';
import { FloatingActionButton } from '@/components/common/floating-action-button';
import { TablePageBody } from '@/components/layout/table-page-body';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n/use-t';
import type { ConsignmentDTO } from '@/lib/api/types';
import type {
  ConsignmentsHeaderActionProps,
  ConsignmentsListClientProps
} from '@/types/consignments';
import { ConsignmentsTable } from './consignments-table';
import { ConsignmentIntakeDialog } from './consignment-intake-dialog';
import { ConsignmentSlipDialog } from './consignment-slip-dialog';

export function ConsignmentsHeaderAction({ className, onAdd }: ConsignmentsHeaderActionProps) {
  const t = useT();
  return (
    <Button
      type='button'
      className={cn('h-8 gap-1.5 text-xs hidden lg:inline-flex', className)}
      onClick={onAdd}
    >
      <Icons.add className='h-4 w-4' />
      {t('consignments.newConsignment')}
    </Button>
  );
}

export function ConsignmentsListClient({ defaultOpenAdd = false }: ConsignmentsListClientProps) {
  const t = useT();
  const [intakeOpen, setIntakeOpen] = useState(defaultOpenAdd);
  const [createdSlip, setCreatedSlip] = useState<ConsignmentDTO | null>(null);

  return (
    <TablePageBody>
      <ConsignmentsTable
        toolbarAction={
          <ConsignmentsHeaderAction className='h-8' onAdd={() => setIntakeOpen(true)} />
        }
      />
      <FloatingActionButton
        label={t('consignments.newConsignment')}
        onClick={() => setIntakeOpen(true)}
      />

      {intakeOpen && (
        <ConsignmentIntakeDialog
          open={intakeOpen}
          onOpenChange={setIntakeOpen}
          onSuccess={(created) => {
            setCreatedSlip(created);
          }}
        />
      )}

      {createdSlip && (
        <ConsignmentSlipDialog
          consignment={createdSlip}
          type='intake'
          open={!!createdSlip}
          onOpenChange={(open) => {
            if (!open) setCreatedSlip(null);
          }}
        />
      )}
    </TablePageBody>
  );
}
