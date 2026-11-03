'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { useT } from '@/i18n/use-t';
import { CameraBarcodeScannerDialog } from '@/components/barcode/camera-barcode-scanner-dialog';
import { resolveScan } from '@/features/inventory/api/service';
import type { ResponseResolveScanDto } from '@/lib/api/types';

export interface SaleScanBarProps {
  onItemResolved: (result: ResponseResolveScanDto) => void;
  className?: string;
  placeholder?: string;
}

export function SaleScanBar({ onItemResolved, className, placeholder }: SaleScanBarProps) {
  const t = useT();
  const [query, setQuery] = React.useState('');
  const [isScanning, setIsScanning] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleProcessCode = async (rawCode: string) => {
    const code = rawCode.trim();
    if (!code) return;

    setIsLoading(true);
    try {
      const result = await resolveScan(code);
      if (result.found) {
        onItemResolved(result);
        setQuery('');
      } else {
        if (result.reason === 'NOT_IN_STOCK') {
          toast.warning(result.message || t('scanner.unitNotFoundInStock', { imei: code }));
        } else if (result.reason === 'INACTIVE') {
          toast.warning(result.message || t('dukaan.product.inactiveDescription'));
        } else {
          toast.error(result.message || t('scanner.itemNotFound'));
        }
      }
    } catch {
      toast.error(t('scanner.scanFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void handleProcessCode(query);
    }
  };

  return (
    <>
      <div className={`relative flex items-center gap-1.5 ${className ?? ''}`}>
        <div className='relative flex-1'>
          <Icons.scan className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder={placeholder ?? t('scanner.universalScanPlaceholder')}
            className='ps-9 pe-9 h-10 font-mono text-sm'
          />
          {isLoading && (
            <Icons.spinner className='absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary' />
          )}
        </div>

        <Button
          type='button'
          variant='secondary'
          size='icon'
          disabled={isLoading}
          onClick={() => setIsScanning(true)}
          title={t('scanner.scanWithCamera')}
          className='h-10 w-10 shrink-0 border'
        >
          <Icons.camera className='h-4 w-4' />
        </Button>
      </div>

      <CameraBarcodeScannerDialog
        open={isScanning}
        onOpenChange={setIsScanning}
        mode='barcode'
        title={t('scanner.scanToSellTitle')}
        description={t('scanner.scanToSellDesc')}
        onScan={(scanned) => void handleProcessCode(scanned)}
      />
    </>
  );
}
