'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { useT } from '@/i18n/use-t';
import { CameraBarcodeScannerDialog } from './camera-barcode-scanner-dialog';
import type { ImeiCameraScanButtonProps } from '@/types/barcode';

export function ImeiCameraScanButton({
  onScan,
  mode = 'imei',
  title,
  className,
  disabled
}: ImeiCameraScanButtonProps) {
  const t = useT();
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button
        type='button'
        variant='outline'
        size='icon'
        className={className}
        disabled={disabled}
        onClick={() => setOpen(true)}
        title={title ?? t('scanner.scanWithCamera')}
        aria-label={title ?? t('scanner.scanWithCamera')}
      >
        <Icons.camera className='h-4 w-4 text-muted-foreground hover:text-foreground' />
      </Button>

      <CameraBarcodeScannerDialog
        open={open}
        onOpenChange={setOpen}
        onScan={onScan}
        mode={mode}
        title={title}
      />
    </>
  );
}
